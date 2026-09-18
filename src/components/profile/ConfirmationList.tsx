import type { ConfirmationQuestion } from '../../types/profile'
import { FIELD_LABELS } from '../../constants/profileLabels'

interface ConfirmationListProps {
  needsConfirmation: ConfirmationQuestion[]
}

export function ConfirmationList({ needsConfirmation }: ConfirmationListProps) {
  if (needsConfirmation.length === 0) {
    return (
      <p className="text-[13px] text-gray-600">
        확인이 필요한 항목이 없습니다.
      </p>
    )
  }

  return (
    <ul className="list-disc pl-[18px] text-[13px]">
      {needsConfirmation.map((item, index) => (
        <li key={index}>
          [{FIELD_LABELS[item.field] ?? item.field}] {item.question}
        </li>
      ))}
    </ul>
  )
}
