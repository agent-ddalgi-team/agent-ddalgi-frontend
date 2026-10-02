import type { IncomingMessage, ServerResponse } from 'node:http'
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

/**
 * 특정 웹 사이트 URL 또는 키워드로부터 기업 고화질 사진을 크롤링 및 수집합니다.
 */
/**
 * DuckDuckGo 고화질 이미지 검색 (글로벌/Bing/Web 인덱스 집계)
 */
async function searchDuckDuckGo(query: string): Promise<CrawledPhoto[]> {
  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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

    return list.map((r: any, idx: number) => {
      const title = (r.title || query).replace(/<[^>]+>/g, '').trim()
      const cat = classifyCategory(title, r.image || '')
      return {
        id: `ddg-${idx + 1}-${Date.now()}`,
        name: `${query}_${cat}_${idx + 1}.jpg`,
        caption: title.length > 70 ? title.substring(0, 70) + '...' : title,
        category: cat,
        url: r.image,
        thumbnailUrl: r.thumbnail || r.image,
        sourceDomain: r.source || 'duckduckgo.com',
        sourcePageUrl: r.url || '',
      }
    })
  } catch {
    return []
  }
}

/**
 * 네이버 이미지 검색 (국내 기업/설비/사옥/시설 기사 및 공식 사진 크롤링)
 */
