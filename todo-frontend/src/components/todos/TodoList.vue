<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'

import TodoItem from '@/components/todos/TodoItem.vue'
import { getErrorMessage } from '@/services/api'
import type { Todo, TodoUpdate } from '@/types/todo'

const props = defineProps<{
  todos: Todo[]
  updateTodo: (id: number, patch: TodoUpdate) => Promise<void>
  deleteTodo: (id: number) => Promise<void>
  focusFadeActive?: boolean
}>()

const editingId = ref<number | null>(null)
const mutationError = ref<string | null>(null)
const failedRowIds = reactive(new Set<number>())
const failedRowFlashTimers = new Map<number, ReturnType<typeof setTimeout>>()

function flashFailedRow(id: number) {
  failedRowIds.add(id)

  const existingTimer = failedRowFlashTimers.get(id)
  if (existingTimer !== undefined) {
    clearTimeout(existingTimer)
  }

  const timer = setTimeout(() => {
    failedRowIds.delete(id)
    failedRowFlashTimers.delete(id)
  }, 1500)

  failedRowFlashTimers.set(id, timer)
}

function handleEditStart(id: number) {
  if (props.focusFadeActive) {
    return
  }
  editingId.value = id
}

function handleEditEnd() {
  editingId.value = null
}

async function handleToggleComplete(id: number, completed: boolean) {
  if (props.focusFadeActive) {
    return
  }
  mutationError.value = null
  try {
    await props.updateTodo(id, { completed })
  } catch (e) {
    mutationError.value = getErrorMessage(e)
    flashFailedRow(id)
  }
}

async function handleDelete(id: number) {
  if (props.focusFadeActive) {
    return
  }
  mutationError.value = null
  try {
    await props.deleteTodo(id)
  } catch (e) {
    mutationError.value = getErrorMessage(e)
    flashFailedRow(id)
  }
}

async function handleCommitEdit(id: number, title: string): Promise<boolean> {
  if (props.focusFadeActive) {
    return false
  }
  mutationError.value = null
  try {
    await props.updateTodo(id, { title })
    return true
  } catch (e) {
    mutationError.value = getErrorMessage(e)
    return false
  }
}

onBeforeUnmount(() => {
  failedRowFlashTimers.forEach((timer) => clearTimeout(timer))
  failedRowFlashTimers.clear()
})
</script>

<template>
  <div class="space-y-4">
    <ul
      aria-live="polite"
      class="space-y-10 transition-opacity duration-300 ease-out"
      :class="props.focusFadeActive ? 'opacity-20' : 'opacity-100'"
      :inert="props.focusFadeActive || undefined"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
    >
      <li v-for="todo in todos" :key="todo.id">
        <TodoItem
          :todo="todo"
          :is-editing="editingId === todo.id"
          :mutation-failed="failedRowIds.has(todo.id)"
          :on-commit-edit="handleCommitEdit"
          @edit-start="handleEditStart"
          @edit-end="handleEditEnd"
          @toggle-complete="handleToggleComplete"
          @delete="handleDelete"
        />
      </li>
    </ul>
    <p
      v-if="mutationError"
      role="alert"
      class="rounded bg-red-950/50 px-3 py-2 text-sm text-red-200"
    >
      {{ mutationError }}
    </p>
  </div>
</template>
