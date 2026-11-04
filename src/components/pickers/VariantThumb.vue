<template>
  <!-- 节点形态迷你预览：根 + 两个子节点按变种样式渲染 -->
  <svg viewBox="0 0 68 30" class="block h-auto w-full" aria-hidden="true">
    <g class="stroke-[#7c8593] dark:stroke-[#8a94a3]" stroke-width="1.5">
      <path d="M21 15 H30 M30 7.5 H40 M30 22.5 H40" fill="none" />
    </g>
    <!-- 子节点 -->
    <g v-if="variant === 'minimal'" class="fill-[#c9cfd8] dark:fill-[#5a6270]">
      <rect x="40" y="6" width="22" height="3" rx="1.5" />
      <rect x="40" y="21" width="18" height="3" rx="1.5" />
      <rect x="5" y="13.5" width="16" height="3" rx="1.5" />
    </g>
    <g v-else-if="variant === 'ellipse'" class="fill-[#e3e8ee] dark:fill-[#3a4048]">
      <ellipse cx="51" cy="7.5" rx="11" ry="5.5" />
      <ellipse cx="51" cy="22.5" rx="11" ry="5.5" />
      <ellipse cx="13" cy="15" rx="8" ry="6" />
    </g>
    <g v-else-if="variant === 'outline'" class="fill-none stroke-[#7c8593] dark:stroke-[#8a94a3]" stroke-width="1.5">
      <rect x="40" y="2" width="22" height="11" rx="5" />
      <rect x="40" y="17" width="22" height="11" rx="5" />
      <rect x="5" y="9" width="16" height="12" rx="5" />
    </g>
    <g v-else class="fill-[#e3e8ee] dark:fill-[#3a4048]">
      <rect x="40" y="2" width="22" height="11" :rx="rx" />
      <rect x="40" y="17" width="22" height="11" :rx="rx" />
      <rect x="5" y="9" width="16" height="12" :rx="rootRx" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ variant: string }>()

const rx = computed(() => {
  switch (props.variant) {
    case 'capsule': return 5.5
    case 'rounded': return 4
    default: return 2
  }
})
const rootRx = computed(() => {
  switch (props.variant) {
    case 'capsule': return 6
    case 'rounded': return 5
    default: return 2.5
  }
})
</script>
