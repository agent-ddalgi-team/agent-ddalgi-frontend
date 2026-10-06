import React, { useRef, useState } from 'react'
import {
  ArrowRight,
  Building2,
  Check,
  CheckSquare,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Info,
  Layers,
  Plus,
  Presentation,
  ShieldCheck,
  Sliders,
  Sparkles,
  Square,
  Upload,
  X,
} from 'lucide-react'
import type { UploadedFile } from '../../types/session'

interface SessionUploadPanelProps {
  companyHint: string
  onCompanyHintChange: (hint: string) => void
  uploadedFiles: UploadedFile[]
  selectedFileIds: string[]
  onUpload: (files: FileList | File[]) => void
  onToggleSelect: (fileId: string) => void
  onStartPrecheck: () => void
  loading: boolean
}

const HIGHLIGHT_TAGS = [
  '품질관리',
  '공정능력',
  '연구개발(R&D)',
  '납기 안정성',
  '원가경쟁력',
  '인증·특허',
  '글로벌 수출',
  '자동화 설비',
]

const PURPOSE_OPTIONS = [
  {
    id: 'new-client',
    label: '신규 고객 제안',
    desc: '기업 개요와 핵심 제조 역량 부각',
  },
  {
    id: 'ir-pitch',
    label: '투자 유치 / IR',
    desc: '성장 잠재력, 비즈니스 모델 및 재무 지표 강조',
  },
  {
    id: 'procurement',
    label: '공공 조달 / 입찰',
    desc: '인증, 특허, 품질 보증 및 납기 신뢰도 중심',
  },
  {
    id: 'partner',
    label: '파트너십 제휴',
    desc: '상호 시너지, R&D 협력 및 사업 확장성 제시',
  },
]

const DIRECTION_OPTIONS = [
  {
    id: 'tech-quality',
    label: '품질·기술 신뢰형',
    desc: '시험성적서, 공정 설비 및 인증 데이터 위주',
  },
  {
    id: 'market-growth',
    label: '시장·실적 성장형',
    desc: '주요 납품 실적, 고객사 포트폴리오 중심',
  },
  {
    id: 'standard',
    label: '표준 균형 요약형',
    desc: '13개 핵심 항목을 고르게 서술하는 표준형',
  },
]

const PAGE_COUNT_OPTIONS = [
  { count: 1, label: '1p', desc: '1장 요약' },
  { count: 4, label: '4p', desc: '기본형' },
  { count: 6, label: '6p', desc: '상세형' },
  { count: 8, label: '8p', desc: '종합형' },
  { count: 10, label: '10p', desc: '제안서' },
]

