import { test, expect } from '@playwright/test'

// Belt-and-suspenders serial mode: primary enforcement is --workers=1 in `make test-e2e`;
// this guard also protects direct `npx playwright test` invocations from DB cross-test interference.
test.describe.configure({ mode: 'serial' })

// Shared cleanup — runs before every test
test.beforeEach(async ({ request }) => {
  const res = await request.get('/api/v1/todos')
  expect(res.ok()).toBeTruthy()
  const data = await res.json()
  expect(Array.isArray(data.items)).toBeTruthy()
  for (const todo of data.items) {
    // Best-effort delete — do not hard-assert; a 404 means it's already gone
    await request.delete(`/api/v1/todos/${todo.id}`)
  }
})

test.describe('Scenario 1 — Full CRUD lifecycle', () => {
  test('add, edit, complete, and delete a task', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Add
    await page.fill('[aria-label="Add a task"]', 'Buy milk')
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="todo-row"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="todo-title"]')).toHaveText('Buy milk')

    // Edit
    await page.click('[data-testid="todo-title"]')
    await page.fill('[data-testid="edit-input"]', 'Buy oat milk')
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="todo-title"]')).toHaveText('Buy oat milk')

    // Complete (input is sr-only inside a label — click the label to toggle)
    await page.click('[data-testid="todo-row"] label')
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCSS('text-decoration-line', 'line-through')

    // Delete
    await page.hover('[data-testid="todo-row"]')
    await page.click('[data-testid="delete-btn"]')
    await expect(page.locator('[data-testid="todo-row"]')).toHaveCount(0)
  })
})

test.describe('Scenario 2 — Empty state', () => {
  test('empty state renders when all tasks deleted', async ({ page }) => {
    // beforeEach already deletes all — just navigate
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const emptyState = page.locator('[data-testid="empty-container"]')
    await expect(emptyState).toBeVisible()
    await expect(emptyState).toContainText('A clean slate')
  })
})

test.describe('Scenario 3 — Persistence across reload', () => {
  test('task survives page reload', async ({ page, request }) => {
    await request.post('/api/v1/todos', { data: { title: 'Persist me' } })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="todo-title"]')).toHaveText('Persist me')

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="todo-title"]')).toHaveText('Persist me')
  })
})

test.describe('Scenario 4 — Error recovery', () => {
  test('error state shows, then retry loads tasks after route removed', async ({ page, request }) => {
    await request.post('/api/v1/todos', { data: { title: 'Recovery task' } })

    // Intercept GET /api/v1/todos to force a network error
    await page.route('**/api/v1/todos', (route) => route.abort())
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="load-error"]')).toBeVisible()

    // Remove intercept and retry
    await page.unroute('**/api/v1/todos')
    await page.click('[data-testid="load-error"] button')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="todo-title"]')).toHaveText('Recovery task')
  })
})

test.describe('Scenario 5 — Form validation', () => {
  test('empty submit adds no task', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const taskInput = page.locator('[aria-label="Add a task"]')
    await taskInput.fill('')
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="todo-row"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="empty-container"]')).toBeVisible()
    await expect(taskInput).toHaveValue('')
  })
})

test.describe('Scenario 6 — NFR1: page load <200ms', () => {
  test('task list or empty state visible within 200ms of navigation', async ({ page }) => {
    // Install an in-browser probe BEFORE navigation so the timing uses only
    // the page's performance clock and does not depend on document.body readiness.
    await page.addInitScript(() => {
      const selector =
        '[data-testid="todo-row"], [data-testid="empty-container"], [data-testid="load-error"]'
      ;(window as any).__visibleAt = new Promise<number>((resolve) => {
        const probe = () => {
          if (document.querySelector(selector)) {
            resolve(performance.now())
            return
          }
          requestAnimationFrame(probe)
        }
        probe()
      })
    })
    await page.goto('/')
    // __visibleAt resolved at the exact moment the element first appeared in the DOM
    const elapsed = await page.evaluate(() => (window as any).__visibleAt as Promise<number>)
    expect(elapsed).toBeLessThan(200)
  })
})

