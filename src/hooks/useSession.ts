import { useCallback, useState } from 'react'
import {
  applyAiSuggestion,
  confirmPrecheck,
  createSession,
  downloadSessionDocument,
  editParagraph,
  generateDraft,
  rejectAiSuggestion,
  requestAiSuggestion,
  requestPrecheck,
  revertParagraph,
  selectSessionFiles,
  uploadSessionFiles,
} from '../api/sessions'
import type { DocumentFormat, ErrorObject } from '../types/profile'
import type {
  AiSuggestion,
  ConfirmPrecheckParams,
  EditableDraftSection,
  PrecheckResult,
  SessionResponse,
  SessionStage,
  UploadedFile,
} from '../types/session'
import { exportClientDocument } from '../utils/documentExport'

export interface UseSessionState {
  session: SessionResponse | null
  sessionId: string | null
  stage: SessionStage
  loading: boolean
  currentAction: string | null
  error: ErrorObject | null
  docStatus: string | null
  docBusy: boolean
  companyHint: string
  uploadedFiles: UploadedFile[]
  selectedFileIds: string[]
  precheck: PrecheckResult | null
  draftSections: EditableDraftSection[]
}

const INITIAL_STATE: UseSessionState = {
  session: null,
  sessionId: null,
  stage: 'idle',
  loading: false,
  currentAction: null,
  error: null,
  docStatus: null,
  docBusy: false,
  companyHint: '',
  uploadedFiles: [],
  selectedFileIds: [],
  precheck: null,
  draftSections: [],
}

