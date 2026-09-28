import React, { useState } from 'react'
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Layers,
  Printer,
} from 'lucide-react'
import { AiSidecar } from './AiSidecar'
import { ParagraphEditor } from './ParagraphEditor'
import type { Source } from '../../types/profile'
import type {
  AiSuggestion,
  EditableDraftSection,
  EditableParagraph,
} from '../../types/session'

interface DraftEditorPanelProps {
  draftSections: EditableDraftSection[]
  sources?: Source[]
  onUpdateParagraph: (paragraphId: string, text: string) => void
  onRequestAi: (
    paragraphId: string,
    instruction?: string,
  ) => Promise<AiSuggestion | null>
  onApplyAi: (paragraphId: string, suggestionId: string) => void
  onRejectAi: (paragraphId: string, suggestionId: string) => void
  onUndoParagraph: (paragraphId: string) => void
}

export const DraftEditorPanel: React.FC<DraftEditorPanelProps> = ({
  draftSections,
  sources,
  onUpdateParagraph,
  onRequestAi,
  onApplyAi,
  onRejectAi,
  onUndoParagraph,
}) => {
  const [selectedParagraph, setSelectedParagraph] =
    useState<EditableParagraph | null>(null)
  const [isSidecarOpen, setIsSidecarOpen] = useState(false)
  const [activeSectionNav, setActiveSectionNav] = useState<string>(
    draftSections[0]?.key || '',
  )
  const [copiedAll, setCopiedAll] = useState(false)
  const [isSourcesOpen, setIsSourcesOpen] = useState(true)

  const handleOpenAiSidecar = (p: EditableParagraph) => {
    setSelectedParagraph(p)
    setIsSidecarOpen(true)
  }

  const handleCloseAiSidecar = () => {
    setIsSidecarOpen(false)
    setSelectedParagraph(null)
  }

  const activeSuggestion =
    selectedParagraph?.active_suggestion ||
    draftSections
      .flatMap((s) => s.paragraphs)
      .find((p) => p.paragraph_id === selectedParagraph?.paragraph_id)
      ?.active_suggestion ||
    null

  // 전체 글자수 및 문단수 집계
  const totalParagraphsCount = draftSections.reduce(
    (acc, sec) => acc + sec.paragraphs.length,
    0,
  )
  const totalCharactersCount = draftSections.reduce(
    (acc, sec) =>
      acc + sec.paragraphs.reduce((pAcc, p) => pAcc + p.text.length, 0),
    0,
  )

  const handleCopyAll = async () => {
    const fullText = draftSections
      .map(
        (sec, idx) =>
          `[${idx + 1}. ${sec.title}]\n` +
          sec.paragraphs.map((p) => p.text).join('\n\n'),
      )
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(fullText)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch {
      // fallback
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* 상단 헤더 & 안내 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E6F4F1] px-3 py-1 text-xs font-semibold text-[#007A78] border border-teal-200/60 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#007A78] animate-pulse"></span>
            <span>STEP 03 · 회사소개서 1:1 문서 캔버스 & AI 문단 편집</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            13개 섹션 초안 검토 및 완성
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            생성된 초안을 직접 수정하거나 AI 사이드카를 통해 문맥과 전문성을
            고도화하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            {copiedAll ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">전체 복사됨</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>초안 전체 복사</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>인쇄 / PDF</span>
          </button>
        </div>
      </div>

      {/* 2단 워크벤치 레이아웃 (좌측 목차 아웃라인 3.5 cols - 중앙 1:1 캔버스 8.5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT RAIL: 목차 색인 네비게이션 & 출처 (3.5 cols) */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            {/* 목차 아웃라인 카드 */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-[#E6F4F1] p-1.5 text-[#007A78]">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    문서 목차 색인
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-[#007A78] bg-[#E6F4F1] px-2 py-0.5 rounded-full">
                  13개 섹션
                </span>
              </div>
              <div className="mt-3 space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {draftSections.map((sec, idx) => {
                  const isCurrent = activeSectionNav === sec.key
                  return (
                    <a
                      key={sec.key || idx}
                      href={`#sec-${sec.key}`}
                      onClick={() => setActiveSectionNav(sec.key)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                        isCurrent
                          ? 'bg-[#E6F4F1] font-bold text-[#007A78] shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-[#007A78] text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{sec.title}</span>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400 font-mono">
                        {sec.paragraphs.length}문단
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>

            {/* 인용된 출처 자료 카드 */}
            {sources && sources.length > 0 && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <BookOpen className="h-4 w-4 text-[#007A78]" />
                    <span>참고 인용 출처 ({sources.length}건)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSourcesOpen((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {isSourcesOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {isSourcesOpen && (
                  <div className="mt-3 space-y-2">
                    {sources.map((src) => (
                      <div
                        key={src.source_id}
                        className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2 text-xs text-slate-700"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[11px]">
                            {src.file_name}
                          </p>
                          {src.document_date && (
                            <span className="text-[10px] text-slate-400">
                              문서 일자: {src.document_date}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER STAGE: 1:1 문서 캔버스 시트 (8.5 cols) */}
        <main className="space-y-6 lg:col-span-8">
          {/* A4 용지 스타일 1:1 캔버스 컨테이너 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm sm:p-12">
            {/* 문서 헤더 타이틀 */}
            <div className="border-b-2 border-slate-900 pb-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#007A78]">
                    Company Profile & Capabilities
                  </span>
                  <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-bold text-[#007A78]">
                    팩트 검증 완료
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>총 {totalParagraphsCount}개 문단</span>
                  <span>·</span>
                  <span>{totalCharactersCount.toLocaleString()}자</span>
                </div>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                회사소개서 초안
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                13개 본문 섹션 · AI 기반 팩트 그라운딩 및 실시간 문맥 수정 지원
              </p>
            </div>

            {/* 13개 섹션 본문 렌더링 */}
            <div className="mt-8 space-y-10">
              {draftSections.map((section, sIdx) => {
                const sectionId = `sec-${section.key}`

                return (
                  <section
                    key={section.key || sIdx}
                    id={sectionId}
                    className="scroll-mt-24 space-y-3"
                  >
                    {/* 섹션 제목 */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#007A78] text-[11px] font-bold text-white shadow-2xs">
                          {sIdx + 1}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                          {section.title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {section.paragraphs.length}개 문단
                      </span>
                    </div>

                    {/* 섹션 내 문단들 */}
                    <div className="space-y-3">
                      {section.paragraphs.map((p) => (
                        <ParagraphEditor
                          key={p.paragraph_id}
                          paragraph={p}
                          onUpdate={(text) =>
                            onUpdateParagraph(p.paragraph_id, text)
                          }
                          onOpenAiSidecar={handleOpenAiSidecar}
                          onUndo={() => onUndoParagraph(p.paragraph_id)}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {/* S03_2 우측 AI Sidecar Drawer */}
      <AiSidecar
        activeParagraph={selectedParagraph}
        suggestion={activeSuggestion}
        isOpen={isSidecarOpen}
        onClose={handleCloseAiSidecar}
        onRequestAi={onRequestAi}
        onApplyAi={onApplyAi}
        onRejectAi={onRejectAi}
        onDirectSelectCandidate={onUpdateParagraph}
      />
    </div>
  )
}
