import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from 'docx'
import type { DocumentFormat } from '../types/profile'
import type { EditableDraftSection } from '../types/session'

// File System Access API Window 인터페이스 정의
interface SaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>
}

/**
 * [Security Hardening] 파일명 Path Traversal 및 특수문자 정제
 * - 디렉터리 탐색 문자(../, ..\) 제거
 * - OS 예약 문자(\ / : * ? " < > |) 및 제어문자(\x00-\x1f) 제거
 * - 최대 길이 100자로 안전하게 제한
 */
export function sanitizeDownloadFileName(
  rawName: string,
  fallback = 'download_document',
): string {
  if (!rawName || typeof rawName !== 'string') return fallback

  // 앞뒤 공백 및 경로 탐색 패턴 제거
  const clean = rawName
    .trim()
    .replace(/\.\.+[/\\]/g, '')
    .replace(/[/\\]/g, '_')
    // OS 예약 문자 및 제어문자 제거
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
    .replace(/_{2,}/g, '_')

  // 확장자 분리 및 보호
  const extMatch = clean.match(/(\.[a-zA-Z0-9]{1,10})$/)
  const ext = extMatch ? extMatch[1] : ''
  const baseName = ext ? clean.slice(0, -ext.length) : clean

  const safeBase = baseName.trim().slice(0, 100) || fallback
  return `${safeBase}${ext}`
}

/**
 * 앵커 태그를 활용한 표준 다운로드 폴백
 */
function downloadViaAnchor(blob: Blob, rawFileName: string): void {
  const fileName = sanitizeDownloadFileName(rawFileName)
  // File 객체로 래핑하여 메타데이터 및 확장자 보존
  const mimeType = fileName.endsWith('.pdf')
    ? 'application/pdf'
    : fileName.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : blob.type || 'application/octet-stream'

  const file = new File([blob], fileName, { type: mimeType })
  const url = window.URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  link.download = fileName
  link.style.display = 'none'

  document.body.appendChild(link)

  // MouseEvent로 정밀한 클릭 이벤트 디스패치
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  })
  link.dispatchEvent(clickEvent)

  setTimeout(() => {
    try {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
      window.URL.revokeObjectURL(url)
    } catch {
      // 무시
    }
  }, 2500)
}

/**
 * 최신 Chromium(Chrome/Edge) File System Access API 및 크로스 브라우징 안전 다운로더
 * - Chrome/Edge: 네이티브 '다른 이름으로 저장' 대화상자를 통해 정확한 .pdf / .docx 확장자 보장
 * - 기타 브라우저/폴백: 정밀 MouseEvent 기반 다운로드
 */
export async function triggerBrowserDownload(
  data: Blob | string,
  rawFileName: string,
  mimeType?: string,
): Promise<void> {
  const fileName = sanitizeDownloadFileName(rawFileName)
  const isPdf = fileName.endsWith('.pdf')
  const isDocx = fileName.endsWith('.docx')
  const defaultMime = isPdf
    ? 'application/pdf'
    : isDocx
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'text/markdown;charset=utf-8;'
  const effectiveMime = mimeType || defaultMime

  let blob: Blob
  if (data instanceof Blob) {
    blob = data.type ? data : new Blob([data], { type: effectiveMime })
  } else if (typeof data === 'string') {
    blob = new Blob([data], { type: effectiveMime })
  } else {
    return
  }

  // 1. Chromium 계열 (Chrome, Edge 등) 네이티브 File System Access API 우선 시도
  const windowWithPicker = window as unknown as {
    showSaveFilePicker?: (
      options: SaveFilePickerOptions,
    ) => Promise<FileSystemFileHandle>
  }

  if (typeof windowWithPicker.showSaveFilePicker === 'function') {
    try {
      const handle = await windowWithPicker.showSaveFilePicker({
        suggestedName: fileName,
        types: isPdf
          ? [
              {
                description: 'Adobe Acrobat PDF 문서 (*.pdf)',
                accept: {
                  'application/pdf': ['.pdf'],
                },
              },
            ]
          : isDocx
            ? [
                {
                  description: 'Word 문서 (*.docx)',
                  accept: {
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                      ['.docx'],
                  },
                },
              ]
            : [
                {
                  description: 'Markdown 문서 (*.md)',
                  accept: {
                    'text/markdown': ['.md'],
                  },
                },
              ],
      })

      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err: unknown) {
      // 사용자가 저장을 취소한 경우(AbortError)에는 폴백 다운로드를 실행하지 않음
      if (
        err instanceof Error &&
        (err.name === 'AbortError' || err.message.includes('aborted'))
      ) {
        return
      }
      // 권한 또는 제스처 만료 등의 에러 시 표준 앵커 다운로드로 폴백
    }
  }

  // 2. 표준 앵커 태그 다운로드 폴백
  downloadViaAnchor(blob, fileName)
}

