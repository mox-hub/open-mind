<template>
  <!-- 顶部居中轻提示：不拦截鼠标，多条堆叠自动消失 -->
  <div class="pointer-events-none absolute left-1/2 top-16 z-[100200] flex -translate-x-1/2 flex-col items-center gap-1.5">
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3.5 py-1.5 text-[13px] shadow-lg backdrop-blur-sm"
      >
        <CheckCircle2 v-if="t.kind === 'success'" class="size-4 text-emerald-500" />
        <AlertTriangle v-else-if="t.kind === 'error'" class="size-4 text-destructive" />
        <Info v-else class="size-4 text-muted-foreground" />
        <span class="select-none">{{ t.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Info } from 'lucide-vue-next'
import { toasts } from '../lib/toast'
</script>
