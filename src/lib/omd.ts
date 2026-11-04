// .omd 文件格式：单文件 JSON，schema 带版本号，读取时向上迁移
// v2 起支持多画布（sheets）；v1 的单一 mindmap 字段在读取时自动包装成一个画布。
// 画布数据直接保存 simple-mind-map 的完整数据（节点树 + 布局 + 主题 + 视图），
// 结构与本仓库 docs/调研与设计方案.md §5.4 一致

export const OMD_FORMAT = 'open-mind'
export const OMD_VERSION = 2
export const APP_VERSION = '0.5.2'

export interface OmdSheet {
  id: string
  name: string
  root: any
  layout?: string
  theme?: { template?: string; config?: any }
  view?: any
  // 彩虹分支开关（含节点染色）按画布持久化
  rainbow?: boolean
}

export interface OmdFile {
  format: string
  version: number
  meta: {
    title: string
    createdAt: string
    updatedAt: string
    app?: string
  }
  sheets: OmdSheet[]
  activeSheetId?: string
  // v1 旧字段：仅在读取迁移前存在，写出时不再包含
  mindmap?: any
}

let sheetSeq = 0
export function newSheetId(): string {
  return `s_${Date.now().toString(36)}_${(++sheetSeq).toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

export function createSheetData(name = '中心主题'): Pick<OmdSheet, 'root' | 'layout' | 'theme'> {
  return {
    root: {
      data: { text: name, expand: true },
      children: []
    },
    layout: 'logicalStructure',
    theme: { template: 'openmind-classic' }
  }
}

export function createNewDocument(title = '未命名'): OmdFile {
  const now = new Date().toISOString()
  const sheet: OmdSheet = {
    id: newSheetId(),
    name: '画布 1',
    ...createSheetData(title === '未命名' ? '中心主题' : title)
  }
  return {
    format: OMD_FORMAT,
    version: OMD_VERSION,
    meta: {
      title,
      createdAt: now,
      updatedAt: now,
      app: `open-mind ${APP_VERSION}`
    },
    sheets: [sheet],
    activeSheetId: sheet.id
  }
}

export function parseOmd(text: string): OmdFile {
  let obj: any
  try {
    obj = JSON.parse(text)
  } catch (e) {
    throw new Error('文件不是有效的 JSON，无法解析为 .omd 文档')
  }
  if (!obj || obj.format !== OMD_FORMAT) {
    throw new Error('文件格式不正确（缺少 open-mind 标识）')
  }
  if (obj.version > OMD_VERSION) {
    throw new Error(`文件版本 (${obj.version}) 高于当前程序支持版本，请更新 OpenMind`)
  }
  // v1 → v2 迁移：单一 mindmap 包装成一个画布
  if (!Array.isArray(obj.sheets) || obj.sheets.length === 0) {
    if (!obj.mindmap || !obj.mindmap.root) {
      throw new Error('文件格式不正确（缺少节点树数据）')
    }
    const sheet: OmdSheet = {
      id: newSheetId(),
      name: '画布 1',
      root: obj.mindmap.root,
      layout: obj.mindmap.layout,
      theme: obj.mindmap.theme,
      view: obj.mindmap.view
    }
    obj.sheets = [sheet]
    obj.activeSheetId = sheet.id
  }
  // 画布数据完整性兜底
  for (const s of obj.sheets) {
    if (!s.id) s.id = newSheetId()
    if (!s.name) s.name = '画布'
    if (!s.root || !s.root.data) {
      throw new Error('文件格式不正确（画布缺少节点树数据）')
    }
  }
  if (!obj.sheets.some((s: OmdSheet) => s.id === obj.activeSheetId)) {
    obj.activeSheetId = obj.sheets[0].id
  }
  if (!obj.meta) obj.meta = { title: '未命名', createdAt: '', updatedAt: '' }
  obj.version = OMD_VERSION
  delete obj.mindmap
  return obj as OmdFile
}

export function fileNameToTitle(path: string): string {
  const base = path.replace(/\\/g, '/').split('/').pop() || '未命名'
  return base.replace(/\.[^.]+$/, '') || '未命名'
}
