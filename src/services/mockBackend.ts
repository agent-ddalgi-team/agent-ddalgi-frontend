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
  searchWebPhotosDynamic,
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
  return searchWebPhotosDynamic(queryOrUrl, categoryFilter)
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
            excerpt: '반도체 세정제 및 2차전지 핵심 소재 분야에서 독보적 기술 확보',
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
        message: '일부 통계(연간 생산량 150,000톤)는 시연용 수치가 포함되어 있습니다.',
      },
    ],
    recommendations: {
      suggested_pages: 4,
      reason: '선택한 4건의 자료를 기반으로 핵심 역량 중심 4쪽 구성을 추천합니다.',
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
        { page_id: 'page-1', title: '표지 및 비전', blocks: blocksPage1 },
        { page_id: 'page-2', title: '회사 개요 및 연혁', blocks: blocksPage2 },
        { page_id: 'page-3', title: '공정 및 품질 관리', blocks: blocksPage3 },
        { page_id: 'page-4', title: '실적 및 상담 안내', blocks: blocksPage4 },
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

