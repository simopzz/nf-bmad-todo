import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import type { Todo } from '@/types/todo'

const sampleTodos: Todo[] = [
  { id: 1, title: 'First', completed: false, created_at: '2026-04-03T10:00:00Z' },
  { id: 2, title: 'Second', completed: true, created_at: '2026-04-03T09:00:00Z' },
]

const mockGetTodos = vi.fn<() => Promise<Todo[]>>()
const mockCreateTodo = vi.fn()
const mockUpdateTodo = vi.fn()
const mockDeleteTodo = vi.fn()

vi.mock('@/services/api', () => ({
  getTodos: (...args: unknown[]) => mockGetTodos(...(args as [])),
  createTodo: (...args: unknown[]) => mockCreateTodo(...args),
  updateTodo: (...args: unknown[]) => mockUpdateTodo(...args),
  deleteTodo: (...args: unknown[]) => mockDeleteTodo(...args),
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : 'error'),
}))

async function mountApp(todos: Todo[] = sampleTodos) {
  mockGetTodos.mockResolvedValue(todos)
  const wrapper = mount(App)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('App integration', () => {
  // --- Data plumbing: App → TodoList → TodoItem ---

  it('renders TodoList with todos from useTodos', async () => {
    const wrapper = await mountApp()
    const items = wrapper.findAll('[data-testid="todo-row"]')
    expect(items).toHaveLength(2)
  })

  it('preserves API order in rendered list', async () => {
    const wrapper = await mountApp()
    const titles = wrapper.findAll('[data-testid="todo-title"]').map((el) => el.text())
    expect(titles).toEqual(['First', 'Second'])
  })

  it('renders TodoInput above the list', async () => {
    const wrapper = await mountApp()
    expect(wrapper.find('input[aria-label="Add a task"]').exists()).toBe(true)
  })

  // --- Empty state variant selection ---

  it('shows AppEmpty with blank variant when no todos on first load', async () => {
    const wrapper = await mountApp([])
    expect(wrapper.text()).toContain('A clean slate')
  })

  it('shows AppEmpty with all-done variant when last completed todo is deleted', async () => {
    const completedOnly: Todo[] = [
      { id: 1, title: 'Done task', completed: true, created_at: '2026-04-03T10:00:00Z' },
    ]
    const wrapper = await mountApp(completedOnly)

    // After delete, the next fetch returns empty
    mockGetTodos.mockResolvedValue([])
    mockDeleteTodo.mockResolvedValue(undefined)

    const deleteBtn = wrapper.find('[data-testid="delete-btn"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('All done!')
  })

  it('shows blank variant when active (uncompleted) todo is deleted making list empty', async () => {
    const activeOnly: Todo[] = [
      { id: 1, title: 'Active task', completed: false, created_at: '2026-04-03T10:00:00Z' },
    ]
    const wrapper = await mountApp(activeOnly)

    mockGetTodos.mockResolvedValue([])
    mockDeleteTodo.mockResolvedValue(undefined)

    const deleteBtn = wrapper.find('[data-testid="delete-btn"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('A clean slate')
  })

  it('keeps blank variant when delete fails for last completed todo', async () => {
    const completedOnly: Todo[] = [
      { id: 1, title: 'Done task', completed: true, created_at: '2026-04-03T10:00:00Z' },
    ]
    const wrapper = await mountApp(completedOnly)

    mockDeleteTodo.mockRejectedValue(new Error('Cannot delete todo'))

    const deleteBtn = wrapper.find('[data-testid="delete-btn"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Done task')
    expect(wrapper.text()).not.toContain('All done!')
  })

  // --- Toggle complete wiring ---

  it('toggleComplete calls updateTodo and re-fetches', async () => {
    const wrapper = await mountApp()
    mockUpdateTodo.mockResolvedValue(undefined)
    mockGetTodos.mockResolvedValue(sampleTodos)

    const checkbox = wrapper.findAllComponents({ name: 'TaskCheckbox' })[0]!
    await checkbox.vm.$emit('toggle')
    await flushPromises()

    expect(mockUpdateTodo).toHaveBeenCalledWith(1, { completed: true })
    // Re-fetch called after update
    expect(mockGetTodos).toHaveBeenCalledTimes(2) // initial + after update
  })

  // --- No child useTodos usage ---

  it('does not render multiple useTodos instances', async () => {
    // Verify by checking getTodos is called exactly once on mount
    await mountApp()
    expect(mockGetTodos).toHaveBeenCalledTimes(1)
  })

  // --- Completed visual treatment in integration ---

  it('shows line-through on completed todo titles', async () => {
    const wrapper = await mountApp()
    const titles = wrapper.findAll('[data-testid="todo-title"]')
    // Second todo is completed
    expect(titles[1]!.classes()).toContain('line-through')
    expect(titles[1]!.classes()).toContain('text-on-tertiary-fixed-variant')
    // First todo is not completed
    expect(titles[0]!.classes()).not.toContain('line-through')
  })

  // --- Loading skeleton ---

  it('shows LoadingSkeleton during initial fetch when no todos exist', async () => {
    // Keep fetch pending so loading stays true
    mockGetTodos.mockReturnValue(new Promise(() => {}))
    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.findAll('[data-testid="skeleton-row"]').length).toBeGreaterThanOrEqual(3)
    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(false)
  })

  it('hides skeleton when todos are loaded', async () => {
    const wrapper = await mountApp()
    expect(wrapper.find('[data-testid="skeleton-row"]').exists()).toBe(false)
  })

  it('does not show skeleton during re-fetch when todos already exist', async () => {
    const wrapper = await mountApp()

    // Simulate re-fetch: getTodos returns a pending promise but todos already loaded
    mockGetTodos.mockReturnValue(new Promise(() => {}))
    mockUpdateTodo.mockResolvedValue(undefined)

    const checkbox = wrapper.findAllComponents({ name: 'TaskCheckbox' })[0]!
    await checkbox.vm.$emit('toggle')
    await flushPromises()

    // Skeleton should NOT appear — todos are already visible
    expect(wrapper.find('[data-testid="skeleton-row"]').exists()).toBe(false)
    // Existing list should remain visible
    expect(wrapper.findAll('[data-testid="todo-row"]').length).toBeGreaterThan(0)
  })

  // --- Error state ---

  it('shows AppError when initial fetch fails', async () => {
    mockGetTodos.mockRejectedValue(new Error('Network failure'))
    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain("Couldn't load your tasks")
  })

  it('shows AppError when initial fetch fails with an empty-string message', async () => {
    mockGetTodos.mockRejectedValue(new Error(''))
    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="todo-row"]').exists()).toBe(false)
  })

  it('has role="status" on load-error container', async () => {
    mockGetTodos.mockRejectedValue(new Error('Network failure'))
    const wrapper = mount(App)
    await flushPromises()

    const errorContainer = wrapper.find('[role="status"]')
    expect(errorContainer.exists()).toBe(true)
  })

  it('Retry button calls fetchTodos and recovers on success', async () => {
    // First fetch fails
    mockGetTodos.mockRejectedValueOnce(new Error('Network failure'))
    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(true)

    // Now backend recovers
    mockGetTodos.mockResolvedValue(sampleTodos)

    const retryBtn = wrapper.find('[data-testid="load-error"] button')
    await retryBtn.trigger('click')
    await flushPromises()

    // Error should be gone, list should render
    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="todo-row"]')).toHaveLength(2)
  })

  it('keeps existing todos visible when a post-mutation re-fetch fails', async () => {
    const wrapper = await mountApp()

    mockUpdateTodo.mockResolvedValue(undefined)
    mockGetTodos.mockRejectedValueOnce(new Error('Re-fetch failed'))

    const checkbox = wrapper.findAllComponents({ name: 'TaskCheckbox' })[0]!
    await checkbox.vm.$emit('toggle')
    await flushPromises()

    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="todo-row"]').length).toBeGreaterThan(0)
  })

  it('does not show error state for mutation failures', async () => {
    const wrapper = await mountApp()

    // Delete mutation fails
    mockDeleteTodo.mockRejectedValue(new Error('Delete failed'))

    const deleteBtn = wrapper.find('[data-testid="delete-btn"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    // Full-area error should NOT appear
    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(false)
    // Todos should remain visible
    expect(wrapper.findAll('[data-testid="todo-row"]').length).toBeGreaterThan(0)
  })

  it('keeps full-area AppError hidden when create mutation fails', async () => {
    const wrapper = await mountApp()
    mockCreateTodo.mockRejectedValue(new Error('Create failed'))

    const input = wrapper.find('input[aria-label="Add a task"]')
    await input.setValue('Create me')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="todo-row"]').length).toBeGreaterThan(0)
    expect(wrapper.find('[role="alert"]').text()).toContain('Create failed')
  })
})
