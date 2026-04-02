<script setup lang="ts">
import { useTodos } from '@/composables/useTodos'
import TodoInput from '@/components/todos/TodoInput.vue'

const todoModel = useTodos()
</script>

<template>
  <main class="min-h-screen bg-surface px-4 py-10 font-body text-primary-container sm:px-6">
    <section class="mx-auto flex max-w-[640px] flex-col gap-6 rounded-xl bg-surface-lowest p-6">
      <header class="space-y-2">
        <h1 class="font-display text-2xl font-semibold tracking-tight">Todo</h1>
        <p class="text-sm text-primary-container/80" data-testid="todos-shell-status">
          Data layer ready: {{ todoModel.todos.value.length }} todos loaded.
        </p>
        <p v-if="todoModel.loading.value" class="text-sm text-primary-container/70">Loading todos...</p>
        <p v-if="todoModel.error.value" class="text-sm text-primary-container/70">
          Failed to load todos: {{ todoModel.error.value }}
        </p>
      </header>

      <TodoInput
        :create-todo="todoModel.createTodo"
        :todos-empty="!todoModel.loading.value && todoModel.todos.value.length === 0"
      />
    </section>
  </main>
</template>
