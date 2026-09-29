import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import type { DraftBlock, EvidenceRef, Preflight } from '../../api/aiWorkflow'
import type { SourceSession, WorkSource } from '../../api/sources'
import type { useAiWorkflow } from '../../hooks/useAiWorkflow'

type Workflow = ReturnType<typeof useAiWorkflow>
const labels: Record<string, string> = {
  company_name: '회사명',
  company_summary: '회사 개요',
  business_areas: '사업 분야',
  products_services: '제품·서비스',
  technology: '기술·연구개발',
  processes: '공정',
  process_count: '공정 수',
  capabilities: '설비·생산 역량',
  strengths: '강점',
  customers_markets: '고객·시장',
  certifications: '인증',
  history: '연혁',
  lead_time: '납기',
  other_info: '기타 정보',
}
const statusLabel = {
  supported: '근거 있음',
  needs_confirmation: '확인 필요',
  conflict: '자료 간 상충',
  missing: '자료 없음',
}
const factCategory: Record<string, string> = {
  company_name: '개요',
  company_summary: '개요',
  business_areas: '개요',
  history: '개요',
  customers_markets: '개요',
  other_info: '개요',
  products_services: '공정/품질',
  technology: '공정/품질',
  processes: '공정/품질',
  process_count: '공정/품질',
  capabilities: '공정/품질',
  strengths: '공정/품질',
  lead_time: '공정/품질',
  certifications: '인증',
}
const categories = ['개요', '공정/품질', '인증'] as const
const button =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
const primary =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#007A78] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#006663] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none'
const text = (value: unknown) => (typeof value === 'string' ? value : '')

function categoryState(facts: Preflight['facts'], category: string) {
  const items = facts.filter(
    (fact) => (factCategory[fact.field_key] || '개요') === category,
  )
  const supported = items.filter((fact) => fact.status === 'supported').length
  const total = items.length
  if (!total || !supported)
    return { text: '자료 없음', tone: 'text-amber-600', supported, total }
  if (supported === total)
    return { text: '충분', tone: 'text-slate-900', supported, total }
  return { text: '보완 권장', tone: 'text-amber-600', supported, total }
}

