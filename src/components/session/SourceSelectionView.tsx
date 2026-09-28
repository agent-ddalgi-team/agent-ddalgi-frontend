import React, { useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Info,
  Lightbulb,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  UploadCloud,
  Verified,
  ArrowRight,
} from 'lucide-react'

interface SourceSelectionViewProps {
  companyName: string
  onCompanyNameChange?: (name: string) => void
  onProceedToDraft: () => void
  onOpenStatusMonitor?: () => void
}

export const SourceSelectionView: React.FC<SourceSelectionViewProps> = ({
  companyName,
  onProceedToDraft,
  onOpenStatusMonitor,
}) => {
  // 1. 작성 설정 상태
  const [purpose, setPurpose] = useState('new-client')
  const [activeTags, setActiveTags] = useState<string[]>([
    '품질관리',
    '공정 역량',
  ])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [direction, setDirection] = useState('quality')
  const [pageCount, setPageCount] = useState<number>(8)
  const [photoDensity, setPhotoDensity] = useState<
    'none' | 'balanced' | 'heavy'
  >('balanced')

  // 2. 활용할 자료 선택 상태
  const [activeTab, setActiveTab] = useState<'registered' | 'session'>(
    'registered',
  )
  const [selectedDocs, setSelectedDocs] = useState<Record<string, boolean>>({
    'doc-1': true,
    'doc-2': true,
    'doc-3': true,
  })
  const [sessionPhotoChecked, setSessionPhotoChecked] = useState(true)

  // 3. 사전 점검 동의 게이트
  const [inspectionConfirmed, setInspectionConfirmed] = useState(true)

  // 태그 토글 핸들러
  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  // 사용자 직접 입력 태그 추가
  const handleAddCustomTag = () => {
    const input = prompt(
      '강조하고 싶은 키워드를 입력해 주세요 (예: ESG경영, 스마트팩토리, 해외수출):',
    )
    if (input && input.trim()) {
      const tag = input.trim()
      if (!customTags.includes(tag)) {
        setCustomTags((prev) => [...prev, tag])
        setActiveTags((prev) => [...prev, tag])
      }
    }
  }

  // 문서 선택 토글
  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const selectedCount =
    Object.values(selectedDocs).filter(Boolean).length +
    (sessionPhotoChecked ? 1 : 0)

  return (
    <div className="flex flex-col w-full gap-6 pb-28 animate-fade-in">
      {/* Top Headline / Intro Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E6F4F1] text-[#007A78] text-xs font-semibold mb-2 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007A78]"></span>
            S01 단계 · 자료 구성 엔진
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            어떤 회사소개서를 만들까요?
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            목적에 맞는 자료를 고르고, 부족한 내용을 사전 점검한 뒤 신뢰도 높은
            초안을 구성하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenStatusMonitor && (
            <button
              type="button"
              onClick={onOpenStatusMonitor}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Sliders className="h-4 w-4 text-[#007A78]" />
              <span>시스템 상태 모니터</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs">
            <Verified className="h-4 w-4 text-[#007A78]" />
            <span>출처 인용 검증기 연동됨</span>
          </div>
        </div>
      </div>

      {/* 3-Column Tri-Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: 작성 설정 (Col 3 on 12-col grid) */}
        <section className="lg:col-span-3 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#007A78]" />
              <h2 className="text-base font-bold text-slate-900">작성 설정</h2>
            </div>
            <span className="text-[11px] font-semibold text-[#007A78]">
              {companyName || '기본 프로필'}
            </span>
          </div>

          {/* 사용 목적 드롭다운 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              사용 목적
              <span className="text-[11px] font-normal text-slate-400">
                필수 선택
              </span>
            </label>
            <div className="relative">
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A78]/30 focus:border-[#007A78] transition-all cursor-pointer pr-9"
              >
                <option value="new-client">신규 고객 소개 (표준 제안용)</option>
                <option value="ir-pitch">투자 유치 및 기관 IR</option>
                <option value="procurement">공공 조달 및 입찰 등록</option>
                <option value="partner">글로벌 파트너십 제휴</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              기업 개요와 핵심 제조 역량을 부각하는 데 초점을 맞춥니다.
            </p>
          </div>

          {/* 강조할 내용 칩 그룹 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              강조할 내용
              <span className="text-[11px] font-bold text-[#007A78]">
                복수 선택 가능
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {['품질관리', '공정 역량', '연구개발(R&D)', '납기 안정성'].map(
                (tag) => {
                  const isSelected = activeTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E6F4F1] text-[#007A78] ring-1 ring-[#007A78]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{tag}</span>
                    </button>
                  )
                },
              )}

              {customTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    activeTags.includes(tag)
                      ? 'bg-[#E6F4F1] text-[#007A78] ring-1 ring-[#007A78]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {activeTags.includes(tag) && <Check className="h-3 w-3" />}
                  <span>{tag}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>직접 입력</span>
              </button>
            </div>
          </div>

          {/* 작성 방향 드롭다운 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                작성 방향
              </label>
              <div className="group relative flex items-center cursor-help">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-48 p-2 rounded-lg bg-slate-900 text-white text-[11px] shadow-xl z-20 pointer-events-none">
                  품질·공정 중심은 시험 성적서, 생산 설비 라인 중심의 데이터
                  테마를 주도합니다.
                </div>
              </div>
            </div>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007A78]/30 focus:border-[#007A78] transition-all cursor-pointer"
            >
              <option value="quality">품질·공정 중심 (기술 신뢰도 확보)</option>
              <option value="balance">균형형 (개요 + 기술 + 연혁 균등)</option>
              <option value="track-record">고객사 납품 실적 중심</option>
              <option value="esg">ESG 및 친환경 인증 지향</option>
            </select>
          </div>

          {/* 목표 페이지 수 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              목표 페이지 수
              <span className="text-[11px] text-slate-400 font-normal">
                A4 세로 규격
              </span>
            </label>
            <div className="grid grid-cols-5 gap-1">
              {[1, 4, 6, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPageCount(num)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    pageCount === num
                      ? 'bg-[#007A78] text-white shadow-xs font-bold scale-[1.03]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-[#007A78]">
              <Sparkles className="h-3.5 w-3.5" />
              <p className="text-[11px] font-semibold">
                추천 8쪽 · 오른쪽 사전 점검에서 확인
              </p>
            </div>
          </div>

          {/* 사진 및 도식 비중 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-800">
              사진 및 도식 비중
            </label>
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl gap-1">
              {(
                [
                  { key: 'none', label: '없음' },
                  { key: 'balanced', label: '균형' },
                  { key: 'heavy', label: '많이' },
                ] as const
              ).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setPhotoDensity(d.key)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    photoDensity === d.key
                      ? 'bg-white text-[#007A78] shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 보조 인포 배너 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 mt-1">
            <Lightbulb className="h-4 w-4 text-[#007A78] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              페이지 수와 사진 비중은 자료 사전 점검 결과 이후 초안 편집기
              화면에서도 언제든 실시간 조정할 수 있습니다.
            </p>
          </div>
        </section>

        {/* CENTER PANEL: 활용할 자료 (Col 6 on 12-col grid) */}
        <section className="lg:col-span-6 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          {/* Title & Segmented Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                활용할 자료
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                {selectedCount}개 선택됨
              </span>
            </div>

            <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('registered')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'registered'
                    ? 'bg-white text-[#007A78] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                등록 자료
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('session')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'session'
                    ? 'bg-white text-[#007A78] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>이번 세션 첨부</span>
                <span className="w-4 h-4 rounded-full bg-teal-200 text-teal-900 text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
              </button>
            </div>
          </div>

          {/* Source List Cards */}
          <div className="flex flex-col gap-2.5">
            {/* Item 1: PPTX */}
            <div
              onClick={() => toggleDoc('doc-1')}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                selectedDocs['doc-1']
                  ? 'bg-white border-[#007A78] shadow-2xs ring-1 ring-[#007A78]/20'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                    selectedDocs['doc-1']
                      ? 'bg-[#007A78] text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#007A78] flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      회사소개서_기존본.pptx
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      48쪽
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    기존 소개 자료 · 주요 공정 라인 및 개요 텍스트 추출 완료
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  읽기 완료
                </span>
              </div>
            </div>

            {/* Item 2: TXT */}
            <div
              onClick={() => toggleDoc('doc-2')}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                selectedDocs['doc-2']
                  ? 'bg-white border-[#007A78] shadow-2xs ring-1 ring-[#007A78]/20'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                    selectedDocs['doc-2']
                      ? 'bg-[#007A78] text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#007A78] flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      기업 인터뷰.txt
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      24KB
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    대표이사 및 품질책임자 인터뷰 요약본 · 정성 지표 활용
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  읽기 완료
                </span>
              </div>
            </div>

            {/* Item 3: PDF */}
            <div
              onClick={() => toggleDoc('doc-3')}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                selectedDocs['doc-3']
                  ? 'bg-white border-[#007A78] shadow-2xs ring-1 ring-[#007A78]/20'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                    selectedDocs['doc-3']
                      ? 'bg-[#007A78] text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      인증서_ISO9001.pdf
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      스캔본
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    품질 인증 자료 · OCR 스캔 해상도로 인해 세부 조항 보완 필요
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold">
                  <AlertTriangle className="h-3 w-3" />
                  일부 읽기
                </span>
              </div>
            </div>
          </div>

          {/* 이번 작업에 사용할 파일 추가 (Dedicated Session Drop Area) */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">
                이번 작업에 사용할 파일 추가
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                이번 세션에서만 임시 보관
              </span>
            </div>

            {/* Session Image Item Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div
                onClick={() => setSessionPhotoChecked(!sessionPhotoChecked)}
                className="flex items-center gap-3 min-w-0 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    sessionPhotoChecked
                      ? 'bg-[#007A78] text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>
                {/* Photo Thumbnail Preview */}
                <div className="relative w-14 h-11 rounded-lg overflow-hidden bg-slate-800 shrink-0 shadow-2xs">
                  <img
                    className="w-full h-full object-cover"
                    alt="스마트 공정 설비 라인"
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&auto=format&fit=crop&q=80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1">
                    <span className="text-[9px] text-white font-medium">
                      사진 1개
                    </span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    공정_자동화라인_사진.jpg
                  </span>
                  <p className="text-[11px] text-slate-500 truncate">
                    초안 4쪽, 5쪽 제조 공정 소개 배경으로 자동 활용 권장
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  alert('신규 공정 사진 파일이 세션에 등록되었습니다.')
                }
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-50 shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5 text-[#007A78]" />
                <span>+ 파일 추가</span>
              </button>
            </div>

            {/* Drag & Drop Zone Strip */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer hover:bg-[#E6F4F1]/40 hover:border-[#007A78]/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#E6F4F1] text-[#007A78] flex items-center justify-center">
                <UploadCloud className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                파일을 끌어 놓거나 추가 버튼을 누르세요
              </p>
              <p className="text-[11px] text-slate-500">
                첨부 자료는 회사 공용 자료실에 영구 저장되지 않고 본 세션 종료
                시 안전하게 정리됩니다.
              </p>
              <div className="flex items-center gap-2 mt-1 text-slate-400 text-[10px] font-medium">
                <span>파일당 최대 10MB</span>
                <span>•</span>
                <span>세션당 최대 10개</span>
                <span>•</span>
                <span className="text-[#007A78] font-semibold">
                  PDF, DOCX, PPTX, TXT, JPG, PNG
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: 사전 점검 (Col 3 on 12-col grid) */}
        <section className="lg:col-span-3 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Verified className="h-5 w-5 text-[#007A78]" />
              <h2 className="text-base font-bold text-slate-900">사전 점검</h2>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
              <Check className="h-3 w-3" />
              완료
            </span>
          </div>

          <p className="text-[11px] text-slate-500 -mt-2">
            선택한 목적 및 3건의 자료를 검토하여 최적의 구성 플랜을
            도출했습니다.
          </p>

          {/* Status Result Box 1: 초안 가능 확인 */}
          <div className="p-3.5 rounded-xl bg-[#E6F4F1] border border-[#007A78]/20 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#007A78] font-bold text-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>초안을 즉시 만들 수 있어요</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              회사 소개, 생산 공정, 연혁 표시에 필요한 텍스트 및 기본 정량
              근거가 충분히 확보되었습니다.
            </p>
          </div>

          {/* Metric Visualization: Data Completeness Bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">자료 신뢰 충실도</span>
              <span className="text-[#007A78]">88%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-[#007A78] rounded-full transition-all duration-700"
                style={{ width: '88%' }}
              ></div>
            </div>
            <div className="grid grid-cols-3 text-center pt-1 text-[11px] text-slate-500">
              <div>
                개요{' '}
                <strong className="text-slate-900 block font-semibold">
                  충분
                </strong>
              </div>
              <div>
                공정/품질{' '}
                <strong className="text-slate-900 block font-semibold">
                  우수
                </strong>
              </div>
              <div>
                인증서{' '}
                <strong className="text-amber-600 block font-semibold">
                  보완 권장
                </strong>
              </div>
            </div>
          </div>

          {/* Status Result Box 2: 추천 구성 8쪽 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-900 text-xs font-bold">
                <FileText className="h-4 w-4 text-[#007A78]" />
                <span>추천 구성 플랜</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#007A78] text-white text-[10px] font-bold">
                8쪽 구조
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
              공정과 품질관리 설명에 이번 세션에 추가된 자동화 사진을 결합할 수
              있도록 <strong>8쪽 구성</strong>을 가장 권장합니다.
            </p>
          </div>

          {/* Status Result Box 3: 보완 권장 안내 */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                추가하면 좋은 자료
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">
                보완 권장
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              인증 번호 및 유효 기간을 초안에 확정 문구로 넣으려면 선명한 텍스트
              또는 고해상도 인증 자료를 보완해 주세요.
            </p>
            <div className="p-2 rounded bg-slate-50 text-slate-600 text-[11px] flex items-center gap-1.5 mt-1">
              <ImageIcon className="h-3.5 w-3.5 text-[#007A78]" />
              <span>
                공정 실물 사진 1~2장을 추가하면 신뢰도가 25% 상승합니다.
              </span>
            </div>
          </div>

          {/* Refresh Re-check Button */}
          <button
            type="button"
            onClick={() =>
              alert(
                '사전 점검이 새로고침되었습니다. 최적 구성 8쪽이 유지됩니다.',
              )
            }
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>자료를 바꾸고 다시 점검</span>
          </button>

          {/* Confirmation Checkbox Gate */}
          <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inspectionConfirmed}
              onChange={(e) => setInspectionConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#007A78] accent-[#007A78] cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">
                점검 내용을 확인했습니다.
              </span>
              <span className="text-[11px] text-slate-500 leading-tight mt-0.5">
                추천 보완 자료가 없더라도 현재 확보된 근거 기반으로 즉시
                시작합니다.
              </span>
            </div>
          </label>
        </section>
      </div>

      {/* Persistent Bottom Action Dock */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Left Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <FolderOpen className="h-4 w-4 text-[#007A78]" />
              <span>자료 {selectedCount}개 선택</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">
                이번 세션에서만 첨부 자료 1건 사용
              </span>
            </div>
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F4F1] text-[#007A78] text-[11px] font-semibold">
              데이터 휘발 보장
            </span>
          </div>

          {/* Right Action CTA */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!inspectionConfirmed}
              onClick={onProceedToDraft}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] hover:brightness-105 active:scale-[0.99] text-white text-xs font-bold shadow-sm transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
            >
              <span>확인하고 초안 만들기</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
