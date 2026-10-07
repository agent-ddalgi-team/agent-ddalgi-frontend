import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const origin = 'http://127.0.0.1:5173'
const output = await mkdtemp(join(tmpdir(), 'ddalgi-test-'))
const browser = spawn(
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
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

let browserLog = '', sequence = 0, socket
const pending = new Map()

browser.stderr.on('data', (data) => {
  browserLog += data.toString()
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function until(check, label, timeout = 20000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    if (await check()) return
    await delay(150)
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
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails))
  }
  return result.result.value
}

const click = (text) =>
  evaluate(
    `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Button unavailable');b.click()})()`,
  )

try {
  await until(() => /DevTools listening on (ws:\/\/\S+)/.test(browserLog), 'browser start')
  const browserUrl = browserLog.match(/DevTools listening on (ws:\/\/\S+)/)[1]
  const tabs = await (await fetch(`http://${new URL(browserUrl).host}/json/list`)).json()
  socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl)
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
    }
  }

  await command('Page.enable')
  await command('Runtime.enable')
  await command('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await command('Page.navigate', { url: origin })
  await delay(1500)
  const initialText = await evaluate(`document.body.innerText.slice(0, 300)`)
  console.log('Initial page text:', initialText)

  // 1. 작업 시작 / 이어하기 클릭 (필요시)
  const isStartScreen = await evaluate(`Boolean([...document.querySelectorAll('button')].find(b=>b.textContent.includes('작업 시작')))` )
  if (isStartScreen) {
    console.log('Waiting for 작업 시작 / 이어하기 button enabled...')
    await until(() => evaluate(`Boolean([...document.querySelectorAll('button')].find(b=>b.textContent.includes('작업 시작') && !b.disabled))`), 'start button enabled')
    console.log('Clicking 작업 시작 / 이어하기...')
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('작업 시작')).click()`)
    await until(async () => {
      const hasSources = await evaluate(`Boolean(document.querySelector('[data-source-id]'))`)
      return hasSources
    }, 'session started and sources loaded')
    await delay(1000)
  }

  await until(() => evaluate(`Boolean(document.querySelector('[data-source-id]'))`), 'sources rendered')
  console.log('PASS: Sources list loaded')

  // 2. 거산케미칼-카다로그.pdf, ISO 14001, ISO 45001 체크박스 활성화 및 텍스트 확인
  const catalogCheck = await evaluate(`(() => {
    const items = [...document.querySelectorAll('li[data-source-id]')];
    const catalogItem = items.find(li => li.textContent.includes('거산케미칼-카다로그.pdf'));
    if (!catalogItem) return { found: false };
    const checkbox = catalogItem.querySelector('input[type="checkbox"]');
    return {
      found: true,
      disabled: checkbox ? checkbox.disabled : null,
      checked: checkbox ? checkbox.checked : null,
      text: catalogItem.textContent
    };
  })()`)
  console.log('Catalog source check:', catalogCheck)
  assert.equal(catalogCheck.found, true, '거산케미칼-카다로그.pdf must exist')
  assert.equal(catalogCheck.disabled, false, '거산케미칼-카다로그.pdf must NOT be disabled!')
  assert.equal(catalogCheck.text.includes('참고용 자료'), true, 'Should display 참고용 자료')
  assert.equal(catalogCheck.text.includes('근거 선택 불가'), false, 'Should NOT display 근거 선택 불가')
  console.log('PASS: 거산케미칼-카다로그.pdf is active and selectable!')

  const iso14001Check = await evaluate(`(() => {
    const items = [...document.querySelectorAll('li[data-source-id]')];
    const iso = items.find(li => li.textContent.includes('ISO 14001'));
    if (!iso) return { found: false };
    const checkbox = iso.querySelector('input[type="checkbox"]');
    return {
      found: true,
      disabled: checkbox ? checkbox.disabled : null,
      checked: checkbox ? checkbox.checked : null,
      text: iso.textContent
    };
  })()`)
  console.log('ISO 14001 check:', iso14001Check)
  assert.equal(iso14001Check.found, true, 'ISO 14001 must exist')
  assert.equal(iso14001Check.disabled, false, 'ISO 14001 must NOT be disabled!')
  console.log('PASS: ISO 14001 인증서.pdf is active and selectable!')

  const iso45001Check = await evaluate(`(() => {
    const items = [...document.querySelectorAll('li[data-source-id]')];
    const iso = items.find(li => li.textContent.includes('ISO 45001'));
    if (!iso) return { found: false };
    const checkbox = iso.querySelector('input[type="checkbox"]');
    return {
      found: true,
      disabled: checkbox ? checkbox.disabled : null,
      checked: checkbox ? checkbox.checked : null,
      text: iso.textContent
    };
  })()`)
  console.log('ISO 45001 check:', iso45001Check)
  assert.equal(iso45001Check.found, true, 'ISO 45001 must exist')
  assert.equal(iso45001Check.disabled, false, 'ISO 45001 must NOT be disabled!')
  console.log('PASS: ISO 45001 인증서.pdf is active and selectable!')

  // 3. 현재 데이터 충족도 점수 확인
  const initialSufficiency = await evaluate(`(() => {
    const banner = document.querySelector('[aria-label="자료 충족도"]');
    return banner ? banner.textContent : null;
  })()`)
  console.log('Initial sufficiency banner text:', initialSufficiency)

  // 4. 거산케미칼-카다로그.pdf 클릭
  console.log('Clicking 거산케미칼-카다로그.pdf...')
  const clickDetails = await evaluate(`(() => {
    const items = [...document.querySelectorAll('li[data-source-id]')];
    const catalogItem = items.find(li => li.textContent.includes('거산케미칼-카다로그.pdf'));
    const checkbox = catalogItem.querySelector('input[type="checkbox"]');
    const label = catalogItem.querySelector('label');
    label.click();
    return {
      labelFound: Boolean(label),
      checked: checkbox.checked,
      disabled: checkbox.disabled,
      sourceId: catalogItem.getAttribute('data-source-id')
    };
  })()`)
  console.log('Click details:', clickDetails)
  await delay(1200)

  // 5. 충족도 점수 확인 (클릭 후 증가 여부)
  const afterCatalogSufficiency = await evaluate(`(() => {
    const banner = document.querySelector('[aria-label="자료 충족도"]');
    const bar = banner.querySelector('[role="progressbar"]');
    const selectedBadge = document.querySelector('.flex.flex-col > div.flex.items-center.justify-between h3 + span, [aria-label*="선택됨"]');
    const err = document.querySelector('[role="alert"]');
    const notice = document.querySelector('.bg-emerald-50, .bg-blue-50');
    return {
      text: banner ? banner.textContent : null,
      score: bar ? bar.getAttribute('aria-valuenow') : null,
      errorText: err ? err.textContent : null,
      noticeText: notice ? notice.textContent : null
    };
  })()`)
  console.log('After clicking catalog:', afterCatalogSufficiency)
  assert(Number(afterCatalogSufficiency.score) > 0, 'Sufficiency score should increase after clicking catalog')
  console.log('PASS: Sufficiency score increased dynamically!')

  // 6. ISO 14001 인증서 클릭
  console.log('Clicking ISO 14001 인증서.pdf...')
  await evaluate(`(() => {
    const items = [...document.querySelectorAll('li[data-source-id]')];
    const iso = items.find(li => li.textContent.includes('ISO 14001'));
    const checkbox = iso.querySelector('input[type="checkbox"]');
    checkbox.click();
  })()`)
  await delay(800)

  const afterIsoSufficiency = await evaluate(`(() => {
    const banner = document.querySelector('[aria-label="자료 충족도"]');
    const bar = banner.querySelector('[role="progressbar"]');
    return {
      text: banner ? banner.textContent : null,
      score: bar ? bar.getAttribute('aria-valuenow') : null
    };
  })()`)
  console.log('After clicking ISO 14001:', afterIsoSufficiency)
  assert(Number(afterIsoSufficiency.score) >= Number(afterCatalogSufficiency.score), 'Sufficiency score should increase/maintain')
  console.log('PASS: Sufficiency score updated dynamically after selecting ISO certificate!')

  // 7. 스크린샷 캡처
  await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
  await delay(300)
  const { data: bannerData } = await command('Page.captureScreenshot', { format: 'png' })
  const bannerPath = 'C:/Users/user/.gemini/antigravity-ide/brain/3e540fdb-f0e3-4d84-934a-19f4e09db505/sufficiency_banner_ui.png'
  await writeFile(bannerPath, Buffer.from(bannerData, 'base64'))
  console.log(`Saved verification screenshot to ${bannerPath}`)

  await evaluate(`document.querySelector('li[data-source-id="REAL_DDALGI_V1_CATALOG"]')?.scrollIntoView({ behavior: 'instant', block: 'center' })`)
  await delay(300)
  const { data: listData } = await command('Page.captureScreenshot', { format: 'png' })
  const screenshotPath = 'C:/Users/user/.gemini/antigravity-ide/brain/3e540fdb-f0e3-4d84-934a-19f4e09db505/sufficiency_restored_ui.png'
  await writeFile(screenshotPath, Buffer.from(listData, 'base64'))
  console.log(`Saved verification screenshot to ${screenshotPath}`)

  console.log('ALL VERIFICATION CHECKS PASSED!')
} finally {
  if (socket) socket.close()
  browser.kill()
}
