<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { ContextMenuItem, type ContextMenuItemProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<ContextMenuItemProps & { class?: HTMLAttributes['class'] }>(), {
  as: 'div'
})

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <ContextMenuItem
    data-slot="context-menu-item"
    v-bind="delegatedProps"
    :class="
      cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
        props.class
      )
    "
  >
    <slot />
  </ContextMenuItem>
</template>
