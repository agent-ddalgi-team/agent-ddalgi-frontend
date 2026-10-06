import type { WebCollectedPhoto } from './mockBackend'
export type { WebCollectedPhoto }

export interface WebPhotoSearchResult {
  companyTitle: string
  domain: string
  siteFetchSuccess: boolean
  sourceKind: 'website' | 'platform' | 'hybrid'
  photos: WebCollectedPhoto[]
}

export async function searchWebPhotosDetailed(
  queryOrUrl: string,
  categoryFilter?: string,
): Promise<WebPhotoSearchResult> {
  const clean = queryOrUrl
    .trim()
    .split('')
    .filter(
      (character) =>
        character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127,
    )
    .join('')
    .slice(0, 300)
  if (!clean || /^(javascript|data|file|vbscript|gopher|ftp):/i.test(clean))
    throw new Error('검색어 또는 올바른 웹 주소를 입력해 주세요.')
  const endpoint =
    '/crawl-api/photos?url=' +
    encodeURIComponent(clean) +
    '&category=' +
    encodeURIComponent(categoryFilter || 'all')
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(12000) })
  if (
    !response.ok ||
    !response.headers.get('content-type')?.includes('application/json')
  )
    throw new Error(
      '웹 사진 수집 서버에 연결할 수 없습니다. 원본 사진을 직접 첨부해 주세요.',
    )
  const data = await response.json()
  if (
    !Array.isArray(data?.photos) ||
    !['website', 'platform', 'hybrid'].includes(data.sourceKind)
  )
    throw new Error('사진 검색 결과 형식을 확인할 수 없습니다.')
  // Empty results remain empty; never substitute stock images for company photos.
  return data as WebPhotoSearchResult
}

export async function searchWebPhotosDynamic(
  queryOrUrl: string,
  categoryFilter?: string,
): Promise<WebCollectedPhoto[]> {
  return (await searchWebPhotosDetailed(queryOrUrl, categoryFilter)).photos
}
