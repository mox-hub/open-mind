<script setup lang="ts">
import { ContextMenuSub, type ContextMenuSubProps } from 'reka-ui'

const props = defineProps<ContextMenuSubProps>()
</script>

<template>
  <ContextMenuSub v-bind="props">
    <slot />
  </ContextMenuSub>
</template>
