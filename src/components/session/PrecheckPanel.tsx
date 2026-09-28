import React, { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  HelpCircle,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react'
import type { PrecheckResult } from '../../types/session'

interface PrecheckPanelProps {
  precheck: PrecheckResult | null
  onConfirmAndDraft: (answers?: Record<string, string>) => void
  onBackToUpload: () => void
  loading: boolean
}

// 14개 기본 점검 항목 정의 (계약 v1.0 기준)
const CHECKLIST_FIELDS = [
  {
    key: 'company_name',
    label: '1. 회사명 및 국영문 표기',
    category: '기본 정보',
  },
  {
    key: 'company_summary',
    label: '2. 회사 개요 및 비전',
    category: '기본 정보',
  },
  {
    key: 'business_areas',
    label: '3. 주요 사업 분야',
    category: '사업 역량',
  },
  {
    key: 'products_services',
    label: '4. 주력 제품 및 서비스',
    category: '사업 역량',
  },
  {
    key: 'technology',
    label: '5. 핵심 기술 및 R&D 역량',
    category: '기술/공정',
  },
  {
    key: 'processes',
    label: '6. 제조 및 생산 공정',
    category: '기술/공정',
  },
  {
    key: 'process_count',
    label: '7. 공정 단계 수 및 세부공정',
    category: '기술/공정',
  },
  {
    key: 'capabilities',
    label: '8. 생산 설비 및 생산능력(CAPA)',
    category: '기술/공정',
  },
  {
    key: 'strengths',
    label: '9. 시장 내 핵심 경쟁우위',
    category: '시장/실적',
  },
  {
    key: 'customers_markets',
    label: '10. 주요 고객사 및 목표시장',
    category: '시장/실적',
  },
  {
    key: 'certifications',
    label: '11. 인증, 특허 및 수상 내역',
    category: '신뢰/인증',
  },
  {
    key: 'history',
    label: '12. 기업 연혁 및 성장 과정',
    category: '기본 정보',
  },
  {
    key: 'lead_time',
    label: '13. 납기 및 품질보증 프로세스',
    category: '신뢰/인증',
  },
  {
    key: 'other_info',
    label: '14. 기타 핵심 추가 정보',
    category: '기타',
  },
]

export const PrecheckPanel: React.FC<PrecheckPanelProps> = ({
  precheck,
  onConfirmAndDraft,
  onBackToUpload,
  loading,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [filterType, setFilterType] = useState<'all' | 'issue' | 'passed'>(
    'all',
  )
  const [isChecklistCollapsed, setIsChecklistCollapsed] = useState(false)

  const handleSelectCandidate = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleAnswerInput = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const isNeedsConfirm = precheck?.status === 'needs_confirmation'
  const isWarning = precheck?.status === 'warning'

  const missingList = precheck?.missing_fields || ['기타 핵심 추가 정보']
  const conflictList = precheck?.conflicts || []
  const questionList = precheck?.questions || []

  // 해결된 상충 건수
  const resolvedConflictsCount = conflictList.filter((c) =>
    Boolean(answers[c.key]),
  ).length

  const filteredFields = CHECKLIST_FIELDS.filter((field) => {
    const isMissing =
      missingList.includes(field.label) || missingList.includes(field.key)
    const isConflict = conflictList.some((c) => c.key === field.key)

    if (filterType === 'issue') return isConflict || isMissing
    if (filterType === 'passed') return !isConflict && !isMissing
    return true
  })

  return (
    <div className="space-y-6">
      {/* 상단 헤드라인 & 상태 카드 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E6F4F1] px-3 py-1 text-xs font-semibold text-[#007A78] border border-teal-200/60 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#007A78] animate-pulse"></span>
            <span>STEP 02 · 자료 사전 점검 및 정합성 확인</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            14개 핵심 항목 사전 점검 결과
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            등록된 문서로부터 14개 필수 항목의 유효성을 사전 분석했습니다. 상충
            항목을 확정하고 추가 질문을 확인하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-2xs ${
              isNeedsConfirm
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : isWarning
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-[#DEF7EC] text-[#03543F] border border-emerald-200'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            {isNeedsConfirm
              ? '담당자 확인 필요'
              : isWarning
                ? '주의 사항 검토'
                : '14개 항목 정합성 확인 완료'}
          </span>
        </div>
      </div>

      {/* 2단 메인 레이아웃 (좌측 상충 해결 & 질문 - 우측 체크리스트 및 액션) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: 상충 해결 & 질문 영역 (7.5 cols) */}
        <div className="space-y-5 lg:col-span-7">
          {/* 상충 항목 (Conflicts Resolution) */}
          {conflictList.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <div className="rounded-lg bg-amber-100 p-1 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <span>
                    문서 간 데이터 상충 항목 ({conflictList.length}건)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-800">
                  {resolvedConflictsCount} / {conflictList.length}건 확정됨
                </span>
              </div>
              <p className="mt-2.5 text-xs text-amber-800 leading-relaxed">
                복수 문서에서 동일 항목의 기재 내용이 다릅니다. 초안에 반영할
                기준 값을 선택하거나 직접 입력하세요.
              </p>

              <div className="mt-4 space-y-3.5">
                {conflictList.map((conflict, idx) => {
                  const currentAnswer = answers[conflict.key]
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-amber-200/90 bg-white p-4 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {conflict.field_name || conflict.key}
                        </span>
                        {currentAnswer && (
                          <span className="flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-[#007A78]">
                            <Check className="h-3 w-3" /> 선택 완료
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-slate-600 leading-relaxed">
                        {conflict.description}
                      </p>

                      {conflict.candidates &&
                        conflict.candidates.length > 0 && (
                          <div className="mt-3">
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                              반영할 기준 선택:
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {conflict.candidates.map((cand, cIdx) => {
                                const isSelected = currentAnswer === cand
                                return (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() =>
                                      handleSelectCandidate(conflict.key, cand)
                                    }
                                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                                      isSelected
                                        ? 'border-[#007A78] bg-[#E6F4F1] text-[#007A78] ring-1 ring-[#007A78] shadow-2xs'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                    <span>{cand}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 확인 질문 리스트 (Questions) */}
          {questionList.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <div className="rounded-lg bg-[#E6F4F1] p-1 text-[#007A78]">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <span>
                    초안 정확도 향상을 위한 추가 확인 ({questionList.length}건)
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  선택 사항
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                추가 질문에 답변하거나 후보를 선택하시면 해당 내용이 초안 본문에
                더욱 정교하게 반영됩니다.
              </p>

              <div className="mt-4 space-y-3.5">
                {questionList.map((q) => {
                  const currentAnswer = answers[q.question_id]
                  return (
                    <div
                      key={q.question_id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-slate-900 leading-relaxed">
                          Q. {q.question}
                        </p>
                        <span className="shrink-0 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {q.field}
                        </span>
                      </div>

                      {q.candidates && q.candidates.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {q.candidates.map((cand, idx) => {
                            const isSelected = currentAnswer === cand
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  handleSelectCandidate(q.question_id, cand)
                                }
                                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                                  isSelected
                                    ? 'border-[#007A78] bg-[#E6F4F1] font-bold text-[#007A78] ring-1 ring-[#007A78]'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                                <span>{cand}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <input
                        type="text"
                        value={currentAnswer || ''}
                        onChange={(e) =>
                          handleAnswerInput(q.question_id, e.target.value)
                        }
                        placeholder="직접 답변을 입력하거나 위 후보를 클릭하세요"
                        className="mt-2.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#007A78] focus:ring-1 focus:ring-[#007A78] focus:outline-hidden"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 14개 항목 사전 점검 상세 아코디언/표 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#E6F4F1] p-1 text-[#007A78]">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  14개 항목 점검 상태 목록
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-[11px] font-medium text-slate-600 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      filterType === 'all'
                        ? 'bg-white font-bold text-[#007A78] shadow-2xs'
                        : ''
                    }`}
                  >
                    전체
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('issue')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      filterType === 'issue'
                        ? 'bg-white font-bold text-amber-700 shadow-2xs'
                        : ''
                    }`}
                  >
                    확인 필요
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('passed')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      filterType === 'passed'
                        ? 'bg-white font-bold text-emerald-700 shadow-2xs'
                        : ''
                    }`}
                  >
                    정상
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChecklistCollapsed((prev) => !prev)}
                  className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:text-slate-600"
                >
                  {isChecklistCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {!isChecklistCollapsed && (
              <div className="mt-3 divide-y divide-slate-100">
                {filteredFields.map((field) => {
                  const isMissing =
                    missingList.includes(field.label) ||
                    missingList.includes(field.key)
                  const isConflict = conflictList.some(
                    (c) => c.key === field.key,
                  )

                  return (
                    <div
                      key={field.key}
                      className="flex items-center justify-between py-2.5 text-xs hover:bg-slate-50/60 px-1 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-500">
                          {field.category}
                        </span>
                        <span className="font-medium text-slate-800">
                          {field.label}
                        </span>
                      </div>
                      <div>
                        {isConflict ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                            상충 데이터 검토
                          </span>
                        ) : isMissing ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                            자료 없음 (기본값)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-[#DEF7EC] px-2.5 py-0.5 text-[11px] font-bold text-[#03543F]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            근거 확인됨
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 사전 점검 요약 & 초안 생성 액션 (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          <div className="sticky top-20 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                사전 점검 종합 요약
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                14개 항목 중 충실도와 확인 상태를 종합했습니다.
              </p>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#F0FDFA] border border-teal-200/80 p-3 text-center">
                <span className="text-[11px] font-semibold text-[#007A78] block">
                  정상 확인
                </span>
                <span className="text-lg font-extrabold text-[#007A78]">
                  {14 - missingList.length - conflictList.length}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  / 14 항목
                </span>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-center">
                <span className="text-[11px] font-semibold text-amber-800 block">
                  상충 발견
                </span>
                <span className="text-lg font-extrabold text-amber-700">
                  {conflictList.length}
                </span>
                <span className="text-[10px] text-slate-400 block">건</span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  확인 질문
                </span>
                <span className="text-lg font-extrabold text-slate-800">
                  {questionList.length}
                </span>
                <span className="text-[10px] text-slate-400 block">건</span>
              </div>
            </div>

            {/* AI 그라운딩 안내 */}
            <div className="rounded-xl bg-[#EFF6FF] border border-blue-200/70 p-3.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-[#1D4ED8]">
                <Info className="h-4 w-4" />
                <span>13개 본문 섹션 초안 작성 준비</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed">
                확인된 근거와 답변을 기반으로 AI가 13개 본문 섹션(회사 개요,
                주요 사업, 핵심 기술, 생산 공정, 납기 보증 등)의 초안을
                작성합니다.
              </p>
            </div>

            {/* 액션 버튼 그룹 */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => onConfirmAndDraft(answers)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] py-3 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? (
                  <span>초안 생성 중...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>점검 확인 완료 및 13개 섹션 초안 만들기</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onBackToUpload}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>이전 (자료 업로드 및 선택으로 돌아가기)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
