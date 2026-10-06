import { apiClient } from './client'
import { request, SourceApiError } from './sources'
import type { DraftBlock, DraftResult, EvidenceRef } from './aiWorkflow'

export interface Validation {
  validation_id: string
  document_revision: number
  input_revision: number
  status: 'pending' | 'passed' | 'needs_review' | 'failed'
  agent_called: boolean
}
export interface Issue {
  issue_id: string
  code: string
  message: string
  severity: 'blocker' | 'warning' | 'info'
  scope: 'source' | 'content' | 'layout'
  status: 'open' | 'resolved' | 'excluded' | 'acknowledged'
  origin: 'server' | 'agent' | 'preflight' | 'layout'
  layout_format: 'pdf' | 'docx' | null
  block_ids: string[]
  resolution: { reason?: string } | null
}
export interface Layout {
  layout_check_id: string
  document_revision: number
  input_revision: number
  status: 'pending' | 'passed' | 'failed'
  layout_ok: boolean
  publication_policy_ok: boolean
  actual_pages: number | null
  preview_asset_ids: string[]
  warnings: string[]
  fail_reasons: string[]
  findings: { message: string }[]
}
export interface Approval {
  approval_id: string
  document_revision: number
  input_revision: number
  validation_id: string
  layout_check_id: string
  format: 'pdf' | 'docx'
  status: 'active' | 'invalidated'
  approved_at: string
}
export interface PublicationDocument extends DraftResult {
  validation: Validation | null
  approval: Approval | null
  approvals_by_format?: { pdf: Approval | null; docx: Approval | null }
  layout_checks: { pdf: Layout | null; docx: Layout | null }
}
export interface ImpactReview {
  review_id: string
  document_id: string
  document_revision: number
  from_input_revision: number
  to_input_revision: number
  preflight_id: string
  status: 'pending' | 'applied' | 'stale'
  items: {
    block_id: string | null
    code: string
    message: string
    requires_change: boolean
  }[]
  fact_rebindings: Record<string, string>
}
export interface ImpactReferences {
  block_id: string
  fact_ids: string[]
  evidence_refs: EvidenceRef[]
}
export interface Proposal {
  proposal_id: string
  document_id: string
  base_document_revision: number
  base_input_revision: number
  target_block_ids: string[]
  kind: 'text' | 'structure' | 'image'
  instruction: string
  changes: {
    op: string
    block_id?: string
    content?: Record<string, unknown>
    block?: DraftBlock
  }[]
  rationale: string
  candidates:
    | { candidate_id: string; label: string; changes: Proposal['changes'] }[]
    | null
  status: 'proposed' | 'applied' | 'rejected' | 'stale'
  applied_revision: number | null
}
export type Operation =
  | {
      op: 'replace_block_content'
      block_id: string
      content: Record<string, unknown>
    }
  | { op: 'delete_block'; block_id: string }
  | { op: 'delete_page'; page_id: string }
export type ActionKind =
  | 'save'
  | 'validate'
  | 'layout'
  | 'acknowledge'
  | 'approve'
  | 'export'
  | 'propose'
  | 'applyProposal'
  | 'rejectProposal'
export type Action = {
  kind: ActionKind
  key: string
  body: Record<string, unknown>
  issueId?: string
  proposalId?: string
}
export type ActionResult = {
  job_id?: string | null
  export?: { export_id: string; status: string; approval_id: string }
  document_revision?: number
}
export interface PublicationJob {
  job_id: string
  status:
    'queued' | 'running' | 'waiting_user' | 'succeeded' | 'failed' | 'cancelled'
  progress: { message: string | null }
  error: { message: string; code: string } | null
  result_ref: { export_id?: string; proposal_id?: string } | null
}
const root = (sid: string) => `/api/v1/sessions/${encodeURIComponent(sid)}`
const path = (sid: string, did: string) =>
  `${root(sid)}/documents/${encodeURIComponent(did)}`
