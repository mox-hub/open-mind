// simple-mind-map 封装：注册插件、创建实例
import MindMap from 'simple-mind-map'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Select from 'simple-mind-map/src/plugins/Select.js'
import KeyboardNavigation from 'simple-mind-map/src/plugins/KeyboardNavigation.js'
import Export from 'simple-mind-map/src/plugins/Export.js'
import ExportPDF from 'simple-mind-map/src/plugins/ExportPDF.js'
import AssociativeLine from 'simple-mind-map/src/plugins/AssociativeLine.js'
import OuterFrame from 'simple-mind-map/src/plugins/OuterFrame.js'
import RainbowLines from 'simple-mind-map/src/plugins/RainbowLines.js'
import MiniMap from 'simple-mind-map/src/plugins/MiniMap.js'
import Search from 'simple-mind-map/src/plugins/Search.js'
import Demonstrate from 'simple-mind-map/src/plugins/Demonstrate.js'
import NodeImgAdjust from 'simple-mind-map/src/plugins/NodeImgAdjust.js'

let pluginsReady = false

export function ensurePlugins() {
  if (pluginsReady) return
  // 插件集：拖拽、多选、方向键导航、导出(PNG/SVG/PDF)、关联线、外框、彩虹分支、
  // 小地图、查找替换、演示模式、节点图片拖拽调整
  MindMap.usePlugin(Drag)
  MindMap.usePlugin(Select)
  MindMap.usePlugin(KeyboardNavigation)
  MindMap.usePlugin(Export)
  MindMap.usePlugin(ExportPDF)
  MindMap.usePlugin(AssociativeLine)
  MindMap.usePlugin(OuterFrame)
  MindMap.usePlugin(RainbowLines)
  MindMap.usePlugin(MiniMap)
  MindMap.usePlugin(Search)
  MindMap.usePlugin(Demonstrate)
  MindMap.usePlugin(NodeImgAdjust)
  pluginsReady = true
}

export interface CreateOpts {
  el: HTMLElement
  data: any
  theme?: string
  layout?: string
  // 大图性能模式：只渲染可视区域节点，几百节点以上自动开启
  openPerformance?: boolean
  customHyperlinkJump?: (link: string) => void
}

export function createMindMap(opts: CreateOpts): any {
  ensurePlugins()
  return new MindMap({
    el: opts.el,
    data: opts.data,
    theme: opts.theme || 'openmind-classic',
    layout: opts.layout || 'logicalStructure',
    nodeTextEditZIndex: 10000,
    exportPaddingX: 30,
    exportPaddingY: 30,
    maxHistoryCount: 500,
    openPerformance: !!opts.openPerformance,
    // 允许 Ctrl/⌘ + 点击多选节点（库默认关闭）；框选多选由 Select 插件提供
    enableCtrlKeyNodeSelection: true,
    // 超链接不在 webview 内部导航，交给外部浏览器打开
    customHyperlinkJump: opts.customHyperlinkJump,
    rainbowLinesConfig: {
      open: false,
      colorsList: ['#e93b30', '#fa8d2e', '#f5c740', '#3aa37f', '#2b6cb8', '#7c6cd6']
    }
  })
}

// 超过该节点数自动开启性能模式（只渲染可视区域）
export const PERF_NODE_THRESHOLD = 500

// 统计 {data, children} 树的节点总数
export function countTreeNodes(root: any): number {
  let n = 0
  const walk = (node: any) => {
    if (!node) return
    n++
    for (const c of node.children || []) walk(c)
  }
  walk(root)
  return n
}

// ---------- 布局 ----------
export const LAYOUTS = [
  { value: 'logicalStructure', label: '逻辑图（右）' },
  { value: 'mindMap', label: '思维导图（左右）' },
  { value: 'logicalStructureLeft', label: '逻辑图（左）' },
  { value: 'organizationStructure', label: '组织架构图' },
  { value: 'catalogOrganization', label: '目录组织图' },
  { value: 'timeline', label: '时间轴（横向）' },
  { value: 'verticalTimeline', label: '时间轴（竖向）' },
  { value: 'fishbone', label: '鱼骨图' }
]

// ---------- 导出 ----------
export async function exportAsDataUrl(mindMap: any, type: 'png' | 'svg'): Promise<{ base64: string }> {
  // mindMap.export(type, isDownload=false) 返回 png: dataURL 字符串；svg: Blob
  const result = await mindMap.export(type, false, 'mindmap')
  if (typeof result === 'string' && result.startsWith('data:')) {
    return { base64: result.slice(result.indexOf(',') + 1) }
  }
  if (result instanceof Blob) {
    const buf = await result.arrayBuffer()
    let binary = ''
    const bytes = new Uint8Array(buf)
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any)
    }
    return { base64: btoa(binary) }
  }
  throw new Error('导出失败：未知的数据格式')
}
