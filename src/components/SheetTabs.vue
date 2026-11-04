<template>
  <div
    v-if="sheets.length > 0"
    class="pointer-events-auto absolute bottom-8 left-1/2 z-[620] flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border bg-card p-1 shadow-sm"
  >
    <div
      v-for="s in sheets"
      :key="s.id"
      class="group/tab relative flex h-8 items-center rounded-full"
    >
      <input
        v-if="renamingId === s.id"
        ref="renameInputRef"
        v-model="renameText"
        class="h-8 w-24 rounded-full bg-secondary px-3 text-center text-xs text-foreground outline-none ring-1 ring-primary"
        @keydown.enter.prevent="commitRename(s.id)"
        @keydown.esc.prevent="renamingId = null"
        @blur="commitRename(s.id)"
        @vue:mounted="focusRename"
      />
      <button
        v-else
        class="flex h-8 items-center gap-1 rounded-full px-3 text-xs transition-colors"
        :class="s.id === activeId ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'"
        :title="s.name + '（双击重命名）'"
        @click="$emit('switch', s.id)"
        @dblclick="startRename(s)"
      >
        <span class="max-w-[110px] truncate">{{ s.name }}</span>
        <span
          v-if="sheets.length > 1"
          class="hidden rounded-full p-0.5 text-muted-foreground/60 transition-colors hover:bg-destructive/15 hover:text-destructive group-hover/tab:block"
          title="删除此画布"
          @click.stop="$emit('remove', s.id)"
        >
          <X class="size-3" />
        </span>
      </button>
    </div>
    <TooltipWrapper side="top" label="新建画布">
      <Button variant="ghost" size="icon" class="size-8 rounded-full" @click="$emit('add')">
        <Plus class="size-4" />
      </Button>
    </TooltipWrapper>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { TooltipWrapper } from './ToolbarBits'

export interface SheetTab {
  id: string
  name: string
}

defineProps<{
  sheets: SheetTab[]
  activeId: string
}>()

const emit = defineEmits<{
  (e: 'switch', id: string): void
  (e: 'add'): void
  (e: 'remove', id: string): void
  (e: 'rename', id: string, name: string): void
}>()

const renamingId = ref<string | null>(null)
const renameText = ref('')
const renameInputRef = ref<HTMLInputElement[] | null>(null)

function startRename(s: SheetTab) {
  renamingId.value = s.id
  renameText.value = s.name
}

function focusRename() {
  nextTick(() => {
    const el = renameInputRef.value
    const input = Array.isArray(el) ? el[0] : el
    input?.focus()
    input?.select()
  })
}

function commitRename(id: string) {
  if (renamingId.value !== id) return
  const name = renameText.value.trim()
  renamingId.value = null
  if (name) emit('rename', id, name)
}
</script>
