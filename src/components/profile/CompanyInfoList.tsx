import type { CompanyInfo } from '../../types/profile'
import {
  FIELD_LABELS,
  FIELD_ORDER,
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
} from '../../constants/profileLabels'

interface CompanyInfoListProps {
  companyInfo: CompanyInfo
}

export function CompanyInfoList({ companyInfo }: CompanyInfoListProps) {
  return (
    <div>
      {FIELD_ORDER.map((key) => {
        const field = companyInfo[key]
        if (!field) return null

        return (
          <div key={key} className="mb-2.5">
            <span className="text-[13px] font-bold">{FIELD_LABELS[key]}</span>
            <span
              className={`ml-1.5 rounded px-1.5 py-0.5 text-[11px] ${STATUS_BADGE_CLASS[field.status]}`}
            >
              {STATUS_LABELS[field.status] ?? field.status}
            </span>
            {field.facts.length === 0 ? (
              <div className="text-[13px] text-gray-600">자료 없음</div>
            ) : (
              <ul className="mt-1 list-disc pl-[18px] text-[13px]">
                {field.facts.map((fact) => (
                  <li key={fact.fact_id}>{fact.text}</li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
