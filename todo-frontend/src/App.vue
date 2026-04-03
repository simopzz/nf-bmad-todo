<script setup lang="ts">
import { computed, ref } from 'vue'

import AppEmpty from '@/components/todos/AppEmpty.vue'
import TodoInput from '@/components/todos/TodoInput.vue'
import TodoList from '@/components/todos/TodoList.vue'
import { useTodos } from '@/composables/useTodos'

const todoModel = useTodos()

const lastDeleteWasCompleted = ref(false)

const hasTodos = computed(() => todoModel.todos.value.length > 0)
const showEmpty = computed(() => !hasTodos.value && !todoModel.loading.value && !todoModel.error.value)
const emptyVariant = computed<'blank' | 'all-done'>(() =>
  lastDeleteWasCompleted.value ? 'all-done' : 'blank',
)

async function handleDeleteTodo(id: number) {
  const todo = todoModel.todos.value.find((t) => t.id === id)
  const allCompleted = todoModel.todos.value.every((t) => t.completed)
  const emptiedByCompletedDelete = todo?.completed === true && allCompleted
  await todoModel.deleteTodo(id)
  lastDeleteWasCompleted.value = emptiedByCompletedDelete
}
</script>

<template>
  <main class="min-h-screen bg-surface px-4 py-10 font-body text-primary-container sm:px-6">
    <section class="mx-auto flex max-w-[640px] flex-col gap-6 rounded-xl bg-surface-lowest p-6">
      <header class="space-y-2">
        <h1 class="font-display text-2xl font-semibold tracking-tight">Todo</h1>
        <p v-if="todoModel.loading.value" class="text-sm text-primary-container/70">Loading todos...</p>
        <p v-if="todoModel.error.value" class="text-sm text-primary-container/70">
          Failed to load todos: {{ todoModel.error.value }}
        </p>
      </header>

      <TodoInput
        :create-todo="todoModel.createTodo"
        :todos-empty="!todoModel.loading.value && todoModel.todos.value.length === 0"
      />

      <TodoList
        v-if="hasTodos"
        :todos="todoModel.todos.value"
        :update-todo="todoModel.updateTodo"
        :delete-todo="handleDeleteTodo"
      />

      <AppEmpty
        v-else-if="showEmpty"
        :variant="emptyVariant"
      />
    </section>
  </main>
</template>
