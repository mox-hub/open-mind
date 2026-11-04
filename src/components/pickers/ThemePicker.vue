<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="ghost" size="sm" class="h-8 gap-1.5 rounded-full px-2.5" title="切换配色方案">
        <span class="flex h-3 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
          <span
            v-for="(c, i) in currentPalette"
            :key="i"
            class="h-full flex-1"
            :style="{ background: c }"
          ></span>
        </span>
        <span class="text-xs">{{ currentLabel }}</span>
        <ChevronDown class="size-3 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="max-h-[65vh] w-[300px] overflow-y-auto p-2">
      <div v-for="g in groups" :key="g.label" class="mb-1.5 last:mb-0">
        <div class="px-1 pb-1 text-[11px] text-muted-foreground">{{ g.label }}</div>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="t in g.items"
            :key="t.name"
            class="flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors"
            :class="
              t.name === modelValue
                ? 'border-primary/70 bg-accent/50'
                : 'border-transparent hover:border-border hover:bg-secondary/60'
            "
            @click="pick(t.name)"
          >
            <ThemeThumb :theme="t" class="w-full" />
            <span
              class="text-[11px] leading-none"
              :class="t.name === modelValue ? 'font-medium text-accent-foreground' : 'text-muted-foreground'"
            >
              {{ t.label }}
            </span>
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ThemeThumb from './ThemeThumb.vue'
import type { ThemeDef } from '@/lib/themes'

const props = defineProps<{
  modelValue: string
  themes: ThemeDef[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', name: string): void
}>()

// dev 辅助：?picker=layout|theme 时初始打开面板（配合截图验证）
const open = ref(new URLSearchParams(location.search).get('picker') === 'theme')
const current = computed(() => props.themes.find(t => t.name === props.modelValue))
const currentLabel = computed(() => current.value?.label || '主题')
const currentPalette = computed(() => {
  const t = current.value
  if (t?.palette) return t.palette
  // 无色板时回退为主题自身三级颜色 + 线色
  const c = t?.config
  return [c?.root?.fillColor, c?.second?.fillColor, c?.lineColor].filter(Boolean)
})
// 彩色（多色相彩虹方案）/ 纯色（单色系）分组
const groups = computed(() => [
  { label: '彩色', items: props.themes.filter(t => t.rainbow) },
  { label: '纯色', items: props.themes.filter(t => !t.rainbow) }
])

function pick(name: string) {
  emit('update:modelValue', name)
  open.value = false
}
</script>
