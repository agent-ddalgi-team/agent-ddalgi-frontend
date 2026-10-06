import { AxiosError } from 'axios'
import type { AxiosAdapter } from 'axios'
import type { SourceSession, WorkSource } from '../api/sources'
import type { Preflight } from '../api/aiWorkflow'
import type {
  PublicationDocument,
  Operation,
  Proposal,
} from '../api/publication'

// Explicit opt-in: ordinary sessions always use the real API.
export const isScreenPreview =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('preview') === '1'
export const previewStorage = isScreenPreview
  ? 'ddalgi.screen-preview.v1'
  : 'ddalgi.sources.v1'
const STATE_KEY = 'ddalgi.screen-preview.state.v1'
const source: WorkSource = {
  source_id: 'screen-source',
  source_version: 1,
  scope: 'registered',
  name: '[가상] 예시 제조 회사 자료',
  kind: 'company',
  role: 'evidence',
  size_bytes: 1024,
  parse_status: 'complete',
  text_available: true,
  image_available: true,
  asset_ids: ['screen-factory'],
  use_as_company_evidence: true,
  origin_kind: 'demo',
  warnings: [],
}
const reference = {
  source_id: source.source_id,
  source_version: 1,
  segment_id: 'screen-segment',
  locator: { page: 1 },
  excerpt: '예시 제조는 정밀 부품을 생산하는 가상 회사입니다.',
}
type PreviewState = {
  session: SourceSession
  document: PublicationDocument | null
  preflight: Preflight
  jobs: Record<string, unknown>
  proposals: Record<string, Proposal>
}
const id = (kind: string) => `screen-${kind}-${crypto.randomUUID()}`
function createState(): PreviewState {
  const session: SourceSession = {
    demo: true,
    session_id: 'screen-session',
    status: 'active',
    input_revision: 1,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    brief: {
      purpose: '가상 회사 소개 화면 시연',
      emphasis: [],
      direction: 'balanced',
      target_pages: 4,
      photo_preference: 'balanced',
    },
    selected_source_ids: [source.source_id],
    document_summary: null,
  }
  return {
    session,
    document: null,
    jobs: {},
    proposals: {},
    preflight: {
      preflight_id: 'screen-preflight',
      session_id: session.session_id,
      input_revision: 1,
      usable_source_ids: [source.source_id],
      can_generate: true,
      confirmed_at: null,
      facts: [
        {
          fact_id: 'screen-name',
          field_key: 'company_name',
          value: '예시 제조',
          status: 'supported',
          evidence_refs: [reference],
          alternatives: null,
        },
        {
          fact_id: 'screen-overview',
          field_key: 'company_overview',
          value: reference.excerpt,
          status: 'supported',
          evidence_refs: [reference],
          alternatives: null,
        },
      ],
      issues: [],
      recommendations: {
        suggested_pages: 4,
        reason: '화면 시연용 가상 구성입니다.',
        needed: [],
      },
    },
  }
}
function draft(state: PreviewState) {
  const titles = [
    '회사 소개',
    '제품과 기술',
    '생산 공정',
    '품질 관리',
    '고객 지원',
    '시설 소개',
    '협력 방향',
    '문의 안내',
    '주요 역량',
    '마무리',
  ]
  const texts = [
    '예시 제조는 정밀 부품을 생산하는 가상 회사입니다. 이 내용은 화면 시연을 위한 예시이며 실제 기업 정보가 아닙니다.',
    '다양한 가상 부품과 제조 기술을 소개합니다. 제품 정보와 수치는 실제 자료로 확인해야 합니다.',
    '소재 준비, 가공, 검사, 출하 순서의 예시 공정입니다.',
    '작업 기준을 확인하고 생산 단계별 품질을 점검하는 예시입니다.',
  ]
  const document: PublicationDocument = {
    demo: true,
    input_review_required: false,
    latest_preflight_id: state.preflight.preflight_id,
    document: {
      document_id: 'screen-document',
      session_id: state.session.session_id,
      input_revision: state.session.input_revision,
      document_revision: 1,
      title: '예시 제조 회사소개서',
      target_pages: state.session.brief.target_pages,
      status: 'draft',
      pages: Array.from(
        { length: state.session.brief.target_pages },
        (_, i) => ({
          page_id: `screen-page-${i}`,
          title: titles[i],
          layout_key: 'text_image',
          blocks: [
            {
              block_id: `screen-heading-${i}`,
              type: 'heading',
              content: { text: titles[i] },
              fact_ids: [],
              evidence_refs: [],
            },
            {
              block_id: `screen-text-${i}`,
              type: 'paragraph',
              content: { text: texts[i % texts.length] },
              fact_ids: ['screen-overview'],
              evidence_refs: [reference],
            },
            ...(state.session.brief.photo_preference === 'none'
              ? []
              : [
                  {
                    block_id: `screen-image-${i}`,
                    type: 'image' as const,
                    content: {
                      asset_id: 'screen-factory',
                      caption: '가상 제조 시설 일러스트',
                      alt: '가상 제조 시설 일러스트',
                    },
                    fact_ids: [],
                    evidence_refs: [],
                  },
                ]),
          ],
        }),
      ),
    },
    validation: null,
    approval: null,
    layout_checks: { pdf: null, docx: null },
  }
  state.document = document
  state.session.document_summary = {
    document_id: document.document.document_id,
    document_revision: 1,
  }
}
function loadState(): PreviewState {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(STATE_KEY) || 'null',
    ) as PreviewState | null
    if (
      saved?.session?.session_id === 'screen-session' &&
      saved.preflight &&
      saved.jobs &&
      saved.proposals
    )
      return saved
  } catch {
    /* Start fresh if only the preview state is damaged. */
  }
  const state = createState()
  draft(state)
  return state
}
let state: PreviewState | undefined
if (isScreenPreview) {
  state = loadState()
  sessionStorage.setItem(STATE_KEY, JSON.stringify(state))
  if (state.session.status === 'active') {
    sessionStorage.setItem(
      previewStorage,
      JSON.stringify({ sessionId: state.session.session_id, jobs: [] }),
    )
    if (!sessionStorage.getItem(`${previewStorage}.ai`))
      sessionStorage.setItem(
        `${previewStorage}.ai`,
        JSON.stringify({
          sessionId: state.session.session_id,
          revision: state.session.input_revision,
          preflightId: state.preflight.preflight_id,
        }),
      )
  }
}
function invalidate(current: PreviewState) {
  const doc = current.document!
  doc.document.document_revision++
  doc.document.status = 'draft'
  doc.validation = null
  doc.approval = null
  doc.layout_checks = { pdf: null, docx: null }
  current.session.document_summary = {
    document_id: doc.document.document_id,
    document_revision: doc.document.document_revision,
  }
}
function applyOperations(operations: Operation[]) {
  for (const operation of operations) {
    const pages = state!.document!.document.pages
    if (operation.op === 'delete_page')
      state!.document!.document.pages = pages.filter(
        (p) => p.page_id !== operation.page_id,
      )
    else
      for (const page of pages) {
        if (operation.op === 'delete_block')
          page.blocks = page.blocks.filter(
            (b) => b.block_id !== operation.block_id,
          )
        else {
          const block = page.blocks.find(
            (b) => b.block_id === operation.block_id,
          )
          if (block) block.content = { ...block.content, ...operation.content }
        }
      }
  }
  invalidate(state!)
}
export function screenAssetUrl(sessionId: string, assetId: string): string {
  if (!isScreenPreview)
    return `/api/v1/sessions/${encodeURIComponent(sessionId)}/assets/${encodeURIComponent(assetId)}`
  const page = assetId.startsWith('screen-preview-')
  const svg = page
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840"><rect width="600" height="840" fill="white"/><rect x="40" y="40" width="520" height="120" fill="#e0f2f1"/><text x="60" y="105" font-size="26" fill="#005f5e">가상 회사소개서</text><text x="60" y="210" font-size="18">화면 시연용 배치 예시</text><text x="60" y="250" font-size="16">실제 PDF / DOCX 출력 결과가 아닙니다.</text><rect x="60" y="310" width="480" height="250" fill="#cbd5e1"/><text x="60" y="650" font-size="16">예시 제조 · 가상 데이터</text></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480"><rect width="800" height="480" fill="#e0f2f1"/><path d="M120 350V200l140 65V200l140 65V150h220v200z" fill="#007a78"/><path d="M450 150V80h55v70" fill="#005f5e"/><g fill="#b2dfdb"><rect x="155" y="290" width="60" height="40"/><rect x="280" y="290" width="60" height="40"/><rect x="440" y="230" width="60" height="40"/><rect x="530" y="230" width="60" height="40"/></g><text x="120" y="420" font-size="24" fill="#005f5e">가상 제조 시설 · 화면 시연</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
// No network fallback: unsupported preview actions fail locally.
export const screenPreviewAdapter: AxiosAdapter = async (config) => {
  const fail = (message: string, status = 422): never => {
    throw new AxiosError(message, 'SCREEN_PREVIEW_ONLY', config, undefined, {
      data: { error: { code: 'SCREEN_PREVIEW_ONLY', message } },
      status,
      statusText: 'Preview only',
      headers: {},
      config,
    })
  }
  if (!isScreenPreview || !state) return fail('가상 데이터 모드가 아닙니다.')
  const method = (config.method || 'get').toUpperCase()
  const path = new URL(config.url || '', 'http://preview.invalid').pathname
  const body =
    typeof config.data === 'string'
      ? JSON.parse(config.data)
      : config.data || {}
  const current = state
  const root = `/api/v1/sessions/${current.session.session_id}`
  const docRoot = `${root}/documents/screen-document`
  const job = (kind: string, result: unknown = null) => {
    const jobId = id('job')
    current.jobs[jobId] = {
      job_id: jobId,
      kind,
      status: 'succeeded',
      progress: { stage: 'done', message: '가상 데이터 시연 완료' },
      error: null,
      result_ref: result,
    }
    return { job_id: jobId }
  }
  let data: unknown
  if (path === '/api/v1/sources' && method === 'GET') data = { items: [source] }
  else if (path === '/api/v1/sessions' && method === 'POST') {
    state = createState()
    state.session.brief = body.brief
    data = state.session
  } else if (path === root && method === 'GET') data = current.session
  else if (path === root && method === 'DELETE') {
    current.session.status = 'closed'
    current.document = null
    current.session.document_summary = null
    data = { status: 'closed', cleanup: 'done' }
  } else if (current.session.status !== 'active')
    return fail('가상 작업이 종료되었습니다. 새 작업을 시작해 주세요.', 410)
  else if (path === `${root}/sources` && method === 'GET') data = { items: [] }
  else if (path === `${root}/inputs` && method === 'PATCH') {
    if (body.expected_input_revision !== current.session.input_revision)
      return fail('가상 자료 상태를 새로고침해 주세요.', 409)
    current.session.input_revision++
    if (body.brief) current.session.brief = body.brief
    if (body.selected_source_ids)
      current.session.selected_source_ids = body.selected_source_ids
    if (current.document) current.document.input_review_required = true
    data = {
      input_revision: current.session.input_revision,
      selected_source_ids: current.session.selected_source_ids,
    }
  } else if (path === `${root}/preflights` && method === 'POST') {
    current.preflight.input_revision = current.session.input_revision
    current.preflight.recommendations.suggested_pages =
      current.session.brief.target_pages
    data = job('preflight', {
      type: 'preflight',
      preflight_id: current.preflight.preflight_id,
    })
  } else if (
    path === `${root}/preflights/${current.preflight.preflight_id}` &&
    method === 'GET'
  )
    data = current.preflight
  else if (path === `${root}/drafts` && method === 'POST') {
    if (!body.confirmed || !current.session.selected_source_ids.length)
      return fail('가상 자료를 선택하고 확인해 주세요.')
    draft(current)
    data = job('draft', {
      type: 'document',
      ...current.session.document_summary,
    })
  } else if (path.startsWith(`${root}/jobs/`) && method === 'GET')
    data =
      current.jobs[path.split('/').pop()!] ||
      fail('가상 작업을 찾지 못했습니다.', 404)
  else if (path === docRoot && method === 'GET')
    data = current.document || fail('가상 초안이 없습니다.', 404)
  else if (path === `${docRoot}/issues` && method === 'GET')
    data = {
      document_revision: current.document!.document.document_revision,
      validation_id: current.document!.validation?.validation_id || null,
      issues: [],
    }
  else if (path === docRoot && method === 'PATCH') {
    if (body.expected_revision !== current.document!.document.document_revision)
      return fail('가상 문서 상태를 새로고침해 주세요.', 409)
    applyOperations(body.operations || [])
    data = { document_revision: current.document!.document.document_revision }
  } else if (path === `${docRoot}/validate` && method === 'POST') {
    const doc = current.document!
    doc.validation = {
      validation_id: id('validation'),
      document_revision: doc.document.document_revision,
      input_revision: doc.document.input_revision,
      status: 'passed',
      agent_called: false,
    }
    data = job('validate')
  } else if (path === `${docRoot}/layout-checks` && method === 'POST') {
    const doc = current.document!
    const format = body.format === 'docx' ? 'docx' : 'pdf'
    doc.layout_checks[format] = {
      layout_check_id: id('layout'),
      document_revision: doc.document.document_revision,
      input_revision: doc.document.input_revision,
      status: 'passed',
      layout_ok: true,
      publication_policy_ok: true,
      actual_pages: doc.document.pages.length,
      preview_asset_ids: doc.document.pages.map(
        (_, i) => `screen-preview-${i}`,
      ),
      warnings: ['가상 배치 예시이며 실제 출력 검사 결과가 아닙니다.'],
      fail_reasons: [],
      findings: [],
    }
    data = job('layout')
  } else if (path === `${docRoot}/approvals` && method === 'POST') {
    const doc = current.document!
    const format = body.format === 'docx' ? 'docx' : 'pdf'
    const layout = doc.layout_checks[format]
    if (!body.confirmed || !doc.validation || !layout)
      return fail('가상 검사를 실행한 뒤 승인 확인을 선택해 주세요.')
    doc.approval = {
      approval_id: id('approval'),
      document_revision: doc.document.document_revision,
      input_revision: doc.document.input_revision,
      validation_id: doc.validation.validation_id,
      layout_check_id: layout.layout_check_id,
      format,
      status: 'active',
      approved_at: new Date().toISOString(),
    }
    doc.document.status = 'approved'
    data = doc.approval
  } else if (path === `${root}/exports` && method === 'POST')
    return fail('화면 시연에서는 실제 파일을 만들거나 내려받지 않습니다.')
  else if (path === `${docRoot}/proposals` && method === 'POST') {
    if (body.kind !== 'text')
      return fail('화면 시연에서는 문구 수정 예시만 제공합니다.')
    const proposalId = id('proposal')
    const blocks = current.document!.document.pages.flatMap((p) => p.blocks)
    const block = blocks.find((b) =>
      body.target_block_ids?.includes(b.block_id),
    )
    if (!block || !['heading', 'paragraph'].includes(block.type))
      return fail('문구 블록을 선택해 주세요.')
    current.proposals[proposalId] = {
      proposal_id: proposalId,
      document_id: 'screen-document',
      base_document_revision: current.document!.document.document_revision,
      base_input_revision: current.document!.document.input_revision,
      target_block_ids: [block.block_id],
      kind: 'text',
      instruction: body.instruction,
      changes: [
        {
          op: 'replace_block_content',
          block_id: block.block_id,
          content: {
            ...block.content,
            text: `${String(block.content.text)} (가상 수정안)`,
          },
        },
      ],
      rationale: 'AI 호출 없이 준비한 가상 수정 예시입니다.',
      candidates: null,
      status: 'proposed',
      applied_revision: null,
    }
    data = job('proposal', { proposal_id: proposalId })
  } else if (path.startsWith(`${root}/proposals/`)) {
    const parts = path.slice(`${root}/proposals/`.length).split('/')
    const proposal =
      current.proposals[parts[0]] || fail('가상 수정안을 찾지 못했습니다.', 404)
    if (method === 'GET' && parts.length === 1) data = proposal
    else if (method === 'POST' && parts[1] === 'apply') {
      applyOperations(proposal.changes as Operation[])
      proposal.status = 'applied'
      proposal.applied_revision = current.document!.document.document_revision
      data = { document_revision: proposal.applied_revision }
    } else if (method === 'POST' && parts[1] === 'reject') {
      proposal.status = 'rejected'
      data = { status: 'rejected' }
    } else return fail('이 작업은 가상 화면 시연에서 제공하지 않습니다.')
  } else
    return fail(
      '이 작업은 가상 화면 시연에서 제공하지 않습니다. 실제 기능은 서버 연결 모드에서 사용해 주세요.',
    )
  sessionStorage.setItem(STATE_KEY, JSON.stringify(state))
  return {
    data: structuredClone(data),
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }
}

export interface WebCollectedPhoto {
  id: string
  name: string
  caption: string
  category: 'facility' | 'lab' | 'building' | 'product' | 'cert'
  url: string
  thumbnailUrl: string
  sourceDomain: string
  sourcePageUrl: string
}

// 이전 사진 수집 UI와의 타입 호환만 유지한다. 고정 예시 자료는 제공하지 않는다.
export const CURATED_ENTERPRISE_PHOTOS: WebCollectedPhoto[] = []

export async function searchWebPhotos(
  queryOrUrl: string,
  categoryFilter?: string,
): Promise<WebCollectedPhoto[]> {
  void queryOrUrl
  void categoryFilter
  throw new Error(
    '웹 사진 수집은 연결되지 않았습니다. 서버에 등록된 사진이나 직접 첨부한 사진을 사용해 주세요.',
  )
}
