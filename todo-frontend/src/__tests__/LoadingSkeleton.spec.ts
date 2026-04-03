import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import LoadingSkeleton from '@/components/todos/LoadingSkeleton.vue'

describe('LoadingSkeleton', () => {
  it('renders 3 or 4 shimmer placeholder rows', () => {
    const wrapper = mount(LoadingSkeleton)
    const rows = wrapper.findAll('[data-testid="skeleton-row"]')
    expect(rows.length).toBeGreaterThanOrEqual(3)
    expect(rows.length).toBeLessThanOrEqual(4)
  })

  it('each row has checkbox, title, and action-affordance zones', () => {
    const wrapper = mount(LoadingSkeleton)
    const rows = wrapper.findAll('[data-testid="skeleton-row"]')
    for (const row of rows) {
      expect(row.find('[data-testid="skeleton-checkbox"]').exists()).toBe(true)
      expect(row.find('[data-testid="skeleton-title"]').exists()).toBe(true)
      expect(row.find('[data-testid="skeleton-action"]').exists()).toBe(true)
    }
  })

  it('applies shimmer animation class to skeleton elements', () => {
    const wrapper = mount(LoadingSkeleton)
    const titles = wrapper.findAll('[data-testid="skeleton-title"]')
    expect(titles.length).toBeGreaterThan(0)
    for (const title of titles) {
      expect(title.classes()).toContain('animate-shimmer')
    }
  })

  it('is a presentational component with no props or emits', () => {
    const wrapper = mount(LoadingSkeleton)
    expect(wrapper.props()).toEqual({})
  })
})
