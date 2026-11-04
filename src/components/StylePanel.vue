<template>
  <div
    v-if="visible"
    class="fixed right-3 top-[60px] z-[80000] w-[212px] rounded-xl border border-border bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-sm"
  >
    <div class="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
      节点样式
      <span v-if="count > 1" class="text-[11px] font-normal text-muted-foreground">{{ count }} 个节点</span>
      <button
        class="ml-auto rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="关闭"
        @click="$emit('close')"
      >
        <X class="size-3.5" />
      </button>
    </div>

    <div class="border-t border-border/60 py-2 first:border-t-0">
      <div class="mb-1.5 text-[11.5px] text-muted-foreground">文字颜色</div>
      <div class="flex flex-wrap gap-1">
        <Swatch v-for="c in colors" :key="'t' + c" :color="c" :selected="cur('color') === c" @pick="set('color', c)" />
        <SwatchReset title="恢复主题默认" @reset="set('color', undefined)" />
      </div>
    </div>

    <div class="border-t border-border/60 py-2">
      <div class="mb-1.5 text-[11.5px] text-muted-foreground">背景颜色</div>
      <div class="flex flex-wrap gap-1">
        <Swatch v-for="c in colors" :key="'b' + c" :color="c" :selected="cur('fillColor') === c" @pick="set('fillColor', c)" />
        <SwatchTransparent title="透明背景" @pick="set('fillColor', 'transparent')" />
        <SwatchReset title="恢复主题默认" @reset="set('fillColor', undefined)" />
      </div>
    </div>

    <div class="border-t border-border/60 py-2">
      <div class="mb-1.5 text-[11.5px] text-muted-foreground">边框</div>
      <div class="flex flex-wrap gap-1">
        <Swatch
          v-for="c in colors"
          :key="'bd' + c"
          :color="c"
          :selected="cur('borderColor') === c"
          size-class="size-4"
          @pick="set('borderColor', c)"
        />
        <SwatchReset title="恢复主题默认" @reset="set('borderColor', undefined)" />
      </div>
      <div class="mt-2 flex items-center gap-2">
        <span class="w-7 shrink-0 text-[11.5px] text-muted-foreground">粗细</span>
        <PropDropdown
          class="flex-1"
          :value="String(cur('borderWidth') ?? 0)"
          :options="borderWidthOptions"
          @pick="v => set('borderWidth', Number(v))"
        />
      </div>
    </div>

    <div class="border-t border-border/60 py-2">
      <div class="mb-1.5 text-[11.5px] text-muted-foreground">文字</div>
      <div class="flex items-center gap-2">
        <span class="w-7 shrink-0 text-[11.5px] text-muted-foreground">字号</span>
        <PropDropdown
          class="flex-1"
          :value="cur('fontSize') !== undefined ? String(cur('fontSize')) : ''"
          :options="fontSizeOptions"
          @pick="v => set('fontSize', v === '' ? undefined : Number(v))"
        />
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md border text-[13px] transition-colors"
          :class="cur('fontWeight') === 'bold' ? 'border-primary/50 bg-accent text-accent-foreground' : 'border-input bg-card hover:bg-secondary'"
          title="加粗"
          @click="set('fontWeight', cur('fontWeight') === 'bold' ? undefined : 'bold')"
        >
          <b>B</b>
        </button>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md border text-[13px] italic transition-colors"
          :class="cur('fontStyle') === 'italic' ? 'border-primary/50 bg-accent text-accent-foreground' : 'border-input bg-card hover:bg-secondary'"
          title="斜体"
          @click="set('fontStyle', cur('fontStyle') === 'italic' ? undefined : 'italic')"
        >
          <i>I</i>
        </button>
      </div>
    </div>

    <div class="border-t border-border/60 py-2">
      <div class="mb-1.5 text-[11.5px] text-muted-foreground">形状</div>
      <PropDropdown
        class="w-full"
        :value="cur('shape') ?? ''"
        :options="shapeOptions"
        @pick="v => set('shape', v === '' ? undefined : v)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, type PropType } from 'vue'
import { Check, ChevronDown, RotateCcw, X } from 'lucide-vue-next'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  visible: boolean
  count: number
  snapshot: Record<string, any> // 第一个激活节点的样式快照
}>()

const emit = defineEmits<{
  (e: 'set', prop: string, value: any): void
  (e: 'close'): void
}>()

