import { useEffect, useRef, useState } from 'react'
import { sourceApi, SourceApiError } from '../api/sources'
import type {
  ReadingJob,
  SourceBrief,
  SourceSession,
  WorkSource,
} from '../api/sources'

const STORAGE = 'ddalgi.sources.v1'
const UPLOAD = `${STORAGE}.upload`
const INITIAL_BRIEF: SourceBrief = {
  purpose: '신규 고객 소개 (표준 제안용)',
  emphasis: [],
  direction: 'balanced',
  target_pages: 4,
  photo_preference: 'balanced',
}
type Saved = { sessionId: string; jobs: string[] }
type UploadAttempt = { sessionId: string; fingerprint: string; key: string }

function readSaved(): Saved | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE) || 'null')
    if (saved?.sessionId === 'session-demo-standalone') {
      forget()
      return null
    }
    return saved &&
      typeof saved.sessionId === 'string' &&
      Array.isArray(saved.jobs)
      ? {
          sessionId: saved.sessionId,
          jobs: saved.jobs.filter((id: unknown) => typeof id === 'string'),
        }
      : null
  } catch {
    return null
  }
}

function persist(sessionId: string, jobs: string[]) {
  // 본문·파일·인증 쿠키는 브라우저 저장소에 복사하지 않는다.
  sessionStorage.setItem(STORAGE, JSON.stringify({ sessionId, jobs }))
}

function forget() {
  sessionStorage.removeItem(STORAGE)
  sessionStorage.removeItem(UPLOAD)
  sessionStorage.removeItem(`${STORAGE}.ai`)
  sessionStorage.removeItem(`${STORAGE}.publication`)
}

const reading = (source: WorkSource) =>
  ['queued', 'reading'].includes(source.parse_status)
const running = (job: ReadingJob) => ['queued', 'running'].includes(job.status)

async function snapshot(id: string, jobIds: string[]) {
  const session = await sourceApi.session(id)
  if (session.status !== 'active')
    throw new SourceApiError(
      '작업이 종료되었거나 만료되었습니다. 새 작업을 시작해 주세요.',
      410,
    )
  const [registered, attached, jobs] = await Promise.all([
    sourceApi.registered(session.demo),
    sourceApi.attached(id),
    Promise.all(jobIds.map((job) => sourceApi.job(id, job))),
  ])
  return { session, sources: [...registered.items, ...attached.items], jobs }
}

async function fingerprint(files: File[]) {
  const parts = await Promise.all(
    files.map(async (file) => {
      const hash = await crypto.subtle.digest(
        'SHA-256',
        await file.arrayBuffer(),
      )
      return [
        file.name,
        file.type,
        file.size,
        Array.from(new Uint8Array(hash), (n) =>
          n.toString(16).padStart(2, '0'),
        ).join(''),
      ]
    }),
  )
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(parts)),
  )
  return Array.from(new Uint8Array(digest), (n) =>
    n.toString(16).padStart(2, '0'),
  ).join('')
}

