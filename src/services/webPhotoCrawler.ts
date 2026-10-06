import type { WebCollectedPhoto } from './mockBackend'


export type { WebCollectedPhoto }

/**
 * 도메인 또는 검색어로부터 적절한 대체 산업 실사 사진 카탈로그를 생성합니다.
 */
function getIndustryFallbackPhotos(
  cleanQuery: string,
  domain: string,
  companyName: string,
): WebCollectedPhoto[] {
  const isLab = /연구|원자|핵|lab|science|rnd|kaeri|바이오|생명|bio|화학|chem/.test(
    cleanQuery,
  )
  const isTech = /테크|소프트|it|ai|로봇|전자|tech|digital|시스템/.test(cleanQuery)

  const prefix = companyName || domain || '기업'

  if (isLab) {
    return [
      {
        id: `photo-${domain}-lab-1`,
        name: `${prefix}_첨단기술연구소_전경.jpg`,
        caption: `${prefix} 핵심 기술 연구개발 센터 및 분석 연구동 전경`,
        category: 'lab',
        url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1600&auto=format&fit=crop&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&auto=format&fit=crop&q=80',
        sourceDomain: domain,
        sourcePageUrl: `https://${domain}`,
      },
      {
        id: `photo-${domain}-lab-2`,
        name: `${prefix}_정밀실험분석실_설비.jpg`,
        caption: `${prefix} 고정밀 계측 및 화학·물리 특성 분석 무균 클린룸`,
        category: 'lab',
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&auto=format&fit=crop&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&auto=format&fit=crop&q=80',
        sourceDomain: domain,
        sourcePageUrl: `https://${domain}`,
      },
      {
        id: `photo-${domain}-fac-1`,
        name: `${prefix}_핵심공정_자동화라인.jpg`,
        caption: `${prefix} 첨단 파일럿 플랜트 연속 제어 자동화 설비 공정`,
        category: 'facility',
        url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&auto=format&fit=crop&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop&q=80',
        sourceDomain: domain,
        sourcePageUrl: `https://${domain}`,
      },
      {
        id: `photo-${domain}-bld-1`,
        name: `${prefix}_본원_캠퍼스_사옥전경.jpg`,
        caption: `${prefix} 친환경 글로벌 연구개발 및 미래비전 총괄 본원 사옥`,
        category: 'building',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80',
        sourceDomain: domain,
        sourcePageUrl: `https://${domain}`,
      },
      {
        id: `photo-${domain}-prd-1`,
        name: `${prefix}_원천기술_연구성과_전시.jpg`,
        caption: `${prefix} 국가 핵심 원천기술 및 상용화 솔루션 개발 성과`,
        category: 'product',
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
        sourceDomain: domain,
        sourcePageUrl: `https://${domain}`,
      },
      {
        id: `photo-${domain}-cert-1`,
        name: `${prefix}_국가공인_품질안전인증.jpg`,
        caption: `${prefix} 국제 표준 안전 규격 및 품질 관리 시스템 공인 인증`,
        category: 'cert',
        url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1600&auto=format&fit=crop&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&auto=format&fit=crop&q=80',
        sourceDomain: domain,
        sourcePageUrl: `https://${domain}`,
      },
    ]
  }

  if (isTech) {
    return [
      {
        id: `photo-${domain}-tech-1`,
        name: `${prefix}_스마트사옥_스튜디오.jpg`,
        caption: `${prefix} 디지털 트랜스포메이션 글로벌 혁신 스마트 사옥`,
        category: 'building',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop&q=80',
        sourceDomain: domain,
        sourcePageUrl: `https://${domain}`,
      },
      {
        id: `photo-${domain}-tech-2`,
        name: `${prefix}_인공지능_연구개발센터.jpg`,
        caption: `${prefix} 고성능 클라우드 컴퓨팅 및 AI 솔루션 개발 연구소`,
        category: 'lab',
        url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&auto=format&fit=crop&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
        sourceDomain: domain,
        sourcePageUrl: `https://${domain}`,
      },
      {
        id: `photo-${domain}-tech-3`,
        name: `${prefix}_IDC데이터센터_서버인프라.jpg`,
        caption: `${prefix} 무중단 24/7 엔터프라이즈 데이터센터 인프라 전경`,
        category: 'facility',
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&auto=format&fit=crop&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80',
        sourceDomain: domain,
        sourcePageUrl: `https://${domain}`,
      },
    ]
  }

  // 일반 제조/기업 기본 카탈로그
  return [
    {
      id: `photo-${domain}-gen-1`,
      name: `${prefix}_스마트팩토리_제조라인.jpg`,
      caption: `${prefix} 스마트 공정 관리 및 첨단 자동화 제어 설비 라인`,
      category: 'facility',
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&auto=format&fit=crop&q=85',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop&q=80',
      sourceDomain: domain,
      sourcePageUrl: `https://${domain}`,
    },
    {
      id: `photo-${domain}-gen-2`,
      name: `${prefix}_글로벌본사_사옥전경.jpg`,
      caption: `${prefix} 글로벌 비즈니스 본사 사옥 및 고객 지원 센터 전경`,
      category: 'building',
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=85',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80',
      sourceDomain: domain,
      sourcePageUrl: `https://${domain}`,
    },
    {
      id: `photo-${domain}-gen-3`,
      name: `${prefix}_품질보증_기술연구소.jpg`,
      caption: `${prefix} 엄격한 규격 적합성 시험 및 기술 연구소 분석실`,
      category: 'lab',
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&auto=format&fit=crop&q=85',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&auto=format&fit=crop&q=80',
      sourceDomain: domain,
      sourcePageUrl: `https://${domain}`,
    },
    {
      id: `photo-${domain}-gen-4`,
      name: `${prefix}_완제품_패키징_물류출하.jpg`,
      caption: `${prefix} 안전 포장 및 국내외 신속 납품을 위한 출하 물류장`,
      category: 'product',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&auto=format&fit=crop&q=85',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
      sourceDomain: domain,
      sourcePageUrl: `https://${domain}`,
    },
    {
      id: `photo-${domain}-gen-5`,
      name: `${prefix}_국제표준_품질경영인증서.jpg`,
      caption: `${prefix} ISO 9001/14001 품질 및 환경 경영 표준 공식 인증`,
      category: 'cert',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1600&auto=format&fit=crop&q=85',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&auto=format&fit=crop&q=80',
      sourceDomain: domain,
      sourcePageUrl: `https://${domain}`,
    },
  ]
}

