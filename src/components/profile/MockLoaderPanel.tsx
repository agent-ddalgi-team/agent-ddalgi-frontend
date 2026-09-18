import type { ChangeEvent } from 'react'
import type { JobResponse } from '../../types/profile'
import { Section } from './Section'

interface MockLoaderPanelProps {
  onLoad: (response: JobResponse) => void
  onParseError: (message: string) => void
}

// 서버 연결 전 시험용. fixtures/mock_job_ready.json, mock_job_error.json을 그대로 읽어
// 실제 GET 응답과 같은 형태({job_id, status, result, error})로 renderProfile 경로를 시험한다.
export function MockLoaderPanel({
  onLoad,
  onParseError,
}: MockLoaderPanelProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const response = JSON.parse(reader.result as string) as JobResponse
        onLoad(response)
      } catch (err) {
        onParseError(`JSON 형식을 읽지 못했습니다: ${(err as Error).message}`)
      }
    }
    reader.onerror = () => {
      onParseError('파일을 읽는 중 오류가 발생했습니다.')
    }
    reader.readAsText(file, 'utf-8')
    event.target.value = ''
  }

  return (
    <Section title="테스트용 Mock 결과 불러오기">
      <label
        htmlFor="mockInput"
        className="mb-1.5 block text-[13px] text-gray-600"
      >
        fixtures/mock_job_ready.json 또는 fixtures/mock_job_error.json 선택
      </label>
      <input
        id="mockInput"
        type="file"
        accept=".json"
        onChange={handleChange}
        className="w-full rounded border border-gray-300 p-2 text-sm"
      />
    </Section>
  )
}
