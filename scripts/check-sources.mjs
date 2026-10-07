// Local UI integration check. Creates and closes its own demo session; never calls AI.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const origin = process.env.SOURCES_CHECK_URL || 'http://127.0.0.1:5173'
assert(
  /^http:\/\/127\.0\.0\.1:\d+$/.test(origin),
  'Only a local server is supported',
)
const output = await mkdtemp(join(tmpdir(), 'ddalgi-sources-check-'))
const browser = spawn(
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
let browserLog = '',
  socket,
  sessionId,
  sequence = 0,
  dropUpload = false,
  dropped = false
const pending = new Map(),
  errors = [],
  calls = [],
  checks = []
browser.stderr.on('data', (data) => {
  browserLog += data.toString()
})
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function until(check, label, timeout = 20000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    if (await check()) return
    await delay(100)
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
const click = (text) =>
  evaluate(
    `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Button unavailable');b.click()})()`,
  )
const idle = () =>
  until(
    () => evaluate(`!document.querySelector('[role="status"] .animate-spin')`),
    'idle',
  )
const saved = () =>
  evaluate(`JSON.parse(sessionStorage.getItem('ddalgi.sources.v1')||'null')`)
const sources = () =>
  evaluate(
    `fetch('/api/v1/sessions/${sessionId}/sources').then(r=>r.json()).then(r=>r.items)`,
  )
async function upload(name, text) {
  await evaluate(
    `(()=>{const input=document.querySelector('input[type=file]');const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(text)}],${JSON.stringify(name)},{type:'text/plain'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  )
}
async function readFinished(name) {
  await until(
    async () =>
      (await sources()).some(
        (s) => s.name === name && s.parse_status === 'complete',
      ),
    `read ${name}`,
  )
  await idle()
  await click('상태 새로고침')
  await idle()
}
try {
  await until(
    () => /DevTools listening on (ws:\/\/\S+)/.test(browserLog),
    'browser start',
  )
  const browserUrl = browserLog.match(/DevTools listening on (ws:\/\/\S+)/)[1]
  const tabs = await (
    await fetch(`http://${new URL(browserUrl).host}/json/list`)
  ).json()
  socket = new WebSocket(
    tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl,
  )
  await new Promise((resolve, reject) => {
    socket.onopen = resolve
    socket.onerror = reject
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
    )
      calls.push({
        method: data.params.request.method,
        path: new URL(data.params.request.url).pathname,
      })
    else if (data.method === 'Fetch.requestPaused') {
      const p = data.params
      if (
        dropUpload &&
        p.request.method === 'POST' &&
        p.responseStatusCode === 202
      ) {
        dropUpload = false
        dropped = true
        void command('Fetch.failRequest', {
          requestId: p.requestId,
          errorReason: 'ConnectionReset',
        })
      } else void command('Fetch.continueRequest', { requestId: p.requestId })
    }
  }
  await command('Page.enable')
  await command('Runtime.enable')
  await command('Network.enable')
  await command('Emulation.setDeviceMetricsOverride', {
    width: 1600,
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
  await until(async () => !!(await saved())?.sessionId, 'session creation')
  sessionId = (await saved()).sessionId
  await idle()
  assert.equal(
    calls.filter((c) => c.method === 'POST' && c.path === '/api/v1/sessions')
      .length,
    1,
  )
  assert.ok(
    await evaluate(`document.querySelectorAll('[data-source-id]').length>0`),
  )
  await evaluate(
    `document.querySelector('[data-source-id] input[type=checkbox]:not(:disabled)').click()`,
  )
  await idle()
  const selectedBefore = await evaluate(
    `fetch('/api/v1/sessions/${sessionId}').then(r=>r.json()).then(s=>s.selected_source_ids)`,
  )
  assert.equal(selectedBefore.length, 1)
  checks.push('registered sources and saved selection')
  await command('Page.reload')
  await until(
    () =>
      evaluate(
        `document.querySelectorAll('[data-source-id] input:checked').length===1`,
      ),
    'reload restore',
  )
  await idle()
  checks.push('reload with owner cookie and selection')
  await until(
    () => evaluate(`!!document.querySelector('input[aria-label="사용 목적"]')`),
    'purpose input ready',
  )
  await evaluate(
    `(()=>{const i=document.querySelector('input[aria-label="사용 목적"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'연결 확인용 목적');i.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  )
  await until(
    () =>
      evaluate(
        `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='작성 조건 저장');return !!b&&!b.disabled})()`,
      ),
    'save brief button enabled',
  )
  await click('작성 조건 저장')
  await idle()
  assert.equal(
    await evaluate(
      `fetch('/api/v1/sessions/${sessionId}').then(r=>r.json()).then(s=>s.brief.purpose)`,
    ),
    '연결 확인용 목적',
  )
  checks.push('brief saved')
  await upload(
    'connection-check.txt',
    '[시연] 연결 확인용 임시 문서입니다. 실제 회사 자료가 아닙니다.\n',
  )
  await readFinished('connection-check.txt')
  await evaluate(
    `document.querySelector('input[aria-label="connection-check.txt 선택"]').click()`,
  )
  await idle()
  assert.equal(
    await evaluate(
      `fetch('/api/v1/sessions/${sessionId}').then(r=>r.json()).then(s=>s.selected_source_ids.length)`,
    ),
    2,
  )
  checks.push('upload, parse and select')
  await command('Fetch.enable', {
    patterns: [
      { urlPattern: '*api/v1/sessions/*/sources', requestStage: 'Response' },
    ],
  })
  dropUpload = true
  await upload(
    'lost-response.txt',
    '[시연] 업로드 응답 유실 후 중복 방지 확인 자료입니다.',
  )
  await until(() => dropped, 'response intercepted')
  await idle()
  await click('같은 업로드 재시도')
  await readFinished('lost-response.txt')
  assert.equal(
    (await sources()).filter((s) => s.name === 'lost-response.txt').length,
    1,
  )
  await command('Fetch.disable')
  checks.push('lost response retry creates one source')
  await evaluate(
    `document.querySelector('button[aria-label="connection-check.txt 삭제"]').click()`,
  )
  await click('첨부 삭제')
  await idle()
  assert.equal(
    (await sources()).filter((s) => s.name === 'connection-check.txt').length,
    0,
  )
  assert.equal(
    await evaluate(
      `fetch('/api/v1/sessions/${sessionId}').then(r=>r.json()).then(s=>s.selected_source_ids.length)`,
    ),
    1,
  )
  checks.push('delete also removes selection')
  await upload('invalid.exe', 'unsupported')
  await idle()
  assert.ok(
    await evaluate(
      `document.querySelector('[role=alert]')?.textContent.includes('파일을 선택')`,
    ),
  )
  checks.push('unsupported file rejected')
  await evaluate(
    `fetch('/api/v1/sessions/${sessionId}').then(r=>r.json()).then(s=>fetch('/api/v1/sessions/${sessionId}/inputs',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({expected_input_revision:s.input_revision,selected_source_ids:s.selected_source_ids})}))`,
  )
  await evaluate(
    `document.querySelector('input[aria-label="lost-response.txt 선택"]').click()`,
  )
  await idle()
  assert.ok(
    await evaluate(
      `document.querySelector('[role=alert]')?.textContent.includes('변경')`,
    ),
  )
  checks.push('stale selection rejected and refreshed')
  await evaluate(
    `[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent.includes('등록 자료')).click()`,
  )
  await evaluate(
    `document.querySelector('[data-source-id="UI_DEMO_AI_FACILITY"] details').open=true;document.querySelector('[data-source-id="UI_DEMO_AI_FACILITY"]').scrollIntoView()`,
  )
  await until(
    () =>
      evaluate(
        `document.querySelector('[data-source-id="UI_DEMO_AI_FACILITY"] img')?.naturalWidth>0`,
      ),
    'demo image',
  )
  checks.push('authorized demo image loaded')
  await evaluate('window.scrollTo(0,0)')
  await delay(300)
  const shot = await command('Page.captureScreenshot', { format: 'png' })
  await writeFile(join(output, 'sources.png'), Buffer.from(shot.data, 'base64'))
  await click('작업 종료')
  await click('종료하고 정리')
  await idle()
  assert.equal(await saved(), null)
  checks.push('session closed and browser state cleared')
  assert.equal(errors.length, 0, JSON.stringify(errors))
  assert.equal(
    calls.filter((c) =>
      /\/(preflights|drafts|proposals|validate|exports)(\/|$)/.test(c.path),
    ).length,
    0,
    'AI must not run',
  )
  console.log(
    JSON.stringify({
      result: 'PASS',
      checks,
      screenshot: join(output, 'sources.png'),
      aiRequests: 0,
    }),
  )
} catch (error) {
  if (socket?.readyState === WebSocket.OPEN) {
    const diagnostic = await evaluate(
      '({title:document.title,text:document.body.innerText.slice(0,1000)})',
    ).catch(() => null)
    console.error(JSON.stringify({ errors, diagnostic }))
    const shot = await command('Page.captureScreenshot', {
      format: 'png',
    }).catch(() => null)
    if (shot)
      await writeFile(
        join(output, 'failure.png'),
        Buffer.from(shot.data, 'base64'),
      )
    console.error('Diagnostics: ' + output)
  }
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
  browser.kill()
}
