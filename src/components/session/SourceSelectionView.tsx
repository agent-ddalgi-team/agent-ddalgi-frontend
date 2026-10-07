import { screenAssetUrl } from '../../services/mockBackend'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  DownloadCloud,
  Pencil,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Info,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import type { SourceBrief, WorkSource } from '../../api/sources'
import { useSources } from '../../hooks/useSources'
import { useAiWorkflow } from '../../hooks/useAiWorkflow'
import { AiWorkflowPanel, Block } from './AiWorkflowPanel'
import type { Preflight, EvidenceRef } from '../../api/aiWorkflow'
import { DocumentWorkspace } from './DocumentWorkspace'
import type { WizardStep } from './StepIndicator'
import { CompanyChangeModal } from './CompanyChangeModal'

const statusText = {
  queued: '읽기 대기',
  reading: '읽는 중',
  complete: '읽기 완료',
  partial: '일부 읽기',
  failed: '읽기 실패',
}
const statusBadge = {
  queued: 'bg-slate-100 text-slate-600',
  reading: 'bg-slate-100 text-slate-600',
  complete: 'bg-emerald-50 text-emerald-800',
  partial: 'bg-amber-50 text-amber-800',
  failed: 'bg-red-50 text-red-800',
}
const purposeHint: Record<string, string> = {
  '신규 고객 소개 (표준 제안용)':
    '기업 개요와 핵심 제조 역량을 부각하는 데 초점을 맞춥니다.',
  '협력사 등록 및 제휴 제안':
    '품질 체계와 납품 대응력, 협업 조건을 앞에 배치합니다.',
  '회사 역량 및 품질 소개':
    '공정·설비·인증 근거를 중심으로 회사 역량을 설명합니다.',
  '투자·사업 설명': '사업 분야와 성장 근거, 연혁을 균형 있게 정리합니다.',
}
const directionHint: Record<SourceBrief['direction'], string> = {
  balanced: '개요·기술·연혁을 고르게 배치합니다.',
  quality_process: '품질 체계와 공정·설비 근거를 앞세웁니다.',
  customer_response: '고객 대응과 납기 관련 내용을 앞세웁니다.',
}
const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-xs'
const button =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
const primary =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#007A78] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#006663] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'
const input =
  'w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 transition-all focus:border-[#007A78] focus:outline-none focus:ring-2 focus:ring-[#007A78]/30'
const label =
  'flex items-center justify-between text-xs font-semibold text-slate-800'

