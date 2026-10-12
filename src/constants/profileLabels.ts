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

// Evidence guidance only: this must not change a fact's status or exclusion rights.
export function factSupplementGuidance(field: string, status: string, canExclude: boolean): string {
  const examples: Record<string, string> = {
    company_name: '대상 회사명과 사업자·법인 식별 정보가 함께 적힌 회사 공식 자료',
    history: '사건 내용과 발생 연도가 함께 적힌 연혁 자료',
    certifications: '인증명·발급기관·인증 대상·유효기간이 표시된 인증서 또는 공식 조회 자료',
    technology: '기술명과 성능 수치의 단위·시험 기준·적용 조건이 함께 적힌 기술 자료',
    process_count: '공정 이름과 집계 기준을 확인할 수 있는 공정 목록',
    processes: '공정명과 설명이 적힌 공정 소개 자료',
    lead_time: '납기 기간과 수량·제품·거래 조건이 함께 적힌 자료',
    capabilities: '설비·생산 능력의 수치, 단위와 적용 조건이 적힌 자료',
  }
  const label = FIELD_LABELS[field as CompanyInfoKey] || '해당 내용'
  const evidence = examples[field] || `${label}을 확인할 수 있는 회사 공식 설명·실적 자료`
  const comparison = status === 'conflict'
    ? '후보별 원문의 작성 시점과 적용 대상을 비교하세요. 맞는 내용을 확인할 수 있는 자료를 추가하고, 잘못 선택한 자료는 선택을 해제하세요. '
    : status === 'missing' ? '선택한 자료에서 이 항목을 찾지 못했습니다. ' : ''
  const exclusion = canExclude
    ? '이번 문서에 필요 없는 내용이면 ‘이 항목 제외’를 선택할 수 있습니다.'
    : '이 항목은 현재 제외할 수 없습니다. 근거를 보완해야 합니다.'
  return `${comparison}보완 자료 예시: ${evidence}. 글자를 읽을 수 있는 파일을 첨부·선택한 뒤 AI 자료 점검을 다시 실행하세요. ${exclusion}`
}

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
    '회사명이 실제 문서 블록에 없습니다(사실 참조만으로는 통과하지 않습니다).',
    '회사명 표기 또는 근거 연결을 확인해 주세요. 회사명이 적혀 있어도 자료 점검에서 미확인으로 남아 있거나 해당 문구에 회사명 근거가 연결되지 않으면 통과하지 않습니다. 자료 점검의 회사명 항목부터 확인해 주세요.',
  )
  result = result.replace(
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
  result = result.replace(
    /(.+?)은\(는\) 이미지만 있어 사실 근거로 쓰지 않았습니다\./g,
    '$1 파일은 이미지 자료로 인식되어 초안의 사진·도식으로 정상 활용됩니다 (텍스트 사실 추출 대상 제외).',
  )
  return result
}

// Older saved issues combine explanation, source excerpts and action in one string.
// Split only the known line markers; preserve all other messages as the reason.
export function issueMessageParts(message: string) {
  const readable = readableIssueMessage(message)
  const evidenceAt = readable.indexOf('\n원문:')
  const actionAt = readable.lastIndexOf('\n권장 조치:')
  const starts = [evidenceAt, actionAt].filter((index) => index >= 0)
  return {
    reason: readable
      .slice(0, starts.length ? Math.min(...starts) : undefined)
      .trim(),
    evidence:
      evidenceAt >= 0
        ? readable
            .slice(
              evidenceAt + '\n원문:'.length,
              actionAt > evidenceAt ? actionAt : undefined,
            )
            .trim()
        : '',
    action:
      actionAt >= 0
        ? readable
            .slice(
              actionAt + '\n권장 조치:'.length,
              evidenceAt > actionAt ? evidenceAt : undefined,
            )
            .trim()
        : '',
  }
}
