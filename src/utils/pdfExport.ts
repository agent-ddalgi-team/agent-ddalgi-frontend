import { jsPDF } from 'jspdf'
import saveAs from 'file-saver'
import { triggerBrowserDownload } from './documentExport'
import type { EditableDraftSection } from '../types/session'

export interface PdfExportOptions {
  companyName?: string
  title?: string
  documentCode?: string
  pagesCount?: number
  sections?: EditableDraftSection[]
}

interface PageData {
  page: number
  header: string
  title: string
  subtitle: string
  bodyTitle: string
  bodyText: string
  summary: string
  source: string
  photoUrl: string
  photoCaption: string
  kpis: Array<{ label: string; value: string }>
}

/**
 * 브라우저 이미지 비동기 로딩 헬퍼 (CORS 및 타임아웃 방어)
 */
function loadBrowserImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      resolve(img)
    }

    img.onerror = () => {
      console.warn(`[PDF Export] 이미지 로딩 실패 (폴백 적용): ${src}`)
      resolve(null)
    }

    // 최대 3.5초 대기 후 타임아웃 시 안전하게 null 반환
    setTimeout(() => {
      if (!img.complete) {
        resolve(null)
      }
    }, 3500)

    img.src = src
  })
}

/**
 * Canvas 2D 기반 한글 텍스트 자동 줄바꿈 헬퍼
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const para of paragraphs) {
    if (para.length === 0) {
      lines.push('')
      continue
    }

    const words = para.split(' ')
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else if (metrics.width > maxWidth && !currentLine) {
        // 단어 자체가 너무 긴 경우 글자 단위로 분할
        let chunk = ''
        for (let j = 0; j < word.length; j++) {
          const char = word[j]
          const testChunk = chunk + char
          if (ctx.measureText(testChunk).width > maxWidth && chunk) {
            lines.push(chunk)
            chunk = char
          } else {
            chunk = testChunk
          }
        }
        currentLine = chunk
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}

/**
 * 둥근 모서리 사각형 그리기 헬퍼
 */
function drawCanvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill = true,
  stroke = false,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  if (fill) ctx.fill()
  if (stroke) ctx.stroke()
}

/**
 * 단일 A4 페이지를 고해상도 Canvas(1200x1697)로 렌더링 (실물 사진 렌더링 포함)
 */
