// 最小 CDP 探针：连 WebView2 调试端口，抓页面刷新后的控制台错误与 DOM 状态
// 用法: node cdp-probe.mjs [port=9223]
import net from 'node:net'
import crypto from 'node:crypto'

const port = Number(process.argv[2] || 9223)

// 1. 拿页面 target
const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json())
const page = list.find(t => t.type === 'page')
if (!page) { console.log('no page target'); process.exit(1) }
const wsUrl = page.webSocketDebuggerUrl

// 2. 裸 WebSocket 握手（无依赖实现）
const key = crypto.randomBytes(16).toString('base64')
const url = new URL(wsUrl)
const socket = net.connect(Number(url.port), '127.0.0.1')
let handshakeDone = false
let buffer = Buffer.alloc(0)
const pending = new Map()
const events = []
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
      const text = payload.toString('utf8')
      try {
        const msg = JSON.parse(text)
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)(msg)
          pending.delete(msg.id)
        } else if (msg.method) events.push(msg)
      } catch {}
    }
    // opcode 9 = ping -> pong
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
  }
  parseFrames()
})

socket.on('error', e => console.log('socket error:', e.message))

async function main() {
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')
  await send('Debugger.enable')
  // 新文档注入：拦截非法属性名 + 可选清空 localStorage
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__badSets = [];
      const __orig = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, value) {
        if (String(name).includes('"')) {
          window.__badSets.push({ name: String(name), value: String(value).slice(0,100), tag: this.tagName, stack: (new Error().stack || '').slice(0, 2000) });
        }
        return __orig.call(this, name, value);
      };`
  })
  // 试验：清空本地存储，排除用户会话/文档数据影响（改回 false 可跳过）
  if (process.env.CLEAR_LS === '1') {
    await send('Runtime.evaluate', { expression: 'localStorage.clear()' })
    console.log('(localStorage cleared)')
  }
  await send('Page.reload')
  await new Promise(r => setTimeout(r, 6000))

  const bad = await send('Runtime.evaluate', {
    expression: 'JSON.stringify(window.__badSets || [], null, 1)',
    returnByValue: true
  })
  console.log('=== 非法 setAttribute 调用 ===')
  console.log((bad.result?.result?.value || '[]').slice(0, 4000))

  // 抓取出错点源码（Debugger.getScriptSource）
  const domState = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      appChildren: document.getElementById('app')?.children.length ?? -1,
      hasToolbar: !!document.querySelector('header')
    })`,
    returnByValue: true
  })
  console.log('=== DOM 状态 ===')
  console.log(domState.result?.result?.value)

  console.log('=== 控制台/异常事件 (' + events.length + ') ===')
  for (const m of events.slice(0, 4)) {
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails
      console.log('[EXCEPTION]', (d.exception?.description || d.text || '').slice(0, 260))
    }
  }
  process.exit(0)
}
