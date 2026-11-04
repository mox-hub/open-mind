<template>
  <Dialog :open="modal.visible" @update:open="onOpenChange">
    <DialogContent class="max-w-[420px]">
      <DialogHeader>
        <DialogTitle>{{ titles[modal.type] || '' }}</DialogTitle>
      </DialogHeader>

      <!-- 确认 -->
      <p v-if="modal.type === 'confirm'" class="select-text text-[13px] leading-relaxed">
        {{ modal.message }}
      </p>

      <!-- 备注 -->
      <div v-else-if="modal.type === 'note'" class="flex flex-col gap-2">
        <Textarea
          ref="noteAreaRef"
          v-model="modal.noteText"
          :rows="8"
          class="min-h-[140px]"
          placeholder="输入备注内容（支持多行）…"
          @keydown.enter.exact.prevent="close(true)"
        />
      </div>

      <!-- 超链接 -->
      <div v-else-if="modal.type === 'link'" class="flex flex-col gap-2.5">
        <label class="flex items-center gap-2 text-[13px]">
          <span class="w-9 shrink-0 text-xs text-muted-foreground">地址</span>
          <Input v-model="modal.linkUrl" placeholder="https://…" spellcheck="false" @keydown.enter="close(true)" />
        </label>
        <label class="flex items-center gap-2 text-[13px]">
          <span class="w-9 shrink-0 text-xs text-muted-foreground">说明</span>
          <Input v-model="modal.linkTitle" placeholder="可选" @keydown.enter="close(true)" />
        </label>
        <button
          v-if="modal.linkUrl"
          class="self-start text-xs text-primary underline-offset-2 hover:underline"
          @click="$emit('openExternal', modal.linkUrl)"
        >
          在浏览器中测试打开 ↗
        </button>
      </div>

      <!-- 标签 -->
      <div v-else-if="modal.type === 'tag'">
        <Input
          v-model="modal.tagsText"
          placeholder="输入标签，用逗号分隔，如：重点, 待确认"
          @keydown.enter="close(true)"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" @click="close(false)">
          {{ modal.type === 'confirm' ? '否' : '取消' }}
        </Button>
        <Button size="sm" @click="close(true)">
          {{ modal.type === 'confirm' ? '是' : '确定' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, type ComponentPublicInstance } from 'vue'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// modal 是 App.vue 持有的 reactive 对象，此处直接读写其字段（项目内部约定，避免逐字段透传）
const props = defineProps<{
  modal: {
    visible: boolean
    type: 'confirm' | 'note' | 'link' | 'tag'
    message: string
    noteText: string
    linkUrl: string
    linkTitle: string
    tagsText: string
  }
}>()

const emit = defineEmits<{
  (e: 'close', ok: boolean): void
  (e: 'openExternal', url: string): void
}>()

const titles: Record<string, string> = {
  confirm: '确认',
  note: '备注',
  link: '超链接',
  tag: '标签'
}

const noteAreaRef = ref<ComponentPublicInstance | null>(null)

// 打开后自动聚焦输入框
function focusEditor() {
  nextTick(() => {
    if (props.modal.type === 'note') {
      const el = noteAreaRef.value?.$el as HTMLTextAreaElement | undefined
      el?.focus()
    }
  })
}

function onOpenChange(open: boolean) {
  if (open) focusEditor()
  else if (props.modal.visible) close(false)
}

function close(ok: boolean) {
  emit('close', ok)
}
</script>
