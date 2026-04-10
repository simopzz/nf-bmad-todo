<script setup lang="ts">
import { ref, watchEffect } from 'vue'

import { getErrorMessage } from '@/services/api'

const props = defineProps<{
  createTodo: (title: string) => Promise<void>
  todosEmpty: boolean
}>()
const emit = defineEmits<{
  focusFade: [active: boolean]
}>()

const inputTitle = ref('')
const mutationError = ref<string | null>(null)
const isFocused = ref(false)
const isSubmitting = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

async function handleSubmit() {
  if (isSubmitting.value || !inputTitle.value.trim()) return
  mutationError.value = null
  isSubmitting.value = true
  try {
    await props.createTodo(inputTitle.value)
    inputTitle.value = ''
    inputRef.value?.focus()
  } catch (e) {
    mutationError.value = getErrorMessage(e)
  } finally {
    isSubmitting.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    if (event.isComposing || event.keyCode === 229) return
    void handleSubmit()
  } else if (event.key === 'Escape') {
    inputTitle.value = ''
    mutationError.value = null
  }
}

function handleBlur() {
  isFocused.value = false
  emit('focusFade', false)
  inputTitle.value = ''
  mutationError.value = null
}

function handleFocus() {
  isFocused.value = true
}

watchEffect(() => {
  if (props.todosEmpty) {
    inputRef.value?.focus()
  }
})

watchEffect(() => {
  emit('focusFade', isFocused.value && inputTitle.value.trim().length > 0)
})
</script>

<template>
  <div class="w-full rounded bg-surface-lowest px-4 py-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-secondary focus-within:ring-offset-1 focus-within:ring-offset-surface">
    <input
      ref="inputRef"
      v-model="inputTitle"
      type="text"
      role="textbox"
      aria-label="Add a task"
      placeholder="What needs doing? Press Enter to add…"
      class="w-full bg-transparent px-0 py-1 font-body text-[1.5rem] font-medium text-on-surface outline-none transition-all duration-300 ease-out placeholder:text-on-surface-variant/40"
      :class="
        isFocused
          ? 'font-bold'
          : 'font-medium'
      "
      @keydown="handleKeydown"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <p
      v-if="mutationError"
      class="mt-2 text-sm text-red-300"
      role="alert"
    >
      {{ mutationError }}
    </p>
  </div>
</template>
