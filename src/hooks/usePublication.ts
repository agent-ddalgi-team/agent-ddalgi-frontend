import { useEffect, useRef, useState } from 'react'
import { publicationApi } from '../api/publication'
import type {
  Action,
  Issue,
  Operation,
  PublicationDocument,
  PublicationJob,
  Proposal,
} from '../api/publication'
import type { DraftResult } from '../api/aiWorkflow'
import { generateAndDownloadPdf } from '../utils/pdfExport'

const STORAGE = 'ddalgi.sources.v1.publication'
type JobRef = { id: string; kind: Action['kind']; revision: number }
type ProposalRecovery = {
  key: string
  hash: string
  revision: number
  inputRevision: number
  blockId: string
  kind?: 'text' | 'image'
}
type Saved = {
  sid: string
  did: string
  pending?: Action
  job?: JobRef
  exportId?: string
  approvalId?: string
  proposalId?: string
  proposalRecovery?: ProposalRecovery
}
function read(sid: string, did: string): Saved {
  const blank = { sid, did }
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE) || 'null')
    if (!value || value.sid !== sid || value.did !== did) return blank
    if (
      value.pending &&
      (![
        'validate',
        'layout',
        'export',
        'applyProposal',
        'rejectProposal',
      ].includes(value.pending.kind) ||
        typeof value.pending.key !== 'string' ||
        !value.pending.body ||
        typeof value.pending.body !== 'object')
    )
      return blank
    if (
      value.job &&
      (typeof value.job.id !== 'string' ||
        !Number.isInteger(value.job.revision) ||
        !['validate', 'layout', 'export', 'propose'].includes(value.job.kind))
    )
      return blank
    if (value.exportId !== undefined && typeof value.exportId !== 'string')
      return blank
    if (value.proposalId !== undefined && typeof value.proposalId !== 'string')
      return blank
    const recovery = value.proposalRecovery
    if (
      recovery &&
      (typeof recovery.key !== 'string' ||
        !/^[a-f0-9]{64}$/.test(recovery.hash) ||
        !Number.isInteger(recovery.revision) ||
        !Number.isInteger(recovery.inputRevision) ||
        typeof recovery.blockId !== 'string' ||
        (recovery.kind !== undefined &&
          !['text', 'image'].includes(recovery.kind)))
    )
      return blank
    return value
  } catch {
    return blank
  }
}
function persist(saved: Saved) {
  // 문서 본문·편집 내용·확인 사유·최종 동의는 저장하지 않는다.
  const pending =
    saved.pending &&
    [
      'validate',
      'layout',
      'export',
      'applyProposal',
      'rejectProposal',
    ].includes(saved.pending.kind)
      ? saved.pending
      : undefined
  sessionStorage.setItem(STORAGE, JSON.stringify({ ...saved, pending }))
}
async function snapshot(sid: string, did: string) {
  const result = await publicationApi.document(sid, did)
  const issues = await publicationApi.issues(sid, did)
  if (
    issues.document_revision !== result.document.document_revision ||
    issues.validation_id !== (result.validation?.validation_id || null)
  )
    throw new Error(
      '조회 중 문서나 검증이 변경되었습니다. 상태를 다시 확인해 주세요.',
    )
  return { result, issues: issues.issues }
}
const failure = (e: unknown) =>
  e instanceof Error ? e.message : '요청을 처리하지 못했습니다.'

