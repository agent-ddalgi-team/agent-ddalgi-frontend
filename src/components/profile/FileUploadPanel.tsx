import type { ChangeEvent } from 'react'
import { Section } from './Section'

interface FileUploadPanelProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export function FileUploadPanel({
  files,
  onFilesChange,
}: FileUploadPanelProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFilesChange(Array.from(event.target.files ?? []))
  }

  return (
    <Section title="1. 자료 파일 선택">
      <label
        htmlFor="fileInput"
        className="mb-1.5 block text-[13px] text-gray-600"
      >
        TXT/MD 파일 선택 (최대 3개)
      </label>
      <input
        id="fileInput"
        type="file"
        accept=".txt,.md"
        multiple
        onChange={handleChange}
        className="w-full rounded border border-gray-300 p-2 text-sm"
      />
      {files.length === 0 ? (
        <p className="mt-2 text-[13px] text-gray-400">
          선택한 파일이 없습니다.
        </p>
      ) : (
        <ul className="mt-2 space-y-1 text-[13px]">
          {files.map((file) => (
            <li key={file.name} className="rounded bg-gray-100 px-2 py-1">
              {file.name}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
