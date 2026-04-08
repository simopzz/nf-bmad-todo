# Story 4.3: Keyboard Navigation & Screen Reader Support

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user who navigates by keyboard,
I want to operate every feature of the app without a mouse,
so that the application is fully accessible to keyboard and assistive technology users.

## Acceptance Criteria

1. Given I am navigating the app with Tab only, when I Tab through the interface, then focus moves in visual DOM order: add-input → task rows (checkbox → title span → delete icon) → next task row.
2. A visible focus ring using `secondary` color outline appears on every focused element — never hidden or removed.
3. Space or Enter activates the checkbox when it is focused.
4. Enter activates the delete button when it is focused (native button behaviour — verify it works).
5. `TodoItem.vue` is updated to add focus management: when inline edit mode is activated (`:is-editing` prop becomes `true`), focus moves automatically to the inline input via `nextTick(() => inputRef.value?.focus())` — focus is never lost or stranded (WCAG 2.4.3).
6. When Escape or blur exits inline edit mode, focus returns to the task row element via `nextTick(() => rowRef.value?.focus())` — not to `document.body` or an unrelated element.
7. The task list region has `aria-live="polite"` so additions and removals are announced by screen readers (ALREADY PRESENT — verify, do not re-implement).
8. The empty state (`AppEmpty.vue`) has `role="status"` so its content is announced without requiring focus. The error state (`AppError.vue`) already has `role="status"` — verify it.
9. Semantic HTML is used throughout: `<ul>/<li>` for the task list, `<button>` for icon actions, native `<input type="checkbox">` for the checkbox.

## Tasks / Subtasks

- [x] Task 1: Add focus management to `TodoItem.vue` (AC: 1, 5, 6)
  - [x] Import `nextTick` from `vue` (add to existing import)
  - [x] Add `const inputRef = ref<HTMLInputElement | null>(null)` — bind to edit input via `ref="inputRef"`
  - [x] Add `const rowRef = ref<HTMLElement | null>(null)` — bind to the row `<div>` via `ref="rowRef"`
  - [x] Add `tabindex="-1"` to the row `<div>` so it can receive programmatic focus (`rowRef.value?.focus()`) without entering Tab order
  - [x] Extend the existing `watch(() => props.isEditing, ...)` to also call `nextTick(() => inputRef.value?.focus())` when `editing` is `true` (the draft-reset logic stays)
  - [x] In `endEditMode()`, add `nextTick(() => rowRef.value?.focus())` AFTER `emit('editEnd')` — this restores focus to the row after exiting edit mode
  - [x] Remove both `// TODO: focus management -- Story 4.3` comments
  - [x] Make the title `<span>` keyboard-accessible: add `tabindex="0"` and `@keydown.enter.prevent="handleTitleClick"` — this allows keyboard users to Tab to the title and press Enter to activate inline edit

- [x] Task 2: Add visible focus rings to interactive elements (AC: 2)
  - [x] `TaskCheckbox` interactive element: add `focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:rounded-sm` to ensure visible `secondary` ring
  - [x] Delete button in `TodoItem.vue`: add `focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:rounded-sm` to the `<button>` class list
  - [x] Title `<span>` in `TodoItem.vue` (now `tabindex="0"`): add `focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:rounded-sm`
  - [x] `TodoInput.vue` input already uses `outline-none` + `border-l-2 border-secondary` as the focus indicator — DO NOT change; that design pattern is intentional (left-edge `secondary` indicator, per UX spec)
  - [x] Edit input in `TodoItem.vue` already uses `outline-none` + `border-l-2 border-secondary` — DO NOT change
  - [x] All Tailwind classes must be complete literal strings — do not construct dynamically

