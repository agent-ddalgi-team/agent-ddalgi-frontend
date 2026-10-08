import { useState } from 'react'
import { ShieldCheck, Sliders, X } from 'lucide-react'

interface SystemStatusModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [filterCode, setFilterCode] = useState<string>('all')

  if (!isOpen) return null

  const stateCards = [
    {
      code: 'E01',
      title: '읽을 텍스트가 없어요',
      tag: '초안 생성 불가',
      tagType: 'error',
      location: '1단계 · 자료 선택·사전 확인 하단 배너',
      alertTitle: '스캔 이미지에서는 글을 읽지 못했어요',
      alertDesc:
        '추가된 파일이 모두 비문자 이미지이거나 텍스트 레이어가 없습니다. 초안에 활용할 수 있는 텍스트가 있는 회사 자료를 추가해 주세요.',
      guide: [
        '텍스트 추출이 가능한 PPTX, TXT, 또는 검색 가능한 PDF 파일 1건 이상 첨부',
        '이미지만 있을 경우 우측 메모란에 주요 회사 소개 개요를 직접 입력',
      ],
      enforcement: '텍스트 근거 0건으로 초안 진입 차단됨',
    },
    {
      code: 'E02',
      title: '일부 자료만 읽었어요',
      tag: '보완 권장',
      tagType: 'warning',
      location: '1단계 · 사전 점검 결과 패널',
      alertTitle: '인증서의 일부 내용(스캔 2~3쪽)을 읽지 못했어요',
      alertDesc:
        "선택된 3개 파일 중 '품질인증서.pdf'의 일부분이 저화질 스캔으로 인식되지 않았습니다. 읽은 내용과 빠진 부분을 확인해 주세요.",
      guide: [
        '사용 가능한 다른 근거(소개서_기존본.pptx, 기업인터뷰.txt)가 충분하므로 검토용 8쪽 초안은 바로 생성할 수 있습니다.',
      ],
      enforcement: '보완 자료가 없어도 기본 생성 가능',
    },
    {
      code: 'E03',
      title: '원하는 사진을 골라 주세요',
      tag: '선택 후 적용',
      tagType: 'info',
      location: '2단계 · 초안 편집기 03쪽 사진 슬롯 팝오버',
      alertTitle: '사진 후보 목록 (세션 내 감지된 3개 항목)',
      alertDesc:
        '실제 회사 사진을 AI로 임의 생성하지 않으며 사용자가 제공한 사진 파일 중에서만 후보를 제안합니다.',
      guide: [
        '후보 1: 공정 설비 전경',
        '후보 2: 스마트 팩토리 라인 B',
        '후보 3: 품질 연구소 정밀 분석',
      ],
      enforcement: '300DPI 인쇄 표준 자동 매핑',
    },
    {
      code: 'E04',
      title: 'AI 제안 비교 및 충돌 방지',
      tag: '비교 검토',
      tagType: 'info',
      location: '2단계 · 우측 AI 편집 보조 패널',
      alertTitle: '동시 수정 감지 및 안전 안내',
      alertDesc:
        "AI 제안 생성 도중 사용자가 캔버스를 직접 수정한 경우, '이 문구 적용' 클릭 전까지 본문은 바뀌지 않습니다.",
      guide: [
        '기존 본문 문구 vs AI 제안 문구 Diff 실시간 대조',
        '적용 전까지 원본 텍스트 100% 안전 보존',
      ],
      enforcement: '사용자 직접 승인 시에만 반영',
    },
    {
      code: 'E05',
      title: '자료가 추가되었어요',
      tag: '다시 확인 필요',
      tagType: 'warning',
      location: '2단계 · 초안 편집기 상단 고정 인라인 배너',
      alertTitle: '직접 수정한 본문 내용은 안전하게 유지됩니다',
      alertDesc:
        '새 자료(품질인증서_2025_개정본.pdf)가 업로드되었습니다. 신규 자료가 현재 작성 중인 페이지와 수치에 영향을 주는지 확인하세요.',
      guide: ['재점검 -> 영향 확인 -> 수정안 선택 -> 편집 이어가기'],
      enforcement: '수동 편집본 덮어쓰기 방지',
    },
    {
      code: 'E07',
      title: '승인 전에 해결해 주세요',
      tag: '필수 문제 1개',
      tagType: 'error',
      location: '3단계 · 승인·출력 화면 사전 검증 패널',
      alertTitle: '납기 수치의 적용 조건이 확인되지 않았어요',
      alertDesc:
        "04쪽 '납기 48시간 보장' 수치의 기준 근거가 선택된 첨부 자료에 명시되어 있지 않습니다. 근거를 보완하거나 본문 표현을 수정해 주세요.",
      guide: [
        '거버넌스 차단 원칙: 단순 체크박스 우회 불가, 근거 보완 시 최종 승인 활성화',
      ],
      enforcement: '팩트 불일치 시 최종 출력 차단',
    },
    {
      code: 'E08',
      title: '파일을 만들지 못했어요',
      tag: '출력 재시도',
      tagType: 'warning',
      location: '3단계 · 파일 렌더링 모달 대화상자',
      alertTitle: '문서와 승인 내용은 그대로예요',
      alertDesc:
        '일시적인 렌더링 지연 시에도 승인 완료된 본문 데이터는 안전하게 보존되어 있으니 다시 시도해 주세요.',
      guide: [
        '초안을 처음부터 다시 생성하지 않고, 동일한 승인본으로 즉시 재실행',
      ],
      enforcement: '데이터 보존 100% 보장',
    },
    {
      code: 'E09',
      title: '작업 만료 시각과 임시 보관',
      tag: '세션 보안 적용',
      tagType: 'info',
      location: '전 단계 상단 · 서버에서 확인한 작업 만료 시각',
      alertTitle: '작업 종료·만료 시 첨부와 문서가 삭제됩니다',
      alertDesc:
        '현재 작업 안의 저장은 영구 보관이 아닙니다. 작업은 무활동 120분 또는 생성 후 24시간 중 빠른 시각에 만료되며, 이미 내려받은 파일은 기기에 남습니다.',
      guide: [
        '상단에서 확인된 만료 시각을 확인하고, 필요한 파일은 만료 전에 승인·다운로드하세요.',
        '만료 시각 다시 확인은 조회이며 기한을 연장하지 않습니다. 작업이 만료되면 새 작업을 시작해 주세요.',
      ],
      enforcement: '만료된 작업 접근 차단 · 임시 자료 정리',
    },
  ]

  const filteredCards =
    filterCode === 'all'
      ? stateCards
      : stateCards.filter((c) => c.code === filterCode)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-5xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-5 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F4F1] text-[#007A78] flex items-center justify-center">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                상황별 상태와 복귀 동작 모니터
              </h2>
              <p className="text-xs text-slate-500">
                B2B 워크플로 안정성 규정집 및 인라인 안전 복귀 절차 가이드
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterCode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterCode === 'all'
                ? 'bg-[#007A78] text-white shadow-2xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 상태 ({stateCards.length})
          </button>
          {stateCards.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setFilterCode(c.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                filterCode === c.code
                  ? 'bg-[#007A78] text-white shadow-2xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="font-mono mr-1">{c.code}</span>
              <span>{c.title}</span>
            </button>
          ))}
        </div>

        {/* Card Grid Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1">
          {filteredCards.map((card) => (
            <div
              key={card.code}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-3 shadow-2xs"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-bold font-mono">
                    {card.code}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900">
                    {card.title}
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    card.tagType === 'error'
                      ? 'bg-red-50 text-red-800'
                      : card.tagType === 'warning'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  {card.tag}
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                발생 위치:{' '}
                <strong className="text-slate-800">{card.location}</strong>
              </div>

              {/* Alert Callout */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-800">
                  {card.alertTitle}
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {card.alertDesc}
                </p>
              </div>

              {/* Guide */}
              <div className="flex flex-col gap-0.5 text-[11px] text-slate-600 p-2 rounded bg-slate-100">
                <span className="font-semibold text-slate-800 text-[10px] uppercase">
                  가이드 원칙:
                </span>
                {card.guide.map((g, gIdx) => (
                  <p key={gIdx}>• {g}</p>
                ))}
              </div>

              {/* Bottom Enforcement */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-500 mt-auto">
                <span className="text-[#007A78] font-semibold">
                  {card.enforcement}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-[#007A78]" />
            <span>유휴 시간 120분 기준 보안 보호 정책 적용 중</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  )
}
