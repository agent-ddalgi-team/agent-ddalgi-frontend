import type { ChangeEvent } from 'react'
import { Section } from './Section'

interface GeneratePanelProps {
  companyHint: string
  onCompanyHintChange: (value: string) => void
  onGenerate: () => void
  generating: boolean
}

export function GeneratePanel({
  companyHint,
  onCompanyHintChange,
  onGenerate,
  generating,
}: GeneratePanelProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onCompanyHintChange(event.target.value)
  }

  return (
    <Section title="2. 회사명 힌트 및 생성">
      <label
        htmlFor="companyHint"
        className="mb-1.5 block text-[13px] text-gray-600"
      >
        회사명 힌트 (선택)
      </label>
      <input
        id="companyHint"
        type="text"
        placeholder="예: 테스트 회사"
        value={companyHint}
        onChange={handleChange}
        className="w-full rounded border border-gray-300 p-2 text-sm"
      />
      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="mt-3 rounded bg-blue-600 px-4 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        회사소개서 생성
      </button>
    </Section>
  )
}
