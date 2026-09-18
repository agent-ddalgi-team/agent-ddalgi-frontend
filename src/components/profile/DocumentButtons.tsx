import type { DocumentFormat } from '../../types/profile'

interface DocumentButtonsProps {
  disabled: boolean
  onDownload: (format: DocumentFormat) => void
  docStatus: string | null
}

export function DocumentButtons({
  disabled,
  onDownload,
  docStatus,
}: DocumentButtonsProps) {
  return (
    <div>
      <div className="space-x-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDownload('md')}
          className="rounded bg-blue-600 px-4 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          MD 문서 저장
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDownload('docx')}
          className="rounded bg-blue-600 px-4 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          DOCX 문서 저장
        </button>
      </div>
      <div className="mt-2 min-h-[18px] whitespace-pre-wrap text-[13px] text-gray-700">
        {docStatus ?? ''}
      </div>
    </div>
  )
}
