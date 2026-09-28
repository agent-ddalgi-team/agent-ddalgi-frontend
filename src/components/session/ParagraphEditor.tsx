import React, { useState } from 'react'
import {
  Check,
  Copy,
  Edit3,
  FileText,
  RotateCcw,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react'
import type { EditableParagraph } from '../../types/session'

interface ParagraphEditorProps {
  paragraph: EditableParagraph
  onUpdate: (text: string) => void
  onOpenAiSidecar: (paragraph: EditableParagraph) => void
  onUndo: () => void
}

export const ParagraphEditor: React.FC<ParagraphEditorProps> = ({
  paragraph,
  onUpdate,
  onOpenAiSidecar,
  onUndo,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(paragraph.text)
  const [copied, setCopied] = useState(false)
  const handleStartEdit = () => {
    setDraftText(paragraph.text)
    setIsEditing(true)
  }

  const handleSave = () => {
    onUpdate(draftText)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraftText(paragraph.text)
    setIsEditing(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paragraph.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard fallback
    }
  }

  const hasHistory =
    paragraph.is_modified ||
    (paragraph.history && paragraph.history.length > 0) ||
    paragraph.text !== paragraph.original_text

  return (
    <div className="group relative rounded-xl border border-transparent p-4 transition-all hover:border-slate-200 hover:bg-slate-50/80 hover:shadow-2xs">
      {/* 텍스트 내용 */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            autoFocus
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSave()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                handleCancel()
              }
            }}
            rows={4}
            className="w-full rounded-xl border-2 border-[#007A78] bg-white p-3.5 text-xs leading-relaxed text-slate-900 shadow-xs focus:outline-hidden"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {draftText.length}자 ·{' '}
              <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                Ctrl+Enter
              </kbd>{' '}
              저장
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                <span>취소</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 rounded-lg bg-[#007A78] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0F766E] transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                <span>저장 완료</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs leading-relaxed text-slate-800 sm:text-sm sm:leading-relaxed whitespace-pre-wrap">
            {paragraph.text}
          </p>

          {/* 문단 하단 팩트 링크 & 상태 뱃지 & 액션 툴바 */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-500">
              {paragraph.fact_ids && paragraph.fact_ids.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-[#E6F4F1] border border-teal-200/60 px-2 py-0.5 font-bold text-[#007A78]">
                  <FileText className="h-3 w-3" />
                  근거 {paragraph.fact_ids.length}건 그라운딩
                </span>
              )}
              {paragraph.is_modified && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 font-bold text-amber-800">
                  <RotateCcw className="h-2.5 w-2.5" />
                  사용자 수정됨
                </span>
              )}
            </div>

            {/* 문단 제어 툴바 (호버 및 활성 시 더 강조) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                title="문단 복사"
                className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>복사</span>
                  </>
                )}
              </button>

              {hasHistory && (
                <button
                  type="button"
                  onClick={onUndo}
                  title="원래 내용으로 되돌리기"
                  className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-2xs"
                >
                  <Undo2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>되돌리기</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenAiSidecar(paragraph)}
                className="flex items-center gap-1 rounded-lg bg-[#E6F4F1] border border-teal-200 px-2.5 py-1 font-bold text-[#007A78] hover:bg-[#007A78] hover:text-white transition-all shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI 문단 수정</span>
              </button>

              <button
                type="button"
                onClick={handleStartEdit}
                className="flex items-center gap-1 rounded-lg bg-white border border-slate-300 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                <span>직접 편집</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
