import { apiClient } from './client'
import { isScreenPreview } from '../services/mockBackend'
import { request, SourceApiError } from './sources'
import type { DraftBlock, DraftResult, EvidenceRef, Preflight } from './aiWorkflow'

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
  fact_ids?: string[]
  source_ids?: string[]
  resolution: { reason?: string } | null
}
// A linked block is a place to inspect; it is not an AI finding against that sentence.
export function issueEditLocations(issue: Issue, pages: DraftResult['document']['pages']) {
  const directIds = new Set(issue.block_ids)
  const factIds = new Set(issue.fact_ids || [])
  const sourceIds = new Set(issue.source_ids || [])
  const blocks = pages.flatMap((page, pageIndex) => page.blocks.map((block, blockIndex) => ({ page, pageIndex, block, blockIndex })))
  const direct = blocks.filter(({ block }) => directIds.has(block.block_id))
  if (direct.length) return direct.map(location => ({ ...location, direct: true }))
  return blocks
    .filter(({ block }) => factIds.size
      ? block.fact_ids.some(id => factIds.has(id))
      : block.evidence_refs.some(ref => sourceIds.has(ref.source_id)))
    .map(location => ({ ...location, direct: false }))
}

// Only an explicit user choice can exclude an optional, unused fact.
export function unusedReviewFactIds(issues: Issue[], pages: DraftResult['document']['pages'], reviewableIds: string[]) {
  const used = new Set(pages.flatMap(page => page.blocks.flatMap(block => block.fact_ids)))
  const allowed = new Set(reviewableIds)
  return [...new Set(issues.filter(issue => issue.status === 'open' && issue.origin === 'preflight' &&
    issue.scope === 'content' && issue.code === 'UNSUPPORTED_CLAIM' && !issue.block_ids.length)
    .flatMap(issue => issue.fact_ids || []))].filter(id => allowed.has(id) && !used.has(id))
}

export function canReviewIssueEvidence(issue: Issue) {
  return issue.status === 'open' && issue.scope !== 'layout' &&
    (issue.origin === 'preflight' || ['REQUIRED_MISSING', 'EVIDENCE_INVALID', 'VALUE_CONFLICT',
      'VALUE_MISMATCH', 'CONDITION_LOSS', 'CERTIFICATION_MISMATCH', 'UNSUPPORTED_CLAIM',
      'UNVERIFIED_SUPERLATIVE', 'MOCK_VALUE', 'IMAGE_MISMATCH', 'IMAGE_UNVERIFIABLE'].includes(issue.code))
}

export function issueRecoverySteps(issue: Issue): string[] {
  if (issue.status !== 'open') return []
  switch (issue.code) {
    case 'IMAGE_MISMATCH':
    case 'IMAGE_UNVERIFIABLE':
    case 'PHOTO_CONTENT_REVIEW':
      return [
        '아래 사진 위치로 이동해 실제 사진과 사진 설명을 비교하세요.',
        '확인할 수 없는 장비명·성능·공정명은 설명에서 빼거나 근거가 확인되는 내용으로 수정하세요. 사진이 잘못되었다면 사진 교체 후보 보기에서 교체하거나 해당 사진을 삭제하세요.',
        '설명을 수정하거나 사진을 삭제한 뒤 저장하고 내용 검사를 실행하세요. 교체한 사진은 설명을 다시 입력해야 합니다. 확인 기록만으로 이 문제를 해제할 수 없습니다.',
      ]
    case 'BROKEN_IMAGE':
      return ['아래 사진 위치에서 다른 사진으로 교체하거나 불러올 수 없는 사진을 삭제하세요.', '수정 내용을 저장하고 내용 검사 후 선택한 출력 형식의 배치 검사를 다시 실행하세요.']
    case 'PLACEHOLDER_REMAINING':
      return ['아래 사진 자리로 이동해 사진을 넣거나 빈 사진 자리를 삭제하세요.', '수정 내용을 저장하고 내용 검사 후 선택한 출력 형식의 배치 검사를 다시 실행하세요.']
    case 'REQUIRED_MISSING':
      return issue.origin === 'preflight'
        ? ['자료 점검에서 필수 항목의 원문 근거를 확인하고 부족한 자료를 첨부·선택해 다시 점검하세요.', '초안이 있으면 기존 문서로 돌아가 변경 영향을 반영한 뒤 내용 검사를 진행하세요. 필수 항목은 제외로 해결할 수 없습니다.']
        : ['자료 점검에서 해당 필수 사실의 근거를 확인하세요. 근거가 없다면 자료를 보완하고 다시 점검해야 합니다.', '근거가 있다면 해당 사실과 연결된 본문에 필수 내용을 명시하고 저장한 뒤 내용 검사를 실행하세요. 근거 연결만 있고 본문에 내용이 없으면 통과하지 않습니다.']
    default:
      return []
  }
}

// Offer known, supported facts that are not yet linked to any document block.
export function missingRequiredFacts(issue: Issue, preflight: Preflight | null, pages: DraftResult['document']['pages']) {
  if (issue.status !== 'open' || issue.code !== 'REQUIRED_MISSING' ||
      issue.origin !== 'server' || issue.scope !== 'content') return []
  const used = new Set(pages.flatMap(page => page.blocks.flatMap(block => block.fact_ids)))
  return (preflight?.facts ?? []).filter(fact => issue.fact_ids?.includes(fact.fact_id) &&
    fact.status === 'supported' && !!fact.value?.trim() && fact.evidence_refs.length > 0 && !used.has(fact.fact_id))
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

export function canKeepDocumentAndValidate(review: ImpactReview) {
  return review.status === 'pending' && review.from_input_revision === review.to_input_revision &&
    review.items.every(item => item.code === 'INPUT_CHANGED' && !item.requires_change) &&
    Object.entries(review.fact_rebindings).every(([before, after]) => before === after)
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
  | { op: 'insert_block'; page_id: string; after_block_id: string | null; block: DraftBlock }
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
  validateAfterSave?: boolean
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
    if (isScreenPreview)
      throw new SourceApiError(
        '화면 시연에서는 실제 파일을 내려받지 않습니다.',
        422,
        'SCREEN_PREVIEW_ONLY',
      )
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
    ((issue.origin === 'server' &&
      (issue.code === 'PLACEHOLDER_TEXT' ||
        (issue.code === 'DEMO_VALUE' && demo))) ||
      (issue.origin === 'agent' &&
        ['REPETITION', 'PHOTO_SHORTAGE'].includes(issue.code)))
  )
}
