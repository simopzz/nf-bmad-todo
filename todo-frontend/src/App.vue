<script setup lang="ts">
import { computed, ref } from 'vue'

import AppEmpty from '@/components/todos/AppEmpty.vue'
import AppError from '@/components/todos/AppError.vue'
import LoadingSkeleton from '@/components/todos/LoadingSkeleton.vue'
import TodoInput from '@/components/todos/TodoInput.vue'
import TodoList from '@/components/todos/TodoList.vue'
import { useTodos } from '@/composables/useTodos'

const todoModel = useTodos()

const lastDeleteWasCompleted = ref(false)
const focusFadeActive = ref(false)

const hasTodos = computed(() => todoModel.todos.value.length > 0)
const showSkeleton = computed(
  () => todoModel.loading.value && todoModel.todos.value.length === 0 && !todoModel.error.value,
)
const showError = computed(() => todoModel.todos.value.length === 0 && todoModel.error.value !== null)
const showEmpty = computed(() => !hasTodos.value && !todoModel.loading.value && !showError.value)
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
  <main class="min-h-screen bg-surface px-5 py-14 font-body text-on-surface sm:px-10 sm:py-16">
    <section class="relative mx-auto flex max-w-[640px] flex-col gap-10 sm:pr-12">
      <header class="relative">
        <h1 class="font-display text-5xl font-semibold tracking-tight text-on-surface sm:text-[3.5rem]">Todo</h1>
        <p class="mt-2 text-[0.875rem] uppercase tracking-[0.14em] text-on-surface-variant">The singular focus</p>
      </header>

      <TodoInput
        :create-todo="todoModel.createTodo"
        :todos-empty="!todoModel.loading.value && todoModel.todos.value.length === 0"
        @focus-fade="focusFadeActive = $event"
      />

      <LoadingSkeleton v-if="showSkeleton" />

      <AppError
        v-else-if="showError"
        :on-retry="todoModel.fetchTodos"
      />

      <TodoList
        v-else-if="hasTodos"
        :todos="todoModel.todos.value"
        :update-todo="todoModel.updateTodo"
        :delete-todo="handleDeleteTodo"
        :focus-fade-active="focusFadeActive"
      />

      <AppEmpty
        v-else-if="showEmpty"
        :variant="emptyVariant"
      />
    </section>
  </main>
</template>
