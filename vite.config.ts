import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import https from 'node:https'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

interface CrawledPhoto {
  id: string
  name: string
  caption: string
  category: 'facility' | 'lab' | 'building' | 'product' | 'cert'
  url: string
  thumbnailUrl: string
  sourceDomain: string
  sourcePageUrl: string
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

/**
 * SSL 인증서 오류 및 리다이렉트를 안전하게 처리하는 견고한 HTTP/HTTPS 요청 함수
 */
async function robustFetch(
  targetUrl: string,
  timeoutMs = 7000,
): Promise<{ ok: boolean; status: number; text: () => Promise<string> }> {
  return new Promise((resolve) => {
    let handled = false
    const safeResolve = (val: {
      ok: boolean
      status: number
      text: () => Promise<string>
    }) => {
      if (!handled) {
        handled = true
        resolve(val)
      }
    }

    try {
      const isHttps = targetUrl.startsWith('https://')
      const client = isHttps ? https : http
      const agent = isHttps ? httpsAgent : undefined

      const req = client.get(
        targetUrl,
        {
          agent,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          timeout: timeoutMs,
        },
        (res) => {
          if (
            [301, 302, 307, 308].includes(res.statusCode || 0) &&
            res.headers.location
          ) {
            let redirectUrl = res.headers.location
            if (!redirectUrl.startsWith('http')) {
              try {
                const origin = new URL(targetUrl).origin
                redirectUrl = new URL(redirectUrl, origin).toString()
              } catch {}
            }
            if (redirectUrl.startsWith('http')) {
              return robustFetch(redirectUrl, timeoutMs)
                .then(safeResolve)
                .catch(() =>
                  safeResolve({ ok: false, status: 500, text: async () => '' }),
                )
            }
          }

          let data = ''
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const status = res.statusCode || 200
            safeResolve({
              ok: status >= 200 && status < 400,
              status,
              text: async () => data,
            })
          })
        },
      )

      req.on('error', () => {
        // https 접속 실패 시 http로 자동 재시도
        if (targetUrl.startsWith('https://')) {
          const httpUrl = targetUrl.replace(/^https:\/\//i, 'http://')
          robustFetch(httpUrl, timeoutMs)
            .then(safeResolve)
            .catch(() =>
              safeResolve({ ok: false, status: 500, text: async () => '' }),
            )
        } else {
          safeResolve({ ok: false, status: 500, text: async () => '' })
        }
      })

      req.on('timeout', () => {
        req.destroy()
        safeResolve({ ok: false, status: 504, text: async () => '' })
      })
    } catch {
      safeResolve({ ok: false, status: 500, text: async () => '' })
    }
  })
}

/**
 * 프록시 전송용 바이너리 버퍼 수신 함수
 */
