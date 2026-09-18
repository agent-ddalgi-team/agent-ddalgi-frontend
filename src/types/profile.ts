// contracts/profile.schema.json (schema_version 1.0) 기준 타입. 키·구조를 임의로 바꾸지 않는다.

export type FieldStatus =
  'supported' | 'conflict' | 'needs_confirmation' | 'not_found'

export interface Evidence {
  source_id: string
  locator: string
  quote: string
}

export interface Fact {
  fact_id: string
  text: string
  evidence: Evidence[]
}

export interface CompanyInfoField {
  status: FieldStatus
  facts: Fact[]
}

export type CompanyInfoKey =
  | 'company_name'
  | 'company_summary'
  | 'business_areas'
  | 'products_services'
  | 'technology'
  | 'strengths'
  | 'customers_markets'
  | 'certifications'
  | 'history'
  | 'processes'
  | 'process_count'
  | 'capabilities'
  | 'lead_time'
  | 'other_info'

export type CompanyInfo = Record<CompanyInfoKey, CompanyInfoField>

export interface Paragraph {
  text: string
  fact_ids: string[]
}

export interface DraftSection {
  key: CompanyInfoKey
  title: string
  paragraphs: Paragraph[]
}

export interface ConfirmationQuestion {
  field: CompanyInfoKey
  status: Exclude<FieldStatus, 'supported'>
  question: string
}

export interface Source {
  source_id: string
  file_name: string
  document_date: string | null
}

export interface Validation {
  schema_valid: boolean
  evidence_links_valid: boolean
  human_review_required: true
}

export interface ProfileResult {
  schema_version: '1.0'
  is_mock: boolean
  company_info: CompanyInfo
  draft_sections: DraftSection[]
  needs_confirmation: ConfirmationQuestion[]
  sources: Source[]
  validation: Validation
}

export interface ErrorObject {
  code: string
  stage?: string
  message: string
  retryable?: boolean
}

export type JobStatus =
  | 'queued'
  | 'extracting'
  | 'analyzing'
  | 'drafting'
  | 'validating'
  | 'ready'
  | 'error'

export interface JobResponse {
  job_id: string
  status: JobStatus
  result: ProfileResult | null
  error: ErrorObject | null
}

export type DocumentFormat = 'md' | 'docx'
