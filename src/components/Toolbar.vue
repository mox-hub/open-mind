<template>
  <header class="flex h-14 items-center justify-between gap-3 px-3 pointer-events-none">
    <!-- 左对齐：品牌 + 文档名（点击弹文档菜单：新建/打开/最近列表）+ 导入/导出（图标化并入标题栏） -->
    <div
      class="pointer-events-auto flex min-w-0 shrink-0 items-center gap-0.5 rounded-full border border-border bg-card p-1 pl-1.5 shadow-sm"
    >
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            class="flex min-w-0 items-center gap-1 rounded-full px-1.5 py-1 text-left transition-colors hover:bg-secondary/70"
            title="文档菜单：新建 / 打开 / 最近打开"
          >
            <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/70">
              <Waypoints class="size-4 text-primary" />
            </span>
            <span class="ml-0.5 text-[13px] font-semibold tracking-tight">OpenMind</span>
            <span
              class="max-w-[180px] truncate px-0.5 text-xs text-muted-foreground"
              :title="filePath || '尚未保存到磁盘'"
            >
              {{ title }}
            </span>
            <span
              class="mr-0.5 size-[7px] shrink-0 rounded-full"
              :class="dirty ? 'bg-amber-500' : 'bg-emerald-500'"
              :title="dirty ? '有未保存修改' : '已保存'"
            ></span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-64">
          <DropdownMenuItem @click="$emit('newDoc')">
            <FilePlus2 class="size-4" /> 新建
            <DropdownMenuShortcut>Ctrl+N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('openDoc')">
            <FolderOpen class="size-4" /> 打开…
            <DropdownMenuShortcut>Ctrl+O</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('openTemplates')">
            <LayoutTemplate class="size-4" /> 从模板新建…
          </DropdownMenuItem>
          <DropdownMenuItem v-if="filePath" @click="$emit('revealInFolder', filePath)">
            <FolderSymlink class="size-4" /> 打开所在文件夹
          </DropdownMenuItem>
          <template v-if="recentFiles.length > 0">
            <DropdownMenuSeparator />
            <DropdownMenuLabel class="text-[11px] text-muted-foreground">最近打开</DropdownMenuLabel>
            <DropdownMenuItem
              v-for="p in recentFiles"
              :key="p"
              class="group gap-2"
              :title="p"
              @click="$emit('openRecent', p)"
            >
              <File class="size-4 shrink-0 text-muted-foreground" />
              <span class="min-w-0 flex-1 truncate text-[13px]">{{ recentName(p) }}</span>
              <span
                class="shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                title="从列表移除"
                @click.stop="$emit('removeRecent', p)"
              >
                <X class="size-3.5" />
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem class="text-muted-foreground" @click="$emit('clearRecents')">
              <Eraser class="size-4" /> 清空最近记录
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
      <span class="h-5 w-px bg-border"></span>
      <TooltipWrapper label="导入 Markdown / OPML / XMind / TXT">
        <Button variant="ghost" size="icon" class="rounded-full" @click="$emit('importDoc')">
          <FileUp class="size-[17px]" />
        </Button>
      </TooltipWrapper>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="rounded-full"
            title="导出 PNG / SVG / PDF / Markdown…"
          >
            <Download class="size-[17px]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem @click="$emit('exportAs', 'png')">
            <Image class="size-4" /> PNG 图片
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('exportAs', 'svg')">
            <Shapes class="size-4" /> SVG 矢量图
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('exportAs', 'pdf')">
            <FileType class="size-4" /> PDF 文档
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="$emit('exportAs', 'md')">
            <FileText class="size-4" /> Markdown 大纲
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('exportAs', 'opml')">
            <ListTree class="size-4" /> OPML 大纲
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('exportAs', 'txt')">
            <FileType2 class="size-4" /> TXT 文本
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="$emit('exportAs', 'xmind')">
            <BrainCircuit class="size-4" /> XMind 文件
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('exportAs', 'freemind')">
            <FileCode2 class="size-4" /> FreeMind (.mm)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- 居中：版式 / 视图 -->
    <div class="flex shrink-0 items-center gap-2">
      <PillGroup>
        <LayoutPicker
          :model-value="curLayout"
          :variant="curVariant"
          :layouts="layouts"
          @update:model-value="$emit('setLayout', $event as string)"
          @update:variant="$emit('setVariant', $event)"
        />

        <ThemePicker
          :model-value="curTheme"
          :themes="themes"
          @update:model-value="$emit('setTheme', $event as string)"
        />

        <TooltipWrapper label="彩虹分支配色">
          <Button
            :variant="rainbowOn ? 'toggle' : 'ghost'"
            size="icon"
            class="rounded-full"
            @click="$emit('toggleRainbow')"
          >
            <Rainbow class="size-[17px]" />
          </Button>
        </TooltipWrapper>
      </PillGroup>

      <PillGroup>
        <TooltipWrapper label="大纲视图">
          <Button
            :variant="outlineOn ? 'toggle' : 'ghost'"
            size="sm"
            class="h-8 gap-1.5 rounded-full px-2.5"
            @click="$emit('toggleOutline')"
          >
            <PanelLeft class="size-[17px]" />
            <span class="text-xs">大纲</span>
          </Button>
        </TooltipWrapper>
        <TooltipWrapper label="演示模式（开发中）">
          <Button
            variant="ghost"
            size="sm"
            class="h-8 gap-1.5 rounded-full px-2.5"
            @click="$emit('toggleDemo')"
          >
            <Presentation class="size-[17px]" />
            <span class="text-xs">演示</span>
          </Button>
        </TooltipWrapper>
      </PillGroup>
    </div>

    <!-- 右对齐：文件（保存所在）+ 编辑（搜索所在） -->
    <div class="flex shrink-0 items-center gap-2">
      <PillGroup>
        <TooltipWrapper label="新建文档" shortcut="Ctrl+N">
          <Button variant="ghost" size="icon" class="rounded-full" @click="$emit('newDoc')">
            <FilePlus2 class="size-[17px]" />
          </Button>
        </TooltipWrapper>
        <TooltipWrapper label="打开" shortcut="Ctrl+O">
          <Button variant="ghost" size="icon" class="rounded-full" @click="$emit('openDoc')">
            <FolderOpen class="size-[17px]" />
          </Button>
        </TooltipWrapper>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="rounded-full"
              title="保存（Ctrl+S）"
            >
              <Save class="size-[17px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="$emit('saveDoc')">
              <Save class="size-4" /> 保存
              <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('saveAs')">
              <HardDriveDownload class="size-4" /> 另存为…
              <DropdownMenuShortcut>Ctrl+Shift+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PillGroup>

      <PillGroup>
        <TooltipWrapper label="撤销" shortcut="Ctrl+Z">
          <Button variant="ghost" size="icon" class="rounded-full" :disabled="!canUndo" @click="$emit('undo')">
            <Undo2 class="size-[17px]" />
          </Button>
        </TooltipWrapper>
        <TooltipWrapper label="重做" shortcut="Ctrl+Y">
          <Button variant="ghost" size="icon" class="rounded-full" :disabled="!canRedo" @click="$emit('redo')">
            <Redo2 class="size-[17px]" />
          </Button>
        </TooltipWrapper>
        <TooltipWrapper label="查找替换" shortcut="Ctrl+F">
          <Button
            :variant="searchOn ? 'toggle' : 'ghost'"
            size="icon"
            class="rounded-full"
            @click="$emit('toggleSearch')"
          >
            <Search class="size-[17px]" />
          </Button>
        </TooltipWrapper>
      </PillGroup>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  BrainCircuit, Download, Eraser, File, FileCode2, FilePlus2, FileText, FileType,
  FileType2, FileUp, FolderOpen, FolderSymlink, HardDriveDownload, Image, LayoutTemplate, ListTree,
  PanelLeft, Presentation, Rainbow, Redo2, Save, Search, Shapes, Undo2, Waypoints, X
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { PillGroup, TooltipWrapper } from './ToolbarBits'
import LayoutPicker from './pickers/LayoutPicker.vue'
import ThemePicker from './pickers/ThemePicker.vue'
import type { ThemeDef, ThemeVariant } from '@/lib/themes'