export function useSources() {
  const [session, setSession] = useState<SourceSession | null>(null)
  const [demo, setDemo] = useState(true)
  const [sources, setSources] = useState<WorkSource[]>([])
  const [jobs, setJobs] = useState<ReadingJob[]>([])
  const [brief, setBrief] = useState<SourceBrief>(INITIAL_BRIEF)
  const [busy, setBusy] = useState('작업 확인 중')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [polling, setPolling] = useState(true)
  const [pendingUpload, setPendingUpload] = useState(false)
  const lock = useRef(false)
  const mounted = useRef(false)
  const createAttempt = useRef<{ body: string; key: string } | null>(null)
  const pendingFiles = useRef<File[]>([])
  const attempts = useRef(0)
  const generation = useRef(0)

  function clear() {
    forget()
    setSession(null)
    setSources([])
    setJobs([])
    setPendingUpload(false)
    pendingFiles.current = []
    createAttempt.current = null
  }

  function apply(value: Awaited<ReturnType<typeof snapshot>>) {
    const active = value.jobs.filter(running)
    persist(
      value.session.session_id,
      active.map((job) => job.job_id),
    )
    setSession(value.session)
    setSources(value.sources)
    setJobs(value.jobs)
  }

  useEffect(() => {
    let cancelled = false
    mounted.current = true
    const saved = readSaved()
    async function restore() {
      try {
        if (saved) {
          const value = await snapshot(saved.sessionId, saved.jobs)
          if (cancelled) return
          persist(
            saved.sessionId,
            value.jobs.filter(running).map((job) => job.job_id),
          )
          setSession(value.session)
          setSources(value.sources)
          setJobs(value.jobs)
          setBrief(value.session.brief)
          setPendingUpload(!!sessionStorage.getItem(UPLOAD))
          setNotice('서버에 저장된 자료와 선택 상태를 불러왔습니다.')
        }
      } catch (cause) {
        if (cancelled) return
        if (
          cause instanceof SourceApiError &&
          [401, 403, 404, 410].includes(cause.status)
        )
          forget()
        setError(
          cause instanceof Error
            ? cause.message
            : '작업을 불러오지 못했습니다.',
        )
      } finally {
        if (!cancelled) setBusy('')
      }
    }
    void restore()
    return () => {
      cancelled = true
      mounted.current = false
    }
  }, [])

  // 파일 읽기 상태만 조회한다. 점검/초안 생성(LLM)은 여기서 호출하지 않는다.
  useEffect(() => {
    if (
      !session ||
      busy ||
      !polling ||
      (!jobs.some(running) && !sources.some(reading))
    )
      return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      if (lock.current) return
      const requestGeneration = generation.current
      try {
        if (++attempts.current > 90) {
          setPolling(false)
          setNotice(
            '읽기가 오래 걸리고 있습니다. 상태 새로고침으로 다시 확인해 주세요.',
          )
          return
        }
        const value = await snapshot(
          session.session_id,
          jobs.filter(running).map((job) => job.job_id),
        )
        if (
          cancelled ||
          lock.current ||
          requestGeneration !== generation.current
        )
          return
        persist(
          value.session.session_id,
          value.jobs.filter(running).map((job) => job.job_id),
        )
        setSession(value.session)
        setSources(value.sources)
        setJobs(value.jobs)
        const failed = value.jobs.find(
          (job) => job.status === 'failed' || job.status === 'cancelled',
        )
        if (failed)
          setError(
            failed.error?.message ||
              '파일 읽기가 중단되었습니다. 자료별 상태를 확인해 주세요.',
          )
      } catch (cause) {
        if (!cancelled) {
          setPolling(false)
          setError(
            cause instanceof Error
              ? cause.message
              : '읽기 상태를 확인하지 못했습니다.',
          )
          if (
            cause instanceof SourceApiError &&
            [401, 410].includes(cause.status)
          ) {
            forget()
            setSession(null)
            setSources([])
            setJobs([])
            setPendingUpload(false)
          }
        }
      }
    }, 1000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [session, sources, jobs, busy, polling])

  async function run(label: string, action: () => Promise<void>) {
    if (lock.current) return
    lock.current = true
    generation.current++
    setBusy(label)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (cause) {
      if (!mounted.current) return
      setError(
        cause instanceof Error ? cause.message : '요청을 처리하지 못했습니다.',
      )
      if (cause instanceof SourceApiError && [401, 410].includes(cause.status))
        clear()
      else if (
        cause instanceof SourceApiError &&
        cause.status === 409 &&
        session
      ) {
        // 충돌 시 오래된 체크 상태를 재전송하지 않고 최신 상태를 보여준다.
        try {
          apply(await snapshot(session.session_id, readSaved()?.jobs || []))
        } catch {
          /* 최초 충돌 오류를 유지한다. 사용자가 명시적으로 새로고침한다. */
        }
        setNotice(
          '다른 화면에서 작업이 변경되었습니다. 최신 자료 선택을 확인한 뒤 다시 선택해 주세요. 작성 중인 조건은 유지했습니다.',
        )
      }
    } finally {
      lock.current = false
      if (mounted.current) setBusy('')
    }
  }

  async function start() {
    await run('작업 시작 중', async () => {
      const saved = readSaved()
      if (saved) {
        const value = await snapshot(saved.sessionId, saved.jobs)
        apply(value)
        setBrief(value.session.brief)
        setPendingUpload(!!sessionStorage.getItem(UPLOAD))
        return
      }
      if (!brief.purpose.trim()) throw new Error('사용 목적을 입력해 주세요.')
      const body = JSON.stringify({ brief, demo })
      if (createAttempt.current?.body !== body)
        createAttempt.current = { body, key: crypto.randomUUID() }
      const value = await sourceApi.create(
        brief,
        createAttempt.current.key,
        demo,
      )
      persist(value.session_id, [])
      setSession(value)
      setBrief(value.brief)
      apply(await snapshot(value.session_id, []))
      setNotice('작업을 시작했습니다. 자료를 첨부해 주세요.')
    })
  }

  async function refresh() {
    await run('상태 확인 중', async () => {
      const saved = readSaved()
      if (!saved) return
      const value = await snapshot(saved.sessionId, saved.jobs)
      apply(value)
      attempts.current = 0
      setPolling(true)
      setNotice('서버의 최신 상태를 불러왔습니다.')
    })
  }

  async function upload(files: File[]) {
    if (!session || !files.length) return
    await run('파일 업로드 중', async () => {
      if (session.document_summary)
        throw new Error(
          '이미 초안이 있는 작업의 자료 변경은 후속 연결이 필요합니다.',
        )
      if (
        files.some(
          (file) => !/\.(txt|md|pdf|docx|pptx|jpe?g|png)$/i.test(file.name),
        )
      )
        throw new Error(
          'TXT, MD, PDF, DOCX, PPTX, JPG, PNG 파일을 선택해 주세요.',
        )
      if (files.some((file) => file.size > 10 * 1024 * 1024))
        throw new Error('파일당 최대 10MB까지 첨부할 수 있습니다.')
      // 응답 유실 재전송은 개수 제한 검사보다 먼저 구분한다.
      const signature = await fingerprint(files)
      const previous = JSON.parse(
        sessionStorage.getItem(UPLOAD) || 'null',
      ) as UploadAttempt | null
      if (
        previous &&
        (previous.sessionId !== session.session_id ||
          previous.fingerprint !== signature)
      )
        throw new Error(
          '이전 업로드의 결과가 아직 확인되지 않았습니다. 같은 파일을 다시 선택해 재시도하거나 작업을 종료해 주세요.',
        )
      if (
        !previous &&
        sources.filter((source) => source.scope === 'session').length +
          files.length >
          10
      )
        throw new Error('이번 작업에는 최대 10개까지 첨부할 수 있습니다.')
      const attempt = previous || {
        sessionId: session.session_id,
        fingerprint: signature,
        key: crypto.randomUUID(),
      }
      sessionStorage.setItem(UPLOAD, JSON.stringify(attempt))
      pendingFiles.current = files
      setPendingUpload(true)
      let result
      try {
        result = await sourceApi.upload(session.session_id, files, attempt.key)
      } catch (cause) {
        if (
          cause instanceof SourceApiError &&
          cause.status >= 400 &&
          cause.status < 500 &&
          ![408, 429].includes(cause.status)
        ) {
          sessionStorage.removeItem(UPLOAD)
          setPendingUpload(false)
          pendingFiles.current = []
        }
        throw cause
      }
      const jobIds = [...new Set([...(readSaved()?.jobs || []), result.job_id])]
      persist(session.session_id, jobIds)
      sessionStorage.removeItem(UPLOAD)
      setPendingUpload(false)
      pendingFiles.current = []
      apply(await snapshot(session.session_id, jobIds))
      attempts.current = 0
      setPolling(true)
      setNotice(
        '파일을 첨부했습니다. 읽기 상태를 확인하고 사용할 자료를 직접 선택해 주세요.',
      )
    })
  }

  async function select(source: WorkSource) {
    if (!session || session.document_summary) return
    await run('자료 선택 저장 중', async () => {
      const selected = session.selected_source_ids.includes(source.source_id)
        ? session.selected_source_ids.filter((id) => id !== source.source_id)
        : [...session.selected_source_ids, source.source_id]
      const result = await sourceApi.inputs(
        session,
        { selected_source_ids: selected },
        crypto.randomUUID(),
      )
      setSession({ ...session, ...result })
      setNotice('자료 선택을 서버에 저장했습니다.')
    })
  }

  async function saveBrief() {
    if (!session || session.document_summary) return
    await run('작성 조건 저장 중', async () => {
      if (!brief.purpose.trim()) throw new Error('사용 목적을 입력해 주세요.')
      const result = await sourceApi.inputs(
        session,
        { brief },
        crypto.randomUUID(),
      )
      setSession({ ...session, ...result, brief })
      setNotice('작성 조건을 서버에 저장했습니다.')
    })
  }

  async function remove(source: WorkSource) {
    if (!session || session.document_summary) return
    await run('첨부 삭제 중', async () => {
      await sourceApi.remove(session, source.source_id)
      apply(await snapshot(session.session_id, readSaved()?.jobs || []))
      setNotice('첨부를 삭제했습니다. 선택 목록에서도 제외되었습니다.')
    })
  }

  async function close() {
    if (!session) return
    await run('작업 종료 중', async () => {
      const result = await sourceApi.close(session.session_id)
      clear()
      setBrief(INITIAL_BRIEF)
      setNotice(
        result.cleanup === 'done'
          ? '작업을 종료하고 임시 자료를 정리했습니다.'
          : '작업을 종료했습니다. 서버에서 임시 파일 정리를 재시도하고 있습니다.',
      )
    })
  }

  return {
    session,
    demo,
    setDemo,
    sources,
    jobs,
    brief,
    setBrief,
    busy,
    error,
    notice,
    pendingUpload,
    start,
    refresh,
    upload,
    select,
    saveBrief,
    remove,
    close,
    retryUpload: () => upload(pendingFiles.current),
    hasPendingFiles: () => pendingFiles.current.length > 0,
    briefDirty:
      !!session && JSON.stringify(brief) !== JSON.stringify(session.brief),
  }
}
