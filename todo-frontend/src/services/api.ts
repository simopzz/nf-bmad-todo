import type { Todo, TodoCreate, TodoListResponse, TodoUpdate } from '@/types/todo'

const BASE_URL = '/api/v1/todos'

interface ApiError extends Error {
  detail?: string
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const detail = typeof body === 'object' && body !== null && 'detail' in body
      ? String((body as { detail: unknown }).detail)
      : response.statusText
    const error: ApiError = new Error(detail)
    error.detail = detail
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getErrorMessage(e: unknown): string {
  if (typeof e === 'object' && e !== null && 'detail' in e) {
    return String((e as { detail: unknown }).detail)
  }
  if (e instanceof Error) {
    return e.message
  }
  return 'An unexpected error occurred'
}

export async function getTodos(): Promise<Todo[]> {
  const response = await request<TodoListResponse>(BASE_URL, {
    method: 'GET',
  })
  return response.items
}

export async function createTodo(data: TodoCreate): Promise<Todo> {
  return request<Todo>(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export async function updateTodo(id: number, data: TodoUpdate): Promise<Todo> {
  return request<Todo>(BASE_URL + '/' + String(id), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export async function deleteTodo(id: number): Promise<void> {
  await request<void>(BASE_URL + '/' + String(id), {
    method: 'DELETE',
  })
}
