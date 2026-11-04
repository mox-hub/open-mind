// 轻提示：顶部居中、自动消失的全局 toast（替代 alert / 状态栏这一单一反馈出口）
import { reactive } from 'vue'

export interface ToastItem {
  id: number
  text: string
  kind: 'info' | 'success' | 'error'
}

export const toasts = reactive<ToastItem[]>([])
let seq = 0

export function toast(text: string, kind: ToastItem['kind'] = 'info', duration?: number) {
  const id = ++seq
  toasts.push({ id, text, kind })
  // 同时最多 3 条，超出丢最旧的
  if (toasts.length > 3) toasts.shift()
  setTimeout(
    () => {
      const i = toasts.findIndex(t => t.id === id)
      if (i >= 0) toasts.splice(i, 1)
    },
    duration ?? (kind === 'error' ? 4200 : 2600)
  )
}
