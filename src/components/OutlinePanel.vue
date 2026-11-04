<template>
  <div
    v-if="visible"
    class="absolute bottom-11 left-3 top-[60px] z-[610] flex w-80 flex-col overflow-hidden rounded-xl border border-border bg-card/95 text-card-foreground shadow-xl backdrop-blur-sm"
  >
    <div class="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2.5">
      <span class="text-[13px] font-semibold">大纲视图</span>
      <span class="text-[11px] text-muted-foreground">Enter 换行新增同级</span>
      <button
        class="ml-auto rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="关闭"
        @click="$emit('close')"
      >
        <X class="size-3.5" />
      </button>
    </div>
    <div ref="bodyRef" class="flex-1 overflow-y-auto px-2 pb-5 pt-1.5">
      <div
        v-for="row in rows"
        :key="row.uid"
        class="group flex items-center gap-1 rounded-md border-b border-border/30 py-px hover:bg-secondary/50"
        :class="dragUid === row.uid ? 'opacity-40' : ''"
        :style="{
          paddingLeft: 10 + row.depth * 16 + 'px',
          boxShadow: dropHint.uid === row.uid && dropHint.pos === 'before' ? 'inset 0 2px 0 0 hsl(var(--primary))' : dropHint.uid === row.uid && dropHint.pos === 'after' ? 'inset 0 -2px 0 0 hsl(var(--primary))' : dropHint.uid === row.uid && dropHint.pos === 'in' ? 'inset 0 0 0 1.5px hsl(var(--primary))' : ''
        }"
        draggable="true"
        @dragstart="onDragStart(row, $event)"
        @dragover.prevent="onDragOver(row, $event)"
        @dragleave="onDragLeave(row)"
        @drop.prevent="onDrop(row)"
        @dragend="resetDrag"
      >
        <span
          class="size-[7px] shrink-0 cursor-pointer rounded-full hover:outline-2 hover:outline-primary"
          :class="row.depth === 0 ? 'bg-primary' : 'bg-muted-foreground/40'"
          title="在导图中定位"
          @click="locate(row)"
        ></span>
        <input
          class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 hover:bg-secondary/70 focus:border-primary focus:bg-card select-text"
          :value="row.text"
          :data-uid="row.uid"
          :ref="el => setInputRef(el, row.uid)"
          placeholder="空主题"
          @change="setText(row, $event)"
          @keydown.enter.prevent="onEnter(row)"
          @focus="editingUid = row.uid"
          @blur="editingUid = null"
        />
        <span class="hidden shrink-0 gap-0.5 group-hover:flex">
          <button
            class="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground transition-colors hover:bg-secondary/70"
            title="添加子节点"
            @click="addChild(row)"
          >
            ＋子
          </button>
          <button
            class="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground transition-colors hover:bg-secondary/70"
            title="添加同级节点"
            @click="addSibling(row)"
          >
            ＋级
          </button>
          <button
            class="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            title="删除节点"
            @click="removeRow(row)"
          >
            删
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getInstance, onInstanceChange } from '../lib/editorInstance'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

interface Row {
  uid: string
  text: string
  depth: number
}

const rows = reactive<Row[]>([])
const bodyRef = ref<HTMLElement | null>(null)
const editingUid = ref<string | null>(null)
const inputEls = new Map<string, HTMLInputElement>()

let mm: any = null
let rebuildTimer: ReturnType<typeof setTimeout> | null = null
let destroyed = false
let unsubInstance: (() => void) | null = null
let pendingFocus: { anchorUid: string; mode: 'after' | 'child' } | null = null

function setInputRef(el: any, uid: string) {
  if (el) inputEls.set(uid, el as HTMLInputElement)
  else inputEls.delete(uid)
}

function rebuild() {
  if (!mm) return
  const data = mm.getData(false)
  const list: Row[] = []
  const walk = (node: any, depth: number) => {
    list.push({ uid: node?.data?.uid || node?.uid || String(list.length), text: node?.data?.text || '', depth })
    for (const c of node?.children || []) walk(c, depth + 1)
  }
  walk(data, 0)
  rows.splice(0, rows.length, ...list)

  if (pendingFocus) {
    const { anchorUid, mode } = pendingFocus
    pendingFocus = null
    const idx = rows.findIndex(r => r.uid === anchorUid)
    let t: Row | null = null
    if (idx >= 0 && rows[idx + 1]) {
      if (mode === 'child' && rows[idx + 1].depth === rows[idx].depth + 1) t = rows[idx + 1]
      else if (mode === 'after' && rows[idx + 1].depth === rows[idx].depth) t = rows[idx + 1]
    }
    if (t) {
      const uid = t.uid
      setTimeout(() => {
        const el = inputEls.get(uid)
        if (el) {
          el.focus()
          el.select()
        }
      }, 30)
    }
  }
}

function scheduleRebuild() {
  if (rebuildTimer) clearTimeout(rebuildTimer)
  rebuildTimer = setTimeout(() => {
    rebuildTimer = null
    rebuild()
  }, 120)
}

function findNode(uid: string): any {
  return mm?.renderer?.findNodeByUid?.(uid)
}

