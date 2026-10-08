import { Building2, Check, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { sourceApi, type CompanySearchItem } from '../../api/sources'

export interface CompanyChangeModalProps {
  isOpen: boolean
  currentCompany: string
  currentCorpCode?: string
  onClose: () => void
  onConfirm: (newCompanyName: string, corpCode?: string) => Promise<boolean>
  disabled?: boolean
  hasSession?: boolean
}

export function CompanyChangeModal({
  isOpen,
  currentCompany,
  currentCorpCode,
  onClose,
  onConfirm,
  disabled = false,
  hasSession = false,
}: CompanyChangeModalProps) {
  const [inputName, setInputName] = useState(currentCompany)
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const [selectedCode, setSelectedCode] = useState(currentCorpCode)
  const [results, setResults] = useState<CompanySearchItem[]>([])
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(inputName.trim().length >= 2)

  useEffect(() => {
    if (!isOpen || inputName.trim().length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await sourceApi.searchCompanies(
          inputName.trim(),
          controller.signal,
        )
        if (!controller.signal.aborted) {
          setResults(response.items)
          setSearchError('')
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setResults([])
          setSearchError(
            cause instanceof Error
              ? cause.message
              : '기업 검색을 완료하지 못했습니다.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [inputName, isOpen])

  const updateName = (name: string, code?: string) => {
    setSelectedCode(code)
    if (name === inputName) return
    setInputName(name)
    setErrorMsg('')
    setResults([])
    setSearchError('')
    setSearching(name.trim().length >= 2)
  }

  if (!isOpen) return null

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (disabled || saving) return
    const trimmed = inputName.trim()
    if (!trimmed) {
      setErrorMsg('소속 기업/기관명을 입력해 주세요.')
      return
    }
    if (trimmed.length > 50) {
      setErrorMsg('기업명은 50자 이하로 입력해 주세요.')
      return
    }

    setSaving(true)
    try {
      if (await onConfirm(trimmed, selectedCode)) onClose()
      else
        setErrorMsg(
          '변경을 저장하지 못했습니다. 작업 상태와 오류 안내를 확인해 주세요.',
        )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] overflow-y-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#007A78] border border-teal-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="modal-title"
                className="text-base font-bold text-slate-900"
              >
                소속 기업/기관 변경
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                대상 회사를 저장하고 해당 회사의 자료로 점검합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 직접 입력 필드 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              소속 기업/기관명 입력
            </label>
            <div className="relative">
              <input
                type="text"
                aria-label="대상 회사명"
                value={inputName}
                disabled={disabled || saving}
                onChange={(e) => {
                  updateName(e.target.value)
                }}
                maxLength={50}
                placeholder="예: (주)한국첨단소재"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all outline-none ${
                  errorMsg
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 bg-slate-50/50 text-slate-900 focus:border-[#007A78] focus:bg-white focus:ring-2 focus:ring-teal-100'
                }`}
                autoFocus
              />
              {inputName && (
                <button
                  type="button"
                  onClick={() => updateName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  지우기
                </button>
              )}
            </div>
            {errorMsg ? (
              <p className="mt-1 text-xs text-rose-600 font-medium">
                {errorMsg}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">
                현재 소속:{' '}
                <strong className="text-slate-600">{currentCompany}</strong>
              </p>
            )}
          </div>

          {/* 추천/대표 기업 빠른 선택 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-slate-700">
                빠른 기업 선택 (DART 검색 결과)
              </span>
            </div>
            <div
              className="max-h-56 overflow-y-auto"
              aria-live="polite"
              aria-busy={searching}
            >
              {inputName.trim().length < 2 ? (
                <p className="text-xs text-slate-500">
                  기업명을 두 글자 이상 입력해 주세요.
                </p>
              ) : searching ? (
                <p className="text-xs text-slate-500">기업 검색 중…</p>
              ) : searchError ? (
                <p className="text-xs text-rose-600">{searchError}</p>
              ) : results.length === 0 ? (
                <p className="text-xs text-slate-500">
                  일치하는 DART 기업이 없습니다. 회사명을 직접 입력해 저장할 수
                  있습니다.
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                {results.map((item) => {
                  const isSelected = selectedCode === item.corp_code
                  return (
                    <button
                      key={item.corp_code}
                      type="button"
                      disabled={disabled || saving}
                      onClick={() => updateName(item.corp_name, item.corp_code)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/80 shadow-xs'
                          : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="min-w-0 break-words text-xs font-bold text-slate-900">
                          {item.display_name || item.corp_name}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-[#007A78]" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate w-full">
                        DART 고유번호 {item.corp_code}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <p className="rounded-xl bg-teal-50 p-3 text-xs text-teal-900">
            {disabled
              ? '진행 중인 작업을 마친 뒤, 초안이 있으면 자료 변경 시작을 먼저 선택해 주세요.'
              : hasSession
                ? '회사 변경 시 기존 자료 선택을 해제합니다. 파일과 문서는 보존되며 새 회사 자료를 선택해 다시 점검해야 합니다.'
                : '선택한 회사는 작업을 시작할 때 서버에 저장됩니다.'}{' '}
            공개 자료는 회사 저장 후 공개 데이터 가져오기에서 연결합니다.
          </p>
          {/* 하단 버튼 */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={disabled || saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#007A78] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#006663] transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>
                {saving
                  ? '저장 중'
                  : hasSession
                    ? '회사 변경 및 자료 선택 해제'
                    : '회사 선택'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
