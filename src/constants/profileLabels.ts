import type { CompanyInfoKey, FieldStatus } from '../types/profile'

// contracts/contract.md 8절 표와 동일해야 한다.
export const FIELD_LABELS: Record<CompanyInfoKey, string> = {
  company_name: '회사명',
  company_summary: '회사 개요',
  business_areas: '사업 분야',
  products_services: '제품·서비스',
  technology: '기술',
  strengths: '강점',
  customers_markets: '고객·시장',
  certifications: '인증·승인·특허',
  history: '연혁',
  processes: '공정 목록',
  process_count: '공정 수',
  capabilities: '대응 범위',
  lead_time: '납기',
  other_info: '기타 핵심 정보',
}

export const FIELD_ORDER = Object.keys(FIELD_LABELS) as CompanyInfoKey[]

export const STATUS_LABELS: Record<FieldStatus, string> = {
  supported: '근거 있음',
  conflict: '상충',
  needs_confirmation: '확인 필요',
  not_found: '자료 없음',
}

export const STATUS_BADGE_CLASS: Record<FieldStatus, string> = {
  supported: 'bg-green-100 text-green-800',
  conflict: 'bg-red-100 text-red-800',
  needs_confirmation: 'bg-yellow-100 text-yellow-800',
  not_found: 'bg-slate-100 text-slate-600',
}
