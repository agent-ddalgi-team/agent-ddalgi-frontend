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

// 기존 저장 결과에도 적용한다. 문제 코드·차단 여부·해결 상태는 변경하지 않는다.
export function readableIssueMessage(message: string): string {
  let result = message.replace(
    /\b(company_name|company_summary|business_areas|products_services|technology|strengths|customers_markets|certifications|history|processes|process_count|capabilities|lead_time|other_info)\b/g,
    (key) => FIELD_LABELS[key as CompanyInfoKey] || key,
  )
  result = result.replace(
    /시연용 임시 내용이 포함되어 있습니다\([^)]*\)\./g,
    '시연용 가상 내용 또는 이미지가 포함되어 있습니다. 실제 회사 실적·제품으로 오해되지 않도록 시연 표시를 확인해 주세요.',
  )
  result = result.replace(
    /(.+?)의 의미·조건을 원문에서 추가 확인해야 합니다\./g,
    '$1을 확정해서 쓰기에는 적용 조건이나 근거가 충분하지 않습니다. 아래 사실과 근거에서 원문을 확인하고, 자료를 보완하거나 이번 문서에서 해당 내용을 제외해 주세요.',
  )
  return result
}
