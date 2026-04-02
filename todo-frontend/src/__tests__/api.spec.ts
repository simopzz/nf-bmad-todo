import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createTodo,
  deleteTodo,
  getErrorMessage,
  getTodos,
  updateTodo,
} from '@/services/api'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('services/api', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('getTodos unwraps the items envelope', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        items: [{ id: 1, title: 'Write tests', completed: false, created_at: '2026-04-01T10:00:00Z' }],
      }),
    )

    const todos = await getTodos()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/todos', expect.anything())
    expect(todos).toEqual([
      { id: 1, title: 'Write tests', completed: false, created_at: '2026-04-01T10:00:00Z' },
    ])
  })

  it('createTodo sends POST with expected payload', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 2, title: 'Ship feature', completed: false, created_at: '2026-04-01T11:00:00Z' }, 201),
    )

    await createTodo({ title: 'Ship feature' })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('/api/v1/todos')
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
    expect(init?.body).toBe(JSON.stringify({ title: 'Ship feature' }))
  })

  it('updateTodo sends PATCH with expected payload', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 3, title: 'Updated', completed: true, created_at: '2026-04-01T12:00:00Z' }),
    )

    await updateTodo(3, { completed: true })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('/api/v1/todos/3')
    expect(init?.method).toBe('PATCH')
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
    expect(init?.body).toBe(JSON.stringify({ completed: true }))
  })

  it('deleteTodo sends DELETE to expected URL', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await deleteTodo(4)

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('/api/v1/todos/4')
    expect(init?.method).toBe('DELETE')
  })

  it('throws on non-2xx responses for all CRUD functions', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'Cannot list todos' }, 500))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Cannot create todo' }, 400))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Cannot update todo' }, 404))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Cannot delete todo' }, 500))

    await expect(getTodos()).rejects.toHaveProperty('detail', 'Cannot list todos')
    await expect(createTodo({ title: 'x' })).rejects.toHaveProperty('detail', 'Cannot create todo')
    await expect(updateTodo(1, { title: 'x' })).rejects.toHaveProperty('detail', 'Cannot update todo')
    await expect(deleteTodo(1)).rejects.toHaveProperty('detail', 'Cannot delete todo')
  })

  it('getErrorMessage prioritizes detail, then Error.message, then default', () => {
    expect(getErrorMessage({ detail: 'Backend detail' })).toBe('Backend detail')
    expect(getErrorMessage(new Error('Network failure'))).toBe('Network failure')
    expect(getErrorMessage('unknown')).toBe('An unexpected error occurred')
  })
})
