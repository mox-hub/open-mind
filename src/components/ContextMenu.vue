<template>
  <Teleport to="body">
    <!-- 一级菜单：fixed 定位在右键坐标，自动边缘翻转 -->
    <div
      v-if="visible"
      ref="menuRef"
      class="fixed z-[100100] min-w-[13.5rem] max-w-[19rem] max-h-[82vh] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none"
      :style="{ left: menuX + 'px', top: menuY + 'px' }"
      tabindex="-1"
      @keydown="onMenuKeydown"
      @wheel="close"
      @contextmenu.prevent
    >
      <template v-if="kind === 'node'">
        <MItem
          v-for="item in nodeItems" :key="item.id" :item="item"
          :active="activeId === item.id"
          :has-sub="!!item.sub"
          @activate="onItem"
          @hover="onHoverItem"
          @close="close"
        />
      </template>
      <template v-else>
        <MItem
          v-for="item in canvasItems" :key="item.id" :item="item"
          :active="activeId === item.id"
          @activate="onItem"
          @hover="onHoverItem"
          @close="close"
        />
      </template>
    </div>

    <!-- 二级浮层（图标 / 展开层级），挂在 body 层避免被一级菜单裁剪 -->
    <div
      v-if="visible && flyout.item"
      data-om-flyout
      class="fixed z-[100110] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none"
      :class="flyout.item.sub === 'icons' ? 'w-[290px] max-h-[65vh] overflow-y-auto' : 'min-w-[9rem]'"
      :style="{ left: flyout.x + 'px', top: flyout.y + 'px' }"
      @mouseenter="cancelHideFlyout"
      @mouseleave="scheduleHideFlyout"
      @wheel.stop
    >
      <!-- 图标选择器 -->
      <template v-if="flyout.item.sub === 'icons'">
        <div v-for="g in iconGroups" :key="g.type" class="mb-2 last:mb-0">
          <div class="px-1 pb-1 text-[11px] text-muted-foreground">{{ g.name }}</div>
          <div class="grid grid-cols-8 gap-0.5">
            <button
              v-for="ic in g.list"
              :key="ic.name"
              class="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-secondary [&_svg]:size-[18px]"
              :class="activeIcons.includes(g.type + '_' + ic.name) ? 'bg-accent ring-1 ring-primary/60' : ''"
              :title="g.name + ' ' + ic.name"
              @click.stop="$emit('action', 'toggleIcon', g.type + '_' + ic.name)"
            >
              <span v-html="ic.icon"></span>
            </button>
          </div>
        </div>
      </template>

      <!-- 展开层级 -->
      <template v-else-if="flyout.item.sub === 'levels'">
        <button
          v-for="n in 5"
          :key="n"
          class="flex h-8 w-full items-center rounded-md px-2 text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
          @click.stop="$emit('action', 'expandToLevel', n); close()"
        >
          第 {{ n }} 级
        </button>
        <div class="my-1 h-px bg-border"></div>
        <button
          class="flex h-8 w-full items-center rounded-md px-2 text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
          @click.stop="$emit('action', 'expandAll'); close()"
        >
          展开全部
        </button>
        <button
          class="flex h-8 w-full items-center rounded-md px-2 text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
          @click.stop="$emit('action', 'unexpandAll'); close()"
        >
          收起全部
        </button>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, reactive, ref, watch, type PropType } from 'vue'
import {
  BoxSelect, ChevronRight, ChevronsDown, ChevronsDownUp, ChevronsUp, Eraser, Expand,
  FilePlus2, FolderOpen, Frame, ImageOff, ImagePlus, LayoutGrid, Link, Maximize2, Redo2,
  Save, Search, SmilePlus, Spline, StickyNote, Tags, Undo2, Unlink
} from 'lucide-vue-next'
import { iconGroups } from '../lib/iconsData'