async function robustFetchBuffer(
  targetUrl: string,
  refererOrigin?: string,
  timeoutMs = 9000,
): Promise<{
  ok: boolean
  status: number
  contentType: string
  buffer: Buffer
}> {
  return new Promise((resolve) => {
    let handled = false
    const safeResolve = (val: {
      ok: boolean
      status: number
      contentType: string
      buffer: Buffer
    }) => {
      if (!handled) {
        handled = true
        resolve(val)
      }
    }

    try {
      const isHttps = targetUrl.startsWith('https://')
      const client = isHttps ? https : http
      const agent = isHttps ? httpsAgent : undefined

      const req = client.get(
        targetUrl,
        {
          agent,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept:
              'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            Referer: refererOrigin || 'https://www.google.com/',
          },
          timeout: timeoutMs,
        },
        (res) => {
          if (
            [301, 302, 307, 308].includes(res.statusCode || 0) &&
            res.headers.location
          ) {
            let redirectUrl = res.headers.location
            if (!redirectUrl.startsWith('http')) {
              try {
                const origin = new URL(targetUrl).origin
                redirectUrl = new URL(redirectUrl, origin).toString()
              } catch {}
            }
            if (redirectUrl.startsWith('http')) {
              return robustFetchBuffer(redirectUrl, refererOrigin, timeoutMs)
                .then(safeResolve)
                .catch(() =>
                  safeResolve({
                    ok: false,
                    status: 500,
                    contentType: 'image/jpeg',
                    buffer: Buffer.alloc(0),
                  }),
                )
            }
          }

          const chunks: Buffer[] = []
          res.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          })
          res.on('end', () => {
            const status = res.statusCode || 200
            const contentType =
              (res.headers['content-type'] as string) || 'image/jpeg'
            safeResolve({
              ok: status >= 200 && status < 400,
              status,
              contentType,
              buffer: Buffer.concat(chunks),
            })
          })
        },
      )

      req.on('error', () => {
        if (targetUrl.startsWith('https://')) {
          const httpUrl = targetUrl.replace(/^https:\/\//i, 'http://')
          robustFetchBuffer(httpUrl, refererOrigin, timeoutMs)
            .then(safeResolve)
            .catch(() =>
              safeResolve({
                ok: false,
                status: 500,
                contentType: 'image/jpeg',
                buffer: Buffer.alloc(0),
              }),
            )
        } else {
          safeResolve({
            ok: false,
            status: 500,
            contentType: 'image/jpeg',
            buffer: Buffer.alloc(0),
          })
        }
      })

      req.on('timeout', () => {
        req.destroy()
        safeResolve({
          ok: false,
          status: 504,
          contentType: 'image/jpeg',
          buffer: Buffer.alloc(0),
        })
      })
    } catch {
      safeResolve({
        ok: false,
        status: 500,
        contentType: 'image/jpeg',
        buffer: Buffer.alloc(0),
      })
    }
  })
}

/**
 * DuckDuckGo 고화질 이미지 검색 (기업명 중심 정밀 필터링)
 */
async function searchDuckDuckGo(
  companyName: string,
  query: string,
): Promise<CrawledPhoto[]> {
  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(5000),
      },
    )
    if (!tokenRes.ok) return []
    const tokenHtml = await tokenRes.text()
    const vqdMatch =
      tokenHtml.match(/vqd=([0-9-]+)/) || tokenHtml.match(/vqd="([^"]+)"/)
    if (!vqdMatch) return []
    const vqd = vqdMatch[1]

    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(6000),
      },
    )
    if (!imgRes.ok) return []
    const data = (await imgRes.json()) as any
    const list = data.results || []

    const results: CrawledPhoto[] = []
    for (const r of list) {
      const title = (r.title || '').replace(/<[^>]+>/g, '').trim()
      const imgUrl = r.image || ''

      // 타사/무관 인물/스톡 사진 필터링
      if (isIrrelevantPhoto(title, imgUrl, companyName)) continue

      const cat = classifyCategory(title, imgUrl)
      const cleanTitle = title.length > 55 ? title.substring(0, 55) + '...' : title
      const proxyUrl = `/crawl-api/proxy-image?url=${encodeURIComponent(imgUrl)}`

      results.push({
        id: `ddg-${results.length + 1}-${Date.now()}`,
        name: `${companyName}_${cat}_${results.length + 1}.jpg`,
        caption: cleanTitle || `${companyName} 공식 실사`,
        category: cat,
        url: proxyUrl,
        thumbnailUrl: proxyUrl,
        sourceDomain: r.source || '포털 실사',
        sourcePageUrl: r.url || '',
      })
      if (results.length >= 10) break
    }
    return results
  } catch {
    return []
  }
}

/**
 * 네이버 이미지 검색 (기업명 중심 정밀 필터링)
 */
