import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TodoInput from '@/components/todos/TodoInput.vue'

describe('components/todos/TodoInput', () => {
  let createTodoMock: ReturnType<typeof vi.fn<(title: string) => Promise<void>>>

  beforeEach(() => {
    createTodoMock = vi.fn<(title: string) => Promise<void>>().mockResolvedValue(undefined)
  })

  function mountInput(props: { todosEmpty?: boolean } = {}) {
    return mount(TodoInput, {
      props: {
        createTodo: createTodoMock,
        todosEmpty: props.todosEmpty ?? false,
      },
      attachTo: document.body,
    })
  }

  it('calls createTodo and clears input on Enter with non-empty text', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('input')

    await input.setValue('Buy milk')
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(createTodoMock).toHaveBeenCalledWith('Buy milk')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('does NOT call createTodo on Enter with empty input', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('input')

    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(createTodoMock).not.toHaveBeenCalled()
  })

  it('clears input on Escape without calling createTodo', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('input')

    await input.setValue('Some text')
    await input.trigger('keydown', { key: 'Escape' })

    expect((input.element as HTMLInputElement).value).toBe('')
    expect(createTodoMock).not.toHaveBeenCalled()
  })

  it('clears input on blur without calling createTodo', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('input')

    await input.setValue('Some text')
    await input.trigger('blur')

    expect((input.element as HTMLInputElement).value).toBe('')
    expect(createTodoMock).not.toHaveBeenCalled()
  })

  it('auto-focuses when todosEmpty prop is true', async () => {
    const wrapper = mountInput({ todosEmpty: true })
    await nextTick()

    expect(document.activeElement).toBe(wrapper.find('input').element)
  })

  it('applies focus styling classes on focus', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('input')

    await input.trigger('focus')

    expect(input.classes()).toContain('bg-surface-lowest')
    expect(input.classes()).toContain('border-l-2')
  })

  it('applies rest styling classes when not focused', () => {
    const wrapper = mountInput()
    const input = wrapper.find('input')

    expect(input.classes()).toContain('bg-surface-low')
    expect(input.classes()).not.toContain('border-l-2')
  })

  it('displays mutation error and preserves input text on createTodo rejection', async () => {
    createTodoMock.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mountInput()
    const input = wrapper.find('input')

    await input.setValue('My task')
    await input.trigger('keydown', { key: 'Enter' })

    // Wait for the async handleSubmit to complete
    await vi.waitFor(() => {
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })

    expect(wrapper.find('[role="alert"]').text()).toBe('Network error')
    expect((input.element as HTMLInputElement).value).toBe('My task')
  })

  it('retains focus after successful submit', async () => {
    const wrapper = mountInput()
    const input = wrapper.find('input')

    await input.trigger('focus')
    await input.setValue('New task')
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(document.activeElement).toBe(input.element)
  })

  it('has correct accessibility attributes', () => {
    const wrapper = mountInput()
    const input = wrapper.find('input')

    expect(input.attributes('role')).toBe('textbox')
    expect(input.attributes('aria-label')).toBe('Add a task')
    expect(input.attributes('placeholder')).toBe('What needs doing? Press Enter to add…')
  })

  it('ignores Enter while a submit is already in progress', async () => {
    let resolveCreate: (() => void) | undefined
    createTodoMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve
        }),
    )

    const wrapper = mountInput()
    const input = wrapper.find('input')

    await input.setValue('Race task')
    await input.trigger('keydown', { key: 'Enter' })
    await input.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(createTodoMock).toHaveBeenCalledTimes(1)

    resolveCreate?.()
    await nextTick()
    await nextTick()

    expect((input.element as HTMLInputElement).value).toBe('')
  })
})
