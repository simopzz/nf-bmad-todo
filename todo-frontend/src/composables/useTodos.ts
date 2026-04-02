import { ref, type Ref } from 'vue'

import { createTodo as apiCreateTodo, deleteTodo as apiDeleteTodo, getErrorMessage, getTodos, updateTodo as apiUpdateTodo } from '@/services/api'
import type { Todo, TodoUpdate } from '@/types/todo'

interface UseTodosResult {
  todos: Ref<Todo[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchTodos: () => Promise<void>
  createTodo: (title: string) => Promise<void>
  updateTodo: (id: number, patch: TodoUpdate) => Promise<void>
  deleteTodo: (id: number) => Promise<void>
}

export function useTodos(): UseTodosResult {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTodos = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      todos.value = await getTodos()
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  const createTodo = async (title: string): Promise<void> => {
    await apiCreateTodo({ title })
    await fetchTodos()
  }

  const updateTodo = async (id: number, patch: TodoUpdate): Promise<void> => {
    await apiUpdateTodo(id, patch)
    await fetchTodos()
  }

  const deleteTodo = async (id: number): Promise<void> => {
    await apiDeleteTodo(id)
    await fetchTodos()
  }

  void fetchTodos()

  return {
    todos,
    loading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
  }
}
