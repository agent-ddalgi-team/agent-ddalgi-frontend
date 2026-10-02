import { useLayoutEffect, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Edit3,
  FileText,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  Lightbulb,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import type { DraftBlock, DraftResult } from '../../api/aiWorkflow'
import { issueMessageParts } from '../../constants/profileLabels'
import { canAcknowledge } from '../../api/publication'
import { usePublication } from '../../hooks/usePublication'
import type { WizardStep } from './StepIndicator'

const button =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
const ghost =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50'
const primary =
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#007A78] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#006663] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'
const cta =
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:bg-none disabled:text-slate-400 disabled:shadow-none'
const panel = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-xs'
const stateLabel: Record<string, string> = {
  pending: '검사 중',
  passed: '통과',
  needs_review: '검토 필요',
  failed: '실패',
  open: '미해결',
  resolved: '해결됨',
  excluded: '제외됨',
  acknowledged: '확인됨',
}
const stateTone: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  passed: 'bg-emerald-50 text-emerald-800',
  needs_review: 'bg-amber-50 text-amber-800',
  failed: 'bg-red-50 text-red-800',
}
const blockLabel: Record<DraftBlock['type'], string> = {
  heading: '제목',
  paragraph: '본문',
  list: '목록',
  image: '사진',
  image_placeholder: '사진 자리',
}
const blockText = (block: DraftBlock) =>
  block.type === 'list' && Array.isArray(block.content.items)
    ? block.content.items.join('\n')
    : String(block.content.text || block.content.caption || '')
const isText = (block: DraftBlock | undefined) =>
  !!block && ['heading', 'paragraph', 'list'].includes(block.type)
const isPhoto = (block: DraftBlock | undefined) =>
  !!block && ['image', 'image_placeholder'].includes(block.type)

function ManuscriptInput(props: ComponentProps<'textarea'>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const input = ref.current
    if (!input) return
    let width = 0
    let frame = 0
    const fit = () => {
      if (!input.clientWidth) return
      width = input.clientWidth
      input.style.height = 'auto'
      input.style.height = `${input.scrollHeight}px`
    }
    fit()
    const observer = new ResizeObserver(() => {
      if (input.clientWidth !== width) {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(fit)
      }
    })
    observer.observe(input)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [props.value])
  return <textarea {...props} ref={ref} rows={1} />
}