async function searchNaver(
  companyName: string,
  query: string,
): Promise<CrawledPhoto[]> {
  try {
    const res = await fetch(
      `https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(6000),
      },
    )
    if (!res.ok) return []
    const html = await res.text()
    const items: CrawledPhoto[] = []
    const seen = new Set<string>()

    const re =
      /"originalUrl":"(https?:\/\/[^"]+?)","thumbnail":"(https?:\/\/[^"]+?)".*?"title":"([^"]*?)"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      const orig = m[1].replace(/\\/g, '')
      let title = m[3]
        ? m[3]
            .replace(/<[^>]+>/g, '')
            .replace(/\\u[\dA-F]{4}/gi, (match) =>
              String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)),
            )
            .trim()
        : ''

      // 타사 및 무관 사진 필터링
      if (isIrrelevantPhoto(title, orig, companyName)) continue

      if (!seen.has(orig)) {
        seen.add(orig)
        const cat = classifyCategory(title, orig)
        const proxyUrl = `/crawl-api/proxy-image?url=${encodeURIComponent(orig)}`
        const cleanTitle =
          title.length > 55 ? title.substring(0, 55) + '...' : title

        items.push({
          id: `naver-${items.length + 1}-${Date.now()}`,
          name: `${companyName}_${cat}_${items.length + 1}.jpg`,
          caption: cleanTitle || `${companyName} 관련 현장 실사`,
          category: cat,
          url: proxyUrl,
          thumbnailUrl: proxyUrl,
          sourceDomain: '포털 실사',
          sourcePageUrl: orig,
        })
      }
      if (items.length >= 10) break
    }
    return items
  } catch {
    return []
  }
}

/**
 * 전혀 다른 타사 사진, 외국인 모델, 뉴스 인물 사진, 채용 로고 등을 엄격하게 걸러내는 필터
 */
function isIrrelevantPhoto(
  title: string,
  url: string,
  targetCompanyName: string,
): boolean {
  const t = (title || '').toLowerCase()
  const u = (url || '').toLowerCase()

  // 1. 외국인 모델 / 스톡 포토 / 아이콘 / 벡터 그래픽 차단
  if (
    u.includes('unsplash') ||
    u.includes('shutterstock') ||
    u.includes('getty') ||
    u.includes('stock') ||
    u.includes('vector') ||
    u.includes('clipart') ||
    u.includes('freepik') ||
    u.includes('pixabay')
  ) {
    return true
  }

  // 2. 채용 플랫폼 타사 로고 모음 차단
  if (
    u.includes('theteams.kr') ||
    u.includes('jobkorea') ||
    u.includes('saramin') ||
    u.includes('catch.co.kr') ||
    u.includes('wanted')
  ) {
    return true
  }

  // 3. 인물 단독/후원/기부/체결/인터뷰/부고 사진 차단
  if (
    /후원|기부|전달식|체결식|업무협약|mou|인터뷰|기자|대표이사|사장|취임|이임|부고|프로필|증명사진|ceo|portrait|person/i.test(
      t,
    )
  ) {
    return true
  }

  // 4. 명확한 타사 이름이 주어로 들어간 경우 차단
  const foreignCompanies = [
    '주성하이텍',
    '제일케미칼',
    '보원케미칼',
    '씨에이치엠',
    '아스타아이비에스',
    '농업회사법인',
    '동화약품',
    '삼진제약',
    '유한양행',
  ]
  for (const fc of foreignCompanies) {
    if (t.includes(fc) && !targetCompanyName.includes(fc)) {
      return true
    }
  }

  return false
}

/**
 * 텍스트 및 URL 컨텍스트 기반 카테고리 자동 분류
 */
function classifyCategory(text: string, url: string): CrawledPhoto['category'] {
  const c = `${text} ${url}`.toLowerCase()
  if (/연구|lab|분석|실험|원자|핵|science|rnd|r&d|개발|기술|시험|계측|화학/.test(c)) {
    return 'lab'
  }
  if (
    /공장|설비|plant|시설|reactor|제조|라인|line|process|자동화|원자로|장비|생산|챔버|스마트팩토리/.test(
      c,
    )
  ) {
    return 'facility'
  }
  if (
    /사옥|본사|전경|building|center|센터|캠퍼스|안내|오피스|외관|빌딩|사무소|본관/.test(
      c,
    )
  ) {
    return 'building'
  }
  if (/제품|원천|성과|product|solution|business|패키징|출하|소재|부품|원료|반도체/.test(c)) {
    return 'product'
  }
  if (/인증|특허|iso|cert|상장|수상|award|특례|표창|선정|규격/.test(c)) {
    return 'cert'
  }
  return 'building'
}

/**
 * 도메인으로부터 자연스러운 한국어/영문 회사명 추정
 */
function resolveCompanyHint(domain: string, target: string): string {
  const cleanDomain = domain.toLowerCase().replace(/^www\./, '')
  const mainPart = cleanDomain.split('.')[0]

  if (mainPart === 'geosan' || /거산/i.test(target)) return '거산'
  if (mainPart === 'kaeri' || /원자력/i.test(target)) return '한국원자력연구원'
  if (mainPart === 'samsung' || /삼성/i.test(target)) return '삼성전자'
  if (mainPart === 'hyundai' || /현대/i.test(target)) return '현대자동차'
  if (mainPart === 'kakao' || /카카오/i.test(target)) return '카카오'
  if (mainPart === 'naver' || /네이버/i.test(target)) return '네이버'
  if (mainPart === 'posco' || /포스코/i.test(target)) return '포스코'
  if (mainPart === 'hanwha' || /한화/i.test(target)) return '한화'
  if (mainPart === 'lgchem' || /lg화학/i.test(target)) return 'LG화학'
  if (mainPart === 'skhynix' || /sk하이닉스/i.test(target)) return 'SK하이닉스'

  if (target && !target.includes('.') && target.length < 20) {
    return target.trim()
  }

  return mainPart.toUpperCase()
}

/**
 * 특정 웹 사이트 URL 또는 키워드로부터 기업 고화질 사진을 크롤링 및 수집합니다.
 * 1. 회사 공식 사이트가 있는 경우 SSL 우회 및 서브페이지 딥 크롤링을 통해 사이트 실제 사진만 100% 수집
 * 2. 사이트 접속 실패 시에만 대형 플랫폼(Naver·Bing)에서 정밀 필터링하여 관련 실사 수집
 */
async function crawlWebsitePhotos(
  rawTarget: string,
  categoryFilter?: string,
): Promise<{
  companyTitle: string
  domain: string
  siteFetchSuccess: boolean
  sourceKind: 'website' | 'platform' | 'hybrid'
  photos: CrawledPhoto[]
}> {
  const target = rawTarget.trim()
  if (!target) {
    return {
      companyTitle: '',
      domain: '',
      siteFetchSuccess: false,
      sourceKind: 'platform',
      photos: [],
    }
  }

  const isUrl =
    /^https?:\/\//i.test(target) ||
    /^www\./i.test(target) ||
    /\.[a-z]{2,}(\/.*)?$/i.test(target)
  let targetUrl = target
  if (isUrl) {
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }
  }

  let domain = 'web'
  let baseUrl = ''
  if (isUrl) {
    try {
      const parsed = new URL(targetUrl)
      baseUrl = parsed.origin
      domain = parsed.hostname.replace(/^www\./, '')
    } catch {
      // URL 파싱 실패 시
    }
  }

  let companyTitle = resolveCompanyHint(domain, target)
  const collected: CrawledPhoto[] = []
  const seenUrls = new Set<string>()
  let siteFetchSuccess = false

  // 1. [회사 사이트가 있는 경우] 공식 홈페이지 및 주요 서브페이지 직접 크롤링
  if (isUrl && baseUrl) {
    try {
      // robustFetch로 SSL 인증서 불일치 우회 및 실제 HTML 수신
      const res = await robustFetch(targetUrl, 7000)

      if (res.ok) {
        siteFetchSuccess = true
        const html = await res.text()

        // 실제 타이틀 추출 (예: '거산전자', '한국원자력연구원')
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (titleMatch) {
          const rawTitle = titleMatch[1]
            .replace(/[-|_|–|•|·|\|].*$/, '')
            .replace(/홈페이지|공식|환영합니다|welcome/gi, '')
            .trim()
          if (rawTitle.length >= 2) companyTitle = rawTitle
        }

        const addCandidate = (
          rawSrc: string,
          captionHint: string,
          pageSourceUrl = targetUrl,
        ) => {
          if (!rawSrc || typeof rawSrc !== 'string') return
          const cleanSrc = rawSrc.trim().replace(/&amp;/g, '&')
          if (cleanSrc.startsWith('data:') || cleanSrc.length < 4) return

          let fullUrl = ''
          try {
            fullUrl = new URL(cleanSrc, baseUrl).toString()
          } catch {
            return
          }

          if (seenUrls.has(fullUrl)) return

          const lower = fullUrl.toLowerCase()
          // 불필요한 아이콘, 배너, 닫기/플레이 버튼, 픽셀 제외
          if (
            lower.includes('favicon') ||
            lower.includes('icon') ||
            lower.includes('bullet') ||
            lower.includes('arrow') ||
            lower.includes('btn_') ||
            lower.includes('play.png') ||
            lower.includes('stop.png') ||
            lower.includes('close.') ||
            lower.includes('blank.gif') ||
            lower.includes('spacer') ||
            lower.includes('1x1') ||
            lower.includes('logo_small') ||
            lower.endsWith('.svg') ||
            lower.endsWith('.ico')
          ) {
            return
          }

          seenUrls.add(fullUrl)

          let caption = (captionHint || '').replace(/\s+/g, ' ').trim()
          if (caption.length > 60) {
            caption = caption.substring(0, 60) + '...'
          }

          const urlFilename = fullUrl.split('/').pop()?.split('?')[0] || ''
          let decodedFilename = ''
          try {
            decodedFilename = decodeURIComponent(urlFilename)
          } catch {
            decodedFilename = urlFilename
          }

          if (
            !decodedFilename ||
            decodedFilename.length < 3 ||
            decodedFilename.toLowerCase().includes('filedownload') ||
            decodedFilename.toLowerCase().includes('image')
          ) {
            decodedFilename = `${companyTitle}_공식사진_${collected.length + 1}.jpg`
          }

          if (!caption || caption.length < 2 || caption === '닫기') {
            caption = `${companyTitle} ${decodedFilename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')}`
          }

          const category = classifyCategory(caption, fullUrl)

          // 브라우저에서 안전하게 로드되도록 프록시 URL 적용
          const proxyUrl = `/crawl-api/proxy-image?url=${encodeURIComponent(fullUrl)}`

          collected.push({
            id: `site-${domain}-${collected.length + 1}`,
            name: decodedFilename,
            caption: caption,
            category: category,
            url: proxyUrl,
            thumbnailUrl: proxyUrl,
            sourceDomain: domain,
            sourcePageUrl: pageSourceUrl,
          })
        }

        // A. 메인 배너 및 비주얼 이미지 (우선순위 최고)
        const bannerRegex =
          /(?:src|data-src)=["']([^"']*(?:banner|visual|main|slide|hero)[^"']*\.(?:jpe?g|png|webp))["']/gi
        let bMatch: RegExpExecArray | null
        while ((bMatch = bannerRegex.exec(html)) !== null) {
          addCandidate(bMatch[1], `${companyTitle} 공식 메인 비주얼`)
        }

        // B. OG Image & Twitter Image
        const ogMatch =
          html.match(
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
          ) ||
          html.match(
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
          )
        if (ogMatch) {
          addCandidate(ogMatch[1], `${companyTitle} 공식 대표 이미지`)
        }

        // C. 모든 <img> 태그 (src, data-src, data-original, data-lazy 등)
        const imgRegex =
          /<img[^>]+(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi
        let match: RegExpExecArray | null
        while ((match = imgRegex.exec(html)) !== null) {
          const src = match[1]
          const altMatch = match[0].match(/alt=["']([^"']*)["']/i)
          const alt = altMatch ? altMatch[1] : ''
          addCandidate(src, alt)
        }

        // D. 배경 이미지 (background-image: url(...))
        const bgRegex = /url\(['"]?([^'"()]+?\.(?:jpe?g|png|webp))['"]?\)/gi
        let bgMatch: RegExpExecArray | null
        while ((bgMatch = bgRegex.exec(html)) !== null) {
          addCandidate(bgMatch[1], `${companyTitle} 시설 및 사옥 전경`)
        }

        // E. 서브페이지 탐색 (회사소개/설비/연구/제품 페이지 링크 최대 3개 추가 탐색)
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
        const subLinks: { url: string; label: string }[] = []
        let linkMatch: RegExpExecArray | null
        while ((linkMatch = linkRegex.exec(html)) !== null) {
          const href = linkMatch[1]
          const label = linkMatch[2].replace(/<[^>]+>/g, '').trim()
          if (
            /회사소개|설비|공장|연구|기술|제품|사옥|about|company|facility|plant|rnd|product|business/i.test(
              label + ' ' + href,
            ) &&
            !href.startsWith('#') &&
            !href.startsWith('javascript:')
          ) {
            try {
              const fullSub = new URL(href, baseUrl).toString()
              if (
                fullSub.startsWith(baseUrl) &&
                !subLinks.some((s) => s.url === fullSub)
              ) {
                subLinks.push({ url: fullSub, label })
              }
            } catch {}
          }
          if (subLinks.length >= 3) break
        }

        // 서브페이지에서 실제 추가 사진 크롤링 (병렬)
        await Promise.all(
          subLinks.map(async (sub) => {
            try {
              const subRes = await robustFetch(sub.url, 4000)
              if (subRes.ok) {
                const subHtml = await subRes.text()
                let sMatch: RegExpExecArray | null
                const sImgRegex =
                  /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi
                while ((sMatch = sImgRegex.exec(subHtml)) !== null) {
                  const altM = sMatch[0].match(/alt=["']([^"']*)["']/i)
                  addCandidate(
                    sMatch[1],
                    altM?.[1] ? `${sub.label} - ${altM[1]}` : sub.label,
                    sub.url,
                  )
                  if (collected.length >= 24) break
                }
              }
            } catch {}
          }),
        )
      }
    } catch (err: any) {
      console.warn(
        `[Crawler] Failed to directly fetch ${targetUrl}:`,
        err.message,
      )
    }
  }

  // 2. 결과 판정 및 수집 정책
  // 공식 사이트에서 3장 이상의 실사 사진이 정상 수집된 경우:
  // 100% 공식 사이트 실제 사진만 반환 (외부 검색 결과가 섞이지 않도록 차단)
  if (siteFetchSuccess && collected.length >= 3) {
    let resultPhotos = collected
    if (categoryFilter && categoryFilter !== 'all') {
      const filtered = collected.filter((p) => p.category === categoryFilter)
      if (filtered.length > 0) {
        resultPhotos = filtered
      }
    }

    return {
      companyTitle: companyTitle || domain,
      domain: domain || 'web',
      siteFetchSuccess: true,
      sourceKind: 'website',
      photos: resultPhotos,
    }
  }

  // 3. [사이트가 없거나, 접속 실패 시] 대형 검색 플랫폼에서 해당 기업 정밀 실사 수집
  let sourceKind: 'website' | 'platform' | 'hybrid' = siteFetchSuccess
    ? 'hybrid'
    : 'platform'

  const searchQuery = companyTitle || domain || target
  const [naverResults, ddgResults] = await Promise.all([
    searchNaver(searchQuery, `${searchQuery} 사옥 공장 연구소`),
    searchDuckDuckGo(searchQuery, `${searchQuery} 사옥 공장`),
  ])

  const maxItems = Math.max(naverResults.length, ddgResults.length)
  for (let i = 0; i < maxItems && collected.length < 20; i++) {
    if (naverResults[i] && !seenUrls.has(naverResults[i].url)) {
      seenUrls.add(naverResults[i].url)
      collected.push(naverResults[i])
    }
    if (
      ddgResults[i] &&
      !seenUrls.has(ddgResults[i].url) &&
      collected.length < 20
    ) {
      seenUrls.add(ddgResults[i].url)
      collected.push(ddgResults[i])
    }
  }

  // 카테고리 필터링
  let resultPhotos = collected
  if (categoryFilter && categoryFilter !== 'all') {
    const filtered = collected.filter((p) => p.category === categoryFilter)
    if (filtered.length > 0) {
      resultPhotos = filtered
    }
  }

  return {
    companyTitle: companyTitle || domain,
    domain: domain || 'web',
    siteFetchSuccess,
    sourceKind,
    photos: resultPhotos,
  }
}

