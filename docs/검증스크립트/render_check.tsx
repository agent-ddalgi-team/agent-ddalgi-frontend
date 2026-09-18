// 검증용 스크립트 (docs/B_프론트엔드_검증기록_0918.md 1절).
// 실행: 이 파일과 run_ssr.mjs를 프로젝트 루트에 복사한 뒤 `node run_ssr.mjs`
// fixtures의 Mock JSON을 실제 화면 컴포넌트에 넣어 서버 렌더링하고, 기대 내용이 출력되는지 자동 대조한다.
import { renderToStaticMarkup } from 'react-dom/server'
import { ResultPanel } from '/src/components/profile/ResultPanel'
import { StatusPanel } from '/src/components/profile/StatusPanel'
import {
  FIELD_LABELS,
  STATUS_LABELS,
} from '/src/constants/profileLabels'
import type { JobResponse, ProfileResult } from '/src/types/profile'
import readyJson from '/fixtures/mock_job_ready.json'
import errorJson from '/fixtures/mock_job_error.json'

const ready = readyJson as JobResponse
const errorRes = errorJson as JobResponse

const strip = (h: string) =>
  h
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n+/g, '\n')
    .trim()
const results: string[] = []
const check = (name: string, ok: boolean, detail = '') =>
  results.push(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`)

// ---- ready 경로 ----
if (!ready.result) throw new Error('mock_job_ready.json에 result가 없습니다.')
const p: ProfileResult = ready.result
const noop = () => {}
const html = renderToStaticMarkup(
  <ResultPanel profile={p} docBusy={false} docStatus={null} onDownload={noop} />,
)
const text = strip(html)

const missingLabels = Object.values(FIELD_LABELS).filter(
  (l) => !text.includes(l),
)
check(
  '14개 항목 한글 라벨 표시',
  missingLabels.length === 0,
  missingLabels.length ? '누락: ' + missingLabels.join(',') : '14/14',
)

const statusSeen = Object.entries(STATUS_LABELS).map(
  ([k, l]) => `${k}=${l}:${text.includes(l) ? 'O' : 'X'}`,
)
check(
  '4가지 상태 배지 라벨 표시',
  Object.values(STATUS_LABELS).every((l) => text.includes(l)),
  statusSeen.join(' '),
)

const fields = Object.values(p.company_info)
const factTexts = fields.flatMap((f) => f.facts.map((x) => x.text))
const missingFacts = factTexts.filter((t) => !text.includes(t))
check(
  '회사정보 fact 본문 표시',
  missingFacts.length === 0,
  `${factTexts.length - missingFacts.length}/${factTexts.length}`,
)

const titles = p.draft_sections.map((s) => s.title)
const paras = p.draft_sections.flatMap((s) => s.paragraphs.map((q) => q.text))
check(
  '본문 13개 섹션 제목 표시',
  titles.every((t) => text.includes(t)),
  `${titles.length}개`,
)
check(
  '본문 문단 원문 그대로 표시',
  paras.every((t) => text.includes(t)),
  `${paras.length}개 문단`,
)

// 본문 순서: 제목이 회사정보 라벨과 겹치므로 본문 영역만 따로 렌더링해 배열 단위로 비교한다.
const draftOnly = strip(
  renderToStaticMarkup(
    <ResultPanel
      profile={{ ...p, company_info: p.company_info }}
      docBusy={false}
      docStatus={null}
      onDownload={noop}
    />,
  ),
)
const bodyStart = draftOnly.indexOf('소개서 본문')
const bodyEnd = draftOnly.indexOf('확인 질문')
const bodyLines = draftOnly
  .slice(bodyStart, bodyEnd)
  .split('\n')
  .slice(1)
  .filter(Boolean)
const expectedBody = p.draft_sections.flatMap((s) => [
  s.title,
  ...s.paragraphs.map((q) => q.text),
])
check(
  '본문 섹션 순서 = 서버 결과 순서',
  JSON.stringify(bodyLines) === JSON.stringify(expectedBody),
)

const qs = p.needs_confirmation.map((q) => q.question)
check(
  '확인 질문 표시',
  qs.every((q) => text.includes(q)),
  `${qs.length}개`,
)

const srcs = p.sources.map((s) => s.file_name)
check('출처 파일명 표시', srcs.every((s) => text.includes(s)), srcs.join(','))
const quotes = fields.flatMap((f) =>
  f.facts.flatMap((x) => x.evidence.map((e) => e.quote)),
)
check(
  '근거 인용문 표시',
  quotes.every((q) => text.includes(q)),
  `${quotes.length}개`,
)

check(
  'is_mock=true → "테스트 데이터" 배지',
  p.is_mock && text.includes('테스트 데이터'),
)
check(
  'MD/DOCX 저장 버튼 표시',
  text.includes('MD 문서 저장') && text.includes('DOCX 문서 저장'),
)

// is_mock=false 일 때 배지 없음
const htmlReal = renderToStaticMarkup(
  <ResultPanel
    profile={{ ...p, is_mock: false }}
    docBusy={false}
    docStatus={null}
    onDownload={noop}
  />,
)
check('is_mock=false → 배지 없음', !strip(htmlReal).includes('테스트 데이터'))

// ---- error 경로 ----
if (!errorRes.error) throw new Error('mock_job_error.json에 error가 없습니다.')
const errHtml = strip(
  renderToStaticMarkup(
    <StatusPanel status="error" jobId={null} error={errorRes.error} />,
  ),
)
check(
  'error 응답 → 상태 패널에 [코드] 메시지 표시',
  errHtml.includes(`[${errorRes.error.code}] ${errorRes.error.message}`),
  errHtml.split('\n').slice(-1)[0],
)

console.log(results.join('\n'))
console.log('\n===== 회사정보 영역 렌더링 텍스트(발췌) =====')
console.log(text.split('\n').slice(0, 40).join('\n'))