function Banner({
  tone,
  children,
}: {
  tone: 'info' | 'warn' | 'error' | 'ok'
  children: ReactNode
}) {
  const style = {
    info: 'border-blue-200/80 bg-blue-50/90 text-blue-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-800',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-2xl border px-4 py-3 text-xs leading-relaxed shadow-xs ${style}`}
    >
      {children}
    </div>
  )
}

export function DocumentWorkspace({
  initial,
  renderBlock,
  step,
  onNavigate,
  onClose,
}: {
  initial: DraftResult
  renderBlock: (block: DraftBlock) => ReactNode
  step: WizardStep
  onNavigate: (step: WizardStep) => void
  onClose: () => void
}) {
  const work = usePublication(initial)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [discard, setDiscard] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [blockId, setBlockId] = useState('')
  const [inspector, setInspector] = useState(false)
  const [view, setView] = useState<'cards' | 'split'>('cards')
  const [zoom, setZoom] = useState(100)
  const [reading, setReading] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [photoChoice, setPhotoChoice] = useState({
    proposalId: '',
    candidateId: '',
  })
  const chosenPhoto =
    photoChoice.proposalId === work.proposal?.proposal_id
      ? photoChoice.candidateId
      : ''
  const photoRecovery = work.proposalRecovery?.kind === 'image'
  const doc = work.document
  const photoTargetPage = doc.pages.find((p) =>
    p.blocks.some((b) => work.proposal?.target_block_ids.includes(b.block_id)),
  )
  const photoTarget = photoTargetPage?.blocks.find((b) =>
    work.proposal?.target_block_ids.includes(b.block_id),
  )
  const validation = work.result?.validation
  const layout = work.result?.layout_checks.pdf
  const currentIndex = Math.min(pageIndex, Math.max(0, doc.pages.length - 1))
  const page = doc.pages[currentIndex]
  const selectedBlock =
    page?.blocks.find((b) => b.block_id === blockId) || page?.blocks[0]
  const selectedBlockIndex = selectedBlock
    ? page.blocks.findIndex((b) => b.block_id === selectedBlock.block_id) + 1
    : 0
  const previews = layout?.preview_asset_ids || []
  const [previewIndex, setPreviewIndex] = useState(0)
  const currentPreview = Math.min(
    previewIndex,
    Math.max(0, previews.length - 1),
  )
  const reviewIndex = previews.length ? currentPreview : currentIndex
  const openIssues = work.issues.filter(
    (i) => i.status === 'open' && i.layout_format !== 'docx',
  )
  const blockers = openIssues.filter((i) => i.severity === 'blocker')
  const warnings = openIssues.filter((i) => i.severity === 'warning')
  const assetUrl = (id: string) =>
    `/api/v1/sessions/${encodeURIComponent(doc.session_id)}/assets/${encodeURIComponent(id)}`
  const selectPage = (index: number) => {
    setPageIndex(index)
    setBlockId('')
  }
  const navigate = (next: WizardStep) => {
    setInspector(false)
    onNavigate(next)
  }
  const previewPage = (index: number) => {
    setPreviewIndex(index)
    selectPage(index)
    setView('split')
  }
  const focusBlock = (id: string) => {
    setReading(false)
    setBlockId(id)
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(
        `[data-edit-block="${id}"]`,
      )
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
  const pageIssues = (index: number) =>
    openIssues.filter((issue) =>
      issue.block_ids.some((id) =>
        doc.pages[index]?.blocks.some((b) => b.block_id === id),
      ),
    )
  const proposalStatus = {
    proposed: '검토 대기',
    applied: '적용됨',
    rejected: '취소됨',
    stale: '기준 변경',
  }
  const proposalDisabled =
    work.busy ||
    !!work.saved.job ||
    (!work.proposalRecovery &&
      (work.actionBlocked || work.proposal?.status === 'proposed'))
  const saveBadge: [string, string, typeof CheckCircle2] = work.busy
    ? ['저장·처리 중', 'border-slate-200 bg-slate-50 text-slate-600', Loader2]
    : work.dirty
      ? [
          '저장하지 않은 변경 있음',
          'border-amber-200 bg-amber-50 text-amber-800',
          AlertTriangle,
        ]
      : [
          `세션 내 저장 완료 · 버전 ${doc.document_revision}`,
          'border-emerald-200 bg-emerald-50 text-emerald-800',
          CheckCircle2,
        ]
  const SaveIcon = saveBadge[2]
  const reviewBadge = work.approved
    ? ['PDF 승인 완료', 'border-emerald-200 bg-emerald-50 text-emerald-800']
    : !validation
      ? ['검사 전', 'border-slate-200 bg-slate-100 text-slate-600']
      : validation.status === 'passed' && layout?.status === 'passed'
        ? [
            '내용·배치 검사 통과',
            'border-emerald-200 bg-emerald-50 text-emerald-800',
          ]
        : [
            `내용 ${stateLabel[validation.status]} · 배치 ${layout ? stateLabel[layout.status] : '검사 전'}`,
            'border-amber-200 bg-amber-50 text-amber-800',
          ]

  const statusBlocks = (
    <>
      {(work.busy || work.watch) && (
        <Banner tone="info">
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={15} />
            {work.job?.progress.message || '문서를 처리하고 있습니다.'}
          </span>
        </Banner>
      )}
      {work.notice && !work.busy && <Banner tone="ok">{work.notice}</Banner>}
      {work.error && (
        <Banner tone="error">
          <span className="whitespace-pre-wrap">{work.error}</span>
        </Banner>
      )}
      {work.saved.pending && !work.busy && (
        <Banner tone="warn">
          <p>처리 결과를 확인하지 못했습니다. 같은 요청으로 재시도합니다.</p>
          {work.saved.pending.kind === 'approve' && (
            <label className="my-2 flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#007A78]"
                checked={work.confirmed}
                onChange={(e) => work.setConfirmed(e.target.checked)}
              />
              앞서 확인한 PDF의 최종 승인 요청을 다시 확인합니다.
            </label>
          )}
          <button
            type="button"
            className={`${button} mt-2`}
            disabled={work.saved.pending.kind === 'approve' && !work.confirmed}
            onClick={() => void work.retry()}
          >
            같은 문서 요청 다시 확인
          </button>
        </Banner>
      )}
      {work.saved.job && !work.watch && (
        <div>
          <button
            type="button"
            className={button}
            disabled={work.busy}
            onClick={() => void work.refresh()}
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#007A78]" />
            문서 작업 상태 다시 확인
          </button>
        </div>
      )}
      {work.conflict && (
        <Banner tone="warn">
          <h3 className="text-sm font-bold">
            다른 곳에서 수정된 최신 버전:{' '}
            {work.conflict.document.document_revision}
          </h3>
          <p className="mt-1">
            아래 편집란의 내 문구는 유지했습니다. 필요한 문구를 복사한 뒤 최신
            저장본을 불러와 다시 편집해 주세요.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold">
              최신 서버 문구와 비교
            </summary>
            {work.conflict.document.pages
              .flatMap((p) => p.blocks)
              .map((b) => (
                <p
                  key={b.block_id}
                  className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-2"
                >
                  {String(
                    b.content.text ||
                      (Array.isArray(b.content.items)
                        ? b.content.items.join('\n')
                        : b.type),
                  )}
                </p>
              ))}
          </details>
          <button
            type="button"
            className={`${button} mt-3`}
            onClick={() => setDiscard(true)}
          >
            내 편집을 버리고 최신 저장본 불러오기
          </button>
        </Banner>
      )}
    </>
  )

  const photoProposalPanel = work.proposal?.kind === 'image' &&
    ['proposed', 'stale'].includes(work.proposal.status) && (
      <section
        data-testid="photo-proposal"
        className="photo-choices flex flex-col gap-3 rounded-xl border border-teal-100 bg-white p-4 shadow-lg"
        aria-label="사진 후보 선택"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">사진 후보 선택</h3>
          <span
            role="status"
            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
          >
            {
              {
                proposed: '선택 대기',
                applied: '적용됨',
                rejected: '취소됨',
                stale: '기준 변경',
              }[work.proposal.status]
            }
          </span>
        </div>
        <p className="text-[11px] font-semibold text-[#007A78]">
          요청 당시 문서 버전 {work.proposal.base_document_revision} ·{' '}
          {photoTarget && photoTargetPage
            ? `${doc.pages.indexOf(photoTargetPage) + 1}쪽 ${blockLabel[photoTarget.type]} · ${isPhoto(photoTarget) ? '사진 교체' : '이 블록 뒤에 추가'}`
            : '이전 선택 영역'}
        </p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {work.proposal.rationale}
        </p>
        {!work.proposal.candidates?.length && (
          <p className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900">
            사용할 수 있는 사진 후보가 없습니다. 자료 선택에서 사진을 첨부하거나
            글 중심으로 구성해 주세요.
          </p>
        )}
        <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {work.proposal.candidates?.map((candidate) => {
            const asset = candidate.changes.find((c) => c.op === 'insert_block')
              ?.block?.content.asset_id
            const on = chosenPhoto === candidate.candidate_id
            return (
              <label
                key={candidate.candidate_id}
                className={`cursor-pointer rounded-xl border p-2 text-[11px] transition-all ${on ? 'border-[#007A78] bg-[#E6F4F1]/60 ring-1 ring-[#007A78]/20' : 'border-slate-200 hover:border-slate-300'}`}
              >
                {typeof asset === 'string' && (
                  <img
                    src={assetUrl(asset)}
                    alt={candidate.label}
                    className="mb-2 h-24 w-full rounded-lg bg-slate-800 object-cover"
                    loading="lazy"
                  />
                )}
                <span className="flex items-start gap-1.5">
                  <input
                    type="radio"
                    name="photo-candidate"
                    className="mt-0.5 accent-[#007A78]"
                    value={candidate.candidate_id}
                    checked={on}
                    disabled={!work.canApplyProposal}
                    onChange={() =>
                      setPhotoChoice({
                        proposalId: work.proposal!.proposal_id,
                        candidateId: candidate.candidate_id,
                      })
                    }
                  />
                  <span className="break-words font-semibold text-slate-800">
                    {candidate.label}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
        {!work.proposalCurrent && work.proposal.status === 'proposed' && (
          <p className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
            문서가 바뀌었습니다. 후보를 취소하고 다시 요청해 주세요.
          </p>
        )}
        {!work.proposalReadable && (
          <p className="text-[11px] text-red-800">
            사진 후보의 변경 내용을 확인할 수 없습니다.
          </p>
        )}
        <p className="text-[11px] leading-relaxed text-slate-500">
          실제 회사 사진을 AI로 만들지 않고 첨부한 사진 중에서만 제안합니다.
          교체 시 이전 사진의 설명은 지워지므로 적용 후 사진 설명을 입력하고
          다시 검증해 주세요.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={primary}
            disabled={!work.canApplyProposal || !chosenPhoto}
            onClick={() => void work.applyProposal(chosenPhoto)}
          >
            선택한 사진 적용
          </button>
          <button
            type="button"
            className={ghost}
            disabled={
              work.blocked ||
              !['proposed', 'stale'].includes(work.proposal.status)
            }
            onClick={() => void work.rejectProposal()}
          >
            사진 후보 취소
          </button>
        </div>
      </section>
    )

  return (
    <section
      id="draft-preview"
      data-testid="draft-result"
      hidden={step === 1}
      aria-label="초안 편집과 PDF 출력"
      className="document-workspace animate-fade-in flex flex-col gap-5 pb-28"
    >
      {/* ===================== S02 초안 편집 ===================== */}
      <div
        hidden={step !== 2}
        data-screen="S02"
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F1] px-3 py-0.5 text-xs font-semibold text-[#007A78] shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#007A78]" />
              S02 단계 · 초안 편집
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              초안을 내 문서로 다듬으세요
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              목차에서 페이지를 고르고, 페이지 안의 문장을 직접 수정하거나 AI
              수정안을 비교해 적용할 수 있어요.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              role="status"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-xs ${saveBadge[1]}`}
            >
              <SaveIcon
                className={`h-4 w-4 ${work.busy ? 'animate-spin' : ''}`}
              />
              {saveBadge[0]}
            </span>
            <button
              type="button"
              className={button}
              disabled={work.busy}
              onClick={() => void work.refresh()}
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#007A78]" />
              문서 상태 새로고침
            </button>
            <button
              type="button"
              className={button}
              disabled={work.blocked}
              onClick={onClose}
            >
              작업 종료
            </button>
          </div>
        </div>
        {statusBlocks}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/90 px-4 py-3 text-xs text-slate-800 shadow-xs">
          <span className="flex items-center gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-blue-700" />
            문구를 저장하면 이전 내용 검증·배치 검사·승인이 해제됩니다. 작성
            중인 문구는 새로고침 전에 저장해 주세요.
          </span>
          <button
            type="button"
            className={`${button} inspector-toggle`}
            onClick={() => setInspector(true)}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#007A78]" />
            편집 보조
          </button>
        </div>

        <div className="editor-layout">
          {/* 왼쪽: 문서 목차 */}
          <nav
            className={`${panel} document-toc flex flex-col gap-3`}
            aria-label="문서 목차"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  목차 구조
                </h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  {doc.pages.length}쪽 중 {currentIndex + 1}쪽
                </span>
              </div>
            </div>
            <ol className="flex flex-col gap-1.5">
              {doc.pages.map((item, index) => {
                const active = currentIndex === index
                return (
                  <li
                    key={item.page_id}
                    className={
                      active
                        ? 'flex flex-col gap-1.5 rounded-xl border border-[#007A78]/30 bg-[#E6F4F1]/60 p-1.5 shadow-2xs'
                        : ''
                    }
                  >
                    <button
                      type="button"
                      data-page-select={item.page_id}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => selectPage(index)}
                      className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                        active
                          ? 'bg-white text-[#007A78] shadow-2xs'
                          : 'border border-transparent text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className={`w-5 text-[11px] font-bold ${active ? 'text-[#007A78]' : 'text-slate-400'}`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        title={item.title}
                        className="min-w-0 flex-1 break-words text-xs font-semibold leading-relaxed"
                      >
                        {item.title}
                      </span>
                      {!!pageIssues(index).length && (
                        <span
                          className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800"
                          title="확인이 필요한 문제가 있는 페이지"
                        >
                          {pageIssues(index).length}
                        </span>
                      )}
                      {active && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#007A78]" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ol>
            {page && (
              <div className="min-h-0 border-t border-slate-100 pt-3">
                <h3 className="mb-2 text-[11px] font-semibold text-slate-500">
                  현재 페이지 내용 · {page.blocks.length}개
                </h3>
                <ul className="toc-contents flex flex-col gap-1">
                  {page.blocks.map((block) => {
                    const on = selectedBlock?.block_id === block.block_id
                    const removed = work.removed.includes(block.block_id)
                    const text = (
                      work.edits[block.block_id] ?? blockText(block)
                    )
                      .replace(/\s+/g, ' ')
                      .trim()
                    const label = text || `${blockLabel[block.type]} 내용 없음`
                    return (
                      <li key={block.block_id}>
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`${blockLabel[block.type]}: ${label}${removed ? ' · 삭제 예정' : ''}`}
                          title={label}
                          data-block-select={block.block_id}
                          onClick={() => focusBlock(block.block_id)}
                          className={`flex w-full cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                            on
                              ? 'border-[#007A78]/40 bg-[#E6F4F1] text-[#007A78]'
                              : 'border-transparent text-slate-700 hover:bg-slate-50'
                          } ${removed ? 'line-through opacity-60' : ''}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="mb-0.5 block text-[10px] text-slate-500">
                              {blockLabel[block.type]}
                              {removed ? ' · 삭제 예정' : ''}
                            </span>
                            <span
                              className={`line-clamp-2 break-words text-xs leading-relaxed ${block.type === 'heading' ? 'font-semibold' : ''}`}
                            >
                              {label}
                            </span>
                          </span>
                          {on && (
                            <Check className="mt-1 h-3.5 w-3.5 shrink-0" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-slate-500">
              페이지를 선택한 뒤 내용을 누르면 해당 편집 위치로 이동합니다.
            </p>
          </nav>

          {/* 가운데: 편집 캔버스 */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="이전 페이지"
                  disabled={currentIndex === 0}
                  onClick={() => selectPage(currentIndex - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                  {currentIndex + 1} / {doc.pages.length}쪽
                </span>
                <button
                  type="button"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="다음 페이지"
                  disabled={currentIndex + 1 >= doc.pages.length}
                  onClick={() => selectPage(currentIndex + 1)}
                >
                  <ChevronRight size={16} />
                </button>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-600">
                  {selectedBlock
                    ? `블록 ${selectedBlockIndex} · ${blockLabel[selectedBlock.type]} 선택`
                    : '페이지 선택'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={button}
                  aria-pressed={reading}
                  onClick={() => setReading(!reading)}
                >
                  {reading ? <Edit3 size={14} /> : <FileText size={14} />}
                  {reading ? '편집하기' : '문서 보기'}
                </button>
                <label className="flex items-center gap-1 text-[11px] text-slate-500">
                  배율
                  <select
                    aria-label="편집 화면 배율"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-semibold text-slate-800"
                  >
                    <option value={80}>80%</option>
                    <option value={100}>100%</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setInspector(true)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-[#E6F4F1] px-2.5 py-1 text-[11px] font-bold text-[#007A78] shadow-2xs"
                >
                  <Sparkles className="h-3 w-3" />
                  AI 편집 보조
                </button>
              </div>
            </div>

            <div className="paper-stage">
              {doc.pages.map((item, index) => (
                <article
                  key={item.page_id}
                  hidden={currentIndex !== index}
                  data-editor-page={item.page_id}
                  data-layout={
                    [
                      'cover_photo',
                      'text_photo',
                      'process_steps',
                      'product_grid',
                      'contact_photo',
                    ].includes(item.layout_key)
                      ? item.layout_key
                      : 'text'
                  }
                  data-multi-photo={
                    item.blocks.filter((b) => b.type === 'image').length > 1
                  }
                  className={`editor-paper flex flex-col ${reading ? 'reading' : 'editing'}`}
                  style={{ width: `${zoom}%` }}
                >
                  <div className="editor-page-header">
                    <span className="editor-brand" title={doc.title}>
                      {doc.title}
                    </span>
                    <span className="shrink-0">
                      {initial.demo ? '시연 문서' : '회사소개서'} ·{' '}
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  {item.blocks[0]?.type !== 'heading' && (
                    <h2 className="editor-page-title">{item.title}</h2>
                  )}
                  <div className="editor-page-body">
                    {item.blocks.map((block, blockIndex) => {
                      const editable =
                        ['heading', 'paragraph', 'image'].includes(
                          block.type,
                        ) ||
                        (block.type === 'list' &&
                          Array.isArray(block.content.items) &&
                          block.content.items.every(
                            (v) => typeof v === 'string',
                          ))
                      const removed = work.removed.includes(block.block_id)
                      const on = selectedBlock?.block_id === block.block_id
                      const issues = openIssues.filter((i) =>
                        i.block_ids.includes(block.block_id),
                      )
                      return (
                        <div
                          key={block.block_id}
                          data-block-id={block.block_id}
                          data-block-type={block.type}
                          data-hero={
                            block.type === 'heading' && blockIndex === 0
                          }
                          className={`editor-block relative ${on ? 'selected' : ''} ${removed ? 'removed' : ''}`}
                          onFocus={() => setBlockId(block.block_id)}
                          onClick={() => setBlockId(block.block_id)}
                        >
                          <div className="editor-block-tools flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold ${on ? 'bg-white text-[#007A78] shadow-2xs ring-1 ring-slate-200' : 'text-slate-500'}`}
                            >
                              {blockLabel[block.type]}
                              {removed ? ' · 삭제 예정' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              {!!issues.length && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                  <AlertTriangle className="h-3 w-3" />
                                  확인 필요 {issues.length}
                                </span>
                              )}
                              {isPhoto(block) && (
                                <button
                                  type="button"
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-semibold text-[#007A78] shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={
                                    work.busy ||
                                    !!work.saved.job ||
                                    work.dirty ||
                                    work.actionBlocked ||
                                    work.proposal?.status === 'proposed'
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setBlockId(block.block_id)
                                    setInspector(true)
                                    void work.requestPhotos(block.block_id)
                                  }}
                                >
                                  <ImageIcon className="h-3 w-3" />
                                  사진 교체
                                </button>
                              )}
                              <button
                                type="button"
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#E6F4F1] px-2 py-0.5 font-bold text-[#007A78]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setBlockId(block.block_id)
                                  setInspector(true)
                                }}
                              >
                                <Sparkles className="h-3 w-3" />
                                근거·편집 보조
                              </button>
                            </span>
                          </div>
                          {block.type === 'image' &&
                            typeof block.content.asset_id === 'string' && (
                              <figure className="editor-photo">
                                <img
                                  src={assetUrl(block.content.asset_id)}
                                  data-fit={
                                    block.content.fit === 'crop'
                                      ? 'crop'
                                      : 'contain'
                                  }
                                  alt={String(
                                    block.content.alt ||
                                      block.content.caption ||
                                      '선택 자료의 사진',
                                  )}
                                />
                              </figure>
                            )}
                          {reading && editable ? (
                            block.type === 'heading' ? (
                              <h2 className="editor-text">
                                {work.edits[block.block_id] ?? blockText(block)}
                              </h2>
                            ) : block.type === 'list' ? (
                              <ul className="editor-text list-disc pl-5">
                                {(
                                  work.edits[block.block_id] ?? blockText(block)
                                )
                                  .split('\n')
                                  .map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="editor-text">
                                {work.edits[block.block_id] ?? blockText(block)}
                              </p>
                            )
                          ) : editable ? (
                            <ManuscriptInput
                              data-edit-block={block.block_id}
                              aria-label={`${index + 1}쪽 ${block.type === 'heading' ? '제목' : block.type === 'image' ? '사진 설명' : '본문'} ${block.block_id}`}
                              value={
                                work.edits[block.block_id] ?? blockText(block)
                              }
                              disabled={work.blocked || removed}
                              onChange={(e) =>
                                work.edit(block.block_id, e.target.value)
                              }
                              className="editor-text w-full resize-none overflow-hidden bg-transparent outline-none disabled:opacity-60"
                            />
                          ) : (
                            renderBlock(block)
                          )}
                          <div className="editor-block-meta flex items-center justify-between gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Link2 className="h-3.5 w-3.5 text-[#007A78]" />
                              {block.evidence_refs.length
                                ? `원문 근거 ${block.evidence_refs.length}개 연결`
                                : '연결된 원문 근거 없음'}
                            </span>
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center gap-1 text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={work.blocked}
                              onClick={(e) => {
                                e.stopPropagation()
                                work.toggleRemove(block.block_id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              {removed
                                ? '삭제 취소'
                                : block.type === 'image_placeholder'
                                  ? '사진 자리 삭제'
                                  : '이 블록 삭제'}
                            </button>
                          </div>
                          {!reading &&
                            work.proposal?.kind === 'image' &&
                            photoTarget?.block_id === block.block_id && (
                              <div
                                className="mt-5"
                                onClick={(event) => event.stopPropagation()}
                                onFocus={(event) => event.stopPropagation()}
                              >
                                {photoProposalPanel}
                              </div>
                            )}
                        </div>
                      )
                    })}
                  </div>
                  {!reading &&
                    !item.blocks.some(isPhoto) &&
                    item.blocks.length > 0 && (
                      <button
                        type="button"
                        className="editor-add-photo"
                        disabled={
                          work.actionBlocked ||
                          work.proposal?.status === 'proposed'
                        }
                        onClick={() => {
                          const target =
                            item.blocks.find(
                              (block) => block.type === 'paragraph',
                            ) || item.blocks[0]
                          setBlockId(target.block_id)
                          void work.requestPhotos(target.block_id)
                        }}
                      >
                        <ImageIcon size={22} />
                        <span>
                          <strong>이 페이지에 사진 넣기</strong>
                          <small>
                            선택한 자료의 사진을 확인하고 직접 적용합니다
                          </small>
                        </span>
                        <ArrowRight size={16} />
                      </button>
                    )}
                  <div className="editor-page-footer">
                    <span>
                      회사소개서 · {reading ? '문서 보기' : '편집 중'}
                    </span>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 오른쪽: AI 편집 보조 */}
          {inspector && step === 2 && (
            <button
              type="button"
              className="inspector-backdrop"
              aria-label="편집 보조 닫기"
              onClick={() => setInspector(false)}
            />
          )}
          <aside
            className={`${panel} document-inspector flex flex-col gap-4 ${inspector ? 'inspector-open' : ''}`}
            aria-label="AI 편집 보조 패널"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E6F4F1] text-[#007A78]">
                  <Sparkles className="h-4 w-4" />
                </span>
                AI 편집 보조
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${work.proposal?.status === 'proposed' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}
                >
                  {work.busy || work.watch
                    ? '처리 중'
                    : work.proposal?.status === 'proposed'
                      ? '제안 대기'
                      : '대기'}
                </span>
              </h2>
              <button
                type="button"
                className="inspector-toggle cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="편집 보조 패널 닫기"
                onClick={() => setInspector(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F1] px-2.5 py-0.5 text-xs font-semibold text-[#007A78]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#007A78]" />
                {currentIndex + 1}쪽 ·{' '}
                {selectedBlock
                  ? `블록 ${selectedBlockIndex} (${blockLabel[selectedBlock.type]})`
                  : '블록을 선택하세요'}
              </span>
              <span className="truncate text-[11px] text-slate-400">
                문맥: {page?.title || '-'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="ai-instruction"
                className="text-xs font-bold text-slate-800"
              >
                어떻게 바꿀까요?
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007A78]/30">
                <textarea
                  id="ai-instruction"
                  aria-label="AI 문구 수정 요청"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  disabled={proposalDisabled}
                  maxLength={10000}
                  rows={3}
                  placeholder="예: 사실과 수치는 유지하고 조금 더 읽기 쉽게 정리해 줘"
                  className="w-full resize-none bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    className={`${primary} px-3 py-1.5`}
                    disabled={
                      photoRecovery ||
                      !instruction.trim() ||
                      work.busy ||
                      !!work.saved.job ||
                      (!work.proposalRecovery &&
                        (work.actionBlocked ||
                          work.proposal?.status === 'proposed' ||
                          !isText(selectedBlock)))
                    }
                    onClick={() =>
                      void work.requestProposal(
                        work.proposalRecovery?.blockId ||
                          selectedBlock!.block_id,
                        instruction,
                      )
                    }
                  >
                    {work.proposalRecovery
                      ? '같은 수정안 요청 다시 확인'
                      : 'AI 수정안 요청'}
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                선택한 제목·본문·목록 블록 한 개의 수정안을 요청합니다. ‘이 문구
                적용’을 눌러야 저장 문서가 바뀝니다.
              </p>
              {work.dirty && (
                <p className="text-[11px] text-amber-800">
                  수정안을 요청하거나 적용하기 전에 문구를 저장해 주세요.
                </p>
              )}
              {selectedBlock &&
                !isText(selectedBlock) &&
                !work.proposalRecovery && (
                  <p className="text-[11px] text-slate-500">
                    문구 수정을 요청할 제목·본문·목록 블록을 선택해 주세요.
                  </p>
                )}
            </div>

            {work.proposalRecovery && (
              <div className="rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
                <p role="status">
                  {photoRecovery
                    ? '사진 후보 요청의 접수 여부를 확인하지 못했습니다. 아래 같은 사진 후보 요청 다시 확인을 눌러 주세요.'
                    : '이전 요청의 접수 여부를 확인하지 못했습니다. 원래 요청 문구를 다시 입력하면 같은 대상·같은 요청으로 확인합니다. 요청 본문은 브라우저 저장소에 보관하지 않습니다.'}
                </p>
                <button
                  type="button"
                  className={`${button} mt-2`}
                  disabled={work.busy || !!work.saved.job}
                  onClick={work.abandonProposalRecovery}
                >
                  이전 요청 확인 중단
                </button>
                <p className="mt-2">
                  확인을 중단해도 서버 작업이 취소되지는 않습니다. 새 요청은
                  별도로 처리됩니다. 기존 문서는 자동으로 바뀌지 않습니다.
                </p>
              </div>
            )}

            {work.proposal?.kind === 'text' && (
              <section
                data-testid="proposal-result"
                className="flex flex-col gap-2.5 border-t border-slate-100 pt-3"
                aria-label="AI 수정안 비교"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">
                    기존 문구와 수정안 비교
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {proposalStatus[work.proposal.status]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  요청 당시 문서 버전 {work.proposal.base_document_revision} ·
                  선택한 블록 1개
                </p>
                {work.proposal.changes.map((change, index) => {
                  const original = doc.pages
                    .flatMap((p) => p.blocks)
                    .find((b) => b.block_id === change.block_id)
                  const pageNumber =
                    doc.pages.findIndex((p) =>
                      p.blocks.some((b) => b.block_id === change.block_id),
                    ) + 1
                  return (
                    <div key={index} className="flex flex-col gap-2">
                      <p className="text-[11px] font-semibold text-[#007A78]">
                        {pageNumber || '?'}쪽 ·{' '}
                        {original
                          ? blockLabel[original.type]
                          : '블록 확인 필요'}
                      </p>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {work.proposalCurrent
                            ? '기존 문구'
                            : '현재 저장 문구'}
                        </span>
                        <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs leading-relaxed text-slate-600">
                          {original
                            ? blockText(original)
                            : '현재 문서에서 확인할 수 없습니다.'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-[#007A78]">
                          <Sparkles className="h-3.5 w-3.5" />
                          제안 문구
                        </span>
                        <p
                          data-proposal-text
                          className="whitespace-pre-wrap rounded-xl border border-[#007A78]/30 bg-[#E6F4F1]/90 p-3 text-xs font-semibold leading-relaxed text-slate-900 shadow-2xs"
                        >
                          {change.op === 'replace_block_content'
                            ? Array.isArray(change.content?.items)
                              ? change.content.items.join('\n')
                              : String(change.content?.text || '')
                            : '이 화면에서 검토할 수 없는 변경입니다.'}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1 font-bold text-[#007A78]">
                    <Sparkles className="h-3 w-3" />
                    제안 이유
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {work.proposal.rationale}
                  </p>
                </div>
                <p className="flex items-center gap-1 px-1 text-[10px] text-slate-400">
                  <Info className="h-3.5 w-3.5 text-amber-600" />
                  적용 전에는 본문에 즉시 반영되지 않습니다. 제안의
                  사실·수치·조건을 확인한 뒤 적용해 주세요.
                </p>
                {!work.proposalReadable && (
                  <p className="text-[11px] text-red-800">
                    단일 텍스트 블록의 수정안만 이 화면에서 적용할 수 있습니다.
                  </p>
                )}
                {!work.proposalCurrent &&
                  work.proposal.status === 'proposed' && (
                    <p className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
                      문서가 바뀌어 적용할 수 없습니다. 이 수정안을 취소한 뒤
                      최신 문서로 다시 요청해 주세요.
                    </p>
                  )}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    className={`${primary} w-full py-2.5`}
                    disabled={!work.canApplyProposal}
                    onClick={() => void work.applyProposal()}
                  >
                    <Check className="h-4 w-4" />이 문구 적용
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={ghost}
                      disabled={proposalDisabled || !isText(selectedBlock)}
                      onClick={() => {
                        setInstruction(work.proposal?.instruction || '')
                        document.getElementById('ai-instruction')?.focus()
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      다시 요청
                    </button>
                    <button
                      type="button"
                      className={ghost}
                      disabled={
                        work.blocked ||
                        !['proposed', 'stale'].includes(work.proposal.status)
                      }
                      onClick={() => void work.rejectProposal()}
                    >
                      수정안 취소
                    </button>
                  </div>
                </div>
              </section>
            )}

            {work.proposal?.kind === 'image' &&
              photoTargetPage?.page_id !== page?.page_id &&
              photoProposalPanel}

            {selectedBlock && (
              <section className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Link2 className="h-3.5 w-3.5 text-[#007A78]" />
                  선택 블록 · 저장본과 근거 출처
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  {renderBlock(selectedBlock)}
                </div>
                {work.edits[selectedBlock.block_id] !== undefined && (
                  <p className="text-[11px] text-amber-800">
                    현재 편집 문구는 저장 전입니다. 위에는 마지막 저장본을
                    표시합니다.
                  </p>
                )}
                <button
                  type="button"
                  className={`${button} w-full`}
                  disabled={
                    work.busy ||
                    !!work.saved.job ||
                    work.dirty ||
                    (photoRecovery
                      ? false
                      : work.actionBlocked ||
                        work.proposal?.status === 'proposed')
                  }
                  onClick={() =>
                    void work.requestPhotos(
                      work.proposalRecovery?.blockId || selectedBlock.block_id,
                    )
                  }
                >
                  <ImageIcon className="h-3.5 w-3.5 text-[#007A78]" />
                  {photoRecovery
                    ? '같은 사진 후보 요청 다시 확인'
                    : isPhoto(selectedBlock)
                      ? '사진 교체 후보 보기'
                      : '이 블록 뒤에 사진 추가'}
                </button>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  근거가 연결되어 있어도 제안 전체의 진위를 보증하지 않습니다.
                  내용 검증 시 실제 사진과 설명이 AI에 전달됩니다.
                </p>
              </section>
            )}
          </aside>
        </div>

        <footer className="screen-dock">
          <button type="button" className={ghost} onClick={() => navigate(1)}>
            <ArrowLeft size={16} />
            자료 선택
          </button>
          <p className="dock-hint flex items-center justify-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-[#007A78]" />
            AI 제안은 적용 버튼을 눌러야 본문에 반영돼요. 편집 내용은 직접
            저장해 주세요.
          </p>
          {work.emptyPageCount > 0 && (
            <button
              type="button"
              className={button}
              disabled={work.actionBlocked}
              title={`내용이 없는 ${work.emptyPageCount}쪽을 제거합니다. 문구 편집은 먼저 저장해 주세요.`}
              onClick={() => void work.cleanEmptyPages()}
            >
              빈 페이지 정리
            </button>
          )}
          <button
            type="button"
            className={button}
            disabled={work.blocked || !work.dirty}
            onClick={() => void work.save()}
          >
            <Save size={15} className="text-[#007A78]" />
            문구 저장
          </button>
          <button
            type="button"
            className={cta}
            disabled={work.dirty || work.blocked}
            title={work.dirty ? '먼저 문구를 저장해 주세요.' : undefined}
            onClick={() => navigate(3)}
          >
            승인·출력으로
            <ArrowRight size={16} />
          </button>
        </footer>
      </div>

      {/* ===================== S03 승인·출력 ===================== */}
      <div
        hidden={step !== 3}
        data-screen="S03"
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-bold shadow-2xs ${reviewBadge[1]}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {reviewBadge[0]}
              </span>
              <span className="text-xs font-medium text-slate-400">
                문서 버전 {doc.document_revision} · {doc.pages.length}쪽 구성
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              확인한 내용을 승인하고 내려받으세요
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              저장된 내용과 PDF 배치를 검사한 결과를 살펴본 뒤, 직접 승인하고
              다운로드합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={button}
              disabled={work.busy}
              onClick={() => void work.refresh()}
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#007A78]" />
              문서 상태 새로고침
            </button>
            <button
              type="button"
              className={button}
              disabled={work.blocked}
              onClick={onClose}
            >
              작업 종료
            </button>
          </div>
        </div>
        {step === 3 && statusBlocks}
        {work.dirty && (
          <Banner tone="warn">
            저장하지 않은 변경이 있습니다. 초안 편집으로 돌아가 먼저 저장해
            주세요.
          </Banner>
        )}

        <div className="approval-layout">
          {/* 왼쪽: 미리보기 */}
          <section
            className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-xs sm:p-5"
            aria-label="문서 미리보기"
          >
            <div className="mb-3 flex flex-col justify-between gap-2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-2xs sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  aria-pressed={view === 'cards'}
                  onClick={() => setView('cards')}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${view === 'cards' ? 'bg-white font-bold text-[#007A78] shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  카드 보기
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'split'}
                  onClick={() => setView('split')}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${view === 'split' ? 'bg-white font-bold text-[#007A78] shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  페이지 보기
                </button>
                <span className="mr-1 rounded-full bg-[#E6F4F1] px-1.5 py-0.5 text-[9px] font-bold text-[#007A78]">
                  추천
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>
                  {previews.length
                    ? `검사한 PDF · ${layout?.actual_pages ?? previews.length}쪽`
                    : `구성 미리보기 · ${doc.pages.length}쪽 · PDF 배치 검사 전`}
                </span>
                <button
                  type="button"
                  className={`${button} inspector-toggle`}
                  onClick={() => setInspector(true)}
                >
                  검증·승인 보기
                </button>
              </div>
            </div>

            {view === 'cards' ? (
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-[#007A78]" />
                    <h3 className="text-xs font-bold text-slate-900">
                      전체 {doc.pages.length}쪽 카드 보기
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      카드를 누르면 해당 쪽을 크게 봅니다.
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${layout?.status === 'passed' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {layout
                      ? `PDF 배치 ${stateLabel[layout.status]}`
                      : 'PDF 배치 검사 전'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {doc.pages.map((item, index) => {
                    const on = reviewIndex === index
                    const issues = pageIssues(index)
                    const photos = item.blocks.filter(
                      (b) => b.type === 'image',
                    ).length
                    const evidence = item.blocks.reduce(
                      (sum, b) => sum + b.evidence_refs.length,
                      0,
                    )
                    return (
                      <button
                        type="button"
                        key={item.page_id}
                        onClick={() => previewPage(index)}
                        className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border bg-white p-3 text-left transition-all ${on ? 'border-2 border-[#007A78] bg-[#E6F4F1]/20 shadow-md ring-2 ring-[#007A78]/20' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${on ? 'bg-[#007A78] text-white' : 'bg-slate-100 text-slate-700'}`}
                            >
                              PAGE {String(index + 1).padStart(2, '0')}
                            </span>
                            <span
                              className={`flex items-center gap-0.5 text-[10px] font-semibold ${issues.length ? 'text-amber-700' : validation ? 'text-emerald-700' : 'text-slate-400'}`}
                            >
                              {issues.length ? (
                                <>
                                  <AlertTriangle className="h-3 w-3" /> 확인{' '}
                                  {issues.length}건
                                </>
                              ) : validation ? (
                                <>
                                  <Check className="h-3 w-3" /> 문제 없음
                                </>
                              ) : (
                                '검사 전'
                              )}
                            </span>
                          </div>
                          <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {previews[index] ? (
                              <img
                                className="aspect-[210/297] w-full object-contain"
                                alt={`검사한 PDF ${index + 1}쪽`}
                                src={assetUrl(previews[index])}
                              />
                            ) : (
                              <div
                                data-review-card={item.page_id}
                                className="aspect-[210/297] overflow-hidden p-3"
                              >
                                {item.blocks[0]?.type !== 'heading' && (
                                  <p className="mb-2 line-clamp-2 text-xs font-bold text-slate-900">
                                    {item.title}
                                  </p>
                                )}
                                {item.blocks.slice(0, 4).map((block) => (
                                  <p
                                    key={block.block_id}
                                    className="mb-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500"
                                  >
                                    {blockText(block) || blockLabel[block.type]}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="truncate text-xs font-bold text-slate-900">
                              {item.title}
                            </h4>
                            <p className="line-clamp-1 text-[10px] text-slate-500">
                              {previews[index]
                                ? '실제 PDF 배치 검사 결과'
                                : '저장된 초안 구성'}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-100 bg-slate-50 p-1.5 text-center">
                            {(
                              [
                                ['블록', item.blocks.length],
                                ['사진', photos],
                                ['근거', evidence],
                              ] as const
                            ).map(([name, value]) => (
                              <div key={name} className="flex flex-col">
                                <span className="text-[8px] text-slate-400">
                                  {name}
                                </span>
                                <span className="text-[10px] font-bold text-[#007A78]">
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                          <span className="text-slate-400">{index + 1}쪽</span>
                          <span
                            className={`font-bold ${on ? 'text-[#007A78]' : 'text-slate-500'}`}
                          >
                            {on ? '선택됨 ✓' : '보기'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
                  <span>
                    {validation
                      ? `내용 검증 ${stateLabel[validation.status]} · 확인할 문제 ${openIssues.length}건`
                      : '내용 검증과 PDF 배치 검사는 오른쪽 패널에서 실행합니다.'}
                  </span>
                  <button
                    type="button"
                    className="cursor-pointer font-bold text-[#007A78] hover:underline"
                    onClick={() => previewPage(reviewIndex)}
                  >
                    {reviewIndex + 1}쪽 상세 미리보기로 이동 →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-5 w-5 shrink-0 text-[#007A78]" />
                    <div className="flex min-w-0 flex-col">
                      <h2 className="truncate text-xs font-bold text-slate-900">
                        {doc.title}
                      </h2>
                      <span className="text-[10px] text-slate-400">
                        문서 버전 {doc.document_revision} ·{' '}
                        {previews.length
                          ? '실제 PDF 배치 검사 결과'
                          : '저장된 초안 구성'}
                      </span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-2xs">
                    <button
                      type="button"
                      aria-label="이전 쪽"
                      disabled={reviewIndex <= 0}
                      onClick={() => previewPage(reviewIndex - 1)}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-1 text-xs font-semibold text-slate-800">
                      <span className="font-bold text-[#007A78]">
                        {reviewIndex + 1}
                      </span>{' '}
                      / {previews.length || doc.pages.length}
                    </span>
                    <button
                      type="button"
                      aria-label="다음 쪽"
                      disabled={
                        reviewIndex + 1 >= (previews.length || doc.pages.length)
                      }
                      onClick={() => previewPage(reviewIndex + 1)}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="approval-split bg-slate-50/50 p-2">
                  <nav
                    className="preview-toc flex max-h-[640px] flex-col gap-1.5 overflow-y-auto rounded-lg bg-white p-1.5"
                    aria-label="미리보기 목차"
                  >
                    <h3 className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      페이지
                    </h3>
                    {(previews.length
                      ? previews
                      : doc.pages.map((p) => p.page_id)
                    ).map((id, index) => {
                      const on = reviewIndex === index
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => previewPage(index)}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-lg p-1.5 text-left transition-all ${on ? 'border-2 border-[#007A78] bg-[#E6F4F1]/60 shadow-2xs' : 'border border-slate-200 bg-white hover:bg-slate-50'}`}
                        >
                          <span
                            className={`flex h-10 w-8 shrink-0 flex-col items-center justify-center rounded border text-[9px] font-bold ${on ? 'border-[#007A78]/50 bg-white text-[#007A78]' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                          >
                            {index + 1}
                          </span>
                          <span
                            className={`min-w-0 truncate text-[11px] font-bold ${on ? 'text-[#007A78]' : 'text-slate-800'}`}
                          >
                            {doc.pages[index]?.title || 'PDF'}
                          </span>
                        </button>
                      )
                    })}
                  </nav>
                  <div className="flex min-w-0 justify-center overflow-y-auto rounded-lg bg-[#F1F5F9] p-3">
                    {previews.length ? (
                      <a
                        href={assetUrl(previews[currentPreview])}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full"
                      >
                        <img
                          className="w-full rounded-lg border border-slate-200 bg-white shadow-md"
                          alt={`검사한 PDF ${currentPreview + 1}쪽`}
                          src={assetUrl(previews[currentPreview])}
                        />
                      </a>
                    ) : (
                      page && (
                        <article
                          data-review-page={page.page_id}
                          className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-md"
                        >
                          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="truncate text-[10px] font-bold uppercase tracking-wider text-[#007A78]">
                              {doc.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              PAGE {String(currentIndex + 1).padStart(2, '0')}
                            </span>
                          </div>
                          {page.blocks[0]?.type !== 'heading' && (
                            <h3 className="mb-5 text-xl font-bold">
                              {page.title}
                            </h3>
                          )}
                          {page.blocks.map((block) => (
                            <div key={block.block_id} className="my-4">
                              {renderBlock(block)}
                            </div>
                          ))}
                        </article>
                      )
                    )}
                  </div>
                  <div className="preview-info flex flex-col gap-3 rounded-lg bg-white p-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        페이지 상세
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${pageIssues(reviewIndex).length ? 'bg-amber-50 text-amber-800' : validation ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {pageIssues(reviewIndex).length
                          ? `확인 ${pageIssues(reviewIndex).length}건`
                          : validation
                            ? '문제 없음'
                            : '검사 전'}
                      </span>
                    </div>
                    <dl className="flex flex-col gap-1.5 text-[11px]">
                      {(
                        [
                          ['현재 쪽', `${reviewIndex + 1}쪽`],
                          [
                            '표시 기준',
                            previews.length ? '실제 PDF 배치' : '저장된 초안',
                          ],
                          [
                            '근거 연결',
                            `${doc.pages[reviewIndex]?.blocks.reduce((s, b) => s + b.evidence_refs.length, 0) ?? 0}개`,
                          ],
                          [
                            '사진',
                            `${doc.pages[reviewIndex]?.blocks.filter((b) => b.type === 'image').length ?? 0}장`,
                          ],
                        ] as const
                      ).map(([name, value]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2"
                        >
                          <dt className="text-slate-500">{name}</dt>
                          <dd className="font-bold text-slate-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    {pageIssues(reviewIndex).map((issue) => (
                      <p
                        key={issue.issue_id}
                        className="rounded-lg bg-amber-50 p-2 text-[11px] leading-snug text-amber-900"
                      >
                        {issueMessageParts(issue.message).reason}
                      </p>
                    ))}
                    <div className="mt-auto flex flex-col gap-1.5 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        className={`${ghost} w-full text-[#007A78]`}
                        onClick={() => {
                          selectPage(reviewIndex)
                          navigate(2)
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        초안에서 이 페이지 수정
                      </button>
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl bg-[#E6F4F1] px-3 py-2 text-xs font-bold text-[#007A78] transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={
                          reviewIndex + 1 >=
                          (previews.length || doc.pages.length)
                        }
                        onClick={() => previewPage(reviewIndex + 1)}
                      >
                        다음 페이지 검토
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 오른쪽: 검증·승인 */}
          {inspector && step === 3 && (
            <button
              type="button"
              className="inspector-backdrop"
              aria-label="검증 승인 닫기"
              onClick={() => setInspector(false)}
            />
          )}
          <aside
            id="publication-panel"
            aria-label="검증 승인 PDF 다운로드"
            className={`${panel} document-inspector flex flex-col gap-5 p-5 ${inspector ? 'inspector-open' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">검증·승인</h2>
              <button
                type="button"
                className="inspector-toggle cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="검증 승인 패널 닫기"
                onClick={() => setInspector(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-slate-900">출력 형식</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 rounded-xl border-2 border-[#007A78] bg-[#E6F4F1]/70 p-3.5 shadow-xs">
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#007A78]">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        PDF
                      </span>
                    </span>
                    <FileText className="h-4 w-4 text-[#007A78]" />
                  </div>
                  <p className="pl-6 text-[11px] text-slate-500">
                    배포·인쇄용 (권장)
                  </p>
                </div>
                <div
                  className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5 opacity-70"
                  title="DOCX 배치 검사·승인 연결 준비 중"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full bg-slate-200" />
                      <span className="text-xs font-semibold text-slate-900">
                        DOCX
                      </span>
                    </span>
                    <FileText className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="pl-6 text-[11px] text-slate-500">
                    Word 편집용 · 준비 중
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">확인 결과</h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${!validation ? 'bg-slate-100 text-slate-600' : blockers.length ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}
                >
                  {!validation ? (
                    '검사 전'
                  ) : (
                    <>
                      {blockers.length ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      필수 문제 {blockers.length}개 · 미확인 경고{' '}
                      {warnings.length}개
                    </>
                  )}
                </span>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50 p-2">
                {(
                  [
                    [
                      '내용 검증',
                      validation
                        ? `${stateLabel[validation.status]}${validation.agent_called ? ' · AI 의미 검증 포함' : ''}`
                        : '필수 내용·수치·근거·사진 설명을 검사합니다.',
                      validation?.status,
                      '내용 검증 실행',
                      () => void work.validate(),
                    ],
                    [
                      'PDF 배치 검사',
                      layout
                        ? `${stateLabel[layout.status]}${layout.actual_pages ? ` · 실제 ${layout.actual_pages}쪽` : ''}${layout.actual_pages && layout.actual_pages !== doc.target_pages ? ` (목표 ${doc.target_pages}쪽)` : ''}`
                        : '글 넘침·빈 페이지·사진 배치를 실제 PDF로 검사합니다.',
                      layout?.status,
                      'PDF 배치 검사',
                      () => void work.checkLayout(),
                    ],
                  ] as const
                ).map(([name, text, status, action, run]) => (
                  <div
                    key={name}
                    className="flex items-start gap-2.5 px-1 py-2.5"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${status === 'passed' ? 'bg-emerald-100 text-emerald-800' : status === 'failed' || status === 'needs_review' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-500'}`}
                    >
                      {status === 'passed' ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : status === 'pending' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {name}
                        </span>
                        {status && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${stateTone[status]}`}
                          >
                            {stateLabel[status]}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-600">{text}</span>
                      <button
                        type="button"
                        className={`${button} mt-1 self-start`}
                        disabled={work.actionBlocked}
                        onClick={run}
                      >
                        {action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!!work.issues.length && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-slate-900">
                  확인할 문제와 경고 ({work.issues.length})
                </h3>
                {work.issues.map((issue) => (
                  <article
                    key={issue.issue_id}
                    data-issue-code={issue.code}
                    className={`rounded-xl border p-3 text-xs ${issue.status !== 'open' ? 'border-slate-200 bg-slate-50 text-slate-500' : issue.severity === 'blocker' ? 'border-red-200 bg-red-50/60' : issue.severity === 'warning' ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'}`}
                  >
                    <p className="flex flex-wrap items-center gap-1.5 font-bold">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${issue.severity === 'blocker' ? 'bg-red-100 text-red-800' : issue.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {issue.severity === 'blocker'
                          ? '필수 수정'
                          : issue.severity === 'warning'
                            ? '경고'
                            : '안내'}
                      </span>
                      <span>{stateLabel[issue.status]}</span>
                      {issue.layout_format && (
                        <span className="text-slate-400">
                          · {issue.layout_format.toUpperCase()}
                        </span>
                      )}
                    </p>
                    <div className="mt-3">
                      <p className="font-bold text-slate-900">지적 이유</p>
                      <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">
                        {issueMessageParts(issue.message).reason}
                      </p>
                    </div>
                    <div
                      className="mt-2 flex flex-col gap-2"
                      data-issue-locations
                    >
                      {doc.pages.flatMap((page, pi) =>
                        page.blocks
                          .filter((block) =>
                            issue.block_ids.includes(block.block_id),
                          )
                          .map((block) => (
                            <button
                              type="button"
                              key={block.block_id}
                              className="rounded-lg border border-current/15 bg-white p-2 text-left hover:bg-slate-50"
                              onClick={() => {
                                navigate(2)
                                selectPage(pi)
                                focusBlock(block.block_id)
                              }}
                            >
                              <span className="block font-bold">
                                {pi + 1}쪽 · 블록{' '}
                                {page.blocks.indexOf(block) + 1} ·{' '}
                                {blockLabel[block.type]} 수정하기 →
                              </span>
                              <span className="mt-1 block text-[11px] text-slate-500">
                                {page.title} · 검사 대상 문구
                              </span>
                              <span className="mt-2 block max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-md border-l-2 border-amber-400 bg-amber-50/60 p-2 leading-relaxed text-slate-800">
                                {blockText(block) ||
                                  '텍스트가 없는 블록입니다.'}
                              </span>
                            </button>
                          )),
                      )}
                      {!doc.pages.some((page) =>
                        page.blocks.some((block) =>
                          issue.block_ids.includes(block.block_id),
                        ),
                      ) && (
                        <p className="text-[11px] text-slate-600">
                          문서 전체 검사 · 특정 문장 위치가 지정되지 않았습니다.
                        </p>
                      )}
                      {issue.code === 'REQUIRED_MISSING' && (
                        <button
                          type="button"
                          className={button}
                          onClick={() => navigate(1)}
                        >
                          자료 점검에서 근거 확인하기 →
                        </button>
                      )}
                    </div>
                    {issueMessageParts(issue.message).action && (
                      <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50 p-2.5 text-slate-800">
                        <p className="font-bold text-teal-900">권장 수정</p>
                        <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">
                          {issueMessageParts(issue.message).action}
                        </p>
                      </div>
                    )}
                    {issueMessageParts(issue.message).evidence && (
                      <details className="mt-3 border-t border-current/10 pt-2 text-slate-600">
                        <summary className="cursor-pointer font-semibold">
                          판단에 사용한 원문 근거 펼치기
                        </summary>
                        <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-white p-2 text-[11px] leading-relaxed">
                          {issueMessageParts(issue.message).evidence}
                        </p>
                      </details>
                    )}
                    {issue.resolution?.reason && (
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        확인 사유: {issue.resolution.reason}
                      </p>
                    )}
                    {canAcknowledge(issue, initial.demo) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                          aria-label={`경고 확인 사유 ${issue.issue_id}`}
                          placeholder="경고를 확인한 사유를 입력하세요"
                          value={reasons[issue.issue_id] || ''}
                          disabled={work.actionBlocked}
                          onChange={(e) =>
                            setReasons((old) => ({
                              ...old,
                              [issue.issue_id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className={button}
                          disabled={
                            work.actionBlocked ||
                            !validation ||
                            ['pending', 'failed'].includes(validation.status) ||
                            !reasons[issue.issue_id]?.trim()
                          }
                          onClick={() =>
                            void work.acknowledge(
                              issue,
                              reasons[issue.issue_id],
                            )
                          }
                        >
                          경고 확인 기록
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
            {layout &&
              (layout.findings.length ||
                layout.warnings.length ||
                !layout.publication_policy_ok) && (
                <div className="flex flex-col gap-1.5 text-xs">
                  {layout.findings.map((finding, i) => (
                    <p
                      key={i}
                      className="rounded-lg bg-red-50 p-2 text-red-800"
                    >
                      {finding.message}
                    </p>
                  ))}
                  {layout.warnings.map((warning, i) => (
                    <p
                      key={i}
                      className="rounded-lg bg-amber-50 p-2 text-amber-900"
                    >
                      {warning}
                    </p>
                  ))}
                  {!layout.publication_policy_ok && (
                    <p className="rounded-lg bg-red-50 p-2 text-red-800">
                      사용한 사진의 공개 허가가 확인되지 않았습니다. 해당 사진을
                      제외하거나 자료 담당자에게 확인해 주세요.
                    </p>
                  )}
                </div>
              )}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
              <label
                className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${work.canApprove ? 'cursor-pointer border-slate-200 bg-slate-50 hover:bg-slate-100' : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70'}`}
              >
                <input
                  aria-label="PDF 최종 승인 동의"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#007A78]"
                  checked={work.confirmed}
                  disabled={!work.canApprove}
                  onChange={(e) => work.setConfirmed(e.target.checked)}
                />
                <span className="select-none text-xs font-bold leading-snug text-slate-900">
                  내용·경고·PDF 미리보기를 확인했으며 현재 저장본의 PDF 출력을
                  승인합니다.
                </span>
              </label>
              {!work.canApprove && !work.approved && (
                <p className="text-[11px] leading-relaxed text-slate-500">
                  내용 검증과 PDF 배치 검사를 모두 통과하고 열린 경고를 확인해야
                  승인할 수 있습니다. 동의 체크만으로 승인 조건을 우회할 수
                  없습니다.
                </p>
              )}
              {work.approved && (
                <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={16} />
                  현재 문서의 PDF 승인이 완료되었습니다. 아래에서 파일을
                  준비하고 내려받으세요.
                </p>
              )}
              <div className="flex items-center gap-2.5 rounded-xl border border-blue-200/80 bg-blue-50 p-3 text-blue-900">
                <Info className="h-4 w-4 shrink-0 text-blue-700" />
                <p className="text-[11px] leading-relaxed">
                  내용이나 사진을 바꾸면 검사와 승인이 해제되므로 다시 확인하고
                  승인해 주세요. 승인 뒤에는 이전 다운로드가 무효가 됩니다.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <footer className="screen-dock">
          <button type="button" className={ghost} onClick={() => navigate(2)}>
            <ArrowLeft size={16} />
            초안 편집
          </button>
          <p className="dock-hint flex items-center justify-center gap-2 font-semibold text-slate-700">
            <span
              className={`h-2 w-2 rounded-full ${work.approved ? 'bg-[#007A78]' : 'bg-slate-300'}`}
            />
            {work.approved
              ? '승인 완료 · PDF를 준비한 뒤 다운로드하세요.'
              : validation?.status === 'passed' && layout?.status === 'passed'
                ? '검사 통과 · 동의 체크 후 최종 승인할 수 있습니다.'
                : '내용 검증과 PDF 배치 검사 후 승인할 수 있습니다.'}
          </p>
          <button
            type="button"
            className={cta}
            disabled={!work.canApprove || !work.confirmed || work.approved}
            onClick={() => void work.approve()}
          >
            <ShieldCheck className="h-4 w-4" />
            현재 PDF 최종 승인
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={primary}
              disabled={work.actionBlocked || !work.approved}
              onClick={() => void work.exportPdf()}
            >
              {work.watch ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              승인된 PDF 준비
            </button>
            <button
              type="button"
              className={primary}
              disabled={
                work.actionBlocked ||
                !work.approved ||
                !work.saved.exportId ||
                work.saved.approvalId !== work.result?.approval?.approval_id
              }
              onClick={() => void work.download()}
            >
              <Download className="h-4 w-4" />
              PDF 다운로드
            </button>
          </div>
        </footer>
      </div>

      {discard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="미저장 편집 취소"
            className="max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="font-bold">작성 중인 문구를 버릴까요?</h3>
            <p className="mt-3 text-sm text-slate-600">
              현재 편집란의 미저장 변경을 지우고 최신 서버 문서를 불러옵니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={button}
                onClick={() => setDiscard(false)}
              >
                취소
              </button>
              <button
                type="button"
                className={primary}
                onClick={() => {
                  setDiscard(false)
                  void work.refresh(true)
                }}
              >
                최신 저장본 불러오기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
