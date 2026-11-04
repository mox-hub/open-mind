// 文件 IO：全部走自定义 Rust 命令（原子写），文件选择走原生对话框
import { invoke } from '@tauri-apps/api/core'
import { open, save, ask } from '@tauri-apps/plugin-dialog'

export async function openFileDialog(): Promise<string | null> {
  const res = await open({
    title: '打开 / 导入文件',
    multiple: false,
    filters: [
      { name: '所有支持的格式', extensions: ['omd', 'md', 'markdown', 'opml', 'xml', 'xmind', 'txt', 'mm'] },
      { name: 'OpenMind 思维导图', extensions: ['omd'] },
      { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
      { name: 'OPML 大纲', extensions: ['opml', 'xml'] },
      { name: 'FreeMind', extensions: ['mm'] },
      { name: 'XMind', extensions: ['xmind'] }
    ]
  })
  return typeof res === 'string' ? res : null
}

export async function saveAsDialog(defaultName = '未命名.omd'): Promise<string | null> {
  return await save({
    title: '保存思维导图',
    defaultPath: defaultName,
    filters: [{ name: 'OpenMind 思维导图', extensions: ['omd'] }]
  })
}

export async function exportDialog(defaultName: string, ext: string): Promise<string | null> {
  return await save({
    title: `导出 ${ext.toUpperCase()}`,
    defaultPath: defaultName,
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }]
  })
}

export async function readDocument(path: string): Promise<string> {
  return await invoke<string>('open_document', { path })
}

export async function writeDocument(path: string, content: string): Promise<void> {
  await invoke('save_document', { path, content })
}

export async function writeBase64File(path: string, base64: string): Promise<void> {
  await invoke('save_file_base64', { path, base64 })
}

export async function revealInFolder(path: string): Promise<void> {
  await invoke('reveal_in_folder', { path })
}

export async function confirmDialog(message: string, title = 'OpenMind'): Promise<boolean> {
  return await ask(message, { title })
}

// ---------- 会话与最近文件（localStorage，跟随 WebView 数据目录持久化） ----------

interface SessionState {
  lastPath: string | null
  recent: string[]
}

const KEY_SESSION = 'openmind.session.v1'

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(KEY_SESSION)
    if (raw) {
      const s = JSON.parse(raw)
      return { lastPath: s.lastPath ?? null, recent: Array.isArray(s.recent) ? s.recent : [] }
    }
  } catch {}
  return { lastPath: null, recent: [] }
}

export function saveSession(state: SessionState) {
  try {
    localStorage.setItem(KEY_SESSION, JSON.stringify(state))
  } catch {}
}

export function pushRecent(path: string): string[] {
  const s = loadSession()
  s.recent = [path, ...s.recent.filter(p => p !== path)].slice(0, 10)
  s.lastPath = path
  saveSession(s)
  return s.recent
}

export function removeRecent(path: string): string[] {
  const s = loadSession()
  s.recent = s.recent.filter(p => p !== path)
  if (s.lastPath === path) s.lastPath = null
  saveSession(s)
  return s.recent
}

export function clearRecents(): string[] {
  const s = loadSession()
  s.recent = []
  s.lastPath = null
  saveSession(s)
  return []
}
