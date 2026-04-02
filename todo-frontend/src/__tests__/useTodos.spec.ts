import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTodos } from '@/composables/useTodos'
import * as api from '@/services/api'

vi.mock('@/services/api', () => ({
  getTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  getErrorMessage: vi.fn(() => 'mocked error'),
}))

const getTodosMock = vi.mocked(api.getTodos)
const createTodoMock = vi.mocked(api.createTodo)
const updateTodoMock = vi.mocked(api.updateTodo)
const deleteTodoMock = vi.mocked(api.deleteTodo)
const getErrorMessageMock = vi.mocked(api.getErrorMessage)

function mountUseTodos() {
  const exposed: { value: ReturnType<typeof useTodos> | null } = { value: null }
  const Harness = defineComponent({
    setup() {
      const state = useTodos()
      exposed.value = state
      return () => null
    },
  })
  mount(Harness)
  if (!exposed.value) {
    throw new Error('Failed to initialize useTodos harness')
  }
  return exposed.value
}

describe('composables/useTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchTodos populates todos on success', async () => {
    getTodosMock.mockResolvedValue([
      { id: 1, title: 'Task', completed: false, created_at: '2026-04-01T10:00:00Z' },
    ])

    const state = mountUseTodos()
    await nextTick()
    await state.fetchTodos()

    expect(state.todos.value).toEqual([
      { id: 1, title: 'Task', completed: false, created_at: '2026-04-01T10:00:00Z' },
    ])
    expect(state.error.value).toBeNull()
  })

  it('fetchTodos sets error on failure', async () => {
    getTodosMock.mockRejectedValue(new Error('boom'))
    getErrorMessageMock.mockReturnValue('Readable error')

    const state = mountUseTodos()
    await nextTick()
    await expect(state.fetchTodos()).resolves.toBeUndefined()

    expect(state.error.value).toBe('Readable error')
  })

  it('loading is true during fetchTodos and false after completion', async () => {
    let resolveFetch: ((value: Awaited<ReturnType<typeof api.getTodos>>) => void) | undefined
    getTodosMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )

    const state = mountUseTodos()
    await nextTick()
    const pending = state.fetchTodos()
    expect(state.loading.value).toBe(true)

    if (!resolveFetch) {
      throw new Error('Deferred fetch resolver was not captured')
    }
    resolveFetch([{ id: 1, title: 'Later', completed: false, created_at: '2026-04-01T12:00:00Z' }])
    await pending
    expect(state.loading.value).toBe(false)
  })

  it('createTodo triggers pessimistic re-fetch after success', async () => {
    getTodosMock.mockResolvedValue([])
    createTodoMock.mockResolvedValue({ id: 2, title: 'Created', completed: false, created_at: '2026-04-01T12:00:00Z' })

    const state = mountUseTodos()
    await nextTick()
    vi.clearAllMocks()
    getTodosMock.mockResolvedValueOnce([])

    await state.createTodo('Created')

    expect(createTodoMock).toHaveBeenCalledWith({ title: 'Created' })
    expect(getTodosMock).toHaveBeenCalledTimes(1)
  })

  it('mutation errors are propagated to caller', async () => {
    getTodosMock.mockResolvedValue([])
    const failure = new Error('mutation failed')
    createTodoMock.mockRejectedValue(failure)

    const state = mountUseTodos()
    await nextTick()
    vi.clearAllMocks()

    await expect(state.createTodo('x')).rejects.toThrow('mutation failed')
  })

  it('updateTodo and deleteTodo trigger re-fetch after success', async () => {
    getTodosMock.mockResolvedValue([])
    updateTodoMock.mockResolvedValue({ id: 1, title: 'Updated', completed: true, created_at: '2026-04-01T12:00:00Z' })
    deleteTodoMock.mockResolvedValue(undefined)

    const state = mountUseTodos()
    await nextTick()
    vi.clearAllMocks()
    getTodosMock.mockResolvedValue([])

    await state.updateTodo(1, { completed: true })
    await state.deleteTodo(1)

    expect(updateTodoMock).toHaveBeenCalledWith(1, { completed: true })
    expect(deleteTodoMock).toHaveBeenCalledWith(1)
    expect(getTodosMock).toHaveBeenCalledTimes(2)
  })
})
