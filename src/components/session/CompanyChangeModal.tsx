import { Building2, Check, RefreshCw, Sparkles, X } from 'lucide-react'
import { useState } from 'react'

export interface CompanyChangeModalProps {
  isOpen: boolean
  currentCompany: string
  onClose: () => void
  onConfirm: (newCompanyName: string, refreshPublicData: boolean) => void
}

const PRESET_COMPANIES = [
  { name: '(주)거산케미칼', category: '화학소재 · 반도체 세정제' },
  { name: '(주)테크솔루션', category: '소프트웨어 · AI 자동화' },
  { name: '한국바이오팜(주)', category: '제약 · 바이오헬스 케어' },
  { name: '에이치디현대', category: '중공업 · 조선 · 친환경에너지' },
  { name: '(주)그린에너지', category: '신재생에너지 · 차세대 배터리' },
  { name: '(주)미래소재', category: '이차전지 전구체 · 나노신소재' },
]

export function CompanyChangeModal({
  isOpen,
  currentCompany,
  onClose,
  onConfirm,
}: CompanyChangeModalProps) {
  const [inputName, setInputName] = useState(currentCompany)
  const [refreshPublicData, setRefreshPublicData] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSelectPreset = (name: string) => {
    setInputName(name)
    setErrorMsg('')
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = inputName.trim()
    if (!trimmed) {
      setErrorMsg('소속 기업/기관명을 입력해 주세요.')
      return
    }
    if (trimmed.length > 50) {
      setErrorMsg('기업명은 50자 이하로 입력해 주세요.')
      return
    }

    // XSS 방어: 스크립트나 위험 특수문자 제거
    const sanitized = trimmed.replace(/[<>'"]/g, '')
    onConfirm(sanitized, refreshPublicData)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all"
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
                관리자 소속(기업/기관) 변경
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                소속을 변경하면 DART·특허청·조달청 공공데이터가 새 기업에 맞춰
                연동됩니다.
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
                value={inputName}
                onChange={(e) => {
                  setInputName(e.target.value)
                  if (errorMsg) setErrorMsg('')
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
                  onClick={() => setInputName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  지우기
                </button>
              )}
            </div>
            {errorMsg ? (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errorMsg}</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">
                현재 소속: <strong className="text-slate-600">{currentCompany}</strong>
              </p>
            )}
          </div>

          {/* 추천/대표 기업 빠른 선택 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-slate-700">
                빠른 기업 선택 (예시)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_COMPANIES.map((item) => {
                const isSelected = inputName.trim() === item.name
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectPreset(item.name)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {item.name}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#007A78]" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 truncate w-full">
                      {item.category}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 공개 데이터 자동 갱신 체크박스 */}
          <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={refreshPublicData}
                onChange={(e) => setRefreshPublicData(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#007A78] focus:ring-teal-400 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 text-[#007A78]" />
                  소속 변경 시 공개 데이터(DART·특허·조달청)도 즉시 새로고침
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  새로 지정된 소속 기업의 최신 공공데이터 4건으로 연동 자료를 자동
                  전환합니다.
                </p>
              </div>
            </label>
          </div>

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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#007A78] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#006663] transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>소속 변경 적용</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