export async function exportClientDocument(
  sections: EditableDraftSection[],
  companyName: string = '주식회사 에이전트딸기',
  format: DocumentFormat = 'docx',
): Promise<string> {
  // OS 파일시스템 금지 특수문자 치환 (/ \ ? * : | " < >)
  const sanitizedCompanyName = (companyName || '회사소개서')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
  const safeCompanyName = sanitizedCompanyName || '회사소개서'
  const today = new Date().toISOString().split('T')[0]
  const ext = format === 'docx' ? 'docx' : 'md'
  const fileName = `${safeCompanyName}_초안_${today}.${ext}`

  if (format === 'md') {
    let mdContent = `# ${safeCompanyName} 회사소개서\n\n`
    mdContent += `> 작성일자: ${today} | 팩트 그라운딩 AI 초안\n\n---\n\n`

    sections.forEach((sec, idx) => {
      mdContent += `## ${idx + 1}. ${sec.title}\n\n`
      sec.paragraphs.forEach((p) => {
        mdContent += `${p.text}\n\n`
      })
    })

    const blob = new Blob([mdContent], {
      type: 'text/markdown;charset=utf-8;',
    })
    await triggerBrowserDownload(blob, fileName, 'text/markdown;charset=utf-8;')
    return fileName
  }

  // Generate Genuine Binary .docx (Office OpenXML)
  const docParagraphs: Paragraph[] = [
    // Subtitle
    new Paragraph({
      children: [
        new TextRun({
          text: 'COMPANY PROFILE & CAPABILITIES',
          bold: true,
          color: '007A78',
          size: 20, // 10pt
          font: '맑은 고딕',
        }),
      ],
      spacing: { after: 100 },
    }),

    // Document Title
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: `${safeCompanyName} 회사소개서`,
          bold: true,
          color: '0F172A',
          size: 44, // 22pt
          font: '맑은 고딕',
        }),
      ],
      spacing: { after: 120 },
    }),

    // Document Meta Block with bottom border divider
    new Paragraph({
      children: [
        new TextRun({
          text: `작성일자: ${today}  |  생성 엔진: Agent DDALGI v2  |  팩트 검증 완료 초안`,
          color: '64748B',
          size: 19, // 9.5pt
          font: '맑은 고딕',
        }),
      ],
      border: {
        bottom: {
          color: '007A78',
          space: 12,
          style: BorderStyle.SINGLE,
          size: 16, // 2pt width
        },
      },
      spacing: { after: 360 },
    }),
  ]

  // Add all sections and paragraphs
  sections.forEach((sec, idx) => {
    // Section Header
    docParagraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `${idx + 1}. ${sec.title}`,
            bold: true,
            color: '007A78',
            size: 26, // 13pt
            font: '맑은 고딕',
          }),
        ],
        spacing: { before: 280, after: 140 },
        border: {
          bottom: {
            color: 'E2E8F0',
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
      }),
    )

    // Paragraphs
    sec.paragraphs.forEach((p) => {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: p.text,
              size: 21, // 10.5pt
              color: '334155',
              font: '맑은 고딕',
            }),
          ],
          spacing: { after: 140, line: 320 }, // 1.33x line height
          alignment: AlignmentType.JUSTIFIED,
        }),
      )
    })
  })

  // Document Footer Note
  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '본 문서는 Agent DDALGI 생성형 AI 에이전트를 통해 팩트 검증을 거쳐 생성된 기업 소개서 초안입니다.',
          color: '94A3B8',
          italics: true,
          size: 18, // 9pt
          font: '맑은 고딕',
        }),
      ],
      spacing: { before: 400 },
      border: {
        top: {
          color: 'E2E8F0',
          space: 8,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      alignment: AlignmentType.CENTER,
    }),
  )

  const doc = new Document({
    title: `${safeCompanyName} 회사소개서`,
    description: 'Agent DDALGI 팩트 그라운딩 기업 프로필',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch (25.4mm)
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${safeCompanyName} · 기업 소개서 초안`,
                    size: 16,
                    color: '94A3B8',
                    font: '맑은 고딕',
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 16,
                    color: '94A3B8',
                    font: '맑은 고딕',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '94A3B8',
                    font: '맑은 고딕',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 16,
                    color: '94A3B8',
                    font: '맑은 고딕',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '94A3B8',
                    font: '맑은 고딕',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: docParagraphs,
      },
    ],
  })

  const rawBlob = await Packer.toBlob(doc)
  const docxBlob = new Blob([rawBlob], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  await triggerBrowserDownload(
    docxBlob,
    fileName,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  )
  return fileName
}
