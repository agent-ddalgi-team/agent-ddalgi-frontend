import React from 'react'
import { ChevronRight } from 'lucide-react'

export type WizardStep = 1 | 2 | 3

interface StepIndicatorProps {
  currentStep: WizardStep
  onStepChange?: (step: WizardStep) => void
  maxStep?: WizardStep
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepChange,
  maxStep = 3,
}) => {
  const steps = [
    { number: 1, label: '자료 선택·사전 확인' },
    { number: 2, label: '초안 편집' },
    { number: 3, label: '승인·출력' },
  ] as const

  return (
    <div className="w-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] border-b border-slate-200/80 mb-6 py-2">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 flex items-center justify-center">
        <nav
          className="flex items-center gap-1 sm:gap-2 p-1 rounded-full bg-[#F1F5F9]"
          aria-label="제작 단계 네비게이션"
        >
          {steps.map((s, idx) => {
            const isActive = currentStep === s.number
            const isCompleted = currentStep > s.number

            return (
              <React.Fragment key={s.number}>
                <button
                  type="button"
                  aria-label={`${s.number}단계 ${s.label}`}
                  aria-current={isActive ? 'step' : undefined}
                  disabled={s.number > maxStep}
                  title={
                    s.number > maxStep
                      ? '자료를 점검하고 초안을 먼저 생성해 주세요.'
                      : undefined
                  }
                  onClick={() => onStepChange?.(s.number as WizardStep)}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    isActive
                      ? 'bg-[#E6F4F1] text-[#007A78] font-bold shadow-xs scale-[1.02]'
                      : isCompleted
                        ? 'text-slate-700 hover:text-slate-900'
                        : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isActive
                        ? 'bg-[#007A78] text-white'
                        : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {s.number}
                  </span>
                  <span>{s.label}</span>
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
