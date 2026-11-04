<template>
  <TooltipProvider :delay-duration="350">
    <div class="relative h-screen overflow-hidden bg-background text-foreground">
    <!-- 画布：全屏铺底，所有 UI 悬浮其上 -->
    <div ref="editorEl" class="editor absolute inset-0 overflow-hidden">
      <!-- 演示模式控制条：必须放在画布容器内部，演示全屏时才能保持可见 -->
      <div
        v-if="demoOn"
        class="pointer-events-auto absolute bottom-14 left-1/2 z-[640] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card p-1.5 shadow-lg"
      >
        <Button variant="ghost" size="sm" class="h-8 gap-1.5 rounded-full px-3" @click="demoPrev()">
          <ChevronLeft class="size-4" /> 上一页
        </Button>
        <span class="px-2 text-xs text-muted-foreground">← → 翻页 · Enter 展示下划线文本 · Esc 退出</span>
        <Button variant="ghost" size="sm" class="h-8 gap-1.5 rounded-full px-3" @click="demoNext()">
          下一页 <ChevronRight class="size-4" />
        </Button>
        <Button variant="ghost" size="sm" class="h-8 rounded-full px-3" @click="demoExit()">退出演示</Button>
      </div>
    </div>

    <!-- 顶部悬浮工具栏（容器透事件，仅胶囊可点，画布透过空隙仍可交互） -->
    <Toolbar
      class="absolute inset-x-0 top-0 z-[620]"
      :title="title"
      :file-path="filePath"
      :dirty="dirty"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :cur-theme="curTheme"
      :cur-layout="curLayout"
      :cur-variant="curVariant"
      :themes="themes"
      :layouts="layouts"
      :rainbow-on="rainbowOn"
      :outline-on="outlineOn"
      :search-on="searchOn"
      :demo-on="demoOn"
      :recent-files="recentFiles"
      @new-doc="newDoc()"
      @open-doc="openDoc()"
      @save-doc="saveDoc()"
      @save-as="saveDocAs()"
      @undo="undo()"
      @redo="redo()"
      @set-theme="onThemeSelect"
      @set-layout="onLayoutSelect"
      @set-variant="applyVariant"
      @toggle-rainbow="toggleRainbow()"
      @toggle-outline="toggleOutline()"
      @toggle-search="toggleSearch()"
      @toggle-demo="toggleDemo()"
      @import-doc="importDocument()"
      @export-as="exportAs"
      @open-recent="openDoc"
      @remove-recent="onRemoveRecent"
      @clear-recents="onClearRecents"
      @reveal-in-folder="onRevealInFolder"
      @open-templates="openTemplates"
    />

    <!-- 左下角：缩放 / 全屏 -->
    <ZoomCluster
      :zoom="zoom"
      :is-fullscreen="isFullscreen"
      @zoom-in="zoomIn()"
      @zoom-out="zoomOut()"
      @zoom-fit="zoomFit()"
      @zoom-reset="zoomReset()"
      @toggle-fullscreen="toggleFullscreen"
    />

    <!-- 大纲悬浮面板 -->
    <OutlinePanel :visible="outlineOn" @close="outlineOn = false" />

    <!-- 小地图 -->
    <MiniMapPanel :visible="true" />

    <!-- 查找替换浮层 -->
    <SearchBar :visible="searchOn" @close="searchOn = false" />

    <!-- 底部悬浮状态栏 -->
    <StatusBar
      :file-path="filePath"
      :status-text="statusText"
      :zoom="zoom"
      :node-count="nodeCount"
    />

    <!-- 按住 Ctrl 时的快捷键速查浮层 -->
    <ShortcutHints :visible="ctrlHeld" />

    <!-- 底部画布标签页（多画布 Sheet） -->
    <SheetTabs
      :sheets="sheetTabs"
      :active-id="activeSheetId"
      @switch="switchSheet"
      @add="addSheet"
      @remove="removeSheet"
      @rename="renameSheet"
    />

    <!-- 顶部居中轻提示 -->
    <Toasts />

    <!-- 模板库 -->
    <TemplateDialog
      :open="templateOpen"
      @update:open="(v: boolean) => (templateOpen = v)"
      @new-doc="useTemplateNew"
      @replace-canvas="useTemplateReplace"
    />

    <!-- 右键菜单（自绘浮层：simple-mind-map 会在画布上拦截右键事件，组件库 trigger 无法接收） -->
    <ContextMenu
      :visible="ctx.visible"
      :x="ctx.x"
      :y="ctx.y"
      :kind="ctx.kind"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :has-children="ctx.hasChildren"
      :expanded="ctx.expanded"
      :active-icons="ctx.icons"
      :is-fullscreen="isFullscreen"
      :has-image="ctx.hasImage"
      :has-active-assoc="ctx.hasActiveAssoc"
      @action="onMenuAction"
      @close="ctx.visible = false"
    />

    <!-- 节点样式面板（右键菜单打开时隐藏，避免互相遮挡） -->
    <StylePanel
      :visible="stylePanel.visible && !ctx.visible"
      :count="stylePanel.count"
      :snapshot="stylePanel.snapshot"
      @set="onStyleSet"
      @close="stylePanel.visible = false"
    />

    <!-- 通用弹窗：确认 / 备注 / 链接 / 标签 -->
    <AppModals :modal="modal" @close="closeModal" @open-external="openExternal" />

    <!-- 图标选择浮层：点击节点上的图标触发，锚定点击位置 -->
    <div
      ref="iconAnchorEl"
      class="pointer-events-none fixed z-[-1] size-0"
      :style="{ left: iconPicker.x + 'px', top: iconPicker.y + 'px' }"
    ></div>
    <Popover :open="iconPicker.open" @update:open="(v: boolean) => (iconPicker.open = v)">
      <PopoverAnchor :element="iconAnchorEl" />
      <PopoverContent side="bottom" :side-offset="6" class="w-[290px] max-h-[65vh] overflow-y-auto p-2">
        <div v-for="g in iconGroups" :key="g.type" class="mb-2 last:mb-0">
          <div class="px-1 pb-1 text-[11px] text-muted-foreground">{{ g.name }}</div>
          <div class="grid grid-cols-8 gap-0.5">
            <button
              v-for="ic in g.list"
              :key="ic.name"
              class="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-secondary [&_svg]:size-[18px]"
              :class="iconPicker.icons.includes(g.type + '_' + ic.name) ? 'bg-accent ring-1 ring-primary/60' : ''"
              :title="g.name + ' ' + ic.name"
              @click.stop="toggleNodeIcon(g.type + '_' + ic.name)"
            >
              <span v-html="ic.icon"></span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, nextTick } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import {
  createMindMap,
  exportAsDataUrl,
  LAYOUTS,
  countTreeNodes,
  PERF_NODE_THRESHOLD
} from './lib/editor'
import { THEMES, registerThemes, buildVariantOverlay, inferVariant, type ThemeVariant } from './lib/themes'
import { applyRainbowNodes, clearRainbowNodes } from './lib/rainbow'
import { templateToSheet, type TemplateDef } from './lib/templates'
import {
  createNewDocument,
  fileNameToTitle,
  parseOmd,
  createSheetData,
  newSheetId,
  APP_VERSION,
  OMD_FORMAT,
  OMD_VERSION,
  type OmdFile,
  type OmdSheet
} from './lib/omd'
import {
  openFileDialog,
  saveAsDialog,
  exportDialog,
  readDocument,
  writeDocument,
  writeBase64File,
  loadSession,
  pushRecent,
  removeRecent,
  clearRecents,
  revealInFolder
} from './lib/docIO'
import { toast } from './lib/toast'
import ContextMenu from './components/ContextMenu.vue'
import StylePanel from './components/StylePanel.vue'
import OutlinePanel from './components/OutlinePanel.vue'
import MiniMapPanel from './components/MiniMapPanel.vue'
import SearchBar from './components/SearchBar.vue'
import AppModals from './components/AppModals.vue'
import Toolbar from './components/Toolbar.vue'
import ZoomCluster from './components/ZoomCluster.vue'
import ShortcutHints from './components/ShortcutHints.vue'
import StatusBar from './components/StatusBar.vue'
import SheetTabs from './components/SheetTabs.vue'
import Toasts from './components/Toasts.vue'
import TemplateDialog from './components/TemplateDialog.vue'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { iconGroups } from './lib/iconsData'
import { setInstance } from './lib/editorInstance'
import {
  markdownToTree,
  treeToMarkdown,
  treeToOpml,
  opmlToTree,
  treeToTxt,
  treeToFreemind,
  freemindToTree,
  xmindBytesToTree,
  blobToBase64
} from './lib/converters'
import { documentDir, join } from '@tauri-apps/api/path'
import { open as openFileDialogNative } from '@tauri-apps/plugin-dialog'

