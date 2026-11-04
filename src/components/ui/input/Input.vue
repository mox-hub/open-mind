<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: string | number
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
  <input
    data-slot="input"
    type="text"
    v-bind="delegated"
    :value="modelValue"
    :class="
      cn(
        'flex h-8 w-full rounded-md border border-input bg-card px-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 select-text',
        props.class
      )
    "
    @input="emits('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
