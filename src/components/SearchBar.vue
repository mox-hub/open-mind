<template>
  <div
    v-if="visible"
    class="absolute right-3 top-[60px] z-[640] flex items-center gap-1.5 rounded-full border border-border bg-card p-1.5 pl-3 shadow-lg"
  >
    <Search class="size-4 shrink-0 text-muted-foreground" />
    <input
      ref="inputRef"
      v-model="keyword"
      class="h-8 w-36 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
      placeholder="查找节点文字…"
      @keydown.enter.prevent="onEnter"
      @keydown.esc.prevent="$emit('close')"
    />
    <span class="min-w-11 shrink-0 text-center text-[11px] text-muted-foreground">{{ info }}</span>
    <span class="mx-0.5 h-5 w-px bg-border"></span>
    <input
      v-model="replaceText"
      class="h-8 w-28 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
      placeholder="替换为…"
      @keydown.enter.prevent="onReplace(false)"
    />
    <Button variant="ghost" size="sm" class="h-8 rounded-full px-3 text-xs" title="查找上一个（Shift+回车）" @click="onPrev">
      上一个
    </Button>
    <Button variant="ghost" size="sm" class="h-8 rounded-full px-3 text-xs" title="查找下一个（回车）" @click="onSearch">
      下一个
    </Button>
    <Button variant="ghost" size="sm" class="h-8 rounded-full px-3 text-xs" title="替换当前匹配项" @click="onReplace(false)">
      替换
    </Button>
    <Button variant="ghost" size="sm" class="h-8 rounded-full px-3 text-xs" title="替换全部匹配项" @click="onReplace(true)">
      全部替换
    </Button>
    <Button variant="ghost" size="icon" class="size-8 shrink-0 rounded-full" title="关闭 (Esc)" @click="$emit('close')">
      <X class="size-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { getInstance, onInstanceChange } from '../lib/editorInstance'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const inputRef = ref<HTMLInputElement | null>(null)
const keyword = ref('')
const replaceText = ref('')
const info = ref('')

let mm: any = null
let destroyed = false
let unsubInstance: (() => void) | null = null

// 编辑器实例可能被整体重建（打开/导入文档、性能模式切换），通过订阅重绑事件
function bindInstance(inst: any) {
  if (mm) mm.off('search_info_change', onInfo)
  mm = inst
  mm.on('search_info_change', onInfo)
}

function onInfo(d: any) {
  const total = d?.total ?? 0
  const cur = d?.currentIndex ?? -1
  info.value = total > 0 ? `${cur + 1} / ${total}` : keyword.value ? '无匹配' : ''
}

function onEnter(e: KeyboardEvent) {
  if (e.shiftKey) onPrev()
  else onSearch()
}

// 库的 search 同文本时自动跳下一个；这里用 jump(index) 实现循环回跳上一个
function onSearch() {
  if (!mm?.search || !keyword.value) return
  mm.search.search(keyword.value)
}

function onPrev() {
  const s = mm?.search
  if (!s || !keyword.value) return
  if (!s.isSearching) {
    s.search(keyword.value)
    return
  }
  const total = s.matchNodeList.length
  if (!total) return
  const idx = s.currentIndex <= 0 ? total - 1 : s.currentIndex - 1
  s.jump(idx)
}

function onReplace(all: boolean) {
  if (!mm?.search || !keyword.value) return
  if (all) {
    mm.search.replaceAll(replaceText.value)
  } else {
    mm.search.replace(replaceText.value, true)
  }
}

function endSearch() {
  try { mm?.search?.endSearch?.() } catch {}
  info.value = ''
}

watch(
  () => props.visible,
  v => {
    if (v) nextTick(() => inputRef.value?.focus())
    else endSearch()
  }
)

onMounted(() => {
  unsubInstance = onInstanceChange(bindInstance)
  const inst = getInstance()
  if (inst) bindInstance(inst)
  nextTick(() => inputRef.value?.focus())
})

onBeforeUnmount(() => {
  destroyed = true
  unsubInstance?.()
  endSearch()
  if (mm) mm.off('search_info_change', onInfo)
})
</script>