const editorEl = ref<HTMLElement | null>(null)
let mm: any = null // MindMap 实例，不进响应式系统

const title = ref('未命名')
const filePath = ref<string | null>(null)
const dirty = ref(false)
const statusText = ref('就绪')
const canUndo = ref(false)
const canRedo = ref(false)
const curTheme = ref('openmind-classic')
const curLayout = ref('logicalStructure')
const curVariant = ref<ThemeVariant>('standard')
const rainbowOn = ref(false)
const outlineOn = ref(false)
const searchOn = ref(false)
const demoOn = ref(false)
const assocActive = ref(false)
const zoom = ref(100)
const nodeCount = ref(0)
const ctrlHeld = ref(false) // 按住 Ctrl 时在画布上浮现快捷键速查
const themes = THEMES
const layouts = LAYOUTS
const recentFiles = ref<string[]>([])

// ---------- 多画布（Sheet）----------
// sheetTabs 仅承载标签 UI；数据在 sheetStore。活动画布的实时数据在 mm 实例里，
// 切换/序列化时通过 snapshotActiveSheet 回写 store
const sheetTabs = ref<{ id: string; name: string }[]>([])
const activeSheetId = ref('')
let sheetStore: OmdSheet[] = []
let loadingSheet = false // 换画布触发的 data_change 不应把文档标记为脏

let meta: OmdFile['meta'] | null = null
let autosaveTimer: ReturnType<typeof setTimeout> | null = null
let closing = false
let nodeCtxHandled = false // node_contextmenu 已处理的标志（避免画布菜单重复弹出）

// Tauri 窗口（纯浏览器 dev 目检时无此 API，退化为 null）
let win: any = null
try {
  win = getCurrentWindow()
} catch {}

// ---------- 右键菜单状态（浮层由 ContextMenu 自绘定位，这里只管状态与坐标） ----------
const ctx = reactive({
  visible: false,
  x: 0,
  y: 0,
  kind: 'canvas' as 'node' | 'canvas',
  hasChildren: false,
  expanded: undefined as boolean | undefined,
  icons: [] as string[],
  hasImage: false,
  hasActiveAssoc: false
})

// ---------- 图标选择浮层（点击节点上的图标触发） ----------
const iconPicker = reactive({
  open: false,
  x: 0,
  y: 0,
  icons: [] as string[]
})
const iconAnchorEl = ref<HTMLElement | null>(null)

// ---------- 样式面板状态 ----------
const stylePanel = reactive({
  visible: false,
  count: 0,
  snapshot: {} as Record<string, any>
})

// ---------- 弹窗状态 ----------
const modal = reactive({
  visible: false,
  type: 'confirm' as 'confirm' | 'note' | 'link' | 'tag',
  message: '',
  noteText: '',
  linkUrl: '',
  linkTitle: '',
  tagsText: ''
})
let modalResolve: ((v: boolean) => void) | null = null

function appConfirm(message: string): Promise<boolean> {
  return openModal('confirm', { message }) as Promise<boolean>
}

function openModal(
  type: 'confirm' | 'note' | 'link' | 'tag',
  fields?: Partial<typeof modal>
): Promise<boolean> | null {
  Object.assign(modal, {
    visible: true,
    type,
    message: '',
    noteText: '',
    linkUrl: '',
    linkTitle: '',
    tagsText: '',
    ...fields
  })
  const p = new Promise<boolean>(resolve => {
    modalResolve = resolve
  })
  return p
}

// 仅关闭弹窗并回传用户选择
function dismissModal(ok: boolean) {
  modal.visible = false
  if (modalResolve) {
    modalResolve(ok)
    modalResolve = null
  }
}

