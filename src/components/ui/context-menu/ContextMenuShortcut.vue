<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span
    data-slot="context-menu-shortcut"
    :class="cn('ml-auto pl-6 text-xs tracking-widest text-muted-foreground/80', props.class)"
  >
    <slot />
  </span>
</template>
