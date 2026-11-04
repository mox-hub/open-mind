<template>
  <!-- 容器常驻（visible 时即渲染），只隐藏内部内容；否则首次计算拿不到容器尺寸，会死锁成永远不显示 -->
  <div
    v-if="visible"
    ref="boxRef"
    class="absolute bottom-10 right-3.5 z-[500] w-[clamp(200px,16vw,420px)] cursor-move overflow-hidden rounded-xl border border-border bg-card/90 shadow-xl backdrop-blur-sm [aspect-ratio:3/2]"
    @mousedown.prevent="onDragStart"
  >
    <div
      v-if="ready"
      class="pointer-events-none absolute origin-top-left [&_svg]:block"
      :style="{
        left: state.mapLeft + 'px',
        top: state.mapTop + 'px',
        transform: 'scale(' + state.mapScale + ')'
      }"
    >
      <div v-html="state.svgHtml"></div>
    </div>
    <div
      v-if="ready"
      class="pointer-events-none absolute rounded-[3px] border-[1.5px] border-primary/80 bg-primary/10"
      :style="state.viewBoxStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getInstance, onInstanceChange } from '../lib/editorInstance'

const props = defineProps<{ visible: boolean }>()

const boxRef = ref<HTMLElement | null>(null)
const ready = ref(false)
const state = reactive({
  svgHtml: '',
  viewBoxStyle: {} as Record<string, string>,
  mapScale: 1,
  mapLeft: 0,
  mapTop: 0,
  boxScale: 1,
  // 展示区→内容坐标系换算参数（点击跳转用）
  offX: 0,
  offY: 0,
  dx0: 0,
  dy0: 0
})

const VIEW_PORT_MIN_FACTOR = 1.5 // 小地图展示区至少为窗口视口的 1.5 倍，保证绿框始终有移动余量

let mm: any = null
let boxW = 240
let boxH = 160
let updateTimer: ReturnType<typeof setTimeout> | null = null
let destroyed = false
let resizeObserver: ResizeObserver | null = null
let unsubInstance: (() => void) | null = null
let dragging = false
let dragStartClient = { x: 0, y: 0 }
let dragStartState = { x: 0, y: 0 }

// 内容包围盒（内容坐标系）：遍历节点实例树取 left/top/width/height
function contentBBox(): { x0: number; y0: number; x1: number; y1: number } | null {
  const root = mm?.renderer?.root
  if (!root) return null
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const walk = (n: any) => {
    if ([n.left, n.top, n.width, n.height].every(v => typeof v === 'number')) {
      x0 = Math.min(x0, n.left)
      y0 = Math.min(y0, n.top)
      x1 = Math.max(x1, n.left + n.width)
      y1 = Math.max(y1, n.top + n.height)
    }
    for (const c of n.children || []) walk(c)
  }
  walk(root)
  return isFinite(x0) ? { x0, y0, x1, y1 } : null
}

function update() {
  if (!mm?.miniMap || !mm?.view || !boxRef.value) return
  boxW = boxRef.value.clientWidth || boxW
  boxH = boxRef.value.clientHeight || boxH
  try {
    const bbox = contentBBox()
    if (!bbox) return
    const cw = bbox.x1 - bbox.x0
    const ch = bbox.y1 - bbox.y0

    // 窗口视口换算到内容坐标系
    const t = mm.view.getTransformData()
    const scale = t?.state?.scale || 1
    const elW = mm.width || boxW
    const elH = mm.height || boxH
    const vpw = elW / scale
    const vph = elH / scale
    const vpx0 = -(t?.state?.x || 0) / scale
    const vpy0 = -(t?.state?.y || 0) / scale

    // 展示区 = max(内容包围盒, 视口×1.5)，围绕内容中心；绿框相对展示区永远有余量
    const cx = (bbox.x0 + bbox.x1) / 2
    const cy = (bbox.y0 + bbox.y1) / 2
    const dw = Math.max(cw, vpw * VIEW_PORT_MIN_FACTOR)
    const dh = Math.max(ch, vph * VIEW_PORT_MIN_FACTOR)
    const dx0 = cx - dw / 2
    const dy0 = cy - dh / 2

    // 适配进小地图面板（contain 居中）
    const s = Math.min(boxW / dw, boxH / dh)
    const offX = (boxW - dw * s) / 2
    const offY = (boxH - dh * s) / 2

    // 复用内建 svgHTML：内容紧贴裁剪的克隆 svg，原点即内容包围盒左上角
    const r = mm.miniMap.calculationMiniMap(boxW, boxH)
    state.svgHtml = r.svgHTML || ''
    state.mapScale = s
    state.mapLeft = offX + (bbox.x0 - dx0) * s
    state.mapTop = offY + (bbox.y0 - dy0) * s

    // 绿框 = 窗口视口在展示区中的投影，大小只随窗口/缩放变化，与内容多少无关
    state.viewBoxStyle = {
      left: offX + (vpx0 - dx0) * s + 'px',
      top: offY + (vpy0 - dy0) * s + 'px',
      width: vpw * s + 'px',
      height: vph * s + 'px'
    }
    state.boxScale = s
    state.offX = offX
    state.offY = offY
    state.dx0 = dx0
    state.dy0 = dy0
    ready.value = !!state.svgHtml
  } catch {}
}

