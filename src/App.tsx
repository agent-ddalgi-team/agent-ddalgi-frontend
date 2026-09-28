import { useState } from 'react'
import {
  Building2,
  CloudCheck,
  FileText,
  ShieldCheck,
  User,
} from 'lucide-react'
import { ApprovalExportView } from './components/session/ApprovalExportView'
import { DraftEditorView } from './components/session/DraftEditorView'
import { SourceSelectionView } from './components/session/SourceSelectionView'
import {
  StepIndicator,
  type WizardStep,
} from './components/session/StepIndicator'
import { SystemStatusModal } from './components/session/SystemStatusModal'

function App() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [companyName, setCompanyName] = useState<string>('거산케미칼')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false)

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-sans flex flex-col antialiased">
      {/* 1. 고정 글로벌 헤더 (56px) */}
      <header className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#005f5e] text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                회사소개서 도우미
              </h1>
              <span className="text-[11px] font-semibold text-slate-400">
                Enterprise Studio
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center">
            <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full gap-1.5 border border-blue-200/60 shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-bold">
                예시 작업 · {companyName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <CloudCheck className="h-4 w-4 text-[#007A78]" />
              <span>자동 동기화됨</span>
            </div>

            <button
              type="button"
              onClick={() => setIsStatusModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="상태 모니터 열기"
            >
              상태 모니터
            </button>

            <div className="w-8 h-8 rounded-full bg-[#005f5e] flex items-center justify-center text-white shadow-2xs">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. 3-Step Wizard Navigation Stepper Bar */}
      <StepIndicator
        currentStep={currentStep}
        onStepChange={(step) => setCurrentStep(step)}
      />

      {/* 3. Main Stage Container (1600px max-width) */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 flex-1">
        {/* Step 1: 자료 선택 · 사전 확인 */}
        {currentStep === 1 && (
          <SourceSelectionView
            companyName={companyName}
            onCompanyNameChange={setCompanyName}
            onProceedToDraft={() => setCurrentStep(2)}
            onOpenStatusMonitor={() => setIsStatusModalOpen(true)}
          />
        )}

        {/* Step 2: 초안 편집 */}
        {currentStep === 2 && (
          <DraftEditorView
            companyName={companyName}
            onBackToSources={() => setCurrentStep(1)}
            onProceedToApproval={() => setCurrentStep(3)}
          />
        )}

        {/* Step 3: 승인 · 출력 (PDF 다운로드 & 인쇄) */}
        {currentStep === 3 && (
          <ApprovalExportView
            companyName={companyName}
            onBackToDraft={() => setCurrentStep(2)}
          />
        )}
      </main>

      {/* 4. Global Footer */}
      <footer className="w-full bg-white border-t border-slate-200 shadow-[0_1px_8px_rgba(0,0,0,0.03)] mt-auto py-4">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>© 2025 {companyName} · 회사소개서 도우미 시스템</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/60">
              <ShieldCheck className="h-3 w-3" />
              세션 보안 적용
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span
              onClick={() =>
                alert(
                  '데이터 소스 정책: 업로드된 임시 문서는 세션 종료 시 즉시 파기됩니다.',
                )
              }
              className="hover:text-slate-900 cursor-pointer transition-colors"
            >
              데이터 소스 정책
            </span>
            <span
              onClick={() =>
                alert(
                  'AI 생성 신뢰도 가이드: 팩트 그라운딩 AI를 통해 출처 불일치 0%를 보장합니다.',
                )
              }
              className="hover:text-slate-900 cursor-pointer transition-colors"
            >
              AI 생성 신뢰도 가이드
            </span>
            <span
              onClick={() => setIsStatusModalOpen(true)}
              className="hover:text-slate-900 cursor-pointer transition-colors"
            >
              도움말 지원
            </span>
          </div>
        </div>
      </footer>

      {/* 5. System Status Monitor Modal */}
      <SystemStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </div>
  )
}

export default App