- [x] Task 3: Convert `TaskCheckbox.vue` to native `<input type="checkbox">` (AC: 3, 9)
  - [x] Replace `<button type="button" role="checkbox" :aria-checked="completed">` wrapper with `<label>` wrapper (inherits click/keyboard behaviour)
  - [x] Inside the `<label>`, add a hidden native `<input type="checkbox" :checked="completed" class="sr-only" @change="emit('toggle')">` — `sr-only` is Tailwind's visually-hidden-but-accessible class
  - [x] Keep the existing `<span>` visual checkbox element unchanged; move it inside the `<label>` after the hidden input
  - [x] Remove the `handleSpaceKeydown` function and its `@keydown.space.prevent` binding — native `<input type="checkbox">` handles Space activation and Enter is not applicable for native checkboxes (Enter on a focused checkbox does nothing by default; that is acceptable per WCAG)
  - [x] Add `focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:rounded-sm` to the hidden `<input>` so its focus ring shows through — OR apply the ring on the `<label>` by using `:focus-within` variant on the `<span>`: `peer peer-focus-visible:ring-2 peer-focus-visible:ring-secondary peer-focus-visible:ring-offset-1 peer-focus-visible:rounded-sm` on the `<span>` with `class="peer"` on the `<input>` (peer approach is cleaner)
  - [x] The `<label>` should have `class="group flex items-center justify-center p-[13px] cursor-pointer"` (same as current button's padding/flex)
  - [x] Remove the `emit` defineEmits update — the emit is still needed for the `@change` event
  - [x] Update `TaskCheckbox.spec.ts`: remove the test for `role="checkbox"` and `aria-checked` (native input handles these implicitly); update tests to target the native `<input>` element; add a test that `<input type="checkbox">` exists

- [x] Task 4: Add `role="status"` to `AppEmpty.vue` (AC: 8)
  - [x] Add `role="status"` to the container `<div data-testid="empty-container">` — it becomes `<div role="status" data-testid="empty-container" ...>`
  - [x] `AppError.vue` already has `role="status"` — verified, not modified

- [x] Task 5: Verify already-implemented AC items (AC: 7, 9 partially)
  - [x] Confirm `<ul aria-live="polite">` exists in `TodoList.vue` — it DOES; no code change
  - [x] Confirm `<ul>/<li>` structure in `TodoList.vue` — it DOES (v-for on `<li>`)
  - [x] Confirm `<button>` for delete action in `TodoItem.vue` — it DOES
  - [x] Confirm `AppError.vue` has `role="status"` — it DOES; not modified
  - [x] Confirm Enter activates the delete `<button>` natively in the browser — `<button type="button">` fires `click` on Enter by default; no code change needed

- [x] Task 6: Add/extend unit tests (AC: 1–9)
  - [x] `TodoItem.spec.ts` — focus auto-moves to edit input: mount with `attachTo: document.body`, set `isEditing` to `false` then `true` via `setProps`, await `nextTick`, assert `document.activeElement` is the edit input (`[data-testid="edit-input"]`)
  - [x] `TodoItem.spec.ts` — focus returns to row on Escape: mount with `attachTo: document.body`, activate editing, trigger Escape on edit input, await `nextTick`, assert `document.activeElement` is `[data-testid="todo-row"]`
  - [x] `TodoItem.spec.ts` — title span is keyboard-accessible: assert `[data-testid="todo-title"]` has `tabindex="0"`
  - [x] `TodoItem.spec.ts` — Enter on title span emits editStart: trigger `keydown` Enter event on `[data-testid="todo-title"]`, assert `editStart` is emitted
  - [x] `AppEmpty.spec.ts` — assert `[data-testid="empty-container"]` has `role="status"` attribute
  - [x] `TaskCheckbox.spec.ts` — updated: assert `<input type="checkbox">` exists; assert `checked` attribute reflects `completed` prop; assert `@change` triggers `toggle` emit
  - [x] Use `attachTo: document.body` for all focus-related tests; call `wrapper.unmount()` in cleanup to avoid DOM leaks
  - [x] All new tests follow the existing pattern: `describe`/`it`, `@vue/test-utils` `mount()`, `vi.fn()` for mocked props, `await flushPromises()` / `await nextTick()` after async state changes

- [x] Task 7: Run story quality gates
  - [x] `npm --prefix todo-frontend run lint` — passed
  - [x] `npm --prefix todo-frontend run type-check` — passed
  - [x] `npm --prefix todo-frontend run test:unit -- --run` — 137 tests, all passed
  - [x] `npm --prefix todo-frontend run build` — passed

### Review Findings

- [x] [Review][Patch] Implement Enter key activation for native checkbox to align with AC #3 [todo-frontend/src/components/todos/TaskCheckbox.vue:14]
- [x] [Review][Patch] Add an accessible name to the native checkbox input [todo-frontend/src/components/todos/TaskCheckbox.vue:14]
- [x] [Review][Patch] Ensure the programmatically focused todo row has a visible secondary focus indicator [todo-frontend/src/components/todos/TodoItem.vue:140]

## Dev Notes

### Epic Context and Boundaries

- This is Story 4.3 in Epic 4 (Resilient UX, Accessibility & Responsive Design). It builds on Stories 4.1 (skeleton/error state) and 4.2 (mutation error handling).
- Scope: keyboard focus management in `TodoItem.vue`, visible focus rings on interactive elements, native checkbox conversion in `TaskCheckbox.vue`, `role="status"` on `AppEmpty.vue`.
- Do NOT implement responsive design or WCAG AA audit (Story 4.4). Do NOT add Playwright E2E tests (Story 5.1).
- Do NOT change any existing error handling, mutation flash behavior, or `useTodos`/API layer — this story is frontend-only, component-level changes.

### Current Codebase State (Critical Starting Context)

**Already implemented — DO NOT re-implement:**

| Feature | Location | Status |
|---|---|---|
| `<ul aria-live="polite">` | `TodoList.vue:82` | ✅ Done |
| `<ul>/<li>` task list structure | `TodoList.vue:82–84` | ✅ Done |
| `role="status"` | `AppError.vue:23` | ✅ Done |
| `aria-label="Delete task"` | `TodoItem.vue:180` | ✅ Done |
| `aria-label="Edit task"` | `TodoItem.vue:171` | ✅ Done |
| `role="checkbox"` + `aria-checked` | `TaskCheckbox.vue:20–21` | ⚠️ Replaced by native input (Task 3) |
| Space key on TaskCheckbox | `TaskCheckbox.vue:10–13` | ⚠️ Removed when converting to native input |
| Delete button tabindex management | `TodoItem.vue:184` | ✅ Keep as-is |
| `isFocusWithin` row focus tracking | `TodoItem.vue:22, 111–127` | ✅ Keep — this already controls delete button visibility |

**What needs to be added in this story:**
- `inputRef` + `rowRef` template refs in `TodoItem.vue` with focus management in `watch` and `endEditMode`
- `tabindex="0"` + Enter handler on title `<span>` in `TodoItem.vue`
- Focus ring Tailwind classes on TaskCheckbox, delete button, title span
- Native `<input type="checkbox">` in `TaskCheckbox.vue` (replacing `<button role="checkbox">`)
- `role="status"` on `AppEmpty.vue` container div

### Architecture Compliance (Must Follow)

- `useTodos()` called once in `App.vue` only — no changes to composable contract [Source: architecture.md#useTodos()-Composable-Contract]
- All components in `components/todos/` only — no `ui/`, `shared/`, or `common/` folders [Source: architecture.md#Enforcement-Rules]
- Tailwind classes must be **complete literal strings** — no dynamic construction (e.g., no `` `ring-${color}` ``) [Source: architecture.md#Tailwind-Design-Token-Rules]
- No `v-html` for user content, no inline `fetch()` in components [Source: architecture.md#Enforcement-Rules]
- Single-file components with `<script setup lang="ts">` + `<template>` only — no `<style>` blocks (Tailwind only) [confirmed by git history]
- `nextTick` must be imported from `vue`, not from `@vue/test-utils`

### Library / Framework Requirements

- **Vue 3** (`^3.5.30`) — use `nextTick` from `vue`, `ref` for template refs, `watch` for reactive prop watching. No new composables needed.
- **Tailwind CSS** (`^3.4.19`) — use `focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1` for focus rings; `sr-only` for visually hidden native checkbox input; `peer` + `peer-focus-visible:*` for propagating focus styles from native input to visual span
- **Vitest** (`^4.0.18`) + `@vue/test-utils` — mount with `attachTo: document.body` for focus tests; always call `wrapper.unmount()` in cleanup
- No new dependencies — implement against pinned project dependencies

### File Structure Requirements

**Modify:**
- `todo-frontend/src/components/todos/TodoItem.vue` — add `inputRef`, `rowRef`, `nextTick` import; extend `watch`; update `endEditMode`; update title `<span>` with `tabindex` and Enter handler; add focus ring to delete button and title span
- `todo-frontend/src/components/todos/TaskCheckbox.vue` — convert `<button role="checkbox">` to `<label>` + native hidden `<input type="checkbox">` + styled `<span>`
- `todo-frontend/src/components/todos/AppEmpty.vue` — add `role="status"` to container div

**Modify tests:**
- `todo-frontend/src/__tests__/TodoItem.spec.ts` — add focus management tests (Task 6)
- `todo-frontend/src/__tests__/TaskCheckbox.spec.ts` — update for native input element
- `todo-frontend/src/__tests__/AppEmpty.spec.ts` — add `role="status"` assertion

**Do NOT create new component files. Do NOT move existing files.**

### Testing Requirements

- **Focus tests require `attachTo: document.body`** — jsdom does not move focus for elements not attached to the document. Always `wrapper.unmount()` after focus tests to avoid test pollution.
- **nextTick in tests** — use `await nextTick()` from `@vue/test-utils` after `setProps` calls that trigger reactive changes (not the `vue` one — `@vue/test-utils` re-exports it with Vitest integration)
- **TaskCheckbox native input tests**: target `wrapper.find('input[type="checkbox"]')` not `wrapper.find('button')`. The `completed` prop maps to the `:checked` binding. Trigger `change` event to test `toggle` emit.
- **Do NOT test** browser-native behaviours (e.g., that Enter fires click on a `<button>`) — these are browser responsibilities, not unit test responsibilities
- Follow existing test patterns: `describe`/`it`, `mount()`, `vi.fn()` for props, `await flushPromises()` for async

### Anti-Patterns to Avoid

- **Do NOT** add `tabindex="0"` to the row `<div>` — it must be `tabindex="-1"` (only programmatically focusable, not in Tab order). Adding `tabindex="0"` would pollute the Tab sequence with an extra stop.
- **Do NOT** use `document.getElementById()` or raw DOM queries in Vue components — always use template refs (`ref="..."`)
- **Do NOT** call `inputRef.value?.focus()` synchronously in `watch` — always wrap in `nextTick()` to ensure the DOM has rendered the element
- **Do NOT** move `rowRef.value?.focus()` inside `commitEdit()` — focus restoration happens in `endEditMode()` which is called from all exit paths (Enter, Escape, blur)
- **Do NOT** remove `outline-none` from the `TodoInput.vue` add-task input or the inline edit input — the left-edge `secondary` indicator IS the visual focus state for these inputs; removing `outline-none` would show a double indicator
- **Do NOT** use `focus()` without `nextTick()` in `endEditMode` — the DOM update (switching from edit input back to title span) must complete before focus can return to the row element
- **Do NOT** apply `tabindex` to the task `<li>` elements — they are semantic list items, not focusable controls
- **Do NOT** break the existing `isFocusWithin` logic for showing/hiding the delete button — focus management in this story works alongside it, not instead of it

### Previous Story Intelligence (Story 4.2)

- **Test patterns established**: `vi.useFakeTimers()` / `vi.advanceTimersByTime()` for timer tests; `mount()` with `attachTo: document.body` pattern is new to this story but consistent with test-utils docs
- **Component API contracts**: `TodoItem` emits `editStart`, `editEnd`, `toggleComplete`, `delete` — do NOT add new emits; focus management is internal to the component, not exposed via events
- **`isFocusWithin` + `isHovered` → `isActionVisible`**: this ref chain controls delete button visibility and tabindex. The `rowRef` added in this story does not replace or change this logic — they operate independently.
- **All 130+ existing tests must pass** after this story. `TaskCheckbox.spec.ts` will need targeted updates for the native input change, but other tests must remain green.
- **Completion pattern from 4.2**: the story was delivered with all lint/type-check/test/build gates passing in one pass. Aim for the same.

### Git Intelligence

From recent commits (Stories 3.4–4.2):
- All components use `<script setup lang="ts">` + `<template>` (no `<style>` blocks)
- Tests use `describe`/`it` blocks, `mount()` from `@vue/test-utils`, `vi.fn()` for prop callbacks
- Template refs follow pattern: `const nameRef = ref<HTMLElementType | null>(null)` with `ref="name"` in template
- Conventional commit format: `feat: story 4.3 description`

### Implementation Reference: TodoItem.vue Focus Management

The two TODO comments mark the exact insertion points:

```typescript
// BEFORE (Story 4.2):
import { computed, onBeforeUnmount, ref, watch } from 'vue'

function handleTitleClick() {
  // TODO: focus management -- Story 4.3
  emit('editStart', props.todo.id)
}

function endEditMode() {
  emit('editEnd')
  // TODO: focus management -- Story 4.3
}

watch(
  () => props.isEditing,
  (editing) => {
    if (editing) {
      editDraft.value = props.todo.title
    }
  },
)
```

```typescript
// AFTER (Story 4.3):
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)
const rowRef = ref<HTMLElement | null>(null)

function handleTitleClick() {
  emit('editStart', props.todo.id)
  // focus management happens in the watch below, after isEditing prop updates
}

function endEditMode() {
  emit('editEnd')
  nextTick(() => rowRef.value?.focus())
}

watch(
  () => props.isEditing,
  (editing) => {
    if (editing) {
      editDraft.value = props.todo.title
      nextTick(() => inputRef.value?.focus())
    }
  },
)
```

Template additions:
```html
<!-- Row div: add ref and tabindex="-1" -->
<div
  ref="rowRef"
  tabindex="-1"
  data-testid="todo-row"
  ...
>

<!-- Edit input: add ref -->
<input
  ref="inputRef"
  v-else
  ...
/>

<!-- Title span: add tabindex + Enter handler + focus ring -->
<span
  v-if="!isEditing"
  tabindex="0"
  data-testid="todo-title"
  class="flex-1 cursor-pointer py-3 font-body text-sm focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 focus-visible:rounded-sm"
  :class="todo.completed ? 'line-through text-on-surface-variant' : 'text-primary-container'"
  @click="handleTitleClick"
  @keydown.enter.prevent="handleTitleClick"
>
```

### Implementation Reference: TaskCheckbox.vue Native Input

```html
<!-- BEFORE (Story 3.4): -->
<button
  type="button"
  role="checkbox"
  :aria-checked="completed"
  class="group flex items-center justify-center p-[13px]"
  @click="emit('toggle')"
  @keydown.space.prevent="handleSpaceKeydown"
>
  <span class="...">[visual]</span>
</button>

<!-- AFTER (Story 4.3): -->
<label class="group flex items-center justify-center p-[13px] cursor-pointer">
  <input
    type="checkbox"
    :checked="completed"
    class="peer sr-only"
    @change="emit('toggle')"
  />
  <span
    class="peer-focus-visible:ring-2 peer-focus-visible:ring-secondary peer-focus-visible:ring-offset-1 peer-focus-visible:rounded-sm flex h-[18px] w-[18px] items-center justify-center rounded-md border-[1.5px] transition-all duration-150 ease-in-out group-hover:border-primary-container"
    :class="completed ? 'border-secondary bg-secondary' : 'border-outline-variant bg-transparent'"
  >
    [svg checkmark — unchanged]
  </span>
</label>
```

Script changes: remove `handleSpaceKeydown` function entirely. The `emit` defineEmits definition stays unchanged. If `completed` prop is currently used via `:aria-checked`, it now maps directly to `:checked` on the native input.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-4.3:-Keyboard-Navigation-&-Screen-Reader-Support`]
- [Source: `_bmad-output/planning-artifacts/epics.md#UX-DR11` — hover/focus interaction and focus ring with `secondary` color]
- [Source: `_bmad-output/planning-artifacts/epics.md#UX-DR13` — semantic HTML and `aria-live="polite"`; native `<input type="checkbox">` preferred]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Accessibility-Considerations`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#TaskRow` — keyboard spec: Tab between tasks, Space/Enter checkbox, Escape exits edit]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Rules`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Tailwind-Design-Token-Rules`]
- [Source: `todo-frontend/src/components/todos/TodoItem.vue` — TODO comments at `handleTitleClick()` and `endEditMode()`]
- [Source: `todo-frontend/src/components/todos/TaskCheckbox.vue`]
- [Source: `todo-frontend/src/components/todos/AppEmpty.vue`]
- [Source: `todo-frontend/src/components/todos/AppError.vue` — already has `role="status"`]
- [Source: `todo-frontend/src/components/todos/TodoList.vue` — already has `<ul aria-live="polite">`]
- [Source: `_bmad-output/implementation-artifacts/4-2-form-validation-and-mutation-error-handling.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `nextTick` is not exported from `@vue/test-utils` v2 in this project; used `import { nextTick } from 'vue'` instead for focus tests.

### Completion Notes List

- Implemented all 7 tasks in a single pass; all 137 tests pass, lint/type-check/build clean.
- `TodoItem.vue`: added `inputRef`/`rowRef` template refs, `nextTick` focus management in `watch` and `endEditMode`, `tabindex="-1"` on row div, `tabindex="0"` + Enter handler on title span, focus rings on delete button and title span.
- `TaskCheckbox.vue`: converted `<button role="checkbox">` to `<label>` + native `<input type="checkbox" class="peer sr-only">` + peer-focus-visible ring on visual `<span>`; removed `handleSpaceKeydown`.
- `AppEmpty.vue`: added `role="status"` to container div.
- Tests: 5 new focus/a11y tests in `TodoItem.spec.ts`, 1 new test in `AppEmpty.spec.ts`, `TaskCheckbox.spec.ts` fully updated for native input (removed `role="checkbox"` and `aria-checked` tests, added native input assertions).

### File List

- `_bmad-output/implementation-artifacts/4-3-keyboard-navigation-and-screen-reader-support.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `todo-frontend/src/components/todos/TodoItem.vue`
- `todo-frontend/src/components/todos/TaskCheckbox.vue`
- `todo-frontend/src/components/todos/AppEmpty.vue`
- `todo-frontend/src/__tests__/TodoItem.spec.ts`
- `todo-frontend/src/__tests__/TaskCheckbox.spec.ts`
- `todo-frontend/src/__tests__/AppEmpty.spec.ts`

## Change Log

- 2026-04-08: Story 4.3 created — keyboard navigation and screen reader support.
- 2026-04-08: Story 4.3 implemented — focus management, native checkbox, focus rings, role="status"; all quality gates passed.