// 关闭弹窗；确定时先把编辑内容写回节点
function closeModal(ok: boolean) {
  if (ok && modal.type !== 'confirm' && mm) {
    const nodes: any[] = mm.renderer.activeNodeList || []
    if (modal.type === 'note') {
      for (const n of nodes) mm.execCommand('SET_NODE_NOTE', n, modal.noteText)
    } else if (modal.type === 'link') {
      for (const n of nodes)
        mm.execCommand('SET_NODE_HYPERLINK', n, modal.linkUrl.trim(), modal.linkTitle.trim())
    } else if (modal.type === 'tag') {
      const tags = modal.tagsText
        .split(/[,，、\s]+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
      for (const n of nodes) mm.execCommand('SET_NODE_TAG', n, tags)
    }
  }
  dismissModal(ok)
}

// ---------- 画布（Sheet）操作 ----------
function refreshSheetTabs() {
  sheetTabs.value = sheetStore.map(s => ({ id: s.id, name: s.name }))
}

// 把当前活动画布的实时数据（root/layout/theme/view）回写到 store
function snapshotActiveSheet() {
  if (!mm) return
  const entry = sheetStore.find(s => s.id === activeSheetId.value)
  if (entry) Object.assign(entry, mm.getData(true))
}

// 装载画布到编辑器（同一实例上整体换数据；历史随 setFullData 清空）
function loadSheet(sheet: OmdSheet) {
  if (!mm) return
  loadingSheet = true
  try {
    mm.setFullData({
      root: sheet.root,
      layout: sheet.layout || 'logicalStructure',
      theme: sheet.theme || { template: curTheme.value },
      view: sheet.view
    })
  } finally {
    loadingSheet = false
  }
  if (!sheet.view) {
    try { mm.view.reset() } catch {}
  }
  curTheme.value = mm.getTheme()
  curLayout.value = mm.getLayout()
  curVariant.value = inferVariant(sheet.theme?.config)
  syncShellTheme(curTheme.value)
  nodeCount.value = countNodes()
  zoom.value = Math.round((mm.view?.scale || 1) * 100)
  // 彩虹分支按画布独立：切换画布时按目标画布的开关重放
  rainbowOn.value = !!sheet.rainbow
  try { mm.rainbowLines?.updateRainLinesConfig({ open: rainbowOn.value, colorsList: curPalette() }) } catch {}
  syncRainbowNodes()
}

function switchSheet(id: string) {
  if (!mm || id === activeSheetId.value) return
  snapshotActiveSheet()
  const target = sheetStore.find(s => s.id === id)
  if (!target) return
  activeSheetId.value = id
  loadSheet(target)
  statusText.value = `已切换到「${target.name}」`
}

function addSheet() {
  if (!mm) return
  snapshotActiveSheet()
  const sheet: OmdSheet = {
    id: newSheetId(),
    name: `画布 ${sheetStore.length + 1}`,
    ...createSheetData('中心主题')
  }
  sheetStore.push(sheet)
  refreshSheetTabs()
  activeSheetId.value = sheet.id
  loadSheet(sheet)
  dirty.value = true
  toast(`已新建「${sheet.name}」`, 'success')
}

async function removeSheet(id: string) {
  if (!mm) return
  if (sheetStore.length <= 1) {
    toast('至少保留一个画布')
    return
  }
  const idx = sheetStore.findIndex(s => s.id === id)
  if (idx < 0) return
  if (id === activeSheetId.value) snapshotActiveSheet()
  const entry = sheetStore[idx]
  const nodeNum = countTreeNodes(entry.root)
  if (nodeNum > 1) {
    const ok = await appConfirm(`画布「${entry.name}」包含 ${nodeNum} 个节点，删除后不可恢复，确定删除吗？`)
    if (!ok) return
  }
  sheetStore.splice(idx, 1)
  if (activeSheetId.value === id) {
    const next = sheetStore[Math.min(idx, sheetStore.length - 1)]
    activeSheetId.value = next.id
    loadSheet(next)
  }
  refreshSheetTabs()
  dirty.value = true
  toast(`已删除「${entry.name}」`)
}

function renameSheet(id: string, name: string) {
  const entry = sheetStore.find(s => s.id === id)
  if (!entry) return
  entry.name = name
  refreshSheetTabs()
  dirty.value = true
}

// ---------- 序列化：活动画布快照 + 全部画布 ----------
function buildOmd(): OmdFile {
  snapshotActiveSheet()
  return {
    format: OMD_FORMAT,
    version: OMD_VERSION,
    meta: {
      ...(meta as OmdFile['meta']),
      title: (meta as OmdFile['meta']).title,
      updatedAt: new Date().toISOString(),
      app: `open-mind ${APP_VERSION}`
    },
    sheets: sheetStore.map(s => ({ ...s })),
    activeSheetId: activeSheetId.value
  }
}

// ---------- 保存 ----------
async function persist(path: string, quiet = false): Promise<boolean> {
  if (!mm || !meta) return false
  try {
    const doc = buildOmd()
    await writeDocument(path, JSON.stringify(doc, null, 2))
    dirty.value = false
    statusText.value = `已保存 · ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`
    filePath.value = path
    meta.title = fileNameToTitle(path)
    title.value = meta.title
    recentFiles.value = pushRecent(path)
    if (!quiet) toast('已保存', 'success')
    return true
  } catch (e: any) {
    if (!quiet) toast('保存失败：' + (e?.message || e), 'error')
    statusText.value = '保存失败'
    return false
  }
}

async function saveDoc() {
  if (filePath.value) {
    await persist(filePath.value)
  } else {
    await saveDocAs()
  }
}

async function saveDocAs() {
  const path = await saveAsDialog(`${title.value || '未命名'}.omd`)
  if (!path) return
  await persist(path.endsWith('.omd') ? path : path + '.omd')
}

// ---------- 新建 / 打开 ----------
// 重建编辑器实例并装入画布数据：打开/导入/新建时调用。
// 性能模式（>500 节点只渲染可视区域）在创建时按节点数决定，切换文档如跨阈值会自动重建
function setupEditor(sheet: OmdSheet) {
  if (mm) {
    try { mm.destroy() } catch {}
  }
  mm = createMindMap({
    el: editorEl.value!,
    data: sheet.root,
    theme: sheet.theme?.template || 'openmind-classic',
    layout: sheet.layout || 'logicalStructure',
    openPerformance: countTreeNodes(sheet.root) > PERF_NODE_THRESHOLD,
    customHyperlinkJump: (link: string) => {
      openExternal(link)
    }
  })
  setInstance(mm)
  try {
    if (sheet.view) mm.view.setTransformData(sheet.view)
  } catch {}
  bindEditorEvents()
  curTheme.value = mm.getTheme()
  curLayout.value = mm.getLayout()
  curVariant.value = inferVariant(sheet.theme?.config)
  syncShellTheme(curTheme.value)
  nodeCount.value = countNodes()
  zoom.value = Math.round((mm.view?.scale || 1) * 100)
  // 彩虹分支按画布持久化：重放开关与色板，并同步节点染色
  rainbowOn.value = !!sheet.rainbow
  try { mm.rainbowLines?.updateRainLinesConfig({ open: rainbowOn.value, colorsList: curPalette() }) } catch {}
  syncRainbowNodes()
}

function bindEditorEvents() {
  mm.on('data_change', () => {
    if (loadingSheet) return
    dirty.value = true
    scheduleAutosave()
    nodeCount.value = countNodes()
    scheduleRainbowApply()
  })
  // 库在构造/首次渲染时也会触发一次 data_change，忽略它，避免刚启动就被误标记为已修改
  setTimeout(() => {
    dirty.value = false
  }, 500)
  mm.on('back_forward', (cur: number, len: number) => {
    canUndo.value = cur > 0
    canRedo.value = cur < len - 1
  })
  mm.on('scale', (s: number) => {
    zoom.value = Math.round(s * 100)
  })
  mm.on('node_active', () => {
    refreshStylePanel()
  })
  // 右键：节点菜单（库会先独占激活该节点并 emit，坐标在事件里）
  mm.on('node_contextmenu', (e: MouseEvent, node: any) => {
    nodeCtxHandled = true
    showNodeMenu(e, node)
    setTimeout(() => (nodeCtxHandled = false), 0)
  })
  // 点击节点上的备注图标 → 打开备注编辑
  mm.on('node_note_click', () => {
    openNodeModal('note')
  })
  // 点击节点上的图标 → 在点击处打开图标选择浮层（可连续切换）
  mm.on('node_icon_click', (node: any, _icon: string, e: MouseEvent) => {
    iconPicker.x = e.clientX
    iconPicker.y = e.clientY
    iconPicker.icons = node.getData('icon') || []
    iconPicker.open = true
  })
  // 点击标签 → 打开标签编辑
  mm.on('node_tag_click', () => {
    openNodeModal('tag')
  })
  // 演示模式退出事件（Esc 退出时同步按钮状态）
  mm.on('exit_demonstrate', () => {
    demoOn.value = false
  })
  // 关联线选中状态（画布菜单「删除选中的关联线」可用性）
  mm.on('associative_line_click', () => {
    assocActive.value = true
  })
  mm.on('associative_line_deactivate', () => {
    assocActive.value = false
  })
}

function applyDocument(doc: OmdFile, path: string | null) {
  meta = doc.meta
  title.value = meta.title || fileNameToTitle(path || '') || '未命名'
  filePath.value = path
  sheetStore = doc.sheets.map(s => ({ ...s }))
  refreshSheetTabs()
  activeSheetId.value = doc.activeSheetId || sheetStore[0].id
  const first = sheetStore.find(s => s.id === activeSheetId.value) || sheetStore[0]
  setupEditor(first)
  dirty.value = false
}

async function newDoc(skipConfirm = false) {
  if (!skipConfirm && dirty.value) {
    const ok = await appConfirm('当前文档有未保存的修改，确定要新建并放弃这些修改吗？')
    if (!ok) return
  }
  const doc = createNewDocument()
  applyDocument(doc, null)
  statusText.value = '新文档（按 Ctrl+S 保存到磁盘）'
}

async function openDoc(pathArg?: string) {
  const path = pathArg || (await openFileDialog())
  if (!path) return
  try {
    const text = await readDocument(path)
    const doc = parseOmd(text)
    applyDocument(doc, path)
    statusText.value = `已打开 · ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`
    recentFiles.value = pushRecent(path)
    toast(`已打开「${fileNameToTitle(path)}」`, 'success')
  } catch (e: any) {
    toast('打开失败：' + (e?.message || e), 'error')
    // 从最近列表点开的失效条目自动清理
    if (pathArg) recentFiles.value = removeRecent(path)
  }
}

// ---------- 最近文件 / 打开所在文件夹 ----------
function onRemoveRecent(path: string) {
  recentFiles.value = removeRecent(path)
}

function onClearRecents() {
  recentFiles.value = clearRecents()
  toast('已清空最近记录')
}

async function onRevealInFolder(path: string) {
  try {
    await revealInFolder(path)
  } catch (e: any) {
    toast('打开文件夹失败：' + (e?.message || e), 'error')
  }
}

// ---------- 模板库 ----------
const templateOpen = ref(false)

function openTemplates() {
  templateOpen.value = true
}

async function useTemplateNew(t: TemplateDef) {
  if (dirty.value) {
    const ok = await appConfirm('当前文档有未保存的修改，确定要新建并放弃这些修改吗？')
    if (!ok) return
  }
  const doc = createNewDocument(t.name)
  const sheet = templateToSheet(t)
  doc.sheets[0] = sheet
  doc.activeSheetId = sheet.id
  applyDocument(doc, null)
  templateOpen.value = false
  statusText.value = `已从模板「${t.name}」新建文档`
  toast(`已从模板「${t.name}」新建`, 'success')
}

async function useTemplateReplace(t: TemplateDef) {
  const entry = activeSheetEntry()
  if (!entry || !mm) return
  const cnt = countTreeNodes(entry.root)
  if (cnt > 1) {
    const ok = await appConfirm(`当前画布已有 ${cnt} 个节点，替换后不可恢复，继续吗？`)
    if (!ok) return
  }
  entry.root = t.build()
  entry.layout = t.layout
  entry.theme = { template: t.theme }
  entry.rainbow = undefined
  loadSheet(entry)
  dirty.value = true
  templateOpen.value = false
  toast(`已应用模板「${t.name}」到当前画布`, 'success')
}

// ---------- 撤销 / 重做 / 缩放 ----------
function undo() { mm?.execCommand('BACK') }
function redo() { mm?.execCommand('FORWARD') }
function zoomIn() { mm?.view?.enlarge?.() }
function zoomOut() { mm?.view?.narrow?.() }
function zoomFit() {
  try { mm?.view?.reset?.() } catch {}
}
// 复位到 100%（保留当前平移位置）
function zoomReset() {
  try { mm?.view?.setScale?.(1) } catch {}
}

// ---------- 主题 / 布局 / 彩虹分支 / 大纲 / 全屏 ----------
// 画布主题切到暗色时，UI 壳（工具栏/面板/弹窗）同步切 .dark
function syncShellTheme(name: string) {
  const t = THEMES.find(x => x.name === name)
  document.documentElement.classList.toggle('dark', !!t?.dark)
}

// ---------- 画布跟随窗口尺寸 ----------
// simple-mind-map 不自带 window resize 监听，最大化/拉伸窗口后 SVG 停留旧尺寸会裁切内容；
// 这里防抖 150ms 后手动 resize（拖拽调整窗口时会连续触发，重渲染开销大）
let resizeTimer: ReturnType<typeof setTimeout> | null = null
function onWindowResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    resizeTimer = null
    try { mm?.resize?.() } catch {}
  }, 150)
}

