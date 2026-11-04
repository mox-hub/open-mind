// 0.5.1 功能验证：彩虹节点染色 + 模板库
// 用法: node scripts/verify-0501.mjs [port=9225]
import net from 'node:net'
import crypto from 'node:crypto'
import fs from 'node:fs'

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
  else {
    header = Buffer.alloc(4)
    header[0] = 0x81; header[1] = maskBit | 126; header.writeUInt16BE(payload.length, 2)
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

async function shot(name) {
  const res = await send('Page.captureScreenshot', { format: 'png' })
  if (res.result?.data) fs.writeFileSync(`scripts/${name}.png`, Buffer.from(res.result.data, 'base64'))
}

async function main() {
  await send('Runtime.enable')
  await send('Page.enable')
  // 重新加载页面，确保运行的是最新构建产物；等待种子导图生成
  await send('Page.reload')
  await sleep(3000)

  const results = []
  const check = (name, ok, detail = '') => {
    results.push({ name, ok })
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —— ' + detail : ''}`)
  }

  // 1. 开启彩虹分支（点工具栏彩虹按钮），验证节点填充变为色板色
  await evalJs(`(() => {
    document.querySelector('button svg.lucide-rainbow')?.closest('button')?.click()
    return true
  })()`)
  await sleep(900)
  // 隐藏节点样式面板（种子节点处于选中态会自动弹出，挡住画面）
  await evalJs(`document.querySelector('div.fixed.right-3.top-\\\\[60px\\\\]')?.style.setProperty('display', 'none')`)
  const rainbowState = await evalJs(`(() => {
    const svg = document.querySelector('.editor svg')
    const fills = [...svg.querySelectorAll('g.smm-node .smm-node-shape')].map(g => g.getAttribute('fill') || '')
    // 经典绿主题：二级节点主题色是 #e0f0ec；彩虹开启后应出现实色板色 #2f7a6c
    return JSON.stringify({
      hasThemeSecond: fills.includes('#e0f0ec'),
      hasPalette: fills.some(f => f.startsWith('#2f7a6c') || f.startsWith('#ec') || f.startsWith('#f')),
      sample: [...new Set(fills)].slice(0, 8)
    })
  })()`)
  check(
    '彩虹节点染色（出现色板色）',
    (() => { try { const s = JSON.parse(rainbowState); return s.hasPalette && !s.hasThemeSecond } catch { return false } })(),
    `${rainbowState}`
  )
  await shot('v-rainbow-on')

  // 2. 关闭彩虹，验证回到主题色
  await evalJs(`document.querySelector('button svg.lucide-rainbow')?.closest('button')?.click()`)
  await sleep(700)
  const rainbowOff = await evalJs(`(() => {
    const svg = document.querySelector('.editor svg')
    const fills = [...svg.querySelectorAll('g.smm-node .smm-node-shape')].map(g => g.getAttribute('fill') || '')
    return JSON.stringify({ backToTheme: fills.includes('#e0f0ec'), sample: [...new Set(fills)].slice(0, 8) })
  })()`)
  check('关闭彩虹后回到主题色', (() => { try { return JSON.parse(rainbowOff).backToTheme } catch { return false } })(), `${rainbowOff}`)

  // 3. 模板库：品牌菜单 → 从模板新建
  await evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('OpenMind'))?.click()`)
  await sleep(400)
  await evalJs(`[...document.querySelectorAll('[role="menuitem"]')].find(m => m.textContent.includes('从模板新建'))?.click()`)
  await sleep(500)
  const tplCards = await evalJs(`document.querySelectorAll('[data-slot="dialog-content"] button').length`)
  check('模板对话框打开且有卡片', tplCards >= 10, `cards=${tplCards}`)
  await shot('v-templates')

  // 4. 点「读书笔记」卡片 → 新建文档（有未保存修改时先点确认弹窗的「是」）
  const newDoc = await evalJs(`(() => {
    const cards = [...document.querySelectorAll('[data-slot="dialog-content"] button')]
    const card = cards.find(c => c.textContent.includes('读书笔记'))
    if (!card) return 'NO_CARD'
    card.click()
    return 'OK'
  })()`)
  await sleep(600)
  await evalJs(`(() => {
    const yes = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '是')
    if (yes) yes.click()
    return true
  })()`)
  await sleep(1000)
  const docState = await evalJs(`(() => {
    const brand = [...document.querySelectorAll('button')].find(b => b.textContent.includes('OpenMind'))
    const nodeTexts = [...document.querySelectorAll('.editor svg g.smm-node')].map(g => g.textContent).slice(0, 12)
    return JSON.stringify({ brand: brand?.textContent.slice(0, 30), nodes: nodeTexts })
  })()`)
  check('从模板新建读书笔记', newDoc === 'OK' && String(docState).includes('书名'), `${docState}`)
  await shot('v-template-doc')

  const failed = results.filter(r => !r.ok).length
  console.log(`\n==== ${results.length - failed}/${results.length} passed ====`)
  process.exit(failed > 0 ? 1 : 0)
}