/**
 * 웹 사진 크롤러 및 이미지 프록시 Vite 플러그인
 */
function webPhotoCrawlerPlugin(): Plugin {
  return {
    name: 'web-photo-crawler-plugin',
    configureServer(server) {
      // [Security Hardening] 개발 서버 크롤러 SSRF 방어 가드
      const isSafeTargetUrl = (urlStr: string): boolean => {
        if (!urlStr || typeof urlStr !== 'string') return false
        const lower = urlStr.trim().toLowerCase()
        if (
          lower.startsWith('javascript:') ||
          lower.startsWith('data:') ||
          lower.startsWith('file:') ||
          lower.startsWith('gopher:') ||
          lower.startsWith('ftp:')
        ) {
          return false
        }
        try {
          const parsed = new URL(
            urlStr.startsWith('http://') || urlStr.startsWith('https://')
              ? urlStr
              : `https://${urlStr}`,
          )
          const host = parsed.hostname.toLowerCase()
          if (
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host === '0.0.0.0' ||
            host === '::1' ||
            host === '169.254.169.254' ||
            host.startsWith('10.') ||
            host.startsWith('192.168.') ||
            host.startsWith('127.')
          ) {
            return false
          }
        } catch {
          return false
        }
        return true
      }

      const handleCrawl = async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const reqUrl = new URL(req.url || '', 'http://localhost')
          const targetUrl = reqUrl.searchParams.get('url') || ''
          const category = reqUrl.searchParams.get('category') || 'all'

          if (!targetUrl.trim() || !isSafeTargetUrl(targetUrl)) {
            res.writeHead(400, {
              'Content-Type': 'application/json; charset=utf-8',
            })
            res.end(
              JSON.stringify({
                error: '유효하지 않거나 안전하지 않은 URL입니다. (외부 도메인만 허용)',
              }),
            )
            return
          }

          const result = await crawlWebsitePhotos(targetUrl, category)
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(JSON.stringify(result))
        } catch (err: any) {
          res.writeHead(500, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(
            JSON.stringify({
              error: err?.message || '크롤링 중 오류가 발생했습니다.',
            }),
          )
        }
      }

      const handleProxyImage = async (
        req: IncomingMessage,
        res: ServerResponse,
      ) => {
        try {
          const reqUrl = new URL(req.url || '', 'http://localhost')
          const imageUrl = reqUrl.searchParams.get('url') || ''

          if (!imageUrl || !isSafeTargetUrl(imageUrl)) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
            res.end('유효하지 않거나 안전하지 않은 이미지 URL입니다.')
            return
          }

          let refererOrigin = 'https://www.google.com/'
          try {
            const parsed = new URL(imageUrl)
            refererOrigin = parsed.origin + '/'
          } catch {}

          // robustFetchBuffer로 SSL 오류 없이 안전하게 이미지 버퍼 취득
          const imgResult = await robustFetchBuffer(imageUrl, refererOrigin, 9000)

          if (!imgResult.ok || imgResult.buffer.length === 0) {
            res.writeHead(imgResult.status || 502, {
              'Access-Control-Allow-Origin': '*',
            })
            res.end()
            return
          }

          res.writeHead(200, {
            'Content-Type': imgResult.contentType,
            'Content-Length': imgResult.buffer.length,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          })
          res.end(imgResult.buffer)
        } catch {
          res.writeHead(502, { 'Access-Control-Allow-Origin': '*' })
          res.end()
        }
      }

      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] || ''
        if (path === '/crawl-api/photos' || path === '/api/crawl-photos') {
          return void handleCrawl(req, res)
        }
        if (path === '/crawl-api/proxy-image' || path === '/api/proxy-image') {
          return void handleProxyImage(req, res)
        }
        next()
      })
    },
  }
}



// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), webPhotoCrawlerPlugin()],
    build: {
      // [Security Hardening] 프로덕션 빌드 시 원본 TypeScript 소스맵 노출 방지
      sourcemap: false,
    },
    server: {
      // contracts/contract.md 7절: 프론트/백엔드는 같은 origin이어야 한다.
      // 개발 서버에서는 /api 요청을 백엔드(VITE_API_URL)로 프록시해 같은 origin처럼 동작시킨다.
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          bypass(req) {
            if (
              req.url &&
              (req.url.startsWith('/api/crawl-photos') ||
                req.url.startsWith('/api/proxy-image'))
            ) {
              return req.url
            }
          },
        },
      },
    },
  }
})