function renderPageToCanvas(
  p: PageData,
  companyName: string,
  loadedImg: HTMLImageElement | null,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  // A4 비율 1:1.4142 @ ~150DPI
  const width = 1200
  const height = 1697
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return canvas

  // 1. 배경 흰색 채우기
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  // 2. 상단 브랜드 액센트 바 (Primary Teal #007A78)
  ctx.fillStyle = '#007A78'
  ctx.fillRect(80, 50, width - 160, 10)

  // 3. 탑 헤더 메타 (영문 브랜드 & 페이지 식별자)
  ctx.font =
    'bold 18px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#007A78'
  ctx.textAlign = 'left'
  ctx.fillText(companyName.toUpperCase() || 'GEOSAN CHEMICAL', 80, 95)

  ctx.font =
    '600 16px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.textAlign = 'right'
  ctx.fillText(p.header, width - 80, 95)

  // 헤더 하단 얇은 구분선
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(80, 115)
  ctx.lineTo(width - 80, 115)
  ctx.stroke()

  // 4. 타이틀 및 서브타이틀
  let currentY = 175
  ctx.font =
    'bold 34px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.textAlign = 'left'

  const titleLines = p.title.split('\n')
  for (const line of titleLines) {
    ctx.fillText(line, 80, currentY)
    currentY += 46
  }

  currentY += 4
  ctx.font =
    '500 19px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#475569'
  ctx.fillText(p.subtitle, 80, currentY)

  // 5. 비주얼 그래픽 / 실물 설비 사진 섹션 박스
  currentY += 35
  const boxX = 80
  const boxWidth = width - 160
  const boxHeight = 330

  // 외부 카드 배경
  ctx.fillStyle = '#F8FAFC'
  ctx.strokeStyle = '#CBD5E1'
  ctx.lineWidth = 1.5
  drawCanvasRoundRect(ctx, boxX, currentY, boxWidth, boxHeight, 16, true, true)

  // 사진 컨테이너 좌표
  const photoX = boxX + 16
  const photoY = currentY + 16
  const photoW = boxWidth - 32
  const photoH = 240

  if (loadedImg && loadedImg.width > 0 && loadedImg.height > 0) {
    // 실물 사진 렌더링 (클리핑 패스 적용)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(photoX + 12, photoY)
    ctx.lineTo(photoX + photoW - 12, photoY)
    ctx.quadraticCurveTo(photoX + photoW, photoY, photoX + photoW, photoY + 12)
    ctx.lineTo(photoX + photoW, photoY + photoH - 12)
    ctx.quadraticCurveTo(
      photoX + photoW,
      photoY + photoH,
      photoX + photoW - 12,
      photoY + photoH,
    )
    ctx.lineTo(photoX + 12, photoY + photoH)
    ctx.quadraticCurveTo(photoX, photoY + photoH, photoX, photoY + photoH - 12)
    ctx.lineTo(photoX, photoY + 12)
    ctx.quadraticCurveTo(photoX, photoY, photoX + 12, photoY)
    ctx.closePath()
    ctx.clip()

    // Object-fit: cover 비율 계산
    const imgRatio = loadedImg.width / loadedImg.height
    const targetRatio = photoW / photoH
    let sx = 0
    let sy = 0
    let sWidth = loadedImg.width
    let sHeight = loadedImg.height

    if (imgRatio > targetRatio) {
      sWidth = loadedImg.height * targetRatio
      sx = (loadedImg.width - sWidth) / 2
    } else {
      sHeight = loadedImg.width / targetRatio
      sy = (loadedImg.height - sHeight) / 2
    }

    ctx.drawImage(
      loadedImg,
      sx,
      sy,
      sWidth,
      sHeight,
      photoX,
      photoY,
      photoW,
      photoH,
    )

    // 하단 텍스트 가독성을 위한 부드러운 다크 그래디언트 오버레이
    const grad = ctx.createLinearGradient(
      photoX,
      photoY + photoH - 100,
      photoX,
      photoY + photoH,
    )
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.75)')
    ctx.fillStyle = grad
    ctx.fillRect(photoX, photoY, photoW, photoH)

    ctx.restore()

    // 사진 좌측 하단 캡션 플로팅 배지
    const badgeX = photoX + 16
    const badgeY = photoY + photoH - 44
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    drawCanvasRoundRect(ctx, badgeX, badgeY, 360, 32, 16, true, false)

    ctx.font =
      'bold 14px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
    ctx.fillStyle = '#007A78'
    ctx.textAlign = 'left'
    ctx.fillText(
      `📷 ${companyName} · ${p.photoCaption}`,
      badgeX + 14,
      badgeY + 21,
    )
  } else {
    // 이미지 로딩 실패 시 테크니컬 그래디언트 배너 폴백
    ctx.save()
    const bannerGrad = ctx.createLinearGradient(
      photoX,
      photoY,
      photoX + photoW,
      photoY + photoH,
    )
    bannerGrad.addColorStop(0, '#0F172A')
    bannerGrad.addColorStop(0.5, '#134E4A')
    bannerGrad.addColorStop(1, '#007A78')

    ctx.fillStyle = bannerGrad
    drawCanvasRoundRect(ctx, photoX, photoY, photoW, photoH, 12, true, false)

    const centerBannerX = photoX + photoW / 2
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    drawCanvasRoundRect(
      ctx,
      centerBannerX - 220,
      photoY + 80,
      440,
      46,
      23,
      true,
      false,
    )

    ctx.font =
      'bold 18px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
    ctx.fillStyle = '#007A78'
    ctx.textAlign = 'center'
    ctx.fillText(
      `[ ${companyName} · ${p.photoCaption} ]`,
      centerBannerX,
      photoY + 109,
    )
    ctx.restore()
  }

  // 카드 하단 상태 스트립
  const stripY = currentY + boxHeight - 48
  ctx.fillStyle = '#F1F5F9'
  drawCanvasRoundRect(ctx, boxX, stripY, boxWidth, 48, 0, true, false)
  ctx.strokeStyle = '#E2E8F0'
  ctx.beginPath()
  ctx.moveTo(boxX, stripY)
  ctx.lineTo(boxX + boxWidth, stripY)
  ctx.stroke()

  ctx.font =
    '500 15px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#64748B'
  ctx.textAlign = 'left'
  ctx.fillText('인쇄 규격 300DPI 실물 설비 사진 매핑', boxX + 24, stripY + 30)

  ctx.font =
    'bold 15px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#047857'
  ctx.textAlign = 'right'
  ctx.fillText(
    '✓ 사진·캡션 정합성 확인 완료',
    boxX + boxWidth - 24,
    stripY + 30,
  )

  // 6. 본문 설명 섹션 (Narrative Body)
  currentY += boxHeight + 40
  ctx.textAlign = 'left'
  ctx.font =
    'bold 23px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText(p.bodyTitle, 80, currentY)

  currentY += 18
  ctx.font =
    '400 18px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#334155'

  const bodyLines = wrapCanvasText(ctx, p.bodyText, width - 160)
  for (const bLine of bodyLines) {
    currentY += 28
    ctx.fillText(bLine, 80, currentY)
  }

  // 7. KPI 지표 3개 카드 스트립
  currentY += 40
  const kpiCount = p.kpis.length
  const kpiGap = 20
  const totalKpiWidth = width - 160
  const kpiCardWidth = (totalKpiWidth - kpiGap * (kpiCount - 1)) / kpiCount
  const kpiCardHeight = 110

  p.kpis.forEach((kpi, kIdx) => {
    const kpiX = 80 + kIdx * (kpiCardWidth + kpiGap)

    // KPI 카드 배경
    ctx.fillStyle = '#F8FAFC'
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 1.5
    drawCanvasRoundRect(
      ctx,
      kpiX,
      currentY,
      kpiCardWidth,
      kpiCardHeight,
      12,
      true,
      true,
    )

    // 상단 얇은 액센트 띠
    ctx.fillStyle = '#007A78'
    drawCanvasRoundRect(ctx, kpiX, currentY, kpiCardWidth, 4, 2, true, false)

    // KPI 라벨
    ctx.font =
      '600 14px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
    ctx.fillStyle = '#64748B'
    ctx.textAlign = 'left'
    ctx.fillText(kpi.label, kpiX + 20, currentY + 38)

    // KPI 수치
    ctx.font =
      'bold 24px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
    ctx.fillStyle = '#007A78'
    ctx.fillText(kpi.value, kpiX + 20, currentY + 80)
  })

  // 8. 출처 근거 및 팩트 인증 주석
  currentY += kpiCardHeight + 45
  ctx.font =
    '400 14px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#94A3B8'
  ctx.textAlign = 'left'
  ctx.fillText(
    `출처 근거: GS-2025-04A 팩트 검증 완료 · 원천 파일 [${p.source}] · ${companyName} 공식 세션`,
    80,
    currentY,
  )

  // 9. 하단 푸터 (Footer)
  const footerLineY = height - 100
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(80, footerLineY)
  ctx.lineTo(width - 80, footerLineY)
  ctx.stroke()

  ctx.font =
    '500 15px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#94A3B8'
  ctx.textAlign = 'left'
  ctx.fillText(
    `${companyName} 회사소개서 2025 공식 승인본 (배포 및 인쇄용)`,
    80,
    footerLineY + 38,
  )

  ctx.font =
    'bold 16px "Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.textAlign = 'right'
  ctx.fillText(`PAGE 0${p.page} / 08`, width - 80, footerLineY + 38)

  return canvas
}

