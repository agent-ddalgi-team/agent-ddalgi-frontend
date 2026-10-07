import axios from 'axios'
import { apiClient } from './client'

// 백엔드 contracts.md 계약 1.5 중 자료 선택 단계에서 사용하는 형식.
export interface SourceBrief {
  purpose: string
  target_company?: string | null
  emphasis: string[]
  direction: 'balanced' | 'quality_process' | 'customer_response'
  target_pages: 1 | 4 | 6 | 8 | 10
  photo_preference: 'none' | 'balanced' | 'many'
}

export interface SourceSession {
  demo: boolean
  session_id: string
  status: 'active' | 'closed' | 'expired'
  input_revision: number
  expires_at: string
  brief: SourceBrief
  selected_source_ids: string[]
  document_summary: { document_id: string; document_revision: number } | null
}

export interface WorkSource {
  source_id: string
  source_version: number
  scope: 'registered' | 'session'
  name: string
  kind: 'company' | 'interview' | 'certificate' | 'photo' | 'other'
  role: 'evidence' | 'instruction'
  size_bytes: number
  parse_status: 'queued' | 'reading' | 'complete' | 'partial' | 'failed'
  text_available: boolean
  image_available: boolean
  asset_ids: string[]
  use_as_company_evidence: boolean
  origin_kind: 'real' | 'mock' | 'demo'
  warnings: { code: string; message: string; action?: string | null }[]
}

export interface ReadingJob {
  job_id: string
  status:
    'queued' | 'running' | 'waiting_user' | 'succeeded' | 'failed' | 'cancelled'
  progress: { stage: string; message: string | null }
  error: {
    code: string
    message: string
    retryable: boolean
    details?: { recovery_action?: string }
  } | null
}

export class SourceApiError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>
  constructor(
    message: string,
    status = 0,
    code = 'NETWORK_ERROR',
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function request<T>(
  action: () => Promise<{ data: T }>,
): Promise<T> {
  try {
    return (await action()).data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.error
      throw new SourceApiError(
        detail?.message ||
          '서버 응답을 받지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.',
        error.response?.status || 0,
        detail?.code || 'NETWORK_ERROR',
        detail?.details,
      )
    }
    throw error
  }
}

const sessionPath = (id: string) => `/api/v1/sessions/${encodeURIComponent(id)}`
const options = { timeout: 30_000 }

export const sourceApi = {
  create: (brief: SourceBrief, key: string, demo: boolean) =>
    request<SourceSession>(() =>
      apiClient.post(
        '/api/v1/sessions',
        { brief, demo },
        { ...options, headers: { 'Idempotency-Key': key } },
      ),
    ),
  session: (id: string) =>
    request<SourceSession>(() => apiClient.get(sessionPath(id), options)),
  registered: (demo: boolean) =>
    request<{ items: WorkSource[] }>(() =>
      apiClient.get('/api/v1/sources', {
        ...options,
        params: { include_demo: demo },
      }),
    ),
  attached: (id: string) =>
    request<{ items: WorkSource[] }>(() =>
      apiClient.get(`${sessionPath(id)}/sources`, options),
    ),
  upload: (id: string, files: File[], key: string) => {
    const body = new FormData()
    files.forEach((file) => body.append('files', file))
    body.append('role', 'evidence')
    return request<{ job_id: string; items: WorkSource[] }>(() =>
      apiClient.post(`${sessionPath(id)}/sources`, body, {
        timeout: 120_000,
        headers: { 'Idempotency-Key': key },
      }),
    )
  },
  job: (id: string, job: string) =>
    request<ReadingJob>(() =>
      apiClient.get(
        `${sessionPath(id)}/jobs/${encodeURIComponent(job)}`,
        options,
      ),
    ),
  inputs: (
    session: SourceSession,
    change: { brief?: SourceBrief; selected_source_ids?: string[] },
    key: string,
  ) =>
    request<{ input_revision: number; selected_source_ids: string[] }>(() =>
      apiClient.patch(
        `${sessionPath(session.session_id)}/inputs`,
        { expected_input_revision: session.input_revision, ...change },
        { ...options, headers: { 'Idempotency-Key': key } },
      ),
    ),
  remove: (session: SourceSession, source: string) =>
    request<{ input_revision: number }>(() =>
      apiClient.delete(
        `${sessionPath(session.session_id)}/sources/${encodeURIComponent(source)}`,
        {
          ...options,
          params: { expected_input_revision: session.input_revision },
        },
      ),
    ),
  importPublic: (session: SourceSession) =>
    request<never>(() =>
      apiClient.post(
        sessionPath(session.session_id) + '/public-data/import',
        { expected_input_revision: session.input_revision },
        options,
      ),
    ),
  close: (id: string) =>
    request<{ status: string; cleanup: 'done' | 'pending' }>(() =>
      apiClient.delete(sessionPath(id), options),
    ),
}
