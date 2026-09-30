import React, { useState } from 'react'
import {
  Check,
  CheckSquare,
  Globe,
  Image as ImageIcon,
  Loader2,
  Search,
  Sparkles,
  Square,
} from 'lucide-react'
import {
  CURATED_ENTERPRISE_PHOTOS,
  searchWebPhotos,
  type WebCollectedPhoto,
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
  const [query, setQuery] = useState(`https://www.${companyName ? 'geosan.co.kr' : 'company.com'}`)
  const [category, setCategory] = useState('all')
  const [isSearching, setIsSearching] = useState(false)
  const [photos, setPhotos] = useState<WebCollectedPhoto[]>(CURATED_ENTERPRISE_PHOTOS)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(CURATED_ENTERPRISE_PHOTOS.slice(0, 4).map((p) => p.id)),
  )
  const [feedback, setFeedback] = useState<string | null>(null)

  // 웹 사진 검색 / 크롤링 실행 핸들러
  const handleSearch = async () => {
    setIsSearching(true)
    setFeedback(null)
    try {
      const results = await searchWebPhotos(query, category)
      setPhotos(results)
      // 검색 결과의 상위 4개를 기본 선택
      setSelectedIds(new Set(results.slice(0, 4).map((p) => p.id)))
      setFeedback(
        `웹 사이트(${query}) 및 관련 소스에서 고화질 기업 사진 ${results.length}건을 탐색 완료했습니다.`,
      )
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
    setFeedback(
      `✓ 선택한 사진 ${chosen.length}건이 이번 작업의 첨부 자료로 자동 등록되었습니다.`,
    )
    setTimeout(() => setFeedback(null), 4000)
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
                AI 자동 크롤링
              </span>
            </h3>
            <p className="text-[10px] text-slate-500">
              구글 이미지 및 회사 공식 홈페이지 URL을 입력하면 설비, 사옥, 연구소 등 관련 고해상도 실사 사진을 자동으로 수집합니다.
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
              onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
              placeholder="회사 홈페이지 URL (예: https://geosan.co.kr) 또는 검색 키워드 입력"
              disabled={disabled || isSearching}
              className="w-full rounded-xl border border-teal-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 focus:border-[#007A78] focus:outline-none focus:ring-2 focus:ring-[#007A78]/20 disabled:bg-slate-100"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={disabled || isSearching || !query.trim()}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#007A78] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#006663] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>웹 탐색 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>사진 자동 수집</span>
              </>
            )}
          </button>
        </div>

        {/* 카테고리 태그 필터 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-semibold text-slate-400">
            빠른 탐색:
          </span>
          {CATEGORY_TAGS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                setCategory(tag.id)
                // 카테고리 변경 시 즉시 필터 반영
                void searchWebPhotos(query, tag.id).then((res) => {
                  setPhotos(res)
                  setSelectedIds(new Set(res.slice(0, 4).map((p) => p.id)))
                })
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
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-medium text-teal-900 animate-fade-in flex items-center justify-between">
          <span>{feedback}</span>
        </div>
      )}

      {/* 4. 수집된 사진 미리보기 그리드 (선택 가능) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              수집된 고해상도 사진 ({photos.length}건)
            </span>
            <button
              type="button"
              onClick={handleToggleAll}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#007A78] hover:underline cursor-pointer"
            >
              {selectedIds.size === photos.length ? (
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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 max-h-[220px] overflow-y-auto p-1 bg-slate-50/70 rounded-xl border border-slate-200">
          {photos.map((photo) => {
            const isSelected = selectedIds.has(photo.id)
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
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
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
                  <span className="absolute bottom-1 left-1.5 text-[9px] text-white font-medium truncate max-w-[85%]">
                    {photo.sourceDomain}
                  </span>
                </div>

                {/* 캡션 레이블 */}
                <div className="p-1.5 text-left">
                  <p className="text-[10px] font-bold text-slate-800 line-clamp-1">
                    {photo.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
                  </p>
                  <p className="text-[9px] text-slate-400 line-clamp-1">
                    {photo.caption}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. 선택한 사진들을 첨부 자료로 등록하는 버튼 */}
      <div className="flex items-center justify-between border-t border-teal-100 pt-2 text-xs">
        <span className="text-[11px] text-slate-500">
          선택한 사진은 <strong>300DPI 인쇄 표준 규격</strong>으로 첨부 및 초안에 배치됩니다.
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