// ---------- 全屏：Tauri 环境走窗口全屏（F11 系统切换由 onResized 同步图标），
// 纯浏览器 dev 目检时降级为 document 全屏
const isFullscreen = ref(false)

async function toggleFullscreen() {
  if (win) {
    try {
      await win.setFullscreen(!isFullscreen.value)
      isFullscreen.value = !isFullscreen.value
      // 全屏切换改变画布容器尺寸，通知编辑器重新测量
      nextTick(() => {
        try { mm?.resize?.() } catch {}
      })
      return
    } catch {}
  }
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
    else await document.exitFullscreen()
  } catch {}
}

function onThemeSelect(name: string) {
  curTheme.value = name
  mm?.setTheme?.(name)
  syncShellTheme(name)
  const t = THEMES.find(x => x.name === name)
  if (t?.palette?.length) {
    // 彩虹主题：切换即自动开启彩虹分支（切走时自动关闭）；色板同步给彩虹分支
    const open = !!t.rainbow
    rainbowOn.value = open
    try {
      mm?.rainbowLines?.updateRainLinesConfig({ open, colorsList: t.palette })
    } catch {}
    const entry = activeSheetEntry()
    if (entry) entry.rainbow = open
  }
  // 形态覆盖的描边/填充色取自主题，换主题后需按新主题重建
  applyVariant(curVariant.value)
  // 节点染色跟随新主题色板（开启时重染，关闭时清理残留标记）
  syncRainbowNodes()
}

