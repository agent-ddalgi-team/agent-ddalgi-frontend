import type { DraftSection } from '../../types/profile'

interface DraftSectionsViewProps {
  draftSections: DraftSection[]
}

// paragraphs 배열의 text를 순서대로 그대로 표시한다. 임의로 다시 작성하지 않는다.
export function DraftSectionsView({ draftSections }: DraftSectionsViewProps) {
  return (
    <div>
      {draftSections.map((section) => (
        <div key={section.key} className="mb-2.5">
          <div className="text-[13px] font-bold">{section.title}</div>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-[13px]">
              {paragraph.text}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}
