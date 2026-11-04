// 导入导出格式转换：Markdown / OPML / XMind / TXT
// Markdown 与 XMind 解析直接复用 simple-mind-map 内置解析器
import { transformMarkdownTo } from 'simple-mind-map/src/parse/markdownTo.js'
import { transformToMarkdown } from 'simple-mind-map/src/parse/toMarkdown.js'
import { transformToTxt } from 'simple-mind-map/src/parse/toTxt.js'
import xmindParse from 'simple-mind-map/src/parse/xmind.js'
import xmlConvert from 'xml-js'

// ---------- Markdown ----------
export function markdownToTree(md: string): any {
  return transformMarkdownTo(md)
}

export function treeToMarkdown(root: any): string {
  return transformToMarkdown(root)
}

export function treeToTxt(root: any): string {
  return transformToTxt(root)
}

// ---------- XMind ----------
export async function xmindBytesToTree(bytes: Uint8Array): Promise<any> {
  const blob = new Blob([bytes])
  return await xmindParse.parseXmindFile(blob, null)
}

// ---------- OPML ----------
export function treeToOpml(root: any): string {
  const toOutline = (n: any): any => ({
    type: 'element',
    name: 'outline',
    attributes: { text: String(n?.data?.text ?? '') },
    children: (n?.children || []).map(toOutline)
  })
  const doc = {
    declaration: { attributes: { version: '1.0', encoding: 'UTF-8' } },
    elements: [
      {
        type: 'element',
        name: 'opml',
        attributes: { version: '2.0' },
        children: [
          {
            type: 'element',
            name: 'head',
            children: [
              { type: 'element', name: 'title', children: [{ type: 'text', text: 'OpenMind 导出' }] }
            ]
          },
          {
            type: 'element',
            name: 'body',
            children: [toOutline(root)]
          }
        ]
      }
    ]
  }
  return xmlConvert.js2xml(doc, { compact: false, spaces: 2 })
}

export function opmlToTree(xml: string): any {
  const json: any = xmlConvert.xml2js(xml, { compact: false })
  const find = (els: any[], name: string): any[] => {
    const out: any[] = []
    for (const el of els || []) {
      if (el.name === name) out.push(el)
      if (el.elements) out.push(...find(el.elements, name))
    }
    return out
  }
  const body = find(json.elements || [], 'body')[0]
  if (!body || !body.elements?.length) throw new Error('OPML 中没有找到大纲内容（body/outline）')

  const getText = (el: any): string => {
    const attrs = el.attributes || {}
    return String(attrs.text ?? attrs.title ?? '')
  }

  const toNode = (el: any): any => ({
    data: { text: getText(el) },
    children: (el.elements || []).filter((c: any) => c.name === 'outline').map(toNode)
  })

  const first = body.elements.find((c: any) => c.name === 'outline')
  return toNode(first)
}

// ---------- FreeMind (.mm) ----------
// FreeMind 格式：<map version="1.0.1"><node ID=".." TEXT=".."><node/></node></map>
export function freemindToTree(xml: string): any {
  const json: any = xmlConvert.xml2js(xml, { compact: false })
  const findMapNode = (els: any[]): any => {
    for (const el of els || []) {
      if (el.name === 'node') return el
      if (el.elements) {
        const r = findMapNode(el.elements)
        if (r) return r
      }
    }
    return null
  }
  const rootEl = findMapNode(json.elements || [])
  if (!rootEl) throw new Error('FreeMind 文件中没有找到节点（map/node）')

  let seq = 0
  const toNode = (el: any): any => {
    const attrs = el.attributes || {}
    const noteEl = (el.elements || []).find((c: any) => c.name === 'richcontent' && c.attributes?.TYPE === 'NOTE')
    let note = ''
    if (noteEl) {
      const texts: string[] = []
      const collect = (e: any) => {
        if (e.type === 'text' && e.text) texts.push(e.text)
        for (const c of e.elements || []) collect(c)
      }
      collect(noteEl)
      note = texts.join('').trim()
    }
    const children = (el.elements || []).filter((c: any) => c.name === 'node')
    seq++
    return {
      data: {
        text: String(attrs.TEXT ?? ''),
        ...(note ? { note } : {}),
        ...(attrs.LINK && /^https?:\/\//.test(String(attrs.LINK)) ? { hyperlink: String(attrs.LINK) } : {})
      },
      children: children.map(toNode)
    }
  }
  return toNode(rootEl)
}

export function treeToFreemind(root: any): string {
  let seq = 0
  const toNode = (n: any): any => {
    seq++
    const data = n?.data || {}
    const attrs: Record<string, string> = {
      ID: `omd_${seq}_${Date.now().toString(36)}`,
      TEXT: String(data.text ?? '')
    }
    if (data.hyperlink) attrs.LINK = String(data.hyperlink)
    const children: any[] = (n?.children || []).map(toNode)
    if (data.note) {
      const esc = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      children.unshift({
        type: 'element',
        name: 'richcontent',
        attributes: { TYPE: 'NOTE' },
        children: [
          {
            type: 'element',
            name: 'html',
            children: [
              {
                type: 'element',
                name: 'body',
                children: [{ type: 'text', text: esc(String(data.note)) }]
              }
            ]
          }
        ]
      })
    }
    return { type: 'element', name: 'node', attributes: attrs, children }
  }
  const doc = {
    declaration: { attributes: { version: '1.0', encoding: 'UTF-8' } },
    elements: [
      {
        type: 'element',
        name: 'map',
        attributes: { version: '1.0.1' },
        children: [toNode(root)]
      }
    ]
  }
  return xmlConvert.js2xml(doc, { compact: false, spaces: 2 })
}

// ---------- 通用 ----------
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const buf = await blob.arrayBuffer()
      let binary = ''
      const bytes = new Uint8Array(buf)
      const chunk = 0x8000
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any)
      }
      resolve(btoa(binary))
    } catch (e) {
      reject(e)
    }
  })
}
