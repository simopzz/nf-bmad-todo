<script setup lang="ts">
import { ref, watchEffect } from 'vue'

import { getErrorMessage } from '@/services/api'

const props = defineProps<{
  createTodo: (title: string) => Promise<void>
  todosEmpty: boolean
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
</script>

<template>
  <div class="w-full">
    <input
      ref="inputRef"
      v-model="inputTitle"
      type="text"
      role="textbox"
      aria-label="Add a task"
      placeholder="What needs doing? Press Enter to add…"
      class="w-full rounded-lg px-4 py-3 font-body text-sm text-primary-container outline-none transition-colors duration-150"
      :class="
        isFocused
          ? 'border-l-2 border-secondary bg-surface-lowest'
          : 'bg-surface-low'
      "
      @keydown="handleKeydown"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <p
      v-if="mutationError"
      class="mt-1 px-4 text-sm text-red-500"
      role="alert"
    >
      {{ mutationError }}
    </p>
  </div>
</template>
