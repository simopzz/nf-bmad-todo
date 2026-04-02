# Story 3.3: TaskInput Component

Status: done

## Story

As a user,
I want an always-visible input field to add new tasks with keyboard-native entry,
so that I can add tasks instantly without navigating to a different screen or clicking a submit button.

## Acceptance Criteria

1. Given the app is loaded, when the task list is empty, then `TodoInput.vue` is auto-focused so the user can immediately start typing.
2. When the user types a task title and presses Enter, the task is submitted via the `createTodo` prop and the input clears — retaining focus for the next entry.
3. When the user presses Escape, the input clears without submitting.
4. When the user clicks away (blur), the input clears without submitting.
5. The input is pinned below the app header and always visible above the task list.
6. The placeholder text is `"What needs doing? Press Enter to add…"`.
7. At rest the input has `surface-low` background; when focused it shifts to `surface-lowest` background with a 2px `secondary` left-edge indicator (not a full border wrap).
8. The component has `role="textbox"` and `aria-label="Add a task"`.
9. If the `createTodo` call fails (network/server error), the error is captured in a local `mutationError` ref and displayed inline below the input — the user's typed text is preserved so they can retry without retyping.
10. The component is covered by Vitest unit tests verifying: Enter submits and clears, Escape clears without submit, blur clears, auto-focus when empty, focus styling classes, mutation error display and text preservation.

**Out of scope:** Empty or whitespace-only input validation is explicitly deferred to Story 4.2. This story covers only non-empty input submission behaviour.

## Tasks / Subtasks

- [x] Task 1: Create `TodoInput.vue` component (AC: 1–9)
  - [x] Create file at `todo-frontend/src/components/todos/TodoInput.vue`
  - [x] Define props: `createTodo: (title: string) => Promise<void>`, `todosEmpty: boolean`
  - [x] Implement `<input>` element with `role="textbox"`, `aria-label="Add a task"`, placeholder `"What needs doing? Press Enter to add…"`
  - [x] Bind `v-model` to local `inputTitle` ref
  - [x] Implement `handleSubmit`: call `createTodo(inputTitle.value)`, clear input on success only, catch errors into local `mutationError` ref via `getErrorMessage()`
  - [x] Implement Enter keydown handler → call `handleSubmit()` (only if `inputTitle.value` is non-empty — but no validation message, just no-op)
  - [x] Implement Escape keydown handler → clear `inputTitle`, clear `mutationError`
  - [x] Implement blur handler → clear `inputTitle`, clear `mutationError`
  - [x] Auto-focus via `ref` + `watchEffect`: when `todosEmpty` is true, call `inputRef.value?.focus()`
  - [x] Retain focus after successful submit (re-focus input after clearing)
  - [x] Display `mutationError` inline below input when non-null (small text, `text-red-500` or similar)

- [x] Task 2: Implement focus-dependent styling (AC: 7)
  - [x] At rest: `bg-surface-low` background, no left border indicator
  - [x] On focus: `bg-surface-lowest` background + `border-l-2 border-secondary` left-edge indicator
  - [x] Use dynamic class binding (`:class`) toggled by a local `isFocused` ref set via `@focus`/`@blur` events
  - [x] Transition: `transition-colors duration-150` for smooth background shift

- [x] Task 3: Wire `TodoInput` into `App.vue` (AC: 5)
  - [x] Import `TodoInput` from `@/components/todos/TodoInput.vue`
  - [x] Place `<TodoInput>` below the header, above the placeholder/list zone
  - [x] Pass `:create-todo="todoModel.createTodo"` and `:todos-empty="todoModel.todos.value.length === 0"` as props
  - [x] Remove the placeholder `<div>` (hover demo box from Story 3.2)

- [x] Task 4: Write unit tests for `TodoInput.vue` (AC: 10)
  - [x] Create `todo-frontend/src/__tests__/TodoInput.spec.ts`
  - [x] Test: Enter key with non-empty input calls `createTodo` prop and clears input
  - [x] Test: Enter key with empty input does NOT call `createTodo`
  - [x] Test: Escape key clears input without calling `createTodo`
  - [x] Test: Blur clears input without calling `createTodo`
  - [x] Test: Auto-focus when `todosEmpty` prop is true
  - [x] Test: Focus applies `bg-surface-lowest` and `border-l-2` classes
  - [x] Test: On `createTodo` rejection, `mutationError` is displayed and input text is preserved
  - [x] Test: Input retains focus after successful submit
  - [x] Mock `createTodo` prop as `vi.fn()` — do NOT mock `api.ts` or `useTodos`

- [x] Task 5: Verify quality gates
  - [x] Run `npm --prefix todo-frontend run lint`
  - [x] Run `npm --prefix todo-frontend run type-check`
  - [x] Run `npm --prefix todo-frontend run test:unit -- --run`
  - [x] Run `npm --prefix todo-frontend run build`
  - [x] Run `make test-backend` (regression safety check)

