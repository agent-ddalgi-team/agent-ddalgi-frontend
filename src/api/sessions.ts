import axios from 'axios'
import { apiClient } from './client'
import { triggerBrowserDownload } from '../utils/documentExport'
import type { DocumentFormat, ErrorObject } from '../types/profile'
import type {
  AiSuggestion,
  ConfirmPrecheckParams,
  CreateSessionParams,
  PrecheckResult,
  SessionResponse,
} from '../types/session'

function toErrorObject(err: unknown, fallbackMessage: string): ErrorObject {
  if (axios.isAxiosError(err)) {
    if (
      !err.response ||
      err.response.status === 502 ||
      err.response.status === 503 ||
      err.code === 'ERR_NETWORK' ||
      err.code === 'ECONNREFUSED'
    ) {
      return {
        code: 'BACKEND_OFFLINE',
        message:
          '백엔드 서버(http://127.0.0.1:8000)가 연결되지 않았습니다. 백엔드를 기동하시거나 하단의 "개발 및 UI 테스트 시나리오 로더"를 통해 화면을 즉시 테스트하실 수 있습니다.',
      }
    }
    const data = err.response?.data as { error?: ErrorObject } | undefined
    if (data?.error) return data.error
    if (typeof err.response?.data === 'string') {
      try {
        const parsed = JSON.parse(err.response.data) as { error?: ErrorObject }
        if (parsed.error) return parsed.error
      } catch {
        // Not a JSON string
      }
    }
  }
  return { code: 'UNKNOWN', message: fallbackMessage }
}

const DOCUMENT_MIME: Record<DocumentFormat, string> = {
  md: 'text/markdown',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

// 1. 세션 열기 (POST /api/v1/sessions)
export async function createSession(
  params?: CreateSessionParams,
): Promise<SessionResponse> {
  try {
    const res = await apiClient.post<SessionResponse>(
      '/api/v1/sessions',
      params ?? {},
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '세션 생성 중 오류가 발생했습니다.')
  }
}

// 2. 세션 조회 (GET /api/v1/sessions/{session_id})
export async function getSession(sessionId: string): Promise<SessionResponse> {
  try {
    const res = await apiClient.get<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}`,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '세션 상태 조회 중 오류가 발생했습니다.')
  }
}

// 3. 파일 업로드 (POST /api/v1/sessions/{session_id}/files)
// PPTX, PDF, DOCX, TXT, JPG, PNG 지원
export async function uploadSessionFiles(
  sessionId: string,
  files: FileList | File[],
): Promise<SessionResponse> {
  const formData = new FormData()
  Array.from(files).forEach((file) => {
    formData.append('files', file)
  })

  try {
    const res = await apiClient.post<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/files`,
      formData,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '파일 업로드 중 오류가 발생했습니다.')
  }
}

// 4. 자료 선택 (POST /api/v1/sessions/{session_id}/select-files)
export async function selectSessionFiles(
  sessionId: string,
  fileIds: string[],
): Promise<SessionResponse> {
  try {
    const res = await apiClient.post<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/select-files`,
      { file_ids: fileIds },
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '자료 선택 중 오류가 발생했습니다.')
  }
}

// 5. 사전 점검 요청 (POST /api/v1/sessions/{session_id}/precheck)
export async function requestPrecheck(
  sessionId: string,
): Promise<SessionResponse> {
  try {
    const res = await apiClient.post<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/precheck`,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '사전 점검 요청 중 오류가 발생했습니다.')
  }
}

// 6. 사전 점검 조회 (GET /api/v1/sessions/{session_id}/precheck - 임시 규칙 ⑤)
export async function getPrecheck(sessionId: string): Promise<PrecheckResult> {
  try {
    const res = await apiClient.get<PrecheckResult>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/precheck`,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '사전 점검 결과 조회 중 오류가 발생했습니다.')
  }
}

// 7. 사전 점검 확인 완료 (POST /api/v1/sessions/{session_id}/confirm)
export async function confirmPrecheck(
  sessionId: string,
  params?: ConfirmPrecheckParams,
): Promise<SessionResponse> {
  try {
    const res = await apiClient.post<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/confirm`,
      params ?? {},
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '확인 처리 중 오류가 발생했습니다.')
  }
}

