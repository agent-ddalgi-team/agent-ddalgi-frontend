import axios from 'axios'
import { apiClient } from './client'
import type { DocumentFormat, ErrorObject, JobResponse } from '../types/profile'

function toErrorObject(err: unknown, fallbackMessage: string): ErrorObject {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: ErrorObject } | undefined
    if (data?.error) return data.error
  }
  return { code: 'UNKNOWN', message: fallbackMessage }
}

// POST /api/profiles — files는 같은 필드 이름으로 반복 전송, boundary는 axios/브라우저가 설정하도록 둔다.
export async function createProfileJob(
  files: FileList | File[],
  companyNameHint: string,
): Promise<JobResponse> {
  const formData = new FormData()
  Array.from(files).forEach((file) => {
    formData.append('files', file)
  })
  if (companyNameHint) {
    formData.append('company_name_hint', companyNameHint)
  }

  try {
    const res = await apiClient.post<JobResponse>('/api/profiles', formData)
    return res.data
  } catch (err) {
    throw toErrorObject(err, '요청 중 오류가 발생했습니다.')
  }
}

// GET /api/profiles/{job_id}
export async function getProfileJob(jobId: string): Promise<JobResponse> {
  try {
    const res = await apiClient.get<JobResponse>(
      `/api/profiles/${encodeURIComponent(jobId)}`,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '조회 중 오류가 발생했습니다.')
  }
}

const DOCUMENT_MIME: Record<DocumentFormat, string> = {
  md: 'text/markdown',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

// POST /api/profiles/{job_id}/document — 성공 시 실제 파일을 브라우저 다운로드로 저장한다.
export async function downloadProfileDocument(
  jobId: string,
  format: DocumentFormat,
): Promise<string> {
  const res = await (async () => {
    try {
      return await apiClient.post(
        `/api/profiles/${encodeURIComponent(jobId)}/document`,
        { format },
        { responseType: 'blob' },
      )
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
        const contentType = String(err.response.headers['content-type'] ?? '')
        if (contentType.includes('application/json')) {
          const text = await err.response.data.text()
          const body = JSON.parse(text) as { error?: ErrorObject }
          if (body.error) throw body.error
        }
      }
      throw toErrorObject(err, '문서 요청 중 오류가 발생했습니다.')
    }
  })()

  // 성공 응답이어도 Content-Type이 기대한 형식이 아니면 저장하지 않는다(예상 밖 응답 방지).
  const contentType = String(res.headers['content-type'] ?? '')
  const expectedType = DOCUMENT_MIME[format]
  if (!contentType.includes(expectedType)) {
    const err: ErrorObject = {
      code: 'INVALID_OUTPUT',
      message: `받은 파일 형식이 예상과 다릅니다 (Content-Type: ${contentType || '없음'}). 저장하지 않았습니다.`,
    }
    throw err
  }

  const disposition = String(res.headers['content-disposition'] ?? '')
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const fallbackName =
    format === 'docx' ? '회사소개서_초안.docx' : '회사소개서_초안.md'
  const fileName = match ? decodeURIComponent(match[1]) : fallbackName

  const url = URL.createObjectURL(res.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return fileName
}
