import React, { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Info,
  Lightbulb,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'

interface DraftEditorViewProps {
  companyName: string
  onBackToSources: () => void
  onProceedToApproval: () => void
}

export const DraftEditorView: React.FC<DraftEditorViewProps> = ({
  companyName = '거산케미칼',
  onBackToSources,
  onProceedToApproval,
}) => {
  // 페이지 항목 인터페이스
  interface PageItem {
    num: number
    id: string
    title: string
  }

  // 페이지별 세부 콘텐츠 인터페이스
  interface DraftPageContent {
    headerCategory: string
    title: string
    sub: string
    block2Name: string
    photoUrl: string
    photoCaption: string
    photoCandidates: Array<{
      id: number
      title: string
      caption: string
      url: string
    }>
    selectedPhotoCandidate: number
    bodyTitle: string
    bodyText: string
    verificationTag: string
    verificationLevel: 'warning' | 'success' | 'info'
    source: string
    category: string
    aiPrompt: string
    suggestedText: string
    suggestedRationale: string
  }

  // 초기 8개 페이지 콘텐츠 팩토리
  const getDefaultPageContents = (
    cName: string,
  ): Record<number, DraftPageContent> => ({
    1: {
      headerCategory: 'COMPANY PROFILE',
      title: `${cName || '거산케미칼'}\n회사소개서 2025`,
      sub: '초고순도 화학 정밀 소재의 글로벌 솔루션 파트너',
      block2Name: '표지 메인 비주얼',
      photoUrl:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '후보 1: 글로벌 엔터프라이즈 사옥 전경 · 권장 300DPI',
      photoCandidates: [
        {
          id: 1,
          title: '후보 1 (사옥)',
          caption: '글로벌 엔터프라이즈 사옥 전경',
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 2,
          title: '후보 2 (연구소)',
          caption: '첨단 미래기술 R&D 캠퍼스',
          url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 3,
          title: '후보 3 (심볼)',
          caption: '정밀 화학 이노베이션 심볼',
          url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&auto=format&fit=crop&q=80',
        },
      ],
      selectedPhotoCandidate: 1,
      bodyTitle: '정밀 화학을 선도하는 혁신 프로필',
      bodyText:
        '공식 CI와 2025년도 주요 지향 가치, 그리고 글로벌 시장을 향한 정밀 화학 원료 공급 비전을 표지에 집약했습니다.',
      verificationTag: '출처 대조 완료 - 100%',
      verificationLevel: 'success',
      source: '회사소개서_기존본.pptx',
      category: '기업 비전 및 표지',
      aiPrompt: '표지 소개 문구를 더 권위 있고 신뢰감 있게 다듬어 줘.',
      suggestedText: `${cName || '거산케미칼'}의 혁신 기술과 글로벌 공급 비전을 압축한 2025년도 공식 기업소개서입니다.`,
      suggestedRationale:
        '첫인상을 주는 표지에 맞춰 명확하고 정제된 어조로 신뢰감을 강화했습니다.',
    },
    2: {
      headerCategory: 'OVERVIEW & HISTORY',
      title: '경영 이념 및\n회사 주요 개요',
      sub: '설립 연혁 및 군산·안산 생산 거점 글로벌 네트워크',
      block2Name: '스마트 팩토리 전경',
      photoUrl:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '후보 1: 군산·안산 스마트 팩토리 전경 · 권장 300DPI',
      photoCandidates: [
        {
          id: 1,
          title: '후보 1 (공장)',
          caption: '군산·안산 스마트 팩토리 전경',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 2,
          title: '후보 2 (물류)',
          caption: '수도권 고속 물류 센터',
          url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 3,
          title: '후보 3 (사옥)',
          caption: '본사 경영기획 센터',
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
        },
      ],
      selectedPhotoCandidate: 1,
      bodyTitle: '지속 가능한 친환경 케미칼 리더십',
      bodyText: `${cName || '거산케미칼'}의 설립 배경부터 주요 인증 획득, 그리고 군산·안산 거점 간의 유기적 공급망 체계를 체계적으로 요약했습니다.`,
      verificationTag: '연혁 및 거점 확인 완료 - 98.9%',
      verificationLevel: 'success',
      source: '기업 인터뷰.txt',
      category: '회사 개요 및 연혁',
      aiPrompt: '회사 연혁과 거점 요약을 더 체계적으로 정리해 줘.',
      suggestedText: `${cName || '거산케미칼'}은 설립 이래 축적된 기술력과 군산·안산 생산 거점을 바탕으로 안정적인 글로벌 공급망을 실현합니다.`,
      suggestedRationale:
        '생산 거점과 공급망의 유기적 연결성을 강조하여 안정성을 부각했습니다.',
    },
    3: {
      headerCategory: 'CORE STRENGTHS',
      title: '공정과 품질을\n한눈에',
      sub: '자료로 확인하는 우리 회사의 강점과 신뢰성 지표',
      block2Name: '공정 설비 사진',
      photoUrl:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '후보 1: 공정 설비 전경 · 권장 300DPI',
      photoCandidates: [
        {
          id: 1,
          title: '후보 1 (설비)',
          caption: '공정 설비 전경',
          url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 2,
          title: '후보 2 (라인)',
          caption: '스마트 팩토리 라인 B',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 3,
          title: '후보 3 (연구)',
          caption: '품질 연구소 정밀 분석',
          url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80',
        },
      ],
      selectedPhotoCandidate: 1,
      bodyTitle: '고객에게 필요한 정보를 간결하게',
      bodyText:
        '공정과 품질관리 내용을 정리해 고객이 필요한 정보를 확인할 수 있도록 소개합니다.',
      verificationTag: '수치 근거 확인 필요 - 99.4%',
      verificationLevel: 'warning',
      source: '공정설명서_v3.pdf',
      category: '품질 및 강점',
      aiPrompt: '이 문장을 더 짧고 읽기 쉽게 바꿔 줘.',
      suggestedText:
        '공정과 품질관리 정보를 한눈에 확인할 수 있도록 소개합니다.',
      suggestedRationale:
        '뜻을 유지하고 불필요한 수식어를 줄여 고객 전달력을 높였습니다.',
    },
    4: {
      headerCategory: 'PROCESS FLOW',
      title: '정밀 화학 4단계\n프로세스 공정',
      sub: '원료 배합부터 촉매 반응, 무균 패키징까지 실시간 제어',
      block2Name: '촉매 반응 파이프라인',
      photoUrl:
        'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '후보 1: 4단계 촉매 반응 및 정제 파이프라인 · 권장 300DPI',
      photoCandidates: [
        {
          id: 1,
          title: '후보 1 (반응기)',
          caption: '4단계 촉매 반응 파이프라인',
          url: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 2,
          title: '후보 2 (제어실)',
          caption: 'DCS 중앙 공정 관제실',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 3,
          title: '후보 3 (패키징)',
          caption: '무균 클린룸 자동 포장기',
          url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&auto=format&fit=crop&q=80',
        },
      ],
      selectedPhotoCandidate: 1,
      bodyTitle: '단계별 완벽 관리 프로토콜',
      bodyText:
        '배합-반응-정제-패키징의 4단계 공정에서 실시간 센서 피드백을 통해 99.999% 초고순도를 달성합니다.',
      verificationTag: '공정 단계 일치도 - 99.9%',
      verificationLevel: 'success',
      source: '공정설명서_v3.pdf',
      category: '제조 공정 및 기술',
      aiPrompt: '4단계 공정의 순도 제어 능력을 더 강조해 줘.',
      suggestedText:
        '실시간 센서 기반 4단계 자동 정제 시스템으로 99.999% 무결점 초고순도를 보증합니다.',
      suggestedRationale:
        '초고순도 수치와 센서 피드백의 기술적 정밀함을 명확한 키워드로 전달했습니다.',
    },
    5: {
      headerCategory: 'QUALITY ASSURANCE',
      title: 'ISO 인증 및\n품질 보증 체계',
      sub: 'ISO 9001/14001 공인 인증 및 0.02ppm 정밀 허용 기준',
      block2Name: '정밀 분석 연구실',
      photoUrl:
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '후보 1: ISO 공인 정밀 분석 연구소 · 권장 300DPI',
      photoCandidates: [
        {
          id: 1,
          title: '후보 1 (분석실)',
          caption: 'ISO 공인 정밀 분석 연구소',
          url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 2,
          title: '후보 2 (인증서)',
          caption: 'ISO 9001/14001 인증서 검증',
          url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 3,
          title: '후보 3 (현미경)',
          caption: '0.02ppm 미세 불순물 스캔',
          url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&auto=format&fit=crop&q=80',
        },
      ],
      selectedPhotoCandidate: 1,
      bodyTitle: '국제 기준을 상회하는 엄격한 품질',
      bodyText:
        '국제 표준 인증서 매핑과 정기 검사 주기, 불량률 통계를 투명하게 공개하여 글로벌 고객사의 신뢰를 확보합니다.',
      verificationTag: 'ISO 인증서 매핑 완료 - 100%',
      verificationLevel: 'success',
      source: '품질인증서_ISO9001.pdf',
      category: '품질 보증 및 인증',
      aiPrompt: 'ISO 인증 기준 충족 내용을 바이어 맞춤형으로 강조해 줘.',
      suggestedText:
        'ISO 9001/14001 인증과 전수 검사 체계를 통해 오차율 0.02ppm 이하의 엄격한 품질을 제공합니다.',
      suggestedRationale:
        '바이어가 주목하는 정량적 오차율 수치와 공인 인증 표준을 전면에 배치했습니다.',
    },
    6: {
      headerCategory: 'FACILITIES & EQUIPMENT',
      title: '군산 스마트 팩토리\n설비 및 사진',
      sub: '반응기 군집 및 자동 포장 라인 고해상도 설비 갤러리',
      block2Name: '자동화 반응 설비',
      photoUrl:
        'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '후보 1: 클린룸 이송 로봇 및 무인 패키징 · 권장 300DPI',
      photoCandidates: [
        {
          id: 1,
          title: '후보 1 (로봇)',
          caption: '클린룸 이송 로봇 및 무인 패키징',
          url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 2,
          title: '후보 2 (반응기)',
          caption: '고압 수소화 반응기 군집',
          url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 3,
          title: '후보 3 (모니터)',
          caption: '중앙 집중식 통합 설비 모니터링',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
        },
      ],
      selectedPhotoCandidate: 1,
      bodyTitle: '최첨단 무인 자동화 반응 설비',
      bodyText:
        '고압 수소화 반응기 및 클린룸 이송 로봇 등 스마트 팩토리 12개 라인의 실제 가동 설비를 선명하게 소개합니다.',
      verificationTag: '300DPI 인쇄 규격 충족',
      verificationLevel: 'success',
      source: '공정_자동화라인_사진.jpg',
      category: '생산 인프라 및 설비',
      aiPrompt: '스마트 팩토리 자동화 라인의 규모감을 생생하게 표현해 줘.',
      suggestedText:
        '12개 무인 자동화 라인과 Class 1000 클린룸 설비를 통해 365일 무중단 고효율 생산을 실현합니다.',
      suggestedRationale:
        '설비 규모와 무중단 생산 역량을 구체적 스펙으로 표현하여 기술력을 돋보이게 했습니다.',
    },
    7: {
      headerCategory: 'CLIENT REFERENCES',
      title: '국내외 주요 납품\n레퍼런스 및 실적',
      sub: '반도체 세정제 및 2차전지 전구체 핵심 고객사 납품 사례',
      block2Name: '글로벌 출하 인프라',
      photoUrl:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '후보 1: 글로벌 고객사 출하 및 물류 인프라 · 권장 300DPI',
      photoCandidates: [
        {
          id: 1,
          title: '후보 1 (물류)',
          caption: '글로벌 고객사 출하 물류 인프라',
          url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 2,
          title: '후보 2 (컨테이너)',
          caption: '수출 전용 특수 항온 컨테이너',
          url: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 3,
          title: '후보 3 (미팅)',
          caption: '글로벌 파트너십 기술 세미나',
          url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&auto=format&fit=crop&q=80',
        },
      ],
      selectedPhotoCandidate: 1,
      bodyTitle: '글로벌 톱티어 파트너사 협력 사례',
      bodyText:
        '주요 반도체 및 2차전지 제조사 8개 기업에 공급 계약을 체결하여 98.5%의 높은 재계약률을 기록하고 있습니다.',
      verificationTag: '고객사 수치 검증 완료 - 98.5%',
      verificationLevel: 'success',
      source: '회사소개서_기존본.pptx',
      category: '실적 및 레퍼런스',
      aiPrompt: '재계약률과 글로벌 공급 성과를 더욱 어필해 줘.',
      suggestedText:
        '국내외 8대 대기업 납품 레퍼런스와 98.5% 재계약률로 검증된 품질 신뢰도를 자랑합니다.',
      suggestedRationale:
        '고객사 수와 재계약률 수치를 핵심에 배치해 설득력을 극대화했습니다.',
    },
    8: {
      headerCategory: 'CONTACT & SUPPORT',
      title: '연락처 및 사업 협력\n공식 문의 안내',
      sub: '영업대표부 직통 채널 및 본사·연구소 오피셜 컨택 포인트',
      block2Name: '영업 및 지원 센터',
      photoUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '후보 1: 영업본부 및 테크니컬 지원 센터 · 권장 300DPI',
      photoCandidates: [
        {
          id: 1,
          title: '후보 1 (센터)',
          caption: '영업본부 및 테크니컬 지원 센터',
          url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 2,
          title: '후보 2 (데스크)',
          caption: '고객 신속 기술 문의 데스크',
          url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop&q=80',
        },
        {
          id: 3,
          title: '후보 3 (사옥)',
          caption: '서울 영업소 및 쇼룸',
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
        },
      ],
      selectedPhotoCandidate: 1,
      bodyTitle: '신속한 상담 및 견적 문의 창구',
      bodyText:
        '신규 도입 상담 및 샘플 신청을 위한 대표 채널(02-555-1234, contact@geosan.com)을 24시간 운영합니다.',
      verificationTag: '연락처 정보 확인 완료 - 100%',
      verificationLevel: 'success',
      source: '기업 인터뷰.txt',
      category: '문의 및 컨택',
      aiPrompt: '문의 응답의 신속성과 기술 지원 프로세스를 명확히 해 줘.',
      suggestedText:
        '샘플 요청 및 견적 문의 시 전담 엔지니어가 2시간 이내에 신속하게 답변을 드립니다.',
      suggestedRationale:
        '2시간 이내 응답 보증 약속을 부각시켜 고객의 문의 행동을 자연스럽게 유도했습니다.',
    },
  })

  // 현재 선택된 페이지 (1 ~ 8)
  const [activePage, setActivePage] = useState<number>(3)

  // 페이지별 콘텐츠 맵 상태
  const [pageContents, setPageContents] = useState<
    Record<number, DraftPageContent>
  >(() => getDefaultPageContents(companyName))

  // 현재 활성 페이지 데이터
  const currentPageData: DraftPageContent = pageContents[activePage] || {
    headerCategory: 'SECTION DETAILS',
    title: '상세 내용\n섹션',
    sub: '페이지별 상세 안내 문구',
    block2Name: '관련 사진',
    photoUrl:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
    photoCaption: '후보 1: 관련 이미지 · 권장 300DPI',
    photoCandidates: [
      {
        id: 1,
        title: '후보 1',
        caption: '대표 이미지',
        url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
      },
    ],
    selectedPhotoCandidate: 1,
    bodyTitle: '본문 내용',
    bodyText: '해당 페이지의 상세 본문 내용입니다.',
    verificationTag: '검증 완료 - 100%',
    verificationLevel: 'success',
    source: '회사_소개_자료.pdf',
    category: '일반 섹션',
    aiPrompt: '이 문장을 더 매끄럽게 다듬어 줘.',
    suggestedText: '해당 페이지의 제안 문구입니다.',
    suggestedRationale: '문맥에 맞춰 자연스러운 문장으로 정돈했습니다.',
  }

  // 인라인 편집 상태
  const [isEditingInline, setIsEditingInline] = useState(false)
  const [textAppliedFeedback, setTextAppliedFeedback] = useState(false)

  // 사진 교체 모달 상태
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [modalCandidateId, setModalCandidateId] = useState<number>(1)

  // 새 자료 추가 알림 배너 표시 여부
  const [showNewSourceBanner, setShowNewSourceBanner] = useState(true)

  // AI 처리 로딩 상태
  const [isAiLoading, setIsAiLoading] = useState(false)

  // 페이지 목록 상태 (드래그 앤 드롭 및 순서 변경 지원)
  const [pages, setPages] = useState<PageItem[]>([
    { num: 1, id: '01', title: '표지' },
    { num: 2, id: '02', title: '회사 개요' },
    { num: 3, id: '03', title: '우리의 강점' },
    { num: 4, id: '04', title: '공정 소개' },
    { num: 5, id: '05', title: '품질관리' },
    { num: 6, id: '06', title: '설비와 사진' },
    { num: 7, id: '07', title: '협력 사례' },
    { num: 8, id: '08', title: '문의 안내' },
  ])

  // 드래그 앤 드롭 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [orderToast, setOrderToast] = useState<string | null>(null)

  // 페이지 순서 재배치 핸들러
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= pages.length ||
      toIndex >= pages.length
    ) {
      return
    }

    const movedTitle = pages[fromIndex]?.title || '페이지'

    setPages((prevPages) => {
      const nextPages = [...prevPages]
      const [movedItem] = nextPages.splice(fromIndex, 1)
      nextPages.splice(toIndex, 0, movedItem)

      return nextPages.map((item, idx) => ({
        ...item,
        num: idx + 1,
        id: String(idx + 1).padStart(2, '0'),
      }))
    })

    setActivePage(toIndex + 1)
    setOrderToast(
      `[순서 변경] "${movedTitle}" 항목이 ${toIndex + 1}번째로 이동되었습니다.`,
    )
    setTimeout(() => setOrderToast(null), 3000)
  }

  // HTML5 Drag & Drop 이벤트 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      handleReorder(draggedIndex, targetIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // 한 단계 위/아래 이동 핸들러
  const handleMoveStep = (
    index: number,
    direction: 'up' | 'down',
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    handleReorder(index, targetIndex)
  }

  // 새 페이지 추가 핸들러
  const handleAddPage = () => {
    const nextNum = pages.length + 1
    const newPage: PageItem = {
      num: nextNum,
      id: String(nextNum).padStart(2, '0'),
      title: `추가 섹션 ${nextNum}`,
    }
    setPages((prev) => [...prev, newPage])

    // 기본 콘텐츠 추가
    setPageContents((prev) => ({
      ...prev,
      [nextNum]: {
        headerCategory: `SECTION 0${nextNum}`,
        title: `신규 섹션 ${nextNum}\n상세 안내`,
        sub: '신규 추가된 섹션의 주요 내용과 핵심 지표입니다.',
        block2Name: '신규 사진 블록',
        photoUrl:
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
        photoCaption: `후보 1: 추가 섹션 ${nextNum} 대표 사진 · 권장 300DPI`,
        photoCandidates: [
          {
            id: 1,
            title: '후보 1',
            caption: `추가 섹션 ${nextNum} 대표 사진`,
            url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
          },
        ],
        selectedPhotoCandidate: 1,
        bodyTitle: '신규 섹션 핵심 내용',
        bodyText: `${companyName || '거산케미칼'}의 추가 섹션 ${nextNum}에 대한 상세 설명 및 검증된 핵심 데이터입니다.`,
        verificationTag: '추가 검토 완료 - 100%',
        verificationLevel: 'success',
        source: '추가_자료.pdf',
        category: '추가 섹션',
        aiPrompt: '이 문장을 더 매끄럽고 신뢰감 있게 다듬어 줘.',
        suggestedText: `${companyName || '거산케미칼'}의 추가 섹션 ${nextNum} 핵심 강점과 세부 가치를 전달합니다.`,
        suggestedRationale: '문서의 일관성을 유지하며 간결하게 정리했습니다.',
      },
    }))

    setActivePage(nextNum)
    setOrderToast(`새 페이지 [추가 섹션 ${nextNum}]이 추가되었습니다.`)
    setTimeout(() => setOrderToast(null), 3000)
  }

  // 본문 텍스트 수정 핸들러
  const handleUpdateBodyText = (newText: string) => {
    setPageContents((prev) => ({
      ...prev,
      [activePage]: {
        ...currentPageData,
        bodyText: newText,
      },
    }))
  }

  // AI 프롬프트 수정 핸들러
  const handleUpdateAiPrompt = (newPrompt: string) => {
    setPageContents((prev) => ({
      ...prev,
      [activePage]: {
        ...currentPageData,
        aiPrompt: newPrompt,
      },
    }))
  }

  // 사진 교체 모달 열기 핸들러
  const handleOpenPhotoModal = () => {
    setModalCandidateId(currentPageData.selectedPhotoCandidate || 1)
    setIsPhotoModalOpen(true)
  }

  // 사진 교체 적용
  const handleApplyPhoto = () => {
    const candidate = currentPageData.photoCandidates.find(
      (c) => c.id === modalCandidateId,
    )
    if (candidate) {
      setPageContents((prev) => ({
        ...prev,
        [activePage]: {
          ...currentPageData,
          photoUrl: candidate.url,
          photoCaption: `후보 ${candidate.id}: ${candidate.caption} · 권장 300DPI`,
          selectedPhotoCandidate: candidate.id,
        },
      }))
      setIsPhotoModalOpen(false)
    }
  }

  // AI 제안 적용
  const handleApplyAiSuggestion = () => {
    setPageContents((prev) => ({
      ...prev,
      [activePage]: {
        ...currentPageData,
        bodyText: currentPageData.suggestedText,
      },
    }))
    setTextAppliedFeedback(true)
    setTimeout(() => setTextAppliedFeedback(false), 2000)
  }

  // AI 재요청 시뮬레이션
  const handleRetryAi = () => {
    setIsAiLoading(true)
    setTimeout(() => {
      let newSuggestion = `${companyName || '거산케미칼'}의 철저한 공정과 인증된 품질 관리 체계를 명확하고 신뢰도 높게 전달합니다.`
      if (activePage === 1) {
        newSuggestion = `${companyName || '거산케미칼'} 공식 프로필과 2025년도 글로벌 솔루션 비전을 제시합니다.`
      } else if (activePage === 2) {
        newSuggestion = `${companyName || '거산케미칼'}의 전국 스마트 팩토리 거점과 친환경 화학 기술 비전을 알기 쉽게 설명합니다.`
      } else if (activePage === 4) {
        newSuggestion = `원료 배합에서 무균 포장까지 4단계 실시간 제어로 99.999% 초고순도 품질을 보장합니다.`
      } else if (activePage === 5) {
        newSuggestion = `ISO 9001/14001 국제 인증 및 0.02ppm 허용 오차 기준을 완벽하게 충족하는 품질 관리 체계입니다.`
      } else if (activePage === 6) {
        newSuggestion = `군산 스마트 팩토리의 무인 클린룸 설비와 로봇 이송 시스템으로 365일 고효율 생산을 지속합니다.`
      } else if (activePage === 7) {
        newSuggestion = `국내외 8대 대기업 납품 성과와 98.5% 재계약률로 기술력과 신뢰성을 입증합니다.`
      } else if (activePage === 8) {
        newSuggestion = `전담 기술 영업팀이 견적 및 샘플 문의에 대해 2시간 이내에 신속하게 상담을 지원합니다.`
      }

      setPageContents((prev) => ({
        ...prev,
        [activePage]: {
          ...currentPageData,
          suggestedText: newSuggestion,
        },
      }))
      setIsAiLoading(false)
    }, 500)
  }

  return (
    <div className="flex flex-col w-full gap-6 pb-28 animate-fade-in">
      {/* Top Intro Bar & Auto-save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            초안을 내 문서로 다듬으세요
          </h1>
          <p className="text-sm text-slate-600">
            목차를 옮기거나 페이지의 문장을 클릭해 수정할 수 있어요.
          </p>
        </div>

        <div className="self-start sm:self-center flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>세션 내 저장 완료</span>
        </div>
      </div>

      {/* 새 자료 추가 감지 인라인 배너 */}
      {showNewSourceBanner && (
        <div className="w-full bg-blue-50/90 border border-blue-200/80 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-slate-800">
            <FileText className="h-4 w-4 text-blue-700 shrink-0" />
            <span>
              새 자료(
              <strong className="font-bold text-slate-900">
                품질인증서_2025_개정본.pdf
              </strong>
              )가 추가되었습니다. 기존 수동 편집 내용은 안전하게 유지되며, 변경
              영향도를 확인하시겠습니까?
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() =>
                alert(
                  '영향도 분석 완료: 현재 3쪽 및 5쪽 품질 인증 조항과 100% 일치합니다.',
                )
              }
              className="px-3 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-blue-700 text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>영향 확인 및 재점검</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewSourceBanner(false)}
              className="w-6 h-6 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="배너 닫기"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3-Column Workbench Workspace */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 목차 구조 & 1:1 레이아웃 블록 (Col 3 on lg) */}
        <aside className="lg:col-span-3 bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">목차 구조</h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                {pages.length}쪽 중 {activePage}쪽
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddPage}
              className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#E6F4F1] hover:text-[#007A78] transition-colors cursor-pointer"
              title="새 페이지 추가"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Reorder Notification Toast Banner */}
          {orderToast && (
            <div className="px-3 py-1.5 rounded-xl bg-[#E6F4F1] text-[#007A78] text-[11px] font-semibold flex items-center gap-1.5 animate-fade-in border border-[#007A78]/20">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{orderToast}</span>
            </div>
          )}

          {/* Page Tree List (HTML5 Drag & Drop Supported) */}
          <nav aria-label="문서 목차" className="flex flex-col gap-1.5">
            {pages.map((item, index) => {
              const isActive = activePage === item.num
              const isDragging = draggedIndex === index
              const isOver = dragOverIndex === index && draggedIndex !== index

              if (isActive) {
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex flex-col rounded-xl transition-all p-1.5 gap-1.5 select-none ${
                      isDragging
                        ? 'opacity-40 border-2 border-dashed border-[#007A78] bg-slate-50'
                        : isOver
                          ? 'border-2 border-[#007A78] bg-[#E6F4F1] scale-[1.01] shadow-sm'
                          : 'bg-[#E6F4F1]/60 border border-[#007A78]/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white text-[#007A78] shadow-2xs group">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          type="button"
                          className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-slate-100 text-[#007A78] transition-colors"
                          title="위아래로 드래그하여 순서 변경"
                        >
                          <GripVertical className="h-4 w-4 shrink-0" />
                        </button>
                        <span className="text-[11px] font-bold w-5">
                          {item.id}
                        </span>
                        <span className="text-xs font-bold truncate">
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Up / Down Quick Action Buttons on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => handleMoveStep(index, 'up', e)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                            title="위로 이동"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === pages.length - 1}
                            onClick={(e) => handleMoveStep(index, 'down', e)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                            title="아래로 이동"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-[#007A78]"></span>
                      </div>
                    </div>

                    {/* 1:1 Synchronized Layout Block Children for the Active Page */}
                    <div className="flex flex-col pl-3 pr-1 py-1 gap-1 text-[11px]">
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-white/80 hover:bg-white text-slate-700 cursor-pointer border border-transparent hover:border-slate-200">
                        <span className="truncate">
                          블록 1 · {currentPageData.title.split('\n')[0]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-white/80 hover:bg-white text-slate-700 cursor-pointer border border-transparent hover:border-slate-200">
                        <span className="truncate">
                          블록 2 · {currentPageData.block2Name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[10px]">
                          사진
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white shadow-2xs border border-[#007A78] text-[#007A78] font-bold cursor-pointer ring-1 ring-[#007A78]/20">
                        <span className="truncate">
                          블록 3 · {currentPageData.bodyTitle} (선택됨)
                        </span>
                        <Check className="h-3.5 w-3.5 text-[#007A78]" />
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-white/80 hover:bg-white text-slate-500 cursor-pointer">
                        <span className="truncate text-[10px]">
                          블록 4 · 근거 출처 ({currentPageData.source})
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setActivePage(item.num)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all cursor-pointer text-slate-700 select-none ${
                    isDragging
                      ? 'opacity-40 border-2 border-dashed border-[#007A78] bg-slate-50'
                      : isOver
                        ? 'border-2 border-[#007A78] bg-[#E6F4F1] scale-[1.01] shadow-sm'
                        : 'border border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      className="cursor-grab active:cursor-grabbing p-0.5 rounded text-slate-400 opacity-60 group-hover:opacity-100 hover:text-slate-800 transition-colors"
                      title="위아래로 드래그하여 순서 변경"
                    >
                      <GripVertical className="h-4 w-4 shrink-0" />
                    </button>
                    <span className="text-[11px] font-semibold text-slate-400 w-5">
                      {item.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 flex-1 truncate">
                      {item.title}
                    </span>
                  </div>

                  {/* Up / Down Quick Buttons on Inactive Rows */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => handleMoveStep(index, 'up', e)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                      title="위로 이동"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === pages.length - 1}
                      onClick={(e) => handleMoveStep(index, 'down', e)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                      title="아래로 이동"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* CENTER COLUMN: 1:1 Interactive A4 Paper Sheet Simulation (Col 5 on lg) */}
        <main className="lg:col-span-5 flex flex-col gap-4 items-center">
          {/* Canvas Control Ribbon Toolbar */}
          <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-200 px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                {activePage} / {pages.length}쪽
              </span>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-1">
                <button
                  type="button"
                  className="px-2 py-0.5 rounded bg-white text-slate-900 shadow-2xs text-[11px] font-semibold"
                >
                  본문 블록
                </button>
                <button
                  type="button"
                  className="px-2 py-0.5 rounded hover:bg-white text-slate-700 text-[11px] font-bold"
                >
                  굵게
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E6F4F1] text-[#007A78] text-[11px] font-bold shadow-2xs">
                <Sparkles className="h-3 w-3" />
                AI 편집 보조 (활성)
              </span>
            </div>
          </div>

          {/* Physical A4 Paper Sheet Simulation */}
          <article className="w-full bg-white rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col justify-between min-h-[640px] border border-slate-200/80 relative transition-all">
            <div className="flex flex-col gap-4">
              {/* Block 1: Page Header & Title */}
              <div className="group relative rounded-xl border border-transparent hover:border-slate-200 p-2 transition-all">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] font-bold text-[#007A78] tracking-widest uppercase">
                    {companyName.toUpperCase() || 'GEOSAN CHEMICAL'}
                  </span>
                  <span className="text-[10px] text-slate-400 tracking-widest font-semibold uppercase">
                    {currentPageData.headerCategory}
                  </span>
                </div>
                <div className="flex flex-col gap-1 cursor-text">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug whitespace-pre-line">
                    {currentPageData.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {currentPageData.sub}
                  </p>
                </div>
              </div>

              {/* Block 2: Graphic Tile with Photo Replacement Trigger & Modal Popover */}
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-2 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] text-slate-500 font-medium">
                    블록 2 · {currentPageData.block2Name}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenPhotoModal}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#007A78] text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>사진 교체</span>
                  </button>
                </div>

                {/* Main Canvas Image */}
                <div className="relative w-full h-44 rounded-lg overflow-hidden bg-slate-900 shadow-inner">
                  <img
                    className="w-full h-full object-cover transition-opacity duration-300"
                    alt={currentPageData.photoCaption}
                    src={currentPageData.photoUrl}
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/95 backdrop-blur text-slate-900 text-[10px] font-semibold shadow-xs">
                    <ImageIcon className="h-3 w-3 text-[#007A78]" />
                    <span>{currentPageData.photoCaption}</span>
                  </div>
                </div>

                {/* Photo Candidate Picker Modal Overlay */}
                {isPhotoModalOpen && (
                  <div className="bg-white rounded-xl border border-[#007A78]/40 shadow-xl p-4 flex flex-col gap-3 mt-1 animate-fade-in z-20">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-[#007A78]" />
                        <span className="text-xs font-bold text-slate-900">
                          {activePage}쪽 사진 후보 선택
                        </span>
                        <span className="px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                          선택 자료 {currentPageData.photoCandidates.length}장
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPhotoModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {currentPageData.photoCandidates.map((candidate) => {
                        const isSelected = modalCandidateId === candidate.id
                        return (
                          <div
                            key={candidate.id}
                            onClick={() => setModalCandidateId(candidate.id)}
                            className={`rounded-lg p-1.5 flex flex-col gap-1 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-2 border-[#007A78] bg-[#E6F4F1]/40 shadow-xs'
                                : 'border border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="w-full h-14 rounded overflow-hidden bg-slate-200 relative">
                              <img
                                className="w-full h-full object-cover"
                                alt={candidate.caption}
                                src={candidate.url}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80'
                                }}
                              />
                              {isSelected && (
                                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#007A78] text-white flex items-center justify-center text-[10px] font-bold">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span
                                className={`text-[11px] font-bold truncate ${
                                  isSelected
                                    ? 'text-[#007A78]'
                                    : 'text-slate-800'
                                }`}
                              >
                                {candidate.title}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate">
                                {candidate.caption}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          alert('새 사진 파일 첨부 창이 열립니다.')
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-dashed border-[#007A78]/60 text-[#007A78] hover:bg-[#E6F4F1] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>새 사진 첨부</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsPhotoModalOpen(false)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyPhoto}
                          className="px-3.5 py-1.5 rounded-lg bg-[#007A78] text-white text-xs font-bold hover:bg-[#0F766E] transition-colors shadow-2xs cursor-pointer"
                        >
                          선택한 사진으로 교체
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Block 3: Selected Text Block with Inline Format Floating Ribbon */}
              <div className="flex flex-col gap-1 mt-1 relative">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    {currentPageData.bodyTitle}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      currentPageData.verificationLevel === 'warning'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {currentPageData.verificationLevel === 'warning' ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    )}
                    {currentPageData.verificationTag}
                  </span>
                </div>

                {/* Focused Editable Paragraph Block */}
                <div className="relative p-4 rounded-xl bg-[#E6F4F1]/30 border-2 border-[#007A78] shadow-xs cursor-text ring-2 ring-[#007A78]/20 transition-all">
                  {/* Inline Floating Component Toolbar */}
                  <div className="absolute -top-3.5 left-3 flex items-center bg-white rounded-md shadow-md border border-slate-200 px-2 py-0.5 gap-1 z-10">
                    <span className="text-[10px] text-[#007A78] font-bold px-1">
                      블록 3 · 본문
                    </span>
                    <div className="h-3 w-px bg-slate-200"></div>
                    <button
                      type="button"
                      onClick={() => setIsEditingInline(!isEditingInline)}
                      className="px-1.5 py-0.5 rounded hover:bg-slate-100 text-slate-800 text-[11px] font-medium flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>
                        {isEditingInline ? '수정 완료' : '텍스트 수정'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRetryAi}
                      className="px-1.5 py-0.5 rounded bg-[#E6F4F1] text-[#007A78] font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>AI 다듬기</span>
                    </button>
                  </div>

                  {isEditingInline ? (
                    <textarea
                      value={currentPageData.bodyText}
                      onChange={(e) => handleUpdateBodyText(e.target.value)}
                      className="w-full bg-white border border-[#007A78] rounded-lg p-2 text-xs font-medium text-slate-900 focus:outline-none resize-none"
                      rows={3}
                    />
                  ) : (
                    <p
                      className={`text-xs text-slate-800 leading-relaxed pt-1 transition-all ${
                        textAppliedFeedback
                          ? 'text-[#007A78] font-bold scale-[1.01]'
                          : ''
                      }`}
                    >
                      {currentPageData.bodyText}
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[#007A78] text-[10px] pt-1 border-t border-[#007A78]/15 font-semibold">
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI 편집 보조 패널과 연결됨</span>
                    </div>
                    <span className="text-slate-400 font-normal">
                      클릭 시 커서 활성화
                    </span>
                  </div>
                </div>
              </div>

              {/* Block 4: Grounded Citation Line */}
              <div className="flex items-center gap-1.5 pt-1 text-slate-500 text-[11px]">
                <LinkIcon className="h-3.5 w-3.5 text-[#007A78]" />
                <span>
                  선택한 자료({currentPageData.source})에 연결된 내용입니다.
                </span>
              </div>
            </div>

            {/* Page Footer Meta Stamp */}
            <div className="pt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 mt-6">
              <span>{companyName || '거산케미칼'} 회사소개서 · 초안</span>
              <span className="font-bold text-slate-900">
                {String(activePage).padStart(2, '0')}
              </span>
            </div>
          </article>
        </main>

        {/* RIGHT COLUMN: AI 편집 보조 패널 (Col 4 on lg) */}
        <aside className="lg:col-span-4 bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#E6F4F1] text-[#007A78] flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                AI 편집 보조
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                활성
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F4F1] text-[#007A78] text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007A78]"></span>
              <span>
                {activePage}쪽 · 블록 3 ({currentPageData.bodyTitle})
              </span>
            </span>
            <span className="text-[11px] text-slate-400">
              문맥: {currentPageData.category}
            </span>
          </div>

          {/* User Instruction / Prompt Box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800">
              어떻게 바꿀까요?
            </label>
            <div className="relative bg-slate-50 rounded-xl p-2.5 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007A78]/30 transition-all">
              <textarea
                value={currentPageData.aiPrompt}
                onChange={(e) => handleUpdateAiPrompt(e.target.value)}
                className="w-full bg-transparent resize-none outline-none text-xs text-slate-900 placeholder:text-slate-400"
                rows={2}
                placeholder="문장 다듬기 요청을 적어주세요"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={isAiLoading}
                  onClick={handleRetryAi}
                  className="px-2 py-1 bg-[#007A78] hover:bg-[#0F766E] disabled:bg-slate-300 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAiLoading ? '생성 중...' : '요청 전송'}</span>
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Original vs. Suggested Comparison Block */}
          <div className="flex flex-col gap-2.5">
            {/* Original Text */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                기존 문구
              </span>
              <div className="bg-slate-100 rounded-xl p-2.5 text-slate-600 text-xs leading-relaxed border border-slate-200">
                {currentPageData.bodyText}
              </div>
            </div>

            {/* AI Suggested Text */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#007A78] uppercase flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>제안 문구</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>신뢰도 높음</span>
                </span>
              </div>
              <div className="bg-[#E6F4F1]/90 rounded-xl p-3 text-slate-900 text-xs font-semibold leading-relaxed shadow-2xs border border-[#007A78]/30">
                {currentPageData.suggestedText}
              </div>

              {/* Rationale Box */}
              <div className="flex flex-col gap-1 p-2 rounded-lg bg-slate-50 text-slate-600 text-[11px] border border-slate-200">
                <div className="flex items-center gap-1 text-[#007A78] font-bold">
                  <Sparkles className="h-3 w-3" />
                  <span>제안 이유</span>
                </div>
                <p className="leading-tight">
                  {currentPageData.suggestedRationale}
                </p>
              </div>

              <div className="flex items-center gap-1 px-1 text-slate-400 text-[10px]">
                <Info className="h-3.5 w-3.5 text-amber-600" />
                <span>적용 전에는 본문에 즉시 반영되지 않습니다.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2 mt-auto">
            <button
              type="button"
              onClick={handleApplyAiSuggestion}
              className="w-full py-2.5 px-4 rounded-xl bg-[#007A78] hover:bg-[#0F766E] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <Check className="h-4 w-4" />
              <span>이 문구 적용</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleRetryAi}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>다시 요청</span>
              </button>
              <button
                type="button"
                onClick={() => alert('AI 패널이 최소화되었습니다.')}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer"
              >
                <span>닫기</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Persistent Bottom Action Dock */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToSources}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>자료 선택</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-xs">
            <Lightbulb className="h-4 w-4 text-[#007A78]" />
            <span>AI 제안은 적용 버튼을 눌러야 본문에 반영돼요.</span>
          </div>

          <button
            type="button"
            onClick={onProceedToApproval}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] hover:brightness-105 active:scale-[0.99] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <span>승인·출력으로</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
