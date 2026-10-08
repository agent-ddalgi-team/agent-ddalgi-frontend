import {
  Building2,
  CloudCheck,
  FileText,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { isScreenPreview } from './services/mockBackend'
import { SourceSelectionView } from './components/session/SourceSelectionView'
import { StepIndicator } from './components/session/StepIndicator'
import type { WizardStep } from './components/session/StepIndicator'
import { SystemStatusModal } from './components/session/SystemStatusModal'

function App() {
  const [hasDraft, setHasDraft] = useState(false)
  const [step, setStep] = useState<WizardStep>(1)
  const [company, setCompany] = useState<string>(() => {
    return '거산케미칼'
  })
  const [statusOpen, setStatusOpen] = useState(false)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)

  const navigate = (next: WizardStep) => {
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const onDraftAvailable = useCallback((available: boolean) => {
    setHasDraft(available)
    setStep((current) =>
      available ? (current === 1 && !isScreenPreview ? 2 : current) : 1,
    )
  }, [])

  const handleCompanyChange = useCallback((newCompany: string) => {
    setCompany(newCompany)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#F1F5F9] font-sans text-[#0F172A] antialiased">
      {/* 1. 고정 글로벌 헤더 (56px) */}
      <header className="sticky top-0 z-40 h-14 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_8px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#005f5e] text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                회사소개서 도우미
              </h1>
              <span className="hidden text-[11px] font-semibold text-slate-400 sm:inline">
                Enterprise Studio
              </span>
            </div>
          </div>

          <div className="hidden items-center md:flex">
            <button
              type="button"
              onClick={() => setIsCompanyModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50 px-3 py-1 text-blue-700 shadow-2xs hover:bg-blue-100/90 transition-colors cursor-pointer group"
              title="소속 기업/기관 변경"
            >
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-bold">
                {hasDraft ? '초안 작업' : '현재 작업'} · {company}
              </span>
              <span className="ml-0.5 rounded bg-blue-200/70 px-1.5 py-0.2 text-[10px] font-bold text-blue-800 group-hover:bg-blue-300 transition-colors">
                변경
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 lg:flex">
              <CloudCheck className="h-4 w-4 text-[#007A78]" />
              <span>
                {isScreenPreview
                  ? '가상 데이터 · 이 탭에서만 보관'
                  : '현재 작업 안에 임시 저장'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStatusOpen(true)}
              className="cursor-pointer rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              title="예외 상태 안내 열기"
            >
              상태 안내
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#005f5e] text-white shadow-2xs">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {isScreenPreview && (
        <div
          role="note"
          className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
        >
          <strong>가상 데이터 화면 시연</strong> · 1·2·3단계를 눌러 이동하세요.
          편집·검사·승인은 가상 결과이며, 실제 AI 호출·서버 저장·파일 다운로드는
          실행되지 않습니다.
        </div>
      )}
      {/* 2. 3단계 진행 표시 */}
      <StepIndicator
        currentStep={step}
        maxStep={hasDraft ? 3 : 1}
        onStepChange={navigate}
      />

      {/* 3. 작업 영역 */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 sm:px-8">
        <SourceSelectionView
          onDraftAvailable={onDraftAvailable}
          step={step}
          onNavigate={navigate}
          companyModalOpen={isCompanyModalOpen}
          onCompanyModalOpen={() => setIsCompanyModalOpen(true)}
          onCompanyModalClose={() => setIsCompanyModalOpen(false)}
          onCompanyChange={handleCompanyChange}
        />
      </main>

      {/* 4. 푸터 (하단 액션 독 위에 보이도록 여백 확보) */}
      <footer className="mt-auto mb-20 w-full border-t border-slate-200 bg-white py-4 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>© 2026 회사소개서 도우미</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/60 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
              <ShieldCheck className="h-3 w-3" />
              {isScreenPreview
                ? '작업 종료 시 가상 자료 정리'
                : '작업 종료 시 서버 자료 정리'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">
              {isScreenPreview
                ? '시연 데이터는 이 브라우저 탭에만 저장됩니다. 실제 파일은 생성하지 않습니다.'
                : '첨부·초안·출력 파일은 작업 종료 또는 만료 시 서버에서 삭제되며, 내려받은 파일은 기기에 남습니다.'}
            </span>
            <button
              type="button"
              onClick={() => setStatusOpen(true)}
              className="cursor-pointer whitespace-nowrap transition-colors hover:text-slate-900"
            >
              도움말
            </button>
          </div>
        </div>
      </footer>

      {/* 5. 예외 상태 안내 */}
      <SystemStatusModal
        isOpen={statusOpen}
        onClose={() => setStatusOpen(false)}
      />
    </div>
  )
}
export default App
