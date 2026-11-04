// 内置图标数据：来自 simple-mind-map 的 nodeIconList（优先级/进度/表情/标记 四组）
// 节点数据中的图标名格式为 `${type}_${name}`，如 'priority_1'、'progress_1_3'
import iconsSvg from 'simple-mind-map/src/svg/icons.js'

export interface IconItem {
  name: string
  icon: string // svg 字符串
}

export interface IconGroup {
  name: string
  type: string
  list: IconItem[]
}

export const iconGroups: IconGroup[] = (iconsSvg.nodeIconList || []).map((g: any) => ({
  name: g.name,
  type: g.type,
  list: g.list
}))

export function iconName(type: string, name: string): string {
  return `${type}_${name}`
}
