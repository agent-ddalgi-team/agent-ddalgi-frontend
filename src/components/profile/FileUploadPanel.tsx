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
    const rawFiles = Array.from(event.target.files ?? [])
    // [Security Hardening] 파일 검증: 확장자, 크기, 0바이트 방지, 최대 3개 제한
    const validFiles = rawFiles.filter((file) => {
      const isAllowedExt = /\.(txt|md)$/i.test(file.name)
      const hasSafeName = !file.name.includes('..') && !/[/\\]/.test(file.name)
      const isSafeSize = file.size > 0 && file.size <= 10 * 1024 * 1024
      return isAllowedExt && hasSafeName && isSafeSize
    })

    // 최대 3개까지만 전달
    onFilesChange(validFiles.slice(0, 3))
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
