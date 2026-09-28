import React, { useState } from 'react'
import {
  AlertTriangle,
  Check,
  FileCode,
  FileType,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import type { DocumentFormat } from '../../types/profile'

interface DocumentExportBarProps {
  docBusy: boolean
  docStatus: string | null
  onDownload: (format: DocumentFormat) => void
  onReset: () => void
}

export const DocumentExportBar: React.FC<DocumentExportBarProps> = ({
  docBusy,
  docStatus,
  onDownload,
  onReset,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleConfirmReset = () => {
    setShowResetConfirm(false)
    onReset()
  }

  const isSuccessStatus = docStatus?.includes('[저장 완료]')

  return (
    <>
      {/* 하단 고정 플로팅 독 */}
      <div className="fixed bottom-6 inset-x-0 z-30 mx-auto max-w-4xl px-4 animate-fade-in">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 glass-dock p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>새 세션으로 시작</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={docBusy}
              onClick={() => onDownload('md')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {docBusy ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <FileCode className="h-4 w-4 text-emerald-600" />
              )}
              <span>Markdown(.md) 저장</span>
            </button>

            <button
              type="button"
              disabled={docBusy}
              onClick={() => onDownload('docx')}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] px-5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-[0.99] disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300"
            >
              {docBusy ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <FileType className="h-4 w-4" />
              )}
              <span>Word(.docx) 저장</span>
            </button>
          </div>
        </div>

        {/* 다운로드 상태 피드백 뱃지 */}
        {docStatus && (
          <div
            className={`mt-2 mx-auto inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-medium shadow-xs ${
              isSuccessStatus
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            {isSuccessStatus && (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span>{docStatus}</span>
          </div>
        )}
      </div>

      {/* 새 세션 시작 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  새 세션을 시작하시겠습니까?
                </h3>
                <p className="text-xs text-slate-500">
                  현재 편집 중인 초안 및 업로드된 파일 정보가 초기화됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white shadow-2xs hover:bg-red-700 transition-colors"
              >
                초기화 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
