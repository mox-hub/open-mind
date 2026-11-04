// 通过 CDP 直接截取页面内容（不截桌面，不影响前台应用）
// 用法: node scripts/page-shot.mjs [port=9223] [out=scripts/page-shot.png]
import net from 'node:net'
import crypto from 'node:crypto'
import fs from 'node:fs'

const port = Number(process.argv[2] || 9223)
const out = process.argv[3] || 'scripts/page-shot.png'

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

async function main() {
  await send('Runtime.enable')
  await send('Page.enable')
  const res = await send('Page.captureScreenshot', { format: 'png' })
  const data = res.result?.data
  if (!data) { console.log('no screenshot data'); process.exit(1) }
  fs.writeFileSync(out, Buffer.from(data, 'base64'))
  console.log('saved:', out)
  process.exit(0)
}
