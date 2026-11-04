<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="w-[760px] max-w-[94vw] gap-3">
      <DialogHeader class="gap-1">
        <DialogTitle class="flex items-center gap-2 text-base">
          <LayoutTemplate class="size-4.5 text-primary" /> 模板库
        </DialogTitle>
        <DialogDescription class="text-xs">
          点击卡片从模板新建文档；或用「替换当前画布」覆盖当前画布内容
        </DialogDescription>
      </DialogHeader>
      <div class="grid max-h-[62vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="t in templates"
          :key="t.id"
          class="group relative flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/50 hover:shadow-md"
          :title="`从模板「${t.name}」新建文档`"
          @click="emit('newDoc', t)"
        >
          <span class="flex size-9 items-center justify-center rounded-lg bg-secondary/80 text-secondary-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            <component :is="iconOf(t.icon)" class="size-5" />
          </span>
          <span class="text-[13px] font-medium">{{ t.name }}</span>
          <span class="line-clamp-1 text-[11px] text-muted-foreground" :title="t.desc">{{ t.desc }}</span>
          <span class="mt-0.5 flex items-center gap-1.5">
            <span class="flex gap-0.5">
              <i
                v-for="(c, i) in themeDots(t.theme)"
                :key="i"
                class="size-2 rounded-full border border-black/5"
                :style="{ background: c }"
              ></i>
            </span>
            <span class="text-[10px] text-muted-foreground/80">{{ layoutLabel(t.layout) }}</span>
          </span>
          <span
            class="absolute bottom-2.5 right-2.5 hidden rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground group-hover:block"
            title="用此模板替换当前画布内容"
            @click.stop="emit('replaceCanvas', t)"
          >
            替换当前画布
          </span>
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  BookOpen, CalendarDays, GraduationCap, Grid2x2, LayoutTemplate, Lightbulb,
  Map, Package, Rocket, RotateCcw, Users
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TEMPLATES, type TemplateDef } from '../lib/templates'
import { THEMES } from '../lib/themes'
import { LAYOUTS } from '../lib/editor'

defineProps<{ open: boolean }>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'newDoc', t: TemplateDef): void
  (e: 'replaceCanvas', t: TemplateDef): void
}>()

const templates = TEMPLATES

const ICONS: Record<string, Component> = {
  rocket: Rocket,
  book: BookOpen,
  users: Users,
  lightbulb: Lightbulb,
  calendar: CalendarDays,
  grid: Grid2x2,
  package: Package,
  graduation: GraduationCap,
  rotate: RotateCcw,
  map: Map
}

function iconOf(key: string): Component {
  return ICONS[key] || LayoutTemplate
}

// 主题缩略：取主题节点配色的几个代表色
function themeDots(themeName: string): string[] {
  const t = THEMES.find(x => x.name === themeName)
  if (!t) return []
  const cfg = t.config as any
  const dots = [cfg.root?.fillColor, cfg.second?.fillColor, cfg.lineColor].filter(Boolean)
  if (t.palette?.length) dots.push(t.palette[0], t.palette[2])
  return dots.slice(0, 4)
}

function layoutLabel(value: string): string {
  return LAYOUTS.find(l => l.value === value)?.label?.replace(/（.*）/, '') || value
}
</script>
