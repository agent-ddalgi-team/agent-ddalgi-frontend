import type {
  CompanyInfo,
  CompanyInfoKey,
  ErrorObject,
  FieldStatus,
  Source,
} from './profile'

// 세션 라이프사이클 단계
export type SessionStage =
  | 'idle'
  | 'created'
  | 'files_uploaded'
  | 'files_selected'
  | 'prechecking'
  | 'prechecked'
  | 'confirmed'
  | 'drafting'
  | 'ready'
  | 'error'

// 지원 파일 확장자
export type SupportedFileType =
  'pptx' | 'pdf' | 'docx' | 'txt' | 'jpg' | 'jpeg' | 'png' | string

// 업로드된 파일 정보
export interface UploadedFile {
  file_id: string
  file_name: string
  file_type: SupportedFileType
  size_bytes: number
  is_selected?: boolean
  uploaded_at?: string
  // 임시 규칙 ⑨: 사진 필드
  photos?: Array<{
    photo_id: string
    url: string
    caption?: string
  }>
}

// 사전 점검 질문 및 확인 항목
export interface PrecheckQuestion {
  question_id: string
  field: CompanyInfoKey | string
  status?: FieldStatus
  question: string
  answer?: string
  // 임시 규칙 ⑰: 후보
  candidates?: string[]
}

export interface ConflictItem {
  key: string
  field_name: string
  description: string
  candidates?: string[]
}

// 사전 점검 결과 (임시 규칙 ⑤)
export interface PrecheckResult {
  status: 'passed' | 'warning' | 'needs_confirmation'
  summary?: string
  missing_fields?: string[]
  conflicts?: ConflictItem[]
  questions: PrecheckQuestion[]
}

// AI 수정안 / 제안 (임시 규칙 ⑯, ⑰)
export interface AiSuggestion {
  suggestion_id: string
  paragraph_id: string
  original_text: string
  suggested_text: string
  reason?: string
  status: 'pending' | 'applied' | 'rejected'
  candidates?: string[]
  created_at?: string
}

// 문단 편집 이력 (되돌리기 지원)
export interface ParagraphHistoryItem {
  text: string
  modified_at: string
  type: 'initial' | 'user_edit' | 'ai_applied' | 'revert'
}

// 편집 가능한 문단
export interface EditableParagraph {
  paragraph_id: string
  text: string
  original_text: string
  fact_ids?: string[]
  is_modified?: boolean
  active_suggestion?: AiSuggestion | null
  history?: ParagraphHistoryItem[]
}

// 13개 섹션 초안
export interface EditableDraftSection {
  section_id?: string
  key: CompanyInfoKey
  title: string
  paragraphs: EditableParagraph[]
}

// 진행 표시 (임시 규칙 ②)
export interface ProgressIndicator {
  stage: string
  percent: number
  message: string
}

// 세션 전체 응답 객체
export interface SessionResponse {
  session_id: string
  stage: SessionStage
  company_name_hint?: string
  files: UploadedFile[]
  selected_file_ids: string[]
  precheck: PrecheckResult | null
  company_info?: CompanyInfo | null
  draft_sections: EditableDraftSection[]
  sources?: Source[]
  progress?: ProgressIndicator | null
  error?: ErrorObject | null
  is_mock?: boolean
}

// 신규 세션 생성 요청 파라미터
export interface CreateSessionParams {
  company_name_hint?: string
}

// 사전 점검 확인 답변 요청
export interface ConfirmPrecheckParams {
  answers?: Record<string, string>
  resolved_conflicts?: Record<string, string>
}

// 문단 수정 요청 파라미터
export interface EditParagraphParams {
  text: string
}

// AI 문단 수정 요청 파라미터
export interface RequestAiSuggestionParams {
  instruction?: string
}
