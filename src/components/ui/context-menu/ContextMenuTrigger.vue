<script setup lang="ts">
import { ContextMenuTrigger, type ContextMenuTriggerProps } from 'reka-ui'

const props = withDefaults(defineProps<ContextMenuTriggerProps>(), {
  asChild: true
})
</script>

<template>
  <ContextMenuTrigger v-bind="props">
    <slot />
  </ContextMenuTrigger>
</template>
