<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: string
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const delegatedProps = computed(() => {
  const { class: _, modelValue: __, ...delegated } = props
  return delegated
})
</script>

<template>
  <textarea
    data-slot="textarea"
    v-bind="delegated"
    :value="modelValue"
    :class="
      cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-card px-2.5 py-2 text-[13px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 resize-none select-text',
        props.class
      )
    "
    @input="emits('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