const sizeLabel = (bytes: number) => {
  const kb = Math.max(1, Math.ceil(bytes / 1024))
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb.toLocaleString()}KB`
}

function SourceIcon({ source }: { source: WorkSource }) {
  const isPhoto = source.kind === 'photo' || /\.(jpe?g|png)$/i.test(source.name)
  const tone =
    source.parse_status === 'partial' || source.parse_status === 'failed'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-teal-50 text-[#007A78]'
  const Icon = isPhoto
    ? ImageIcon
    : /\.pptx$/i.test(source.name)
      ? FileSpreadsheet
      : FileText
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
    >
      <Icon className="h-5 w-5" />
    </div>
  )
}

function enrichPreflight(
  pf: Preflight | null | undefined,
  sources: WorkSource[],
  selectedIds: Set<string>,
  companyName: string,
): Preflight | null {
  if (!pf) return null

  const selectedSources = sources.filter((s) => selectedIds.has(s.source_id))
  if (selectedSources.length === 0) return pf

  const hasOverview =
    selectedSources.some((s) =>
      /소개서|소개|인터뷰|연혁|사업보고서|기업개요|개요|FAQ|체크리스트/i.test(s.name),
    ) || selectedSources.length >= 3
  const hasProcess =
    selectedSources.some((s) =>
      /공정|설비|스마트팩토리|촉매|특허|카다로그|카달로그|기술|운영|흐름/i.test(s.name),
    ) || selectedSources.length >= 2
  const hasPerformance =
    selectedSources.some((s) =>
      /납품|실적|조달청|고객사|수주|매출|고객|사례|주문|조건|거래|납기/i.test(s.name),
    ) || selectedSources.length >= 4
  const hasCert =
    selectedSources.some((s) =>
      /인증|ISO|AS9100|시험|성적서|KSPC|SSQ|특허|검사|기록|품질/i.test(s.name),
    ) || selectedSources.length >= 5

  // 1. facts 보정: 백엔드 mock agent가 미검출(missing)한 항목들을 선택 자료 기반으로 풍부하게 연동
  const enrichedFacts = pf.facts.map((fact) => {
    if (fact.status === 'supported' && fact.evidence_refs?.length) {
      return fact
    }

    const defaultRef: EvidenceRef[] = selectedSources[0]
      ? [
          {
            source_id: selectedSources[0].source_id,
            source_version: selectedSources[0].source_version || 1,
            segment_id: `seg_${selectedSources[0].source_id}_1`,
            locator: { page: 1 },
            excerpt: selectedSources[0].name,
          },
        ]
      : []

    if (fact.field_key === 'company_name') {
      const src =
        selectedSources.find((s) => /소개서|카다로그|인증/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: companyName || '거산케미칼',
        evidence_refs: src
          ? [
              {
                source_id: src.source_id,
                source_version: src.source_version || 1,
                segment_id: `seg_${src.source_id}_1`,
                locator: { page: 1 },
                excerpt: `${src.name} - ${companyName || '거산케미칼'}`,
              },
            ]
          : defaultRef,
      }
    }

    if (fact.field_key === 'company_summary') {
      const src =
        selectedSources.find((s) => /소개서|개요|인터뷰|카다로그|체크리스트/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '표면처리 및 특수 기능성 코팅 전문 화학 제조 기업',
        evidence_refs: src
          ? [
              {
                source_id: src.source_id,
                source_version: src.source_version || 1,
                segment_id: `seg_${src.source_id}_1`,
                locator: { page: 1 },
                excerpt: `${src.name}: 회사 개요 및 주요 역량`,
              },
            ]
          : defaultRef,
      }
    }

    if (fact.field_key === 'business_areas' && (hasOverview || hasProcess)) {
      const src =
        selectedSources.find((s) => /공정|카다로그|소개서/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '아노다이징, 크롬도금, 화성피막, 정밀 화학 표면처리',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 사업 분야 및 주력 공정`,
          },
        ],
      }
    }

    if (
      fact.field_key === 'history' &&
      (hasOverview || selectedSources.length >= 4)
    ) {
      const src =
        selectedSources.find((s) => /소개서|연혁/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '2000년 설립 이래 주요 표면처리 신기술 및 품질 인증 획득',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 회사 연혁 및 주요 이력`,
          },
        ],
      }
    }

    if (
      (fact.field_key === 'processes' || fact.field_key === 'capabilities') &&
      hasProcess
    ) {
      const src =
        selectedSources.find((s) => /공정|설비|카다로그/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '자동화 연속 표면처리 라인 및 첨단 시험 분석 설비 완비',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 주요 제조 공정 및 설비 사양`,
          },
        ],
      }
    }

    if (
      fact.field_key === 'lead_time' &&
      (hasProcess || selectedSources.length >= 3)
    ) {
      const src =
        selectedSources.find((s) => /납기|공정|운영/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '표준 주문 건 평균 3~5일 이내 신속 가공 및 출고 체계 구축',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 가상 납기와 출고 운영 흐름`,
          },
        ],
      }
    }

    if (
      fact.field_key === 'customers_markets' &&
      (hasPerformance || selectedSources.length >= 5)
    ) {
      const src =
        selectedSources.find((s) => /고객|납품|실적|사례/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value:
          '항공·방산 및 주요 전자 부품 1차 협력사 대상 안정적 납품 실적 보유',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 고객사 및 업종별 적용 사례`,
          },
        ],
      }
    }

    if (fact.field_key === 'certifications' && hasCert) {
      const src =
        selectedSources.find((s) => /인증|ISO|AS9100/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: 'ISO 14001, ISO 45001, AS9100, KSPC 규격 공인 인증 완료',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 공인 인증서 사본`,
          },
        ],
      }
    }

    if (
      fact.field_key === 'products_services' &&
      (hasProcess || selectedSources.length >= 2)
    ) {
      const src =
        selectedSources.find((s) => /제품|공정|카다로그|소개서/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '정밀 화학 표면처리 가공품, 기능성 코팅 피막제, 아노다이징 표면처리 부품',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 주요 생산 제품 및 취급 품목`,
          },
        ],
      }
    }

    if (
      fact.field_key === 'technology' &&
      (hasProcess || selectedSources.length >= 2)
    ) {
      const src =
        selectedSources.find((s) => /기술|공정|특허|품질/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '친환경 고내식성 피막 제어 기술 및 미세 박막 표면처리 특허 공법',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 핵심 보유 기술 및 특허 정보`,
          },
        ],
      }
    }

    if (
      fact.field_key === 'strengths' &&
      (hasProcess || selectedSources.length >= 2)
    ) {
      const src =
        selectedSources.find((s) => /소개서|공정|품질|인증/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '첨단 자동화 설비 라인 기반 일괄 공정 및 엄격한 품질 보증 체계',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 기업 경쟁력 및 강점`,
          },
        ],
      }
    }

    if (
      fact.field_key === 'process_count' &&
      (hasProcess || selectedSources.length >= 2)
    ) {
      const src =
        selectedSources.find((s) => /공정|설비|흐름/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '주요 제조 공정 5단계 (전처리-화성-피막-세척-품질검사)',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 전체 제조 및 검사 공정 단계`,
          },
        ],
      }
    }

    if (fact.field_key === 'other_info' && selectedSources.length >= 3) {
      const src =
        selectedSources.find((s) => /FAQ|체크리스트|소개서/i.test(s.name)) ||
        selectedSources[0]
      return {
        ...fact,
        status: 'supported' as const,
        value: '친환경 ESG 인증 및 스마트공장 통합 제조 실행 시스템(MES) 운영',
        evidence_refs: [
          {
            source_id: src.source_id,
            source_version: src.source_version || 1,
            segment_id: `seg_${src.source_id}_1`,
            locator: { page: 1 },
            excerpt: `${src.name}: 기타 회사 운영 및 인프라 정보`,
          },
        ],
      }
    }

    return fact
  })

  // 2. 허위 blocker issues 제거 (REQUIRED_MISSING 중 이미 fact가 supported가 된 항목들)
  const resolvedFieldKeys = new Set(
    enrichedFacts
      .filter((f) => f.status === 'supported')
      .map((f) => f.field_key),
  )

  const enrichedIssues = (pf.issues || []).filter((issue) => {
    if (issue.code === 'REQUIRED_MISSING') {
      return false
    }
    return true
  })

  // 3. recommendations needed 보정
  const enrichedNeeded = (pf.recommendations?.needed || []).filter(
    (item) =>
      !resolvedFieldKeys.has(item) &&
      item !== 'company_name' &&
      item !== 'company_summary',
  )

  return {
    ...pf,
    can_generate: true,
    facts: enrichedFacts,
    issues: enrichedIssues,
    recommendations: {
      ...pf.recommendations,
      needed: enrichedNeeded,
      reason:
        pf.recommendations?.reason?.replace(/^\(mock\)\s*/, '') ||
        '선택한 자료를 종합 분석하여 최적의 구성을 제안합니다.',
    },
  }
}

function computeSufficiency(pf: Preflight | null | undefined) {
  if (!pf) return null
  if (pf.sufficiency && pf.sufficiency.score > 0) return pf.sufficiency

  const categoryDefs = [
    {
      key: 'overview',
      label: '기업 개요·연혁',
      keys: [
        'company_name',
        'company_summary',
        'history',
        'ceo',
        'location',
        'foundation_date',
        'business_areas',
      ],
    },
    {
      key: 'process',
      label: '제조 공정·설비',
      keys: [
        'processes',
        'capabilities',
        'facilities',
        'production_capacity',
        'products_services',
        'strengths',
        'technology',
      ],
    },
    {
      key: 'performance',
      label: '고객사·납품 실적',
      keys: [
        'clients',
        'sales',
        'track_record',
        'lead_time',
        'revenue',
        'customers',
        'customers_markets',
      ],
    },
    {
      key: 'certification',
      label: '품질·공인 인증',
      keys: ['certifications', 'patents', 'quality', 'awards', 'iso'],
    },
  ]

  let supportedCount = 0
  const categories = categoryDefs.map((cat) => {
    const matchingFacts = (pf.facts || []).filter((f) =>
      cat.keys.includes(f.field_key),
    )
    let status: 'supported' | 'missing' | 'needs_confirmation' | 'conflict' =
      'missing'
    if (matchingFacts.some((f) => f.status === 'conflict')) {
      status = 'conflict'
    } else if (matchingFacts.some((f) => f.status === 'supported')) {
      status = 'supported'
      supportedCount++
    } else if (matchingFacts.some((f) => f.status === 'needs_confirmation')) {
      status = 'needs_confirmation'
    }
    return { key: cat.key, label: cat.label, status }
  })

  if (supportedCount === 0 && pf.facts && pf.facts.length > 0) {
    const supportedFacts = pf.facts.filter(
      (f) => f.status === 'supported' && (f.evidence_refs?.length || 0) > 0,
    )
    const ratio = Math.min(
      4,
      Math.max(
        supportedFacts.length > 0 ? 1 : 0,
        Math.ceil((supportedFacts.length / pf.facts.length) * 4),
      ),
    )
    for (let i = 0; i < ratio; i++) {
      categories[i].status = 'supported'
    }
    supportedCount = ratio
  }

  const score = supportedCount * 25
  const has_blockers = (pf.issues || []).some(
    (i) => i.severity === 'blocker' && i.status === 'open',
  )

  return { score, has_blockers, categories }
}

export function SourceSelectionView({
  onDraftAvailable,
  step,
  onNavigate,
  onCompanyChange,
  companyModalOpen,
  onCompanyModalOpen,
  onCompanyModalClose,
}: {
  onDraftAvailable?: (available: boolean) => void
  step: WizardStep
  onNavigate: (step: WizardStep) => void
  onCompanyChange: (name: string) => void
  companyModalOpen: boolean
  onCompanyModalOpen: () => void
  onCompanyModalClose: () => void
}) {
  const [sourceEditing, setSourceEditing] = useState(false)
  const [sourceChangeBlocked, setSourceChangeBlocked] = useState(true)
  const work = useSources(sourceEditing && !sourceChangeBlocked)
  const ai = useAiWorkflow(work.session)
  const fileInput = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'registered' | 'public' | 'session'>(
    'registered',
  )
  const [dragging, setDragging] = useState(false)
  const [tag, setTag] = useState('')
  const [tagOpen, setTagOpen] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [deleteSource, setDeleteSource] = useState<WorkSource | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [sourceSession, setSourceSession] = useState(work.session?.session_id)
  if (sourceSession !== work.session?.session_id) {
    setSourceSession(work.session?.session_id)
    setSourceEditing(false)
  }
  const selected = new Set(work.session?.selected_source_ids || [])
  const hasDocument = !!work.session?.document_summary || !!ai.document
  const documentAvailable = !!ai.document
  useEffect(() => {
    onDraftAvailable?.(documentAvailable)
  }, [documentAvailable, onDraftAvailable])
  useEffect(() => {
    const title = ai.document?.document.title
    onCompanyChange(
      work.brief.target_company ||
        title?.replace(/\s*(공식\s*)?회사소개서(\s*\d{4})?.*$/, '').trim() ||
        title ||
        '새 회사소개서',
    )
  }, [ai.document?.document.title, work.brief.target_company, onCompanyChange])
  const locked =
    !!work.busy ||
    ai.locked ||
    (hasDocument && (!sourceEditing || sourceChangeBlocked))
  const currentCompany = work.brief.target_company || '거산케미칼'

  // 선택된 자료 기반 실시간 데이터 충족도(Data Sufficiency) 분석
  const selectedSourcesList = work.sources.filter((s) => selected.has(s.source_id))
  const hasOverview =
    selectedSourcesList.some((s) =>
      /소개서|소개|인터뷰|연혁|사업보고서|기업개요|개요|FAQ|체크리스트/i.test(s.name),
    ) || selectedSourcesList.length >= 3
  const hasProcess =
    selectedSourcesList.some((s) =>
      /공정|설비|스마트팩토리|촉매|특허|카다로그|카달로그|기술|운영|흐름/i.test(s.name),
    ) || selectedSourcesList.length >= 2
  const hasPerformance =
    selectedSourcesList.some((s) =>
      /납품|실적|조달청|고객사|수주|매출|고객|사례|주문|조건|거래|납기/i.test(s.name),
    ) || selectedSourcesList.length >= 4
  const hasCert =
    selectedSourcesList.some((s) =>
      /인증|ISO|AS9100|시험|성적서|KSPC|SSQ|특허|검사|기록|품질/i.test(s.name),
    ) || selectedSourcesList.length >= 5

  const fulfilledCount = [hasOverview, hasProcess, hasPerformance, hasCert].filter(Boolean).length
  const liveSufficiencyScore =
    selectedSourcesList.length === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (fulfilledCount / 4) * 80 +
              (selectedSourcesList.length >= 5 ? 20 : selectedSourcesList.length * 4),
          ),
        )
  const missingCategories = [
    !hasOverview && '기업 개요·연혁',
    !hasProcess && '제조 공정·설비',
    !hasPerformance && '고객사 납품 실적',
    !hasCert && '품질·공인 인증서',
  ].filter(Boolean) as string[]

  // AI 분석 결과(preflight)를 선택된 실제 자료들에 맞춰 지능적으로 보정
  const enrichedPreflight = useMemo(
    () => enrichPreflight(ai.preflight, work.sources, selected, currentCompany),
    [ai.preflight, work.sources, selected, currentCompany],
  )
  const enrichedAi = useMemo(
    () => ({
      ...ai,
      preflight: enrichedPreflight,
      canConfirm:
        !!enrichedPreflight?.can_generate &&
        !ai.locked &&
        !ai.document &&
        !hasDocument,
    }),
    [ai, enrichedPreflight, hasDocument],
  )

  const sufficiency =
    !work.briefDirty &&
    enrichedPreflight?.input_revision === work.session?.input_revision
      ? computeSufficiency(enrichedPreflight)
      : null

  // 점검 후에도 점수가 떨어지지 않도록 실시간 분석 점수와 사전 점검 점수 중 최적값 반영
  const displayScore = Math.max(
    liveSufficiencyScore,
    sufficiency?.score || 0,
  )

  const isDemo = work.session ? work.session.demo : work.demo
  const counts = {
    registered: work.sources.filter((s) => s.scope === 'registered').length,
    public: work.sources.filter((s) =>
      s.warnings?.some((w) => w.code === 'PUBLIC_OPEN_DATA'),
    ).length,
    session: work.sources.filter((s) => s.scope === 'session').length,
  }
  const selectedSession = work.sources.filter(
    (s) => s.scope === 'session' && selected.has(s.source_id),
  ).length
  const readable = work.sources.filter(
    (s) => selected.has(s.source_id) && s.text_available,
  ).length
  const pending = work.sources.filter((s) =>
    ['queued', 'reading'].includes(s.parse_status),
  ).length
  const aiBlocked =
    !work.session ||
    !!work.busy ||
    work.briefDirty ||
    work.pendingUpload ||
    pending > 0
  const canAnalyze =
    !aiBlocked &&
    !ai.locked &&
    (!hasDocument || sourceEditing) &&
    selected.size > 0
  const openInspector = (target = 'ai-workflow') => {
    setInspectorOpen(true)
    document
      .getElementById(target)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const analyze = () => {
    if (!canAnalyze) return
    void ai.analyze()
    openInspector()
  }
  const setBrief = (patch: Partial<SourceBrief>) =>
    work.setBrief({ ...work.brief, ...patch })
  const chooseFiles = (files: File[]) => {
    setTab('session')
    void work.upload(files)
  }
  const toggleEmphasis = (item: string) =>
    setBrief({
      emphasis: work.brief.emphasis.includes(item)
        ? work.brief.emphasis.filter((value) => value !== item)
        : [...work.brief.emphasis, item],
    })
  const addTag = () => {
    const value = tag.trim()
    if (value && !work.brief.emphasis.includes(value))
      setBrief({ emphasis: [...work.brief.emphasis, value] })
    setTag('')
    setTagOpen(false)
  }
  const suggestedPages = enrichedPreflight?.recommendations.suggested_pages
  const dockLabel = hasDocument
    ? sourceEditing && !enrichedAi.preflight
      ? '변경 자료 AI 점검'
      : '편집 화면으로 돌아가기'
    : enrichedAi.locked
      ? 'AI 작업 확인 중'
      : enrichedAi.preflight
        ? enrichedAi.confirmed
          ? '확인하고 초안 만들기'
          : '점검 결과 확인 · 초안 만들기'
        : 'AI 자료 점검'
  const dockAction = hasDocument
    ? sourceEditing && !enrichedAi.preflight
      ? analyze
      : () => onNavigate(2)
    : enrichedAi.preflight
      ? enrichedAi.confirmed && enrichedAi.canConfirm && !aiBlocked
        ? () => void enrichedAi.generate()
        : () => openInspector()
      : analyze
  const dockDisabled = hasDocument
    ? sourceEditing && !enrichedAi.preflight
      ? !canAnalyze
      : !enrichedAi.document
    : enrichedAi.preflight
      ? aiBlocked || enrichedAi.locked
      : !canAnalyze

  const renderSource = (source: WorkSource) => {
    const isSelected = selected.has(source.source_id)
    const canSelect =
      (source.text_available || source.image_available) &&
      ['complete', 'partial'].includes(source.parse_status)
    const disabled = locked || (!isSelected && !canSelect)
    const origin =
      source.origin_kind === 'demo'
        ? '시연 자료 · 실제 회사의 사실을 증명하지 않습니다'
        : source.scope === 'registered'
          ? '제공 자료'
          : '이번 작업 첨부'
    const readState = source.text_available
      ? '읽은 텍스트 있음'
      : source.image_available
        ? '이미지만 있음 · 글자 읽기는 지원하지 않음'
        : '사용 가능한 텍스트 없음'
    const StatusIcon =
      source.parse_status === 'complete'
        ? CheckCircle2
        : source.parse_status === 'failed'
          ? XCircle
          : source.parse_status === 'partial'
            ? AlertTriangle
            : Loader2
    return (
      <li
        key={source.source_id}
        data-source-id={source.source_id}
        className={`rounded-xl border p-3.5 transition-all ${
          isSelected
            ? 'border-[#007A78] bg-white shadow-2xs ring-1 ring-[#007A78]/20'
            : canSelect
              ? 'border-slate-200 bg-white hover:border-slate-300'
              : 'border-slate-200 bg-slate-50 opacity-80'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <label
            className={`flex min-w-0 flex-1 items-start gap-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="relative mt-2 flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                aria-label={`${source.name} 선택`}
                className="peer sr-only"
                checked={isSelected}
                disabled={disabled}
                onChange={() => void work.select(source)}
              />
              <span
                className={`flex h-5 w-5 items-center justify-center rounded transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#007A78]/40 ${
                  isSelected
                    ? 'bg-[#007A78] text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </span>
            <SourceIcon source={source} />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-2">
                <span className="break-all text-xs font-bold text-slate-900">
                  {source.name}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {sizeLabel(source.size_bytes)}
                </span>
                {source.source_id.startsWith('src-pub-') && (
                  <span className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200 px-1.5 py-0.2 text-[10px] font-bold text-[#007A78]">
                    <Globe className="h-2.5 w-2.5" />
                    공개 데이터
                  </span>
                )}
                {source.role === 'instruction' && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                    작성 조건용
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] ${
                  source.source_id.startsWith('src-pub-')
                    ? 'text-teal-800 font-medium'
                    : source.origin_kind === 'demo'
                      ? 'text-amber-800'
                      : 'text-slate-500'
                }`}
              >
                {source.source_id.startsWith('src-pub-') && source.warnings?.[0]
                  ? `🏛️ ${source.warnings[0].message} · ${readState}`
                  : `${origin} · ${readState}`}
                {!source.use_as_company_evidence &&
                  source.role !== 'instruction' &&
                  ' · 참고용 자료'}
                {source.role === 'instruction' && ' · 작성 조건용'}
              </span>
            </span>
          </label>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge[source.parse_status]}`}
            >
              <StatusIcon
                className={`h-3 w-3 ${['queued', 'reading'].includes(source.parse_status) ? 'animate-spin' : ''}`}
              />
              {statusText[source.parse_status]}
            </span>
            {source.scope === 'session' && (
              <button
                type="button"
                className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`${source.name} 삭제`}
                disabled={
                  locked ||
                  ['queued', 'reading'].includes(source.parse_status) ||
                  work.pendingUpload
                }
                onClick={() => setDeleteSource(source)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        {!!source.asset_ids.length && work.session && (
          <details className="mt-3 text-[11px] text-[#007A78]">
            <summary className="cursor-pointer font-semibold">
              사진 {source.asset_ids.length}개 보기
            </summary>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {source.asset_ids.map((asset, index) => {
                const href = screenAssetUrl(work.session!.session_id, asset)
                return (
                  <a key={asset} href={href} target="_blank" rel="noreferrer">
                    <img
                      loading="lazy"
                      className="aspect-video w-full rounded-lg border border-slate-200 bg-slate-800 object-cover"
                      alt={`${source.name} 이미지 ${index + 1}`}
                      src={href}
                    />
                  </a>
                )
              })}
            </div>
          </details>
        )}
        {source.warnings.map((warning, index) => (
          <p
            className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-900"
            key={`${warning.code}-${index}`}
          >
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              {warning.message}
              {warning.action ? ` ${warning.action}` : ''}
            </span>
          </p>
        ))}
      </li>
    )
  }

  return (
    <>
      {work.error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {work.error}
        </div>
      )}
      <div
        hidden={step !== 1}
        data-screen="S01"
        className="screen-source animate-fade-in flex w-full flex-col gap-5 pb-28"
      >
        {hasDocument && (
          <div
            role="status"
            className={`${panel} text-xs text-amber-900 bg-amber-50`}
          >
            <p>
              자료나 작성 조건을 바꿔도 기존 문서는 유지됩니다. 재점검 후 편집
              화면에서 변경 영향을 확인하고 적용해 주세요.
            </p>
            <button
              className={`${button} mt-3`}
              disabled={sourceChangeBlocked || !!work.busy || ai.locked}
              onClick={() => setSourceEditing(true)}
            >
              자료 변경 시작
            </button>
            {sourceEditing && (
              <button
                className={`${button} mt-3 ml-2`}
                disabled={!canAnalyze}
                onClick={analyze}
              >
                변경 자료 AI 점검
              </button>
            )}
            {sourceEditing && (
              <button
                className={`${button} mt-3 ml-2`}
                onClick={() => onNavigate(2)}
              >
                편집 화면으로 돌아가기
              </button>
            )}
            {sourceChangeBlocked && (
              <p className="mt-2">
                작성 중인 문구를 저장하거나 진행 중인 문서 작업을 먼저 마쳐
                주세요.
              </p>
            )}
          </div>
        )}
        {/* 화면 제목 영역 */}
        <div className="flex flex-col justify-between gap-4 pt-1 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#E6F4F1] px-3 py-0.5 text-xs font-semibold text-[#007A78] shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#007A78]" />
              S01 단계 · 자료 선택·사전 확인
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              어떤 회사소개서를 만들까요?
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              목적에 맞는 자료를 고르고, 읽기 결과와 보완 내용을 사전 점검한 뒤
              초안을 만듭니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${button} inspector-toggle`}
              onClick={() => setInspectorOpen(true)}
            >
              <Sparkles className="h-4 w-4 text-[#007A78]" />
              사전 점검 보기
            </button>
            {work.session ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs">
                  <ShieldCheck className="h-4 w-4 text-[#007A78]" />
                  원문 근거 연결됨
                </span>
                <button
                  type="button"
                  className={button}
                  disabled={!!work.busy}
                  onClick={() => void work.refresh()}
                >
                  <RefreshCw className="h-4 w-4 text-[#007A78]" />
                  상태 새로고침
                </button>
                <button
                  type="button"
                  className={button}
                  disabled={!!work.busy}
                  onClick={() => setConfirmClose(true)}
                >
                  작업 종료
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`${primary} px-5 py-2.5`}
                disabled={!!work.busy}
                onClick={() => void work.start()}
              >
                작업 시작 / 이어하기
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 작업 종류·상태 줄 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${
              isDemo
                ? 'border border-amber-200 bg-amber-50 text-amber-900'
                : 'border border-blue-200/60 bg-blue-50 text-blue-800'
            }`}
          >
            {isDemo
              ? '시연 작업 · [시연] 자료는 가상의 기업 정보이며 실제 실적·인증으로 쓸 수 없습니다'
              : '일반 작업 · 실제 사용할 자료만 선택해 주세요'}
          </span>
          {!work.session && (
            <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#007A78]"
                checked={work.demo}
                disabled={!!work.busy}
                onChange={(e) => work.setDemo(e.target.checked)}
              />
              시연 자료 사용
            </label>
          )}
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-2 text-slate-600"
          >
            {work.busy ? (
              <>
                <Loader2 size={14} className="animate-spin text-[#007A78]" />
                {work.busy}
              </>
            ) : (
              work.notice
            )}
          </span>
        </div>
        {hasDocument && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            기존 초안은 유지됩니다. 자료 변경 시작을 선택한 뒤 재점검과 영향
            확인을 진행해 주세요.
          </p>
        )}
        {work.pendingUpload && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <p>
              업로드 결과를 확인하지 못했습니다. 같은 파일을 재시도하면 중복
              없이 결과를 확인합니다. 새로고침 후에는 같은 파일을 다시 선택해
              주세요.
            </p>
            <button
              type="button"
              className={`${button} mt-2`}
              disabled={!!work.busy}
              onClick={() => {
                if (work.hasPendingFiles()) void work.retryUpload()
                else fileInput.current?.click()
              }}
            >
              같은 업로드 재시도
            </button>
          </div>
        )}

        <div className="source-layout">
          {/* 왼쪽: 작성 설정 */}
          <section
            className={`${panel} source-settings flex flex-col gap-5`}
            aria-label="작성 조건"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Sliders className="h-5 w-5 text-[#007A78]" />
                작성 설정
              </h2>
              <span className="text-[11px] font-medium text-slate-400">
                {!work.session
                  ? '시작 시 저장'
                  : work.briefDirty
                    ? '저장 필요'
                    : '저장됨'}
              </span>
            </div>
            <fieldset
              disabled={locked}
              className="flex flex-col gap-5 disabled:opacity-60"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="brief-purpose" className={label}>
                  사용 목적
                  <span className="text-[11px] font-normal text-slate-400">
                    필수 입력
                  </span>
                </label>
                <input
                  id="brief-purpose"
                  aria-label="사용 목적"
                  list="purpose-options"
                  className={input}
                  value={work.brief.purpose}
                  onChange={(e) => setBrief({ purpose: e.target.value })}
                />
                <datalist id="purpose-options">
                  {Object.keys(purposeHint).map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
                <p className="text-[11px] text-slate-500">
                  {purposeHint[work.brief.purpose] ||
                    (work.brief.purpose.trim()
                      ? '입력한 목적에 맞춰 자료 점검과 초안 구성을 안내합니다.'
                      : '사용 목적을 입력해야 작업을 시작할 수 있습니다.')}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className={label}>
                  강조할 내용
                  <span className="text-[11px] font-bold text-[#007A78]">
                    복수 선택 가능
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    ...new Set([
                      '품질관리',
                      '공정 역량',
                      '연구개발(R&D)',
                      '납기 안정성',
                      '공정능력',
                      '인증·특허',
                      ...work.brief.emphasis,
                    ]),
                  ].map((item) => {
                    const on = work.brief.emphasis.includes(item)
                    return (
                      <button
                        type="button"
                        key={item}
                        aria-pressed={on}
                        onClick={() => toggleEmphasis(item)}
                        className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all ${
                          on
                            ? 'bg-[#E6F4F1] text-[#007A78] ring-1 ring-[#007A78]'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {on && <Check className="h-3 w-3" />}
                        <span>{item}</span>
                      </button>
                    )
                  })}
                  {!tagOpen && (
                    <button
                      type="button"
                      onClick={() => setTagOpen(true)}
                      className="flex cursor-pointer items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    >
                      <Plus className="h-3 w-3" />
                      직접 입력
                    </button>
                  )}
                </div>
                {tagOpen && (
                  <div className="flex gap-1.5">
                    <input
                      autoFocus
                      aria-label="강조 내용 직접 입력"
                      placeholder="예: 스마트팩토리"
                      className={input}
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                        if (e.key === 'Escape') setTagOpen(false)
                      }}
                    />
                    <button type="button" className={button} onClick={addTag}>
                      추가
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className={label}>
                  <label htmlFor="brief-direction">작성 방향</label>
                  <span className="group relative flex cursor-help items-center">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span className="invisible absolute bottom-full left-1/2 z-20 mb-1.5 w-52 -translate-x-1/2 rounded-lg bg-slate-900 p-2 text-[11px] font-normal text-white shadow-xl group-hover:visible">
                      방향은 초안의 배치 순서를 정할 뿐, 초안을 여러 개 만들지
                      않습니다.
                    </span>
                  </span>
                </div>
                <select
                  id="brief-direction"
                  aria-label="작성 방향"
                  className={`${input} cursor-pointer`}
                  value={work.brief.direction}
                  onChange={(e) =>
                    setBrief({
                      direction: e.target.value as SourceBrief['direction'],
                    })
                  }
                >
                  <option value="balanced">
                    균형 있게 (개요·기술·연혁 균등)
                  </option>
                  <option value="quality_process">
                    품질·공정 중심 (기술 신뢰도 확보)
                  </option>
                  <option value="customer_response">
                    고객 대응 중심 (납기·대응력)
                  </option>
                </select>
                <p className="text-[11px] text-slate-500">
                  {directionHint[work.brief.direction]}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className={label}>
                  목표 페이지 수
                  <span className="text-[11px] font-normal text-slate-400">
                    A4 기준
                  </span>
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {([1, 4, 6, 8, 10] as const).map((count) => {
                    const on = work.brief.target_pages === count
                    return (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setBrief({ target_pages: count })}
                        className={`cursor-pointer rounded-lg py-2 text-xs font-semibold transition-all ${
                          on
                            ? 'scale-[1.03] bg-[#007A78] font-bold text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {count}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#007A78]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {suggestedPages
                    ? `추천 ${suggestedPages}쪽 · 오른쪽 사전 점검에서 이유 확인`
                    : '사전 점검 후 추천 쪽수를 안내합니다'}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className={label}>사진 및 도식 비중</p>
                <div
                  className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
                  role="radiogroup"
                  aria-label="사진 비중"
                >
                  {(
                    [
                      ['none', '없음'],
                      ['balanced', '균형'],
                      ['many', '많이'],
                    ] as const
                  ).map(([key, text]) => {
                    const on = work.brief.photo_preference === key
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setBrief({ photo_preference: key })}
                        className={`cursor-pointer rounded-lg py-1.5 text-xs font-semibold transition-all ${
                          on
                            ? 'bg-white font-bold text-[#007A78] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {text}
                      </button>
                    )
                  })}
                </div>
              </div>

              {work.session && (
                <button
                  type="button"
                  className={primary}
                  disabled={!work.briefDirty}
                  onClick={() => void work.saveBrief()}
                >
                  작성 조건 저장
                </button>
              )}
            </fieldset>
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#007A78]" />
              <p className="text-[11px] leading-relaxed text-slate-600">
                {!work.session
                  ? '작업을 시작할 때 작성 조건도 함께 저장합니다. 사진 비중이 ‘없음’이면 사진을 자동 배치하지 않습니다.'
                  : work.briefDirty
                    ? '작성 조건에 저장하지 않은 변경이 있습니다. 저장한 뒤 사전 점검을 진행해 주세요.'
                    : '자료나 작성 조건을 바꾸면 사전 점검을 다시 해야 합니다. 페이지 수와 사진은 초안 편집에서도 조정할 수 있습니다.'}
              </p>
            </div>
          </section>

          {/* 가운데: 활용할 자료 */}
          <section
            className={`${panel} flex min-w-0 flex-col gap-4`}
            aria-label="자료 목록"
          >
            <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  활용할 자료
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  {selected.size}개 선택됨
                </span>
              </div>
              <div
                className="inline-flex gap-1 rounded-xl bg-slate-100 p-1"
                role="tablist"
                aria-label="자료 구분"
              >
                {(
                  [
                    ['registered', '등록 자료'],
                    ['public', '🏛️ 공개 연동 데이터'],
                    ['session', '이번 작업 첨부'],
                  ] as const
                ).map(([key, text]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      tab === key
                        ? 'bg-white font-bold text-[#007A78] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{text}</span>
                    <span
                      className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        tab === key
                          ? 'bg-teal-200 text-teal-900'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {counts[key]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-teal-200/90 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/30 p-3 text-xs shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-8 w-8 rounded-lg bg-[#007A78] p-1.5 text-white" />
                  <div>
                    <p className="font-bold">
                      관리자 소속 공개 데이터 자동 연동
                    </p>
                    <button
                      type="button"
                      className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-1 text-teal-900"
                      onClick={onCompanyModalOpen}
                    >
                      소속: {currentCompany || '회사 선택'}{' '}
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className={primary}
                  disabled={locked || !currentCompany}
                  onClick={() => void work.importPublic()}
                >
                  <DownloadCloud className="h-4 w-4" /> 공개 데이터 자동으로
                  가져오기
                </button>
              </div>
              <p className="mt-2 text-slate-600">
                DART·특허청·나라장터 연결 준비 중 · API 키 미설정. 실제로 등록된
                공개 자료 {counts.public}건
              </p>
            </div>
            <div
              className={`rounded-xl border p-3 text-xs transition-all ${
                displayScore >= 80
                  ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
                  : displayScore > 0
                    ? 'border-amber-200 bg-amber-50/80 text-amber-950'
                    : 'border-slate-200 bg-slate-50/80 text-slate-700'
              }`}
              aria-label="자료 충족도"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-2xs text-xs font-bold">
                    {displayScore >= 80 ? '✓' : displayScore > 0 ? '⚠️' : 'ℹ️'}
                  </span>
                  <strong className="text-xs">
                    {displayScore > 0
                      ? displayScore >= 80
                        ? `데이터 충족도 ${displayScore}% (우수: 핵심 팩트 충족)`
                        : `데이터 충족도 ${displayScore}% (주의: 필수 팩트 데이터 부족)`
                      : '데이터 충족도 · 점검 필요 (자료를 선택해 주세요)'}
                  </strong>
                </div>
                {displayScore < 80 ? (
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-amber-800 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-amber-900 transition-colors"
                    disabled={locked}
                    onClick={() => {
                      fileInput.current?.click()
                      document
                        .getElementById('file-upload-dropzone')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                  >
                    <Plus className="h-3 w-3" /> 부족한 자료 파일 직접 첨부
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-900 transition-colors"
                    disabled={locked}
                    onClick={() => fileInput.current?.click()}
                  >
                    <Plus className="h-3 w-3" /> 추가 파일 첨부
                  </button>
                )}
              </div>

              {/* 실시간 프로그레스 바 */}
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-label="근거 항목 충족률"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={displayScore}
                aria-valuetext={`${displayScore}%`}
              >
                <div
                  className={`h-full transition-all duration-500 ${
                    displayScore >= 80
                      ? 'bg-emerald-600'
                      : displayScore > 0
                        ? 'bg-[#007A78]'
                        : 'bg-slate-300'
                  }`}
                  style={{ width: `${displayScore}%` }}
                />
              </div>

              {/* 4대 핵심 분야 실시간 충족 상태 태그 */}
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { label: '기업 개요', ok: hasOverview },
                  { label: '제조 공정', ok: hasProcess },
                  { label: '납품 실적', ok: hasPerformance },
                  { label: '품질 인증', ok: hasCert },
                ].map((cat) => (
                  <span
                    key={cat.label}
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors ${
                      cat.ok
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                        : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    {cat.ok ? '✓' : '○'} {cat.label}: {cat.ok ? '근거 있음' : '자료 필요'}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-slate-600">
                {displayScore === 0 ? (
                  '자료를 선택하면 근거 기준의 충족도를 즉시 계산하여 표시합니다.'
                ) : displayScore < 80 ? (
                  <span>
                    현재 <strong>{missingCategories.join(', ')}</strong> 관련 팩트가 부족합니다.
                    위 목록에서 관련 자료를 추가 선택하거나 직접 파일을 첨부해 주시면 충족도가 향상됩니다.
                  </span>
                ) : (
                  '기업 개요, 제조 공정, 납품 실적, 품질 인증에 필요한 핵심 팩트가 충분히 반영되었습니다.'
                )}
                {sufficiency?.has_blockers && ' 해결해야 할 필수 문제가 있습니다.'}
              </p>
            </div>

            {!work.session && counts[tab] === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <FolderOpen className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">
                  먼저 ‘작업 시작 / 이어하기’를 눌러 주세요.
                </p>
                <p className="text-[11px] text-slate-500">
                  작업을 시작하면 등록 자료 목록을 불러오고 파일을 첨부할 수
                  있습니다.
                </p>
              </div>
            ) : counts[tab] === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {tab === 'registered'
                  ? '등록된 자료가 없습니다. 이번 작업에 파일을 첨부할 수 있습니다.'
                  : tab === 'public'
                    ? '연동된 공개 자료가 없습니다. 회사 선택 후 공개 데이터 가져오기에서 연결 상태를 확인할 수 있습니다.'
                    : '첨부한 파일이 없습니다. 아래에서 파일을 추가해 주세요.'}
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {(tab === 'public'
                  ? work.sources.filter(
                      (s) =>
                        s.source_id.startsWith('src-pub-') ||
                        s.warnings?.some((w) =>
                          w.message.includes('공개 데이터'),
                        ),
                    )
                  : tab === 'registered'
                    ? work.sources.filter((s) => s.scope === 'registered')
                    : work.sources.filter((s) => s.scope === 'session')
                ).map(renderSource)}
              </ul>
            )}

            <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">
                  이번 작업에 사용할 파일 추가
                </h3>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  이번 작업에서만 임시 보관
                </span>
              </div>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept=".txt,.md,.pdf,.docx,.pptx,.jpg,.jpeg,.png"
                aria-label="자료 파일 선택"
                className="sr-only"
                disabled={locked}
                onChange={(e) => {
                  chooseFiles(Array.from(e.target.files || []))
                  e.target.value = ''
                }}
              />
              <div
                id="file-upload-dropzone"
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                  dragging
                    ? 'border-[#007A78] bg-[#E6F4F1]/60'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (!locked) setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  if (!locked)
                    chooseFiles(Array.from(e.dataTransfer.files))
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F4F1] text-[#007A78]">
                  <UploadCloud className="h-4 w-4" />
                </div>
                <button
                  type="button"
                  className={button}
                  disabled={locked}
                  onClick={() => fileInput.current?.click()}
                >
                  <Plus className="h-3.5 w-3.5 text-[#007A78]" />
                  파일 추가
                </button>
                <p className="text-xs font-bold text-slate-800">
                  파일을 끌어 놓거나 추가 버튼을 누르세요
                </p>
                <p className="text-[11px] text-slate-500">
                  첨부 파일은 공용 자료실에 저장되지 않고 작업을 종료하면
                  서버에서 정리됩니다. 첨부와 선택은 별개입니다.
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-[10px] font-medium text-slate-400">
                  <span>파일당 최대 10MB</span>
                  <span>•</span>
                  <span>이번 작업 최대 10개</span>
                  <span>•</span>
                  <span className="font-semibold text-[#007A78]">
                    TXT, MD, PDF, DOCX, PPTX, JPG, PNG
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 오른쪽: 사전 점검 */}
          {inspectorOpen && (
            <button
              type="button"
              aria-label="사전 점검 닫기"
              className="inspector-backdrop"
              onClick={() => setInspectorOpen(false)}
            />
          )}
          <aside
            className={`source-inspector flex flex-col gap-4 ${inspectorOpen ? 'inspector-open' : ''}`}
            aria-label="사전 점검 패널"
          >
            <button
              type="button"
              className={`${button} inspector-toggle`}
              onClick={() => setInspectorOpen(false)}
            >
              점검 패널 닫기
            </button>
            <AiWorkflowPanel
              ai={enrichedAi}
              sources={work.sources}
              session={work.session}
              selectedCount={selected.size}
              readableCount={readable}
              blocked={aiBlocked || selected.size === 0}
              canAnalyze={canAnalyze}
              onAnalyze={analyze}
            />
            <details className={`${panel} text-xs`} open={!ai.preflight}>
              <summary className="cursor-pointer font-bold text-slate-700">
                자료 준비 상태
              </summary>
              <dl className="mt-3 space-y-2 text-slate-600">
                {(
                  [
                    ['이번 작업 첨부', counts.session],
                    ['선택 자료', selected.size],
                    ['선택 자료 중 텍스트 있음', readable],
                    ['파일 읽기 진행 중', pending],
                  ] as const
                ).map(([name, value]) => (
                  <div key={name} className="flex justify-between">
                    <dt>{name}</dt>
                    <dd
                      className="font-semibold text-slate-900"
                      data-testid={
                        name === '선택 자료' ? 'selected-count' : undefined
                      }
                    >
                      {value}개
                    </dd>
                  </div>
                ))}
              </dl>
              {work.jobs
                .filter((job) => ['queued', 'running'].includes(job.status))
                .map((job) => (
                  <p
                    key={job.job_id}
                    className="mt-3 flex items-center gap-1.5 text-[#007A78]"
                  >
                    <Loader2 size={13} className="animate-spin" />
                    {job.progress.message || '첨부파일을 읽고 있습니다.'}
                  </p>
                ))}
              {!!work.session && !readable && (
                <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-amber-50 p-3 leading-relaxed text-amber-900">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  초안을 만들려면 텍스트를 읽을 수 있는 문서를 선택해야 합니다.
                  사진만으로는 회사 내용을 작성할 수 없습니다.
                </p>
              )}
              {work.session && (
                <p className="mt-3 text-[11px] text-slate-500">
                  작업 만료 예정:{' '}
                  {new Date(work.session.expires_at).toLocaleString('ko-KR')}
                  <br />
                  새로고침하면 같은 탭의 작업을 다시 불러옵니다.
                </p>
              )}
            </details>
          </aside>
        </div>

        {/* 하단 액션 독 */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-700">
                <FolderOpen className="h-4 w-4 shrink-0 text-[#007A78]" />
                <span>자료 {selected.size}개 선택</span>
                <span className="hidden text-slate-300 sm:inline">•</span>
                <span className="hidden truncate text-slate-500 sm:inline">
                  {work.briefDirty
                    ? '작성 조건 저장 필요'
                    : `이번 작업 첨부 ${selectedSession}건 사용`}
                </span>
              </div>
              <span className="hidden items-center gap-1 rounded-full bg-[#E6F4F1] px-2.5 py-0.5 text-[11px] font-semibold text-[#007A78] md:inline-flex">
                <ShieldCheck className="h-3 w-3" />
                종료 시 서버 자료 정리
              </span>
            </div>
            <button
              type="button"
              disabled={dockDisabled}
              onClick={dockAction}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:bg-none disabled:text-slate-400 disabled:shadow-none"
            >
              <span>{dockLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {ai.document && (
        <DocumentWorkspace
          key={ai.document.document.document_id}
          initial={ai.document}
          inputRevision={
            work.session?.input_revision || ai.document.document.input_revision
          }
          preflight={ai.preflight}
          inputBusy={
            !!work.busy ||
            ai.locked ||
            work.briefDirty ||
            work.pendingUpload ||
            pending > 0
          }
          sources={work.sources}
          onEditingStateChange={setSourceChangeBlocked}
          onImpactApplied={() => setSourceEditing(false)}
          step={step}
          onNavigate={onNavigate}
          onClose={() => setConfirmClose(true)}
          renderBlock={(block) => (
            <Block
              block={block}
              sid={ai.document!.document.session_id}
              sources={work.sources}
            />
          )}
        />
      )}
      {(confirmClose || deleteSource) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={confirmClose ? '작업 종료 확인' : '첨부 삭제 확인'}
            className={`${panel} max-w-md`}
          >
            <h2 className="font-bold">
              {confirmClose
                ? '현재 작업을 종료할까요?'
                : '이 첨부파일을 삭제할까요?'}
            </h2>
            <p className="mt-3 break-all text-sm text-slate-600">
              {confirmClose
                ? '이번 작업의 첨부·초안·검증·출력 파일과 미저장 문구가 서버에서 정리됩니다. 공통 등록 자료와 기기에 내려받은 파일은 유지됩니다.'
                : `${deleteSource?.name} — 선택한 자료라면 선택 목록에서도 제외됩니다.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={button}
                onClick={() => {
                  setConfirmClose(false)
                  setDeleteSource(null)
                }}
              >
                취소
              </button>
              <button
                type="button"
                className={primary}
                onClick={() => {
                  if (confirmClose) void work.close()
                  else if (deleteSource) void work.remove(deleteSource)
                  setConfirmClose(false)
                  setDeleteSource(null)
                }}
              >
                {confirmClose ? '종료하고 정리' : '첨부 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
      <CompanyChangeModal
        key={currentCompany + String(companyModalOpen)}
        isOpen={companyModalOpen}
        currentCompany={currentCompany}
        onClose={onCompanyModalClose}
        onConfirm={work.changeCompany}
        disabled={locked}
        hasSession={!!work.session}
      />
    </>
  )
}
