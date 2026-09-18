import type { CompanyInfo, Source } from '../../types/profile'

interface SourcesPanelProps {
  sources: Source[]
  companyInfo: CompanyInfo
}

export function SourcesPanel({ sources, companyInfo }: SourcesPanelProps) {
  const sourceNameById = new Map(
    sources.map((source) => [source.source_id, source.file_name]),
  )

  const evidenceItems = Object.values(companyInfo).flatMap((field) =>
    field.facts.flatMap((fact) =>
      fact.evidence.map((evidence) => ({
        key: `${fact.fact_id}-${evidence.source_id}-${evidence.locator}`,
        fileName: sourceNameById.get(evidence.source_id) ?? evidence.source_id,
        locator: evidence.locator,
        quote: evidence.quote,
      })),
    ),
  )

  return (
    <div>
      <ul className="list-disc pl-[18px] text-[13px]">
        {sources.map((source) => (
          <li key={source.source_id}>
            {source.file_name} ({source.source_id})
          </li>
        ))}
      </ul>
      <ul className="mt-1 list-disc pl-[18px] text-[13px]">
        {evidenceItems.map((item) => (
          <li key={item.key}>
            {item.fileName} · {item.locator}: "{item.quote}"
          </li>
        ))}
      </ul>
    </div>
  )
}
