// 彩虹分支的节点染色：库的 RainbowLines 插件只染连线，
// 这里把每个一级分支的色板颜色同步写到分支内所有节点的自定义样式上
// （fillColor + 文字色），实现 XMind 式「彩色分支」——节点填充跟着分支色走。
//
// 关键设计：
// - 直接改 renderer.renderTree 的数据再整体 render（与库 removeNodeLineColor 同模式）
// - 全程 command.pause()/recovery() 包裹：不产生历史记录、不触发 data_change，
//   撤销/重做/自动保存都不会被染色操作污染；改动后由调用方手动置脏
// - 每个被染色的节点打 _omRainbow 标记（记录分支色），清除时只动有标记的节点，
//   用户手动设置的其他节点样式不受影响

export const RAINBOW_MARKER = '_omRainbow'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const num = parseInt(h, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function toHex(r: number, g: number, b: number): string {
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${f(r)}${f(g)}${f(b)}`
}

// 向目标色混合：t=0 返回原色，t=1 返回目标色
function mix(hex: string, target: string, t: number): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  return toHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t)
}

const lighten = (hex: string, t: number) => mix(hex, '#ffffff', t)
const darken = (hex: string, t: number) => mix(hex, '#000000', t)

// 分支内某深度的节点样式：一级分支=实色+白字，更深层级=同色系浅底+深字
function branchStyle(color: string, depth: number): { fillColor: string; color: string } {
  if (depth === 0) return { fillColor: color, color: '#ffffff' }
  if (depth === 1) return { fillColor: lighten(color, 0.82), color: darken(color, 0.35) }
  return { fillColor: lighten(color, 0.92), color: darken(color, 0.25) }
}

function walkTree(node: any, fn: (data: any, depth: number) => void, depth = 0) {
  fn(node.data, depth)
  for (const c of node.children || []) walkTree(c, fn, depth + 1)
}

// 给整棵树按分支上色；返回是否有改动
export function applyRainbowNodes(mm: any, palette: string[]): boolean {
  const tree = mm?.renderer?.renderTree
  if (!tree || !Array.isArray(palette) || palette.length === 0) return false
  const branches = tree.children || []
  let changed = false
  mm.command.pause()
  try {
    branches.forEach((branch: any, i: number) => {
      const c = palette[i % palette.length]
      walkTree(branch, (data, depth) => {
        const style = branchStyle(c, depth)
        if (
          data.fillColor !== style.fillColor ||
          data.color !== style.color ||
          data[RAINBOW_MARKER] !== c
        ) {
          data.fillColor = style.fillColor
          data.color = style.color
          data[RAINBOW_MARKER] = c
          changed = true
        }
      })
    })
  } finally {
    mm.command.recovery()
  }
  if (changed) mm.render()
  return changed
}

// 清除所有由本模块染色的节点样式；返回是否有改动
export function clearRainbowNodes(mm: any): boolean {
  const tree = mm?.renderer?.renderTree
  if (!tree) return false
  let changed = false
  mm.command.pause()
  try {
    for (const branch of tree.children || []) {
      walkTree(branch, data => {
        if (data[RAINBOW_MARKER] !== undefined) {
          delete data[RAINBOW_MARKER]
          delete data.fillColor
          delete data.color
          changed = true
        }
      })
    }
  } finally {
    mm.command.recovery()
  }
  if (changed) mm.render()
  return changed
}
