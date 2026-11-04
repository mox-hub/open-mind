// 全局编辑器实例访问（组件间共享，不进 Vue 响应式）
// 实例会在打开/导入/大文档切换性能模式时整体重建，
// 悬浮面板通过 onInstanceChange 订阅变更并及时重绑事件
let instance: any = null
const listeners = new Set<(inst: any) => void>()

export function setInstance(inst: any) {
  instance = inst
  listeners.forEach(fn => {
    try {
      fn(inst)
    } catch {}
  })
}

export function getInstance(): any {
  return instance
}

export function onInstanceChange(fn: (inst: any) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
