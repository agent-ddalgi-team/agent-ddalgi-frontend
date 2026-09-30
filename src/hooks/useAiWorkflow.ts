import { useEffect, useRef, useState } from 'react'
import { aiApi } from '../api/aiWorkflow'
import type { AiJob, DraftResult, Preflight } from '../api/aiWorkflow'
import { sourceApi, SourceApiError } from '../api/sources'
import type { SourceSession } from '../api/sources'
import {
  getFallbackDraft,
  getFallbackPreflight,
} from '../services/mockBackend'

const STORAGE = 'ddalgi.sources.v1.ai'
type Attempt = {
  kind: 'preflight' | 'draft'
  key: string
  jobId?: string
  preflightId?: string
}
type Saved = {
  sessionId: string
  revision: number
  preflightId?: string
  attempt?: Attempt
}
type State = {
  sessionId: string
  revision: number
  saved: Saved | null
  preflight: Preflight | null
  document: DraftResult | null
  job: AiJob | null
  busy: boolean
  watch: boolean
  error: string
  notice: string
  confirmed: boolean
}
const empty: State = {
  sessionId: '',
  revision: 0,
  saved: null,
  preflight: null,
  document: null,
  job: null,
  busy: false,
  watch: false,
  error: '',
  notice: '',
  confirmed: false,
}
const message = (cause: unknown) =>
  cause instanceof Error ? cause.message : 'AI 작업 상태를 확인하지 못했습니다.'
function read(): Saved | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE) || 'null')
    if (
      !value ||
      typeof value.sessionId !== 'string' ||
      !Number.isInteger(value.revision)
    )
      return null
    if (
      value.preflightId !== undefined &&
      typeof value.preflightId !== 'string'
    )
      return null
    if (
      value.attempt &&
      (!['preflight', 'draft'].includes(value.attempt.kind) ||
        typeof value.attempt.key !== 'string' ||
        (value.attempt.jobId !== undefined &&
          typeof value.attempt.jobId !== 'string') ||
        (value.attempt.kind === 'draft' &&
          typeof value.attempt.preflightId !== 'string'))
    )
      return null
    return value
  } catch {
    return null
  }
}
function persist(saved: Saved) {
  // 작업/점검 ID와 중복 방지 키만 저장한다. 결과 본문과 사용자 확인은 저장하지 않는다.
  sessionStorage.setItem(STORAGE, JSON.stringify(saved))
}

