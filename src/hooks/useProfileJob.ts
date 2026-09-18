import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createProfileJob,
  downloadProfileDocument,
  getProfileJob,
} from '../api/profiles'
import type {
  DocumentFormat,
  ErrorObject,
  JobResponse,
  JobStatus,
  ProfileResult,
} from '../types/profile'

interface ProfileJobState {
  status: JobStatus | 'idle'
  error: ErrorObject | null
  profile: ProfileResult | null
  jobId: string | null
  generating: boolean
  docStatus: string | null
  docBusy: boolean
}

const POLL_INTERVAL_MS = 1000

const INITIAL_STATE: ProfileJobState = {
  status: 'idle',
  error: null,
  profile: null,
  jobId: null,
  generating: false,
  docStatus: null,
  docBusy: false,
}

export function useProfileJob() {
  const [state, setState] = useState<ProfileJobState>(INITIAL_STATE)
  const pollTimerRef = useRef<number | null>(null)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  // GET/POST 응답 형태: {job_id, status, result, error}. ready/error만 최종 결과로 반영한다.
  const applyJobResponse = useCallback((response: JobResponse) => {
    if (response.status === 'error') {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: response.error,
        profile: null,
        jobId: null,
        generating: false,
      }))
      return
    }
    if (response.status === 'ready' && response.result) {
      setState((prev) => ({
        ...prev,
        status: 'ready',
        error: null,
        profile: response.result,
        jobId: response.job_id,
        generating: false,
      }))
      return
    }
    setState((prev) => ({ ...prev, status: response.status, error: null }))
  }, [])

  const startPolling = useCallback(
    (jobId: string) => {
      pollTimerRef.current = window.setInterval(() => {
        getProfileJob(jobId)
          .then((response) => {
            if (response.status === 'ready' || response.status === 'error') {
              stopPolling()
            }
            applyJobResponse(response)
          })
          .catch((err: unknown) => {
            stopPolling()
            setState((prev) => ({
              ...prev,
              generating: false,
              status: 'error',
              error: err as ErrorObject,
            }))
          })
      }, POLL_INTERVAL_MS)
    },
    [applyJobResponse, stopPolling],
  )

  const generate = useCallback(
    async (files: FileList | File[], companyNameHint: string) => {
      if (files.length === 0) {
        setState((prev) => ({
          ...prev,
          error: { code: 'NO_FILE', message: '파일을 먼저 선택해 주세요.' },
        }))
        return
      }

      stopPolling()
      setState({ ...INITIAL_STATE, generating: true, status: 'queued' })

      try {
        const created = await createProfileJob(files, companyNameHint)
        setState((prev) => ({
          ...prev,
          status: created.status,
          jobId: created.job_id,
        }))
        startPolling(created.job_id)
      } catch (err) {
        setState((prev) => ({
          ...prev,
          generating: false,
          status: 'error',
          error: err as ErrorObject,
        }))
      }
    },
    [startPolling, stopPolling],
  )

  // 서버 연결 전 시험용: fixtures/mock_job_ready.json, mock_job_error.json을 직접 읽어 같은 렌더링 경로로 확인한다.
  const loadMockResponse = useCallback(
    (response: JobResponse) => {
      stopPolling()
      applyJobResponse(response)
    },
    [applyJobResponse, stopPolling],
  )

  const downloadDocument = useCallback(
    async (format: DocumentFormat) => {
      const jobId = state.jobId // 요청 시점의 작업 번호를 고정한다.
      if (!jobId) return

      setState((prev) => ({
        ...prev,
        docBusy: true,
        docStatus: `${format.toUpperCase()} 문서를 요청하는 중...`,
      }))

      try {
        const fileName = await downloadProfileDocument(jobId, format)
        setState((prev) =>
          prev.jobId === jobId
            ? {
                ...prev,
                docBusy: false,
                docStatus: `${fileName} 저장을 요청했습니다. 브라우저의 다운로드 대화상자·폴더를 확인하세요.`,
              }
            : prev,
        )
      } catch (err) {
        const error = err as ErrorObject
        setState((prev) =>
          prev.jobId === jobId
            ? {
                ...prev,
                docBusy: false,
                docStatus: `[${error.code}] ${error.message}`,
              }
            : prev,
        )
      }
    },
    [state.jobId],
  )

  return { ...state, generate, loadMockResponse, downloadDocument }
}