function setText(row: Row, e: Event) {
  const node = findNode(row.uid)
  const text = (e.target as HTMLInputElement).value
  if (!node) return
  if ((node.getData('text') || '') !== text) {
    mm.execCommand('SET_NODE_TEXT', node, text)
  }
}

function onEnter(row: Row) {
  const node = findNode(row.uid)
  if (!node) return
  ;(document.activeElement as HTMLInputElement | null)?.blur()
  pendingFocus = { anchorUid: row.uid, mode: 'after' }
  mm.execCommand('INSERT_NODE', false, [node])
}

function addChild(row: Row) {
  const node = findNode(row.uid)
  if (!node) return
  pendingFocus = { anchorUid: row.uid, mode: 'child' }
  mm.execCommand('INSERT_CHILD_NODE', false, [node])
}

function addSibling(row: Row) {
  const node = findNode(row.uid)
  if (!node) return
  pendingFocus = { anchorUid: row.uid, mode: 'after' }
  mm.execCommand('INSERT_NODE', false, [node])
}

function removeRow(row: Row) {
  const node = findNode(row.uid)
  if (!node) return
  mm.execCommand('REMOVE_NODE', [node])
}

function locate(row: Row) {
  const node = findNode(row.uid)
  if (!node) return
  try {
    mm.execCommand('GO_TARGET_NODE', node)
  } catch {}
}

// ---------- 拖拽排序 ----------
// 上/下沿=移到目标同级前后（可跨父），中段=移入成为其子节点；根节点与拖入自身子树被禁止
const dragUid = ref<string | null>(null)
const dropHint = reactive<{ uid: string | null; pos: 'before' | 'after' | 'in' }>({
  uid: null,
  pos: 'before'
})

function resetDrag() {
  dragUid.value = null
  dropHint.uid = null
  dropHint.pos = 'before'
}

function isDescendant(node: any, ancestor: any): boolean {
  let p = node?.parent
  while (p) {
    if (p.uid === ancestor.uid) return true
    p = p.parent
  }
  return false
}

function onDragStart(row: Row, e: DragEvent) {
  const node = findNode(row.uid)
  if (!node || node.isRoot) {
    e.preventDefault()
    return
  }
  dragUid.value = row.uid
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', row.uid)
  }
}

function onDragOver(row: Row, e: DragEvent) {
  if (!dragUid.value || dragUid.value === row.uid) return
  const drag = findNode(dragUid.value)
  const target = findNode(row.uid)
  if (!drag || !target) return
  if (isDescendant(target, drag)) return // 目标在拖动节点子树内：禁止
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = (e.clientY - rect.top) / rect.height
  let pos: 'before' | 'after' | 'in' = y < 1 / 3 ? 'before' : y > 2 / 3 ? 'after' : 'in'
  if (target.isRoot) pos = 'in' // 根节点没有同级
  dropHint.uid = row.uid
  dropHint.pos = pos
}

function onDragLeave(row: Row) {
  if (dropHint.uid === row.uid) dropHint.uid = null
}

function onDrop(row: Row) {
  const dragUidVal = dragUid.value
  const pos = dropHint.pos
  resetDrag()
  if (!dragUidVal || dragUidVal === row.uid) return
  const drag = findNode(dragUidVal)
  const target = findNode(row.uid)
  if (!drag || !target || drag.isRoot) return
  if (isDescendant(target, drag)) return
  const finalPos = target.isRoot ? 'in' : pos
  if (finalPos === 'in') {
    // 成为目标的最后一个子节点（库命令，天然可撤销）
    mm.execCommand('MOVE_NODE_TO', drag, target)
    return
  }
  // 同级前后插入（支持跨父）：直接改父的 children 数组，再 render + addHistory 入栈
  const parent = target.parent
  if (!parent) return
  const list = parent.nodeData.children
  const oldList = drag.parent?.nodeData?.children
  const from = oldList ? oldList.indexOf(drag.nodeData) : -1
  if (from < 0) return
  oldList!.splice(from, 1)
  let to = list.indexOf(target.nodeData)
  if (to < 0) {
    // 目标竟不在该数组（异常兜底）：放回原位
    oldList!.splice(from, 0, drag.nodeData)
    return
  }
  if (finalPos === 'after') to += 1
  list.splice(to, 0, drag.nodeData)
  if (parent !== drag.parent) target.setData({ expand: true })
  mm.render()
  mm.command.addHistory()
}

onMounted(() => {
  // 编辑器实例可能被整体重建（打开/导入文档、性能模式切换），通过订阅重绑事件
  unsubInstance = onInstanceChange(bindInstance)
  const inst = getInstance()
  if (inst) bindInstance(inst)
})

function bindInstance(inst: any) {
  if (mm) {
    mm.off('data_change', scheduleRebuild)
    mm.off('node_tree_render_end', scheduleRebuild)
  }
  mm = inst
  mm.on('data_change', scheduleRebuild)
  mm.on('node_tree_render_end', scheduleRebuild)
  rebuild()
}

onBeforeUnmount(() => {
  destroyed = true
  unsubInstance?.()
  if (rebuildTimer) clearTimeout(rebuildTimer)
  if (!mm) return
  mm.off('data_change', scheduleRebuild)
  mm.off('node_tree_render_end', scheduleRebuild)
})
</script>