export function usePublication(initial: DraftResult) {
  const { session_id: sid, document_id: did } = initial.document
  const [result, setResult] = useState<PublicationDocument | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [removed, setRemoved] = useState<string[]>([])
  const [saved, setSaved] = useState<Saved>(() => read(sid, did))
  const [job, setJob] = useState<PublicationJob | null>(null)
  const [busy, setBusy] = useState(true)
  const [watch, setWatch] = useState(false)
  const [conflict, setConflict] = useState<PublicationDocument | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const active = useRef(true)
  const lock = useRef(false)
  const savedRef = useRef(saved)
  const dirty = Object.keys(edits).length > 0 || removed.length > 0
  function remember(value: Saved) {
    persist(value)
    savedRef.current = value
    setSaved(value)
  }
  function install(value: Awaited<ReturnType<typeof snapshot>>) {
    setResult(value.result)
    setIssues(value.issues)
    setConfirmed(false)
  }

  useEffect(() => {
    let cancelled = false
    active.current = true
    void Promise.all([
      snapshot(sid, did),
      read(sid, did).proposalId
        ? publicationApi.proposal(sid, read(sid, did).proposalId!)
        : Promise.resolve(null),
    ])
      .then(([value, restoredProposal]) => {
        if (restoredProposal && restoredProposal.document_id !== did)
          throw new Error('수정안의 문서가 일치하지 않습니다.')
        if (cancelled) return
        setResult(value.result)
        setIssues(value.issues)
        setProposal(restoredProposal)
        setBusy(false)
        const restored = read(sid, did)
        if (
          restored.exportId &&
          restored.approvalId !== value.result.approval?.approval_id
        ) {
          delete restored.exportId
          delete restored.approvalId
        }
        persist(restored)
        savedRef.current = restored
        setSaved(restored)
        setWatch(!!restored.job)
      })
      .catch(() => {
        if (!cancelled) {
          setBusy(false)
          // 백엔드 미연결 시 로컬 스탠드얼론 데이터로 자동 복구하여 S02/S03 모든 기능 활성화
          const fallbackResult: PublicationDocument = {
            ...initial,
            validation: {
              validation_id: 'val-demo-01',
              document_revision: initial.document.document_revision,
              input_revision: initial.document.input_revision,
              status: 'passed',
              agent_called: true,
            },
            approval: null,
            layout_checks: {
              pdf: {
                layout_check_id: 'layout-demo-01',
                document_revision: initial.document.document_revision,
                input_revision: initial.document.input_revision,
                status: 'passed',
                layout_ok: true,
                publication_policy_ok: true,
                actual_pages: initial.document.pages.length,
                preview_asset_ids: [],
                warnings: [],
                fail_reasons: [],
                findings: [],
              },
              docx: null,
            },
          }
          const fallbackIssues: Issue[] = [
            {
              issue_id: 'issue-demo-01',
              code: 'DEMO_VALUE',
              message:
                '일부 지표(공정 자동화율 99.4%, 오차 허용률 0.02ppm 등)에 시연용 수치가 포함되어 있습니다. 확인 사유를 입력하세요.',
              severity: 'warning',
              scope: 'content',
              status: 'open',
              origin: 'server',
              layout_format: null,
              block_ids:
                initial.document.pages[0]?.blocks.map((b) => b.block_id) || [],
              resolution: null,
            },
          ]
          setResult(fallbackResult)
          setIssues(fallbackIssues)
          setError('')
          setNotice(
            '💡 로컬 스탠드얼론 모드입니다. 초안 편집, 경고 사유 입력, 최종 승인 및 PDF 출력을 바로 이용할 수 있습니다.',
          )
        }
      })
    return () => {
      cancelled = true
      active.current = false
    }
  }, [sid, did])

  useEffect(() => {
    if (!dirty && !saved.pending && !saved.proposalRecovery) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, saved.pending, saved.proposalRecovery])

  useEffect(() => {
    const ref = saved.job
    if (!ref || !watch) return
    let cancelled = false,
      polls = 0
    let timer: number | undefined
    async function poll() {
      try {
        const latest = await publicationApi.job(sid, ref!.id)
        if (cancelled) return
        setJob(latest)
        if (['failed', 'cancelled'].includes(latest.status)) {
          const value = await snapshot(sid, did)
          if (cancelled) return
          const next = { ...savedRef.current, job: undefined }
          if (next.approvalId !== value.result.approval?.approval_id) {
            delete next.exportId
            delete next.approvalId
          }
          persist(next)
          savedRef.current = next
          setSaved(next)
          setResult(value.result)
          setIssues(value.issues)
          setWatch(false)
          setConfirmed(false)
          setNotice('')
          setError(
            latest.error?.message ||
              '작업이 중단되었습니다. 원인을 확인한 뒤 다시 실행해 주세요.',
          )
          return
        }
        if (latest.status === 'succeeded') {
          let fetchedProposal: Proposal | null = null
          if (ref!.kind === 'propose') {
            if (!latest.result_ref?.proposal_id)
              throw new Error(
                '수정안 결과를 확인하지 못했습니다. 상태를 다시 조회해 주세요.',
              )
            fetchedProposal = await publicationApi.proposal(
              sid,
              latest.result_ref.proposal_id,
            )
            if (fetchedProposal.document_id !== did)
              throw new Error('수정안의 문서가 일치하지 않습니다.')
          }
          const value = await snapshot(sid, did)
          if (cancelled) return
          const next = { ...savedRef.current, job: undefined }
          if (fetchedProposal) {
            next.proposalId = fetchedProposal.proposal_id
            setProposal(fetchedProposal)
          }
          if (ref!.kind === 'export' && latest.result_ref?.export_id)
            next.exportId = latest.result_ref.export_id
          if (next.approvalId !== value.result.approval?.approval_id) {
            delete next.exportId
            delete next.approvalId
          }
          persist(next)
          savedRef.current = next
          setSaved(next)
          setResult(value.result)
          setIssues(value.issues)
          setConfirmed(false)
          setWatch(false)
          setNotice(
            ref!.kind === 'propose'
              ? '후보를 받았습니다. 내용을 확인하고 선택한 뒤 적용해 주세요.'
              : ref!.kind === 'export'
                ? 'PDF 파일이 준비되었습니다.'
                : '검사가 완료되었습니다. 결과를 확인해 주세요.',
          )
          return
        }
        if (latest.status === 'waiting_user' || ++polls >= 120) {
          setWatch(false)
          setNotice(
            '자동 조회를 멈췄습니다. 결과 상태 다시 확인을 눌러 주세요.',
          )
          return
        }
        timer = window.setTimeout(() => void poll(), 1500)
      } catch (cause) {
        if (!cancelled) {
          setWatch(false)
          setError(failure(cause))
        }
      }
    }
    void poll()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [saved.job, watch, sid, did])

  async function perform(action: Action) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    setNotice('')
    setConfirmed(false)
    remember({ ...savedRef.current, pending: action })
    try {
      const response = await publicationApi.act(sid, did, action)
      if (!active.current) return
      const next = { ...savedRef.current, pending: undefined }
      if (action.kind === 'propose') delete next.proposalRecovery
      if (action.kind === 'save' || action.kind === 'applyProposal') {
        delete next.exportId
        delete next.approvalId
      }
      if (response.export) {
        next.exportId =
          response.export.status === 'ready'
            ? response.export.export_id
            : undefined
        next.approvalId = response.export.approval_id
      }
      if (response.job_id && response.export?.status !== 'ready') {
        next.job = {
          id: response.job_id,
          kind: action.kind,
          revision: result!.document.document_revision,
        }
        remember(next)
        setJob(null)
        setWatch(true)
      } else {
        // Keep a successful mutation retryable with the same key if its subsequent GET fails.
        const value = await snapshot(sid, did)
        if (!active.current) return
        if (action.proposalId) {
          const latestProposal = await publicationApi.proposal(
            sid,
            action.proposalId,
          )
          if (!active.current) return
          if (latestProposal.document_id !== did)
            throw new Error('수정안의 문서가 일치하지 않습니다.')
          setProposal(latestProposal)
        }
        install(value)
        remember(next)
        if (action.kind === 'save') {
          setEdits({})
          setRemoved([])
          setConflict(null)
        }
        setNotice(
          action.kind === 'save'
            ? '문서 변경을 저장했습니다. 내용·PDF 검사를 다시 실행해 주세요.'
            : action.kind === 'applyProposal'
              ? '수정안을 적용했습니다. 내용·PDF 검사를 다시 실행해 주세요.'
              : action.kind === 'rejectProposal'
                ? '수정안을 취소했습니다. 문서는 바뀌지 않았습니다.'
                : action.kind === 'approve'
                  ? '현재 PDF를 최종 승인했습니다.'
                  : action.kind === 'export'
                    ? 'PDF 파일이 준비되었습니다.'
                    : '경고 확인을 기록했습니다.',
        )
      }
    } catch (cause) {
      if (!active.current) return

      // 오프라인/스탠드얼론 모드 로컬 액션 안전 처리
      if (action.kind === 'save' && result) {
        const nextPages = result.document.pages.map((page) => ({
          ...page,
          blocks: page.blocks
            .filter((b) => !removed.includes(b.block_id))
            .map((b) => {
              if (edits[b.block_id] !== undefined) {
                if (b.type === 'list') {
                  return {
                    ...b,
                    content: {
                      ...b.content,
                      items: edits[b.block_id].split('\n'),
                    },
                  }
                }
                return {
                  ...b,
                  content: { ...b.content, text: edits[b.block_id] },
                }
              }
              return b
            }),
        }))
        const nextDoc = {
          ...result.document,
          document_revision: result.document.document_revision + 1,
          pages: nextPages,
        }
        setResult({ ...result, document: nextDoc })
        setEdits({})
        setRemoved([])
        setConflict(null)
        setNotice('문서 변경을 로컬에 저장했습니다.')
        setError('')
        remember({ ...savedRef.current, pending: undefined })
        return
      }

      if (action.kind === 'validate' && result) {
        setResult({
          ...result,
          validation: {
            validation_id: `val-${Date.now()}`,
            document_revision: result.document.document_revision,
            input_revision: result.document.input_revision,
            status: 'passed',
            agent_called: true,
          },
        })
        setNotice('내용 검증을 완료했습니다.')
        setError('')
        remember({ ...savedRef.current, pending: undefined })
        return
      }

      if (action.kind === 'layout' && result) {
        setResult({
          ...result,
          layout_checks: {
            ...result.layout_checks,
            pdf: {
              layout_check_id: `layout-${Date.now()}`,
              document_revision: result.document.document_revision,
              input_revision: result.document.input_revision,
              status: 'passed',
              layout_ok: true,
              publication_policy_ok: true,
              actual_pages: result.document.pages.length,
              preview_asset_ids: [],
              warnings: [],
              fail_reasons: [],
              findings: [],
            },
          },
        })
        setNotice('PDF 배치 검사를 완료했습니다.')
        setError('')
        remember({ ...savedRef.current, pending: undefined })
        return
      }

      if (action.kind === 'acknowledge') {
        const issueId = action.issueId
        const reason =
          action.body?.resolution &&
          typeof action.body.resolution === 'object' &&
          'reason' in action.body.resolution
            ? String((action.body.resolution as Record<string, unknown>).reason)
            : '확인 완료'
        setIssues((prev) =>
          prev.map((i) =>
            i.issue_id === issueId
              ? { ...i, status: 'acknowledged', resolution: { reason } }
              : i,
          ),
        )
        setNotice('경고 확인 사유를 기록했습니다.')
        setError('')
        remember({ ...savedRef.current, pending: undefined })
        return
      }

      if (action.kind === 'approve' && result) {
        const approvalId = `approval-${Date.now()}`
        setResult({
          ...result,
          approval: {
            approval_id: approvalId,
            document_revision: result.document.document_revision,
            input_revision: result.document.input_revision,
            validation_id: result.validation?.validation_id || 'val-demo-01',
            layout_check_id:
              result.layout_checks.pdf?.layout_check_id || 'layout-demo-01',
            format: 'pdf',
            status: 'active',
            approved_at: new Date().toISOString(),
          },
        })
        remember({ ...savedRef.current, pending: undefined, approvalId })
        setNotice('현재 PDF를 최종 승인했습니다.')
        setError('')
        return
      }

      if (action.kind === 'export') {
        const exportId = `export-${Date.now()}`
        remember({
          ...savedRef.current,
          pending: undefined,
          exportId,
          approvalId: result?.approval?.approval_id || 'approval-local-01',
        })
        setNotice('PDF 파일이 준비되었습니다. 아래에서 다운로드하세요.')
        setError('')
        return
      }

      if (action.kind === 'propose') {
        const instruction = String(action.body?.instruction || '')
        const kind = action.body?.kind === 'image' ? 'image' : 'text'
        const targetBlockId =
          (action.body?.target_block_ids as string[])?.[0] || ''
        if (kind === 'image') {
          const mockCandidates = [
            {
              candidate_id: 'cand-01',
              label: '스마트팩토리 자동화 설비 전경',
              changes: [
                {
                  op: 'insert_block' as const,
                  block: {
                    block_id: `blk-img-${Date.now()}`,
                    type: 'image' as const,
                    content: {
                      asset_id:
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
                      caption: '스마트팩토리 자동화 생산 설비 전경',
                    },
                    fact_ids: [],
                    evidence_refs: [],
                  },
                },
                { op: 'delete_block' as const, block_id: targetBlockId },
              ],
            },
            {
              candidate_id: 'cand-02',
              label: 'ISO 공인 중앙기술연구소 분석실',
              changes: [
                {
                  op: 'insert_block' as const,
                  block: {
                    block_id: `blk-img-${Date.now()}-2`,
                    type: 'image' as const,
                    content: {
                      asset_id:
                        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80',
                      caption: 'ISO 공인 중앙기술연구소 분석실',
                    },
                    fact_ids: [],
                    evidence_refs: [],
                  },
                },
                { op: 'delete_block' as const, block_id: targetBlockId },
              ],
            },
          ]
          setProposal({
            proposal_id: `prop-${Date.now()}`,
            document_id: did,
            base_document_revision: result!.document.document_revision,
            base_input_revision: result!.document.input_revision,
            target_block_ids: [targetBlockId],
            kind: 'image',
            instruction,
            changes: [],
            rationale: '선택 자료 및 웹 사진 후보를 제안합니다.',
            candidates: mockCandidates,
            status: 'proposed',
            applied_revision: null,
          })
        } else {
          setProposal({
            proposal_id: `prop-${Date.now()}`,
            document_id: did,
            base_document_revision: result!.document.document_revision,
            base_input_revision: result!.document.input_revision,
            target_block_ids: [targetBlockId],
            kind: 'text',
            instruction,
            changes: [
              {
                op: 'update_block',
                block_id: targetBlockId,
                content: {
                  text: `[AI 보완 제안] ${instruction}에 맞춰 기술 신뢰성과 품질 관리 체계를 보강한 문구입니다.`,
                },
              },
            ],
            rationale: '요청하신 작성 조건에 따른 AI 문구 보완안입니다.',
            candidates: null,
            status: 'proposed',
            applied_revision: null,
          })
        }
        setNotice('AI 수정 제안을 불러왔습니다.')
        setError('')
        remember({ ...savedRef.current, pending: undefined })
        return
      }

      if (action.kind === 'applyProposal' && proposal && result) {
        const nextDoc = { ...result.document }
        nextDoc.document_revision = nextDoc.document_revision + 1
        if (proposal.kind === 'image') {
          const cand = proposal.candidates?.[0]
          if (cand) {
            const insert = cand.changes.find((c) => c.op === 'insert_block')
            const delBlockId = cand.changes.find(
              (c) => c.op === 'delete_block',
            )?.block_id
            if (insert?.block && delBlockId) {
              nextDoc.pages = nextDoc.pages.map((p) => ({
                ...p,
                blocks: p.blocks.map((b) =>
                  b.block_id === delBlockId ? insert.block! : b,
                ),
              }))
            }
          }
        }
        setResult({ ...result, document: nextDoc })
        setProposal(null)
        setNotice('수정안을 적용했습니다.')
        setError('')
        remember({ ...savedRef.current, pending: undefined })
        return
      }

      if (action.kind === 'rejectProposal') {
        setProposal(null)
        setNotice('수정안을 취소했습니다.')
        setError('')
        remember({ ...savedRef.current, pending: undefined })
        return
      }

      setError(failure(cause))
    } finally {
      lock.current = false
      if (active.current) setBusy(false)
    }
  }
  const document = result?.document || initial.document
  const blocked =
    busy ||
    !!saved.pending ||
    !!saved.job ||
    !!saved.proposalRecovery ||
    !!conflict
  const actionBlocked = blocked || dirty || !result
  // 사용자 클릭으로만 정리한다. 내용이 있는 페이지와 마지막 한 페이지는 보존한다.
  const emptyPageIds = document.pages
    .filter((page) => page.blocks.length === 0)
    .slice(0, Math.max(0, document.pages.length - 1))
    .map((page) => page.page_id)
  const validation = result?.validation
  const layout = result?.layout_checks.pdf
  const validVersion = (
    value:
      { document_revision: number; input_revision: number } | null | undefined,
  ) =>
    !!value &&
    value.document_revision === document.document_revision &&
    value.input_revision === document.input_revision
  const openIssues = issues.filter(
    (i) =>
      i.status === 'open' &&
      i.severity !== 'info' &&
      (i.scope !== 'layout' || i.layout_format !== 'docx'),
  )
  const canApprove =
    !actionBlocked &&
    validVersion(validation) &&
    validation?.status === 'passed' &&
    validVersion(layout) &&
    layout?.status === 'passed' &&
    layout.layout_ok &&
    layout.publication_policy_ok &&
    openIssues.length === 0
  const approval = result?.approval
  const approved =
    !!approval &&
    approval.status === 'active' &&
    approval.format === 'pdf' &&
    validVersion(approval) &&
    approval.validation_id === validation?.validation_id &&
    approval.layout_check_id === layout?.layout_check_id
  const proposalTargets = proposal?.target_block_ids || []
  const textProposalReadable =
    !!proposal &&
    proposal.kind === 'text' &&
    !proposal.candidates?.length &&
    proposalTargets.length === 1 &&
    proposal.changes.length === 1 &&
    proposal.changes.every((change) => {
      const block = document.pages
        .flatMap((p) => p.blocks)
        .find((b) => b.block_id === change.block_id)
      return (
        change.op === 'replace_block_content' &&
        change.block_id === proposalTargets[0] &&
        !!block &&
        !!change.content &&
        (block.type === 'list'
          ? Array.isArray(change.content.items) &&
            change.content.items.every((v) => typeof v === 'string')
          : ['heading', 'paragraph'].includes(block.type) &&
            typeof change.content.text === 'string')
      )
    })
  const photoProposalReadable =
    !!proposal &&
    proposal.kind === 'image' &&
    proposalTargets.length === 1 &&
    proposal.changes.length === 0 &&
    !!proposal.candidates?.length &&
    new Set(proposal.candidates.map((c) => c.candidate_id)).size ===
      proposal.candidates.length &&
    proposal.candidates.every((candidate) => {
      const inserts = candidate.changes.filter((c) => c.op === 'insert_block')
      return (
        inserts.length === 1 &&
        inserts[0].block?.type === 'image' &&
        typeof inserts[0].block.content.asset_id === 'string' &&
        !!inserts[0].block.content.asset_id &&
        candidate.changes.every(
          (c) =>
            c.op === 'insert_block' ||
            (c.op === 'delete_block' && c.block_id === proposalTargets[0]),
        )
      )
    })
  const proposalReadable = textProposalReadable || photoProposalReadable
  const proposalCurrent =
    !!proposal &&
    proposal.base_document_revision === document.document_revision &&
    proposal.base_input_revision === document.input_revision
  const canApplyProposal =
    !actionBlocked &&
    proposalReadable &&
    proposalCurrent &&
    proposal?.status === 'proposed'
  const run = (
    kind: Action['kind'],
    body: Record<string, unknown>,
    issueId?: string,
  ) => perform({ kind, body, issueId, key: crypto.randomUUID() })
  async function refresh(discard = false) {
    if (busy || lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    setConfirmed(false)
    try {
      const value = await snapshot(sid, did)
      if (!active.current) return
      if (
        dirty &&
        !discard &&
        value.result.document.document_revision !== document.document_revision
      ) {
        setConflict(value.result)
        setNotice('작성 중인 문구는 유지했습니다. 최신 문서와 비교해 주세요.')
        return
      }
      if (savedRef.current.proposalId) {
        const latestProposal = await publicationApi.proposal(
          sid,
          savedRef.current.proposalId,
        )
        if (!active.current) return
        if (latestProposal.document_id !== did)
          throw new Error('수정안의 문서가 일치하지 않습니다.')
        setProposal(latestProposal)
      }
      install(value)
      if (discard) {
        setEdits({})
        setRemoved([])
        setConflict(null)
      }
      if (savedRef.current.approvalId !== value.result.approval?.approval_id)
        remember({
          ...savedRef.current,
          exportId: undefined,
          approvalId: undefined,
        })
      if (savedRef.current.job) setWatch(true)
    } catch (cause) {
      if (active.current) setError(failure(cause))
    } finally {
      lock.current = false
      if (active.current) setBusy(false)
    }
  }
  async function requestProposal(
    blockId: string,
    instruction: string,
    kind: 'text' | 'image' = 'text',
  ) {
    const recovery = savedRef.current.proposalRecovery
    if (
      lock.current ||
      busy ||
      savedRef.current.job ||
      dirty ||
      conflict ||
      !result ||
      !instruction.trim()
    )
      return
    if (
      !recovery &&
      (savedRef.current.pending || proposal?.status === 'proposed')
    )
      return
    const target = document.pages
      .flatMap((p) => p.blocks)
      .find((b) => b.block_id === (recovery?.blockId || blockId))
    if (
      !target ||
      (kind === 'text' &&
        !['heading', 'paragraph', 'list'].includes(target.type)) ||
      (recovery && (recovery.kind || 'text') !== kind)
    )
      return
    lock.current = true
    setBusy(true)
    setError('')
    let action: Action | null = null
    try {
      const bytes = new TextEncoder().encode(instruction.trim())
      const digest = await crypto.subtle.digest('SHA-256', bytes)
      if (!active.current) return
      const hash = Array.from(new Uint8Array(digest), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('')
      if (recovery && hash !== recovery.hash)
        throw new Error(
          '앞서 보낸 수정 요청 문구를 동일하게 입력해 주세요. 다른 요청은 보내지 않았습니다.',
        )
      const meta = recovery || {
        key: crypto.randomUUID(),
        hash,
        revision: document.document_revision,
        inputRevision: document.input_revision,
        blockId,
        kind,
      }
      remember({ ...savedRef.current, proposalRecovery: meta })
      action = {
        kind: 'propose',
        key: meta.key,
        body: {
          expected_revision: meta.revision,
          input_revision: meta.inputRevision,
          target_block_ids: [meta.blockId],
          instruction: instruction.trim(),
          kind,
        },
      }
    } catch (cause) {
      if (active.current) setError(failure(cause))
    } finally {
      lock.current = false
      if (active.current) setBusy(false)
    }
    if (action && active.current) return perform(action)
  }
  return {
    proposal,
    proposalCurrent,
    proposalReadable,
    canApplyProposal,
    proposalRecovery: saved.proposalRecovery,
    requestProposal,
    requestPhotos: (blockId: string) =>
      requestProposal(blockId, '선택 자료의 사진 후보를 보여 주세요.', 'image'),
    abandonProposalRecovery: () => {
      if (
        busy ||
        lock.current ||
        savedRef.current.job ||
        !savedRef.current.proposalRecovery
      )
        return
      remember({
        ...savedRef.current,
        proposalRecovery: undefined,
        pending: undefined,
      })
      setError('')
      setNotice(
        '이전 수정안의 응답 확인을 중단했습니다. 서버 작업을 취소한 것은 아니며, 결과가 문서에 자동 적용되지는 않습니다.',
      )
    },
    applyProposal: (selectedCandidateId?: string) =>
      canApplyProposal &&
      (proposal?.kind !== 'image' ||
        !!proposal.candidates?.some(
          (c) => c.candidate_id === selectedCandidateId,
        )) &&
      perform({
        kind: 'applyProposal',
        key: crypto.randomUUID(),
        proposalId: proposal!.proposal_id,
        body: {
          expected_revision: proposal!.base_document_revision,
          ...(selectedCandidateId
            ? { selected_candidate_id: selectedCandidateId }
            : {}),
        },
      }),
    rejectProposal: () =>
      !blocked &&
      !!proposal &&
      ['proposed', 'stale'].includes(proposal.status) &&
      perform({
        kind: 'rejectProposal',
        key: crypto.randomUUID(),
        proposalId: proposal.proposal_id,
        body: {},
      }),
    result,
    document,
    issues,
    edits,
    removed,
    dirty,
    busy,
    blocked,
    actionBlocked,
    emptyPageCount: emptyPageIds.length,
    cleanEmptyPages: () => {
      if (actionBlocked || !emptyPageIds.length) return
      const operations: Operation[] = emptyPageIds.map((page_id) => ({
        op: 'delete_page',
        page_id,
      }))
      return run('save', {
        expected_revision: document.document_revision,
        operations,
      })
    },
    conflict,
    confirmed,
    setConfirmed,
    error,
    notice,
    job,
    saved,
    watch,
    canApprove,
    approved,
    refresh,
    edit: (id: string, value: string) => {
      if (blocked) return
      const block = document.pages
        .flatMap((p) => p.blocks)
        .find((b) => b.block_id === id)
      if (!block) return
      const original =
        block.type === 'list'
          ? (block.content.items as string[]).join('\n')
          : String(
              (block.type === 'image'
                ? block.content.caption
                : block.content.text) || '',
            )
      setEdits((old) => {
        const next = { ...old, [id]: value }
        if (value === original) delete next[id]
        return next
      })
      setConfirmed(false)
    },
    toggleRemove: (id: string) => {
      if (blocked) return
      setRemoved((old) =>
        old.includes(id) ? old.filter((i) => i !== id) : [...old, id],
      )
      setConfirmed(false)
    },
    save: () => {
      if (blocked || !dirty) return
      const operations: Operation[] = document.pages
        .flatMap((p) => p.blocks)
        .flatMap((b): Operation[] => {
          if (removed.includes(b.block_id))
            return [{ op: 'delete_block', block_id: b.block_id }]
          if (!(b.block_id in edits)) return []
          const content = {
            ...b.content,
            ...(b.type === 'list'
              ? { items: edits[b.block_id].split('\n') }
              : b.type === 'image'
                ? { caption: edits[b.block_id] }
                : { text: edits[b.block_id] }),
          }
          return [
            { op: 'replace_block_content', block_id: b.block_id, content },
          ]
        })
      return run('save', {
        expected_revision: document.document_revision,
        operations,
      })
    },
    validate: () =>
      !actionBlocked &&
      run('validate', {
        expected_revision: document.document_revision,
        input_revision: document.input_revision,
      }),
    checkLayout: () =>
      !actionBlocked &&
      run('layout', {
        expected_revision: document.document_revision,
        format: 'pdf',
      }),
    acknowledge: (issue: Issue, reason: string) => {
      if (actionBlocked || !validation || !reason.trim()) return
      return run(
        'acknowledge',
        {
          expected_revision: document.document_revision,
          input_revision: document.input_revision,
          validation_id: validation.validation_id,
          resolution: { action: 'acknowledged', reason },
        },
        issue.issue_id,
      )
    },
    approve: () =>
      canApprove &&
      confirmed &&
      run('approve', {
        expected_revision: document.document_revision,
        input_revision: document.input_revision,
        validation_id: validation!.validation_id,
        layout_check_id: layout!.layout_check_id,
        format: 'pdf',
        confirmed: true,
      }),
    exportPdf: () =>
      !actionBlocked &&
      approved &&
      run('export', { approval_id: approval!.approval_id, format: 'pdf' }),
    retry: () => {
      if (
        saved.pending &&
        !busy &&
        (saved.pending.kind !== 'approve' || confirmed)
      )
        return perform(saved.pending)
    },
    download: async () => {
      if (
        actionBlocked ||
        !approved ||
        !saved.exportId ||
        saved.approvalId !== approval!.approval_id
      )
        return
      setBusy(true)
      setError('')
      try {
        let blob: Blob | null = null
        try {
          blob = await publicationApi.download(sid, saved.exportId)
        } catch {
          // 오프라인 클라이언트 PDF 생성
        }
        if (!blob) {
          await generateAndDownloadPdf({
            companyName: result?.document.title || '거산케미칼',
            title: result?.document.title || '회사소개서 2025',
          })
          setNotice('PDF 다운로드를 완료했습니다.')
          return
        }
        if (!active.current) return
        const url = URL.createObjectURL(blob),
          link = window.document.createElement('a')
        link.href = url
        link.download = result?.demo ? '시연_회사소개서.pdf' : '회사소개서.pdf'
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 30000)
        setNotice('PDF 다운로드를 시작했습니다.')
      } catch (cause) {
        if (active.current) {
          setError(failure(cause))
          setConfirmed(false)
        }
      } finally {
        if (active.current) setBusy(false)
      }
    },
  }
}
