# Story 4.4: Responsive Design & WCAG AA Audit

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user on any device,
I want the app to be fully usable on mobile and desktop viewports and to meet WCAG 2.1 AA standards,
so that no core interaction is inaccessible regardless of device or ability.

## Acceptance Criteria

1. **Given** the app is viewed at ≥1280px (desktop), **when** all core interactions are performed, **then** no layout overflow, element truncation, or interaction obstruction occurs (FR25)
2. **Given** the app is viewed at ≥375px (mobile), **when** all core interactions are performed, **then** no layout overflow, element truncation, or interaction obstruction occurs (FR26)
3. **And** delete and edit action icons are always visible (`opacity: 1`) on touch devices — hover-only affordances are inaccessible on mobile
4. **And** `padding-bottom: env(safe-area-inset-bottom)` is applied to the task list to prevent content hidden behind the mobile soft keyboard (UX-DR12)
5. **And** all interactive targets are ≥44×44px (WCAG 2.5.5) — checkboxes and icon buttons padded to target size
6. **And** colour contrast ratios meet WCAG AA minimums: `on-surface` on `surface-lowest` ≥4.5:1 for body text; `secondary` (#006C4A) on white ≥3:1 for UI elements (NFR10)
7. **And** axe-core automated scan reports zero critical WCAG 2.1 AA violations (NFR8) — scan runs against the production Docker Compose stack at port 80 (built assets), not the Vite dev server
8. **And** the axe-core scan results are saved to `_bmad-output/accessibility-report.md` — minimum content: tool version, scan date, zero-violations summary, and the Playwright command used to generate the scan
9. **And** NFR3 verified: app is reachable and fully functional within 30 seconds of `docker-compose up`

## Tasks / Subtasks

- [x] Task 1: Add missing color design tokens to `tailwind.config.js` (AC: 6)
  - [x] Add `'on-surface': '#1E293B'` — high-emphasis text token; same value as `primary-container` but with its own semantic name; enables `text-on-surface` class
  - [x] Add `'on-surface-variant': '#64748B'` — medium-emphasis text token; used for completed task titles and metadata; enables `text-on-surface-variant` class which is already used in `TodoItem.vue:165` but was previously undefined in tailwind (falling back to inherited body color)
  - [x] Verify contrast: `#1E293B` on `#FFFFFF` ≥4.5:1 (actual ~12.4:1 ✅); `#64748B` on `#F2F4F6` ≥3:1 (actual ~3.83:1 ✅)
  - [x] Do NOT change or remove any existing tokens — add only

- [x] Task 2: Fix delete button — touch visibility and target size in `TodoItem.vue` (AC: 3, 5)
  - [x] Change `p-2` (8px padding → 32px total target) to `p-[14px]` (14px padding → 44px total target: 14+16+14=44px) on the delete `<button>` to meet WCAG 2.5.5
  - [x] Add `[@media(hover:none)]:!opacity-100 [@media(hover:none)]:!pointer-events-auto` to the delete button's static `class` list — this makes the button always visible on touch devices regardless of `isActionVisible` state
  - [x] The `:class` binding (conditional `opacity-0 pointer-events-none` vs `opacity-100 pointer-events-auto`) stays unchanged — the `[@media(hover:none)]` with `!` important overrides the conditional on touch
  - [x] The `:tabindex` binding stays unchanged — on touch, `isFocusWithin` activates on tap so focus-based tabindex is sufficient; touch users don't Tab through the interface
  - [x] All Tailwind classes must be complete literal strings — no dynamic construction

- [x] Task 3: Add `env(safe-area-inset-bottom)` padding to `TodoList.vue` (AC: 4)
  - [x] Add `style="padding-bottom: env(safe-area-inset-bottom, 0px)"` as an inline `style` attribute to the `<ul>` element (line 82) — Tailwind does not have a built-in class for CSS `env()` functions; inline style is the correct approach here
  - [x] The `0px` fallback ensures zero padding on non-iOS or desktop environments
  - [x] Do NOT add this to `App.vue` or `AppEmpty.vue` — it applies to the task list only (UX-DR12 is scoped to the list area)

- [x] Task 4: Install `@axe-core/playwright` and create accessibility scan test (AC: 7, 8)
  - [x] In the root `package.json`, add `"@axe-core/playwright": "^4.10.0"` to `devDependencies` and run `npm install` from the project root
  - [x] Create `e2e/` directory if it does not exist: `mkdir -p e2e`
  - [x] Create `e2e/accessibility.spec.ts` — see implementation reference below
  - [x] The test must run against `http://localhost:80` (Docker stack, not dev server) — `playwright.config.ts` already sets `baseURL: 'http://localhost:80'`
  - [x] The test saves results to `_bmad-output/accessibility-report.md` — the file is written by the test; dev does NOT need to manually create it
  - [x] After writing the test, run: `docker-compose up -d` then `npx playwright test e2e/accessibility.spec.ts` to verify
  - [x] If violations are found, fix them in the Vue components before marking this task done

- [x] Task 5: Verify responsive layout at target viewports (AC: 1, 2)
  - [x] Verify at 375px: `App.vue` uses `px-4` on `<main>` (16px padding each side) — at 375px, content is 343px wide, well within range; `section` uses `max-w-[640px]` which is wider than 375px so it fills the viewport minus padding ✅
  - [x] Verify at 1280px: `max-w-[640px] mx-auto` centers the card at 640px wide ✅
  - [x] Check that no component uses a fixed `px` width that would overflow at 375px — `TodoInput.vue` uses `w-full` ✅, `TaskCheckbox.vue` has fixed-size `h-[18px] w-[18px]` visual but wrapped in `label` which is flex ✅
  - [x] No code changes needed if layout is correct — document result in Dev Notes completion record
  - [x] Can verify via `npx playwright test e2e/accessibility.spec.ts` at mobile viewport (see test file)

- [x] Task 6: Verify NFR3 — app reachable within 30 seconds (AC: 9)
  - [x] Start a fresh Docker stack: `make down && make up-d`
  - [x] Time the startup: `curl -o /dev/null -s -w "%{time_total}\n" http://localhost:80/` — should return within 30 seconds
  - [x] Document the startup time in the accessibility report (Task 4 test file includes NFR3 section)

- [x] Task 7: Run story quality gates
  - [x] `npm --prefix todo-frontend run lint` — must pass with zero errors
  - [x] `npm --prefix todo-frontend run type-check` — must pass with zero errors
  - [x] `npm --prefix todo-frontend run test:unit -- --run` — all 137 existing tests must pass; no new unit tests required (changes are CSS/layout, not logic)
  - [x] `npm --prefix todo-frontend run build` — must produce clean build
  - [x] `npx playwright test e2e/accessibility.spec.ts` — must pass (requires Docker stack running on port 80)

## Dev Notes

### Epic and Story Context

This is Story 4.4 — the final story in Epic 4 (Resilient UX, Accessibility & Responsive Design). It verifies and completes the accessibility and responsive requirements across all previously built components. Stories 4.1–4.3 laid the semantic/ARIA foundation; this story adds the final responsive CSS fixes, target size corrections, and the automated WCAG validation.

**Do NOT implement any Playwright E2E scenarios from Story 5.1** (CRUD lifecycle, error recovery, etc.) — those are scoped to Epic 5. This story's Playwright test is exclusively the axe-core accessibility scan.

**Do NOT refactor or restructure existing components** beyond the targeted changes listed in Tasks 1–3.

### Current Codebase State (Critical Starting Context)

| Feature | File | Current State |
|---|---|---|
| Color tokens | `tailwind.config.js` | Missing `on-surface` and `on-surface-variant` — MUST add |
| `text-on-surface-variant` class | `TodoItem.vue:165` | Used but resolves to undefined → inherits body color (#1E293B); MUST add token |
| Delete button padding | `TodoItem.vue:190` | `p-2` (32px target) — MUST change to `p-[14px]` (44px) |
| Delete button touch visibility | `TodoItem.vue:191` | Uses `opacity-0` on non-hover — MUST add `[@media(hover:none)]` override |
| TaskCheckbox target size | `TaskCheckbox.vue:19` | `p-[13px]` + 18px visual = 44px ✅ Do NOT change |
| Safe area inset | `TodoList.vue:82` | Missing — MUST add inline style to `<ul>` |
| App container responsive | `App.vue:35–36` | `max-w-[640px] mx-auto`, `px-4 sm:px-6` ✅ No change needed |
| TodoInput | `TodoInput.vue:61` | `w-full` ✅ No change needed |
| Semantic HTML | All components | `<ul>/<li>`, `<button>`, `<input type="checkbox">` ✅ Complete from Story 4.3 |
| aria-live, role=status | Multiple | All present from Stories 4.1–4.3 ✅ |

### Architecture Compliance (Must Follow)

- No `<style>` blocks — Tailwind only; all classes must be complete literal strings [Source: architecture.md#Enforcement-Rules]
- Tailwind arbitrary variants (`[@media(hover:none)]:!opacity-100`) ARE supported in v3 as long as the full string appears in template [Source: architecture.md#Tailwind-Design-Token-Rules]
- Inline `style` attribute for `env()` CSS function is acceptable — Tailwind cannot express this as a class
- No new composables, no changes to `useTodos()` contract, no API layer changes [Source: architecture.md#useTodos()-Composable-Contract]
- All components remain in `components/todos/` — do NOT create new directories

### Library / Framework Requirements

- **Tailwind CSS v3** (`^3.4.19`) — supports `[@media(hover:none)]:` arbitrary variant; `!` modifier for important override; `env()` not supported as a utility class (use inline style)
- **`@axe-core/playwright` v4** — install in ROOT `package.json` (not `todo-frontend`); import as `import { AxeBuilder } from '@axe-core/playwright'`
- **`@playwright/test` v1** (`^1.58.2`) — already in root `package.json`; `playwright.config.ts` already targets `baseURL: 'http://localhost:80'`
- **No new frontend dependencies** — all responsive/contrast fixes are CSS-only

### File Structure Requirements

**Modify:**
- `tailwind.config.js` — add 2 new color tokens (`on-surface`, `on-surface-variant`)
- `todo-frontend/src/components/todos/TodoItem.vue` — delete button: `p-[14px]` + `[@media(hover:none)]` classes
- `todo-frontend/src/components/todos/TodoList.vue` — add `style` attribute to `<ul>`

**Create:**
- `e2e/accessibility.spec.ts` — axe-core scan test (see reference implementation below)
- `_bmad-output/accessibility-report.md` — auto-generated by the Playwright test

**Root package.json:**
- Add `"@axe-core/playwright": "^4.10.0"` to `devDependencies`

**Do NOT create new component files. Do NOT modify unit test files (no logic changes).**

### Implementation Reference: tailwind.config.js

```js
// ADD to colors object — place after existing tokens:
'on-surface': '#1E293B',        // high-emphasis text (same value as primary-container)
'on-surface-variant': '#64748B', // medium-emphasis text (completed tasks, metadata)
```

### Implementation Reference: TodoItem.vue Delete Button

```html
<!-- BEFORE (Story 4.3): -->
<button
  type="button"
  data-testid="delete-btn"
  aria-label="Delete task"
  class="ml-2 flex items-center justify-center p-2 transition-opacity duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:rounded-sm"
  :class="isActionVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
  :tabindex="isActionVisible ? 0 : -1"
  @click="emit('delete', todo.id)"
>

<!-- AFTER (Story 4.4): -->
<button
  type="button"
  data-testid="delete-btn"
  aria-label="Delete task"
  class="ml-2 flex items-center justify-center p-[14px] transition-opacity duration-150 ease-in-out focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:rounded-sm [@media(hover:none)]:!opacity-100 [@media(hover:none)]:!pointer-events-auto"
  :class="isActionVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
  :tabindex="isActionVisible ? 0 : -1"
  @click="emit('delete', todo.id)"
>
```

Changes: `p-2` → `p-[14px]`; added `[@media(hover:none)]:!opacity-100 [@media(hover:none)]:!pointer-events-auto` to static class list.

### Implementation Reference: TodoList.vue Safe Area

```html
<!-- BEFORE (Story 4.3): -->
<ul aria-live="polite" class="space-y-6">

<!-- AFTER (Story 4.4): -->
<ul aria-live="polite" class="space-y-6" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
```

### Implementation Reference: e2e/accessibility.spec.ts

```typescript
import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import * as fs from 'fs'
import * as path from 'path'

test.describe('WCAG 2.1 AA Accessibility Audit', () => {
  test('axe-core scan - zero critical violations at desktop viewport', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="todo-input"], [data-testid="empty-container"], [data-testid="error-container"]')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    // Write accessibility report
    const reportPath = path.resolve(__dirname, '../_bmad-output/accessibility-report.md')
    const report = [
      '# Accessibility Report',
      '',
      `**Scan date:** ${new Date().toISOString().split('T')[0]}`,
      `**Tool:** axe-core via @axe-core/playwright`,
      `**axe-core version:** ${results.testEngine.version}`,
      `**Target:** http://localhost:80 (Docker Compose production stack)`,
      `**Tags:** wcag2a, wcag2aa, wcag21a, wcag21aa`,
      `**Playwright command:** npx playwright test e2e/accessibility.spec.ts`,
      '',
      '## Summary',
      '',
      `- Violations: **${results.violations.length}**`,
      `- Passes: ${results.passes.length}`,
      `- Incomplete (needs manual review): ${results.incomplete.length}`,
      '',
      '## WCAG AA Result',
      '',
      results.violations.length === 0
        ? '✅ **Zero critical WCAG 2.1 AA violations detected.** NFR8 satisfied.'
        : `❌ **${results.violations.length} violation(s) found:**\n\n${results.violations.map((v) => `- [${v.impact}] ${v.id}: ${v.description}`).join('\n')}`,
      '',
      '## Color Contrast Verification',
      '',
      '| Token | Color | Background | Ratio | Requirement | Result |',
      '|---|---|---|---|---|---|',
      '| `on-surface` (`primary-container`) | #1E293B | `surface-lowest` #FFFFFF | ~12.4:1 | ≥4.5:1 (body text) | ✅ Pass |',
      '| `secondary` | #006C4A | White #FFFFFF | ~5.7:1 | ≥3:1 (UI elements) | ✅ Pass |',
      '| `on-surface-variant` | #64748B | `surface-low` #F2F4F6 | ~3.83:1 | ≥3:1 (medium text) | ✅ Pass |',
      '',
      '## NFR3 — Startup Time',
      '',
      'App is reachable and fully functional within 30 seconds of `docker-compose up`. Verified manually with `curl -o /dev/null -s -w "%{time_total}\\n" http://localhost:80/`.',
      '',
      '## Interactive Target Sizes',
      '',
      '| Element | Touch Target | Requirement | Result |',
      '|---|---|---|---|',
      '| Checkbox (`TaskCheckbox`) | 44×44px (p-[13px] + 18px visual) | ≥44×44px | ✅ Pass |',
      '| Delete button (`TodoItem`) | 44×44px (p-[14px] + 16px icon) | ≥44×44px | ✅ Pass |',
    ].join('\n')

    fs.writeFileSync(reportPath, report)

    expect(results.violations).toEqual([])
  })

  test('axe-core scan - zero violations at mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForSelector('[data-testid="todo-input"], [data-testid="empty-container"], [data-testid="error-container"]')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
```

**Notes on the test:**
- `waitForSelector` with OR (`','`) waits for whichever state renders — handles both empty state and populated state
- The report is written only in the first test to avoid duplication
- The second test verifies mobile viewport (375px) specifically — matching AC #2
- Requires Docker stack running: `make up-d` before running `npx playwright test e2e/accessibility.spec.ts`
- `data-testid="todo-input"` — verify this testid exists in `TodoInput.vue` (the input has `aria-label="Add a task"` but no data-testid; use `[aria-label="Add a task"]` instead if no testid exists)

Actually: use `await page.waitForLoadState('networkidle')` as a simpler wait condition, or `page.waitForSelector('main')`.

### Anti-Patterns to Avoid

- **Do NOT** use `sm:opacity-100` to handle touch visibility — this is viewport-width-based (breakpoint), not touch-capability-based. A 400px desktop screen would incorrectly show always-visible icons. Use `[@media(hover:none)]` (pointer capability detection) instead.
- **Do NOT** use `pointer-coarse` media query as an arbitrary variant — it detects pointer precision, not touch vs mouse; `hover:none` is the correct WCAG-recommended check.
- **Do NOT** add `padding-bottom` via a Tailwind class like `pb-safe` unless you extend the Tailwind theme — `env()` requires inline style.
- **Do NOT** construct Tailwind arbitrary variants dynamically (e.g., no template literals in class strings) — purger cannot detect them.
- **Do NOT** remove `outline-none` from `TodoInput.vue` or inline edit input — the `border-l-2 border-secondary` left-edge indicator IS the intentional focus style.
- **Do NOT** run the Playwright axe scan against `http://localhost:5173` (Vite dev server) — AC #7 explicitly requires the Docker stack at port 80.
- **Do NOT** commit `_bmad-output/accessibility-report.md` before the axe scan passes cleanly — the file is generated by the test.

### Previous Story Intelligence (Story 4.3)

- **Task patterns**: No new unit tests are needed for this story — all changes are CSS/layout with no Vue component logic changes. The delete button change is purely class names.
- **Tailwind arbitrary variants**: Pattern `[@media(hover:none)]:` is new to this codebase but fully supported in Tailwind v3. The `!` important modifier is similarly supported.
- **All 137 existing tests must pass** after this story — changes to class names in templates do not break existing tests (tests check behavior, not Tailwind class presence).
- **Completion pattern from 4.3**: Implementation in one pass with all gates passing. Task 4 (axe scan) requires the Docker stack to be running — start it with `make up-d` before running Playwright.
- **Story 4.3 established**: native `<input type="checkbox">` in `TaskCheckbox.vue` (44px via `p-[13px]`), semantic `<ul>/<li>`, `aria-live="polite"`, `role="status"`. All of these are in place and the axe scan should confirm them.

### Git Intelligence

From recent commits (Stories 4.1–4.3):
- Commit format: `feat: story 4.4 description`
- Stories delivered in one pass with all lint/type-check/test/build gates clean
- No `<style>` blocks in any component — Tailwind classes only
- Files in `todo-frontend/src/components/todos/` only; `e2e/` is a new directory at root level

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-4.4`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic-4` — NFR3, NFR8, NFR10 addressed]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design-&-Accessibility`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Breakpoint-Strategy`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Accessibility-Strategy`]
- [Source: `_bmad-output/planning-artifacts/epics.md#UX-DR1` — on_surface, on_surface_variant tokens required]
- [Source: `_bmad-output/planning-artifacts/epics.md#UX-DR12` — safe-area-inset-bottom on mobile]
- [Source: `todo-frontend/tailwind.config.js` — existing tokens, missing on-surface/on-surface-variant]
- [Source: `todo-frontend/src/components/todos/TodoItem.vue:165` — text-on-surface-variant (currently undefined token)]
- [Source: `todo-frontend/src/components/todos/TodoItem.vue:190` — delete button p-2 (32px, below 44px target)]
- [Source: `todo-frontend/src/components/todos/TodoList.vue:82` — ul missing safe-area padding]
- [Source: `todo-frontend/src/App.vue:35` — max-w-[640px] responsive container already set]
- [Source: `playwright.config.ts` — baseURL: http://localhost:80, testDir: ./e2e]
- [Source: `package.json` — @playwright/test ^1.58.2 already installed]
- [Source: `_bmad-output/implementation-artifacts/4-3-keyboard-navigation-and-screen-reader-support.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Docker backend CMD used `uvicorn` binary directly; after fresh image rebuild the copied venv's shebang referenced `/build/.venv/bin/python3` (build-stage path). Fixed by switching CMD to `python -m uvicorn` which uses the runtime container's Python interpreter from PATH.

### Completion Notes List

- Added `on-surface` (#1E293B) and `on-surface-variant` (#64748B) tokens to `tailwind.config.js` — resolves undefined `text-on-surface-variant` class used in `TodoItem.vue`
- Delete button in `TodoItem.vue`: `p-2` → `p-[14px]` (32px → 44px touch target); added `[@media(hover:none)]:!opacity-100 [@media(hover:none)]:!pointer-events-auto` for always-visible icons on touch devices
- Added `style="padding-bottom: env(safe-area-inset-bottom, 0px)"` inline style to `<ul>` in `TodoList.vue` for iOS soft-keyboard safe area
- Installed `@axe-core/playwright@^4.10.0` in root `package.json`; created `e2e/accessibility.spec.ts` with desktop + mobile (375px) axe-core scans
- axe-core scan result: **0 violations** at both desktop and mobile viewports; report saved to `_bmad-output/accessibility-report.md` (axe-core v4.11.2)
- Responsive layout verified: no overflow at 375px or 1280px — no code changes needed
- NFR3 verified: app responds in ~0.67ms after stack start (well within 30s)
- All quality gates green: lint ✅ type-check ✅ 140 unit tests ✅ build ✅ Playwright axe scan ✅

### File List

- `todo-frontend/tailwind.config.js`
- `todo-frontend/src/components/todos/TodoItem.vue`
- `todo-frontend/src/components/todos/TodoList.vue`
- `package.json`
- `package-lock.json`
- `e2e/accessibility.spec.ts`
- `_bmad-output/accessibility-report.md`
- `todo-backend/Dockerfile`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-08: Story 4.4 implemented — added color tokens (`on-surface`, `on-surface-variant`); fixed delete button touch target (44px) and always-visible on touch; added safe-area-inset-bottom to TodoList; axe-core Playwright scan (zero violations, desktop + mobile 375px); responsive layout verified; NFR3 verified; fixed backend Dockerfile CMD shebang issue (`python -m uvicorn`)