// 节点形态变种：在当前主题上做形态覆盖（setThemeConfig，随文档持久化）
function applyVariant(variant: ThemeVariant) {
  curVariant.value = variant
  if (!mm) return
  if (variant === 'standard') {
    // 重置为纯模板，清除覆盖
    mm.setTheme(curTheme.value)
    return
  }
  const theme = THEMES.find(t => t.name === curTheme.value)
  const overlay = theme ? buildVariantOverlay(variant, theme) : null
  if (overlay) mm.setThemeConfig(overlay)
}

function onLayoutSelect(value: string) {
  curLayout.value = value
  mm?.setLayout?.(value)
}

function onThemeChange() { mm?.setTheme?.(curTheme.value); syncShellTheme(curTheme.value) }
function onLayoutChange() { mm?.setLayout?.(curLayout.value) }

// ---------- 彩虹分支：连线 + 节点染色 ----------
function curPalette(): string[] {
  return THEMES.find(t => t.name === curTheme.value)?.palette || []
}

function activeSheetEntry(): OmdSheet | undefined {
  return sheetStore.find(s => s.id === activeSheetId.value)
}

// 按当前开关同步节点染色（不开则清除染色）；全程暂停历史，不污染撤销栈
function syncRainbowNodes() {
  if (!mm) return
  const palette = curPalette()
  let changed = false
  if (rainbowOn.value && palette.length) {
    changed = applyRainbowNodes(mm, palette)
  } else {
    changed = clearRainbowNodes(mm)
  }
  if (changed) dirty.value = true
}

// 彩虹开启期间数据变动（增删节点/撤销重做/展开收起）后补染新节点
let rainbowTimer: ReturnType<typeof setTimeout> | null = null
function scheduleRainbowApply() {
  if (!rainbowOn.value) return
  if (rainbowTimer) clearTimeout(rainbowTimer)
  rainbowTimer = setTimeout(() => {
    rainbowTimer = null
    if (!mm || !rainbowOn.value) return
    syncRainbowNodes()
  }, 250)
}

function toggleRainbow() {
  rainbowOn.value = !rainbowOn.value
  try {
    mm?.rainbowLines?.updateRainLinesConfig({ open: rainbowOn.value, colorsList: curPalette() })
  } catch {}
  syncRainbowNodes()
  const entry = activeSheetEntry()
  if (entry) entry.rainbow = rainbowOn.value
  dirty.value = true
}
function toggleOutline() {
  outlineOn.value = !outlineOn.value
  // 面板已改为悬浮（不挤压画布），无需通知编辑器重新测量
}

// ---------- 导出 ----------
async function exportAs(type: string) {
  if (!mm) return
  try {
    statusText.value = '正在导出…'
    const baseName = title.value || '思维导图'
    if (type === 'png' || type === 'svg') {
      const path = await exportDialog(`${baseName}.${type}`, type as 'png' | 'svg')
      if (!path) return
      const { base64 } = await exportAsDataUrl(mm, type as 'png' | 'svg')
      await writeBase64File(path.endsWith('.' + type) ? path : path + '.' + type, base64)
    } else if (type === 'pdf') {
      const path = await exportDialog(`${baseName}.pdf`, 'pdf')
      if (!path) return
      // mm.export('pdf') 返回 data:application/pdf;base64,… 字符串
      const dataUrl: string = await mm.export('pdf', false, baseName)
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        throw new Error('PDF 导出返回数据异常')
      }
      await writeBase64File(path.endsWith('.pdf') ? path : path + '.pdf', dataUrl.slice(dataUrl.indexOf(',') + 1))
    } else if (type === 'xmind') {
      const path = await exportDialog(`${baseName}.xmind`, 'svg')
      if (!path) return
      const blob = await mm.export('xmind', false, baseName)
      const base64 = blobToBase64Helper(blob)
      await writeBase64File(path.endsWith('.xmind') ? path : path + '.xmind', await base64)
    } else {
      // 文本格式：md / opml / txt / freemind
      const root = mm.getData(false)
      const content =
        type === 'md'
          ? treeToMarkdown(root)
          : type === 'opml'
            ? treeToOpml(root)
            : type === 'freemind'
              ? treeToFreemind(root)
              : treeToTxt(root)
      const ext = type === 'md' ? 'md' : type === 'opml' ? 'opml' : type === 'freemind' ? 'mm' : 'txt'
      const path = await exportDialog(`${baseName}.${ext}`, ext as any)
      if (!path) return
      await writeDocument(path.endsWith('.' + ext) ? path : path + '.' + ext, content)
    }
    statusText.value = `已导出 · ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`
    toast('已导出', 'success')
  } catch (e: any) {
    toast('导出失败：' + (e?.message || e), 'error')
    statusText.value = '导出失败'
  }
}