function scheduleUpdate() {
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(update, 120)
}

// 编辑器实例可能被整体重建（打开/导入文档、性能模式切换），通过订阅重绑事件
function bindInstance(inst: any) {
  if (mm) {
    mm.off('data_change', scheduleUpdate)
    mm.off('node_tree_render_end', scheduleUpdate)
    mm.off('view_data_change', scheduleUpdate)
    mm.off('scale', scheduleUpdate)
    mm.off('translate', scheduleUpdate)
  }
  mm = inst
  // 数据变化（增删改节点）+ 视图变化（缩放 scale / 平移 translate）都要刷新小地图
  mm.on('data_change', scheduleUpdate)
  mm.on('node_tree_render_end', scheduleUpdate)
  mm.on('view_data_change', scheduleUpdate)
  mm.on('scale', scheduleUpdate)
  mm.on('translate', scheduleUpdate)
  update()
}

function onDragStart(e: MouseEvent) {
  if (!mm?.view) return
  // 点击跳转：把点击点换算为内容坐标，视口中心立刻移过去；随后可继续拖动微调
  const rect = boxRef.value!.getBoundingClientRect()
  const cx = state.dx0 + ((e.clientX - rect.left) - state.offX) / state.boxScale
  const cy = state.dy0 + ((e.clientY - rect.top) - state.offY) / state.boxScale
  const t = mm.view.getTransformData()
  const scale = t?.state?.scale || 1
  const tx = -cx * scale
  const ty = -cy * scale
  mm.view.translateXTo(tx)
  mm.view.translateYTo(ty)
  dragging = true
  dragStartClient = { x: e.clientX, y: e.clientY }
  dragStartState = { x: tx, y: ty }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!dragging) return
  const dx = e.clientX - dragStartClient.x
  const dy = e.clientY - dragStartClient.y
  // 拖动绿框 N 像素 = 视口在展示区平移 N/s 内容单位，换算回画布平移量
  mm.view.translateXTo(dragStartState.x - dx / state.boxScale)
  mm.view.translateYTo(dragStartState.y - dy / state.boxScale)
}

function onDragEnd() {
  dragging = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

onMounted(() => {
  // 先订阅再取当前值：实例尚未创建时等 setInstance 通知，已存在则立即绑定
  unsubInstance = onInstanceChange(bindInstance)
  const inst = getInstance()
  if (inst) bindInstance(inst)
  // 随窗口尺寸等比缩放（百分比宽度 + 最小/最大下限），尺寸变化时重算
  resizeObserver = new ResizeObserver(() => update())
  if (boxRef.value) resizeObserver.observe(boxRef.value)
})

onBeforeUnmount(() => {
  destroyed = true
  unsubInstance?.()
  if (updateTimer) clearTimeout(updateTimer)
  resizeObserver?.disconnect()
  onDragEnd()
  if (!mm) return
  mm.off('data_change', scheduleUpdate)
  mm.off('node_tree_render_end', scheduleUpdate)
  mm.off('view_data_change', scheduleUpdate)
  mm.off('scale', scheduleUpdate)
  mm.off('translate', scheduleUpdate)
})
</script>