export const publicationApi = {
  impactReview: (sid: string, did: string, rid: string) =>
    request<ImpactReview>(() =>
      apiClient.get(
        `${path(sid, did)}/impact-reviews/${encodeURIComponent(rid)}`,
        { timeout: 30000 },
      ),
    ),
  createImpact: (
    sid: string,
    did: string,
    body: Record<string, unknown>,
    key: string,
  ) =>
    request<ImpactReview>(() =>
      apiClient.post(`${path(sid, did)}/impact-reviews`, body, {
        timeout: 30000,
        headers: { 'Idempotency-Key': key },
      }),
    ),
  applyImpact: (
    sid: string,
    did: string,
    rid: string,
    body: Record<string, unknown>,
    key: string,
  ) =>
    request<{ document_revision: number; validation_job_id: string }>(() =>
      apiClient.post(
        `${path(sid, did)}/impact-reviews/${encodeURIComponent(rid)}/apply`,
        body,
        { timeout: 30000, headers: { 'Idempotency-Key': key } },
      ),
    ),
  proposal: (sid: string, pid: string) =>
    request<Proposal>(() =>
      apiClient.get(`${root(sid)}/proposals/${encodeURIComponent(pid)}`, {
        timeout: 30000,
      }),
    ),
  document: (sid: string, did: string) =>
    request<PublicationDocument>(() =>
      apiClient.get(path(sid, did), { timeout: 30000 }),
    ),
  issues: (sid: string, did: string) =>
    request<{
      document_revision: number
      validation_id: string | null
      issues: Issue[]
    }>(() => apiClient.get(`${path(sid, did)}/issues`, { timeout: 30000 })),
  job: (sid: string, jid: string) =>
    request<PublicationJob>(() =>
      apiClient.get(`${root(sid)}/jobs/${encodeURIComponent(jid)}`, {
        timeout: 30000,
      }),
    ),
  act: (sid: string, did: string, action: Action) => {
    const routes = {
      save: path(sid, did),
      propose: `${path(sid, did)}/proposals`,
      applyProposal: `${root(sid)}/proposals/${encodeURIComponent(action.proposalId || '')}/apply`,
      rejectProposal: `${root(sid)}/proposals/${encodeURIComponent(action.proposalId || '')}/reject`,
      validate: `${path(sid, did)}/validate`,
      layout: `${path(sid, did)}/layout-checks`,
      acknowledge: `${root(sid)}/issues/${encodeURIComponent(action.issueId || '')}/resolve`,
      approve: `${path(sid, did)}/approvals`,
      export: `${root(sid)}/exports`,
    }
    return request<ActionResult>(() =>
      apiClient.request({
        url: routes[action.kind],
        method: action.kind === 'save' ? 'PATCH' : 'POST',
        data: action.body,
        headers: { 'Idempotency-Key': action.key },
        timeout: 30000,
      }),
    )
  },
  download: async (
    sid: string,
    eid: string,
    format: 'pdf' | 'docx' = 'pdf',
  ) => {
    // 파일로 저장하기 전에 오류 응답과 선택 형식의 MIME을 확인한다.
    const response = await fetch(
      `${root(sid)}/exports/${encodeURIComponent(eid)}/download`,
      { credentials: 'same-origin', signal: AbortSignal.timeout(60000) },
    )
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new SourceApiError(
        payload?.error?.message ||
          `${format.toUpperCase()}를 내려받지 못했습니다.`,
        response.status,
        payload?.error?.code || 'DOWNLOAD_FAILED',
      )
    }
    const mime =
      format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if (response.headers.get('Content-Type')?.split(';')[0].trim() !== mime)
      throw new Error(
        `서버가 ${format.toUpperCase()} 파일을 반환하지 않았습니다.`,
      )
    return response.blob()
  },
}

export function canAcknowledge(issue: Issue, demo: boolean) {
  return (
    issue.status === 'open' &&
    issue.severity === 'warning' &&
    issue.scope !== 'layout' &&
    ((issue.code === 'PHOTO_CONTENT_REVIEW' &&
      issue.scope === 'content' &&
      ['server', 'agent'].includes(issue.origin)) ||
      (issue.origin === 'server' &&
        (issue.code === 'PLACEHOLDER_TEXT' ||
          (issue.code === 'DEMO_VALUE' && demo))) ||
      (issue.origin === 'agent' &&
        ['REPETITION', 'PHOTO_SHORTAGE'].includes(issue.code)))
  )
}
