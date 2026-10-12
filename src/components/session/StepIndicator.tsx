import React from 'react'
import { Check, ChevronRight } from 'lucide-react'

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
    { number: 1, label: '자료 선택·사전 확인', subtitle: '원자료 분석 & 충족도' },
    { number: 2, label: '초안 편집', subtitle: 'AI 초안 & 근거 대조' },
    { number: 3, label: '승인·출력', subtitle: '배치 검사 & PDF 발행' },
  ] as const

  return (
    <div className="w-full bg-white/80 backdrop-blur-md shadow-[0_2px_16px_rgba(15,23,42,0.03)] border-b border-slate-200/80 mb-6 py-3">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 flex items-center justify-center">
        <nav
          className="flex items-center gap-1 sm:gap-2 p-1.5 rounded-full bg-slate-100/90 border border-slate-200/70 shadow-inner"
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
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                    isActive
                      ? 'bg-white text-slate-900 font-extrabold shadow-sm shadow-slate-300/60 ring-1 ring-slate-200 scale-[1.02]'
                      : isCompleted
                        ? 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                        : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-tr from-[#006663] to-[#007A78] text-white shadow-xs shadow-[#007A78]/30 ring-2 ring-teal-100'
                        : isCompleted
                          ? 'bg-teal-100 text-[#007A78]'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : s.number}
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="tracking-tight leading-tight">{s.label}</span>
                    <span className={`text-[10px] hidden md:inline leading-tight ${isActive ? 'text-[#007A78] font-bold' : 'text-slate-400 font-normal'}`}>
                      {s.subtitle}
                    </span>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300/90 shrink-0" />
                )}
              </React.Fragment>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
