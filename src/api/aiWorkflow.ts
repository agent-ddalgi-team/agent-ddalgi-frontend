import { apiClient } from './client'
import { request } from './sources'
import type { ReadingJob } from './sources'

export interface EvidenceRef {
  source_id: string
  source_version: number
  segment_id: string
  locator: Record<string, unknown>
  excerpt: string
}

export interface Preflight {
  preflight_id: string
  session_id: string
  input_revision: number
  usable_source_ids: string[]
  can_generate: boolean
  confirmed_at: string | null
  facts: {
    fact_id: string
    field_key: string
    value: string | null
    status: 'supported' | 'needs_confirmation' | 'conflict' | 'missing'
    evidence_refs: EvidenceRef[]
    alternatives: { value?: string; evidence_refs?: EvidenceRef[] }[] | null
  }[]
  issues: {
    issue_id: string
    severity: 'blocker' | 'warning' | 'info'
    status: 'open' | 'resolved' | 'excluded' | 'acknowledged'
    message: string
    code: string
    fact_ids?: string[]
    source_ids?: string[]
  }[]
  recommendations: { suggested_pages: number; reason: string; needed: string[] }
}

export interface AiJob extends ReadingJob {
  kind: string
  result_ref:
    | { type: 'preflight'; preflight_id: string }
    | { type: 'document'; document_id: string; document_revision: number }
    | null
}

export interface DraftBlock {
  block_id: string
  type: 'heading' | 'paragraph' | 'list' | 'image' | 'image_placeholder'
  content: Record<string, unknown>
  fact_ids: string[]
  evidence_refs: EvidenceRef[]
}

export interface DraftResult {
  input_review_required?: boolean
  latest_preflight_id?: string | null
  demo: boolean
  document: {
    document_id: string
    session_id: string
    input_revision: number
    document_revision: number
    title: string
    target_pages: number
    status: string
    pages: {
      page_id: string
      title: string
      layout_key: string
      blocks: DraftBlock[]
    }[]
  }
}

const path = (sid: string) => `/api/v1/sessions/${encodeURIComponent(sid)}`
const options = { timeout: 30_000 }
const withKey = (key: string) => ({
  ...options,
  headers: { 'Idempotency-Key': key },
})

export const aiApi = {
  analyze: (sid: string, revision: number, key: string) =>
    request<{ job_id: string }>(() =>
      apiClient.post(
        `${path(sid)}/preflights`,
        { expected_input_revision: revision },
        withKey(key),
      ),
    ),
  generate: (sid: string, revision: number, preflight: string, key: string) =>
    request<{ job_id: string }>(() =>
      apiClient.post(
        `${path(sid)}/drafts`,
        { input_revision: revision, preflight_id: preflight, confirmed: true },
        withKey(key),
      ),
    ),
  job: (sid: string, id: string) =>
    request<AiJob>(() =>
      apiClient.get(`${path(sid)}/jobs/${encodeURIComponent(id)}`, options),
    ),
  preflight: (sid: string, id: string) =>
    request<Preflight>(() =>
      apiClient.get(
        `${path(sid)}/preflights/${encodeURIComponent(id)}`,
        options,
      ),
    ),
  document: (sid: string, id: string) =>
    request<DraftResult>(() =>
      apiClient.get(
        `${path(sid)}/documents/${encodeURIComponent(id)}`,
        options,
      ),
    ),
}