// 8. 초안 생성 요청 (POST /api/v1/sessions/{session_id}/draft)
export async function generateDraft(
  sessionId: string,
): Promise<SessionResponse> {
  try {
    const res = await apiClient.post<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/draft`,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '초안 생성 요청 중 오류가 발생했습니다.')
  }
}

// 9. 문단 직접 수정 (PATCH /api/v1/sessions/{session_id}/paragraphs/{paragraph_id})
export async function editParagraph(
  sessionId: string,
  paragraphId: string,
  text: string,
): Promise<SessionResponse> {
  try {
    const res = await apiClient.patch<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/paragraphs/${encodeURIComponent(paragraphId)}`,
      { text },
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '문단 수정 중 오류가 발생했습니다.')
  }
}

// 10. AI 문단 수정안 요청 (POST /api/v1/sessions/{session_id}/paragraphs/{paragraph_id}/suggestions)
export async function requestAiSuggestion(
  sessionId: string,
  paragraphId: string,
  instruction?: string,
): Promise<AiSuggestion> {
  try {
    const res = await apiClient.post<AiSuggestion>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/paragraphs/${encodeURIComponent(paragraphId)}/suggestions`,
      { instruction },
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, 'AI 수정안 요청 중 오류가 발생했습니다.')
  }
}

// 11. AI 수정안 목록/조회 (GET .../suggestions - 임시 규칙 ⑯)
export async function getAiSuggestions(
  sessionId: string,
  paragraphId: string,
): Promise<AiSuggestion[]> {
  try {
    const res = await apiClient.get<AiSuggestion[]>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/paragraphs/${encodeURIComponent(paragraphId)}/suggestions`,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, 'AI 수정안 목록 조회 중 오류가 발생했습니다.')
  }
}

// 12. AI 수정안 적용 (POST .../suggestions/{suggestion_id}/apply)
export async function applyAiSuggestion(
  sessionId: string,
  paragraphId: string,
  suggestionId: string,
): Promise<SessionResponse> {
  try {
    const res = await apiClient.post<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/paragraphs/${encodeURIComponent(paragraphId)}/suggestions/${encodeURIComponent(suggestionId)}/apply`,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, 'AI 수정안 적용 중 오류가 발생했습니다.')
  }
}

// 13. AI 수정안 거부 (POST .../suggestions/{suggestion_id}/reject)
export async function rejectAiSuggestion(
  sessionId: string,
  paragraphId: string,
  suggestionId: string,
): Promise<SessionResponse> {
  try {
    const res = await apiClient.post<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/paragraphs/${encodeURIComponent(paragraphId)}/suggestions/${encodeURIComponent(suggestionId)}/reject`,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, 'AI 수정안 거부 처리 중 오류가 발생했습니다.')
  }
}

// 14. 문단 편집 되돌리기 (POST /api/v1/sessions/{session_id}/paragraphs/{paragraph_id}/revert)
export async function revertParagraph(
  sessionId: string,
  paragraphId: string,
): Promise<SessionResponse> {
  try {
    const res = await apiClient.post<SessionResponse>(
      `/api/v1/sessions/${encodeURIComponent(sessionId)}/paragraphs/${encodeURIComponent(paragraphId)}/revert`,
    )
    return res.data
  } catch (err) {
    throw toErrorObject(err, '되돌리기 중 오류가 발생했습니다.')
  }
}

// 15. 최종 문서 다운로드 (POST /api/v1/sessions/{session_id}/document)
export async function downloadSessionDocument(
  sessionId: string,
  format: DocumentFormat,
): Promise<string> {
  const res = await (async () => {
    try {
      return await apiClient.post(
        `/api/v1/sessions/${encodeURIComponent(sessionId)}/document`,
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
      throw toErrorObject(err, '문서 다운로드 요청 중 오류가 발생했습니다.')
    }
  })()

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

  triggerBrowserDownload(res.data as Blob, fileName)
  return fileName
}
