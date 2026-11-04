<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <!-- 按住 Ctrl 时浮现的快捷键速查卡：不拦截任何指针事件，画布仍可正常缩放/交互 -->
    <div
      v-if="visible"
      class="pointer-events-none absolute bottom-12 left-1/2 z-[630] w-[560px] -translate-x-1/2 rounded-xl border border-border/70 bg-card/92 p-4 shadow-xl backdrop-blur-md select-none"
    >
      <div class="mb-2.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Keyboard class="size-3.5" />
        快捷键速查 · 松开 Ctrl 关闭
      </div>
      <div class="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12.5px]">
        <div v-for="g in groups" :key="g.title" class="contents">
          <div v-for="k in g.items" :key="k[0]" class="flex items-center gap-2">
            <span
              class="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded border border-border bg-secondary/60 px-1 font-mono text-[10.5px] text-foreground/80"
            >
              {{ k[1] }}
            </span>
            <span class="text-foreground/85">{{ k[0] }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Keyboard } from 'lucide-vue-next'

defineProps<{ visible: boolean }>()

// [说明, 按键]
const groups = [
  {
    title: '编辑',
    items: [
      ['添加子节点', 'Tab'],
      ['添加同级节点', 'Enter'],
      ['插入父节点', 'Shift+Tab'],
      ['编辑节点文字', 'F2 / 双击'],
      ['删除节点', 'Del'],
      ['展开 / 收起', '/'],
      ['撤销 / 重做', 'Ctrl+Z / Y'],
      ['复制 / 剪切 / 粘贴', 'Ctrl+C/X/V']
    ] as [string, string][]
  },
  {
    title: '视图与文件',
    items: [
      ['全选节点', 'Ctrl+A'],
      ['缩放画布', 'Ctrl+滚轮'],
      ['根节点居中 / 适应', 'Ctrl+Enter'],
      ['插入概要', 'Ctrl+G'],
      ['新建 / 打开 / 保存', 'Ctrl+N/O/S'],
      ['另存为', 'Ctrl+Shift+S'],
      ['全屏', 'F11'],
      ['更多操作', '右键']
    ] as [string, string][]
  }
]
</script>
