// Default: real HTTP/UI against an isolated v11 DB and mock Agent.
// AI_CHECK_LIVE=1: one preflight/draft; --publication adds one review.
// --publication --proposal: isolated server/DB, additionally one text proposal.
// --publication --review-replay + AI_CHECK_REVIEW_INPUT: reuse saved synthetic input; one review only.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'

const paid = process.env.AI_CHECK_LIVE === '1'
const reviewReplay = process.argv.includes('--review-replay')
const replayInput = reviewReplay ? process.env.AI_CHECK_REVIEW_INPUT : null
assert(
  !reviewReplay || replayInput,
  '--review-replay requires AI_CHECK_REVIEW_INPUT',
)
const replayData = reviewReplay
  ? JSON.parse(await readFile(replayInput, 'utf8'))
  : null
assert(
  !reviewReplay || replayData.fixture.startsWith('[시연]'),
  'Synthetic replay only',
)
const live = paid || reviewReplay
const publication = process.argv.includes('--publication')
const proposalTrial = process.argv.includes('--proposal')
const photoTrial = process.argv.includes('--photos')
assert(
  !photoTrial || (publication && !live),
  '--photos uses isolated mock --publication',
)
assert(!proposalTrial || publication, '--proposal requires --publication')
assert(
  !reviewReplay || (publication && !proposalTrial),
  'Replay requires --publication without --proposal',
)
const isolatedLlm = paid && (proposalTrial || reviewReplay)
const output = await mkdtemp(join(tmpdir(), 'ddalgi-ai-ui-'))
const backendRoot = process.env.AI_CHECK_BACKEND || 'C:/backend'
const originLive = process.env.AI_CHECK_URL || 'http://127.0.0.1:5173'
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(originLive))
let origin, backend, vite, browser, socket, sessionId
let sequence = 0,
  browserLog = '',
  backendLog = '',
  dropPost = '',
  dropped = false,
  failPoll = false,
  failedPoll = false
let dropSave = false,
  dropApply = false
const pending = new Map(),
  errors = [],
  calls = [],
  checks = []
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
async function until(check, label, timeout = 25000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    if (await check()) return
    await delay(120)
  }
  throw new Error(`Timeout: ${label}`)
}
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`CDP timeout: ${method}`))
    }, 15000)
    pending.set(id, { resolve, reject, timer })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
function intercept(method, params) {
  void command(method, params).catch((cause) => {
    // Reload can cancel a request after Fetch.requestPaused was delivered.
    if (cause?.code === -32000 && /Invalid InterceptionId/i.test(cause.message))
      return
    errors.push('CDP interception: ' + JSON.stringify(cause))
  })
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails)
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text,
    )
  return result.result.value
}
const click = (label) =>
  evaluate(
    `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled&&b.getClientRects().length);if(!b)throw Error('Button unavailable: '+${JSON.stringify(label)});b.click()})()`,
  )
const screen = async (step) => {
  await until(
    () =>
      evaluate(
        `!!document.querySelector('button[aria-label^="${step}단계"]:not(:disabled)')`,
      ),
    'step available ' + step,
  )
  await evaluate(
    `(()=>{const b=document.querySelector('button[aria-label^="${step}단계"]');if(!b||b.disabled)throw Error('Step unavailable');b.click()})()`,
  )
  await until(
    () =>
      evaluate(
        `!!document.querySelector('[data-screen="S0${step}"]:not([hidden])')`,
      ),
    'screen ' + step,
  )
}
const reload = async () => {
  await evaluate('window.__testReload = true')
  await command('Page.reload')
  await until(
    () =>
      evaluate(
        `!window.__testReload && document.readyState === 'complete' && !!document.querySelector('button[aria-label^="1단계"]')`,
      ),
    'new page loaded',
  )
}
const editorPage = async (id) => {
  await screen(2)
  await evaluate(
    `(()=>{const t=document.querySelector('textarea[data-edit-block="${id}"]') || document.querySelector('[data-block-id="${id}"]');const p=t.closest('[data-editor-page]').dataset.editorPage;document.querySelector('[data-page-select="'+p+'"]').click()})()`,
  )
  await until(
    () =>
      evaluate(
        `!!document.querySelector('[data-block-id="${id}"]').getClientRects().length`,
      ),
    'selected editor page',
  )
}
const idle = () =>
  until(
    () => evaluate(`!document.querySelector('[role=status] .animate-spin')`),
    'idle',
  )
const saved = () =>
  evaluate(`JSON.parse(sessionStorage.getItem('ddalgi.sources.v1.ai')||'null')`)
const posts = (kind) =>
  calls.filter((c) => c.method === 'POST' && c.path.endsWith('/' + kind))
const has = (selector) =>
  evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)
