// 功能冒烟：对预览页面做 DOM 级交互验证（多画布/查找上一个/缩放复位/轻提示）
// 用法: node scripts/smoke.mjs [port=9225]
import net from 'node:net'
import crypto from 'node:crypto'

const port = Number(process.argv[2] || 9225)

const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json())
const page = list.find(t => t.type === 'page')
if (!page) { console.log('no page target'); process.exit(1) }
const wsUrl = page.webSocketDebuggerUrl

const key = crypto.randomBytes(16).toString('base64')
const url = new URL(wsUrl)
const socket = net.connect(Number(url.port), '127.0.0.1')
let handshakeDone = false
let buffer = Buffer.alloc(0)
const pending = new Map()
let msgId = 0

function send(method, params = {}) {
  const id = ++msgId
  const data = JSON.stringify({ id, method, params })
  const mask = crypto.randomBytes(4)
  const payload = Buffer.from(data)
  const maskBit = 0x80
  let header
  if (payload.length < 126) header = Buffer.from([0x81, maskBit | payload.length])
  else if (payload.length < 65536) {
    header = Buffer.alloc(4)
    header[0] = 0x81; header[1] = maskBit | 126; header.writeUInt16BE(payload.length, 2)
  } else {
    header = Buffer.alloc(10)
    header[0] = 0x81; header[1] = maskBit | 127; header.writeBigUInt64BE(BigInt(payload.length), 2)
  }
  const masked = Buffer.from(payload.map((b, i) => b ^ mask[i % 4]))
  socket.write(Buffer.concat([header, mask, masked]))
  return new Promise(res => pending.set(id, res))
}

socket.on('connect', () => {
  socket.write(
    `GET ${url.pathname}${url.search} HTTP/1.1\r\n` +
    `Host: ${url.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n` +
    `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`
  )
})

function parseFrames() {
  while (buffer.length >= 2) {
    const opcode = buffer[0] & 0x0f
    let len = buffer[1] & 0x7f
    let offset = 2
    if (len === 126) { if (buffer.length < 4) return; len = buffer.readUInt16BE(2); offset = 4 }
    else if (len === 127) { if (buffer.length < 10) return; len = Number(buffer.readBigUInt64BE(2)); offset = 10 }
    if (buffer.length < offset + len) return
    const payload = buffer.subarray(offset, offset + len)
    buffer = buffer.subarray(offset + len)
    if (opcode === 8) { socket.end(); return }
    if (opcode === 1) {
      try {
        const msg = JSON.parse(payload.toString('utf8'))
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)(msg)
          pending.delete(msg.id)
        }
      } catch {}
    }
    if (opcode === 9) socket.write(Buffer.from([0x8a, 0]))
  }
}

socket.on('data', chunk => {
  if (!handshakeDone) {
    buffer = Buffer.concat([buffer, chunk])
    const idx = buffer.indexOf('\r\n\r\n')
    if (idx === -1) return
    handshakeDone = true
    buffer = buffer.subarray(idx + 4)
    main()
  } else {
    buffer = Buffer.concat([buffer, chunk])
    parseFrames()
  }
})
socket.on('error', e => console.log('socket error:', e.message))

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function evalJs(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (res.result?.exceptionDetails) {
    return { __error: res.result.exceptionDetails.exception?.description || res.result.exceptionDetails.text }
  }
  return res.result?.result?.value
}

