export interface WebCollectedPhoto {
  id: string
  name: string
  caption: string
  category: 'facility' | 'lab' | 'building' | 'product' | 'cert'
  url: string
  thumbnailUrl: string
  sourceDomain: string
  sourcePageUrl: string
}

// 이전 사진 수집 UI와의 타입 호환만 유지한다. 고정 예시 자료는 제공하지 않는다.
export const CURATED_ENTERPRISE_PHOTOS: WebCollectedPhoto[] = []

export async function searchWebPhotos(
  queryOrUrl: string,
  categoryFilter?: string,
): Promise<WebCollectedPhoto[]> {
  void queryOrUrl
  void categoryFilter
  throw new Error('웹 사진 수집은 연결되지 않았습니다. 서버에 등록된 사진이나 직접 첨부한 사진을 사용해 주세요.')
}