async function searchNaver(query: string): Promise<CrawledPhoto[]> {
  try {
    const res = await fetch(
      `https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
      const thumb = m[2].replace(/\\/g, '')
      let title = m[3]
        ? m[3]
            .replace(/<[^>]+>/g, '')
            .replace(/\\u[\dA-F]{4}/gi, (match) =>
              String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)),
            )
            .trim()
        : query
      if (title.length > 70) title = title.substring(0, 70) + '...'

      if (!seen.has(orig)) {
        seen.add(orig)
        const cat = classifyCategory(title, orig)
        items.push({
          id: `naver-${items.length + 1}-${Date.now()}`,
          name: `${query}_${cat}_${items.length + 1}.jpg`,
          caption: title || `${query} 관련 현장 실사`,
          category: cat,
          url: orig,
          thumbnailUrl: thumb,
          sourceDomain: 'naver.com',
          sourcePageUrl: orig,
        })
      }
      if (items.length >= 20) break
    }

    if (items.length === 0) {
      const re2 = /"(https?:\/\/[^"]+?\.(?:jpe?g|png|webp))"/gi
      while ((m = re2.exec(html)) !== null) {
        const u = m[1]
        if (
          !u.includes('static.naver') &&
          !u.includes('sstatic') &&
          !seen.has(u)
        ) {
          seen.add(u)
          const cat = classifyCategory(query, u)
          items.push({
            id: `naver-${items.length + 1}-${Date.now()}`,
            name: `${query}_${cat}_${items.length + 1}.jpg`,
            caption: `${query} 관련 실사`,
            category: cat,
            url: u,
            thumbnailUrl: u,
            sourceDomain: 'naver.com',
            sourcePageUrl: u,
          })
        }
        if (items.length >= 15) break
      }
    }
    return items
  } catch {
    return []
  }
}

/**
 * 텍스트 및 URL 컨텍스트 기반 카테고리 자동 분류
 */
function classifyCategory(text: string, url: string): CrawledPhoto['category'] {
  const c = `${text} ${url}`.toLowerCase()
  if (/연구|lab|분석|실험|원자|핵|science|rnd|r&d|개발|기술|시험|계측/.test(c)) {
    return 'lab'
  }
  if (
    /공장|설비|plant|시설|reactor|제조|라인|line|process|자동화|원자로|장비|생산|챔버/.test(
      c,
    )
  ) {
    return 'facility'
  }
  if (
    /사옥|본사|전경|building|center|센터|캠퍼스|안내|오피스|외관|빌딩|사무소/.test(
      c,
    )
  ) {
    return 'building'
  }
  if (/제품|원천|성과|product|solution|business|패키징|출하|소재|부품|원료/.test(c)) {
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

  if (mainPart === 'geosan' || /거산/i.test(target)) return '거산케미칼'
  if (mainPart === 'kaeri' || /원자력/i.test(target)) return '한국원자력연구원'
  if (mainPart === 'samsung' || /삼성/i.test(target)) return '삼성전자'
  if (mainPart === 'hyundai' || /현대/i.test(target)) return '현대자동차'
  if (mainPart === 'kakao' || /카카오/i.test(target)) return '카카오'
  if (mainPart === 'naver' || /네이버/i.test(target)) return '네이버'
  if (mainPart === 'posco' || /포스코/i.test(target)) return '포스코'
  if (mainPart === 'hanwha' || /한화/i.test(target)) return '한화'
  if (mainPart === 'lgchem' || /lg화학/i.test(target)) return 'LG화학'
  if (mainPart === 'lgenergysolution' || /lg에너지솔루션/i.test(target))
    return 'LG에너지솔루션'
  if (mainPart === 'skhynix' || /sk하이닉스/i.test(target)) return 'SK하이닉스'

  if (target && !target.includes('.') && target.length < 20) {
    return target.trim()
  }

  return mainPart.toUpperCase()
}

/**
 * 특정 웹 사이트 URL 또는 키워드로부터 기업 고화질 사진을 크롤링 및 수집합니다.
 * 회사 공식 사이트가 있는 경우 사이트 내 실사 사진들을 우선 수집하고,
 * 회사 사이트가 없거나(접속 실패 등) 사진이 부족한 경우 대형 플랫폼(Google·Naver·Bing)에서 자동 수집합니다.
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
      // URL 파싱 실패 시 키워드 모드로 전환
    }
  }

  let companyTitle = resolveCompanyHint(domain, target)
  const collected: CrawledPhoto[] = []
  const seenUrls = new Set<string>()
  let siteFetchSuccess = false

  // 1. [회사 사이트가 있는 경우] 공식 홈페이지 및 주요 서브페이지 직접 크롤링
  if (isUrl && baseUrl) {
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(7000),
      })

      if (res.ok) {
        siteFetchSuccess = true
        const html = await res.text()

        // 제목 추출 (예: '한국원자력연구원')
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (titleMatch) {
          const rawTitle = titleMatch[1]
            .replace(/[-|_|–|•|·|\|].*$/, '')
            .replace(/홈페이지|공식|환영합니다/g, '')
            .trim()
          if (rawTitle.length >= 2) companyTitle = rawTitle
        }

        const addCandidate = (rawSrc: string, captionHint: string) => {
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
          // 불필요한 아이콘, 배너, 닫기 버튼, 픽셀 제외
          if (
            lower.includes('favicon') ||
            lower.includes('icon') ||
            lower.includes('bullet') ||
            lower.includes('arrow') ||
            lower.includes('btn_') ||
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

          // 단순 경고/사칭/공지 팝업 제외
          const captionLower = (captionHint || '').toLowerCase()
          if (
            captionLower.includes('사기') ||
            captionLower.includes('사칭') ||
            captionLower.includes('주의') ||
            captionLower.includes('보호주간') ||
            lower.includes('popupwindow')
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
            decodedFilename = `${companyTitle}_사진_${collected.length + 1}.jpg`
          }

          if (!caption || caption.length < 2 || caption === '닫기') {
            caption = `${companyTitle} ${decodedFilename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')}`
          }

          const category = classifyCategory(caption, fullUrl)

          collected.push({
            id: `site-${domain}-${collected.length + 1}`,
            name: decodedFilename,
            caption: caption,
            category: category,
            url: fullUrl,
            thumbnailUrl: fullUrl,
            sourceDomain: domain,
            sourcePageUrl: targetUrl,
          })
        }

        // A. OG Image & Twitter Image
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

        // B. 메인 슬라이드 및 리스트 내 이미지
        const slideImgRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
        let liMatch: RegExpExecArray | null
        while ((liMatch = slideImgRegex.exec(html)) !== null) {
          const liContent = liMatch[1]
          const imgMatch = liContent.match(
            /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/i,
          )
          if (imgMatch) {
            const src = imgMatch[1]
            let captionText = ''
            const strongMatch = liContent.match(
              /<strong[^>]*>([\s\S]*?)<\/strong>/i,
            )
            const descMatch = liContent.match(
              /<span[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
            )
            if (strongMatch) {
              captionText = strongMatch[1].replace(/<[^>]+>/g, '').trim()
            }
            if (descMatch) {
              const descText = descMatch[1].replace(/<[^>]+>/g, '').trim()
              captionText = captionText
                ? `${captionText} - ${descText}`
                : descText
            }
            if (!captionText) {
              const altMatch = imgMatch[0].match(/alt=["']([^"']*)["']/i)
              captionText = altMatch ? altMatch[1].trim() : ''
            }
            addCandidate(src, captionText)
          }
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

        // E. 서브페이지 탐색 (소개/설비/연구/제품 페이지 링크 최대 2개 추가 탐색)
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
        const subLinks: { url: string; label: string }[] = []
        let linkMatch: RegExpExecArray | null
        while ((linkMatch = linkRegex.exec(html)) !== null) {
          const href = linkMatch[1]
          const label = linkMatch[2].replace(/<[^>]+>/g, '').trim()
          if (
            /회사소개|설비|공장|연구|기술|제품|사옥|about|company|facility|plant|rnd|product/i.test(
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
          if (subLinks.length >= 2) break
        }

        // 서브페이지에서 추가 사진 크롤링 (병렬)
        await Promise.all(
          subLinks.map(async (sub) => {
            try {
              const subRes = await fetch(sub.url, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  Accept:
                    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                signal: AbortSignal.timeout(4000),
              })
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
                  )
                  if (collected.length >= 24) break
                }
              }
            } catch {}
          }),
        )
      }
    } catch (err: any) {
      console.warn(`[Crawler] Failed to directly fetch ${targetUrl}:`, err.message)
    }
  }

  // 2. [회사 사이트가 없거나, 접근 불가하거나, 사진이 부족한 경우] 대형 플랫폼(Google·Naver·Bing)에서 실사 사진 수집
  let sourceKind: 'website' | 'platform' | 'hybrid' = siteFetchSuccess
    ? 'website'
    : 'platform'

  if (collected.length < 8) {
    const searchQuery = companyTitle || domain || target
    const [ddgResults, naverResults] = await Promise.all([
      searchDuckDuckGo(`${searchQuery} 회사`),
      searchNaver(searchQuery),
    ])

    if (siteFetchSuccess && collected.length > 0) {
      sourceKind = 'hybrid'
    } else {
      sourceKind = 'platform'
    }

    const maxItems = Math.max(ddgResults.length, naverResults.length)
    for (let i = 0; i < maxItems && collected.length < 20; i++) {
      if (ddgResults[i] && !seenUrls.has(ddgResults[i].url)) {
        seenUrls.add(ddgResults[i].url)
        collected.push(ddgResults[i])
      }
      if (
        naverResults[i] &&
        !seenUrls.has(naverResults[i].url) &&
        collected.length < 20
      ) {
        seenUrls.add(naverResults[i].url)
        collected.push(naverResults[i])
      }
    }
  }

  // 3. 카테고리 필터링 적용 (all이 아닌 경우)
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
      const handleCrawl = async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const reqUrl = new URL(req.url || '', 'http://localhost')
          const targetUrl = reqUrl.searchParams.get('url') || ''
          const category = reqUrl.searchParams.get('category') || 'all'

          if (!targetUrl.trim()) {
            res.writeHead(400, {
              'Content-Type': 'application/json; charset=utf-8',
            })
            res.end(JSON.stringify({ error: 'URL 또는 검색어가 비어있습니다.' }))
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

          if (!imageUrl) {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('Missing image url')
            return
          }

          let refererOrigin = 'https://www.google.com/'
          try {
            const parsed = new URL(imageUrl)
            refererOrigin = parsed.origin + '/'
          } catch {}

          const imgRes = await fetch(imageUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept:
                'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              Referer: refererOrigin,
            },
            signal: AbortSignal.timeout(9000),
          })

          if (!imgRes.ok) {
            res.writeHead(imgRes.status, { 'Access-Control-Allow-Origin': '*' })
            res.end()
            return
          }

          const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
          const buffer = Buffer.from(await imgRes.arrayBuffer())

          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': buffer.length,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          })
          res.end(buffer)
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
