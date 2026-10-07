import { previewStorage } from '../services/mockBackend'
import { useEffect, useRef, useState } from 'react'
import { sourceApi, SourceApiError } from '../api/sources'
import type {
  ReadingJob,
  PublicDataStatus,
  SourceBrief,
  SourceSession,
  WorkSource,
} from '../api/sources'

const STORAGE = previewStorage
const UPLOAD = `${STORAGE}.upload`
const PUBLIC_IMPORT = `${STORAGE}.public-import`
const INITIAL_BRIEF: SourceBrief = {
  purpose: '신규 고객 소개 (표준 제안용)',
  target_company: '거산케미칼',
  emphasis: [],
  direction: 'balanced',
  target_pages: 4,
  photo_preference: 'balanced',
}
type Saved = { sessionId: string; jobs: string[]; localSelected?: string[] }
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
          localSelected: Array.isArray(saved.localSelected)
            ? saved.localSelected.filter(
                (id: unknown) => typeof id === 'string',
              )
            : [],
        }
      : null
  } catch {
    return null
  }
}

function persist(
  sessionId: string,
  jobs: string[],
  localSelected: string[] = [],
) {
  // 본문·파일·인증 쿠키는 브라우저 저장소에 복사하지 않는다.
  sessionStorage.setItem(
    STORAGE,
    JSON.stringify({ sessionId, jobs, localSelected }),
  )
}

