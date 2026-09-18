import type { DocumentFormat, ProfileResult } from '../../types/profile'
import { CompanyInfoList } from './CompanyInfoList'
import { ConfirmationList } from './ConfirmationList'
import { DocumentButtons } from './DocumentButtons'
import { DraftSectionsView } from './DraftSectionsView'
import { Section } from './Section'
import { SourcesPanel } from './SourcesPanel'

interface ResultPanelProps {
  profile: ProfileResult
  docBusy: boolean
  docStatus: string | null
  onDownload: (format: DocumentFormat) => void
}

export function ResultPanel({
  profile,
  docBusy,
  docStatus,
  onDownload,
}: ResultPanelProps) {
  return (
    <Section
      title={
        <>
          4. 결과
          {profile.is_mock && (
            <span className="ml-1.5 rounded border border-amber-500 bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">
              테스트 데이터
            </span>
          )}
        </>
      }
    >
      <h3 className="mb-1.5 text-sm font-semibold">회사 정보</h3>
      <CompanyInfoList companyInfo={profile.company_info} />

      <h3 className="mb-1.5 mt-4 text-sm font-semibold">소개서 본문</h3>
      <DraftSectionsView draftSections={profile.draft_sections} />

      <h3 className="mb-1.5 mt-4 text-sm font-semibold">확인 질문</h3>
      <ConfirmationList needsConfirmation={profile.needs_confirmation} />

      <h3 className="mb-1.5 mt-4 text-sm font-semibold">근거 자료</h3>
      <SourcesPanel
        sources={profile.sources}
        companyInfo={profile.company_info}
      />

      <h3 className="mb-1.5 mt-4 text-sm font-semibold">문서 저장</h3>
      <DocumentButtons
        disabled={docBusy}
        onDownload={onDownload}
        docStatus={docStatus}
      />
    </Section>
  )
}