export function Evidence({
  refs,
  sources,
}: {
  refs: EvidenceRef[]
  sources: WorkSource[]
}) {
  if (!refs.length) return null
  return (
    <details className="mt-3 text-xs text-slate-600">
      <summary className="cursor-pointer font-semibold text-teal-800">
        근거 {refs.length}개 확인
      </summary>
      <ul className="mt-2 space-y-3">
        {refs.map((ref, i) => (
          <li
            key={`${ref.segment_id}-${i}`}
            className="rounded-lg bg-slate-50 p-3"
          >
            <p className="font-semibold">
              {sources.find((s) => s.source_id === ref.source_id)?.name ||
                ref.source_id}
            </p>
            <p className="mt-1 break-words">
              {Object.entries(ref.locator)
                .map(
                  ([key, value]) =>
                    `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`,
                )
                .join(' · ')}
            </p>
            <blockquote className="mt-2 whitespace-pre-wrap border-l-2 border-teal-300 pl-3">
              {ref.excerpt}
            </blockquote>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function Block({
  block,
  sid,
  sources,
}: {
  block: DraftBlock
  sid: string
  sources: WorkSource[]
}) {
  const content = block.content
  return (
    <div className="my-5 break-words">
      {block.type === 'heading' ? (
        <h4 className="text-lg font-bold">{text(content.text)}</h4>
      ) : block.type === 'paragraph' ? (
        <p className="whitespace-pre-wrap leading-8">{text(content.text)}</p>
      ) : block.type === 'list' ? (
        <ul className="list-disc space-y-2 pl-6">
          {(Array.isArray(content.items) ? content.items : []).map(
            (item, i) => (
              <li key={i}>
                {typeof item === 'string' ? item : text(item?.text)}
              </li>
            ),
          )}
        </ul>
      ) : block.type === 'image' && typeof content.asset_id === 'string' ? (
        <figure>
          <img
            className="max-h-96 w-full rounded-lg object-contain"
            src={`/api/v1/sessions/${encodeURIComponent(sid)}/assets/${encodeURIComponent(content.asset_id)}`}
            alt={
              text(content.alt) || text(content.caption) || '선택 자료 이미지'
            }
          />
          <figcaption className="mt-2 text-sm text-slate-500">
            {text(content.caption)}
          </figcaption>
        </figure>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          {text(content.caption) ||
            text(content.text) ||
            '사진을 추가할 자리입니다.'}
        </p>
      )}
      <Evidence refs={block.evidence_refs} sources={sources} />
    </div>
  )
}

export function AiWorkflowPanel({
  ai,
  sources,
  session,
  selectedCount,
  readableCount,
  blocked,
  canAnalyze,
  onAnalyze,
}: {
  ai: Workflow
  sources: WorkSource[]
  session: SourceSession | null
  selectedCount: number
  readableCount: number
  blocked: boolean
  canAnalyze: boolean
  onAnalyze: () => void
}) {
  const { preflight, document: result, job } = ai
  const document = result?.document
  const working = ai.busy || ai.watch
  const facts = preflight?.facts ?? []
  const supported = facts.filter((f) => f.status === 'supported').length
  const count = (status: Preflight['facts'][number]['status']) =>
    facts.filter((f) => f.status === status).length
  const openIssues = (preflight?.issues ?? []).filter(
    (i) => i.status === 'open',
  )
  const blockers = openIssues.filter((i) => i.severity === 'blocker')
  const ready = !!preflight?.can_generate && !blockers.length
  const badge: [string, string, typeof Check] = document
    ? ['초안 생성됨', 'bg-emerald-50 text-emerald-800', CheckCircle2]
    : working
      ? ['점검 중', 'bg-teal-50 text-teal-800', Loader2]
      : preflight
        ? preflight.can_generate
          ? ['점검 완료', 'bg-emerald-50 text-emerald-800', Check]
          : ['보완 필요', 'bg-amber-50 text-amber-800', AlertTriangle]
        : [session ? '대기' : '작업 전', 'bg-slate-100 text-slate-500', Info]
  const BadgeIcon = badge[2]
  return (
    <section
      id="ai-workflow"
      aria-label="AI 점검과 초안"
      className="flex scroll-mt-20 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Sparkles className="h-5 w-5 text-[#007A78]" />
          사전 점검
        </h2>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${badge[1]}`}
        >
          <BadgeIcon className={`h-3 w-3 ${working ? 'animate-spin' : ''}`} />
          {badge[0]}
        </span>
      </div>
      <p className="-mt-2 text-[11px] leading-relaxed text-slate-500">
        {!session
          ? '작성 설정을 고르고 작업을 시작하면 선택한 자료의 사실과 근거를 점검할 수 있습니다.'
          : preflight
            ? `선택한 목적과 텍스트 자료 ${preflight.usable_source_ids.length}건을 검토했습니다. 자료나 작성 조건을 바꾸면 다시 점검해야 합니다.`
            : `선택한 자료 ${selectedCount}개 중 텍스트를 읽은 자료 ${readableCount}개로 회사 정보를 정리합니다. 점검 결과를 확인한 뒤 초안을 만듭니다.`}
      </p>

      {working && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-teal-50 p-3 text-xs text-teal-800"
        >
          <Loader2 size={16} className="animate-spin" />
          {job?.progress.message || 'AI 작업 상태를 확인하고 있습니다.'}
        </p>
      )}
      {!working && ai.notice && (
        <p role="status" className="text-xs text-teal-800">
          {ai.notice}
        </p>
      )}
      {ai.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
        >
          {ai.error}
        </div>
      )}
      {ai.pendingResponse && !ai.busy && (
        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          <p>
            요청의 접수 여부를 확인하지 못했습니다. 같은 요청으로 다시 확인하면
            작업을 중복 생성하지 않습니다.
          </p>
          <button
            type="button"
            className={`${button} mt-2`}
            disabled={blocked}
            onClick={() => void ai.retryResponse()}
          >
            같은 AI 요청 다시 확인
          </button>
        </div>
      )}
      {(ai.saved?.attempt?.jobId || (ai.error && !ai.pendingResponse)) &&
        !working && (
          <button
            type="button"
            className={button}
            disabled={blocked}
            onClick={ai.refreshResult}
          >
            결과 상태 다시 확인
          </button>
        )}

      {!preflight && !document && (
        <>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[11px] leading-relaxed text-slate-600">
            <p className="text-xs font-bold text-slate-800">
              자료 선택 후 AI 점검
            </p>
            <p className="mt-1">
              ‘AI 자료 점검’을 누르면 선택 자료의 사실·근거·보완 사항을
              분석합니다. 점수 대신 범주별 근거 상태와 확인할 사항을 보여
              줍니다.
            </p>
          </div>
          <button
            type="button"
            className={`${primary} w-full`}
            disabled={!canAnalyze}
            onClick={onAnalyze}
          >
            AI 자료 점검
          </button>
        </>
      )}

      {preflight && (
        <div data-testid="preflight-result" className="flex flex-col gap-3">
          <div
            className={`flex flex-col gap-1 rounded-xl border p-3.5 ${
              ready
                ? 'border-[#007A78]/20 bg-[#E6F4F1]'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-xs font-bold ${ready ? 'text-[#007A78]' : 'text-amber-900'}`}
            >
              {ready ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>
                {preflight.can_generate
                  ? blockers.length
                    ? '확인할 사항을 검토한 뒤 초안을 만들 수 있어요'
                    : '초안을 만들 수 있어요'
                  : '사용할 텍스트 근거가 없습니다'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700">
              {preflight.can_generate
                ? `사실 ${facts.length}개 중 ${supported}개에 원문 근거가 연결되었습니다. 점검 완료는 사용자 확인과 다르므로 아래에서 내용을 확인해 주세요.`
                : '자료를 보완하고 다시 점검해 주세요. 사진만으로는 회사 내용을 작성할 수 없습니다.'}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">자료 충실도</span>
              <span className="text-[#007A78]">
                근거 있음 {supported} / 사실 {facts.length}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
              role="img"
              aria-label={`사실 ${facts.length}개 중 근거 있음 ${supported}개`}
            >
              <div
                className="h-full rounded-full bg-[#007A78] transition-all duration-700"
                style={{
                  width: `${facts.length ? (supported / facts.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-3 pt-1 text-center text-[11px] text-slate-500">
              {categories.map((category) => {
                const state = categoryState(facts, category)
                return (
                  <div
                    key={category}
                    title={`근거 있음 ${state.supported} / ${state.total}`}
                  >
                    {category}
                    <strong className={`block font-semibold ${state.tone}`}>
                      {state.text}
                    </strong>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              확인 필요 {count('needs_confirmation')} · 자료 간 상충{' '}
              {count('conflict')} · 자료 없음 {count('missing')}
            </p>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <FileText className="h-4 w-4 text-[#007A78]" />
                <span>추천 구성 플랜</span>
              </div>
              <span className="rounded bg-[#007A78] px-2 py-0.5 text-[10px] font-bold text-white">
                {preflight.recommendations.suggested_pages}쪽 구조
              </span>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600">
              {preflight.recommendations.reason ||
                '추천은 안내일 뿐이며 목표 페이지 설정을 자동으로 바꾸지 않습니다.'}
            </p>
          </div>

          {!!preflight.recommendations.needed.length && (
            <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  추가하면 좋은 자료
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  보완 권장
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {preflight.recommendations.needed.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 rounded bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-600"
                  >
                    <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#007A78]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!!openIssues.length && (
            <div className="flex flex-col gap-1.5">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                확인할 사항 {openIssues.length}건
              </h4>
              <ul className="flex flex-col gap-1.5 text-[11px]">
                {openIssues.map((issue) => (
                  <li
                    key={issue.issue_id}
                    className={`rounded-lg p-2.5 leading-relaxed ${issue.severity === 'blocker' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'}`}
                  >
                    <span className="mr-1.5 font-bold">
                      {issue.severity === 'blocker'
                        ? '검토 필요'
                        : issue.severity === 'warning'
                          ? '주의'
                          : '안내'}
                    </span>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details className="rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#007A78]">
              사실과 근거 자세히 보기 ({facts.length}개)
            </summary>
            <div className="mt-3 grid gap-2">
              {facts.map((fact) => (
                <article
                  key={fact.fact_id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h4 className="text-xs font-semibold">
                      {labels[fact.field_key] || fact.field_key}
                    </h4>
                    <span
                      className={`text-[11px] font-semibold ${fact.status === 'supported' ? 'text-[#007A78]' : 'text-amber-800'}`}
                    >
                      {statusLabel[fact.status]}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed">
                    {fact.value ||
                      (fact.status === 'conflict'
                        ? '자료마다 내용이 달라 확정하지 않았습니다.'
                        : '선택한 자료에서 확인되지 않았습니다.')}
                  </p>
                  {fact.alternatives?.map((alternative, i) => (
                    <p key={i} className="mt-1.5 text-xs text-amber-900">
                      후보 {i + 1}: {alternative.value}
                    </p>
                  ))}
                  <Evidence refs={fact.evidence_refs} sources={sources} />
                </article>
              ))}
            </div>
          </details>

          {!document && (
            <>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canAnalyze}
                onClick={onAnalyze}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                자료를 바꾸고 다시 점검
              </button>
              <label className="flex cursor-pointer select-none items-start gap-2.5 rounded-xl p-2 transition-colors hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-[#007A78]"
                  checked={ai.confirmed}
                  disabled={blocked || !ai.canConfirm}
                  onChange={(e) => ai.setConfirmed(e.target.checked)}
                />
                <span className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">
                    점검 내용을 확인했습니다.
                  </span>
                  <span className="mt-0.5 text-[11px] leading-tight text-slate-500">
                    확인은 초안 작성에 대한 확인입니다. 누락·상충 사항이
                    해결되거나 최종 문서가 승인되는 것은 아닙니다.
                  </span>
                </span>
              </label>
              <button
                type="button"
                className={`${primary} w-full`}
                disabled={blocked || !ai.canConfirm || !ai.confirmed}
                onClick={() => void ai.generate()}
              >
                확인한 자료로 초안 생성
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
