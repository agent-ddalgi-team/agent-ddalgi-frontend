import React, { useState } from 'react'
import {
  Check,
  CheckCircle2,
  CheckSquare,
  Globe,
  Image as ImageIcon,
  Info,
  Loader2,
  Search,
  Sparkles,
  Square,
} from 'lucide-react'
import {
  CURATED_ENTERPRISE_PHOTOS,
  searchWebPhotosWithDetail,
  type WebCollectedPhoto,
  type WebPhotoSearchResult,
} from '../../services/mockBackend'

interface WebPhotoCollectorProps {
  companyName: string
  onAddPhotos: (photos: WebCollectedPhoto[]) => void
  disabled?: boolean
}

const CATEGORY_TAGS = [
  { id: 'all', label: '전체 보기' },
  { id: 'facility', label: '🏭 스마트 공장·설비' },
  { id: 'lab', label: '🔬 연구소·분석실' },
  { id: 'building', label: '🏢 본사 사옥 전경' },
  { id: 'product', label: '📦 제품·패키징' },
  { id: 'cert', label: '📜 품질 인증서' },
]

export const WebPhotoCollector: React.FC<WebPhotoCollectorProps> = ({
  companyName = '거산케미칼',
  onAddPhotos,
  disabled = false,
}) => {
  const [query, setQuery] = useState(companyName)
  const [category, setCategory] = useState('all')
  const [isSearching, setIsSearching] = useState(false)
  const [photos, setPhotos] = useState<WebCollectedPhoto[]>(
    CURATED_ENTERPRISE_PHOTOS,
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(CURATED_ENTERPRISE_PHOTOS.slice(0, 4).map((p) => p.id)),
  )
  const [lastResultMeta, setLastResultMeta] =
    useState<WebPhotoSearchResult | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'info' | 'warning'
    text: string
  } | null>(null)

  // [Security Hardening] 위험 스킴(javascript:, data:, file:) 및 비정상 입력 차단
  const validateWebQueryOrUrl = (
    raw: string,
  ): { valid: boolean; clean: string; error?: string } => {
    const trimmed = raw
      .trim()
      .split('')
      .filter(
        (character) =>
          character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127,
      )
      .join('')
      .slice(0, 300)
    if (!trimmed) {
      return {
        valid: false,
        clean: '',
        error: '검색어 또는 URL을 입력해 주세요.',
      }
    }

    const lower = trimmed.toLowerCase()
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('file:') ||
      lower.startsWith('vbscript:')
    ) {
      return {
        valid: false,
        clean: '',
        error:
          '보안상 허용되지 않는 위험한 프로토콜(javascript, data, file)입니다. 일반 웹 주소(http/https) 또는 기업명을 입력해 주세요.',
      }
    }

    return { valid: true, clean: trimmed }
  }

  // 웹 사진 검색 / 크롤링 실행 핸들러
  const handleSearch = async (
    targetQuery = query,
    targetCategory = category,
  ) => {
    const check = validateWebQueryOrUrl(targetQuery)
    if (!check.valid) {
      if (check.error) {
        setFeedback({
          type: 'warning',
          text: check.error,
        })
      }
      return
    }

    const q = check.clean
    setIsSearching(true)
    setFeedback(null)

    try {
      const res = await searchWebPhotosWithDetail(q, targetCategory)
      setLastResultMeta(res)
      setPhotos(res.photos)
      // 검색 결과의 상위 4개를 기본 선택
      setSelectedIds(
        new Set(
          res.photos.slice(0, Math.min(4, res.photos.length)).map((p) => p.id),
        ),
      )

      if (!res.photos.length) {
        setFeedback({
          type: 'info',
          text: '검색된 사진이 없습니다. 원본 사진을 직접 첨부해 주세요.',
        })
      } else if (res.sourceKind === 'website') {
        setFeedback({
          type: 'success',
          text: `🌐 [공식 웹사이트 크롤링] ${res.domain}에서 시설·사옥·연구소 관련 실사 사진 ${res.photos.length}건을 성공적으로 수집했습니다.`,
        })
      } else if (res.sourceKind === 'hybrid') {
        setFeedback({
          type: 'success',
          text: `🌐 [하이브리드 수집] ${res.domain} 공식 사이트 및 대형 플랫폼(Google·Naver·Bing)에서 관련 실사 사진 ${res.photos.length}건을 수집했습니다.`,
        })
      } else {
        setFeedback({
          type: 'info',
          text: `🔍 [대형 플랫폼 실시간 탐색] 회사 웹사이트가 없거나 접근이 어려워 대형 플랫폼(Google·Naver·Bing)에서 "${res.companyTitle || q}" 관련 고화질 실사 사진 ${res.photos.length}건을 자동 수집했습니다.`,
        })
      }
    } catch (cause) {
      setPhotos([])
      setSelectedIds(new Set())
      setLastResultMeta(null)
      setFeedback({
        type: 'warning',
        text:
          cause instanceof Error ? cause.message : '사진 검색에 실패했습니다.',
      })
    } finally {
      setIsSearching(false)
    }
  }

  // 전체 선택/해제 토글
  const handleToggleAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)))
    }
  }

  // 개별 사진 선택 토글
  const handleTogglePhoto = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 선택한 사진들을 첨부 자료 목록에 자동 등록
  const handleConfirmAdd = () => {
    const chosen = photos.filter((p) => selectedIds.has(p.id))
    if (!chosen.length) return
    onAddPhotos(chosen)
    setFeedback({
      type: 'success',
      text: `✓ 선택한 사진 ${chosen.length}건이 이번 작업의 첨부 자료로 자동 등록되었습니다.`,
    })
    setTimeout(() => setFeedback(null), 4000)
  }

  // 카테고리 라벨 헬퍼
  const getCategoryBadge = (cat: WebCollectedPhoto['category']) => {
    switch (cat) {
      case 'facility':
        return '🏭 설비'
      case 'lab':
        return '🔬 연구'
      case 'building':
        return '🏢 사옥'
      case 'product':
        return '📦 제품'
      case 'cert':
        return '📜 인증'
      default:
        return '🏢 일반'
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-teal-200/80 bg-gradient-to-br from-[#F0FDFA] to-white p-4 shadow-xs">
      {/* 1. 패널 상단 타이틀 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007A78] text-white shadow-2xs">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>웹 사이트 & 회사 홈페이지 사진 자동 수집기</span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-teal-100 px-2 py-0.2 text-[9px] font-bold text-[#007A78]">
                <Sparkles className="h-2.5 w-2.5" />
                AI 실시간 크롤링
              </span>
            </h3>
            <p className="text-[10px] text-slate-500">
              회사 공식 사이트가 있는 경우 사이트 내 실제 사진을 우선 수집하고,
              사이트가 없으면 구글·네이버·Bing 등 대형 플랫폼에서 관련 고화질
              실사 사진을 자동 수집합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 2. URL/키워드 입력창 & 수집 버튼 */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && void handleSearch(query, category)
              }
              placeholder="회사 홈페이지 URL (예: https://www.kaeri.re.kr) 또는 기업명 입력"
              maxLength={300}
              autoComplete="off"
              disabled={disabled || isSearching}
              className="w-full rounded-xl border border-teal-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 focus:border-[#007A78] focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 disabled:bg-slate-100"
            />
            {query && !isSearching && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs cursor-pointer"
                title="입력 내용 지우기"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleSearch(query, category)}
            disabled={disabled || isSearching || !query.trim()}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#007A78] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#006663] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>실시간 수집 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>사진 자동 수집</span>
              </>
            )}
          </button>
        </div>

        {/* 빠른 추천 키워드 / URL 샘플 */}
        <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
          <span className="text-slate-400 font-medium">추천 예시:</span>
          <button
            type="button"
            onClick={() => {
              const u = 'https://www.kaeri.re.kr'
              setQuery(u)
              void handleSearch(u, category)
            }}
            className="rounded-md bg-teal-50 border border-teal-200/60 px-1.5 py-0.5 text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
          >
            한국원자력연구원(공식사이트)
          </button>
          <button
            type="button"
            onClick={() => {
              const u = 'https://www.geosan.co.kr'
              setQuery(u)
              void handleSearch(u, category)
            }}
            className="rounded-md bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            거산케미칼(대형플랫폼 탐색)
          </button>
          <button
            type="button"
            onClick={() => {
              const u = '카카오'
              setQuery(u)
              void handleSearch(u, category)
            }}
            className="rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            카카오(키워드 검색)
          </button>
        </div>

        {/* 카테고리 태그 필터 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-semibold text-slate-400">
            카테고리:
          </span>
          {CATEGORY_TAGS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                setCategory(tag.id)
                void handleSearch(query, tag.id)
              }}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                category === tag.id
                  ? 'bg-[#007A78] text-white shadow-2xs font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 피드백 메시지 배너 */}
      {feedback && (
        <div
          className={`rounded-xl border px-3 py-2 text-[11px] font-medium animate-fade-in flex items-start gap-2 shadow-2xs ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : feedback.type === 'info'
                ? 'border-blue-200 bg-blue-50 text-blue-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          )}
          <span className="leading-tight">{feedback.text}</span>
        </div>
      )}

      {/* 4. 수집된 사진 미리보기 그리드 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              수집된 고해상도 사진 ({photos.length}건)
            </span>
            {lastResultMeta && (
              <span
                className={`rounded-full px-2 py-0.2 text-[9px] font-bold ${
                  lastResultMeta.sourceKind === 'website'
                    ? 'bg-emerald-100 text-emerald-800'
                    : lastResultMeta.sourceKind === 'hybrid'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {lastResultMeta.sourceKind === 'website'
                  ? '🌐 공식 사이트 수집'
                  : lastResultMeta.sourceKind === 'hybrid'
                    ? '🌐 사이트 + 플랫폼 결합'
                    : '🔍 대형 플랫폼 수집'}
              </span>
            )}
            <button
              type="button"
              onClick={handleToggleAll}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#007A78] hover:underline cursor-pointer ml-1"
            >
              {selectedIds.size === photos.length && photos.length > 0 ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <Square className="h-3 w-3" />
              )}
              <span>전체 선택 / 해제</span>
            </button>
          </div>
          <span className="text-[10px] text-slate-400">
            {selectedIds.size}장 선택됨
          </span>
        </div>

        {/* 로딩 중 오버레이 또는 사진 목록 */}
        <div className="relative min-h-[140px] max-h-[230px] overflow-y-auto p-1 bg-slate-50/70 rounded-xl border border-slate-200">
          {isSearching && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-2xs rounded-xl">
              <Loader2 className="h-6 w-6 animate-spin text-[#007A78]" />
              <p className="text-xs font-semibold text-slate-700">
                웹 사이트 및 대형 검색 플랫폼(Google·Naver·Bing)에서 실사 사진을
                수집하는 중...
              </p>
            </div>
          )}

          {photos.length === 0 && !isSearching ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <ImageIcon className="h-8 w-8 text-slate-300 mb-1" />
              <p className="text-xs font-medium">
                검색된 실사 사진이 없습니다.
              </p>
              <p className="text-[10px] mt-0.5">
                다른 홈페이지 URL 또는 회사명을 입력해 보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {photos.map((photo) => {
                const isSelected = selectedIds.has(photo.id)
                const isSitePhoto = photo.id.startsWith('site-')
                const isPlatformPhoto =
                  photo.id.startsWith('plat-') ||
                  photo.id.startsWith('ddg-') ||
                  photo.id.startsWith('naver-')

                return (
                  <div
                    key={photo.id}
                    onClick={() => handleTogglePhoto(photo.id)}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all cursor-pointer bg-white ${
                      isSelected
                        ? 'border-2 border-[#007A78] ring-2 ring-[#007A78]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* 썸네일 이미지 */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.caption}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget
                          const isSafeUrl =
                            typeof photo.url === 'string' &&
                            (photo.url.startsWith('http://') ||
                              photo.url.startsWith('https://') ||
                              photo.url.startsWith('/'))

                          if (
                            !target.dataset.retried &&
                            isSafeUrl &&
                            !photo.thumbnailUrl.startsWith('/crawl-api')
                          ) {
                            target.dataset.retried = 'true'
                            target.src = `/crawl-api/proxy-image?url=${encodeURIComponent(photo.url)}`
                            return
                          }
                          target.src =
                            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80'
                        }}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                      {/* 출처 배지 (공식 사이트 vs 대형 플랫폼) */}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[8px] font-bold text-white shadow-2xs backdrop-blur-xs ${
                            isSitePhoto
                              ? 'bg-emerald-600/90'
                              : isPlatformPhoto
                                ? 'bg-blue-600/90'
                                : 'bg-slate-700/90'
                          }`}
                        >
                          {isSitePhoto
                            ? '공식 사이트'
                            : photo.sourceDomain === 'naver.com'
                              ? 'Naver'
                              : photo.sourceDomain.includes('Bing') ||
                                  photo.sourceDomain.includes('duckduckgo')
                                ? 'Bing'
                                : '웹 검색'}
                        </span>
                      </div>

                      {/* 선택 체크마크 */}
                      <div
                        className={`absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-md text-white transition-all ${
                          isSelected
                            ? 'bg-[#007A78]'
                            : 'bg-black/40 border border-white/50 group-hover:bg-black/60'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>

                      {/* 하단 카테고리 & 도메인 */}
                      <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[8px] text-white/90">
                        <span className="truncate max-w-[65%] font-medium">
                          {photo.sourceDomain}
                        </span>
                        <span className="rounded bg-black/50 px-1 py-0.2 text-[8px] font-semibold">
                          {getCategoryBadge(photo.category)}
                        </span>
                      </div>
                    </div>

                    {/* 캡션 레이블 */}
                    <div className="p-1.5 text-left">
                      <p className="text-[10px] font-bold text-slate-800 line-clamp-1">
                        {photo.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
                      </p>
                      <p
                        className="text-[9px] text-slate-400 line-clamp-1"
                        title={photo.caption}
                      >
                        {photo.caption}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. 선택한 사진들을 첨부 자료로 등록하는 버튼 */}
      <div className="flex items-center justify-between border-t border-teal-100 pt-2 text-xs">
        <span className="text-[11px] text-slate-500">
          선택한 사진은 <strong>300DPI 인쇄 표준 규격</strong>으로 첨부 및
          초안에 배치됩니다.
        </span>
        <button
          type="button"
          onClick={handleConfirmAdd}
          disabled={disabled || selectedIds.size === 0}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:bg-none disabled:text-slate-400"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>선택한 {selectedIds.size}장의 사진 첨부 등록</span>
        </button>
      </div>
    </div>
  )
}