interface LayoutDef {
  value: string
  label: string
}

defineProps<{
  title: string
  filePath: string | null
  dirty: boolean
  canUndo: boolean
  canRedo: boolean
  curTheme: string
  curLayout: string
  curVariant: ThemeVariant
  themes: ThemeDef[]
  layouts: LayoutDef[]
  rainbowOn: boolean
  outlineOn: boolean
  searchOn: boolean
  demoOn: boolean
  recentFiles: string[]
}>()

defineEmits<{
  (e: 'newDoc'): void
  (e: 'openDoc'): void
  (e: 'saveDoc'): void
  (e: 'saveAs'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'setTheme', name: string): void
  (e: 'setLayout', value: string): void
  (e: 'setVariant', value: ThemeVariant): void
  (e: 'toggleRainbow'): void
  (e: 'toggleOutline'): void
  (e: 'toggleSearch'): void
  (e: 'toggleDemo'): void
  (e: 'importDoc'): void
  (e: 'exportAs', type: string): void
  (e: 'openRecent', path: string): void
  (e: 'removeRecent', path: string): void
  (e: 'clearRecents'): void
  (e: 'revealInFolder', path: string): void
  (e: 'openTemplates'): void
}>()

function recentName(p: string): string {
  const base = p.replace(/\\/g, '/').split('/').pop() || p
  return base.replace(/\.(omd|md|markdown|opml|xml|xmind|txt|mm)$/i, '')
}
</script>