function blobToBase64Helper(b: any): Promise<string> {
  if (b instanceof Blob) return blobToBase64(b)
  return Promise.reject(new Error('导出数据格式异常'))
}

// 兼容旧引用
async function exportImage(type: 'png' | 'svg') {
  await exportAs(type)
}

// ---------- 导入 ----------
async function importDocument() {
  const path = await openFileDialog()
  if (!path) return
  const lower = path.toLowerCase()
  try {
    statusText.value = '正在导入…'
    let tree: any = null
    if (lower.endsWith('.xmind')) {
      const base64 = await invoke<string>('read_file_base64', { path })
      const bin = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
      tree = await xmindBytesToTree(bin)
    } else if (lower.endsWith('.omd')) {
      await openDoc(path)
      return
    } else if (lower.endsWith('.opml') || lower.endsWith('.xml')) {
      tree = opmlToTree(await readDocument(path))
    } else if (lower.endsWith('.mm')) {
      tree = freemindToTree(await readDocument(path))
    } else {
      // md / markdown / txt
      tree = markdownToTree(await readDocument(path))
    }
    if (!tree || !tree.data) throw new Error('解析结果为空，请检查文件内容')
    if (dirty.value) {
      const ok = await appConfirm('导入会替换当前文档内容（当前未保存的修改将丢失），继续吗？')
      if (!ok) return
    }
    const now = new Date().toISOString()
    const sheet: OmdSheet = {
      id: newSheetId(),
      name: '画布 1',
      root: tree,
      layout: 'logicalStructure',
      theme: { template: curTheme.value }
    }
    const doc: OmdFile = {
      format: OMD_FORMAT,
      version: OMD_VERSION,
      meta: { title: fileNameToTitle(path), createdAt: now, updatedAt: now },
      sheets: [sheet],
      activeSheetId: sheet.id
    }
    applyDocument(doc, null)
    statusText.value = `已导入 ${fileNameToTitle(path)}（Ctrl+S 保存为 .omd）`
    toast(`已导入「${fileNameToTitle(path)}」`, 'success')
  } catch (e: any) {
    toast('导入失败：' + (e?.message || e), 'error')
    statusText.value = '导入失败'
  }
}

async function openExternal(url: string) {
  try {
    await invoke('open_url', { url })
  } catch (e: any) {
    alert('打开链接失败：' + (e?.message || e))
  }
}

// ---------- 自动保存 ----------
function scheduleAutosave() {
  if (!filePath.value) return
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(async () => {
    autosaveTimer = null
    if (dirty.value && filePath.value) {
      await persist(filePath.value, true)
    }
  }, 600)
}

// ---------- 关闭保护（原则：窗口永远可以关，数据永远有去处） ----------
async function saveRecoveryBackup() {
  if (!mm || !meta) return
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  try {
    const dir = await join(await documentDir(), 'OpenMind', '未保存')
    const fileName = `${(title.value || '未命名').replace(/[\\/:*?"<>|]/g, '_')}-${ts}.omd`
    const full = await join(dir, fileName)
    const doc = buildOmd()
    await writeDocument(full, JSON.stringify(doc, null, 2))
  } catch {}
}

async function handleClose() {
  if (closing) return
  closing = true
  try {
    if (dirty.value) {
      if (filePath.value) {
        // 已有文件：直接自动保存
        await persist(filePath.value, true)
      } else {
        // 从未保存过的新文档：静默备份到 文档/OpenMind/未保存/，不弹任何可能卡住的对话框
        await saveRecoveryBackup()
      }
    }
  } catch {}
  // 无论保存环节发生什么，都放行关闭
  try {
    win?.destroy?.()
  } catch {}
}

// ---------- 缩放 / 节点数（状态栏显示） ----------
function countNodes(): number {
  try {
    const root = mm?.getData?.(false)
    if (!root) return 0
    let n = 0
    const walk = (node: any) => {
      n++
      for (const c of node?.children || []) walk(c)
    }
    walk(root)
    return n
  } catch {
    return nodeCount.value
  }
}

// ---------- 右键菜单 ----------
// 多选快照：库在节点 contextmenu 处理器里会清空多选、只激活右键的单个节点，
// 这里用捕获阶段监听（先于库的冒泡处理器执行）把完整选区抢救出来
let multiSelectSnapshot: any[] = []

// 节点右键：库先独占激活该节点并 emit node_contextmenu（早于原生事件冒泡到画布容器），
// 在此把菜单状态切为「节点」；画布空白右键则切「画布」菜单。
function showNodeMenu(e: MouseEvent, node?: any) {
  const first = node || mm?.renderer?.activeNodeList?.[0]
  ctx.kind = 'node'
  ctx.hasChildren = !!(first && first.nodeData.children && first.nodeData.children.length)
  ctx.expanded = first ? first.getData('expand') : undefined
  ctx.icons = first ? first.getData('icon') || [] : []
  ctx.hasImage = !!(first && first.getData('image'))
  // 右键命中的节点在多选选区内：恢复完整选区（库已把它塌缩成单选），
  // 让外框/概要/删除/图标等所有菜单操作作用于全部选中节点；
  // 右键选区外的新节点则保持单选语义（重置选区）
  if (
    node &&
    multiSelectSnapshot.length > 1 &&
    multiSelectSnapshot.some(n => n.uid === node.uid)
  ) {
    try {
      mm.renderer.clearActiveNodeList()
      for (const n of multiSelectSnapshot) mm.renderer.addNodeToActiveList(n, true)
    } catch {}
  }
  ctx.x = e.clientX
  ctx.y = e.clientY
  ctx.visible = true
}