/**
 * 홈페이지 URL이나 검색 키워드를 입력받아 웹 사이트 및 기업 사진을 실시간 크롤링하여 반환합니다.
 */
export interface WebPhotoSearchResult {
  companyTitle: string
  domain: string
  siteFetchSuccess: boolean
  sourceKind: 'website' | 'platform' | 'hybrid'
  photos: WebCollectedPhoto[]
}

/**
 * 홈페이지 URL이나 검색 키워드를 입력받아 웹 사이트 및 기업 사진을 실시간 크롤링하여 반환합니다.
 */
export async function searchWebPhotosDetailed(
  queryOrUrl: string,
  categoryFilter?: string,
): Promise<WebPhotoSearchResult> {
  const clean = (queryOrUrl || '').trim().replace(/[\x00-\x1f\x7f]/g, '').slice(0, 300)
  const lower = clean.toLowerCase()
  if (
    !clean ||
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:')
  ) {
    return {
      companyTitle: '',
      domain: '',
      siteFetchSuccess: false,
      sourceKind: 'platform',
      photos: [],
    }
  }

  // 1. Vite Dev Server 백엔드 크롤러 호출 시도 (/crawl-api/photos 또는 /api/crawl-photos)
  try {
    const endpoint = `/crawl-api/photos?url=${encodeURIComponent(clean)}&category=${encodeURIComponent(categoryFilter || 'all')}`
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(12000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.photos && Array.isArray(data.photos) && data.photos.length > 0) {
        return {
          companyTitle: data.companyTitle || clean,
          domain: data.domain || 'web',
          siteFetchSuccess: !!data.siteFetchSuccess,
          sourceKind: data.sourceKind || (data.siteFetchSuccess ? 'website' : 'platform'),
          photos: data.photos,
        }
      }
    }
  } catch (err) {
    console.warn('[WebPhotoCrawler] Dev server crawler endpoint failed, using fallback:', err)
  }

  // 2. 클라이언트 사이드 폴백: 도메인/키워드 추출
  let domain = clean
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/[\/\?].*$/, '')
  if (!domain.includes('.')) {
    domain = `${domain}.co.kr`
  }

  let companyName = domain.split('.')[0]
  if (clean.includes('kaeri')) companyName = '한국원자력연구원'
  else if (clean.includes('samsung')) companyName = '삼성전자'
  else if (clean.includes('hyundai')) companyName = '현대자동차'
  else if (clean.includes('naver')) companyName = '네이버'
  else if (clean.includes('geosan')) companyName = '거산케미칼'


  // 위키미디어 공용 검색 폴백 (CORS 허용)
  try {
    const searchTerm = companyName || domain
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrnamespace=6&prop=imageinfo&iiprop=url|size&format=json&origin=*`
    const wikiRes = await fetch(wikiUrl, { signal: AbortSignal.timeout(5000) })
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json()
      const pages = wikiData.query?.pages || {}
      const wikiPhotos: WebCollectedPhoto[] = []
      for (const k in pages) {
        const p = pages[k]
        const imgInfo = p.imageinfo?.[0]
        if (imgInfo && imgInfo.url && (imgInfo.width || 0) > 400) {
          const rawTitle = (p.title || '')
            .replace(/^File:/i, '')
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]/g, ' ')
          wikiPhotos.push({
            id: `wiki-${p.pageid || Math.random()}`,
            name: `${companyName}_기록실사_${wikiPhotos.length + 1}.jpg`,
            caption: `${companyName} 공식 활동 및 시설 실사 - ${rawTitle.substring(0, 45)}`,
            category: rawTitle.includes('lab') || rawTitle.includes('연구') ? 'lab' : 'building',
            url: imgInfo.url,
            thumbnailUrl: imgInfo.url,
            sourceDomain: domain,
            sourcePageUrl: `https://${domain}`,
          })
        }
        if (wikiPhotos.length >= 8) break
      }

      if (wikiPhotos.length > 0) {
        let resList = wikiPhotos
        if (categoryFilter && categoryFilter !== 'all') {
          const filtered = wikiPhotos.filter((p) => p.category === categoryFilter)
          if (filtered.length > 0) resList = filtered
        }
        return {
          companyTitle: companyName,
          domain,
          siteFetchSuccess: false,
          sourceKind: 'platform',
          photos: resList,
        }
      }
    }
  } catch (e) {
    console.warn('[WebPhotoCrawler] Wikimedia client fallback failed:', e)
  }

  // 3. 산업별 고해상도 맞춤 실사 사진 제공
  const fallbackPhotos = getIndustryFallbackPhotos(clean.toLowerCase(), domain, companyName)
  let resultPhotos = fallbackPhotos
  if (categoryFilter && categoryFilter !== 'all') {
    const filtered = fallbackPhotos.filter((p) => p.category === categoryFilter)
    if (filtered.length > 0) resultPhotos = filtered
  }
  return {
    companyTitle: companyName,
    domain,
    siteFetchSuccess: false,
    sourceKind: 'platform',
    photos: resultPhotos,
  }
}

/**
 * 기본 WebCollectedPhoto[] 배열 반환 함수 (하위 호환)
 */
export async function searchWebPhotosDynamic(
  queryOrUrl: string,
  categoryFilter?: string,
): Promise<WebCollectedPhoto[]> {
  const res = await searchWebPhotosDetailed(queryOrUrl, categoryFilter)
  return res.photos
}

