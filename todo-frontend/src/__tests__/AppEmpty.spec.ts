import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppEmpty from '@/components/todos/AppEmpty.vue'

function mountEmpty(variant: 'blank' | 'all-done' = 'blank') {
  return mount(AppEmpty, {
    props: { variant },
  })
}

describe('components/todos/AppEmpty', () => {
  // --- blank variant ---

  it('renders blank variant by default', () => {
    const wrapper = mountEmpty('blank')
    expect(wrapper.text()).toContain('A clean slate')
  })

  it('blank variant contains explanatory body copy', () => {
    const wrapper = mountEmpty('blank')
    expect(wrapper.find('[data-testid="empty-body"]').exists()).toBe(true)
  })

  it('blank variant has an icon', () => {
    const wrapper = mountEmpty('blank')
    expect(wrapper.find('[data-testid="empty-icon"]').exists()).toBe(true)
  })

  // --- all-done variant ---

  it('renders all-done variant with celebratory copy', () => {
    const wrapper = mountEmpty('all-done')
    expect(wrapper.text()).not.toContain('A clean slate')
    expect(wrapper.find('[data-testid="empty-body"]').exists()).toBe(true)
  })

  it('all-done variant has an icon', () => {
    const wrapper = mountEmpty('all-done')
    expect(wrapper.find('[data-testid="empty-icon"]').exists()).toBe(true)
  })

  // --- Typography tokens ---

  it('uses font-display for headline', () => {
    const wrapper = mountEmpty('blank')
    const headline = wrapper.find('[data-testid="empty-headline"]')
    expect(headline.classes()).toContain('font-display')
  })

  it('uses font-body for body copy', () => {
    const wrapper = mountEmpty('blank')
    const body = wrapper.find('[data-testid="empty-body"]')
    expect(body.classes()).toContain('font-body')
  })

  it('is centered', () => {
    const wrapper = mountEmpty('blank')
    expect(wrapper.find('[data-testid="empty-container"]').classes()).toContain('text-center')
  })
})