function showCanvasMenu(e: MouseEvent) {
  ctx.kind = 'canvas'
  ctx.icons = []
  ctx.hasActiveAssoc = assocActive.value
  ctx.x = e.clientX
  ctx.y = e.clientY
  ctx.visible = true
}

function onMenuAction(id: string, payload?: any) {
  const nodes: any[] = mm?.renderer?.activeNodeList || []
  const first = nodes[0]
  switch (id) {
    case 'addChild': mm.execCommand('INSERT_CHILD_NODE'); break
    case 'addSibling': mm.execCommand('INSERT_NODE'); break
    case 'addParent': mm.execCommand('INSERT_PARENT_NODE'); break
    case 'up': mm.execCommand('UP_NODE'); break
    case 'down': mm.execCommand('DOWN_NODE'); break
    case 'copy': mm.renderer.copy(); break
    case 'cut': mm.renderer.cut(); break
    case 'paste': mm.renderer.paste(); break
    case 'remove': mm.execCommand('REMOVE_NODE'); break
    case 'toggleIcon': {
      toggleNodeIcon(payload as string)
      break
    }
    case 'tags': openNodeModal('tag'); break
    case 'note': openNodeModal('note'); break
    case 'link': openNodeModal('link'); break
    case 'image': insertImage(); break
    case 'removeImage': {
      for (const n of nodes) mm.execCommand('SET_NODE_IMAGE', n, { url: '', title: '', width: 0, height: 0 })
      break
    }
    case 'summary': mm.execCommand('ADD_GENERALIZATION'); break
    case 'assoc':
      try { mm.associativeLine.createLineFromActiveNode() } catch {}
      break
    case 'frame': mm.execCommand('ADD_OUTER_FRAME'); break
    case 'toggleExpand':
      if (first) mm.execCommand('SET_NODE_EXPAND', first, !first.getData('expand'))
      break
    case 'expandToLevel': mm.execCommand('UNEXPAND_TO_LEVEL', payload); break
    case 'expandAll': mm.execCommand('EXPAND_ALL'); break
    case 'unexpandAll': mm.execCommand('UNEXPAND_ALL'); break
    case 'clearStyle': mm.execCommand('REMOVE_CUSTOM_STYLES'); break
    // 画布菜单
    case 'c_expandAll': mm.execCommand('EXPAND_ALL'); break
    case 'c_unexpandAll': mm.execCommand('UNEXPAND_ALL'); break
    case 'c_resetLayout': mm.execCommand('RESET_LAYOUT'); break
    case 'c_fit': zoomFit(); break
    case 'c_fullscreen': toggleFullscreen(); break
    case 'c_removeAssoc':
      try { mm.associativeLine.removeLine() } catch {}
      break
    case 'c_search': toggleSearch(); break
    case 'c_selectAll': mm.execCommand('SELECT_ALL'); break
    case 'c_undo': undo(); break
    case 'c_redo': redo(); break
    case 'c_new': newDoc(); break
    case 'c_open': openDoc(); break
    case 'c_save': saveDoc(); break
  }
}

// 图标切换：右键子菜单与图标浮层共用；切换后同步两处激活态，浮层保持打开供连续切换。
// 优先级/进度为单选语义（与 XMind 一致）：设置新的会先移除同组已有的。
function toggleNodeIcon(name: string) {
  const nodes: any[] = mm?.renderer?.activeNodeList || []
  const group = name.split('_')[0]
  const exclusive = group === 'priority' || group === 'progress'
  for (const n of nodes) {
    let cur: string[] = n.getData('icon') || []
    let next: string[]
    if (cur.includes(name)) {
      next = cur.filter(i => i !== name)
    } else {
      if (exclusive) cur = cur.filter(i => !i.startsWith(group + '_'))
      next = [...cur, name]
    }
    mm.execCommand('SET_NODE_ICON', n, next)
  }
  const f = mm.renderer.activeNodeList[0]
  const icons = f ? f.getData('icon') || [] : []
  ctx.icons = icons
  iconPicker.icons = icons
}

// ---------- 节点图片 ----------
async function insertImage() {
  const path = await openFileDialogNative({
    title: '选择图片',
    multiple: false,
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }]
  })
  if (typeof path !== 'string') return
  try {
    const base64 = await invoke<string>('read_file_base64', { path })
    const ext = path.split('.').pop()?.toLowerCase() || 'png'
    const mime =
      ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
    const dataUrl = `data:${mime};base64,${base64}`
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res as any
      img.onerror = rej
      img.src = dataUrl
    })
    let w = img.naturalWidth || 200
    let h = img.naturalHeight || 200
    const max = 200 // 初始宽度上限，插入后可通过 NodeImgAdjust 拖拽角点调整
    if (w > max) {
      h = Math.round((h * max) / w)
      w = max
    }
    const nodes: any[] = mm.renderer.activeNodeList || []
    for (const n of nodes) {
      mm.execCommand('SET_NODE_IMAGE', n, { url: dataUrl, title: '', width: w, height: h })
    }
  } catch (e: any) {
    toast('插入图片失败：' + (e?.message || e), 'error')
  }
}

// ---------- 查找替换 / 演示模式 ----------
function toggleSearch() {
  searchOn.value = !searchOn.value
}

function toggleDemo() {
  // 演示模式重构中：先保留入口，点击仅提示，不进入演示
  statusText.value = '演示模式开发中，敬请期待'
  toast('演示模式开发中，敬请期待')
}

function demoEnter() {
  if (!mm?.demonstrate) return
  demoOn.value = true
  try { mm.demonstrate.enter() } catch {}
}

function demoExit() {
  try { mm.demonstrate?.exit() } catch {}
  demoOn.value = false
}

function demoPrev() {
  try { mm.demonstrate?.prev() } catch {}
}

function demoNext() {
  try { mm.demonstrate?.next() } catch {}
}

