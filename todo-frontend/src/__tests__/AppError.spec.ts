import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import AppError from '@/components/todos/AppError.vue'

describe('AppError', () => {
  it('renders load-error heading and supporting copy', () => {
    const wrapper = mount(AppError, {
      props: { onRetry: vi.fn() },
    })
    expect(wrapper.text()).toContain("Couldn't load your tasks")
  })

  it('renders a Retry button', () => {
    const wrapper = mount(AppError, {
      props: { onRetry: vi.fn() },
    })
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Retry')
  })

  it('calls onRetry when Retry button is clicked', async () => {
    const onRetry = vi.fn()
    const wrapper = mount(AppError, {
      props: { onRetry },
    })
    await wrapper.find('button').trigger('click')
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('prevents repeated retry clicks while a retry is in flight', async () => {
    let resolveRetry: (() => void) | undefined
    const onRetry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRetry = resolve
        }),
    )
    const wrapper = mount(AppError, {
      props: { onRetry },
    })

    const button = wrapper.find('button')
    await button.trigger('click')
    await button.trigger('click')

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(button.attributes('disabled')).toBeDefined()

    resolveRetry?.()
    await Promise.resolve()
  })

  it('has role="status" on the error container for screen reader announcement', () => {
    const wrapper = mount(AppError, {
      props: { onRetry: vi.fn() },
    })
    const container = wrapper.find('[role="status"]')
    expect(container.exists()).toBe(true)
  })

  it('retry button has accessible label', () => {
    const wrapper = mount(AppError, {
      props: { onRetry: vi.fn() },
    })
    const btn = wrapper.find('button')
    expect(btn.text()).toBe('Retry')
  })
})
