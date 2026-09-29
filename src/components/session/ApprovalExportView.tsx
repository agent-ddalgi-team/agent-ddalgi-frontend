import React, { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Edit,
  FileCheck,
  FileText,
  FileType,
  Info,
  LayoutGrid,
  Loader2,
  Printer,
  Search,
  ShieldCheck,
  Verified,
} from 'lucide-react'
import {
  generateAndDownloadPdf,
  triggerBrowserPdfPrint,
} from '../../utils/pdfExport'
import { exportClientDocument } from '../../utils/documentExport'
import type { EditableDraftSection } from '../../types/session'
import type { CompanyInfoKey } from '../../types/profile'

interface ApprovalExportViewProps {
  companyName: string
  onBackToDraft: () => void
}

export const ApprovalExportView: React.FC<ApprovalExportViewProps> = ({
  companyName = '거산케미칼',
  onBackToDraft,
}) => {
  // 1. 뷰 모드 전환 상태 (카드형 / 3단 분할 뷰 / 단일 페이지)
  const [viewMode, setViewMode] = useState<'split' | 'grid' | 'single'>('split')

  // 2. 현재 선택된 페이지 (1 ~ 8)
  const [currentPage, setCurrentPage] = useState<number>(3)

  // 3. 출력 형식 (PDF 기본 선택)
  const [exportFormat, setExportFormat] = useState<'PDF' | 'DOCX'>('PDF')

  // 4. 최종 승인 동의 체크박스
  const [isApproved, setIsApproved] = useState<boolean>(true)

  // 5. 다운로드/생성 중 로딩 상태 및 피드백
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)

  // 8쪽 분할 데이터
  const splitPageData: Record<
    number,
    {
      header: string
      title: string
      sub: string
      bodyTitle: string
      bodyText: string
      summary: string
      source: string
      photoUrl: string
      photoCaption: string
      kpis: Array<{ label: string; value: string }>
    }
  > = {
    1: {
      header: 'COMPANY PROFILE 2025 · PAGE 01',
      title: `${companyName}\n회사소개서 2025`,
      sub: '초고순도 화학 정밀 소재의 글로벌 솔루션 파트너',
      bodyTitle: '정밀 화학을 선도하는 혁신 프로필',
      bodyText:
        '공식 CI와 2025년도 주요 지향 가치, 그리고 글로벌 시장을 향한 정밀 화학 원료 공급 비전을 표지에 집약했습니다.',
      summary: `${companyName}의 대표 CI, 브랜드 슬로건 및 2025년 공식 비전을 첫 페이지에 품격 있게 배치한 커버 섹션입니다.`,
      source: '회사소개서_기존본.pptx',
      photoUrl:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '글로벌 엔터프라이즈 사옥 전경',
      kpis: [
        { label: '설립 연도', value: '2012년' },
        { label: '글로벌 거점', value: '4개국' },
        { label: '연간 생산량', value: '150,000톤' },
      ],
    },
    2: {
      header: 'COMPANY PROFILE 2025 · PAGE 02',
      title: '경영 이념 및\n회사 주요 개요',
      sub: '설립 연혁 및 군산·안산 생산 거점 글로벌 네트워크',
      bodyTitle: '지속 가능한 친환경 케미칼 리더십',
      bodyText: `${companyName}의 설립 배경부터 주요 인증 획득, 그리고 군산·안산 거점 간의 유기적 공급망 체계를 체계적으로 요약했습니다.`,
      summary:
        '주요 연혁 5대 마일스톤과 전국 생산 거점 맵을 요약하여 회사의 안정적인 성장 궤적을 제시합니다.',
      source: '기업 인터뷰.txt',
      photoUrl:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '군산·안산 스마트 팩토리 전경',
      kpis: [
        { label: '국내 거점', value: '2개 공장' },
        { label: '연구 인력', value: '45명' },
        { label: '특허 보유', value: '38건' },
      ],
    },
    3: {
      header: 'COMPANY PROFILE 2025 · PAGE 03',
      title: '공정과 품질을\n한눈에',
      sub: '자료로 확인하는 우리 회사의 강점과 신뢰성 지표',
      bodyTitle: '고객에게 필요한 정보를 간결하게',
      bodyText:
        '공정과 품질관리 세부 프로세스를 체계화하여 고객이 납기, 정밀 순도 및 ISO 기준 적합성을 직관적으로 파악할 수 있도록 도표와 검증 로그를 병기했습니다.',
      summary:
        '군산 제2 스마트 팩토리의 정밀 공정 라인과 99.4% 자동화 성과 지표를 결합하여 신규 고객에게 기술 신뢰성을 입증하는 핵심 페이지입니다.',
      source: '공정설명서_v3.pdf',
      photoUrl:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '정밀 자동화 제어 공정 설비',
      kpis: [
        { label: '공정 자동화율', value: '99.4%' },
        { label: '무사고 일수', value: '1,820일' },
        { label: '오차 허용률', value: '0.02ppm' },
      ],
    },
    4: {
      header: 'COMPANY PROFILE 2025 · PAGE 04',
      title: '정밀 화학 4단계\n프로세스 공정',
      sub: '원료 배합부터 촉매 반응, 무균 패키징까지 실시간 제어',
      bodyTitle: '단계별 완벽 관리 프로토콜',
      bodyText:
        '공정 중 발생할 수 있는 미세 불순물을 제어하기 위한 실시간 센서 피드백 루프와 4단계 정제 공정을 다이어그램으로 시각화했습니다.',
      summary:
        '배합-반응-정제-패키징의 4단계를 알기 쉬운 흐름도와 아이콘으로 구성하여 기술력을 어필합니다.',
      source: '공정설명서_v3.pdf',
      photoUrl:
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '4단계 촉매 반응 및 정제 파이프라인',
      kpis: [
        { label: '배합 정밀도', value: '±0.01%' },
        { label: '정제 순도', value: '99.999%' },
        { label: '일일 처리량', value: '500톤' },
      ],
    },
    5: {
      header: 'COMPANY PROFILE 2025 · PAGE 05',
      title: 'ISO 인증 및\n품질 보증 체계',
      sub: 'ISO 9001/14001 공인 인증 및 0.02ppm 정밀 허용 기준',
      bodyTitle: '국제 기준을 상회하는 엄격한 품질',
      bodyText:
        '국제 표준 인증서 매핑과 정기 검사 주기, 불량률 추이 통계를 투명하게 공개하여 바이어의 사전 실사 요구를 충족합니다.',
      summary:
        '인증서 3건의 실물 번호와 유효 기간이 대조 완료되어 신뢰성 검토를 마친 상태입니다.',
      source: '품질인증서_ISO9001.pdf',
      photoUrl:
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80',
      photoCaption: 'ISO 공인 정밀 분석 연구소',
      kpis: [
        { label: 'ISO 인증', value: '9001/14001' },
        { label: '품질 검사', value: '실시간 전수' },
        { label: '만족도', value: '99.8점' },
      ],
    },
    6: {
      header: 'COMPANY PROFILE 2025 · PAGE 06',
      title: '군산 스마트 팩토리\n설비 및 사진',
      sub: '반응기 군집 및 자동 포장 라인 고해상도 설비 갤러리',
      bodyTitle: '최첨단 무인 자동화 반응 설비',
      bodyText:
        '고압 수소화 반응기 및 클린룸 이송 로봇의 실제 가동 사진 4건을 300DPI 인쇄 표준에 맞춰 선명하게 배치했습니다.',
      summary:
        '인쇄 시 깨짐 없는 고해상도(300DPI) 실물 설비 사진을 활용하여 공장 인프라의 완성도를 보여줍니다.',
      source: '공정_자동화라인_사진.jpg',
      photoUrl:
        'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '클린룸 이송 로봇 및 무인 패키징',
      kpis: [
        { label: '스마트 설비', value: '12개 라인' },
        { label: '클린룸 등급', value: 'Class 1000' },
        { label: '에너지 효율', value: 'A+ 등급' },
      ],
    },
    7: {
      header: 'COMPANY PROFILE 2025 · PAGE 07',
      title: '국내외 주요 납품\n레퍼런스 및 실적',
      sub: '반도체 세정제 및 2차전지 전구체 핵심 고객사 납품 사례',
      bodyTitle: '글로벌 톱티어 파트너사 협력 사례',
      bodyText:
        '주요 전자 및 화학 기업 대상 납품 이력과 다년간 축적된 장기 공급 계약 현황을 신뢰성 있게 서술했습니다.',
      summary:
        '국내외 8대 고객사 레퍼런스를 인포그래픽으로 일목요연하게 정리했습니다.',
      source: '회사소개서_기존본.pptx',
      photoUrl:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '글로벌 고객사 출하 및 물류 인프라',
      kpis: [
        { label: '주요 고객사', value: '8대 대기업' },
        { label: '해외 수출', value: '42%' },
        { label: '재계약률', value: '98.5%' },
      ],
    },
    8: {
      header: 'COMPANY PROFILE 2025 · PAGE 08',
      title: '연락처 및 사업 협력\n공식 문의 안내',
      sub: '영업대표부 직통 채널 및 본사·연구소 오피셜 컨택 포인트',
      bodyTitle: '신속한 상담 및 견적 문의 창구',
      bodyText:
        '신규 고객이 즉시 기술 상담과 샘플 신청을 접수할 수 있도록 직통 번호, 공식 이메일, QR코드를 깔끔하게 마감했습니다.',
      summary:
        '공식 영업 채널 및 공장 방문 접수처 정보가 정확히 기재되어 있는지 사전 검증을 마쳤습니다.',
      source: '기업 인터뷰.txt',
      photoUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '영업본부 및 테크니컬 지원 센터',
      kpis: [
        { label: '대표 번호', value: '02-555-1234' },
        { label: '공식 메일', value: 'contact@geosan.com' },
        { label: '응답 보증', value: '2시간 이내' },
      ],
    },
  }

  const activeData = splitPageData[currentPage] || splitPageData[3]

  // 페이지 이동 함수
  const stepPage = (delta: number) => {
    let next = currentPage + delta
    if (next < 1) next = 1
    if (next > 8) next = 8
    setCurrentPage(next)
  }

  // 최종 문서(PDF/DOCX) 생성 및 다운로드 핸들러
  const handleExport = async () => {
    if (isExporting || !isApproved) return
    setIsExporting(true)

    if (exportFormat === 'DOCX') {
      setExportStatus('Word(DOCX) 문서를 생성하고 있습니다...')
      try {
        const pageKeys: CompanyInfoKey[] = [
          'company_name',
          'history',
          'technology',
          'processes',
          'certifications',
          'capabilities',
          'customers_markets',
          'company_summary',
        ]
        const sections: EditableDraftSection[] = Object.values(
          splitPageData,
        ).map((p, idx) => ({
          section_id: `sec-${idx + 1}`,
          key: pageKeys[idx] || 'company_summary',
          title: p.title.replace('\n', ' - '),
          paragraphs: [
            {
              paragraph_id: `p-${idx + 1}-1`,
              text: `${p.bodyTitle}: ${p.bodyText}`,
              original_text: p.bodyText,
            },
          ],
        }))
        const fileName = await exportClientDocument(
          sections,
          companyName || '거산케미칼',
          'docx',
        )
        setExportStatus(
          `[저장 완료] ${fileName} 파일이 정상 다운로드되었습니다.`,
        )
        setTimeout(() => setExportStatus(null), 5000)
      } catch (err) {
        console.error('DOCX Export Error:', err)
        setExportStatus('[오류] Word 문서 생성 중 문제가 발생했습니다.')
      } finally {
        setIsExporting(false)
      }
      return
    }

    setExportStatus('PDF 고해상도 인쇄용 문서를 생성하고 있습니다...')
    try {
      const fileName = await generateAndDownloadPdf({
        companyName: companyName || '거산케미칼',
      })
      setExportStatus(`[저장 완료] ${fileName} 파일이 정상 다운로드되었습니다.`)
      setTimeout(() => setExportStatus(null), 5000)
    } catch (err) {
      console.error('PDF Export Error:', err)
      setExportStatus('[오류] PDF 생성 중 문제가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col w-full gap-6 pb-28 animate-fade-in">
      {/* Title & Description Header */}
      <div className="flex flex-col gap-1 pb-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
            <Verified className="h-3.5 w-3.5 text-emerald-600" />
            검수 통과 완료
          </span>
          <span className="text-xs text-slate-400 font-medium">
            문서 식별 번호: GS-2025-04A
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          확인한 내용을 승인하고 내려받으세요
        </h1>
        <p className="text-sm text-slate-600">
          선택한 출력 형식의 미리보기와 최종 점검 결과를 살펴보고 발행 승인을
          진행합니다.
        </p>
      </div>

      {/* Main Two-Column Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Document Sheet Previewer (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          {/* Top Preview Navigation Header & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 bg-white/95 px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#007A78] shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>카드형</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'split'
                      ? 'bg-white text-[#007A78] shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  <span>3단 분할 뷰</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#E6F4F1] text-[#007A78] text-[9px] font-bold">
                    추천
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'single'
                      ? 'bg-white text-[#007A78] shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>페이지 미리보기</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerBrowserPdfPrint}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                title="인쇄 또는 브라우저 PDF 저장"
              >
                <Printer className="h-3.5 w-3.5 text-[#007A78]" />
                <span>PDF 인쇄</span>
              </button>
            </div>
          </div>

          {/* 1. 3단 분할 뷰 (viewMode === 'split') */}
          {viewMode === 'split' && (
            <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              {/* 상단 상태 & 제어 바 */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 text-[#007A78] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <h2 className="text-xs font-bold text-slate-900 truncate">
                      {companyName} 회사소개서 2025 (신규 고객 소개용)
                    </h2>
                    <span className="text-[10px] text-slate-400">
                      문서 버전 v2.4 · 팩트 검증 완료 초안
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => stepPage(-1)}
                      disabled={currentPage <= 1}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-semibold px-1 text-slate-800">
                      <span className="text-[#007A78] font-bold">
                        {currentPage}
                      </span>{' '}
                      / 8
                    </span>
                    <button
                      type="button"
                      onClick={() => stepPage(1)}
                      disabled={currentPage >= 8}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#007A78] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>
                      {exportFormat === 'DOCX' ? 'Word 저장' : 'PDF 빠른저장'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 3단 분할 바디: 좌측(목차) / 중앙(읽기) / 우측(맥락) */}
              <div className="grid grid-cols-12 min-h-[580px] divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-50/50">
                {/* [좌측: 전체 구성 목차] (3 cols) */}
                <div className="col-span-12 md:col-span-3 bg-white flex flex-col p-2 space-y-1.5 overflow-y-auto max-h-[640px]">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>목차 및 페이지 구성</span>
                    <span className="text-[#007A78]">8쪽 전체</span>
                  </div>

                  {Array.from({ length: 8 }).map((_, idx) => {
                    const pNum = idx + 1
                    const isSelected = currentPage === pNum
                    const pageInfo = splitPageData[pNum]

                    return (
                      <div
                        key={pNum}
                        onClick={() => setCurrentPage(pNum)}
                        className={`p-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-2 border-[#007A78] bg-[#E6F4F1]/60 shadow-2xs'
                            : 'border border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-9 h-11 rounded border flex flex-col justify-between p-1 shrink-0 ${
                            isSelected
                              ? 'bg-white border-[#007A78]/50'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div
                            className={`w-4 h-1 rounded ${
                              isSelected ? 'bg-[#007A78]' : 'bg-slate-400'
                            }`}
                          ></div>
                          <div className="w-5 h-3 bg-teal-50 rounded flex items-center justify-center">
                            <span className="text-[8px] text-[#007A78] font-bold">
                              {pNum}
                            </span>
                          </div>
                          <div className="w-4 h-0.5 bg-slate-200 rounded"></div>
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[11px] font-bold truncate ${
                                isSelected ? 'text-[#007A78]' : 'text-slate-800'
                              }`}
                            >
                              0{pNum} {pageInfo.title.split('\n')[0]}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 truncate">
                            {pageInfo.sub}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* [중앙: 실제 A4 시트 읽기] (6 cols) */}
                <div className="col-span-12 md:col-span-6 p-4 overflow-y-auto max-h-[640px] flex justify-center bg-[#F1F5F9]">
                  <div className="w-full max-w-[480px] bg-white rounded-xl shadow-md p-6 flex flex-col justify-between min-h-[580px] border border-slate-200 transition-all">
                    <div className="flex flex-col gap-3.5">
                      {/* Sheet Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#007A78]">
                          {companyName.toUpperCase() || 'GEOSAN CHEMICAL'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {activeData.header}
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <div className="space-y-0.5">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                          {activeData.title.split('\n').map((line, lIdx) => (
                            <React.Fragment key={lIdx}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {activeData.sub}
                        </p>
                      </div>

                      {/* Graphic / Process Photo Section */}
                      <div className="rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shadow-2xs">
                        <div className="relative w-full h-32 bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
                          <img
                            className="w-full h-full object-cover opacity-90 transition-all duration-300"
                            alt={activeData.photoCaption}
                            src={activeData.photoUrl}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                          <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm shadow-xs">
                            <Verified className="h-3.5 w-3.5 text-[#007A78]" />
                            <span className="text-[10px] text-slate-900 font-bold">
                              {companyName} · {activeData.photoCaption}
                            </span>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                          <span>인쇄 규격 300DPI 매핑</span>
                          <span className="text-emerald-700 font-bold">
                            정상 렌더링
                          </span>
                        </div>
                      </div>

                      {/* Narrative Copy */}
                      <div className="space-y-1 pt-0.5">
                        <h4 className="text-xs font-bold text-slate-900">
                          {activeData.bodyTitle}
                        </h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          {activeData.bodyText}
                        </p>
                      </div>

                      {/* KPI Visual Strip */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        {activeData.kpis.map((kpi, kIdx) => (
                          <div key={kIdx} className="flex flex-col">
                            <span className="text-[9px] text-slate-400 font-medium">
                              {kpi.label}
                            </span>
                            <span className="text-xs font-bold text-[#007A78]">
                              {kpi.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sheet Footer */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{companyName} 공식 승인본</span>
                      <span className="font-bold text-slate-800">
                        PAGE 0{currentPage}
                      </span>
                    </div>
                  </div>
                </div>

                {/* [우측: 맥락 & 행동] (3 cols) */}
                <div className="col-span-12 md:col-span-3 bg-white flex flex-col p-4 justify-between space-y-4 overflow-y-auto max-h-[640px]">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        페이지 상세 맥락
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" />
                        검수 완료
                      </span>
                    </div>

                    {/* Summary Box */}
                    <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1 text-[#007A78] text-[11px] font-bold">
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>페이지 핵심 요약</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {activeData.summary}
                      </p>
                    </div>

                    {/* Verified Metrics */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">
                        검증된 핵심 수치
                      </span>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-500">원천 출처</span>
                          <span className="text-slate-900 font-bold truncate max-w-[110px]">
                            {activeData.source}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-500">검증 상태</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <Check className="h-3 w-3" />
                            오차 0건
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-500">해상도</span>
                          <span className="text-[#007A78] font-semibold">
                            300DPI 적합
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onBackToDraft}
                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#007A78] text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>초안에서 이 페이지 수정</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          `원천 근거 파일 [${activeData.source}]과 데이터가 동기화되어 있습니다.`,
                        )
                      }
                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>근거 원천 자료 보기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => stepPage(1)}
                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#E6F4F1] hover:bg-teal-100 text-[#007A78] text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>다음 페이지 검토</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 카드형 8쪽 한눈에 조망 뷰 (viewMode === 'grid') */}
          {viewMode === 'grid' && (
            <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 gap-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-[#007A78]" />
                  <h3 className="text-xs font-bold text-slate-900">
                    전체 8쪽 카드형 조망
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    카드를 클릭하면 상세 검토 페이지로 선택됩니다.
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  8개 페이지 검수 완료
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const pNum = idx + 1
                  const pData = splitPageData[pNum]
                  const isSelected = currentPage === pNum

                  return (
                    <div
                      key={pNum}
                      onClick={() => {
                        setCurrentPage(pNum)
                      }}
                      className={`group rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer relative bg-white ${
                        isSelected
                          ? 'border-2 border-[#007A78] shadow-md ring-2 ring-[#007A78]/20 bg-[#E6F4F1]/20'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        {/* Card Header & Page Number Badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isSelected
                                ? 'bg-[#007A78] text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            PAGE 0{pNum}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                            <Check className="h-3 w-3" /> 검증완료
                          </span>
                        </div>

                        {/* Thumbnail Image */}
                        <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-900 shadow-2xs">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={pData.photoCaption}
                            src={pData.photoUrl}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <span className="absolute bottom-1 left-2 text-[9px] text-white font-medium truncate max-w-[90%]">
                            {pData.photoCaption}
                          </span>
                        </div>

                        {/* Title & Sub */}
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {pData.title.replace('\n', ' ')}
                          </h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {pData.sub}
                          </p>
                        </div>

                        {/* KPIs strip */}
                        <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
                          {pData.kpis.map((kpi, kIdx) => (
                            <div key={kIdx} className="flex flex-col">
                              <span className="text-[8px] text-slate-400 truncate">
                                {kpi.label}
                              </span>
                              <span className="text-[10px] font-bold text-[#007A78] truncate">
                                {kpi.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 truncate max-w-[120px]">
                          {pData.source}
                        </span>
                        <span
                          className={`font-bold ${
                            isSelected ? 'text-[#007A78]' : 'text-slate-500'
                          }`}
                        >
                          {isSelected ? '선택됨 ✓' : '선택'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 3. 단일 페이지 포커스 미리보기 뷰 (viewMode === 'single') */}
          {viewMode === 'single' && (
            <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              {/* 상단 컨트롤 바 */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 text-[#007A78] shrink-0" />
                  <span className="text-xs font-bold text-slate-900 truncate">
                    PAGE 0{currentPage} / 08 ·{' '}
                    {activeData.title.replace('\n', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => stepPage(-1)}
                      disabled={currentPage <= 1}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold px-2 text-slate-800">
                      {currentPage} / 8쪽
                    </span>
                    <button
                      type="button"
                      onClick={() => stepPage(1)}
                      disabled={currentPage >= 8}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#007A78] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>
                      {exportFormat === 'DOCX' ? 'Word 저장' : 'PDF 저장'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Centered Large A4 Sheet */}
              <div className="p-6 sm:p-8 bg-[#F1F5F9] flex justify-center items-center min-h-[620px]">
                <div className="w-full max-w-[560px] bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-between min-h-[620px] border border-slate-200 transition-all">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#007A78]">
                        {companyName.toUpperCase() || 'GEOSAN CHEMICAL'}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {activeData.header}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                        {activeData.title.split('\n').map((line, lIdx) => (
                          <React.Fragment key={lIdx}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {activeData.sub}
                      </p>
                    </div>

                    {/* Large Photo Display */}
                    <div className="rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-2xs">
                      <div className="relative w-full h-44 bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
                        <img
                          className="w-full h-full object-cover opacity-90 transition-all duration-300"
                          alt={activeData.photoCaption}
                          src={activeData.photoUrl}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                        <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm shadow-xs">
                          <Verified className="h-4 w-4 text-[#007A78]" />
                          <span className="text-xs text-slate-900 font-bold">
                            {companyName} · {activeData.photoCaption}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-1.5 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                        <span>인쇄 규격 300DPI 매핑 완료</span>
                        <span className="text-emerald-700 font-bold">
                          ✓ 정상 렌더링
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <h4 className="text-sm font-bold text-slate-900">
                        {activeData.bodyTitle}
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {activeData.bodyText}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      {activeData.kpis.map((kpi, kIdx) => (
                        <div key={kIdx} className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {kpi.label}
                          </span>
                          <span className="text-sm font-bold text-[#007A78]">
                            {kpi.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>{companyName} 공식 승인본</span>
                    <span className="font-bold text-slate-800">
                      PAGE 0{currentPage} / 08
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Inspector / Approval Control Deck (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6 flex flex-col gap-5">
            {/* Segment 1: Export Format Choice */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                출력 형식
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Option 1: PDF (Default Selected) */}
                <button
                  type="button"
                  onClick={() => setExportFormat('PDF')}
                  className={`p-3.5 rounded-xl text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    exportFormat === 'PDF'
                      ? 'bg-[#E6F4F1]/70 border-2 border-[#007A78] shadow-xs'
                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#007A78] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        PDF
                      </span>
                    </div>
                    <FileText className="h-4 w-4 text-[#007A78]" />
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6">
                    배포·인쇄용 (권장)
                  </p>
                </button>

                {/* Option 2: DOCX */}
                <button
                  type="button"
                  onClick={() => setExportFormat('DOCX')}
                  className={`p-3.5 rounded-xl text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    exportFormat === 'DOCX'
                      ? 'bg-[#E6F4F1]/70 border-2 border-[#007A78] shadow-xs'
                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          exportFormat === 'DOCX'
                            ? 'bg-[#007A78]'
                            : 'bg-slate-200'
                        }`}
                      >
                        {exportFormat === 'DOCX' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        DOCX
                      </span>
                    </div>
                    <FileType className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6">
                    Word 추가 편집
                  </p>
                </button>
              </div>
            </div>

            {/* Segment 2: Verification Checklist Card */}
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">확인 결과</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  필수 문제 0개
                </span>
              </div>

              <div className="flex flex-col divide-y divide-slate-100 bg-slate-50 rounded-xl p-2 border border-slate-200">
                <div className="flex items-start gap-2.5 py-2 px-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">
                      필수 내용 점검
                    </span>
                    <span className="text-[11px] text-slate-600">
                      회사명({companyName})과 4대 핵심 사업 내용을 모두
                      확인했어요.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 py-2 px-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">
                      수치·근거 데이터
                    </span>
                    <span className="text-[11px] text-slate-600">
                      생산 통계 및 인증 일자 등 확인이 필요한 필수 문제가
                      없어요.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 py-2 px-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">
                      사진·캡션 정합성
                    </span>
                    <span className="text-[11px] text-slate-600">
                      사용한 스마트 공장 사진과 각 캡션 레이블 매핑을
                      확인했어요.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 py-2 px-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">
                      PDF 배치 상태
                    </span>
                    <span className="text-[11px] text-slate-600">
                      글 넘침(Overflow)이나 해상도 저하 이미지가 없어요.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Segment 3: Explicit Approval Agreement Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200">
                <input
                  type="checkbox"
                  checked={isApproved}
                  onChange={(e) => setIsApproved(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-[#007A78] cursor-pointer text-[#007A78]"
                />
                <span className="text-xs font-bold text-slate-900 leading-snug select-none">
                  최종 미리보기를 확인했으며, 이 내용으로 문서를 승인 및
                  출력하는 데 동의합니다.
                </span>
              </label>
            </div>

            {/* Segment 4: Informational Notice Bar */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 text-blue-900 border border-blue-200/80">
              <Info className="h-4 w-4 text-blue-700 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                내용이나 출력 형식을 바꾸면 사전 검수 로그가 갱신되므로 다시
                확인하고 승인해 주세요.
              </p>
            </div>

            {/* Quick Metadata Security Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-500 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#007A78]" />
                <span className="font-semibold text-slate-800">
                  출력 보안 워터마크 기본 적용
                </span>
              </div>
              <span className="text-[11px]">사내 인트라넷 전용</span>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Sticky Dock Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToDraft}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>초안 편집</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#007A78] animate-pulse"></span>
            <span>
              {exportStatus ||
                (exportFormat === 'DOCX'
                  ? 'Word 문서 형식 준비 완료 · 승인 후 완성본을 생성합니다.'
                  : 'PDF 배치 확인 완료 · 승인 후 완성본을 생성합니다.')}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={triggerBrowserPdfPrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4 text-[#007A78]" />
              <span>PDF 인쇄</span>
            </button>

            <button
              type="button"
              disabled={!isApproved || isExporting}
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] hover:brightness-105 active:scale-[0.99] text-white text-xs font-bold shadow-sm transition-all disabled:bg-slate-300 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>
                {isExporting
                  ? `${exportFormat} 생성 중...`
                  : `승인하고 ${exportFormat} 만들기`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
