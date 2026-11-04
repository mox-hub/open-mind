<template>
  <!-- 主题迷你预览：按主题真实外观渲染微型导图（根 + 三条分支）；
       彩虹主题的分支线取 palette 前三色（与自动开启的彩虹分支一致） -->
  <svg viewBox="0 0 68 44" class="block h-auto w-full rounded-md" aria-hidden="true">
    <rect x="1" y="1" width="66" height="42" rx="6" :fill="bg" :stroke="bgStroke" stroke-width="1" />
    <path d="M24 22 H32 V10 H40" fill="none" :stroke="lineColorOf(0)" stroke-width="1.5" />
    <path d="M24 22 H40" fill="none" :stroke="lineColorOf(1)" stroke-width="1.5" />
    <path d="M24 22 H32 V34 H40" fill="none" :stroke="lineColorOf(2)" stroke-width="1.5" />
    <rect x="40" y="6" width="20" height="8" rx="2.5" :fill="secondFill" />
    <rect x="40" y="18" width="20" height="8" rx="2.5" :fill="secondFill" />
    <rect x="40" y="30" width="20" height="8" rx="2.5" :fill="secondFill" />
    <rect x="8" y="17" width="16" height="10" rx="3" :fill="rootFill" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeDef } from '@/lib/themes'

const props = defineProps<{ theme: ThemeDef }>()

const cfg = computed(() => props.theme.config)
const rootFill = computed(() => cfg.value.root?.fillColor || '#549688')
const secondFill = computed(() => cfg.value.second?.fillColor || '#e0f0ec')
const lineColor = computed(() => cfg.value.lineColor || '#a5c9c1')
const bg = computed(() => cfg.value.backgroundColor || '#fafafa')
// 暗色主题的预览底用浅描边，浅色主题用深描边，保证在弹层上不被吞掉
const bgStroke = computed(() =>
  props.theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
)
// 彩虹主题：分支线用色板色（与自动开启的彩虹分支一致），否则用主题线色
const lineColorOf = (i: number) =>
  (props.theme.rainbow && props.theme.palette?.[i]) || lineColor.value
</script>
