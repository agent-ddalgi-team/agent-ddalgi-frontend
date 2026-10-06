import React, { useState } from 'react'
import {
  Bot,
  Check,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import type { AiSuggestion, EditableParagraph } from '../../types/session'

interface AiSidecarProps {
  activeParagraph: EditableParagraph | null
  suggestion: AiSuggestion | null
  isOpen: boolean
  onClose: () => void
  onRequestAi: (paragraphId: string, instruction?: string) => Promise<unknown>
  onApplyAi: (paragraphId: string, suggestionId: string) => void
  onRejectAi: (paragraphId: string, suggestionId: string) => void
  onDirectSelectCandidate: (paragraphId: string, text: string) => void
}

const PRESET_INSTRUCTIONS = [
  { label: '전문성 강화', text: '기업의 기술 전문성과 신뢰도를 더욱 강조해줘' },
  {
    label: '더 간결하게',
    text: '핵심 내용 위주로 문장을 간결하고 명확하게 다듬어줘',
  },
  {
    label: '실적/수치 부각',
    text: '생산 능력 및 고객사 납품 실적의 가치를 부각해줘',
  },
  {
    label: '격식 있는 비즈니스체',
    text: '공식 제안서에 적합한 신뢰감 있는 격식체로 수정해줘',
  },
  {
    label: '글로벌 파트너십 톤',
    text: '글로벌 진출 및 파트너 협력에 어울리는 혁신적인 어조로 변경해줘',
  },
]

export const AiSidecar: React.FC<AiSidecarProps> = ({
  activeParagraph,
  suggestion,
  isOpen,
  onClose,
  onRequestAi,
  onApplyAi,
  onRejectAi,
  onDirectSelectCandidate,
}) => {
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !activeParagraph) return null

  const handleRequest = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : instruction
    const safeText = textToSend.trim().slice(0, 500)
    setLoading(true)
    await onRequestAi(
      activeParagraph.paragraph_id,
      safeText || undefined,
    )
    setLoading(false)
    setInstruction('')
  }

  return (
    <>
      {/* 백드롭 오버레이 (클릭 시 닫기) */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity"
      />

      {/* 우측 슬라이드오버 드로어 패널 */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-all sm:max-w-lg">
        {/* Sidecar 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-200/90 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#007A78] to-[#0F766E] text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                AI 문단 수정 어시스턴트
              </h3>
              <p className="text-[11px] text-slate-500">
                팩트 기반 문맥 다듬기 및 대안 생성
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidecar 본문 스크롤 영역 */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6 text-xs">
          {/* 수정 요청 지시어 입력 영역 */}
          <div className="space-y-2 rounded-2xl border border-teal-100 bg-[#F0FDFA] p-4">
            <div className="flex items-center gap-1.5 font-bold text-[#007A78]">
              <Wand2 className="h-4 w-4" />
              <span>수정 지시사항 입력</span>
            </div>
            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRequest()}
                  placeholder="예: 품질 경쟁력을 더 부각하고 격식체로 변경해줘"
                  maxLength={500}
                  className="w-full rounded-xl border border-teal-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#007A78] focus:ring-1 focus:ring-[#007A78] focus:outline-hidden"
                />
              </div>

              {/* 추천 프리셋 버튼 목록 */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-teal-800">
                  자주 사용하는 수정 지시어:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_INSTRUCTIONS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleRequest(preset.text)}
                      className="flex items-center gap-1 rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[11px] font-medium text-[#007A78] hover:bg-[#E6F4F1] transition-colors shadow-2xs"
                    >
                      <Lightbulb className="h-3 w-3 text-[#007A78]" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleRequest()}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#007A78] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0F766E] disabled:bg-slate-300 transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>
                  {loading
                    ? 'AI 수정안 분석 및 생성 중...'
                    : 'AI 맞춤 수정안 요청'}
                </span>
              </button>
            </div>
          </div>

          {/* 기존 문구 vs 제안 문구 비교 */}
          <div className="space-y-4">
            {/* 원본 문구 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                현재 선택된 문단 (원본)
              </span>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-slate-700 leading-relaxed font-sans">
                {activeParagraph.text}
              </div>
            </div>

            {/* AI 제안 문구 */}
            {suggestion && suggestion.status === 'pending' ? (
              <div className="rounded-2xl border-2 border-teal-400 bg-white p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#007A78]">
                    <Sparkles className="h-4 w-4 text-[#007A78]" />
                    AI 추천 수정안
                  </span>
                  {suggestion.reason && (
                    <span className="text-[11px] font-semibold text-teal-800 bg-[#E6F4F1] px-2 py-0.5 rounded-full">
                      {suggestion.reason}
                    </span>
                  )}
                </div>

                <div className="rounded-xl bg-[#F0FDFA] p-4 text-xs font-medium text-slate-900 leading-relaxed border border-teal-100">
                  {suggestion.suggested_text}
                </div>

                {/* 대안 후보 문장 리스트 */}
                {suggestion.candidates && suggestion.candidates.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      추가 대안 후보 (클릭 시 즉시 적용):
                    </span>
                    <div className="space-y-2">
                      {suggestion.candidates.map((cand, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            onDirectSelectCandidate(
                              activeParagraph.paragraph_id,
                              cand,
                            )
                            onClose()
                          }}
                          className="w-full flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 transition-all hover:border-[#007A78] hover:bg-[#E6F4F1]/30 hover:text-slate-900 shadow-2xs group"
                        >
                          <span className="leading-relaxed flex-1">{cand}</span>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#007A78] shrink-0 mt-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 제안 수락 / 거절 액션 버튼 */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      onRejectAi(
                        activeParagraph.paragraph_id,
                        suggestion.suggestion_id,
                      )
                    }
                    className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    기존 문구 유지 (거절)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyAi(
                        activeParagraph.paragraph_id,
                        suggestion.suggestion_id,
                      )
                      onClose()
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] py-2.5 text-center text-xs font-bold text-white shadow-xs hover:brightness-105 transition-all"
                  >
                    <Check className="h-4 w-4" />
                    <span>추천 문구 적용</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                <Bot className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-xs text-slate-700">
                  상단에서 수정 지시어를 입력하거나 프리셋을 선택하세요
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  AI가 현재 문맥과 팩트를 종합하여 최적의 대안을 제안합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
