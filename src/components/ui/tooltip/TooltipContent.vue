<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { TooltipArrow, TooltipContent, type TooltipContentEmits, type TooltipContentProps, TooltipPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends TooltipContentProps {
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  sideOffset: 4
})

const emits = defineEmits<TooltipContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      data-slot="tooltip-content"
      v-bind="delegatedProps"
      :class="
        cn(
          'z-[100200] rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          props.class
        )
      "
      @escape-key-down="emits('escapeKeyDown')"
      @pointer-down-outside="emits('pointerDownOutside')"
    >
      <slot />
      <TooltipArrow class="fill-primary" :width="12" :height="6" />
    </TooltipContent>
  </TooltipPortal>
</template>