function openNodeModal(type: 'note' | 'link' | 'tag') {
  const node = mm?.renderer?.activeNodeList?.[0]
  if (!node) return
  const fields: Partial<typeof modal> = {}
  if (type === 'note') fields.noteText = node.getData('note') || ''
  if (type === 'link') {
    fields.linkUrl = node.getData('hyperlink') || ''
    fields.linkTitle = node.getData('hyperlinkTitle') || ''
  }
  if (type === 'tag') {
    const tags = node.getData('tag') || []
    fields.tagsText = tags.map((t: any) => (typeof t === 'string' ? t : t.text)).join(', ')
  }
  openModal(type, fields)
}

// ---------- 样式面板 ----------
function refreshStylePanel() {
  const list: any[] = mm?.renderer?.activeNodeList || []
  stylePanel.count = list.length
  stylePanel.visible = list.length > 0
  if (list.length > 0) {
    const n = list[0]
    const snap: Record<string, any> = {}
    for (const p of [
      'color', 'fillColor', 'borderColor', 'borderWidth',
      'fontSize', 'fontWeight', 'fontStyle', 'shape'
    ]) {
      const v = n.getData(p)
      if (v !== undefined && v !== null) snap[p] = v
    }
    stylePanel.snapshot = snap
  }
}

function onStyleSet(prop: string, value: any) {
  const list: any[] = mm?.renderer?.activeNodeList || []
  for (const n of list) {
    mm.execCommand('SET_NODE_STYLE', n, prop, value)
  }
  refreshStylePanel()
}

// ---------- 全局快捷键 ----------
function onCtrlKeydown(e: KeyboardEvent) {
  if (e.key === 'Control') ctrlHeld.value = true
}

function onCtrlKeyup(e: KeyboardEvent) {
  if (e.key === 'Control') ctrlHeld.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'F11') {
    e.preventDefault()
    toggleFullscreen()
    return
  }
  if (e.key === 'Escape') {
    // 取消关联线创建模式（如果正在进行）
    try {
      if (mm?.associativeLine?.isCreatingLine) mm.associativeLine.cancelCreateLine()
    } catch {}
    // 查找栏打开时 Esc 关闭查找栏
    if (searchOn.value) {
      searchOn.value = false
      return
    }
    // 右键菜单打开时优先关菜单（菜单内的 Esc 由菜单自身的 keydown 处理）
    if (ctx.visible) {
      ctx.visible = false
      return
    }
  }
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return
  const key = e.key.toLowerCase()
  if (key === 's') {
    e.preventDefault()
    if (e.shiftKey) saveDocAs()
    else saveDoc()
  } else if (key === 'o') {
    e.preventDefault()
    openDoc()
  } else if (key === 'n') {
    e.preventDefault()
    newDoc()
  } else if (key === 'f') {
    e.preventDefault()
    if (!searchOn.value) searchOn.value = true
  }
}

onMounted(async () => {
  registerThemes()

  const session = loadSession()
  recentFiles.value = session.recent
  let doc: OmdFile | null = null
  let path: string | null = null
  if (session.lastPath) {
    try {
      const text = await readDocument(session.lastPath)
      doc = parseOmd(text)
      path = session.lastPath
    } catch {
      doc = null // 上次文件被移动/删除，退回新文档
    }
  }
  if (!doc) doc = createNewDocument()

  applyDocument(doc, path)

  // dev 辅助：?seed=1 生成演示导图（用于小地图/布局截图验证），不影响正常使用
  if (new URLSearchParams(location.search).has('seed')) {
    setTimeout(() => {
      try {
        const root = mm.renderer.root
        const texts = ['需求梳理', '技术方案', '里程碑']
        texts.forEach(t => {
          mm.execCommand('INSERT_CHILD_NODE', false, [root])
          const c = mm.renderer.activeNodeList?.[0]
          if (c) mm.execCommand('SET_NODE_TEXT', c, t)
        })
        const list = root.children || []
        list[0]?.children?.forEach((g: any, i: number) => {
          mm.execCommand('SET_NODE_TEXT', g, ['用户调研', '竞品分析'][i] || '')
        })
        list[1]?.children?.forEach((g: any, i: number) => {
          mm.execCommand('SET_NODE_TEXT', g, ['架构设计', '数据模型', '接口定义'][i] || '')
        })
        list[2]?.children?.forEach((g: any, i: number) => {
          mm.execCommand('SET_NODE_TEXT', g, ['MVP', '公测'][i] || '')
        })
      } catch {}
    }, 300)
  }

  // ---- 画布容器级监听（实例重建也无需重复绑定） ----
  // 右键：画布空白处菜单（自绘浮层需要阻止浏览器默认菜单）
  editorEl.value!.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault()
    if (nodeCtxHandled) return
    showCanvasMenu(e)
  })
  // 多选快照：捕获阶段监听，赶在库的节点右键处理器清空多选之前记录完整选区
  editorEl.value!.addEventListener(
    'contextmenu',
    () => {
      multiSelectSnapshot = (mm?.renderer?.activeNodeList || []).slice()
    },
    true
  )

  window.addEventListener('keydown', onKeydown)
  // 画布跟随窗口尺寸（最大化/还原/拖拽边框）
  window.addEventListener('resize', onWindowResize)
  // 按住 Ctrl 浮现快捷键速查（松开/窗口失焦即隐藏）
  window.addEventListener('keydown', onCtrlKeydown)
  window.addEventListener('keyup', onCtrlKeyup)
  window.addEventListener('blur', () => (ctrlHeld.value = false))
  // 全屏状态同步（系统 F11 等外部切换时图标跟随）
  if (win) {
    win.onResized(async () => {
      try {
        isFullscreen.value = await win.isFullscreen()
      } catch {}
    })
  } else {
    document.addEventListener('fullscreenchange', () => {
      isFullscreen.value = !!document.fullscreenElement
    })
  }
  win?.onCloseRequested?.(async (event: any) => {
    try {
      if (!dirty.value || closing) return
      event.preventDefault()
      await handleClose()
    } catch {
      // 任何异常都不能阻止窗口关闭
      try { win?.destroy?.() } catch {}
    }
  })

  statusText.value = path ? '已恢复上次会话' : '新文档（Ctrl+S 保存）'
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onWindowResize)
  if (resizeTimer) clearTimeout(resizeTimer)
  window.removeEventListener('keydown', onCtrlKeydown)
  window.removeEventListener('keyup', onCtrlKeyup)
  if (autosaveTimer) clearTimeout(autosaveTimer)
})
</script>