export const SessionUploadPanel: React.FC<SessionUploadPanelProps> = ({
  companyHint,
  onCompanyHintChange,
  uploadedFiles,
  selectedFileIds,
  onUpload,
  onToggleSelect,
  onStartPrecheck,
  loading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedPurpose, setSelectedPurpose] = useState('new-client')
  const [selectedDirection, setSelectedDirection] = useState('tech-quality')
  const [activeTags, setActiveTags] = useState<string[]>([
    '품질관리',
    '공정능력',
    '인증·특허',
  ])
  const [customTagInput, setCustomTagInput] = useState('')
  const [showCustomTagInput, setShowCustomTagInput] = useState(false)
  const [selectedPageCount, setSelectedPageCount] = useState(4)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files)
    }
  }

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim()
    if (trimmed && !activeTags.includes(trimmed)) {
      setActiveTags((prev) => [...prev, trimmed])
      setCustomTagInput('')
      setShowCustomTagInput(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    if (t.includes('pptx') || t.includes('ppt'))
      return <Presentation className="h-4 w-4 text-orange-500" />
    if (t.includes('docx') || t.includes('doc'))
      return <FileText className="h-4 w-4 text-blue-500" />
    if (t.includes('jpg') || t.includes('png') || t.includes('jpeg'))
      return <ImageIcon className="h-4 w-4 text-emerald-500" />
    return <FileCode className="h-4 w-4 text-slate-500" />
  }

  const getFileTypeBadge = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('pdf')) return 'bg-red-50 text-red-700 border-red-200'
    if (t.includes('pptx') || t.includes('ppt'))
      return 'bg-orange-50 text-orange-700 border-orange-200'
    if (t.includes('docx') || t.includes('doc'))
      return 'bg-blue-50 text-blue-700 border-blue-200'
    if (t.includes('jpg') || t.includes('png') || t.includes('jpeg'))
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const isAllSelected =
    uploadedFiles.length > 0 && selectedFileIds.length === uploadedFiles.length

  const handleSelectAll = () => {
    if (isAllSelected) {
      // 모두 해제하되 첫번째는 유지하거나 토글
      uploadedFiles.forEach((f) => {
        if (selectedFileIds.includes(f.file_id)) {
          onToggleSelect(f.file_id)
        }
      })
    } else {
      uploadedFiles.forEach((f) => {
        if (!selectedFileIds.includes(f.file_id)) {
          onToggleSelect(f.file_id)
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 상단 헤드라인 & 안내 블록 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E6F4F1] px-3 py-1 text-xs font-semibold text-[#007A78] border border-teal-200/60 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#007A78] animate-pulse"></span>
            <span>STEP 01 · 자료 구성 & 작성 옵션</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            기업 소개서 초안 구성을 위한 자료 등록
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            보유하신 회사소개서, 카탈로그, 인증서, 사업자등록증 등의 파일을
            등록하고 작성 방향을 설정하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-3.5 py-2 text-xs text-slate-700 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-[#007A78]" />
            <span className="font-semibold text-slate-800">
              팩트 그라운딩 검증 활성
            </span>
          </div>
        </div>
      </div>

      {/* 3단 워크벤치 그리드 (Tri-Column Layout) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT PANEL: 작성 설정 (3.5 cols) */}
        <section className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#E6F4F1] p-1.5 text-[#007A78]">
                <Sliders className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                작성 목적 및 방향
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              맞춤 톤앤매너
            </span>
          </div>

          {/* 사용 목적 */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>사용 목적</span>
              <span className="text-[10px] font-semibold text-[#007A78] bg-[#E6F4F1] px-2 py-0.5 rounded-full">
                필수
              </span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PURPOSE_OPTIONS.map((opt) => {
                const isSelected = selectedPurpose === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedPurpose(opt.id)}
                    className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-[#007A78] bg-[#E6F4F1]/40 shadow-2xs ring-1 ring-[#007A78]'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`text-xs font-bold ${isSelected ? 'text-[#007A78]' : 'text-slate-800'}`}
                      >
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-[#007A78]" />
                      )}
                    </div>
                    <span className="mt-0.5 text-[11px] text-slate-500">
                      {opt.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 작성 방향 톤앤매너 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              작성 방향 (강조 톤)
            </label>
            <div className="space-y-1.5">
              {DIRECTION_OPTIONS.map((opt) => {
                const isSelected = selectedDirection === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedDirection(opt.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ${
                      isSelected
                        ? 'border-[#007A78] bg-[#E6F4F1] font-bold text-[#007A78]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 강조할 핵심 키워드 태그 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                강조할 핵심 키워드
              </label>
              <span className="text-[11px] font-semibold text-[#007A78]">
                복수 선택
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {HIGHLIGHT_TAGS.map((tag) => {
                const isActive = activeTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`tag-chip flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                      isActive
                        ? 'active'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isActive && <Check className="h-3 w-3 text-[#007A78]" />}
                    {tag}
                  </button>
                )
              })}

              {showCustomTagInput ? (
                <div className="flex w-full items-center gap-1.5 pt-1.5">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCustomTag()
                      }
                    }}
                    placeholder="직접 태그 입력 후 추가"
                    maxLength={30}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#007A78] focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="rounded-lg bg-[#007A78] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0F766E]"
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomTagInput(false)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomTagInput(true)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-[#007A78] hover:text-[#007A78] transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>직접 입력</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* CENTER STAGE: 파일 업로드 & 선택 리스트 (5.5 cols) */}
        <section className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                참고 자료 업로드 & 분석 선택
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                등록된 문서에서 팩트를 추출하여 초안 13개 섹션에 반영합니다.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
              다중 문서 지원
            </span>
          </div>

          {/* 드래그 앤 드롭 영역 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
              isDragging
                ? 'border-[#007A78] bg-[#E6F4F1]/60 scale-[1.01]'
                : 'border-slate-300 bg-slate-50/50 hover:border-[#007A78] hover:bg-[#E6F4F1]/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pptx,.pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F4F1] text-[#007A78] shadow-2xs group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">
              파일을 여기로 드래그하거나 클릭하여 업로드
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              지원 형식: PPTX, PDF, DOCX, TXT, JPG, PNG (다중 선택 가능)
            </p>
          </div>

          {/* 업로드된 파일 리스트 */}
          {uploadedFiles.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    등록된 파일 ({selectedFileIds.length}/{uploadedFiles.length}
                    개 선택)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-semibold text-[#007A78] hover:underline"
                >
                  {isAllSelected ? '전체 해제' : '전체 선택'}
                </button>
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
                {uploadedFiles.map((file) => {
                  const isSelected = selectedFileIds.includes(file.file_id)
                  const hasPhotos = file.photos && file.photos.length > 0

                  return (
                    <div
                      key={file.file_id}
                      onClick={() => onToggleSelect(file.file_id)}
                      className={`flex cursor-pointer items-center justify-between p-3.5 transition-colors ${
                        isSelected
                          ? 'bg-[#F0FDFA]'
                          : 'bg-white hover:bg-slate-50/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <button
                          type="button"
                          className="shrink-0 text-slate-400 hover:text-[#007A78]"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#007A78]" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300" />
                          )}
                        </button>
                        <div className="shrink-0">
                          {getFileIcon(file.file_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`truncate text-xs font-semibold ${
                                isSelected ? 'text-slate-900' : 'text-slate-600'
                              }`}
                            >
                              {file.file_name}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase border ${getFileTypeBadge(
                                file.file_type,
                              )}`}
                            >
                              {file.file_type}
                            </span>
                            {hasPhotos && (
                              <span className="flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                <ImageIcon className="h-3 w-3" />
                                사진 {file.photos?.length}개
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-mono text-slate-400">
                        {formatFileSize(file.size_bytes)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <span>
                등록된 자료가 없습니다. 상단 영역에 파일을 등록하세요.
              </span>
            </div>
          )}
        </section>

        {/* RIGHT PANEL: 문서 옵션 & 시작 액션 (2.5 cols -> lg:col-span-3) */}
        <section className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#E6F4F1] p-1.5 text-[#007A78]">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                문서 규격 옵션
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              분량 설정
            </span>
          </div>

          {/* 목표 페이지 수 선택 (Segmented Radio Tiles) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              목표 페이지 수
            </label>
            <div className="grid grid-cols-5 gap-1">
              {PAGE_COUNT_OPTIONS.map((opt) => {
                const isSelected = selectedPageCount === opt.count
                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setSelectedPageCount(opt.count)}
                    className={`flex flex-col items-center justify-center rounded-xl border py-2 text-center transition-all ${
                      isSelected
                        ? 'border-[#007A78] bg-[#007A78] font-bold text-white shadow-xs scale-[1.02]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                    <span
                      className={`text-[9px] ${
                        isSelected ? 'text-teal-100' : 'text-slate-400'
                      }`}
                    >
                      {opt.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 회사명 힌트 */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>회사명 힌트</span>
              <span className="text-[10px] font-normal text-slate-400">
                선택 사항
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={companyHint}
                onChange={(e) => onCompanyHintChange(e.target.value)}
                placeholder="예: 주식회사 에이전트딸기"
                maxLength={100}
                className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#007A78] focus:ring-1 focus:ring-[#007A78] focus:outline-hidden"
              />
              <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              자료마다 회사 표기가 상충될 경우 우선 기준이 됩니다.
            </p>
          </div>

          {/* 세션 전용 보안 카드 */}
          <div className="rounded-xl border border-blue-100 bg-[#EFF6FF]/70 p-3.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#1D4ED8]">
              <Info className="h-4 w-4" />
              <span>세션 보안 및 개인정보 보호</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              업로드 파일과 생성된 초안은 세션 기간 동안만 임시 유지되며
              안전하게 보호됩니다.
            </p>
          </div>

          {/* 다음 단계 버튼 */}
          <div className="pt-2">
            <button
              type="button"
              disabled={
                uploadedFiles.length === 0 ||
                selectedFileIds.length === 0 ||
                loading
              }
              onClick={onStartPrecheck}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007A78] to-[#0F766E] py-3 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
            >
              {loading ? (
                <span>자료 분석 및 사전 점검 진행 중...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>자료 사전 점검 시작</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