// 菜单项渲染组件（分隔线 / 常规项），render 函数实现以复用同一模板结构
const MItem = defineComponent({
  name: 'MItem',
  props: {
    item: { type: Object as PropType<MItemDef>, required: true },
    active: { type: Boolean, default: false },
    hasSub: { type: Boolean, default: false }
  },
  emits: ['activate', 'hover', 'close'],
  setup(p, { emit: e }) {
    return () => {
      if (p.item.icon === 'sep') {
        return h('div', { class: '-mx-1 my-1 h-px bg-border' })
      }
      const Icon = typeof p.item.icon === 'object' ? p.item.icon : null
      return h(
        'div',
        {
          class: [
            'om-menu-item flex h-8 cursor-pointer select-none items-center gap-2 rounded-lg px-2 text-[13px] outline-none transition-colors',
            p.item.disabled ? 'pointer-events-none opacity-45' : '',
            p.active ? 'bg-accent text-accent-foreground' : '',
            p.item.danger ? 'text-destructive' : ''
          ],
          onClick: (ev: MouseEvent) => {
            if (p.item.sub) {
              e('hover', p.item, ev)
            } else {
              e('activate', p.item)
            }
          },
          onMouseenter: (ev: MouseEvent) => e('hover', p.item, ev)
        },
        [
          Icon
            ? h(Icon, {
                class:
                  'size-4 shrink-0 ' + (p.item.danger ? 'text-destructive' : 'text-muted-foreground')
              })
            : null,
          h('span', { class: 'flex-1' }, p.item.label),
          p.item.hint
            ? h('span', { class: 'pl-6 text-xs tracking-widest text-muted-foreground/80' }, p.item.hint)
            : null,
          p.hasSub ? h(ChevronRight, { class: 'size-3.5 text-muted-foreground' }) : null
        ]
      )
    }
  }
})


interface MItemDef {
  id: string
  label: string
  icon?: any
  hint?: string
  sub?: 'icons' | 'levels'
  disabled?: boolean
  danger?: boolean
}

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  kind: 'node' | 'canvas'
  canUndo: boolean
  canRedo: boolean
  hasChildren: boolean
  expanded: boolean | undefined
  activeIcons: string[]
  isFullscreen: boolean
  hasImage: boolean
  hasActiveAssoc: boolean
}>()

const emit = defineEmits<{
  (e: 'action', id: string, payload?: any): void
  (e: 'close'): void
}>()

// ---------- 菜单数据 ----------
const nodeItems = computed<MItemDef[]>(() => [
  { id: 'addChild', label: '添加子节点', hint: 'Tab' },
  { id: 'addSibling', label: '添加同级节点', hint: 'Enter' },
  { id: 'addParent', label: '插入父节点', hint: 'Shift+Tab' },
  { id: 'sep1', label: '', icon: 'sep' },
  { id: 'up', label: '节点上移' },
  { id: 'down', label: '节点下移' },
  { id: 'sep2', label: '', icon: 'sep' },
  { id: 'copy', label: '复制', hint: 'Ctrl+C' },
  { id: 'cut', label: '剪切', hint: 'Ctrl+X' },
  { id: 'paste', label: '粘贴', hint: 'Ctrl+V' },
  { id: 'remove', label: '删除节点', hint: 'Del', danger: true },
  { id: 'sep3', label: '', icon: 'sep' },
  { id: 'icons', label: '图标', icon: SmilePlus, sub: 'icons' },
  { id: 'tags', label: '标签…', icon: Tags },
  { id: 'note', label: '备注…', icon: StickyNote },
  { id: 'link', label: '超链接…', icon: Link },
  { id: 'image', label: '插入/替换图片…', icon: ImagePlus },
  { id: 'removeImage', label: '移除图片', icon: ImageOff, disabled: !props.hasImage },
  { id: 'sep4', label: '', icon: 'sep' },
  { id: 'summary', label: '插入概要', hint: 'Ctrl+G' },
  { id: 'assoc', label: '添加关联线', icon: Spline },
  { id: 'frame', label: '添加外框', icon: Frame },
  { id: 'sep5', label: '', icon: 'sep' },
  {
    id: 'toggleExpand',
    label: props.expanded === false ? '展开子节点' : '收起子节点',
    hint: '/',
    disabled: !props.hasChildren
  },
  { id: 'expandTo', label: '展开到指定层级', icon: ChevronsDownUp, sub: 'levels' },
  { id: 'sep6', label: '', icon: 'sep' },
  { id: 'clearStyle', label: '清除节点自定义样式', icon: Eraser }
])

