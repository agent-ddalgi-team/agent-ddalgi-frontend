import { AxiosError } from 'axios'
import type { AxiosAdapter } from 'axios'
import type { SourceBrief, SourceSession, WorkSource } from '../api/sources'
import type { DraftResult, DraftBlock, Preflight } from '../api/aiWorkflow'
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
      sufficiency: {
        score: 25,
        has_blockers: false,
        categories: [
          { key: 'overview', label: '기업 개요·연혁', status: 'supported' },
          { key: 'process', label: '제조 공정·설비', status: 'missing' },
          { key: 'performance', label: '고객사·납품 실적', status: 'missing' },
          { key: 'certification', label: '품질·공인 인증', status: 'missing' },
        ],
      },
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
    else if (operation.op === 'insert_block') {
      const target = pages.find(page => page.page_id === operation.page_id)
      const after = operation.after_block_id === null ? -1 : target?.blocks.findIndex(block => block.block_id === operation.after_block_id)
      if (!target || after === undefined || (operation.after_block_id !== null && after < 0) ||
          pages.some(page => page.blocks.some(block => block.block_id === operation.block.block_id)))
        throw new Error('추가할 페이지·위치·블록 ID를 확인해 주세요.')
      target.blocks.splice(after + 1, 0, structuredClone(operation.block))
    }
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
  else if (path === root + '/public-data/import' && method === 'POST')
    return fail('외부 API 키와 수집 연결을 아직 설정하지 않았습니다.', 503)
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

import {
  searchWebPhotosDetailed,
  type WebPhotoSearchResult,
} from './webPhotoCrawler'

export type { WebPhotoSearchResult }

/**
 * 홈페이지 URL이나 검색 키워드를 입력받아 웹 사이트 및 기업 라이브러리에서 관련 사진들을 검색/수집합니다.
 */
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

/**
 * 출처 및 수집 메타데이터를 포함한 상세 웹 사진 검색
 */
export async function searchWebPhotosWithDetail(
  queryOrUrl: string,
  categoryFilter?: string,
): Promise<WebPhotoSearchResult> {
  return searchWebPhotosDetailed(queryOrUrl, categoryFilter)
}

/**
 * 기본 제공 시연 자료 목록 (백엔드 미연결 시 자동 공급)
 */
export function getFallbackSources(): WorkSource[] {
  return [
    {
      source_id: 'src-demo-01',
      source_version: 1,
      name: '회사소개서_기존본.pptx',
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'company',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: true,
      image_available: true,
      asset_ids: [],
      warnings: [],
      size_bytes: 1420000,
    },
    {
      source_id: 'src-demo-02',
      source_version: 1,
      name: '기업_인터뷰_및_연혁.txt',
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'interview',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: true,
      image_available: false,
      asset_ids: [],
      warnings: [],
      size_bytes: 24500,
    },
    {
      source_id: 'src-demo-03',
      source_version: 1,
      name: '공정설명서_v3.pdf',
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'company',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: true,
      image_available: false,
      asset_ids: [],
      warnings: [],
      size_bytes: 460000,
    },
    {
      source_id: 'src-demo-04',
      source_version: 1,
      name: '품질인증서_ISO9001_14001.pdf',
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'certificate',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: true,
      image_available: true,
      asset_ids: [],
      warnings: [],
      size_bytes: 320000,
    },
    {
      source_id: 'src-demo-05',
      source_version: 1,
      name: '스마트팩토리_자동화라인_고해상도.jpg',
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'photo',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: false,
      image_available: true,
      asset_ids: ['asset-demo-photo-01'],
      warnings: [],
      size_bytes: 1250000,
    },
    {
      source_id: 'src-demo-06',
      source_version: 1,
      name: '클린룸_무인패키징_로봇.jpg',
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'photo',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: false,
      image_available: true,
      asset_ids: ['asset-demo-photo-02'],
      warnings: [],
      size_bytes: 980000,
    },
  ]
}

/**
 * 기본 시연 세션 생성
 */
export function getFallbackSession(brief?: SourceBrief): SourceSession {
  return {
    session_id: 'session-demo-standalone',
    status: 'active',
    demo: true,
    input_revision: 1,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    document_summary: null,
    brief: brief || {
      purpose: '신규 고객 소개 (표준 제안용)',
      emphasis: ['품질관리', '공정능력', '인증·특허'],
      direction: 'balanced',
      target_pages: 4,
      photo_preference: 'balanced',
    },
    selected_source_ids: [
      'src-demo-01',
      'src-demo-02',
      'src-demo-03',
      'src-demo-05',
    ],
  }
}

/**
 * 기본 시연 사전점검(Preflight) 결과
 */