const upload = (name, content) =>
  evaluate(
    `(()=>{const i=document.querySelector('input[type=file]');const d=new DataTransfer();d.items.add(new File([${JSON.stringify(content)}],${JSON.stringify(name)},{type:'text/plain'}));i.files=d.files;i.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  )
const changePurpose = (value) =>
  evaluate(
    `(()=>{const i=document.querySelector('input[aria-label="사용 목적"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,${JSON.stringify(value)});i.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  )
const confirm = () =>
  evaluate(
    `document.querySelector('[data-testid=preflight-result] input[type=checkbox]').click()`,
  )
const draftDisabled = () =>
  evaluate(
    `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='확인한 자료로 초안 생성')?.disabled`,
  )
async function screenshot(name) {
  const shot = await command('Page.captureScreenshot', { format: 'png' })
  await writeFile(join(output, name), Buffer.from(shot.data, 'base64'))
}
try {
  if (live && !isolatedLlm && !reviewReplay) origin = originLive
  else {
    backend = spawn(
      join(backendRoot, '.venv/Scripts/python.exe'),
      [
        '-X',
        'utf8',
        '-B',
        '-u',
        '-c',
        `
import json, logging, os, socket, sys, threading
from pathlib import Path
os.environ['PYTHON_DOTENV_DISABLED']='1'
live_trial=os.environ.get('AI_UI_LLM') == '1'
if live_trial:
 from dotenv import dotenv_values
 values=dotenv_values(Path.cwd()/'.env')
 for name in ('OPENAI_API_KEY','OPENAI_MODEL','OPENAI_TIMEOUT_SECONDS','OPENAI_MAX_RETRIES','OPENAI_MAX_OUTPUT_TOKENS','OPENAI_MAX_INPUT_CHARS'):
  if not os.environ.get(name): os.environ[name]=values.get(name) or ''
 os.environ['OPENAI_ENABLE_CONTENT_REVIEW']='true'
 os.environ['OPENAI_ENABLE_TEXT_PROPOSALS']='true'
 logging.basicConfig(level=logging.WARNING)
 logging.getLogger('app.agent_llm').setLevel(logging.INFO)
from app.config import Settings
from app.db import init_orm_db
from app import create_app
import uvicorn
root=Path(os.environ['AI_UI_TEMP'])
settings=Settings(private_runs_dir=root/'runs',db_path=root/'runs'/'app.sqlite3',agent_mode='llm' if live_trial else 'mock',demo_mode=True,cleanup_sweep_interval_s=0)
init_orm_db(settings.db_path,settings.private_runs_dir)
app=create_app(settings)
trial_ledger=None
# The synthetic failure is used only by mock tests.
if live_trial:
 from app.agent_bridge import get_bridge
 get_bridge(settings)  # Validate settings before HTTP/UI, without an API call.
from app.agent_mock import MockAgent
from app.agent_bridge import AgentError
original_propose=MockAgent.propose
async def proposal_fixture(self, request):
 if request.instruction == 'UI_CHECK_UNSUPPORTED':
  raise AgentError('UNSUPPORTED_PROPOSAL', '실제 AI 수정안 기능은 아직 연결되지 않았습니다.', False)
 return await original_propose(self, request)
if not live_trial: MockAgent.propose=proposal_fixture
if os.environ.get('AI_UI_REVIEW_INPUT'):
 from app import agent_llm as llm
 from app.agent_bridge import AnalyzeResult, DraftResult
 from app.models import PreflightOut, Document
 from app.services import ai_jobs
 saved=json.loads(Path(os.environ['AI_UI_REVIEW_INPUT']).read_text(encoding='utf8'))
 assert saved['fixture'].startswith('[시연]')
 replay_pf=PreflightOut.model_validate(saved['preflight'])
 replay_doc=Document.model_validate(saved['document'])
 if live_trial:
  trial_ledger=llm.TrialLedger(max_calls=1,review_only=True)
  options=llm.LlmOptions.from_env(os.environ)
  reviewer=llm.LlmAgent(llm.OpenAIRequester(options,ledger=trial_ledger),max_input_chars=options.max_input_chars)
 else:
  def offline_review(instructions,payload,schema,name):
   assert name == 'content_review'
   return {'checked_block_ids':payload['changed_block_ids'],'findings':[]}
  reviewer=llm.LlmAgent(offline_review,max_input_chars=10000)
 class ReplayBridge:
  review_calls=0
  def remap(self,request,value):
   assert request.brief.model_dump() == saved['brief']
   assert len(request.sources) == 1
   source=request.sources[0]
   assert chr(10).join(s.text for s in source.segments).strip() == saved['fixture'].strip()
   positions={json.dumps(s.locator,sort_keys=True):s for s in source.segments}
   ids={}
   for fact in replay_pf.facts:
    for ref in fact.evidence_refs:
     segment=positions[json.dumps(ref.locator,sort_keys=True)]
     assert ref.excerpt in segment.text and ref.source_version == source.source_version
     ids[ref.source_id]=source.source_id
     ids[ref.segment_id]=segment.segment_id
   def mapped(item):
    if isinstance(item,dict): return {k:mapped(v) for k,v in item.items()}
    if isinstance(item,list): return [mapped(v) for v in item]
    return ids.get(item,item) if isinstance(item,str) else item
   return mapped(value)
  def analyze(self,request):
   pf=PreflightOut.model_validate(self.remap(request,replay_pf.model_dump()))
   return AnalyzeResult(pf.facts,pf.issues,pf.recommendations)
  def draft(self,request):
   doc=Document.model_validate(self.remap(request,replay_doc.model_dump()))
   return DraftResult(doc.title,doc.pages)
  def validate(self,request):
   self.review_calls+=1
   assert self.review_calls == 1, 'Only one review is permitted in this replay'
   return reviewer.validate(request)
  def propose(self,request):
   raise AgentError('UNSUPPORTED_PROPOSAL','Replay does not generate new proposals',False)
 replay_bridge=ReplayBridge()
 ai_jobs.get_bridge=lambda config: replay_bridge
sock=socket.socket();sock.bind(('127.0.0.1',0))
print('READY_PORT='+str(sock.getsockname()[1]),flush=True)
server=uvicorn.Server(uvicorn.Config(app,log_level='warning'))
def watch_parent():
 sys.stdin.read()
 server.should_exit=True
threading.Thread(target=watch_parent,daemon=True).start()
try:
 server.run(sockets=[sock])
finally:
 if live_trial:
  from app.agent_llm import trial_report
  print('TRIAL_REPORT='+json.dumps(trial_ledger.snapshot() if trial_ledger is not None else trial_report()),flush=True)
`,
      ],
      {
        cwd: backendRoot,
        env: {
          ...process.env,
          AI_UI_TEMP: output,
          AI_UI_LLM: isolatedLlm ? '1' : '0',
          AI_UI_REVIEW_INPUT: replayInput || '',
          PYTHON_DOTENV_DISABLED: '1',
        },
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
    backend.stdout.on('data', (s) => {
      backendLog += s
    })
    backend.stderr.on('data', (s) => {
      backendLog += s
    })
    backend.on('error', (e) => {
      backendLog += e.message
    })
    await until(
      () => /READY_PORT=(\d+)/.test(backendLog),
      'isolated backend start',
    )
    const port = backendLog.match(/READY_PORT=(\d+)/)[1]
    vite = await createServer({
      root: resolve('.'),
      cacheDir: join(output, 'vite-cache'),
      server: {
        host: '127.0.0.1',
        port: 0,
        proxy: {
          '/api': { target: `http://127.0.0.1:${port}`, changeOrigin: true },
        },
      },
    })
    await vite.listen()
    origin = `http://127.0.0.1:${vite.httpServer.address().port}`
  }
  browser = spawn(
    process.env.SOURCES_BROWSER_PATH ||
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      `--user-data-dir=${join(output, 'profile')}`,
      'about:blank',
    ],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
  )
  browser.stderr.on('data', (s) => {
    browserLog += s
  })
  await until(
    () => /DevTools listening on (ws:\/\/\S+)/.test(browserLog),
    'browser start',
  )
  const browserUrl = browserLog.match(/DevTools listening on (ws:\/\/\S+)/)[1]
  const tabs = await (
    await fetch(`http://${new URL(browserUrl).host}/json/list`)
  ).json()
  socket = new WebSocket(
    tabs.find((t) => t.type === 'page').webSocketDebuggerUrl,
  )
  await new Promise((r, j) => {
    socket.onopen = r
    socket.onerror = j
  })
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.id && pending.has(data.id)) {
      const task = pending.get(data.id)
      clearTimeout(task.timer)
      pending.delete(data.id)
      if (data.error) task.reject(data.error)
      else task.resolve(data.result)
    } else if (data.method === 'Runtime.exceptionThrown')
      errors.push(
        data.params.exceptionDetails.exception?.description ||
          data.params.exceptionDetails.text,
      )
    else if (
      data.method === 'Network.requestWillBeSent' &&
      data.params.request.url.includes('/api/')
    ) {
      const r = data.params.request
      calls.push({
        method: r.method,
        path: new URL(r.url).pathname,
        key: r.headers['Idempotency-Key'] || r.headers['idempotency-key'],
      })
    } else if (data.method === 'Fetch.requestPaused') {
      const p = data.params
      if (
        dropApply &&
        p.request.method === 'POST' &&
        new URL(p.request.url).pathname.endsWith('/apply') &&
        p.responseStatusCode === 200
      ) {
        dropApply = false
        dropped = true
        intercept('Fetch.failRequest', {
          requestId: p.requestId,
          errorReason: 'ConnectionReset',
        })
        return
      }
      if (
        dropSave &&
        p.request.method === 'PATCH' &&
        p.request.url.includes('/documents/') &&
        p.responseStatusCode === 200
      ) {
        dropSave = false
        dropped = true
        intercept('Fetch.failRequest', {
          requestId: p.requestId,
          errorReason: 'ConnectionReset',
        })
        return
      }
      if (
        dropPost &&
        p.request.method === 'POST' &&
        new URL(p.request.url).pathname.endsWith('/' + dropPost) &&
        p.responseStatusCode === 202
      ) {
        dropPost = ''
        dropped = true
        intercept('Fetch.failRequest', {
          requestId: p.requestId,
          errorReason: 'ConnectionReset',
        })
      } else if (
        failPoll &&
        p.request.method === 'GET' &&
        /\/jobs\//.test(p.request.url)
      ) {
        failPoll = false
        failedPoll = true
        intercept('Fetch.failRequest', {
          requestId: p.requestId,
          errorReason: 'ConnectionReset',
        })
      } else intercept('Fetch.continueRequest', { requestId: p.requestId })
    }
  }
  await command('Page.enable')
  await command('Runtime.enable')
  await command('Network.enable')
  await command('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await command('Page.navigate', { url: origin })
  await until(
    () =>
      evaluate(
        `!![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='작업 시작 / 이어하기'&&!b.disabled)`,
      ),
    'start screen',
  )
  await click('작업 시작 / 이어하기')
  await idle()
  sessionId = await evaluate(
    `JSON.parse(sessionStorage.getItem('ddalgi.sources.v1')).sessionId`,
  )
  assert.ok(
    await evaluate(
      `[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='AI 자료 점검').every(b=>b.disabled)`,
    ),
  )
  const fixture = reviewReplay
    ? replayData.fixture
    : proposalTrial
      ? '[시연] 화면 연결 확인용 가상 기업 자료입니다.\n회사명: 테스트나무\n주요 사업: 작업 기록 관리 소프트웨어 개발\n회사 개요: 테스트나무는 작업 기록 관리 소프트웨어를 개발하는 가상 기업입니다.\n납기: 일반 주문: 주문 승인 후 영업일 7일, 특수 주문: 납기 별도 협의.\n'
      : live && publication
        ? '[시연] 화면 연결 확인용 가상 기업 자료입니다.\n회사명: 테스트나무\n주요 사업: 작업 기록 관리 소프트웨어 개발\n회사 개요: 테스트나무는 작업 기록 관리 소프트웨어를 개발하는 가상 기업입니다.\n'
        : '[시연] 아래 내용은 화면 연결 확인용 가상 회사 자료입니다.\n회사명: 테스트나무\n회사 개요: 테스트나무는 제조업체를 위한 작업 기록 소프트웨어를 만드는 가상 기업입니다.\n사업 분야: 생산 작업 기록 관리 소프트웨어 개발\n제품 및 서비스: 작업 기록 작성과 조회를 지원하는 웹 프로그램\n기술: 웹 기반 작업 기록 검색\n공정: 요구사항 확인, 프로그램 개발, 사용성 점검\n강점: 작업 기록을 한 화면에서 조회합니다.\n'
  await upload('ai-connection-demo.txt', fixture)
  await until(
    () =>
      evaluate(
        `!!document.querySelector('input[aria-label="ai-connection-demo.txt 선택"]:not(:disabled)')`,
      ),
    'file parsed',
  )
  await evaluate(
    `document.querySelector('input[aria-label="ai-connection-demo.txt 선택"]').click()`,
  )
  await idle()
  if (photoTrial) {
    await evaluate(`(async()=>{const input=document.querySelector('input[type=file]');const files=new DataTransfer();
      for(const [name,color] of [['red.png','red'],['blue.png','blue'],['unselected.png','green']]){
        const c=document.createElement('canvas');c.width=160;c.height=100;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,160,100);
        const blob=await new Promise(r=>c.toBlob(r,'image/png'));files.items.add(new File([blob],name,{type:'image/png'}));
      } input.files=files.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`)
    for (const name of ['red.png', 'blue.png', 'unselected.png']) {
      await until(
        () => has(`input[aria-label="${name} 선택"]:not(:disabled)`),
        'photo parsed ' + name,
      )
    }
    for (const name of ['red.png', 'blue.png']) {
      await evaluate(
        `document.querySelector('input[aria-label="${name} 선택"]').click()`,
      )
      await until(
        () =>
          evaluate(
            `!!document.querySelector('input[aria-label="${name} 선택"]:checked:not(:disabled)')`,
          ),
        'photo selection saved ' + name,
      )
    }
    checks.push('two photo sources selected; third photo remains unselected')
  }
  await screenshot('s01-sources.png')
  checks.push('upload and select text; no selection blocks AI')
  if (!live) {
    await command('Fetch.enable', {
      patterns: [{ urlPattern: '*api/v1/*', requestStage: 'Response' }],
    })
    dropPost = 'preflights'
  }
  await click('AI 자료 점검')
  if (!live) {
    await until(() => dropped, 'preflight response lost')
    await idle()
    const before = posts('preflights').length
    await reload()
    await idle()
    await until(
      () =>
        evaluate(
          `!![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='같은 AI 요청 다시 확인')`,
        ),
      'lost response restored',
    )
    assert.equal(posts('preflights').length, before)
    await click('같은 AI 요청 다시 확인')
    await until(
      () => has('[data-testid=preflight-result]'),
      'retried preflight',
    )
    assert.equal(posts('preflights')[0].key, posts('preflights')[1].key)
    checks.push(
      'lost preflight response survives reload and reuses request key',
    )
  } else
    await until(
      async () => {
        if (await has('#ai-workflow [role=alert]'))
          throw new Error(
            await evaluate(
              `document.querySelector('#ai-workflow [role=alert]').textContent`,
            ),
          )
        return has('[data-testid=preflight-result]')
      },
      'live preflight',
      90000,
    )
  assert.equal(await draftDisabled(), true)
  assert.ok(await has('[data-testid=preflight-result] details'))
  await confirm()
  assert.equal(await draftDisabled(), false)
  await reload()
  await until(() => has('[data-testid=preflight-result]'), 'preflight restored')
  assert.equal(await draftDisabled(), true)
  checks.push('facts and evidence; explicit confirmation resets on reload')
  if (!live) {
    await changePurpose('수정된 소개 목적')
    await idle()
    assert.equal(await draftDisabled(), true)
    await click('작성 조건 저장')
    await idle()
    await until(
      async () => !(await has('[data-testid=preflight-result]')),
      'input change invalidates preflight',
    )
    failPoll = true
    await click('AI 자료 점검')
    await until(() => failedPoll, 'poll failure')
    await until(() => has('#ai-workflow [role=alert]'), 'poll error visible')
    const before = posts('preflights').length
    await click('결과 상태 다시 확인')
    await until(
      () => has('[data-testid=preflight-result]'),
      'GET resumes result',
    )
    assert.equal(posts('preflights').length, before)
    checks.push('input invalidation and failed polling resumes with GET only')
    dropped = false
    dropPost = 'drafts'
  }
  await screenshot('s01-preflight.png')
  await confirm()
  await click('확인한 자료로 초안 생성')
  if (!live) {
    await until(() => dropped, 'draft response lost')
    await idle()
    await reload()
    // A completed document can be restored from the session summary even if POST was lost.
    await until(
      () => has('[data-testid=draft-result]'),
      'draft restored from summary',
    )
    assert.equal(posts('drafts').length, 1)
    checks.push(
      'lost draft response restores saved document without another generation',
    )
  } else
    await until(
      async () => {
        if (await has('#ai-workflow [role=alert]'))
          throw new Error(
            await evaluate(
              `document.querySelector('#ai-workflow [role=alert]').textContent`,
            ),
          )
        return has('[data-testid=draft-result]')
      },
      'live draft',
      90000,
    )
  assert.ok(await has('[data-testid=draft-result] [data-block-id]'))
  const doc = await evaluate(
    `fetch('/api/v1/sessions/${sessionId}').then(r=>r.json()).then(s=>s.document_summary)`,
  )
  assert.ok(doc.document_id)
  const beforeDrafts = posts('drafts').length
  await reload()
  await until(() => has('[data-testid=draft-result]'), 'saved draft reload')
  assert.equal(posts('drafts').length, beforeDrafts)
  await screen(1)
  await evaluate(
    `[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent.includes('이번 작업 첨부')).click()`,
  )
  assert.ok(
    await evaluate(
      `document.querySelector('input[aria-label="ai-connection-demo.txt 선택"]').disabled`,
    ),
  )
  await screen(2)
  await evaluate(
    `document.querySelector('[data-testid=draft-result]').scrollIntoView()`,
  )
  await screenshot('draft.png')
  checks.push('draft saved, rendered and restored; source changes locked')
  if (publication) {
    const route = `/api/v1/sessions/${sessionId}/documents/${doc.document_id}`
    const documentState = () =>
      evaluate(`fetch(${JSON.stringify(route)}).then(r=>r.json())`)
    const setText = async (id, value) => {
      await editorPage(id)
      return evaluate(
        `(()=>{const t=document.querySelector('textarea[data-edit-block="'+${JSON.stringify(id)}+'"]');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,${JSON.stringify(value)});t.dispatchEvent(new Event('input',{bubbles:true}));})()`,
      )
    }
    let prepared = await documentState()
    const blocks = prepared.document.pages.flatMap((p) => p.blocks)
    let editable = blocks.find(
      (b) => b.type === 'paragraph' && b.fact_ids.length,
    )
    if (proposalTrial)
      editable = blocks.find(
        (b) =>
          b.type === 'paragraph' &&
          b.evidence_refs.length &&
          b.content.text.includes('7'),
      )
    assert.ok(editable)
    await until(
      () =>
        evaluate(
          `!!document.querySelector('textarea[data-edit-block="${editable.block_id}"]:not(:disabled)')`,
        ),
      'editor loaded',
    )
    if (proposalTrial) {
      await editorPage(editable.block_id)
      await evaluate(
        `document.querySelector('button[data-block-select="${editable.block_id}"]').click()`,
      )
      await until(
        () =>
          evaluate(
            `!!document.querySelector('button[data-block-select="${editable.block_id}"][aria-pressed="true"]')`,
          ),
        'proposal selection',
      )
      const instruction =
        '일반 주문의 주문 승인 후 영업일 7일과 특수 주문 별도 협의 조건을 모두 유지하면서, 일반 주문과 특수 주문을 두 문장으로 나눠 읽기 쉽게 다듬어 주세요. 새 사실은 추가하지 마세요.'
      await evaluate(
        `(()=>{const t=document.querySelector('textarea[aria-label="AI 문구 수정 요청"]');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,${JSON.stringify(instruction)});t.dispatchEvent(new Event('input',{bubbles:true}));})()`,
      )
      await click('AI 수정안 요청')
      await until(
        async () => {
          const alert = await evaluate(
            `document.querySelector('[data-testid=draft-result] [role=alert]')?.textContent`,
          )
          if (alert) throw Error(alert)
          return evaluate(
            `!!document.querySelector('[data-testid=proposal-result]') && [...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='이 문구 적용'&&!b.disabled)`,
          )
        },
        'text proposal',
        90000,
      )
      const meta = await evaluate(
        `JSON.parse(sessionStorage.getItem('ddalgi.sources.v1.publication'))`,
      )
      const proposalRoute = `/api/v1/sessions/${sessionId}/proposals/${meta.proposalId}`
      const proposal = await evaluate(
        `fetch(${JSON.stringify(proposalRoute)}).then(r=>r.json())`,
      )
      assert.equal(proposal.status, 'proposed')
      assert.deepEqual((await documentState()).document, prepared.document)
      const proposedText = proposal.changes[0].content.text
      assert.equal(proposal.changes.length, 1)
      assert.equal(proposal.changes[0].block_id, editable.block_id)
      assert.equal(proposal.changes[0].op, 'replace_block_content')
      assert.notEqual(proposedText, editable.content.text)
      // Fixture-specific checks supplement human review; they are not a general semantic validator.
      for (const term of [
        '일반 주문',
        '승인 후',
        '영업일 7일',
        '특수 주문',
        '별도 협의',
      ])
        assert.ok(proposedText.includes(term), term)
      assert.equal(
        await evaluate(
          `document.querySelector('[data-proposal-text]').textContent`,
        ),
        proposedText,
      )
      await screenshot('s02-live-proposal.png')
      const requestCount = posts('proposals').length
      await reload()
      await screen(2)
      await until(
        () => has('[data-testid=proposal-result]'),
        'proposal comparison restored',
      )
      assert.equal(posts('proposals').length, requestCount)
      assert.deepEqual((await documentState()).document, prepared.document)
      await click('이 문구 적용')
      await idle()
      const applied = await documentState()
      assert.equal(
        applied.document.document_revision,
        prepared.document.document_revision + 1,
      )
      const appliedBlock = applied.document.pages
        .flatMap((p) => p.blocks)
        .find((b) => b.block_id === editable.block_id)
      assert.equal(appliedBlock.content.text, proposedText)
      assert.deepEqual(appliedBlock.fact_ids, editable.fact_ids)
      assert.deepEqual(appliedBlock.evidence_refs, editable.evidence_refs)
      assert.deepEqual(
        applied.document.pages
          .flatMap((p) => p.blocks)
          .filter((b) => b.block_id !== editable.block_id),
        prepared.document.pages
          .flatMap((p) => p.blocks)
          .filter((b) => b.block_id !== editable.block_id),
      )
      assert.equal(applied.validation, null)
      assert.equal(applied.approval, null)
      await writeFile(
        join(output, 'proposal-result.json'),
        JSON.stringify(
          {
            fixture,
            instruction,
            before: editable.content.text,
            proposal,
            after: appliedBlock.content.text,
          },
          null,
          2,
        ),
      )
      checks.push(
        'text proposal preserves original until explicit apply, restores by GET, preserves conditions/evidence and changes selected block once',
      )
      prepared = applied
      editable = appliedBlock
    }
    if (!live && !proposalTrial) {
      const selectTarget = async () => {
        await editorPage(editable.block_id)
        await evaluate(
          `document.querySelector('button[data-block-select="${editable.block_id}"]').click()`,
        )
        await until(
          () =>
            evaluate(
              `!!document.querySelector('button[data-block-select="${editable.block_id}"][aria-pressed="true"]')`,
            ),
          'proposal target selected',
        )
      }
      const instruction = async (text) => {
        await until(
          () =>
            evaluate(
              `!!document.querySelector('textarea[aria-label="AI 문구 수정 요청"]:not(:disabled)')`,
            ),
          'instruction input ready',
        )
        await evaluate(
          `(()=>{const t=document.querySelector('textarea[aria-label="AI 문구 수정 요청"]');if(t.disabled)throw Error('Instruction disabled');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(t,${JSON.stringify(text)});t.dispatchEvent(new Event('input',{bubbles:true}));})()`,
        )
      }
      const proposalState = async () => {
        const meta = await evaluate(
          `JSON.parse(sessionStorage.getItem('ddalgi.sources.v1.publication'))`,
        )
        return meta.proposalId
          ? evaluate(
              `fetch('/api/v1/sessions/${sessionId}/proposals/${meta.proposalId}').then(r=>r.json())`,
            )
          : null
      }
      const waitProposal = () =>
        until(
          () =>
            evaluate(
              `!!document.querySelector('[data-testid=proposal-result]') && [...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='이 문구 적용'&&!b.disabled)`,
            ),
          'proposal ready',
        )
      await selectTarget()
      await instruction('UI_CHECK_UNSUPPORTED')
      await click('AI 수정안 요청')
      await until(
        () =>
          evaluate(
            `document.querySelector('[data-testid=draft-result] [role=alert]')?.textContent.includes('실제 AI 수정안 기능은 아직 연결되지 않았습니다.')`,
          ),
        'unsupported proposal surfaced',
      )
      await idle()
      assert.equal(
        (await documentState()).document.document_revision,
        prepared.document.document_revision,
      )
      assert.equal(await has('[data-testid=proposal-result]'), false)
      checks.push(
        'unsupported LLM proposal fails visibly without fallback or document mutation',
      )

      const prompt =
        '사실과 수치는 유지하고 읽기 쉽게 정리해 줘. UI 요청 문구 비저장 확인'
      await instruction(prompt)
      dropPost = 'proposals'
      dropped = false
      await click('AI 수정안 요청')
      await until(() => dropped, 'proposal response lost')
      await idle()
      const beforeRecovery = posts('proposals').length
      await reload()
      await until(
        () =>
          evaluate(
            `!!document.querySelector('[data-testid=draft-result]') && [...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='같은 수정안 요청 다시 확인')`,
          ),
        'proposal recovery restored',
      )
      assert.equal(posts('proposals').length, beforeRecovery)
      const stored = await evaluate(
        `sessionStorage.getItem('ddalgi.sources.v1.publication')`,
      )
      assert.equal(stored.includes(prompt), false)
      assert.equal(stored.includes('instruction'), false)
      await instruction('다른 요청 문구')
      await click('같은 수정안 요청 다시 확인')
      await idle()
      assert.equal(posts('proposals').length, beforeRecovery)
      await instruction(prompt)
      await click('같은 수정안 요청 다시 확인')
      await waitProposal()
      assert.equal(posts('proposals').at(-1).key, posts('proposals').at(-2).key)
      const firstProposal = await proposalState()
      assert.equal(firstProposal.status, 'proposed')
      assert.deepEqual(firstProposal.target_block_ids, [editable.block_id])
      assert.equal(
        (await documentState()).document.document_revision,
        prepared.document.document_revision,
      )
      const requestsBeforeReload = posts('proposals').length
      await reload()
      await waitProposal()
      assert.equal(posts('proposals').length, requestsBeforeReload)
      await setText(editable.block_id, editable.content.text + ' 임시 편집')
      assert.ok(
        await evaluate(
          `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='이 문구 적용').disabled`,
        ),
      )
      await setText(editable.block_id, editable.content.text)
      await click('수정안 취소')
      await idle()
      assert.equal((await proposalState()).status, 'rejected')
      assert.equal(
        (await documentState()).document.document_revision,
        prepared.document.document_revision,
      )
      checks.push(
        'proposal request recovery survives reload with same key and hashed instruction; comparison/rejection do not mutate; dirty apply blocked',
      )

      await selectTarget()
      await instruction('의미를 유지하며 문장 정돈')
      failPoll = true
      failedPoll = false
      await click('AI 수정안 요청')
      await until(() => failedPoll, 'proposal polling failure')
      await until(
        () =>
          evaluate(
            `[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='문서 작업 상태 다시 확인')`,
          ),
        'proposal GET retry offered',
      )
      const beforePoll = posts('proposals').length
      await click('문서 작업 상태 다시 확인')
      await waitProposal()
      assert.equal(posts('proposals').length, beforePoll)
      await evaluate('window.scrollTo(0,0)')
      await screenshot('s02-proposal-comparison.png')
      const beforeStale = await documentState()
      await evaluate(
        `fetch(${JSON.stringify(route)},{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({expected_revision:${beforeStale.document.document_revision},operations:[{op:'rename_page',page_id:${JSON.stringify(beforeStale.document.pages[0].page_id)},title:'수정안 기준 변경'}]})})`,
      )
      await click('이 문구 적용')
      await idle()
      assert.equal((await proposalState()).status, 'stale')
      assert.equal(
        (await documentState()).document.document_revision,
        beforeStale.document.document_revision + 1,
      )
      assert.ok(
        await evaluate(
          `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='이 문구 적용').disabled`,
        ),
      )
      await click('내 편집을 버리고 최신 저장본 불러오기')
      await click('최신 저장본 불러오기')
      await idle()
      await click('수정안 취소')
      await idle()
      checks.push(
        'proposal polling resumes with GET only; stale proposal apply rejected',
      )

      await selectTarget()
      await instruction('선택한 문구를 읽기 쉽게 정리')
      await click('AI 수정안 요청')
      await waitProposal()
      const beforeApply = await documentState()
      const candidate = await proposalState()
      dropped = false
      dropApply = true
      await click('이 문구 적용')
      await until(() => dropped, 'proposal apply response lost')
      await idle()
      await reload()
      await until(
        () =>
          evaluate(
            `[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='같은 문서 요청 다시 확인')`,
          ),
        'apply retry restored',
      )
      await click('같은 문서 요청 다시 확인')
      await idle()
      const afterApply = await documentState()
      assert.equal(
        afterApply.document.document_revision,
        beforeApply.document.document_revision + 1,
      )
      assert.equal((await proposalState()).status, 'applied')
      const applied = afterApply.document.pages
        .flatMap((p) => p.blocks)
        .find((b) => b.block_id === editable.block_id)
      assert.equal(applied.content.text, candidate.changes[0].content.text)
      assert.deepEqual(applied.evidence_refs, editable.evidence_refs)
      assert.deepEqual(applied.fact_ids, editable.fact_ids)
      assert.deepEqual(
        afterApply.document.pages
          .flatMap((p) => p.blocks)
          .filter((b) => b.block_id !== editable.block_id),
        beforeApply.document.pages
          .flatMap((p) => p.blocks)
          .filter((b) => b.block_id !== editable.block_id),
      )
      const applies = calls.filter(
        (c) => c.method === 'POST' && c.path.endsWith('/apply'),
      )
      assert.equal(applies.at(-1).key, applies.at(-2).key)
      assert.equal(afterApply.validation, null)
      assert.equal(afterApply.approval, null)
      checks.push(
        'explicit apply changes selected text once; lost apply replay uses same key; other blocks and evidence preserved',
      )
      prepared = afterApply
      editable = applied
    }

    if (photoTrial) {
      const beforePhotos = await documentState()
      const selectBlock = async (id) => {
        await editorPage(id)
        await evaluate(
          `document.querySelector('[data-block-select="${id}"]').click()`,
        )
      }
      const photoReady = () =>
        until(
          () =>
            has(
              '[data-testid=photo-proposal] input[type=radio]:not(:disabled)',
            ),
          'photo candidates ready',
        )
      await selectBlock(editable.block_id)
      dropped = false
      dropPost = 'proposals'
      await click('이 블록 뒤에 사진 추가')
      await until(() => dropped, 'photo request response lost')
      await idle()
      await reload()
      await screen(2)
      await until(
        () =>
          evaluate(
            `[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='같은 사진 후보 요청 다시 확인'&&!b.disabled)`,
          ),
        'photo recovery',
      )
      await click('같은 사진 후보 요청 다시 확인')
      await photoReady()
      assert.equal(posts('proposals').at(-1).key, posts('proposals').at(-2).key)
      assert.deepEqual(
        (await documentState()).document.pages,
        beforePhotos.document.pages,
      )
      assert.equal(
        await evaluate(
          `document.querySelectorAll('[data-testid=photo-proposal] input[type=radio]').length`,
        ),
        2,
      )
      assert.ok(
        await evaluate(
          `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='선택한 사진 적용').disabled`,
        ),
      )
      await evaluate(
        `document.querySelector('[data-testid=photo-proposal] input[value="cand_01"]').click()`,
      )
      await screenshot('s02-photo-candidates.png')
      dropped = false
      dropApply = true
      await click('선택한 사진 적용')
      await until(() => dropped, 'photo apply response lost')
      await idle()
      await reload()
      await screen(2)
      await until(
        () =>
          evaluate(
            `[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='같은 문서 요청 다시 확인'&&!b.disabled)`,
          ),
        'photo apply recovery',
      )
      await click('같은 문서 요청 다시 확인')
      await idle()
      let state = await documentState()
      assert.equal(
        state.document.document_revision,
        beforePhotos.document.document_revision + 1,
      )
      let photo = state.document.pages
        .flatMap((p) => p.blocks)
        .find((b) => b.block_id.startsWith(editable.block_id + '_img_'))
      assert.ok(photo)
      assert.deepEqual(
        state.document.pages
          .flatMap((p) => p.blocks)
          .find((b) => b.block_id === editable.block_id),
        editable,
      )
      const applyPosts = calls.filter(
        (c) => c.method === 'POST' && c.path.endsWith('/apply'),
      )
      assert.equal(applyPosts.at(-1).key, applyPosts.at(-2).key)
      await setText(photo.block_id, '붉은색 사각형')
      await click('문구 저장')
      await idle()
      state = await documentState()
      assert.equal(
        state.document.pages
          .flatMap((p) => p.blocks)
          .find((b) => b.block_id === photo.block_id).content.caption,
        '붉은색 사각형',
      )
      await selectBlock(photo.block_id)
      await click('사진 교체 후보 보기')
      await photoReady()
      await evaluate(
        `document.querySelector('[data-testid=photo-proposal] input[value="cand_02"]').click()`,
      )
      const beforeReplace = await documentState()
      await click('선택한 사진 적용')
      await idle()
      state = await documentState()
      assert.equal(
        state.document.document_revision,
        beforeReplace.document.document_revision + 1,
      )
      const newPhoto = state.document.pages
        .flatMap((p) => p.blocks)
        .find((b) => b.block_id.startsWith(photo.block_id + '_img_'))
      assert.ok(
        newPhoto && newPhoto.content.asset_id !== photo.content.asset_id,
      )
      assert.equal(newPhoto.content.caption, '자료 사진')
      assert.deepEqual(newPhoto.evidence_refs, [])
      await setText(newPhoto.block_id, '파란색 사각형')
      await click('문구 저장')
      await idle()
      await screenshot('s02-photo-replaced.png')
      prepared = await documentState()
      checks.push(
        'selected photos only; candidate lookup preserves document; lost request/apply recover with same keys; explicit selection inserts once; replacement clears old caption; caption saved',
      )
    }
    if (!live) {
      await setText(
        editable.block_id,
        editable.content.text + ' 로컬 편집 보존 확인',
      )
      const navigationCalls = calls.filter((c) => c.method === 'POST').length
      await screen(1)
      assert.ok(
        await evaluate(`document.querySelector('[data-screen="S02"]').hidden`),
      )
      await screen(3)
      assert.ok(
        await evaluate(
          `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='현재 PDF 최종 승인').disabled`,
        ),
      )
      await screen(2)
      assert.equal(
        await evaluate(
          `document.querySelector('textarea[data-edit-block="${editable.block_id}"]').value`,
        ),
        editable.content.text + ' 로컬 편집 보존 확인',
      )
      assert.equal(
        calls.filter((c) => c.method === 'POST').length,
        navigationCalls,
      )
      checks.push(
        'S01/S02/S03 navigation preserves unsaved edits without AI calls; dirty approval blocked',
      )
      await evaluate(
        `fetch(${JSON.stringify(route)},{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({expected_revision:${prepared.document.document_revision},operations:[{op:'rename_page',page_id:${JSON.stringify(prepared.document.pages[0].page_id)},title:'다른 창의 변경'}]})})`,
      )
      await click('문구 저장')
      await idle()
      assert.equal(
        await evaluate(
          `document.querySelector('textarea[data-edit-block="${editable.block_id}"]').value`,
        ),
        editable.content.text + ' 로컬 편집 보존 확인',
      )
      assert.ok(
        await evaluate(
          `document.querySelector('[data-testid=draft-result]').textContent.includes('다른 곳에서 수정된 최신 버전')`,
        ),
      )
      await click('내 편집을 버리고 최신 저장본 불러오기')
      await click('최신 저장본 불러오기')
      await idle()
      checks.push('version conflict keeps local edits until explicit discard')
    }
    if (!reviewReplay) {
      const current = await documentState()
      const expendable = current.document.pages
        .flatMap((p) => p.blocks)
        .filter(
          (b) =>
            b.type === 'image_placeholder' ||
            (b.type === 'paragraph' &&
              ['추가 확인 필요', '자료에서 확인되지 않음'].includes(
                b.content.text,
              )) ||
            (live && b.type === 'heading' && !b.fact_ids.length),
        )
      for (const b of expendable) {
        await editorPage(b.block_id)
        await evaluate(
          `(()=>{const b=[...document.querySelectorAll('[data-block-id="${b.block_id}"] button')].find(b=>b.textContent.includes('삭제'));b.click()})()`,
        )
      }
      await setText(
        editable.block_id,
        editable.content.text.endsWith('.')
          ? editable.content.text + ' '
          : editable.content.text + '.',
      )
      assert.ok(
        await evaluate(
          `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='현재 PDF 최종 승인').disabled`,
        ),
      )
      if (!live) {
        dropped = false
        dropSave = true
      }
      await click('문구 저장')
      if (!live) {
        await until(() => dropped, 'save response dropped')
        await idle()
        await click('같은 문서 요청 다시 확인')
      }
      await idle()
      const edited = await documentState()
      assert.equal(
        edited.document.document_revision,
        current.document.document_revision + 1,
      )
      assert.equal(edited.validation, null)
      assert.equal(edited.approval, null)
      checks.push(
        live
          ? 'edit/delete/save creates one revision'
          : 'edit/delete/save and lost save response create one revision',
      )
    } else {
      assert.deepEqual(
        prepared.document.pages.map((p) => p.blocks.map((b) => b.content)),
        replayData.document.pages.map((p) => p.blocks.map((b) => b.content)),
      )
      checks.push(
        'saved synthetic preflight/draft replayed without paid generation; content unchanged before review',
      )
    }
    if (
      reviewReplay &&
      replayData.document.pages.some((p) => !p.blocks.length)
    ) {
      const beforeCleanup = await documentState()
      const nonemptyPages = beforeCleanup.document.pages.filter(
        (p) => p.blocks.length,
      )
      assert(
        nonemptyPages.length > 0 &&
          nonemptyPages.length < beforeCleanup.document.pages.length,
      )
      await setText(editable.block_id, editable.content.text + ' ')
      assert.ok(
        await evaluate(
          `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='빈 페이지 정리').disabled`,
        ),
      )
      await setText(editable.block_id, editable.content.text)
      if (!paid) {
        dropPost = ''
        failPoll = false
        await command('Fetch.enable', {
          patterns: [{ urlPattern: '*api*', requestStage: 'Response' }],
        })
        dropped = false
        dropSave = true
      }
      await click('빈 페이지 정리')
      if (!paid) {
        await until(() => dropped, 'cleanup response dropped')
        await idle()
        await click('같은 문서 요청 다시 확인')
      }
      await idle()
      const cleaned = await documentState()
      assert.deepEqual(cleaned.document.pages, nonemptyPages)
      assert.equal(
        cleaned.document.document_revision,
        beforeCleanup.document.document_revision + 1,
      )
      assert.equal(cleaned.validation, null)
      assert.equal(cleaned.approval, null)
      await reload()
      await until(
        () => has('[data-testid=draft-result]'),
        'cleaned pages reload',
      )
      await screen(2)
      assert.deepEqual((await documentState()).document.pages, nonemptyPages)
      await screenshot('s02-empty-pages-cleaned.png')
      checks.push(
        'explicit empty-page cleanup preserves all nonempty pages; dirty edits block cleanup; persisted once and restored after reload',
      )
    }
    const edited = await documentState()
    if (live) {
      // Only this script's synthetic fixture and own session; no cookies or credentials.
      const refs = await saved()
      const preflight = await evaluate(
        `fetch('/api/v1/sessions/${sessionId}/preflights/${refs.preflightId}').then(r=>r.json())`,
      )
      const session = await evaluate(
        `fetch('/api/v1/sessions/${sessionId}').then(r=>r.json())`,
      )
      await writeFile(
        join(output, 'review-input.json'),
        JSON.stringify(
          {
            fixture,
            document: edited.document,
            preflight,
            brief: session.brief,
          },
          null,
          2,
        ),
      )
    }
    await screen(3)
    const readable = await evaluate(
      `import('/src/constants/profileLabels.ts').then(m => m.readableIssueMessage('lead_time의 의미·조건을 원문에서 추가 확인해야 합니다.'))`,
    )
    assert.ok(
      readable.includes('납기') &&
        readable.includes('자료를 보완') &&
        !readable.includes('lead_time'),
    )
    const checkTitles = async () => {
      const state = await documentState()
      for (const page of state.document.pages) {
        if (page.blocks[0]?.type !== 'heading') continue
        const card = await evaluate(
          `document.querySelector('[data-review-card="${page.page_id}"]') ? Array.from(document.querySelector('[data-review-card="${page.page_id}"]').children).map(p => p.textContent) : null`,
        )
        assert.ok(card)
        const title = page.blocks[0].content.text
        assert.equal(
          card.filter((text) => text === title).length,
          1,
          'first heading occurs once inside draft card',
        )
      }
    }
    await checkTitles()
    await click('페이지 보기')
    assert.equal(
      await evaluate(
        `document.querySelector('[data-review-page] > h3') !== null`,
      ),
      false,
      'heading block supplies page title',
    )
    await click('카드 보기')
    checks.push(
      'draft cards and page view do not repeat headings; old field-key errors have Korean actions',
    )
    await screenshot('s03-cards-before-check.png')
    await click('내용 검증 실행')
    await until(
      async () => {
        const state = await documentState()
        const alert = await evaluate(
          `document.querySelector('[data-testid=draft-result] [role=alert]')?.textContent`,
        )
        if (alert) throw Error(alert)
        return !!state.validation && state.validation.status !== 'pending'
      },
      'content validation',
      90000,
    )
    await idle()
    // Warnings are acknowledged individually with a reason, never by final consent.
    const issueList = await evaluate(
      `fetch(${JSON.stringify(route + '/issues')}).then(r=>r.json())`,
    )
    if (reviewReplay && paid) {
      await writeFile(
        join(output, 'validation-result.json'),
        JSON.stringify(
          { state: await documentState(), issues: issueList },
          null,
          2,
        ),
      )
    }
    for (const issue of issueList.issues.filter(
      (i) => i.status === 'open' && i.severity === 'warning',
    )) {
      const selector = `input[aria-label="경고 확인 사유 ${issue.issue_id}"]`
      assert.ok(await has(selector))
      await evaluate(
        `(()=>{const i=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'시연 자료임을 확인했습니다.');i.dispatchEvent(new Event('input',{bubbles:true}));})()`,
      )
      await evaluate(
        `document.querySelector(${JSON.stringify(selector)}).parentElement.querySelector('button').click()`,
      )
      await idle()
    }
    assert.equal((await documentState()).validation.status, 'passed')
    await click('PDF 배치 검사')
    await until(
      async () => {
        const s = await documentState()
        const alert = await evaluate(
          `document.querySelector('[data-testid=draft-result] [role=alert]')?.textContent`,
        )
        if (alert) throw Error(alert)
        return !!s.layout_checks.pdf && s.layout_checks.pdf.status !== 'pending'
      },
      'actual PDF render',
      120000,
    )
    await idle()
    const checked = await documentState()
    assert.equal(
      checked.layout_checks.pdf.status,
      'passed',
      JSON.stringify(checked.layout_checks.pdf.fail_reasons),
    )
    assert.ok(checked.layout_checks.pdf.actual_pages > 0)
    await evaluate(
      `document.querySelector('input[aria-label="PDF 최종 승인 동의"]').click()`,
    )
    await reload()
    await until(
      () => has('input[aria-label="PDF 최종 승인 동의"]:not(:disabled)'),
      'restore checks',
    )
    await screen(3)
    assert.equal(
      await evaluate(
        `document.querySelector('input[aria-label="PDF 최종 승인 동의"]').checked`,
      ),
      false,
    )
    await evaluate(
      `document.querySelector('input[aria-label="PDF 최종 승인 동의"]').click()`,
    )
    await click('현재 PDF 최종 승인')
    await idle()
    assert.equal((await documentState()).approval.status, 'active')
    await click('승인된 PDF 준비')
    await until(
      () =>
        evaluate(
          `!![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='PDF 다운로드'&&!b.disabled)`,
        ),
      'export ready',
    )
    await command('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: output,
    })
    await click('PDF 다운로드')
    await idle()
    await until(
      async () => (await readdir(output)).some((f) => f.endsWith('.pdf')),
      'download file',
    )
    const file = (await readdir(output)).find((f) => f.endsWith('.pdf'))
    const bytes = await readFile(join(output, file))
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-')
    const exportData = await evaluate(
      `JSON.parse(sessionStorage.getItem('ddalgi.sources.v1.publication'))`,
    )
    const beforeAi = calls.filter(
      (c) =>
        c.method === 'POST' && /\/(preflights|drafts|validate)$/.test(c.path),
    ).length
    const again = await evaluate(
      `fetch('/api/v1/sessions/${sessionId}/exports/${exportData.exportId}/download').then(async r=>({status:r.status,bytes:Array.from(new Uint8Array(await r.arrayBuffer()))}))`,
    )
    assert.equal(again.status, 200)
    assert.deepEqual(Buffer.from(again.bytes), bytes)
    assert.equal(
      calls.filter(
        (c) =>
          c.method === 'POST' && /\/(preflights|drafts|validate)$/.test(c.path),
      ).length,
      beforeAi,
    )
    await evaluate(
      `document.getElementById('publication-panel').scrollIntoView()`,
    )
    await screenshot('publication.png')
    await click('페이지 보기')
    await until(
      () =>
        evaluate(`!!document.querySelector('.approval-split img')?.complete`),
      'PDF image loaded',
    )
    await evaluate('window.scrollTo(0,0)')
    await screenshot('s03-page-preview.png')
    await command('Emulation.setDeviceMetricsOverride', {
      width: 1100,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await click('검증·승인 보기')
    assert.ok(
      await evaluate(
        `!!document.querySelector('#publication-panel').getClientRects().length`,
      ),
    )
    await screenshot('s03-narrow-inspector.png')
    await evaluate(
      `document.querySelector('button[aria-label="검증 승인 패널 닫기"]').click()`,
    )
    await screen(2)
    await command('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    })
    assert.ok(
      await evaluate(
        'document.documentElement.scrollWidth <= window.innerWidth',
      ),
      'mobile editor horizontal overflow',
    )
    await click('편집 보조')
    await screenshot('s02-mobile-inspector.png')
    await evaluate(
      `document.querySelector('button[aria-label="편집 보조 패널 닫기"]').click()`,
    )
    await screen(1)
    await click('사전 점검 보기')
    await screenshot('s01-mobile-inspector.png')
    await click('점검 패널 닫기')
    assert.ok(
      await evaluate(
        'document.documentElement.scrollWidth <= window.innerWidth',
      ),
      'mobile sources horizontal overflow',
    )
    await command('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    })
    checks.push(
      'S03 PDF cards/page preview and responsive inspectors; mobile no horizontal overflow',
    )
    checks.push(
      'content validation, warning acknowledgements, actual PDF layout, consent reset, approval and byte-identical download',
    )
    const beforeChange = await documentState()
    const paragraph = beforeChange.document.pages
      .flatMap((p) => p.blocks)
      .find((b) => b.type === 'paragraph' && b.fact_ids.length)
    await setText(paragraph.block_id, paragraph.content.text + ' ')
    await click('문구 저장')
    await idle()
    const invalidated = await documentState()
    assert.equal(invalidated.approval, null)
    assert.equal(invalidated.validation, null)
    const oldDownload = await evaluate(
      `fetch('/api/v1/sessions/${sessionId}/exports/${exportData.exportId}/download').then(r=>r.status)`,
    )
    assert.equal(oldDownload, 409)
    assert.ok(
      await evaluate(
        `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='PDF 다운로드').disabled`,
      ),
    )
    checks.push('later edit invalidates approval and blocks old download')
    console.log(
      JSON.stringify({
        publication: 'PASS',
        pdf: join(output, file),
        bytes: bytes.length,
        pages: checked.layout_checks.pdf.actual_pages,
      }),
    )
  }
  assert.equal(errors.length, 0, JSON.stringify(errors))
  if (live) {
    assert.equal(posts('preflights').length, 1)
    assert.equal(posts('drafts').length, 1)
    if (proposalTrial) {
      assert.equal(posts('proposals').length, 1)
      assert.equal(posts('validate').length, 1)
    }
  }
  await click('작업 종료')
  await click('종료하고 정리')
  await idle()
  assert.equal(await saved(), null)
  checks.push('session cleanup clears AI references')
  console.log(
    JSON.stringify({
      result: 'PASS',
      mode: reviewReplay
        ? paid
          ? 'llm-review-replay'
          : 'offline-review-replay'
        : live
          ? 'llm'
          : 'mock',
      checks,
      preflightRequests: posts('preflights').length,
      draftRequests: posts('drafts').length,
      proposalRequests: posts('proposals').length,
      screenshot: join(output, 'draft.png'),
    }),
  )
} catch (error) {
  if (socket?.readyState === WebSocket.OPEN) {
    console.error(
      JSON.stringify({
        errors,
        body: await evaluate('document.body.innerText.slice(-6000)').catch(
          () => null,
        ),
      }),
    )
    await screenshot('failure.png').catch(() => {})
  }
  console.error('Diagnostics: ' + output)
  if (!origin) console.error(backendLog)
  throw error
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    if (sessionId)
      await evaluate(
        `fetch('/api/v1/sessions/${sessionId}',{method:'DELETE'})`,
      ).catch(() => {})
    await command('Browser.close').catch(() => {})
    socket.close()
  }
  browser?.kill()
  await vite?.close()
  if (backend) {
    backend.stdin.end()
    await Promise.race([
      new Promise((r) => backend.once('close', r)),
      delay(5000),
    ])
    if (backend.exitCode === null) backend.kill()
    if (isolatedLlm) {
      await writeFile(join(output, 'backend-trial.log'), backendLog)
      const match = backendLog.match(/TRIAL_REPORT=(.*)/)
      if (match) {
        const report = JSON.parse(match[1])
        if (reviewReplay)
          assert(
            report.calls_started <= 1 &&
              report.records.every((r) => r.operation === 'content_review'),
          )
        await writeFile(
          join(output, 'trial-report.json'),
          JSON.stringify(report, null, 2),
        )
        console.log(
          JSON.stringify({ trialReport: report, diagnostics: output }),
        )
      } else console.error('No final trial report: ' + output)
    }
  }
}
