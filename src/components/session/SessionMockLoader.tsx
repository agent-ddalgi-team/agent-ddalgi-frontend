import React, { useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Code,
  FileCheck,
  FileUp,
  Sparkles,
  Upload,
} from 'lucide-react'
import type { SessionResponse } from '../../types/session'

interface SessionMockLoaderProps {
  onLoadMock: (mock: SessionResponse) => void
}

export const SessionMockLoader: React.FC<SessionMockLoaderProps> = ({
  onLoadMock,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(
          event.target?.result as string,
        ) as SessionResponse
        onLoadMock(parsed)
      } catch {
        alert('올바른 JSON 형식의 세션 파일이 아닙니다.')
      }
    }
    reader.readAsText(file)
  }

  // 1. S03 초안 완성 및 AI 제안 Mock
  const handleLoadDraftMock = () => {
    const mock: SessionResponse = {
      session_id: 'mock-session-ready-01',
      stage: 'ready',
      company_name_hint: '주식회사 에이전트딸기',
      files: [
        {
          file_id: 'file-1',
          file_name: '회사소개서_초안자료_2026.pptx',
          file_type: 'pptx',
          size_bytes: 1024 * 512,
          is_selected: true,
          photos: [
            { photo_id: 'p1', url: '', caption: '스마트 제조 라인 전경' },
          ],
        },
        {
          file_id: 'file-2',
          file_name: '사업자등록증_및_기업부설연구소인증서.pdf',
          file_type: 'pdf',
          size_bytes: 1024 * 128,
          is_selected: true,
        },
        {
          file_id: 'file-3',
          file_name: '공정품질_시험성적서_2026.docx',
          file_type: 'docx',
          size_bytes: 1024 * 256,
          is_selected: true,
        },
      ],
      selected_file_ids: ['file-1', 'file-2', 'file-3'],
      precheck: {
        status: 'passed',
        summary: '14개 핵심 항목 정합성 점검이 완료되었습니다.',
        questions: [],
      },
      draft_sections: [
        {
          key: 'company_summary',
          title: '1. 회사 개요 및 비전',
          paragraphs: [
            {
              paragraph_id: 'p-1-1',
              text: '주식회사 에이전트딸기는 AI 기반 제조·비즈니스 문서 자동화 솔루션을 제공하는 혁신 선도 기업입니다. 차세대 생성형 AI 에이전트 기술을 팩트 그라운딩 아키텍처와 결합하여 기업 문서의 신뢰성과 생산성을 극대화합니다.',
              original_text:
                '주식회사 에이전트딸기는 AI 기반 제조·비즈니스 문서 자동화 솔루션을 제공하는 혁신 선도 기업입니다. 차세대 생성형 AI 에이전트 기술을 팩트 그라운딩 아키텍처와 결합하여 기업 문서의 신뢰성과 생산성을 극대화합니다.',
              is_modified: false,
              fact_ids: ['fact-1', 'fact-2'],
              active_suggestion: {
                suggestion_id: 'sug-1',
                paragraph_id: 'p-1-1',
                original_text:
                  '주식회사 에이전트딸기는 AI 기반 제조·비즈니스 문서 자동화 솔루션을 제공하는 혁신 선도 기업입니다.',
                suggested_text:
                  '주식회사 에이전트딸기는 최첨단 생성형 AI 에이전트 및 멀티모달 팩트 검증 아키텍처를 선도하여, 기업 맞춤형 비즈니스 문서 생성 솔루션을 공급하는 대한민국 대표 AI 솔루션 기업입니다.',
                reason: '기업의 대표성과 핵심 기술 역량을 명확히 강조',
                status: 'pending',
                candidates: [
                  '에이전트딸기는 차세대 인공지능 기반으로 기업 문서 작성 혁신과 품질 검증을 이끄는 전문 기업입니다.',
                ],
              },
            },
            {
              paragraph_id: 'p-1-2',
              text: '설립 이래 첨단 정밀 제조 및 IT 소프트웨어 기업을 대상으로 전용 초안 생성 파이프라인을 공급해 왔으며, 표준 공정 데이터 및 인증 문서를 완벽하게 지원합니다.',
              original_text:
                '설립 이래 첨단 정밀 제조 및 IT 소프트웨어 기업을 대상으로 전용 초안 생성 파이프라인을 공급해 왔으며, 표준 공정 데이터 및 인증 문서를 완벽하게 지원합니다.',
              is_modified: false,
              fact_ids: ['fact-3'],
            },
          ],
        },
        {
          key: 'business_areas',
          title: '2. 주요 사업 분야',
          paragraphs: [
            {
              paragraph_id: 'p-2-1',
              text: '주요 사업 분야는 ① 맞춤형 기업 소개서 자동 생성 솔루션, ② 공정 품질 시험성적서 기반 기술 문서 분석 파이프라인, ③ 멀티모달 데이터 정합성 사전 점검 엔진 개발 등입니다.',
              original_text:
                '주요 사업 분야는 ① 맞춤형 기업 소개서 자동 생성 솔루션, ② 공정 품질 시험성적서 기반 기술 문서 분석 파이프라인, ③ 멀티모달 데이터 정합성 사전 점검 엔진 개발 등입니다.',
              is_modified: false,
              fact_ids: ['fact-4'],
            },
          ],
        },
        {
          key: 'technology',
          title: '3. 핵심 기술 및 R&D 역량',
          paragraphs: [
            {
              paragraph_id: 'p-3-1',
              text: '자체 개발한 정밀 팩트 그라운딩 모델을 통해 복수 문서 간 상충되는 수치와 고유명사를 99.8% 이상의 정확도로 상호 교차 검증합니다.',
              original_text:
                '자체 개발한 정밀 팩트 그라운딩 모델을 통해 복수 문서 간 상충되는 수치와 고유명사를 99.8% 이상의 정확도로 상호 교차 검증합니다.',
              is_modified: false,
              fact_ids: ['fact-5'],
            },
          ],
        },
        {
          key: 'processes',
          title: '4. 제조 및 생산 공정 프로세스',
          paragraphs: [
            {
              paragraph_id: 'p-4-1',
              text: '원자재 입고 검사부터 정밀 가공, 조립, 100% 전수 기능 검사, 최종 포장 및 출하에 이르는 총 6단계의 엄격한 품질 관리 표준 공정을 운영하고 있습니다.',
              original_text:
                '원자재 입고 검사부터 정밀 가공, 조립, 100% 전수 기능 검사, 최종 포장 및 출하에 이르는 총 6단계의 엄격한 품질 관리 표준 공정을 운영하고 있습니다.',
              is_modified: false,
              fact_ids: ['fact-6'],
            },
          ],
        },
        {
          key: 'certifications',
          title: '5. 인증 및 특허 내역',
          paragraphs: [
            {
              paragraph_id: 'p-5-1',
              text: 'ISO 9001, ISO 14001 국제 인증 및 기업부설연구소 인정서를 보유하고 있으며, 문서 정합성 분석 관련 특허 3건을 출원 및 등록 완료하였습니다.',
              original_text:
                'ISO 9001, ISO 14001 국제 인증 및 기업부설연구소 인정서를 보유하고 있으며, 문서 정합성 분석 관련 특허 3건을 출원 및 등록 완료하였습니다.',
              is_modified: false,
              fact_ids: ['fact-7'],
            },
          ],
        },
      ],
      sources: [
        {
          source_id: 'file-1',
          file_name: '회사소개서_초안자료_2026.pptx',
          document_date: '2026-09-01',
        },
        {
          source_id: 'file-2',
          file_name: '사업자등록증_및_기업부설연구소인증서.pdf',
          document_date: '2026-08-15',
        },
        {
          source_id: 'file-3',
          file_name: '공정품질_시험성적서_2026.docx',
          document_date: '2026-09-10',
        },
      ],
    }

    onLoadMock(mock)
  }

  // 2. S02 사전 점검 상충 해결 Mock
  const handleLoadPrecheckMock = () => {
    const mock: SessionResponse = {
      session_id: 'mock-session-precheck-02',
      stage: 'prechecking',
      company_name_hint: '주식회사 에이전트딸기',
      files: [
        {
          file_id: 'file-1',
          file_name: '회사소개서_자료_2026.pptx',
          file_type: 'pptx',
          size_bytes: 1024 * 512,
          is_selected: true,
        },
        {
          file_id: 'file-2',
          file_name: '사업자등록증.pdf',
          file_type: 'pdf',
          size_bytes: 1024 * 128,
          is_selected: true,
        },
      ],
      selected_file_ids: ['file-1', 'file-2'],
      precheck: {
        status: 'warning',
        summary:
          '주요 14개 항목 중 12개 항목이 정상 확인되었으며, 1건의 상충과 1건의 추가 확인 질문이 있습니다.',
        missing_fields: ['14. 기타 핵심 추가 정보'],
        conflicts: [
          {
            key: 'company_name',
            field_name: '회사명 표기',
            description:
              '자료 1(PPTX)에는 "(주)에이전트딸기", 자료 2(PDF)에는 "주식회사 에이전트딸기"로 표기되어 있습니다.',
            candidates: ['주식회사 에이전트딸기', '(주)에이전트딸기'],
          },
        ],
        questions: [
          {
            question_id: 'q1',
            field: 'certifications',
            question:
              'ISO 9001 인증 만료 일자가 명시되지 않았습니다. 현재 유효 상태인가요?',
            candidates: ['유효함 (2027년까지 갱신)', '현재 갱신 심사진행 중'],
          },
        ],
      },
      draft_sections: [],
    }

    onLoadMock(mock)
  }

  // 3. S01 파일 업로드 상태 Mock
  const handleLoadUploadMock = () => {
    const mock: SessionResponse = {
      session_id: 'mock-session-upload-03',
      stage: 'files_uploaded',
      company_name_hint: '주식회사 에이전트딸기',
      files: [
        {
          file_id: 'file-1',
          file_name: '회사소개서_2026_초안.pptx',
          file_type: 'pptx',
          size_bytes: 1024 * 1024 * 2.4,
          is_selected: true,
          photos: [{ photo_id: 'p1', url: '', caption: '본사 전경' }],
        },
        {
          file_id: 'file-2',
          file_name: '품질보증체계_인증서.pdf',
          file_type: 'pdf',
          size_bytes: 1024 * 512,
          is_selected: true,
        },
      ],
      selected_file_ids: ['file-1', 'file-2'],
      precheck: null,
      draft_sections: [],
    }

    onLoadMock(mock)
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-xs transition-all shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 font-bold text-slate-700 hover:text-slate-900"
        >
          <div className="rounded-lg bg-slate-200/80 p-1 text-slate-600">
            <Code className="h-4 w-4" />
          </div>
          <span>개발 및 UI 테스트 시나리오 로더</span>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>Mock JSON 파일 불러오기</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 펼쳐졌을 때 프리셋 시나리오 버튼들 */}
      {isOpen && (
        <div className="mt-3.5 border-t border-slate-200/70 pt-3 space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 block">
            시나리오별 즉시 테스트:
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleLoadUploadMock}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs text-slate-700 hover:border-[#007A78] hover:bg-[#E6F4F1]/20 transition-all shadow-2xs"
            >
              <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                <FileUp className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold block text-slate-900">
                  1. 업로드 완료 상태
                </span>
                <span className="text-[10px] text-slate-400">
                  S01 파일 2종 등록
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLoadPrecheckMock}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs text-slate-700 hover:border-[#007A78] hover:bg-[#E6F4F1]/20 transition-all shadow-2xs"
            >
              <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold block text-slate-900">
                  2. 사전 점검(상충)
                </span>
                <span className="text-[10px] text-slate-400">
                  S02 상충/질문 검토
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLoadDraftMock}
              className="flex items-center gap-2 rounded-xl border border-teal-200 bg-[#E6F4F1]/40 p-2.5 text-left text-xs text-slate-700 hover:border-[#007A78] hover:bg-[#E6F4F1] transition-all shadow-2xs"
            >
              <div className="rounded-lg bg-[#007A78] p-1.5 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold block text-[#007A78]">
                  3. 초안 완성 및 AI 편집
                </span>
                <span className="text-[10px] text-teal-700">
                  S03 1:1 캔버스 & AI 제안
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
