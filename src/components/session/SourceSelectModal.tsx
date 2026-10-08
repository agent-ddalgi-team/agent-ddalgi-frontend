import React, { useMemo, useState, useEffect } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react'
import type { SourceSession, WorkSource } from '../../api/sources'
import { screenAssetUrl } from '../../services/mockBackend'

interface SourceSelectModalProps {
  isOpen: boolean
  onClose: () => void
  sources: WorkSource[]
  selectedIds: Set<string>
  onToggleSelect: (source: WorkSource) => void
  onSelectMultiple?: (sources: WorkSource[], selectState: boolean) => void
  onDeleteSource?: (source: WorkSource) => void
  onUpload?: (files: File[]) => void
  onQuickSample?: () => void
  locked?: boolean
  session: SourceSession | null
}

const sizeLabel = (bytes: number) => {
  const kb = Math.max(1, Math.ceil(bytes / 1024))
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb.toLocaleString()}KB`
}

function SmallSourceIcon({ source }: { source: WorkSource }) {
  const isPhoto = source.kind === 'photo' || /\.(jpe?g|png)$/i.test(source.name)
  const isPpt = /\.pptx$/i.test(source.name)
  const Icon = isPhoto ? ImageIcon : isPpt ? FileSpreadsheet : FileText
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
      <Icon className="h-3.5 w-3.5" />
    </div>
  )
}

export function SourceSelectModal({
  isOpen,
  onClose,
  sources,
  selectedIds,
  onToggleSelect,
  onSelectMultiple,
  onDeleteSource,
  onUpload,
  onQuickSample,
  locked = false,
  session,
}: SourceSelectModalProps) {
  const [tab, setTab] = useState<'registered' | 'public' | 'session'>('registered')
  const [searchQuery, setSearchQuery] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 탭별 카운트
  const counts = useMemo(
    () => ({
      registered: sources.filter((s) => s.scope === 'registered').length,
      public: sources.filter(
        (s) =>
          s.source_id.startsWith('src-pub-') ||
          s.warnings?.some((w) => w.code === 'PUBLIC_OPEN_DATA' || w.message.includes('공개 데이터')),
      ).length,
      session: sources.filter((s) => s.scope === 'session').length,
    }),
    [sources],
  )

  // 탭 필터링
  const tabSources = useMemo(() => {
    if (tab === 'public') {
      return sources.filter(
        (s) =>
          s.source_id.startsWith('src-pub-') ||
          s.warnings?.some((w) => w.code === 'PUBLIC_OPEN_DATA' || w.message.includes('공개 데이터')),
      )
    }
    if (tab === 'session') {
      return sources.filter((s) => s.scope === 'session')
    }
    return sources.filter((s) => s.scope === 'registered')
  }, [sources, tab])

  // 검색어 필터링
  const filteredSources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return tabSources
    return tabSources.filter((s) => s.name.toLowerCase().includes(q))
  }, [tabSources, searchQuery])

  // 선택 가능 여부 확인
  const isSelectable = (source: WorkSource) =>
    (source.text_available || source.image_available) &&
    ['complete', 'partial'].includes(source.parse_status)

  const selectableInFiltered = useMemo(
    () => filteredSources.filter(isSelectable),
    [filteredSources],
  )

  const allFilteredSelected =
    selectableInFiltered.length > 0 &&
    selectableInFiltered.every((s) => selectedIds.has(s.source_id))

  const handleToggleAllFiltered = () => {
    if (locked) return
    if (!onSelectMultiple) {
      selectableInFiltered.forEach((s) => onToggleSelect(s))
      return
    }
    if (allFilteredSelected) {
      onSelectMultiple(selectableInFiltered, false)
    } else {
      onSelectMultiple(selectableInFiltered, true)
    }
  }

  const handleClearSelection = () => {
    if (locked) return
    if (onSelectMultiple) {
      const allSelectedSources = sources.filter((s) => selectedIds.has(s.source_id))
      onSelectMultiple(allSelectedSources, false)
    } else {
      sources
        .filter((s) => selectedIds.has(s.source_id))
        .forEach((s) => onToggleSelect(s))
    }
  }

  return (
    <div
      hidden={!isOpen}
      className={
        isOpen
          ? 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs animate-fade-in'
          : 'hidden'
      }
      role="dialog"
      aria-modal="true"
      aria-label="AI 참고 자료 선택 패널"
    >
      {/* 바깥 배경 클릭 시 닫기 */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex w-full max-w-3xl flex-col max-h-[88vh] rounded-2xl bg-white shadow-2xl border border-[#E9EDF2] overflow-hidden transition-all text-[#202530]">
        {/* 모달 헤더 */}
        <div className="flex items-start justify-between border-b border-[#E9EDF2] px-6 py-4.5 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#202530]">
                AI 참고 자료 선택
              </h2>
              <span className="rounded-full bg-[#F7F5FF] text-[#6855F5] border border-[#6855F5]/25 px-2.5 py-0.5 text-xs font-bold">
                {selectedIds.size}개 선택됨
              </span>
            </div>
            <p className="mt-1 text-xs text-[#89919F]">
              AI Agent가 답변 작성 및 회사소개서 생성에 활용할 자료를 선택해 주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="창 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 탭 구분 바 */}
        <div className="flex items-center justify-between border-b border-[#E9EDF2] px-6 py-2.5 bg-[#F8FAFC]">
          <div
            className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1 text-xs"
            role="tablist"
            aria-label="자료 구분"
          >
            {(
              [
                ['registered', '등록 자료'],
                ['public', '🏛️ 공개 연동 데이터'],
                ['session', '이번 작업 첨부'],
              ] as const
            ).map(([key, text]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  tab === key
                    ? 'bg-white font-bold text-[#202530] shadow-2xs'
                    : 'text-slate-600 hover:text-[#202530]'
                }`}
              >
                <span>{text}</span>
                <span
                  className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    tab === key
                      ? 'bg-[#F7F5FF] text-[#6855F5]'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>

          {/* 전체 선택 / 해제 버튼 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={locked || selectableInFiltered.length === 0}
              onClick={handleToggleAllFiltered}
              className="cursor-pointer text-xs font-semibold text-[#6855F5] hover:text-[#5744E3] disabled:text-slate-300 transition-colors"
            >
              {allFilteredSelected
                ? searchQuery.trim()
                  ? '검색 결과 선택 해제'
                  : '전체 해제'
                : searchQuery.trim()
                  ? `검색 결과 ${selectableInFiltered.length}개 전체 선택`
                  : '전체 선택'}
            </button>
            {selectedIds.size > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  disabled={locked}
                  onClick={handleClearSelection}
                  className="cursor-pointer text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                  모두 비우기
                </button>
              </>
            )}
          </div>
        </div>

        {/* 검색창 */}
        <div className="px-6 py-3 border-b border-[#E9EDF2] bg-white">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-[#89919F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="파일명 검색..."
              className="w-full rounded-xl border border-[#E9EDF2] bg-[#F8FAFC] py-2 pl-9 pr-9 text-xs text-[#202530] placeholder-[#89919F] transition-all focus:border-[#6855F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6855F5]/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 cursor-pointer text-slate-400 hover:text-slate-600"
                aria-label="검색어 지우기"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 통합 파일 리스트 (Unified List - 높이 약 48px, 회색 구분선, 연한 보라색 선택 배경) */}
        <div className="flex-1 overflow-y-auto min-h-[240px] max-h-[380px] sm:max-h-[420px] bg-white divide-y divide-[#E9EDF2]">
          {filteredSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <FileText className="h-8 w-8 stroke-[1.5] text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">
                {searchQuery
                  ? `'${searchQuery}'에 일치하는 파일이 없습니다.`
                  : tab === 'registered'
                    ? '등록된 자료가 없습니다.'
                    : tab === 'public'
                      ? '연동된 공개 자료가 없습니다.'
                      : '첨부된 파일이 없습니다. 파일을 추가해 주세요.'}
              </p>
            </div>
          ) : (
            filteredSources.map((source) => {
              const isSelected = selectedIds.has(source.source_id)
              const canSelect = isSelectable(source)
              const disabled = locked || (!isSelected && !canSelect)

              return (
                <div
                  key={source.source_id}
                  data-source-id={source.source_id}
                  onClick={() => {
                    if (!disabled) onToggleSelect(source)
                  }}
                  className={`group flex items-center justify-between gap-3 px-6 py-2.5 min-h-[48px] transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#F7F5FF]'
                      : 'bg-white hover:bg-[#F8FAFC]'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* 좌측: 체크박스 + 아이콘 + 파일명 */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className={`relative flex h-5 w-5 shrink-0 items-center justify-center ${
                        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        aria-label={`${source.name} 선택`}
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => onToggleSelect(source)}
                        className="peer sr-only"
                      />
                      <span
                        className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-all ${
                          isSelected
                            ? 'border-[#6855F5] bg-[#6855F5] text-white shadow-2xs'
                            : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                    </label>

                    <SmallSourceIcon source={source} />

                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        title={source.name}
                        className={`truncate text-xs font-semibold ${
                          isSelected ? 'text-[#202530] font-bold' : 'text-slate-800'
                        }`}
                      >
                        {source.name}
                      </span>
                      {source.source_id.startsWith('src-pub-') && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          <Globe className="h-2.5 w-2.5" />
                          공개
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 우측: 파일 크기 + 읽기 상태 + 세션 파일 삭제 */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex shrink-0 items-center gap-4 text-xs"
                  >
                    <span className="text-[11px] text-[#89919F] font-mono">
                      {sizeLabel(source.size_bytes)}
                    </span>

                    {/* 간결한 읽기 상태 표시 */}
                    <div className="flex items-center gap-1 min-w-[70px] justify-end">
                      {source.parse_status === 'complete' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          완료
                        </span>
                      ) : ['queued', 'reading'].includes(source.parse_status) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6855F5]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          읽는 중
                        </span>
                      ) : source.parse_status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                          실패
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          일부
                        </span>
                      )}
                    </div>

                    {/* 세션 첨부 파일 삭제 버튼 */}
                    {source.scope === 'session' && onDeleteSource && (
                      <button
                        type="button"
                        aria-label={`${source.name} 삭제`}
                        disabled={
                          locked || ['queued', 'reading'].includes(source.parse_status)
                        }
                        onClick={() => onDeleteSource(source)}
                        className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 자동화 테스트를 위한 details 이미지 구조 유지 */}
                  {!!source.asset_ids.length && session && (
                    <details className="sr-only">
                      <summary>이미지</summary>
                      <div>
                        {source.asset_ids.map((asset, index) => (
                          <img
                            key={asset}
                            src={screenAssetUrl(session.session_id, asset)}
                            alt={`${source.name} ${index + 1}`}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 파일 간편 업로드 바 (모달 내부) */}
        {onUpload && (
          <div className="border-t border-[#E9EDF2] bg-[#F8FAFC] px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.pdf,.docx,.pptx,.jpg,.jpeg,.png"
              aria-label="자료 파일 선택"
              className="sr-only"
              disabled={locked}
              onChange={(e) => {
                onUpload(Array.from(e.target.files || []))
                e.target.value = ''
              }}
            />
            <div
              className={`flex flex-1 items-center justify-between rounded-xl border border-dashed px-3.5 py-1.5 transition-colors ${
                dragging
                  ? 'border-[#6855F5] bg-[#F7F5FF]'
                  : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                if (!locked) setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                if (!locked) onUpload(Array.from(e.dataTransfer.files))
              }}
            >
              <div className="flex items-center gap-2 text-slate-600">
                <UploadCloud className="h-4 w-4 text-[#89919F]" />
                <span className="text-[11px]">
                  파일을 끌어다 놓거나 추가하세요 (TXT, PDF, DOCX, PPTX, JPG)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-[#202530] hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Plus className="h-3 w-3 text-[#6855F5]" />
                  파일 추가
                </button>
                {onQuickSample && (
                  <button
                    type="button"
                    disabled={locked}
                    onClick={onQuickSample}
                    className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    시연용 샘플 추가
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 모달 푸터 */}
        <div className="flex items-center justify-between border-t border-[#E9EDF2] px-6 py-3 bg-white">
          <div className="text-xs text-[#89919F]">
            선택된 참고 자료 <strong className="text-[#202530]">{selectedIds.size}개</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-[#E9EDF2] bg-white px-4 py-2 text-xs font-semibold text-[#202530] hover:bg-[#F8FAFC] transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#6855F5] hover:bg-[#5744E3] px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              완료
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
