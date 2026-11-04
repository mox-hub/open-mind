<template>
  <div class="absolute bottom-9 left-3 z-[620] flex items-center gap-2">
    <PillGroup>
      <TooltipWrapper side="top" label="缩小" shortcut="Ctrl+滚轮">
        <Button variant="ghost" size="icon" class="rounded-full" @click="$emit('zoomOut')">
          <ZoomOut class="size-[17px]" />
        </Button>
      </TooltipWrapper>
      <button
        class="w-11 select-none rounded-md text-center text-xs tabular-nums text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="点击复位到 100%"
        @click="$emit('zoomReset')"
      >
        {{ zoom }}%
      </button>
      <TooltipWrapper side="top" label="放大" shortcut="Ctrl+滚轮">
        <Button variant="ghost" size="icon" class="rounded-full" @click="$emit('zoomIn')">
          <ZoomIn class="size-[17px]" />
        </Button>
      </TooltipWrapper>
      <TooltipWrapper side="top" label="适应画布" shortcut="Ctrl+Enter">
        <Button variant="ghost" size="icon" class="rounded-full" @click="$emit('zoomFit')">
          <Scan class="size-[17px]" />
        </Button>
      </TooltipWrapper>
      <span class="mx-0.5 h-5 w-px bg-border"></span>
      <TooltipWrapper side="top" :label="isFullscreen ? '退出全屏' : '全屏'" shortcut="F11">
        <Button variant="ghost" size="icon" class="rounded-full" @click="$emit('toggleFullscreen')">
          <Minimize2 v-if="isFullscreen" class="size-[17px]" />
          <Maximize2 v-else class="size-[17px]" />
        </Button>
      </TooltipWrapper>
    </PillGroup>
  </div>
</template>

<script setup lang="ts">
import { Maximize2, Minimize2, Scan, ZoomIn, ZoomOut } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { PillGroup, TooltipWrapper } from './ToolbarBits'

defineProps<{
  zoom: number
  isFullscreen: boolean
}>()

defineEmits<{
  (e: 'zoomIn'): void
  (e: 'zoomOut'): void
  (e: 'zoomFit'): void
  (e: 'zoomReset'): void
  (e: 'toggleFullscreen'): void
}>()
</script>