function forget() {
  sessionStorage.removeItem(STORAGE)
  sessionStorage.removeItem(UPLOAD)
  sessionStorage.removeItem(PUBLIC_IMPORT)
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

export function useSources(allowDocumentChanges = false) {
  const [session, setSession] = useState<SourceSession | null>(null)
  const [demo, setDemo] = useState(true)
  const [sources, setSources] = useState<WorkSource[]>([])
  const [jobs, setJobs] = useState<ReadingJob[]>([])
  const [brief, setBrief] = useState<SourceBrief>(INITIAL_BRIEF)
  const [busy, setBusy] = useState('작업 확인 중')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [publicStatus, setPublicStatus] = useState<PublicDataStatus | null>(
    null,
  )
  const [polling, setPolling] = useState(true)
  const [pendingUpload, setPendingUpload] = useState(false)
  const [publicStatus, setPublicStatus] = useState<{
    message: string
    status: string
  } | null>(null)
  const statusSessionId = session?.session_id
  useEffect(() => {
    let cancelled = false
    if (!statusSessionId) return
    void sourceApi
      .publicStatus(statusSessionId)
      .then((value) => {
        if (!cancelled) setPublicStatus(value)
      })
      .catch(() => {
        if (!cancelled) setPublicStatus(null)
      })
    return () => {
      cancelled = true
    }
  }, [statusSessionId])
  const lock = useRef(false)
  const mounted = useRef(false)
  const createAttempt = useRef<{ body: string; key: string } | null>(null)
  const pendingFiles = useRef<File[]>([])
  const companyAttempt = useRef<{ body: string; key: string } | null>(null)
  const attempts = useRef(0)
  const generation = useRef(0)

  useEffect(() => {
    let cancelled = false
    if (!session?.session_id) return
    void sourceApi.publicStatus(session.session_id).then(
      (value) => {
        if (!cancelled) setPublicStatus(value)
      },
      () => {
        if (!cancelled) setPublicStatus(null)
      },
    )
    return () => {
      cancelled = true
    }
  }, [session?.session_id])

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
        } else {
          try {
            const reg = await sourceApi.registered(demo)
            if (!cancelled && reg?.items?.length) {
              setSources(reg.items)
            }
          } catch {
            // No cookie or network issue
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        let publicRequest: { jobId?: string } | null = null
        try {
          publicRequest = JSON.parse(
            sessionStorage.getItem(PUBLIC_IMPORT) || 'null',
          )
        } catch {
          /* Ignore invalid storage. */
        }
        const publicJob = value.jobs.find(
          (job) => job.job_id === publicRequest?.jobId,
        )
        if (publicJob && !running(publicJob)) {
          sessionStorage.removeItem(PUBLIC_IMPORT)
          if (publicJob.status !== 'succeeded') setNotice('')
          if (publicJob.status === 'succeeded')
            setNotice(
              'DART 공개 자료를 가져왔습니다. 사용할 자료를 선택해 주세요.',
            )
        }
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

  async function ensureSession(): Promise<SourceSession> {
    if (session) return session
    const saved = readSaved()
    if (saved) {
      const value = await snapshot(saved.sessionId, saved.jobs)
      apply(value)
      setBrief(value.session.brief)
      setPendingUpload(!!sessionStorage.getItem(UPLOAD))
      return value.session
    }
    if (!brief.purpose.trim()) throw new Error('사용 목적을 입력해 주세요.')
    const body = JSON.stringify({ brief, demo })
    if (createAttempt.current?.body !== body)
      createAttempt.current = { body, key: crypto.randomUUID() }
    const value = await sourceApi.create(brief, createAttempt.current.key, demo)
    persist(value.session_id, [])
    setSession(value)
    setBrief(value.brief)
    apply(await snapshot(value.session_id, []))
    return value
  }

  async function start() {
    await run('작업 시작 중', async () => {
      await ensureSession()
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
    if (!files.length) return
    await run('파일 업로드 중', async () => {
      const activeSession = session || (await ensureSession())
      if (activeSession.document_summary && !allowDocumentChanges)
        throw new Error('자료 변경 시작을 먼저 선택해 주세요.')
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
      for (const file of files) {
        if (!file.name || file.name.length > 150)
          throw new Error('파일명은 최대 150자 이내여야 합니다.')
        if (file.name.includes('..') || /[/\\]/.test(file.name))
          throw new Error('파일명에 디렉터리 경로 문자를 사용할 수 없습니다.')
        if (
          /\.(exe|bat|cmd|sh|vbs|scr|jar|js|msi|dll|com|pif|reg|ps1)\b/i.test(
            file.name,
          )
        )
          throw new Error(
            '실행 파일 확장자가 포함된 파일은 첨부할 수 없습니다.',
          )
        if (file.size <= 0) throw new Error('빈 파일은 첨부할 수 없습니다.')
      }
      // 응답 유실 재전송은 개수 제한 검사보다 먼저 구분한다.
      const signature = await fingerprint(files)
      const previous = JSON.parse(
        sessionStorage.getItem(UPLOAD) || 'null',
      ) as UploadAttempt | null
      if (
        previous &&
        (previous.sessionId !== activeSession.session_id ||
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
        sessionId: activeSession.session_id,
        fingerprint: signature,
        key: crypto.randomUUID(),
      }
      sessionStorage.setItem(UPLOAD, JSON.stringify(attempt))
      const prevIds = new Set(sources.map((s) => s.source_id))
      let result
      try {
        result = await sourceApi.upload(
          activeSession.session_id,
          files,
          attempt.key,
        )
      } catch (cause) {
        if (
          cause instanceof SourceApiError &&
          cause.status >= 400 &&
          cause.status < 500 &&
          ![408, 429].includes(cause.status)
        ) {
          sessionStorage.removeItem(UPLOAD)
          sessionStorage.removeItem(PUBLIC_IMPORT)
          setPendingUpload(false)
          pendingFiles.current = []
        }
        throw cause
      }
      const jobIds = [...new Set([...(readSaved()?.jobs || []), result.job_id])]
      persist(activeSession.session_id, jobIds)
      sessionStorage.removeItem(UPLOAD)
      sessionStorage.removeItem(PUBLIC_IMPORT)
      setPendingUpload(false)
      pendingFiles.current = []
      const nextSnap = await snapshot(activeSession.session_id, jobIds)

      // 새로 업로드된 세션 첨부 자료들을 자동으로 선택 목록에 추가
      const newUploadedIds = nextSnap.sources
        .filter((s) => !prevIds.has(s.source_id) && s.scope === 'session')
        .map((s) => s.source_id)

      const mergedSelected = Array.from(
        new Set([...nextSnap.session.selected_source_ids, ...newUploadedIds]),
      )

      let selectionSaved = false
      if (newUploadedIds.length > 0) {
        try {
          const res = await sourceApi.inputs(
            nextSnap.session,
            { selected_source_ids: mergedSelected },
            crypto.randomUUID(),
          )
          nextSnap.session = {
            ...nextSnap.session,
            ...res,
            selected_source_ids: res.selected_source_ids,
          }
          selectionSaved = true
        } catch {
          setNotice(
            '첨부는 완료됐지만 자료 선택은 저장되지 않았습니다. 목록에서 선택해 주세요.',
          )
        }
      }

      apply(nextSnap)
      attempts.current = 0
      setPolling(true)
      setNotice(
        selectionSaved
          ? `파일 ${files.length}개를 첨부하여 자동으로 선택했습니다. 읽기 완료 후 점검을 진행해 주세요.`
          : `파일 ${files.length}개를 첨부했습니다. 읽기 완료 후 목록에서 자료를 선택해 주세요.`,
      )
    })
  }

  async function select(source: WorkSource) {
    await run('자료 선택 저장 중', async () => {
      const activeSession = session || (await ensureSession())
      if (activeSession.document_summary && !allowDocumentChanges) return
      const nextSelected = activeSession.selected_source_ids.includes(
        source.source_id,
      )
        ? activeSession.selected_source_ids.filter(
            (id) => id !== source.source_id,
          )
        : [...activeSession.selected_source_ids, source.source_id]

      const result = await sourceApi.inputs(
        activeSession,
        { selected_source_ids: nextSelected },
        crypto.randomUUID(),
      )
      persist(activeSession.session_id, readSaved()?.jobs || [])
      setSession({
        ...activeSession,
        ...result,
        selected_source_ids: result.selected_source_ids,
      })
      setNotice('자료 선택을 서버에 저장했습니다.')
    })
  }

  async function saveBrief() {
    await run('작성 조건 저장 중', async () => {
      const activeSession = session || (await ensureSession())
      if (activeSession.document_summary && !allowDocumentChanges) return
      if (!brief.purpose.trim()) throw new Error('사용 목적을 입력해 주세요.')
      const result = await sourceApi.inputs(
        activeSession,
        { brief },
        crypto.randomUUID(),
      )
      setSession({ ...activeSession, ...result, brief })
      setNotice('작성 조건을 서버에 저장했습니다.')
    })
  }

  async function changeCompany(name: string, corpCode?: string) {
    const target = name.trim()
    if (!target || target.length > 50 || lock.current) return false
    if (session?.document_summary && !allowDocumentChanges) return false
    const current = session?.brief || brief
    if (
      target === current.target_company &&
      (corpCode || null) === (current.dart_corp_code || null)
    )
      return true
    if (!session) {
      setBrief({
        ...brief,
        target_company: target,
        dart_corp_code: corpCode || null,
      })
      return true
    }
    let completed = false
    await run('회사 변경 저장 중', async () => {
      const next = {
        ...session.brief,
        target_company: target,
        dart_corp_code: corpCode || null,
      }
      const change = { brief: next, selected_source_ids: [] }
      const body = JSON.stringify({
        session: session.session_id,
        revision: session.input_revision,
        change,
      })
      if (companyAttempt.current?.body !== body)
        companyAttempt.current = { body, key: crypto.randomUUID() }
      const result = await sourceApi.inputs(
        session,
        change,
        companyAttempt.current.key,
      )
      setSession({ ...session, ...result, brief: next })
      setBrief({
        ...brief,
        target_company: target,
        dart_corp_code: corpCode || null,
      })
      companyAttempt.current = null
      setNotice(
        '회사를 저장하고 자료 선택을 해제했습니다. 해당 회사 자료를 선택해 다시 점검해 주세요. 기존 파일과 문서는 보존됩니다.',
      )
      completed = true
    })
    return completed
  }

  async function importPublic() {
    await run('DART 공개 자료 가져오는 중', async () => {
      const activeSession = session || (await ensureSession())
      if (activeSession.document_summary && !allowDocumentChanges) return
      let attempt: { sessionId: string; revision: number; key: string } | null =
        null
      try {
        attempt = JSON.parse(sessionStorage.getItem(PUBLIC_IMPORT) || 'null')
      } catch {
        /* Start a new request. */
      }
      if (
        !attempt ||
        attempt.sessionId !== activeSession.session_id ||
        attempt.revision !== activeSession.input_revision ||
        typeof attempt.key !== 'string'
      ) {
        attempt = {
          sessionId: activeSession.session_id,
          revision: activeSession.input_revision,
          key: crypto.randomUUID(),
        }
      }
      sessionStorage.setItem(PUBLIC_IMPORT, JSON.stringify(attempt))
      try {
        const accepted = await sourceApi.importPublic(
          activeSession,
          attempt.key,
        )
        sessionStorage.setItem(
          PUBLIC_IMPORT,
          JSON.stringify({ ...attempt, jobId: accepted.job_id }),
        )
        const ids = [
          ...new Set([...(readSaved()?.jobs || []), accepted.job_id]),
        ]
        // Retain accepted Job before the status lookup, including a lost lookup response.
        persist(activeSession.session_id, ids)
        const value = await snapshot(activeSession.session_id, ids)
        apply(value)
        attempts.current = 0
        setPolling(true)
        const job = value.jobs.find((item) => item.job_id === accepted.job_id)
        if (job && !running(job)) sessionStorage.removeItem(PUBLIC_IMPORT)
        if (job?.status === 'failed' || job?.status === 'cancelled') {
          setNotice('')
          setError(
            job.error?.message || 'DART 공개 자료를 가져오지 못했습니다.',
          )
        } else {
          setNotice(
            job?.status === 'succeeded'
              ? 'DART 공개 자료를 가져왔습니다. 사용할 자료를 선택해 주세요.'
              : 'DART 공개 자료를 조회하고 있습니다. 완료되면 공개 연동 데이터 탭에서 선택해 주세요.',
          )
        }
      } catch (cause) {
        if (
          cause instanceof SourceApiError &&
          cause.status >= 400 &&
          cause.status < 500 &&
          ![408, 429].includes(cause.status)
        )
          sessionStorage.removeItem(PUBLIC_IMPORT)
        if (
          cause instanceof SourceApiError &&
          cause.code === 'PUBLIC_DATA_NOT_CONFIGURED'
        ) {
          sessionStorage.removeItem(PUBLIC_IMPORT)
          setNotice(cause.message)
          return
        }
        throw cause
      }
    })
  }

  async function remove(source: WorkSource) {
    if (!session || (session.document_summary && !allowDocumentChanges)) return
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
    publicStatus,
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
    changeCompany,
    importPublic,
    publicStatus,
    remove,
    close,
    retryUpload: () => upload(pendingFiles.current),
    hasPendingFiles: () => pendingFiles.current.length > 0,
    briefDirty:
      !!session && JSON.stringify(brief) !== JSON.stringify(session.brief),
  }
}
