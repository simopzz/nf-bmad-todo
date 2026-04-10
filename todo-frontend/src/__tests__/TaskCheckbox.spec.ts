import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TaskCheckbox from '@/components/todos/TaskCheckbox.vue'

describe('components/todos/TaskCheckbox', () => {
  function mountCheckbox(props: { completed?: boolean; disabled?: boolean } = {}) {
    return mount(TaskCheckbox, {
      props: {
        completed: props.completed ?? false,
        disabled: props.disabled ?? false,
      },
    })
  }

  it('renders a native <input type="checkbox">', () => {
    const wrapper = mountCheckbox()
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
  })

  it('emits toggle on change event', async () => {
    const wrapper = mountCheckbox()
    await wrapper.find('input[type="checkbox"]').trigger('change')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('emits toggle on Enter keydown', async () => {
    const wrapper = mountCheckbox()
    await wrapper.find('input[type="checkbox"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('input is checked when completed is true', () => {
    const wrapper = mountCheckbox({ completed: true })
    const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]')
    expect(input.element.checked).toBe(true)
  })

  it('input is not checked when completed is false', () => {
    const wrapper = mountCheckbox({ completed: false })
    const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]')
    expect(input.element.checked).toBe(false)
  })

  it('has filled state when completed', () => {
    const wrapper = mountCheckbox({ completed: true })
    const inner = wrapper.find('span')
    expect(inner.classes()).toContain('bg-primary')
    expect(inner.classes()).toContain('border-primary')
  })

  it('has unfilled state when not completed', () => {
    const wrapper = mountCheckbox({ completed: false })
    const inner = wrapper.find('span')
    expect(inner.classes()).toContain('border-outline-variant')
    expect(inner.classes()).toContain('bg-transparent')
  })

  it('has hover styling class on inner span', () => {
    const wrapper = mountCheckbox()
    const inner = wrapper.find('span')
    expect(inner.classes()).toContain('group-hover:border-secondary')
  })

  it('has 44x44px touch target via padding', () => {
    const wrapper = mountCheckbox()
    const label = wrapper.find('label')
    const inner = wrapper.find('span')
    expect(label.classes()).toContain('p-[13px]')
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

  it('applies transition classes for animation', () => {
    const wrapper = mountCheckbox()
    const inner = wrapper.find('span')
    const icon = wrapper.find('svg')

    expect(inner.classes()).toContain('transition-all')
    expect(inner.classes()).toContain('duration-200')
    expect(inner.classes()).toContain('ease-out')
    expect(icon.classes()).toContain('transition-all')
    expect(icon.classes()).toContain('duration-200')
    expect(icon.classes()).toContain('ease-out')
  })

  it('native input is visually hidden with sr-only', () => {
    const wrapper = mountCheckbox()
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.classes()).toContain('sr-only')
  })

  it('native input has an accessible name', () => {
    const wrapper = mountCheckbox()
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.attributes('aria-label')).toBe('Toggle task completion')
  })

  it('disables the native checkbox when disabled is true', () => {
    const wrapper = mountCheckbox({ disabled: true })
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('does not emit toggle when disabled', async () => {
    const wrapper = mountCheckbox({ disabled: true })
    const input = wrapper.find('input[type="checkbox"]')
    await input.trigger('change')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('toggle')).toBeUndefined()
  })
})