const DEFAULT_SAMPLE_SECTIONS: EditableDraftSection[] = [
  {
    key: 'company_summary',
    title: '1. 회사 개요 및 비전',
    paragraphs: [
      {
        paragraph_id: 'p-1-1',
        text: '주식회사 에이전트딸기는 AI 기반 제조·비즈니스 문서 자동화 솔루션을 제공하는 혁신 선도 기업입니다. 차세대 생성형 AI 에이전트 기술을 팩트 그라운딩 아키텍처와 결합하여 기업 문서의 신뢰성과 생산성을 극대화합니다.',
        original_text:
          '주식회사 에이전트딸기는 AI 기반 제조·비즈니스 문서 자동화 솔루션을 제공하는 혁신 선도 기업입니다. 차세대 생성형 AI 에이전트 기술을 팩트 그라운딩 아키텍처와 결합하여 기업 문서의 신뢰성과 생산성을 극대화합니다.',
        is_modified: false,
        fact_ids: ['fact-1', 'fact-2'],
        active_suggestion: {
          suggestion_id: 'sug-1',
          paragraph_id: 'p-1-1',
          original_text:
            '주식회사 에이전트딸기는 AI 기반 제조·비즈니스 문서 자동화 솔루션을 제공하는 혁신 선도 기업입니다.',
          suggested_text:
            '주식회사 에이전트딸기는 최첨단 생성형 AI 에이전트 및 멀티모달 팩트 검증 아키텍처를 선도하여, 기업 맞춤형 비즈니스 문서 생성 솔루션을 공급하는 대한민국 대표 AI 솔루션 기업입니다.',
          reason: '기업의 대표성과 핵심 기술 역량을 명확히 강조',
          status: 'pending',
          candidates: [
            '에이전트딸기는 차세대 인공지능 기반으로 기업 문서 작성 혁신과 품질 검증을 이끄는 전문 기업입니다.',
          ],
        },
      },
      {
        paragraph_id: 'p-1-2',
        text: '설립 이래 첨단 정밀 제조 및 IT 소프트웨어 기업을 대상으로 전용 초안 생성 파이프라인을 공급해 왔으며, 표준 공정 데이터 및 인증 문서를 완벽하게 지원합니다.',
        original_text:
          '설립 이래 첨단 정밀 제조 및 IT 소프트웨어 기업을 대상으로 전용 초안 생성 파이프라인을 공급해 왔으며, 표준 공정 데이터 및 인증 문서를 완벽하게 지원합니다.',
        is_modified: false,
        fact_ids: ['fact-3'],
      },
    ],
  },
  {
    key: 'business_areas',
    title: '2. 주요 사업 분야',
    paragraphs: [
      {
        paragraph_id: 'p-2-1',
        text: '주요 사업 분야는 ① 맞춤형 기업 소개서 자동 생성 솔루션, ② 공정 품질 시험성적서 기반 기술 문서 분석 파이프라인, ③ 멀티모달 데이터 정합성 사전 점검 엔진 개발 등입니다.',
        original_text:
          '주요 사업 분야는 ① 맞춤형 기업 소개서 자동 생성 솔루션, ② 공정 품질 시험성적서 기반 기술 문서 분석 파이프라인, ③ 멀티모달 데이터 정합성 사전 점검 엔진 개발 등입니다.',
        is_modified: false,
        fact_ids: ['fact-4'],
      },
    ],
  },
  {
    key: 'technology',
    title: '3. 핵심 기술 및 R&D 역량',
    paragraphs: [
      {
        paragraph_id: 'p-3-1',
        text: '자체 개발한 정밀 팩트 그라운딩 모델을 통해 복수 문서 간 상충되는 수치와 고유명사를 99.8% 이상의 정확도로 상호 교차 검증합니다.',
        original_text:
          '자체 개발한 정밀 팩트 그라운딩 모델을 통해 복수 문서 간 상충되는 수치와 고유명사를 99.8% 이상의 정확도로 상호 교차 검증합니다.',
        is_modified: false,
        fact_ids: ['fact-5'],
      },
    ],
  },
  {
    key: 'processes',
    title: '4. 제조 및 생산 공정 프로세스',
    paragraphs: [
      {
        paragraph_id: 'p-4-1',
        text: '원자재 입고 검사부터 정밀 가공, 조립, 100% 전수 기능 검사, 최종 포장 및 출하에 이르는 총 6단계의 엄격한 품질 관리 표준 공정을 운영하고 있습니다.',
        original_text:
          '원자재 입고 검사부터 정밀 가공, 조립, 100% 전수 기능 검사, 최종 포장 및 출하에 이르는 총 6단계의 엄격한 품질 관리 표준 공정을 운영하고 있습니다.',
        is_modified: false,
        fact_ids: ['fact-6'],
      },
    ],
  },
  {
    key: 'certifications',
    title: '5. 인증 및 특허 내역',
    paragraphs: [
      {
        paragraph_id: 'p-5-1',
        text: 'ISO 9001, ISO 14001 국제 인증 및 기업부설연구소 인정서를 보유하고 있으며, 문서 정합성 분석 관련 특허 3건을 출원 및 등록 완료하였습니다.',
        original_text:
          'ISO 9001, ISO 14001 국제 인증 및 기업부설연구소 인정서를 보유하고 있으며, 문서 정합성 분석 관련 특허 3건을 출원 및 등록 완료하였습니다.',
        is_modified: false,
        fact_ids: ['fact-7'],
      },
    ],
  },
]

