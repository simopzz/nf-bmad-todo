import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TaskCheckbox from '@/components/todos/TaskCheckbox.vue'

describe('components/todos/TaskCheckbox', () => {
  function mountCheckbox(props: { completed?: boolean } = {}) {
    return mount(TaskCheckbox, {
      props: {
        completed: props.completed ?? false,
      },
    })
  }

  it('emits toggle on click', async () => {
    const wrapper = mountCheckbox()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('emits toggle on Space key', async () => {
    const wrapper = mountCheckbox()
    await wrapper.find('button').trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('does not emit repeatedly while Space key is held', async () => {
    const wrapper = mountCheckbox()
    const button = wrapper.find('button')

    await button.trigger('keydown', { key: ' ', repeat: false })
    await button.trigger('keydown', { key: ' ', repeat: true })

    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('has aria-checked="true" and filled state when completed', () => {
    const wrapper = mountCheckbox({ completed: true })
    const button = wrapper.find('button')
    const inner = wrapper.find('span')

    expect(button.attributes('aria-checked')).toBe('true')
    expect(inner.classes()).toContain('bg-secondary')
    expect(inner.classes()).toContain('border-secondary')
  })

  it('has aria-checked="false" and unfilled state when not completed', () => {
    const wrapper = mountCheckbox({ completed: false })
    const button = wrapper.find('button')
    const inner = wrapper.find('span')

    expect(button.attributes('aria-checked')).toBe('false')
    expect(inner.classes()).toContain('border-outline-variant')
    expect(inner.classes()).toContain('bg-transparent')
  })

  it('has hover styling class on inner span', () => {
    const wrapper = mountCheckbox()
    const inner = wrapper.find('span')

    expect(inner.classes()).toContain('group-hover:border-primary-container')
  })

  it('has 44x44px touch target via padding', () => {
    const wrapper = mountCheckbox()
    const button = wrapper.find('button')
    const inner = wrapper.find('span')

    expect(button.classes()).toContain('p-[13px]')
    expect(inner.classes()).toContain('h-[18px]')
    expect(inner.classes()).toContain('w-[18px]')
  })

  it('shows checkmark only when completed', () => {
    const checkedWrapper = mountCheckbox({ completed: true })
    const checkedIcon = checkedWrapper.find('svg')
    expect(checkedIcon.exists()).toBe(true)
    expect(checkedIcon.classes()).toContain('opacity-100')
    expect(checkedIcon.classes()).toContain('scale-100')

    const uncheckedWrapper = mountCheckbox({ completed: false })
    const uncheckedIcon = uncheckedWrapper.find('svg')
    expect(uncheckedIcon.exists()).toBe(true)
    expect(uncheckedIcon.classes()).toContain('opacity-0')
    expect(uncheckedIcon.classes()).toContain('scale-75')
  })

  it('has role="checkbox" on button', () => {
    const wrapper = mountCheckbox()
    expect(wrapper.find('button').attributes('role')).toBe('checkbox')
  })

  it('applies transition classes for animation', () => {
    const wrapper = mountCheckbox()
    const inner = wrapper.find('span')
    const icon = wrapper.find('svg')

    expect(inner.classes()).toContain('transition-all')
    expect(inner.classes()).toContain('duration-150')
    expect(inner.classes()).toContain('ease-in-out')
    expect(icon.classes()).toContain('transition-all')
    expect(icon.classes()).toContain('duration-150')
    expect(icon.classes()).toContain('ease-in-out')
  })
})