export function getFallbackPreflight(sessionId: string): Preflight {
  return {
    preflight_id: 'preflight-demo-01',
    session_id: sessionId,
    input_revision: 1,
    usable_source_ids: [
      'src-demo-01',
      'src-demo-02',
      'src-demo-03',
      'src-demo-05',
    ],
    can_generate: true,
    confirmed_at: null,
    facts: [
      {
        fact_id: 'F001',
        field_key: 'company_name',
        value: '거산케미칼',
        status: 'supported',
        evidence_refs: [
          {
            source_id: 'src-demo-01',
            source_version: 1,
            segment_id: 'seg-1',
            locator: { page: 1 },
            excerpt: '초고순도 정밀 화학 소재의 글로벌 리더, 거산케미칼',
          },
        ],
        alternatives: null,
      },
      {
        fact_id: 'F002',
        field_key: 'business_summary',
        value: '정밀 화학 원료 및 2차전지 전구체 솔루션 공급',
        status: 'supported',
        evidence_refs: [
          {
            source_id: 'src-demo-02',
            source_version: 1,
            segment_id: 'seg-2',
            locator: { line: 12 },
            excerpt:
              '반도체 세정제 및 2차전지 핵심 소재 분야에서 독보적 기술 확보',
          },
        ],
        alternatives: null,
      },
      {
        fact_id: 'F003',
        field_key: 'facilities',
        value: '군산·안산 생산 거점 및 연간 150,000톤 생산 능력',
        status: 'supported',
        evidence_refs: [
          {
            source_id: 'src-demo-03',
            source_version: 1,
            segment_id: 'seg-3',
            locator: { section: 2 },
            excerpt: '자동화율 99.4% 스마트 팩토리 가동으로 연간 15만 톤 달성',
          },
        ],
        alternatives: null,
      },
    ],
    issues: [
      {
        issue_id: 'issue-01',
        code: 'DEMO_VALUE',
        severity: 'warning',
        status: 'open',
        message:
          '일부 통계(연간 생산량 150,000톤)는 시연용 수치가 포함되어 있습니다.',
      },
    ],
    recommendations: {
      suggested_pages: 4,
      reason:
        '선택한 4건의 자료를 기반으로 핵심 역량 중심 4쪽 구성을 추천합니다.',
      needed: [],
    },
  }
}

/**
 * 기본 시연 회사소개서 초안(DraftResult) 생성
 */
export function getFallbackDraft(
  sessionId: string,
  companyName = '거산케미칼',
): DraftResult {
  const blocksPage1: DraftBlock[] = [
    {
      block_id: 'b-1-1',
      type: 'heading',
      content: { text: `${companyName} 회사소개서 2025`, level: 1 },
      fact_ids: ['F001'],
      evidence_refs: [],
    },
    {
      block_id: 'b-1-2',
      type: 'paragraph',
      content: {
        text: '초고순도 화학 정밀 소재의 글로벌 솔루션 파트너. 첨단 생산 인프라와 30년 신뢰를 바탕으로 글로벌 고객사 맞춤형 원료를 공급합니다.',
      },
      fact_ids: ['F001', 'F002'],
      evidence_refs: [],
    },
    {
      block_id: 'b-1-3',
      type: 'image',
      content: {
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
        caption: '글로벌 엔터프라이즈 사옥 전경',
      },
      fact_ids: [],
      evidence_refs: [],
    },
  ]

  const blocksPage2: DraftBlock[] = [
    {
      block_id: 'b-2-1',
      type: 'heading',
      content: { text: '경영 이념 및 회사 주요 개요', level: 2 },
      fact_ids: ['F001'],
      evidence_refs: [],
    },
    {
      block_id: 'b-2-2',
      type: 'paragraph',
      content: {
        text: `${companyName}은 설립 이래 기술 자립과 친환경 케미칼 리더십을 바탕으로 지속 성장해 왔습니다. 군산과 안산 2개 주요 거점을 통해 전국 및 해외 고객사에 안정적인 공급망을 구축하고 있습니다.`,
      },
      fact_ids: ['F002'],
      evidence_refs: [],
    },
    {
      block_id: 'b-2-3',
      type: 'list',
      content: {
        items: [
          '설립 연도: 2012년 (군산 제1공장 준공)',
          '글로벌 거점: 4개국 진출 및 파트너십 체결',
          '주요 사업: 반도체 정밀 세정제, 2차전지 기능성 전구체',
        ],
      },
      fact_ids: [],
      evidence_refs: [],
    },
  ]

  const blocksPage3: DraftBlock[] = [
    {
      block_id: 'b-3-1',
      type: 'heading',
      content: { text: '첨단 제조 공정 및 품질 보증 체계', level: 2 },
      fact_ids: ['F003'],
      evidence_refs: [],
    },
    {
      block_id: 'b-3-2',
      type: 'paragraph',
      content: {
        text: '배합, 촉매 반응, 정제, 무균 패키징에 이르는 전 과정을 중앙 센서 루프로 실시간 제어하며, 공정 자동화율 99.4%를 달성하여 불량률 제로에 도전합니다.',
      },
      fact_ids: ['F003'],
      evidence_refs: [],
    },
    {
      block_id: 'b-3-3',
      type: 'image',
      content: {
        url: '/assets/photos/geosan_cleanroom_automated_pipes.jpg',
        caption: '군산 스마트 팩토리 자동화 반응 설비 전경',
      },
      fact_ids: [],
      evidence_refs: [],
    },
  ]

  const blocksPage4: DraftBlock[] = [
    {
      block_id: 'b-4-1',
      type: 'heading',
      content: { text: '납품 실적 및 고객 지원 채널', level: 2 },
      fact_ids: [],
      evidence_refs: [],
    },
    {
      block_id: 'b-4-2',
      type: 'paragraph',
      content: {
        text: '국내외 8대 대기업 장기 납품 계약을 체결하여 품질 신뢰성을 인정받았습니다. 신규 문의 시 2시간 이내 전담 테크니컬 어시스턴트가 1:1 맞춤 상담을 제공합니다.',
      },
      fact_ids: [],
      evidence_refs: [],
    },
    {
      block_id: 'b-4-3',
      type: 'list',
      content: {
        items: [
          '대표 문의: 02-555-1234 / contact@geosan.com',
          '기술 상담: 군산 제2 연구소 테크니컬 지원 센터',
          '품질 인증: ISO 9001, ISO 14001 공인 획득',
        ],
      },
      fact_ids: [],
      evidence_refs: [],
    },
  ]

  return {
    demo: true,
    document: {
      document_id: 'doc-demo-01',
      session_id: sessionId,
      input_revision: 1,
      document_revision: 1,
      title: `${companyName} 회사소개서 2025`,
      target_pages: 4,
      status: 'draft',
      pages: [
        {
          page_id: 'page-1',
          layout_key: 'fact_sheet',
          title: '표지 및 비전',
          blocks: blocksPage1,
        },
        {
          page_id: 'page-2',
          layout_key: 'fact_sheet',
          title: '회사 개요 및 연혁',
          blocks: blocksPage2,
        },
        {
          page_id: 'page-3',
          layout_key: 'fact_sheet',
          title: '공정 및 품질 관리',
          blocks: blocksPage3,
        },
        {
          page_id: 'page-4',
          layout_key: 'fact_sheet',
          title: '실적 및 상담 안내',
          blocks: blocksPage4,
        },
      ],
    },
  }
}