test.describe('Scenario 7 — NFR2: mutation operations <500ms', () => {
  test('create, toggle, and delete each complete within 500ms', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Create — time from form submit to list re-render (excludes fill/typing overhead)
    const createDone = page.waitForResponse(
      (r) => r.url().includes('/api/v1/todos') && r.request().method() === 'POST',
    )
    await page.fill('[aria-label="Add a task"]', 'Timing task')
    let t0 = Date.now()
    await page.keyboard.press('Enter')
    await createDone
    await expect(page.locator('[data-testid="todo-row"]')).toHaveCount(1)
    expect(Date.now() - t0).toBeLessThan(500)

    // Toggle complete (input is sr-only inside a label — click the label to toggle)
    t0 = Date.now()
    const toggleDone = page.waitForResponse(
      (r) => r.url().includes('/api/v1/todos') && r.request().method() === 'PATCH',
    )
    await page.click('[data-testid="todo-row"] label')
    await toggleDone
    await expect(page.locator('[data-testid="todo-title"]')).toHaveCSS('text-decoration-line', 'line-through')
    expect(Date.now() - t0).toBeLessThan(500)

    // Delete
    t0 = Date.now()
    const deleteDone = page.waitForResponse(
      (r) => r.url().includes('/api/v1/todos') && r.request().method() === 'DELETE',
    )
    await page.hover('[data-testid="todo-row"]')
    await page.click('[data-testid="delete-btn"]')
    await deleteDone
    await expect(page.locator('[data-testid="todo-row"]')).toHaveCount(0)
    expect(Date.now() - t0).toBeLessThan(500)
  })
})

test.describe('Scenario 8 — NFR4: 100-item list renders <100ms', () => {
  test('100-item list renders within 100ms of data receipt', async ({ page, request }) => {
    // Seed 100 todos in parallel — setup cost, not included in timing measurement
    // (beforeEach has already cleared the DB; seed here after cleanup)
    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        request.post('/api/v1/todos', { data: { title: `Task ${i + 1}` } }).then((res) => {
          expect(res.ok()).toBeTruthy()
        }),
      ),
    )

    // Instrument the browser to measure render time entirely in-browser:
    // 1. Patch fetch to record the moment the todos response arrives
    // 2. Immediately start a MutationObserver that resolves when the 100th row appears
    // Both timestamps are from the browser's performance clock — no Playwright polling overhead.
    await page.addInitScript(() => {
      const origFetch = window.fetch
      window.fetch = async (...args: Parameters<typeof fetch>) => {
        const res = await origFetch(...args)
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
        // Only instrument GET requests — POST/PATCH/DELETE must not overwrite the timing probe
        const method = (
          (args[1] as RequestInit | undefined)?.method?.toUpperCase() ??
          (args[0] instanceof Request ? (args[0] as Request).method.toUpperCase() : 'GET')
        )
        if (url.includes('/api/v1/todos') && res.ok && method === 'GET') {
          const responseAt = performance.now()
          ;(window as any).__todosResponseAt = responseAt
          // Watch for the 100th todo-row — resolve with exact render delta
          ;(window as any).__renderElapsed = new Promise<number>((resolve) => {
            const selector = '[data-testid="todo-row"]'
            if (document.querySelectorAll(selector).length >= 100) {
              resolve(performance.now() - responseAt)
              return
            }
            const observer = new MutationObserver(() => {
              if (document.querySelectorAll(selector).length >= 100) {
                observer.disconnect()
                resolve(performance.now() - responseAt)
              }
            })
            observer.observe(document.body, { childList: true, subtree: true })
          })
        }
        return res
      }
    })

    await page.goto('/')
    await expect(page.locator('[data-testid="todo-row"]')).toHaveCount(100)

    // __renderElapsed resolves at the exact browser timestamp when the 100th row first appeared
    const renderElapsed = await page.evaluate(() => (window as any).__renderElapsed as Promise<number>)
    expect(renderElapsed).toBeLessThan(100)

    const minFps = await page.evaluate(async () => {
      const scrollRoot =
        Array.from(document.querySelectorAll<HTMLElement>('*')).find((el) => {
          const style = window.getComputedStyle(el)
          const allowsScroll = /(auto|scroll)/.test(style.overflowY)
          return allowsScroll && el.scrollHeight > el.clientHeight + 1
        }) ??
        (document.scrollingElement as HTMLElement | null)

      if (!scrollRoot) {
        throw new Error('No scrollable container found for FPS measurement')
      }

      return await new Promise<number>((resolve) => {
        let observerWorst = 0
        let observer: PerformanceObserver | undefined

        const frameDurations: number[] = []
        let previous = performance.now()
        let step = 0

        const tick = () => {
          const now = performance.now()
          frameDurations.push(now - previous)
          previous = now

          // Start observer after first frame to exclude rendering-phase longtasks
          if (step === 0 && 'PerformanceObserver' in window) {
            observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                observerWorst = Math.max(observerWorst, entry.duration)
              }
            })
            observer.observe({ entryTypes: ['longtask'] })
          }

          scrollRoot.scrollTop =
            step % 2 === 0 ? scrollRoot.scrollHeight : 0
          step += 1

          if (step < 60) {
            requestAnimationFrame(tick)
            return
          }

          observer?.disconnect()
          const worstFrame = Math.max(
            ...frameDurations.slice(1),
            observerWorst,
          )
          const measuredMinFps = worstFrame > 0 ? 1000 / worstFrame : 60
          resolve(measuredMinFps)
        }

        requestAnimationFrame(tick)
      })
    })

    expect(minFps).toBeGreaterThanOrEqual(30)
  })
})