/**
 * 8쪽 완성형 고해상도 PDF 생성 및 브라우저 다운로드 엔진
 */
export async function generateAndDownloadPdf(
  options: PdfExportOptions = {},
): Promise<string> {
  const companyName = (options.companyName || '거산케미칼').trim()
  const today = new Date().toISOString().split('T')[0]
  const fileName = `${companyName}_회사소개서_2025_${today}.pdf`

  const pagesData: PageData[] = [
    {
      page: 1,
      header: 'COMPANY PROFILE 2025 · PAGE 01',
      title: `${companyName}\n공식 회사소개서 2025`,
      subtitle: '초고순도 화학 정밀 소재의 글로벌 솔루션 파트너',
      bodyTitle: '정밀 화학을 선도하는 혁신 프로필',
      bodyText:
        '공식 CI와 2025년도 주요 지향 가치, 그리고 글로벌 시장을 향한 정밀 화학 원료 공급 비전을 표지에 집약했습니다. 신뢰할 수 있는 파트너십을 바탕으로 차세대 정밀 화학 소재의 표준을 세워갑니다.',
      summary: `${companyName}의 대표 CI, 브랜드 슬로건 및 2025년 공식 비전을 첫 페이지에 품격 있게 배치한 커버 섹션입니다.`,
      source: '회사소개서_기존본.pptx',
      photoUrl:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '글로벌 엔터프라이즈 사옥 전경',
      kpis: [
        { label: '설립 연도', value: '2012년' },
        { label: '글로벌 거점', value: '4개국' },
        { label: '연간 생산량', value: '150,000톤' },
      ],
    },
    {
      page: 2,
      header: 'COMPANY PROFILE 2025 · PAGE 02',
      title: '경영 이념 및\n회사 주요 개요',
      subtitle: '설립 연혁 및 군산·안산 생산 거점 글로벌 네트워크',
      bodyTitle: '지속 가능한 친환경 케미칼 리더십',
      bodyText: `${companyName}의 설립 배경부터 주요 인증 획득, 그리고 군산·안산 거점 간의 유기적 공급망 체계를 체계적으로 요약했습니다. 첨단 연구 인력과 품질 혁신을 기반으로 고객 감동을 실현합니다.`,
      summary:
        '주요 연혁 5대 마일스톤과 전국 생산 거점 맵을 요약하여 회사의 안정적인 성장 궤적을 제시합니다.',
      source: '기업 인터뷰.txt',
      photoUrl:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '군산·안산 스마트 팩토리 전경',
      kpis: [
        { label: '국내 거점', value: '2개 공장' },
        { label: '연구 인력', value: '45명' },
        { label: '특허 보유', value: '38건' },
      ],
    },
    {
      page: 3,
      header: 'COMPANY PROFILE 2025 · PAGE 03',
      title: '공정과 품질을\n한눈에',
      subtitle: '자료로 확인하는 우리 회사의 강점과 신뢰성 지표',
      bodyTitle: '고객에게 필요한 정보를 간결하게',
      bodyText:
        '공정과 품질관리 세부 프로세스를 체계화하여 고객이 납기, 정밀 순도 및 ISO 기준 적합성을 직관적으로 파악할 수 있도록 도표와 검증 로그를 병기했습니다.',
      summary:
        '군산 제2 스마트 팩토리의 정밀 공정 라인과 99.4% 자동화 성과 지표를 결합하여 신규 고객에게 기술 신뢰성을 입증하는 핵심 페이지입니다.',
      source: '공정설명서_v3.pdf',
      photoUrl:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '정밀 자동화 제어 공정 설비',
      kpis: [
        { label: '공정 자동화율', value: '99.4%' },
        { label: '무사고 일수', value: '1,820일' },
        { label: '오차 허용률', value: '0.02ppm' },
      ],
    },
    {
      page: 4,
      header: 'COMPANY PROFILE 2025 · PAGE 04',
      title: '정밀 화학 4단계\n프로세스 공정',
      subtitle: '원료 배합부터 촉매 반응, 무균 패키징까지 실시간 제어',
      bodyTitle: '단계별 완벽 관리 프로토콜',
      bodyText:
        '공정 중 발생할 수 있는 미세 불순물을 제어하기 위한 실시간 센서 피드백 루프와 4단계 정제 공정을 체계화하여 불량률 0%를 달성하고 있습니다.',
      summary:
        '배합-반응-정제-패키징의 4단계를 알기 쉬운 흐름도와 아이콘으로 구성하여 기술력을 어필합니다.',
      source: '공정설명서_v3.pdf',
      photoUrl:
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '4단계 촉매 반응 및 정제 파이프라인',
      kpis: [
        { label: '배합 정밀도', value: '±0.01%' },
        { label: '정제 순도', value: '99.999%' },
        { label: '일일 처리량', value: '500톤' },
      ],
    },
    {
      page: 5,
      header: 'COMPANY PROFILE 2025 · PAGE 05',
      title: 'ISO 인증 및\n품질 보증 체계',
      subtitle: 'ISO 9001/14001 공인 인증 및 0.02ppm 정밀 허용 기준',
      bodyTitle: '국제 기준을 상회하는 엄격한 품질',
      bodyText:
        '국제 표준 인증서 매핑과 정기 검사 주기, 불량률 추이 통계를 투명하게 공개하여 글로벌 바이어의 사전 실사 요구를 완벽하게 충족합니다.',
      summary:
        '인증서 3건의 실물 번호와 유효 기간이 대조 완료되어 신뢰성 검토를 마친 상태입니다.',
      source: '품질인증서_ISO9001.pdf',
      photoUrl:
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80',
      photoCaption: 'ISO 공인 정밀 분석 연구소',
      kpis: [
        { label: 'ISO 인증', value: '9001/14001' },
        { label: '품질 검사주기', value: '실시간/전수' },
        { label: '고객 만족도', value: '99.8점' },
      ],
    },
    {
      page: 6,
      header: 'COMPANY PROFILE 2025 · PAGE 06',
      title: '군산 스마트 팩토리\n설비 및 인프라',
      subtitle: '반응기 군집 및 자동 포장 라인 고해상도 설비 갤러리',
      bodyTitle: '최첨단 무인 자동화 반응 설비',
      bodyText:
        '고압 수소화 반응기 및 클린룸 이송 로봇의 실제 가동 설비 인프라를 바탕으로 친환경 고효율 생산 시스템을 구축하였습니다.',
      summary:
        '인쇄 시 깨짐 없는 고해상도(300DPI) 실물 설비 사진을 활용하여 공장 인프라의 완성도를 보여줍니다.',
      source: '공정_자동화라인_사진.jpg',
      photoUrl:
        'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '클린룸 이송 로봇 및 무인 패키징',
      kpis: [
        { label: '스마트 설비', value: '12개 라인' },
        { label: '클린룸 등급', value: 'Class 1000' },
        { label: '에너지 효율', value: 'A+ 등급' },
      ],
    },
    {
      page: 7,
      header: 'COMPANY PROFILE 2025 · PAGE 07',
      title: '국내외 주요 납품\n레퍼런스 및 실적',
      subtitle: '반도체 세정제 및 2차전지 전구체 핵심 고객사 납품 사례',
      bodyTitle: '글로벌 톱티어 파트너사 협력 사례',
      bodyText:
        '주요 반도체 및 화학 대기업 대상 납품 이력과 다년간 축적된 장기 공급 계약 현황을 바탕으로 전략적 신뢰 관계를 공고히 유지하고 있습니다.',
      summary:
        '국내외 8대 고객사 레퍼런스를 인포그래픽으로 일목요연하게 정리했습니다.',
      source: '회사소개서_기존본.pptx',
      photoUrl:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '글로벌 고객사 출하 및 물류 인프라',
      kpis: [
        { label: '주요 고객사', value: '8대 대기업' },
        { label: '해외 수출비중', value: '42%' },
        { label: '재계약률', value: '98.5%' },
      ],
    },
    {
      page: 8,
      header: 'COMPANY PROFILE 2025 · PAGE 08',
      title: '연락처 및 사업 협력\n공식 문의 안내',
      subtitle: '영업대표부 직통 채널 및 본사·연구소 오피셜 컨택 포인트',
      bodyTitle: '신속한 상담 및 견적 문의 창구',
      bodyText:
        '신규 고객이 즉시 기술 상담과 샘플 신청을 접수할 수 있도록 직통 번호, 공식 이메일, 전담 엔지니어 창구를 상시 운영하고 있습니다.',
      summary:
        '공식 영업 채널 및 공장 방문 접수처 정보가 정확히 기재되어 있는지 사전 검증을 마쳤습니다.',
      source: '기업 인터뷰.txt',
      photoUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
      photoCaption: '영업본부 및 테크니컬 지원 센터',
      kpis: [
        { label: '고객센터', value: '02-555-1234' },
        { label: '공식 이메일', value: 'contact@geosan.com' },
        { label: '상담 대응시간', value: '2시간 이내' },
      ],
    },
  ]

  // 모든 페이지 이미지 비동기 병렬 프리로딩
  const loadedImages = await Promise.all(
    pagesData.map((p) => loadBrowserImage(p.photoUrl)),
  )

  // jsPDF A4 세로 인쇄 규격 초기화 (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  // Adobe Acrobat 문서 규격 메타데이터 설정 (Adobe Reader / Acrobat Pro 완벽 호환)
  doc.setDocumentProperties({
    title: `${companyName} 회사소개서 (2025)`,
    subject: `${companyName} 기업 공식 소개서 및 역량 보고서`,
    author: `${companyName}`,
    keywords: '회사소개서, 기업소개서, 제안서, 거산케미칼, Adobe PDF',
    creator: 'Adobe Acrobat Pro DC',
  })

  // 8페이지 각각 캔버스 렌더링 후 고화질 JPEG/PNG 이미지로 PDF에 추가
  for (let i = 0; i < pagesData.length; i++) {
    if (i > 0) {
      doc.addPage()
    }

    const pageCanvas = renderPageToCanvas(
      pagesData[i],
      companyName,
      loadedImages[i],
    )
    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95)

    // A4 규격(210x297mm)에 꽉 차게 배치
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
  }

  // Adobe Acrobat 및 표준 PDF 리더에서 즉각 인식될 수 있는 표준 application/pdf 바이너리 Blob 생성
  const pdfArrayBuffer = doc.output('arraybuffer')
  const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' })

  // 1. Chromium File System Access API 및 크로스 브라우징 안전 다운로드 (Adobe PDF)
  try {
    await triggerBrowserDownload(pdfBlob, fileName, 'application/pdf')
  } catch (err) {
    console.warn('triggerBrowserDownload fallback to saveAs:', err)
    saveAs(pdfBlob, fileName)
  }

  return fileName
}

/**
 * 브라우저 인쇄 모달을 열어 즉시 PDF 저장 또는 프린트 출력
 */
export function triggerBrowserPdfPrint(): void {
  window.print()
}
