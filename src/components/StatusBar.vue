<template>
  <footer
    class="absolute inset-x-0 bottom-0 z-[620] flex h-7 shrink-0 items-center gap-3 border-t border-border/60 bg-card/85 px-3 text-xs text-muted-foreground backdrop-blur-sm"
  >
    <span
      class="max-w-[55%] shrink truncate"
      :title="filePath || '未保存（内存中，自动保存将在首次保存后生效）'"
    >
      {{ filePath || '未保存（内存中，自动保存将在首次保存后生效）' }}
    </span>
    <div class="flex-1"></div>
    <span class="shrink-0 select-none tabular-nums" title="节点总数">{{ nodeCount }} 个节点</span>
    <span class="shrink-0 select-none tabular-nums" title="当前缩放比例">{{ zoom }}%</span>
    <span class="shrink-0 select-none whitespace-nowrap">{{ statusText }}</span>
  </footer>
</template>

<script setup lang="ts">
defineProps<{
  filePath: string | null
  statusText: string
  zoom: number
  nodeCount: number
}>()
</script>
