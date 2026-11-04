<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="ghost" size="sm" class="h-8 gap-1.5 rounded-full px-2.5" title="切换结构与节点形态">
        <Network class="size-[17px] text-muted-foreground" />
        <span class="text-xs">{{ currentLabel }}</span>
        <ChevronDown class="size-3 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="max-h-[70vh] w-[300px] overflow-y-auto p-2">
      <!-- 结构 -->
      <div class="px-1 pb-1 text-[11px] text-muted-foreground">结构</div>
      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="l in layouts"
          :key="l.value"
          class="flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors"
          :class="
            l.value === modelValue
              ? 'border-primary/70 bg-accent/50'
              : 'border-transparent hover:border-border hover:bg-secondary/60'
          "
          @click="pickLayout(l.value)"
        >
          <LayoutThumb :kind="l.value" class="w-full" />
          <span
            class="text-[11px] leading-none"
            :class="l.value === modelValue ? 'font-medium text-accent-foreground' : 'text-muted-foreground'"
          >
            {{ l.label }}
          </span>
        </button>
      </div>

      <!-- 节点形态变种 -->
      <div class="px-1 pb-1 pt-2.5 text-[11px] text-muted-foreground">节点形态</div>
      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="v in variants"
          :key="v.value"
          class="flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors"
          :class="
            v.value === variant
              ? 'border-primary/70 bg-accent/50'
              : 'border-transparent hover:border-border hover:bg-secondary/60'
          "
          @click="pickVariant(v.value)"
        >
          <VariantThumb :variant="v.value" class="w-full" />
          <span
            class="text-[11px] leading-none"
            :class="v.value === variant ? 'font-medium text-accent-foreground' : 'text-muted-foreground'"
          >
            {{ v.label }}
          </span>
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, Network } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import LayoutThumb from './LayoutThumb.vue'
import VariantThumb from './VariantThumb.vue'
import { THEME_VARIANTS, type ThemeVariant } from '@/lib/themes'

interface LayoutDef {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  variant: ThemeVariant
  layouts: LayoutDef[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:variant', value: ThemeVariant): void
}>()

// dev 辅助：?picker=layout|theme 时初始打开面板（配合截图验证）
const open = ref(new URLSearchParams(location.search).get('picker') === 'layout')
const currentLabel = computed(
  () => props.layouts.find(l => l.value === props.modelValue)?.label || '结构'
)
const variants = THEME_VARIANTS

function pickLayout(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function pickVariant(value: ThemeVariant) {
  emit('update:variant', value)
  open.value = false
}
</script>