const canvasItems = computed<MItemDef[]>(() => [
  { id: 'c_expandAll', label: '展开全部', icon: ChevronsDown },
  { id: 'c_unexpandAll', label: '收起全部', icon: ChevronsUp },
  { id: 'c_resetLayout', label: '重置布局', icon: LayoutGrid },
  { id: 'c_fit', label: '适应画布', icon: Maximize2, hint: 'Ctrl+Enter' },
  { id: 'c_fullscreen', label: props.isFullscreen ? '退出全屏' : '全屏', icon: Expand, hint: 'F11' },
  { id: 'c_removeAssoc', label: '删除选中的关联线', icon: Unlink, disabled: !props.hasActiveAssoc },
  { id: 'csep1', label: '', icon: 'sep' },
  { id: 'c_search', label: '查找替换', icon: Search, hint: 'Ctrl+F' },
  { id: 'c_selectAll', label: '全选节点', icon: BoxSelect, hint: 'Ctrl+A' },
  { id: 'c_undo', label: '撤销', icon: Undo2, hint: 'Ctrl+Z', disabled: !props.canUndo },
  { id: 'c_redo', label: '重做', icon: Redo2, hint: 'Ctrl+Y', disabled: !props.canRedo },
  { id: 'csep2', label: '', icon: 'sep' },
  { id: 'c_new', label: '新建文档', icon: FilePlus2, hint: 'Ctrl+N' },
  { id: 'c_open', label: '打开文档…', icon: FolderOpen, hint: 'Ctrl+O' },
  { id: 'c_save', label: '保存文档', icon: Save, hint: 'Ctrl+S' }
])

// ---------- 定位（边缘翻转） ----------
const menuRef = ref<HTMLElement | null>(null)
const menuX = computed(() => Math.min(props.x, window.innerWidth - 230))
const menuY = computed(() => {
  const list = props.kind === 'node' ? nodeItems.value : canvasItems.value
  const items = list.filter(i => i.icon !== 'sep').length
  const seps = list.length - items
  return Math.min(props.y, Math.max(10, window.innerHeight - (items * 32 + seps * 9 + 16) - 10))
})

// ---------- 键盘导航 ----------
const activeId = ref<string | null>(null)

function actionableItems(): MItemDef[] {
  const list = props.kind === 'node' ? nodeItems.value : canvasItems.value
  return list.filter(i => i.icon !== 'sep' && !i.disabled)
}

function onMenuKeydown(e: KeyboardEvent) {
  const list = actionableItems()
  if (!list.length) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const idx = list.findIndex(i => i.id === activeId.value)
    const next =
      e.key === 'ArrowDown'
        ? list[(idx + 1 + list.length) % list.length]
        : list[(idx - 1 + list.length) % list.length]
    activeId.value = next.id
  } else if (e.key === 'Enter') {
    const item = list.find(i => i.id === activeId.value)
    if (item) onItem(item)
  } else if (e.key === 'Escape') {
    e.stopPropagation()
    close()
  }
}

// ---------- 子菜单浮层 ----------
const flyout = reactive<{ item: MItemDef | null; x: number; y: number }>({
  item: null,
  x: 0,
  y: 0
})
let hideTimer: ReturnType<typeof setTimeout> | null = null

function onHoverItem(item: MItemDef, e: MouseEvent) {
  if (!item.sub) {
    hideFlyout()
    return
  }
  cancelHideFlyout()
  const el = (e.target as HTMLElement).closest('.om-menu-item') as HTMLElement | null
  if (!el) return
  const r = el.getBoundingClientRect()
  flyout.item = item
  const fw = item.sub === 'icons' ? 300 : 160
  const fh = item.sub === 'icons' ? 420 : 200
  flyout.x = r.right + 4 + fw > window.innerWidth ? r.left - fw - 4 : r.right + 4
  flyout.y = Math.min(Math.max(10, r.top - 6), Math.max(10, window.innerHeight - fh - 10))
}

function scheduleHideFlyout() {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    flyout.item = null
  }, 200)
}

function cancelHideFlyout() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function hideFlyout() {
  cancelHideFlyout()
  flyout.item = null
}

function onItem(item: MItemDef) {
  if (item.disabled) return
  if (item.sub) return // 子菜单项由 hover 展开，点击不触发
  emit('action', item.id)
  close()
}

function close() {
  emit('close')
}

// 打开时：重置键盘/子菜单状态，聚焦菜单以接收键盘，点击外部/滚动关闭
watch(
  () => props.visible,
  v => {
    if (v) {
      activeId.value = null
      hideFlyout()
      setTimeout(() => menuRef.value?.focus(), 0)
      window.addEventListener('mousedown', onOutsideDown, true)
    } else {
      window.removeEventListener('mousedown', onOutsideDown, true)
      hideFlyout()
    }
  }
)

function onOutsideDown(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (menuRef.value?.contains(t)) return
  if (t.closest('[data-om-flyout]')) return
  close()
}

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onOutsideDown, true)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>
