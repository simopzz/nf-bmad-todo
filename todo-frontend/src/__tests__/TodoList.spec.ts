import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import TodoList from '@/components/todos/TodoList.vue'
import type { Todo } from '@/types/todo'

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 1,
  title: 'Buy groceries',
  completed: false,
  created_at: '2026-04-03T10:00:00Z',
  ...overrides,
})

const sampleTodos: Todo[] = [
  makeTodo({ id: 1, title: 'First todo' }),
  makeTodo({ id: 2, title: 'Second todo' }),
  makeTodo({ id: 3, title: 'Third todo' }),
]

function mountList(
  overrides: Partial<{
    todos: Todo[]
    updateTodo: (id: number, patch: { title?: string; completed?: boolean }) => Promise<void>
    deleteTodo: (id: number) => Promise<void>
  }> = {},
) {
  return mount(TodoList, {
    props: {
      todos: overrides.todos ?? sampleTodos,
      updateTodo: overrides.updateTodo ?? vi.fn(),
      deleteTodo: overrides.deleteTodo ?? vi.fn(),
    },
  })
}

describe('components/todos/TodoList', () => {
  // --- List rendering ---

  it('renders a TodoItem for each todo in given order', () => {
    const wrapper = mountList()
    const items = wrapper.findAll('[data-testid="todo-row"]')
    expect(items).toHaveLength(3)
  })

  it('preserves API order without re-sorting', () => {
    const wrapper = mountList()
    const titles = wrapper.findAll('[data-testid="todo-title"]').map((el) => el.text())
    expect(titles).toEqual(['First todo', 'Second todo', 'Third todo'])
  })

  it('renders a semantic list structure with ul and li elements', () => {
    const wrapper = mountList()
    expect(wrapper.find('ul').exists()).toBe(true)
    const listItems = wrapper.findAll('li')
    expect(listItems).toHaveLength(3)
  })

  it('has aria-live="polite" on the list region', () => {
    const wrapper = mountList()
    const ul = wrapper.find('ul')
    expect(ul.attributes('aria-live')).toBe('polite')
  })

  // --- editingId management ---

  it('starts with no item in edit mode', () => {
    const wrapper = mountList()
    expect(wrapper.findAll('[data-testid="edit-input"]')).toHaveLength(0)
  })

  it('sets editingId when editStart is emitted from a TodoItem', async () => {
    const wrapper = mountList()
    const firstItem = wrapper.findAllComponents({ name: 'TodoItem' })[0]!
    await firstItem.vm.$emit('editStart', 1)
    await wrapper.vm.$nextTick()
    // The first item should now be in edit mode
    const editInputs = wrapper.findAll('[data-testid="edit-input"]')
    expect(editInputs).toHaveLength(1)
  })

  it('resets editingId when editEnd is emitted', async () => {
    const wrapper = mountList()
    const firstItem = wrapper.findAllComponents({ name: 'TodoItem' })[0]!
    await firstItem.vm.$emit('editStart', 1)
    await wrapper.vm.$nextTick()
    await firstItem.vm.$emit('editEnd')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[data-testid="edit-input"]')).toHaveLength(0)
  })

  it('only one item is in edit mode at a time', async () => {
    const wrapper = mountList()
    const items = wrapper.findAllComponents({ name: 'TodoItem' })
    await items[0]!.vm.$emit('editStart', 1)
    await wrapper.vm.$nextTick()
    await items[1]!.vm.$emit('editStart', 2)
    await wrapper.vm.$nextTick()
    const editInputs = wrapper.findAll('[data-testid="edit-input"]')
    expect(editInputs).toHaveLength(1)
  })

  // --- Event forwarding ---

  it('calls updateTodo when toggleComplete is emitted from a TodoItem', async () => {
    const updateTodo = vi.fn()
    const wrapper = mountList({ updateTodo })
    const firstItem = wrapper.findAllComponents({ name: 'TodoItem' })[0]!
    await firstItem.vm.$emit('toggleComplete', 1, true)
    expect(updateTodo).toHaveBeenCalledWith(1, { completed: true })
  })

  it('calls deleteTodo when delete is emitted from a TodoItem', async () => {
    const deleteTodo = vi.fn()
    const wrapper = mountList({ deleteTodo })
    const firstItem = wrapper.findAllComponents({ name: 'TodoItem' })[0]!
    await firstItem.vm.$emit('delete', 1)
    expect(deleteTodo).toHaveBeenCalledWith(1)
  })

  it('calls updateTodo with title patch when commitEdit callback is invoked from TodoItem', async () => {
    const updateTodo = vi.fn()
    const wrapper = mountList({ updateTodo })
    const firstItem = wrapper.findAllComponents({ name: 'TodoItem' })[0]!
    // Simulate entering edit mode and committing
    await firstItem.vm.$emit('editStart', 1)
    await wrapper.vm.$nextTick()
    // Invoke the onCommitEdit prop directly
    const commitEditProp = firstItem.props('onCommitEdit') as (id: number, title: string) => Promise<boolean>
    const committed = await commitEditProp(1, 'New title')
    expect(updateTodo).toHaveBeenCalledWith(1, { title: 'New title' })
    expect(committed).toBe(true)
  })

  it('shows mutation error when toggleComplete update fails', async () => {
    const updateTodo = vi.fn(async () => Promise.reject(new Error('Cannot update todo')))
    const wrapper = mountList({ updateTodo })
    const firstItem = wrapper.findAllComponents({ name: 'TodoItem' })[0]!
    await firstItem.vm.$emit('toggleComplete', 1, true)
    await flushPromises()
    const error = wrapper.find('[role="alert"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toContain('Cannot update todo')
  })

  it('shows mutation error when delete fails', async () => {
    const deleteTodo = vi.fn(async () => Promise.reject(new Error('Cannot delete todo')))
    const wrapper = mountList({ deleteTodo })
    const firstItem = wrapper.findAllComponents({ name: 'TodoItem' })[0]!
    await firstItem.vm.$emit('delete', 1)
    await flushPromises()
    const error = wrapper.find('[role="alert"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toContain('Cannot delete todo')
  })

  it('returns false from commitEdit callback when update fails', async () => {
    const updateTodo = vi.fn(async () => Promise.reject(new Error('Cannot update title')))
    const wrapper = mountList({ updateTodo })
    const firstItem = wrapper.findAllComponents({ name: 'TodoItem' })[0]!
    const commitEditProp = firstItem.props('onCommitEdit') as (id: number, title: string) => Promise<boolean>
    const committed = await commitEditProp(1, 'New title')
    expect(committed).toBe(false)
    const error = wrapper.find('[role="alert"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toContain('Cannot update title')
  })

  // --- Empty list ---

  it('renders no list items when todos is empty', () => {
    const wrapper = mountList({ todos: [] })
    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})