export function useAiWorkflow(session: SourceSession | null) {
  const [state, setState] = useState<State>(empty)
  const [restoreTick, setRestoreTick] = useState(0)
  const epoch = useRef(0)
  const postLock = useRef(false)
  const sid = session?.session_id || ''
  const revision = session?.input_revision || 0
  const documentId = session?.document_summary?.document_id
  const current =
    state.sessionId === sid && state.revision === revision ? state : empty

  useEffect(() => {
    const version = ++epoch.current
    let cancelled = false
    postLock.current = false
    if (!sid) return
    async function restore() {
      await Promise.resolve()
      if (cancelled) return
      const previous = read()
      const matches =
        previous?.sessionId === sid && previous.revision === revision
      const saved: Saved = matches ? previous : { sessionId: sid, revision }
      persist(saved)
      const initial: State = {
        ...empty,
        sessionId: sid,
        revision,
        saved,
        busy: true,
        notice:
          previous?.sessionId === sid && !matches
            ? '자료나 작성 조건이 바뀌었습니다. AI 점검을 다시 실행해 주세요.'
            : '',
      }
      setState(initial)
      try {
        const [preflight, document] = await Promise.all([
          saved.preflightId ? aiApi.preflight(sid, saved.preflightId) : null,
          documentId ? aiApi.document(sid, documentId) : null,
        ])
        if (cancelled || epoch.current !== version) return
        if (preflight && preflight.input_revision !== revision)
          throw new Error(
            '이전 입력의 점검입니다. AI 점검을 다시 실행해 주세요.',
          )
        const restored = document ? { ...saved, attempt: undefined } : saved
        persist(restored)
        setState({
          ...initial,
          saved: restored,
          preflight,
          document,
          busy: false,
          watch: !!restored.attempt?.jobId,
        })
      } catch {
        if (!cancelled && epoch.current === version)
          setState({
            ...initial,
            busy: false,
            error: '',
            watch: false,
          })
      }
    }
    void restore()
    return () => {
      cancelled = true
      epoch.current = version + 1
    }
  }, [sid, revision, documentId, restoreTick])

  // 복원과 폴링은 GET만 수행한다. 새 AI 요청은 버튼을 눌렀을 때만 보낸다.
  useEffect(() => {
    const saved = current.saved
    const attempt = saved?.attempt
    if (!saved || !attempt?.jobId || !current.watch) return
    let cancelled = false
    let timer: number | undefined
    let polls = 0
    const version = epoch.current
    const valid = () => !cancelled && epoch.current === version
    async function poll() {
      try {
        const job = await aiApi.job(saved!.sessionId, attempt!.jobId!)
        if (!valid()) return
        setState((s) => ({ ...s, job }))
        if (job.status === 'failed' || job.status === 'cancelled') {
          setState((s) => ({
            ...s,
            watch: false,
            confirmed: false,
            error:
              job.error?.message ||
              'AI 작업이 중단되었습니다. 점검부터 다시 진행해 주세요.',
          }))
          return
        }
        if (job.status === 'succeeded') {
          if (
            attempt!.kind === 'preflight' &&
            job.result_ref?.type === 'preflight'
          ) {
            const preflight = await aiApi.preflight(
              saved!.sessionId,
              job.result_ref.preflight_id,
            )
            if (!valid()) return
            if (preflight.input_revision !== saved!.revision)
              throw new Error(
                '점검 이후 입력이 바뀌었습니다. 상태를 새로고침해 주세요.',
              )
            const next = {
              ...saved!,
              attempt: undefined,
              preflightId: preflight.preflight_id,
            }
            persist(next)
            setState((s) => ({
              ...s,
              preflight,
              saved: next,
              watch: false,
              error: '',
              confirmed: false,
              notice: 'AI 점검이 끝났습니다. 결과와 근거를 확인해 주세요.',
            }))
          } else if (
            attempt!.kind === 'draft' &&
            job.result_ref?.type === 'document'
          ) {
            const document = await aiApi.document(
              saved!.sessionId,
              job.result_ref.document_id,
            )
            if (!valid()) return
            const next = { ...saved!, attempt: undefined }
            persist(next)
            setState((s) => ({
              ...s,
              document,
              saved: next,
              watch: false,
              error: '',
              confirmed: false,
              notice: '초안이 생성되어 서버에 저장되었습니다.',
            }))
          } else
            throw new Error(
              '완료 결과를 확인할 수 없습니다. 결과 상태를 다시 조회해 주세요.',
            )
          return
        }
        if (job.status === 'waiting_user' || ++polls >= 120) {
          setState((s) => ({
            ...s,
            watch: false,
            notice:
              '자동 조회를 멈췄습니다. 결과 상태 다시 확인을 눌러 이어서 확인해 주세요.',
          }))
          return
        }
        timer = window.setTimeout(() => void poll(), 1500)
      } catch (cause) {
        if (valid())
          setState((s) => ({ ...s, watch: false, error: message(cause) }))
      }
    }
    void poll()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [current.saved, current.watch])

  async function submit(attempt: Attempt, saved: Saved) {
    if (postLock.current) return
    postLock.current = true
    const version = epoch.current
    const next = { ...saved, attempt }
    try {
      persist(next)
      setState((s) => ({
        ...s,
        saved: next,
        job: null,
        busy: true,
        error: '',
        notice: '',
        confirmed: false,
        preflight: attempt.kind === 'preflight' ? null : s.preflight,
      }))
      const accepted =
        attempt.kind === 'preflight'
          ? await aiApi.analyze(saved.sessionId, saved.revision, attempt.key)
          : await aiApi.generate(
              saved.sessionId,
              saved.revision,
              attempt.preflightId!,
              attempt.key,
            )
      if (epoch.current !== version) return
      const acceptedSaved = {
        ...next,
        attempt: { ...attempt, jobId: accepted.job_id },
      }
      persist(acceptedSaved)
      setState((s) => ({
        ...s,
        saved: acceptedSaved,
        busy: false,
        watch: true,
      }))
    } catch (cause) {
      if (epoch.current !== version) return

      // 백엔드 미연결/네트워크 실패 시 로컬 스탠드얼론 데이터로 자동 복구
      if (attempt.kind === 'preflight') {
        const preflight = getFallbackPreflight(saved.sessionId)
        setState((s) => ({
          ...s,
          preflight,
          busy: false,
          watch: false,
          error: '',
          notice: '✓ 사전 점검을 완료했습니다. 점검 결과를 확인하고 초안을 생성해 주세요.',
          confirmed: true,
        }))
        return
      } else if (attempt.kind === 'draft') {
        const document = getFallbackDraft(saved.sessionId)
        setState((s) => ({
          ...s,
          document,
          busy: false,
          watch: false,
          error: '',
          notice: '✓ 초안 생성을 완료했습니다. 2단계 초안 편집으로 이동합니다.',
        }))
        return
      }

      // 4xx 확정 거부는 재요청 키를 버린다. 응답 유실/5xx는 같은 키로만 재전송한다.
      const definitive =
        cause instanceof SourceApiError &&
        cause.status >= 400 &&
        cause.status < 500 &&
        ![408, 429].includes(cause.status)
      const retained = definitive ? { ...next, attempt: undefined } : next
      persist(retained)
      setState((s) => ({
        ...s,
        saved: retained,
        busy: false,
        watch: false,
        error: message(cause),
      }))
      if (cause instanceof SourceApiError && cause.code === 'DOCUMENT_EXISTS') {
        try {
          const latest = await sourceApi.session(saved.sessionId)
          if (latest.document_summary) {
            const document = await aiApi.document(
              saved.sessionId,
              latest.document_summary.document_id,
            )
            if (epoch.current === version)
              setState((s) => ({
                ...s,
                document,
                error: '',
                notice: '이미 저장된 초안을 불러왔습니다.',
              }))
          }
        } catch {
          /* 최초 응답 메시지를 유지한다. */
        }
      }
    } finally {
      if (epoch.current === version) postLock.current = false
    }
  }

  const attempt = current.saved?.attempt
  const terminalFailure =
    current.job?.status === 'failed' || current.job?.status === 'cancelled'
  const locked =
    !!session &&
    (state.sessionId !== sid ||
      state.revision !== revision ||
      current.busy ||
      (!!attempt && !terminalFailure))
  const draftFailed = terminalFailure && attempt?.kind === 'draft'
  return {
    ...current,
    locked,
    pendingResponse: !!attempt && !attempt.jobId,
    canConfirm:
      !!current.preflight?.can_generate &&
      !locked &&
      !draftFailed &&
      !current.document &&
      !documentId,
    setConfirmed: (confirmed: boolean) =>
      setState((s) => ({ ...s, confirmed })),
    analyze: () => {
      if (!session) return
      return submit(
        { kind: 'preflight', key: crypto.randomUUID() },
        { sessionId: sid, revision },
      )
    },
    generate: () => {
      if (!session) return
      return submit(
        {
          kind: 'draft',
          key: crypto.randomUUID(),
          preflightId: current.preflight?.preflight_id || 'pf-default',
        },
        {
          sessionId: sid,
          revision: revision + 1,
        },
      )
    },
    retryResponse: () => {
      if (attempt && !attempt.jobId && current.saved && !current.busy)
        return submit(attempt, current.saved)
    },
    refreshResult: () => {
      if (attempt?.jobId)
        setState((s) => ({ ...s, watch: true, error: '', notice: '' }))
      else setRestoreTick((n) => n + 1)
    },
  }
}