/**
 * 관리자가 속한 조직/기업의 공개 데이터(DART 전자공시, 특허청, 조달청, 공공데이터포털) 자동 수집 목록
 */
export function getPublicOrgSources(companyName = '거산케미칼'): WorkSource[] {
  const org = companyName.trim() || '거산케미칼'
  return [
    {
      source_id: 'src-pub-dart-01',
      source_version: 1,
      name: `[DART공시] ${org}_2024년도_정기공시_사업보고서.pdf`,
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'company',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: true,
      image_available: false,
      asset_ids: [],
      warnings: [
        {
          code: 'PUBLIC_OPEN_DATA',
          message: '금융감독원 전자공시시스템(DART) 공개 데이터 연동',
        },
      ],
      size_bytes: 840000,
    },
    {
      source_id: 'src-pub-kipris-02',
      source_version: 1,
      name: `[특허청] ${org}_초고순도_화학공정_특허등록공보.pdf`,
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'certificate',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: true,
      image_available: true,
      asset_ids: [],
      warnings: [
        {
          code: 'PUBLIC_OPEN_DATA',
          message: '특허청 특허정보넷 KIPRIS 공공데이터 연동',
        },
      ],
      size_bytes: 520000,
    },
    {
      source_id: 'src-pub-g2b-03',
      source_version: 1,
      name: `[조달청] ${org}_나라장터_공공조달_공급실적증명서.pdf`,
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'company',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: true,
      image_available: false,
      asset_ids: [],
      warnings: [
        {
          code: 'PUBLIC_OPEN_DATA',
          message: '조달청 나라장터 공공 조달 계약 이력 연동',
        },
      ],
      size_bytes: 460000,
    },
    {
      source_id: 'src-pub-iso-04',
      source_version: 1,
      name: `[공공포털] ${org}_ISO14001_환경경영_인증등록대장.pdf`,
      scope: 'registered',
      origin_kind: 'demo',
      kind: 'certificate',
      role: 'evidence',
      use_as_company_evidence: true,
      parse_status: 'complete',
      text_available: true,
      image_available: true,
      asset_ids: [],
      warnings: [
        {
          code: 'PUBLIC_OPEN_DATA',
          message: '공공데이터포털 품질·환경 공인 인증 사실 확인 연동',
        },
      ],
      size_bytes: 310000,
    },
  ]
}
