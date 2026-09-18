import type { ErrorObject, JobStatus } from '../../types/profile'
import { Section } from './Section'

interface StatusPanelProps {
  status: JobStatus | 'idle'
  jobId: string | null
  error: ErrorObject | null
}

export function StatusPanel({ status, jobId, error }: StatusPanelProps) {
  const statusText =
    status === 'idle'
      ? ''
      : jobId
        ? `상태: ${status} (job_id: ${jobId})`
        : `상태: ${status}`

  return (
    <Section title="3. 처리 상태">
      <div className="min-h-[18px] text-[13px] text-gray-700">{statusText}</div>
      <div className="min-h-[18px] whitespace-pre-wrap text-[13px] text-red-700">
        {error ? `[${error.code}] ${error.message}` : ''}
      </div>
    </Section>
  )
}