async function main() {
  await send('Runtime.enable')
  await sleep(500)

  const results = []
  const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail })
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —— ' + detail : ''}`)
  }

  // 1. 多画布：点 + 新建画布，检查标签与切换
  const addBtn = await evalJs(`(() => {
    const bar = document.querySelector('div.absolute.bottom-8')
    if (!bar) return 'NO_BAR'
    const btns = [...bar.querySelectorAll('button')]
    return btns.length
  })()`)
  check('SheetTabs 栏存在且含按钮', typeof addBtn === 'number' && addBtn >= 1, `buttons=${addBtn}`)

  const tabsBefore = await evalJs(`[...document.querySelectorAll('div.absolute.bottom-8 button')].map(b => b.textContent.trim()).join('|')`)
  const plusBtn = await evalJs(`(() => {
    const bar = document.querySelector('div.absolute.bottom-8')
    const btns = [...bar.querySelectorAll('button')]
    const plus = btns[btns.length - 1]
    plus.click()
    return true
  })()`)
  await sleep(400)
  const tabsAfter = await evalJs(`(() => {
    const tabs = [...document.querySelectorAll('div.absolute.bottom-8 button')].map(b => ({
      text: b.textContent.trim(),
      active: b.className.includes('bg-secondary')
    }))
    return JSON.stringify(tabs)
  })()`)
  check('新建画布', plusBtn === true, `before=[${tabsBefore}] after=${tabsAfter}`)

  // 切回第一个画布
  await evalJs(`(() => {
    const tabs = [...document.querySelectorAll('div.absolute.bottom-8 button')]
    tabs[0].click()
    return true
  })()`)
  await sleep(400)
  const activeAfterSwitch = await evalJs(`(() => {
    const tabs = [...document.querySelectorAll('div.absolute.bottom-8 button')]
    return tabs.findIndex(b => b.className.includes('bg-secondary'))
  })()`)
  check('切换回画布 1', activeAfterSwitch === 0, `activeIndex=${activeAfterSwitch}`)

  // 2. 缩放复位按钮存在且可点
  const zoomReset = await evalJs(`(() => {
    const b = document.querySelector('button[title="点击复位到 100%"]')
    if (!b) return false
    b.click()
    return true
  })()`)
  check('缩放复位按钮', zoomReset === true)

  // 3. 查找：打开查找栏，搜「中心」，验证下一个/上一个
  await evalJs(`(() => {
    const btn = document.querySelector('button svg.lucide-search')?.closest('button')
    if (btn) btn.click()
    return !!btn
  })()`)
  await sleep(300)
  const searchResult = await evalJs(`(async () => {
    const input = document.querySelector('input[placeholder="查找节点文字…"]')
    if (!input) return 'NO_INPUT'
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(input, '中心')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await new Promise(r => setTimeout(r, 500))
    const info1 = document.querySelector('input[placeholder="查找节点文字…"]')?.parentElement?.textContent || ''
    const prevBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '上一个')
    if (!prevBtn) return 'NO_PREV_BTN'
    prevBtn.click()
    await new Promise(r => setTimeout(r, 600))
    const info2 = document.querySelector('input[placeholder="查找节点文字…"]')?.parentElement?.textContent || ''
    return JSON.stringify({ info1: info1.slice(0, 60), info2: info2.slice(0, 60) })
  })()`)
  check('查找 上一个/下一个', !String(searchResult).includes('NO_') && !searchResult?.__error, `${searchResult}`)

  // 4. 轻提示：点演示按钮出现 toast
  const toastResult = await evalJs(`(async () => {
    const btn = document.querySelector('button svg.lucide-presentation')?.closest('button')
    if (!btn) return 'NO_DEMO_BTN'
    btn.click()
    await new Promise(r => setTimeout(r, 300))
    const toasts = [...document.querySelectorAll('div')].filter(d => d.className.includes && String(d.className).includes('top-16'))
    return JSON.stringify({ found: toasts.length > 0, text: toasts.map(t => t.textContent).join(',') })
  })()`)
  check('演示按钮 toast', String(toastResult).includes('演示模式开发中'), `${toastResult}`)

  // 5. 品牌菜单：点 OpenMind 出现「最近打开」区域
  const brandMenu = await evalJs(`(async () => {
    const trigger = [...document.querySelectorAll('button')].find(b => b.textContent.includes('OpenMind'))
    if (!trigger) return 'NO_BRAND'
    trigger.click()
    await new Promise(r => setTimeout(r, 400))
    const labels = [...document.querySelectorAll('[data-slot="dropdown-menu-label"], [role="menuitem"]')].map(m => m.textContent.trim())
    return JSON.stringify(labels.slice(0, 8))
  })()`)
  check('品牌文档菜单弹出', String(brandMenu).includes('新建') && String(brandMenu).includes('打开'), `${brandMenu}`)
  // 收起菜单
  await evalJs(`document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true`)

  const failed = results.filter(r => !r.ok).length
  console.log(`\n==== ${results.length - failed}/${results.length} passed ====`)
  process.exit(failed > 0 ? 1 : 0)
}