### Review Findings

- [x] [Review][Patch] Missing submit in-flight guard allows duplicate todos on rapid Enter presses [todo-frontend/src/components/todos/TodoInput.vue:16]
- [x] [Review][Patch] Enter key handling misses IME composition guard and can submit partial text [todo-frontend/src/components/todos/TodoInput.vue:28]
- [x] [Review][Patch] Autofocus condition ignores loading state and may steal focus before initial fetch completes [todo-frontend/src/App.vue:24]
- [x] [Review][Patch] No unit test covers rapid Enter behavior while submit is pending [todo-frontend/src/__tests__/TodoInput.spec.ts]

## Dev Notes

### Epic Context and Business Goal

Epic 3 delivers the complete frontend happy-path loop (create, view, edit, complete, delete). Story 3.3 is the first visible UI component — it implements the task creation entry point that all users interact with first. The input must feel like writing in a notebook: single line, Enter to commit, immediate appearance in the list. This is the "Task entry" critical success moment from the UX spec.

### Current Codebase Baseline (Observed)

- `useTodos()` composable is wired in `App.vue` (Story 3.2) — exposes `todos`, `loading`, `error`, `fetchTodos`, `createTodo`, `updateTodo`, `deleteTodo`
- `createTodo` in the composable calls `apiCreateTodo({ title })` then `fetchTodos()` — mutation errors propagate (not caught by composable)
- `getErrorMessage()` is exported from `@/services/api` — used for local error handling
- `components/todos/` directory does NOT exist yet — this story creates it
- `App.vue` currently has a placeholder `<div>` with hover demo styling from Story 3.2
- Design tokens are configured in `tailwind.config.js`: `surface-low` (#F2F4F6), `surface-lowest` (#FFFFFF), `secondary` (#006C4A), `surface-highest` (#E2E8F0)
- Fonts loaded: Plus Jakarta Sans (display), Inter (body)
- `@` alias configured in `tsconfig.app.json`

### Architecture Guardrails (Must Follow)

**Component location:** `todo-frontend/src/components/todos/TodoInput.vue` — no other folder.

**Props contract (received from App.vue):**
```typescript
const props = defineProps<{
  createTodo: (title: string) => Promise<void>
  todosEmpty: boolean
}>()
```

**Local state pattern (from architecture doc):**
```typescript
import { ref, watchEffect } from 'vue'
import { getErrorMessage } from '@/services/api'

const inputTitle = ref('')
const mutationError = ref<string | null>(null)
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

async function handleSubmit() {
  if (!inputTitle.value.trim()) return  // no-op on empty — NOT a validation error (Story 4.2)
  mutationError.value = null
  try {
    await props.createTodo(inputTitle.value)
    inputTitle.value = ''               // clear only on success
    inputRef.value?.focus()             // retain focus for next entry
  } catch (e) {
    mutationError.value = getErrorMessage(e)
    // inputTitle.value preserved — user can retry without retyping
  }
}
```

**Critical rules:**
- `TodoInput` does NOT call `useTodos()` — it receives `createTodo` as a prop from `App.vue`
- `TodoInput` does NOT import from `@/composables/useTodos` — only from `@/services/api` (for `getErrorMessage`)
- Mutation errors are local to this component — never propagated to `useTodos().error`
- Empty/whitespace validation UI (error message, red border) is Story 4.2 — here just silently no-op on empty
- No `v-html` — use `{{ }}` interpolation for all user content
- Use `font-body` (Inter) for input text — not `font-display`

**Styling requirements (from UX-DR3 and UX-DR11):**
- Full-width input, no visible submit button
- Rest state: `bg-surface-low` background
- Focus state: `bg-surface-lowest` background + `border-l-2 border-secondary` left-edge indicator
- Transition: `transition-colors duration-150` for smooth background shift
- Input padding consistent with task rows for visual alignment
- Single line only — no textarea

**Accessibility (from UX-DR13):**
- `role="textbox"` on the input element
- `aria-label="Add a task"`
- Input is a native `<input type="text">` element

**Keyboard behaviour:**
- Enter → submit (if non-empty) → clear → retain focus
- Escape → clear input + clear error → no submit
- Blur → clear input + clear error → no submit

### Error Handling Architecture

```
createTodo() failure → error propagates from useTodos
  → TodoInput catches locally → mutationError ref set
  → displayed inline below input
  → inputTitle preserved for retry
```

This follows the architecture's error split: mutation errors handled by local refs in the calling component, NOT by `useTodos().error`.

### Implementation Constraints for This Story

- Do NOT implement empty/whitespace validation UI — that is Story 4.2 (just silently no-op)
- Do NOT implement `TodoList`, `TodoItem`, `TaskCheckbox`, `AppError`, `AppEmpty` — those are Stories 3.4–3.6
- Do NOT add loading skeleton — Story 4.1
- Do NOT introduce Pinia, Vue Router, or global state
- Keep `App.vue` as a structural shell — add `TodoInput` but leave placeholder slots for future components

### Testing Strategy

**`TodoInput.vue` tests (mount component with mock props):**
- Use `@vue/test-utils` `mount()` with `TodoInput`
- Pass `createTodo` as a `vi.fn()` mock prop
- Test keyboard events via `trigger('keydown', { key: 'Enter' })` etc.
- Test focus state class changes
- Test async error handling: make `createTodo` mock reject, verify error display and text preservation
- Test auto-focus: mount with `todosEmpty: true`, verify `document.activeElement`

**Test file location:** `todo-frontend/src/__tests__/TodoInput.spec.ts`

### Previous Story Intelligence (Story 3.2)

**Key learnings from Story 3.2:**
- `useTodos()` mutation functions (`createTodo`, `updateTodo`, `deleteTodo`) do NOT catch errors — they propagate to the calling component. This is by design.
- `App.vue` accesses reactive state via `.value` (e.g., `todoModel.todos.value.length`) — Ref objects on plain objects are not auto-unwrapped in templates
- Vitest environment is `jsdom` — component mounting works
- `@` alias works in tests via Vitest config
- Quality gates: lint, type-check, unit tests, build must all pass

**Git patterns established:**
- Commit message format: `feat: story X.Y <description>`
- Quality gates: `npm --prefix todo-frontend run lint`, `type-check`, `test:unit -- --run`, `build`, `make test-backend`

### File-Level Implementation Plan

- Create:
  - `todo-frontend/src/components/todos/TodoInput.vue` — the component
  - `todo-frontend/src/__tests__/TodoInput.spec.ts` — unit tests
- Modify:
  - `todo-frontend/src/App.vue` — import and wire `TodoInput`, remove placeholder div

### Out of Scope (Do Not Implement Here)

- `TaskCheckbox` component (Story 3.4)
- `TodoItem.vue` component (Story 3.5)
- `TodoList.vue` and app shell integration (Story 3.6)
- `AppError.vue`, `AppEmpty.vue` display components (Story 3.6 / Epic 4)
- Loading skeleton (Story 4.1)
- Form validation with error messages for empty/whitespace input (Story 4.2)
- Keyboard navigation and screen reader support beyond basic ARIA (Story 4.3)

### Project Structure Notes

After this story, the frontend `src/` directory should look like:
```
src/
  App.vue                    # useTodos() + TodoInput wired
  main.ts
  style.css
  types/
    todo.ts
  services/
    api.ts
  composables/
    useTodos.ts
  components/
    todos/
      TodoInput.vue          # NEW: task input component
  __tests__/
    designFoundation.spec.ts # existing from Story 3.1
    api.spec.ts              # existing from Story 3.2
    useTodos.spec.ts         # existing from Story 3.2
    TodoInput.spec.ts        # NEW: TodoInput unit tests
  assets/
    logo.svg
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.3-TaskInput-Component`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#useTodos-Composable-Contract` — TodoInput local mutation error pattern]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Structure-Patterns` — components/todos/ only]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#TaskInput` — component spec table]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#UX-DR3` — TaskInput interaction spec]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns` — Enter/Escape/blur rules]
- [Source: `_bmad-output/project-context.md#Framework-Specific-Rules` — useTodos() once in App.vue, mutation error handling]
- [Source: `_bmad-output/implementation-artifacts/3-2-api-service-layer-and-use-todos-composable.md` — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Type-check initially failed due to `vi.fn()` generic typing — fixed by explicitly typing the mock as `vi.fn<(title: string) => Promise<void>>()`

### Completion Notes List
- Created `TodoInput.vue` with full props contract, keyboard handlers (Enter/Escape), blur handler, auto-focus via watchEffect, and local mutation error handling
- Implemented focus-dependent styling with `isFocused` ref toggling between `bg-surface-low` (rest) and `bg-surface-lowest` + `border-l-2 border-secondary` (focus) with `transition-colors duration-150`
- Wired component into `App.vue` below header, removed placeholder div from Story 3.2
- Wrote 9 unit tests covering all ACs: submit/clear, empty no-op, Escape/blur clear, auto-focus, focus styling, error display with text preservation, focus retention, accessibility attributes
- All quality gates pass: lint (0 issues), type-check (clean), 29/29 unit tests, build successful, 13/13 backend regression tests

### File List
- `todo-frontend/src/components/todos/TodoInput.vue` (created)
- `todo-frontend/src/__tests__/TodoInput.spec.ts` (created)
- `todo-frontend/src/App.vue` (modified)

### Change Log
- 2026-04-02: Story 3.3 implementation complete — TodoInput component with keyboard-native entry, focus styling, error handling, accessibility attributes, and comprehensive unit test coverage