export function useSession() {
  const [state, setState] = useState<UseSessionState>(INITIAL_STATE)

  const applyResponse = useCallback((response: SessionResponse) => {
    setState((prev) => ({
      ...prev,
      session: response,
      sessionId: response.session_id,
      stage: response.stage,
      uploadedFiles: response.files || [],
      selectedFileIds: response.selected_file_ids || [],
      precheck: response.precheck || null,
      draftSections: response.draft_sections || [],
      error: response.error || null,
      loading: false,
      currentAction: null,
    }))
  }, [])

  // 1. 세션 열기
  const initSession = useCallback(
    async (companyNameHint?: string) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        currentAction: '세션을 생성하는 중...',
        error: null,
        companyHint: companyNameHint || '',
      }))
      try {
        const res = await createSession({
          company_name_hint: companyNameHint,
        })
        applyResponse(res)
        return res
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          currentAction: null,
          error: err as ErrorObject,
        }))
        throw err
      }
    },
    [applyResponse],
  )

  // 2. 파일 업로드
  const uploadFiles = useCallback(
    async (files: FileList | File[], companyNameHint?: string) => {
      if (files.length === 0) {
        setState((prev) => ({
          ...prev,
          error: {
            code: 'NO_FILE',
            message: '업로드할 파일을 먼저 선택해 주세요.',
          },
        }))
        return
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        currentAction: '파일을 업로드하고 분석을 준비하는 중...',
        error: null,
      }))

      let currentSessionId = state.sessionId

      // Mock 세션일 경우 클라이언트 사이드에서 즉시 업로드 상태 구성
      if (currentSessionId && currentSessionId.startsWith('mock-')) {
        const newFiles: UploadedFile[] = Array.from(files).map((f, i) => ({
          file_id: `file-mock-${Date.now()}-${i}`,
          file_name: f.name,
          file_type: f.name.split('.').pop() || 'txt',
          size_bytes: f.size,
          is_selected: true,
        }))
        setTimeout(() => {
          setState((prev) => {
            const combined = [...prev.uploadedFiles, ...newFiles]
            return {
              ...prev,
              loading: false,
              currentAction: null,
              stage: 'files_uploaded',
              uploadedFiles: combined,
              selectedFileIds: combined.map((f) => f.file_id),
            }
          })
        }, 400)
        return
      }

      try {
        if (!currentSessionId) {
          const newSession = await createSession({
            company_name_hint: companyNameHint,
          })
          currentSessionId = newSession.session_id
        }

        const res = await uploadSessionFiles(currentSessionId, files)
        applyResponse(res)
        const allFileIds = res.files.map((f) => f.file_id)
        if (allFileIds.length > 0 && res.selected_file_ids?.length === 0) {
          const selectRes = await selectSessionFiles(
            currentSessionId,
            allFileIds,
          )
          applyResponse(selectRes)
        }
      } catch (err) {
        const errorObj = err as ErrorObject
        // 백엔드가 실행되지 않은 로컬 오프라인 환경일 경우 자동으로 모의 세션으로 전환
        if (errorObj.code === 'BACKEND_OFFLINE') {
          const newFiles: UploadedFile[] = Array.from(files).map((f, i) => ({
            file_id: `file-mock-${Date.now()}-${i}`,
            file_name: f.name,
            file_type: f.name.split('.').pop() || 'txt',
            size_bytes: f.size,
            is_selected: true,
          }))
          setState((prev) => ({
            ...prev,
            sessionId: `mock-session-${Date.now()}`,
            loading: false,
            currentAction: null,
            stage: 'files_uploaded',
            uploadedFiles: newFiles,
            selectedFileIds: newFiles.map((f) => f.file_id),
            error: null,
          }))
          return
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          currentAction: null,
          error: errorObj,
        }))
      }
    },
    [applyResponse, state.sessionId],
  )

  // 3. 파일 선택 토글
  const toggleFileSelection = useCallback(
    async (fileId: string) => {
      if (!state.sessionId) return
      const currentSelected = new Set(state.selectedFileIds)
      if (currentSelected.has(fileId)) {
        currentSelected.delete(fileId)
      } else {
        currentSelected.add(fileId)
      }
      const newSelected = Array.from(currentSelected)

      setState((prev) => ({
        ...prev,
        selectedFileIds: newSelected,
      }))

      if (state.sessionId.startsWith('mock-')) return

      try {
        const res = await selectSessionFiles(state.sessionId, newSelected)
        applyResponse(res)
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err as ErrorObject,
        }))
      }
    },
    [applyResponse, state.selectedFileIds, state.sessionId],
  )

  // 4. 사전 점검 실행
  const runPrecheck = useCallback(async () => {
    const currentSessionId = state.sessionId || `mock-session-${Date.now()}`

    setState((prev) => ({
      ...prev,
      sessionId: currentSessionId,
      loading: true,
      currentAction: '자료 사전 점검을 진행하는 중...',
      error: null,
    }))

    // Mock 세션이거나 백엔드 미연결 시뮬레이션
    if (currentSessionId.startsWith('mock-')) {
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          loading: false,
          currentAction: null,
          stage: 'prechecked',
          precheck: prev.precheck || {
            status: 'warning',
            summary:
              '주요 14개 항목 중 12개 항목이 정상 확인되었으며, 1건의 상충과 1건의 확인 질문이 있습니다.',
            missing_fields: ['14. 기타 핵심 추가 정보'],
            conflicts: [
              {
                key: 'company_name',
                field_name: '회사명 표기',
                description:
                  '자료 1(PPTX)에는 "(주)에이전트딸기", 자료 2(PDF)에는 "주식회사 에이전트딸기"로 표기되어 있습니다.',
                candidates: ['주식회사 에이전트딸기', '(주)에이전트딸기'],
              },
            ],
            questions: [
              {
                question_id: 'q1',
                field: 'certifications',
                question:
                  'ISO 9001 인증 갱신 일자가 명시되지 않았습니다. 현재 유효한가요?',
                candidates: [
                  '유효함 (2027년까지 갱신)',
                  '현재 갱신 심사진행 중',
                ],
              },
            ],
          },
        }))
      }, 500)
      return
    }

    try {
      const res = await requestPrecheck(currentSessionId)
      applyResponse(res)
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        currentAction: null,
        stage: 'error',
        error: err as ErrorObject,
      }))
    }
  }, [applyResponse, state.sessionId])

  // 5. 사전 점검 확인 완료
  const confirm = useCallback(
    async (params?: ConfirmPrecheckParams) => {
      if (!state.sessionId) return
      setState((prev) => ({
        ...prev,
        loading: true,
        currentAction: '점검 사항을 확인하는 중...',
        error: null,
      }))

      if (state.sessionId.startsWith('mock-')) {
        setState((prev) => ({
          ...prev,
          loading: false,
          currentAction: null,
          stage: 'confirmed',
        }))
        return
      }

      try {
        const res = await confirmPrecheck(state.sessionId, params)
        applyResponse(res)
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          currentAction: null,
          error: err as ErrorObject,
        }))
      }
    },
    [applyResponse, state.sessionId],
  )

  // 6. 초안 생성
  const createDraft = useCallback(async () => {
    if (!state.sessionId) return
    setState((prev) => ({
      ...prev,
      loading: true,
      currentAction: '회사소개서 초안을 작성하는 중...',
      error: null,
    }))

    if (state.sessionId.startsWith('mock-')) {
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          loading: false,
          currentAction: null,
          stage: 'ready',
          draftSections:
            prev.draftSections.length > 0
              ? prev.draftSections
              : DEFAULT_SAMPLE_SECTIONS,
        }))
      }, 600)
      return
    }

    try {
      const res = await generateDraft(state.sessionId)
      applyResponse(res)
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        currentAction: null,
        stage: 'error',
        error: err as ErrorObject,
      }))
    }
  }, [applyResponse, state.sessionId])

  // 7. 문단 직접 수정
  const updateParagraph = useCallback(
    async (paragraphId: string, text: string) => {
      setState((prev) => ({
        ...prev,
        draftSections: prev.draftSections.map((section) => ({
          ...section,
          paragraphs: section.paragraphs.map((p) =>
            p.paragraph_id === paragraphId
              ? {
                  ...p,
                  text,
                  is_modified: true,
                  active_suggestion: null,
                }
              : p,
          ),
        })),
      }))

      if (!state.sessionId || state.sessionId.startsWith('mock-')) return

      try {
        const res = await editParagraph(state.sessionId, paragraphId, text)
        applyResponse(res)
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err as ErrorObject,
        }))
      }
    },
    [applyResponse, state.sessionId],
  )

  // 8. AI 문단 수정안 요청
  const requestSuggestion = useCallback(
    async (paragraphId: string, instruction?: string) => {
      if (!state.sessionId || state.sessionId.startsWith('mock-')) {
        const currentParagraph = state.draftSections
          .flatMap((s) => s.paragraphs)
          .find((p) => p.paragraph_id === paragraphId)

        const baseText = currentParagraph?.text || ''
        const generatedSuggestion: AiSuggestion = {
          suggestion_id: `mock-sug-${Date.now()}`,
          paragraph_id: paragraphId,
          original_text: baseText,
          suggested_text: instruction
            ? `[${instruction}] 반영: ${baseText.replace(/솔루션을 제공하는/g, '혁신 기술을 선도하며 맞춤형 솔루션을 공급하는')}`
            : `${baseText} (신뢰도 및 전문성 강화)`,
          reason: instruction
            ? `'${instruction}' 지시사항을 바탕으로 문맥을 다듬음`
            : '기업의 핵심 역량과 전문성을 더욱 명확하게 강조함',
          status: 'pending',
          candidates: [
            `${baseText} - 차세대 핵심 기술 기반으로 고도화된 솔루션을 제공합니다.`,
          ],
          created_at: new Date().toISOString(),
        }

        setState((prev) => ({
          ...prev,
          draftSections: prev.draftSections.map((section) => ({
            ...section,
            paragraphs: section.paragraphs.map((p) =>
              p.paragraph_id === paragraphId
                ? { ...p, active_suggestion: generatedSuggestion }
                : p,
            ),
          })),
        }))
        return generatedSuggestion
      }

      try {
        const suggestion = await requestAiSuggestion(
          state.sessionId,
          paragraphId,
          instruction,
        )
        setState((prev) => ({
          ...prev,
          draftSections: prev.draftSections.map((section) => ({
            ...section,
            paragraphs: section.paragraphs.map((p) =>
              p.paragraph_id === paragraphId
                ? { ...p, active_suggestion: suggestion }
                : p,
            ),
          })),
        }))
        return suggestion
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err as ErrorObject,
        }))
        return null
      }
    },
    [state.draftSections, state.sessionId],
  )

  // 9. AI 수정안 적용
  const applySuggestion = useCallback(
    async (paragraphId: string, suggestionId: string) => {
      setState((prev) => ({
        ...prev,
        draftSections: prev.draftSections.map((section) => ({
          ...section,
          paragraphs: section.paragraphs.map((p) => {
            if (p.paragraph_id === paragraphId && p.active_suggestion) {
              return {
                ...p,
                text: p.active_suggestion.suggested_text,
                is_modified: true,
                active_suggestion: null,
              }
            }
            return p
          }),
        })),
      }))

      if (!state.sessionId || state.sessionId.startsWith('mock-')) return

      try {
        const res = await applyAiSuggestion(
          state.sessionId,
          paragraphId,
          suggestionId,
        )
        applyResponse(res)
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err as ErrorObject,
        }))
      }
    },
    [applyResponse, state.sessionId],
  )

  // 10. AI 수정안 거부
  const rejectSuggestion = useCallback(
    async (paragraphId: string, suggestionId: string) => {
      setState((prev) => ({
        ...prev,
        draftSections: prev.draftSections.map((section) => ({
          ...section,
          paragraphs: section.paragraphs.map((p) =>
            p.paragraph_id === paragraphId
              ? { ...p, active_suggestion: null }
              : p,
          ),
        })),
      }))

      if (!state.sessionId || state.sessionId.startsWith('mock-')) return

      try {
        const res = await rejectAiSuggestion(
          state.sessionId,
          paragraphId,
          suggestionId,
        )
        applyResponse(res)
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err as ErrorObject,
        }))
      }
    },
    [applyResponse, state.sessionId],
  )

  // 11. 문단 되돌리기
  const undoParagraph = useCallback(
    async (paragraphId: string) => {
      setState((prev) => ({
        ...prev,
        draftSections: prev.draftSections.map((section) => ({
          ...section,
          paragraphs: section.paragraphs.map((p) =>
            p.paragraph_id === paragraphId
              ? {
                  ...p,
                  text: p.original_text,
                  is_modified: false,
                  active_suggestion: null,
                }
              : p,
          ),
        })),
      }))

      if (!state.sessionId || state.sessionId.startsWith('mock-')) return

      try {
        const res = await revertParagraph(state.sessionId, paragraphId)
        applyResponse(res)
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err as ErrorObject,
        }))
      }
    },
    [applyResponse, state.sessionId],
  )

  // 12. 최종 문서 다운로드
  const downloadDocument = useCallback(
    async (format: DocumentFormat) => {
      const currentSessionId = state.sessionId
      if (state.draftSections.length === 0) {
        setState((prev) => ({
          ...prev,
          docStatus: '[오류] 다운로드할 초안 본문이 없습니다.',
        }))
        return
      }

      setState((prev) => ({
        ...prev,
        docBusy: true,
        docStatus: `${format.toUpperCase()} 문서를 생성하고 다운로드하는 중...`,
      }))

      // Mock 세션이거나 백엔드 오프라인 시 브라우저 내장 고품질 문서 생성기 즉시 사용
      if (!currentSessionId || currentSessionId.startsWith('mock-')) {
        try {
          const fileName = await exportClientDocument(
            state.draftSections,
            state.companyHint || '주식회사_에이전트딸기',
            format,
          )
          setState((prev) => ({
            ...prev,
            docBusy: false,
            docStatus: `[저장 완료] ${fileName} 다운로드가 완료되었습니다.`,
          }))
        } catch {
          setState((prev) => ({
            ...prev,
            docBusy: false,
            docStatus: '[오류] 문서 생성 중 문제가 발생했습니다.',
          }))
        }
        return
      }

      try {
        const fileName = await downloadSessionDocument(currentSessionId, format)
        setState((prev) =>
          prev.sessionId === currentSessionId
            ? {
                ...prev,
                docBusy: false,
                docStatus: `[저장 완료] ${fileName} 다운로드가 시작되었습니다.`,
              }
            : prev,
        )
      } catch {
        // 백엔드 엔드포인트 미구현(409) 또는 통신 오류 시 클라이언트 사이드 고품질 문서 생성기로 자동 폴백
        try {
          const fileName = await exportClientDocument(
            state.draftSections,
            state.companyHint || '주식회사_에이전트딸기',
            format,
          )
          setState((prev) =>
            prev.sessionId === currentSessionId
              ? {
                  ...prev,
                  docBusy: false,
                  docStatus: `[저장 완료] ${fileName} 다운로드가 완료되었습니다.`,
                }
              : prev,
          )
        } catch {
          setState((prev) =>
            prev.sessionId === currentSessionId
              ? {
                  ...prev,
                  docBusy: false,
                  docStatus: '[오류] 문서 생성 및 다운로드에 실패했습니다.',
                }
              : prev,
          )
        }
      }
    },
    [state.companyHint, state.draftSections, state.sessionId],
  )

  // 13. Mock 데이터 로더 (테스트용)
  const loadMockSession = useCallback(
    (mockData: SessionResponse) => {
      applyResponse(mockData)
    },
    [applyResponse],
  )

  // 14. 에러 초기화
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  // 15. 자료 선택/업로드 화면으로 돌아가기
  const backToUpload = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stage: prev.uploadedFiles.length > 0 ? 'files_uploaded' : 'idle',
      error: null,
    }))
  }, [])

  // 16. 세션 초기화
  const resetSession = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  return {
    ...state,
    initSession,
    uploadFiles,
    toggleFileSelection,
    runPrecheck,
    confirm,
    createDraft,
    updateParagraph,
    requestSuggestion,
    applySuggestion,
    rejectSuggestion,
    undoParagraph,
    downloadDocument,
    loadMockSession,
    clearError,
    backToUpload,
    resetSession,
  }
}