const colors = [
  '#e93b30', '#fa8d2e', '#f5c740', '#3aa37f', '#3d8b7d',
  '#2b6cb8', '#7c6cd6', '#c25e7e', '#5a6472', '#111827',
  '#ffffff'
]

// [value, label]；value 为空字符串表示「主题默认」
const borderWidthOptions: [string, string][] = [
  ['0', '无边框'], ['1', '1 px'], ['2', '2 px'], ['3', '3 px'], ['4', '4 px'], ['5', '5 px']
]
const fontSizeOptions: [string, string][] = [
  ['', '主题默认'],
  ...[12, 13, 14, 15, 16, 18, 20, 24, 28].map(n => [String(n), n + ' px'])
] as [string, string][]
const shapeOptions: [string, string][] = [
  ['', '主题默认'],
  ['rectangle', '矩形'],
  ['roundedRectangle', '圆角矩形'],
  ['ellipse', '椭圆'],
  ['circle', '圆'],
  ['diamond', '菱形'],
  ['parallelogram', '平行四边形'],
  ['octagonalRectangle', '八角矩形'],
  ['outerTriangularRectangle', '外三角矩形'],
  ['innerTriangularRectangle', '内三角矩形']
]

function cur(prop: string) {
  return props.snapshot?.[prop]
}

function set(prop: string, value: any) {
  emit('set', prop, value)
}

// ---- 属性下拉（替代原生 select：DropdownMenu 实现，修复原生下拉无法使用的问题） ----
const PropDropdown = defineComponent({
  name: 'PropDropdown',
  props: {
    value: { type: String, required: true },
    options: { type: Array as PropType<[string, string][]>, required: true }
  },
  emits: ['pick'],
  setup(p, { emit: e }) {
    const labelOf = (v: string) => p.options.find(o => o[0] === v)?.[1] || p.options[0][1]
    return () =>
      h(DropdownMenu, {}, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, {
            default: () =>
              h(Button, {
                variant: 'outline',
                size: 'sm',
                class: 'h-7 w-full justify-between px-2 text-xs font-normal'
              }, {
                default: () => [
                  h('span', { class: 'truncate' }, labelOf(p.value)),
                  h(ChevronDown, { class: 'size-3 shrink-0 text-muted-foreground' })
                ]
              })
          }),
          h(DropdownMenuContent, { align: 'start', class: 'max-h-[280px] min-w-[9rem]' }, {
            default: () =>
              p.options.map(o =>
                h(DropdownMenuItem, {
                  key: o[0],
                  class: 'text-xs',
                  onClick: () => e('pick', o[0])
                }, {
                  default: () => [
                    h(Check, {
                      class:
                        'size-3.5 ' + (p.value === o[0] ? 'opacity-100' : 'opacity-0')
                    }),
                    o[1]
                  ]
                })
              )
          })
        ]
      })
  }
})

// ---- 色板小件 ----
const Swatch = defineComponent({
  props: {
    color: { type: String, required: true },
    selected: { type: Boolean, default: false },
    sizeClass: { type: String, default: 'size-[18px]' }
  },
  emits: ['pick'],
  setup(p, { emit: e }) {
    return () =>
      h('button', {
        class: [p.sizeClass, 'rounded border border-black/15 transition-transform hover:scale-110', p.selected ? 'outline-2 outline-offset-1 outline-primary' : ''],
        style: { background: p.color },
        onClick: () => e('pick')
      })
  }
})

const SwatchReset = defineComponent({
  props: { title: { type: String, default: '恢复主题默认' } },
  emits: ['reset'],
  setup(p, { emit: e }) {
    return () =>
      h('button', {
        class: 'flex size-[18px] items-center justify-center rounded border border-input bg-card text-muted-foreground transition-colors hover:bg-secondary',
        title: p.title,
        onClick: () => e('reset')
      }, [h(RotateCcw, { class: 'size-3' })])
  }
})

const SwatchTransparent = defineComponent({
  props: { title: { type: String, default: '透明背景' } },
  emits: ['pick'],
  setup(p, { emit: e }) {
    return () =>
      h('button', {
        class: 'size-[18px] rounded border border-black/15 transition-transform hover:scale-110',
        style: {
          background:
            'linear-gradient(45deg, var(--card) 45%, #e93b30 45%, #e93b30 55%, var(--card) 55%)'
        },
        title: p.title,
        onClick: () => e('pick')
      })
  }
})
</script>
