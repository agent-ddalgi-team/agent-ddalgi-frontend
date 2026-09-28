import React, { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
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
  companyName,
  onBackToSources,
  onProceedToApproval,
}) => {
  // 현재 선택된 페이지
  const [activePage, setActivePage] = useState<number>(3)

  // 캔버스 본문 문구 상태
  const [canvasText, setCanvasText] = useState(
    '공정과 품질관리 내용을 정리해 고객이 필요한 정보를 확인할 수 있도록 소개합니다.',
  )
  const [isEditingInline, setIsEditingInline] = useState(false)
  const [textAppliedFeedback, setTextAppliedFeedback] = useState(false)

  // 사진 교체 모달 상태
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [selectedPhotoCandidate, setSelectedPhotoCandidate] =
    useState<number>(1)
  const [currentPhotoCaption, setCurrentPhotoCaption] = useState(
    '후보 1: 공정 설비 전경 · 권장 300DPI',
  )
  const [currentPhotoImg, setCurrentPhotoImg] = useState(
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
  )

  // 새 자료 추가 알림 배너 표시 여부
  const [showNewSourceBanner, setShowNewSourceBanner] = useState(true)

  // AI 프롬프트 및 제안 문구 상태
  const [aiPrompt, setAiPrompt] = useState(
    '이 문장을 더 짧고 읽기 쉽게 바꿔 줘.',
  )
  const [suggestedText, setSuggestedText] = useState(
    '공정과 품질관리 정보를 한눈에 확인할 수 있도록 소개합니다.',
  )
  const [isAiLoading, setIsAiLoading] = useState(false)

  // 페이지 목록 정의
  const pageList = [
    { num: 1, id: '01', title: '표지' },
    { num: 2, id: '02', title: '회사 개요' },
    { num: 3, id: '03', title: '우리의 강점' },
    { num: 4, id: '04', title: '공정 소개' },
    { num: 5, id: '05', title: '품질관리' },
    { num: 6, id: '06', title: '설비와 사진' },
    { num: 7, id: '07', title: '협력 사례' },
    { num: 8, id: '08', title: '문의 안내' },
  ]

  // 사진 후보 리스트
  const photoCandidates = [
    {
      id: 1,
      title: '후보 1 (현재)',
      caption: '공정 설비 전경',
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      title: '후보 2',
      caption: '스마트 팩토리 라인 B',
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      title: '후보 3',
      caption: '품질 연구소 정밀 분석',
      url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
    },
  ]

  // 사진 교체 적용
  const handleApplyPhoto = () => {
    const candidate = photoCandidates.find(
      (c) => c.id === selectedPhotoCandidate,
    )
    if (candidate) {
      setCurrentPhotoImg(candidate.url)
      setCurrentPhotoCaption(
        `후보 ${candidate.id}: ${candidate.caption} · 권장 300DPI`,
      )
      setIsPhotoModalOpen(false)
    }
  }

  // AI 제안 적용
  const handleApplyAiSuggestion = () => {
    setCanvasText(suggestedText)
    setTextAppliedFeedback(true)
    setTimeout(() => setTextAppliedFeedback(false), 2000)
  }

  // AI 재요청 시뮬레이션
  const handleRetryAi = () => {
    setIsAiLoading(true)
    setTimeout(() => {
      setSuggestedText(
        `${companyName}의 철저한 공정과 인증된 품질 관리 체계를 명확하고 신뢰도 높게 전달합니다.`,
      )
      setIsAiLoading(false)
    }, 600)
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
        <aside className="lg:col-span-3 bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">목차 구조</h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                8쪽 중 {activePage}쪽
              </span>
            </div>
            <button
              type="button"
              onClick={() => alert('새 페이지 블록이 추가되었습니다.')}
              className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
              title="새 페이지 추가"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Page Tree List */}
          <nav aria-label="문서 목차" className="flex flex-col gap-1">
            {pageList.map((item) => {
              const isActive = activePage === item.num

              if (isActive) {
                return (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-xl bg-[#E6F4F1]/60 border border-[#007A78]/30 shadow-2xs p-1.5 gap-1.5"
                  >
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white text-[#007A78] shadow-2xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <GripVertical className="h-4 w-4 text-[#007A78] cursor-grab" />
                        <span className="text-[11px] font-bold w-5">
                          {item.id}
                        </span>
                        <span className="text-xs font-bold truncate">
                          {item.title}
                        </span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[#007A78]"></span>
                    </div>

                    {/* 1:1 Synchronized Layout Block Children */}
                    <div className="flex flex-col pl-3 pr-1 py-1 gap-1 text-[11px]">
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-white/80 hover:bg-white text-slate-700 cursor-pointer border border-transparent hover:border-slate-200">
                        <span className="truncate">블록 1 · 대제목/소제목</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-white/80 hover:bg-white text-slate-700 cursor-pointer border border-transparent hover:border-slate-200">
                        <span className="truncate">블록 2 · 공정 사진</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[10px]">
                          사진
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white shadow-2xs border border-[#007A78] text-[#007A78] font-bold cursor-pointer ring-1 ring-[#007A78]/20">
                        <span className="truncate">
                          블록 3 · 본문 문구 (선택됨)
                        </span>
                        <Check className="h-3.5 w-3.5 text-[#007A78]" />
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 rounded bg-white/80 hover:bg-white text-slate-500 cursor-pointer">
                        <span className="truncate text-[10px]">
                          블록 4 · 근거 출처 링크
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={item.id}
                  onClick={() => setActivePage(item.num)}
                  className="group flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
                >
                  <GripVertical className="h-4 w-4 text-slate-400 opacity-40 group-hover:opacity-100 cursor-grab" />
                  <span className="text-[11px] font-semibold text-slate-400 w-5">
                    {item.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 flex-1 truncate">
                    {item.title}
                  </span>
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
                {activePage} / 8쪽
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
                  <span className="text-[10px] text-slate-400 tracking-widest font-semibold">
                    FACILITY OVERVIEW
                  </span>
                </div>
                <div className="flex flex-col gap-1 cursor-text">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                    공정과 품질을
                    <br />
                    한눈에
                  </h2>
                  <p className="text-xs text-slate-500">
                    자료로 확인하는 우리 회사의 강점
                  </p>
                </div>
              </div>

              {/* Block 2: Graphic Tile with Photo Replacement Trigger & Modal Popover */}
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-2 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] text-slate-500 font-medium">
                    블록 2 · 공정 사진
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(!isPhotoModalOpen)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#007A78] text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>사진 교체</span>
                  </button>
                </div>

                {/* Main Canvas Image */}
                <div className="relative w-full h-44 rounded-lg overflow-hidden bg-slate-900 shadow-inner">
                  <img
                    className="w-full h-full object-cover"
                    alt="공정 설비 전경"
                    src={currentPhotoImg}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/95 backdrop-blur text-slate-900 text-[10px] font-semibold shadow-xs">
                    <ImageIcon className="h-3 w-3 text-[#007A78]" />
                    <span>{currentPhotoCaption}</span>
                  </div>
                </div>

                {/* Photo Candidate Picker Modal Overlay */}
                {isPhotoModalOpen && (
                  <div className="bg-white rounded-xl border border-[#007A78]/40 shadow-xl p-4 flex flex-col gap-3 mt-1 animate-fade-in z-20">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-[#007A78]" />
                        <span className="text-xs font-bold text-slate-900">
                          사진 후보 선택
                        </span>
                        <span className="px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                          선택 자료 3장
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
                      {photoCandidates.map((candidate) => {
                        const isSelected =
                          selectedPhotoCandidate === candidate.id
                        return (
                          <div
                            key={candidate.id}
                            onClick={() =>
                              setSelectedPhotoCandidate(candidate.id)
                            }
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
                    고객에게 필요한 정보를 간결하게
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold">
                    <AlertCircle className="h-3 w-3" />
                    수치 근거 확인 필요 - 99.4%
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
                      value={canvasText}
                      onChange={(e) => setCanvasText(e.target.value)}
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
                      {canvasText}
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
                  선택한 자료(회사_품질인증서_2024.pdf)에 연결된 내용입니다.
                </span>
              </div>
            </div>

            {/* Page Footer Meta Stamp */}
            <div className="pt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 mt-6">
              <span>{companyName || '거산케미칼'} 회사소개서 · 초안</span>
              <span className="font-bold text-slate-900">03</span>
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
              <span>3쪽 · 블록 3 (선택한 본문)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              문맥: 품질 및 강점
            </span>
          </div>

          {/* User Instruction / Prompt Box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-800">
              어떻게 바꿀까요?
            </label>
            <div className="relative bg-slate-50 rounded-xl p-2.5 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007A78]/30 transition-all">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
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
                {canvasText}
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
                {suggestedText}
              </div>

              {/* Rationale Box */}
              <div className="flex flex-col gap-1 p-2 rounded-lg bg-slate-50 text-slate-600 text-[11px] border border-slate-200">
                <div className="flex items-center gap-1 text-[#007A78] font-bold">
                  <Sparkles className="h-3 w-3" />
                  <span>제안 이유</span>
                </div>
                <p className="leading-tight">
                  뜻을 유지하고 불필요한 수식어를 줄여 고객 전달력을 높였습니다.
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
