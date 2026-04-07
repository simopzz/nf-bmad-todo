# Story 4.2: Form Validation & Mutation Error Handling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the app to validate my input and handle failed operations gracefully,
so that I never lose typed text due to a transient error and always know when something went wrong.

## Acceptance Criteria

1. Given the add-task input is focused, when I press Enter with an empty or whitespace-only input, then the form does not submit — the empty submission is a silent no-op (no error message, no API call).
2. Given I have typed a task title and the create API call fails, when the error is returned, then my typed text is preserved in the input field — I can retry without retyping (FR12 create case), and a subtle inline error indicator is shown near the input.
3. Given I am editing a task title inline and the update API call fails, when the error is returned, then the task title reverts to its original value — no data corruption (FR12 edit case), and a subtle `outline-variant` border flash appears on the affected row then fades.
4. When a create call fails due to backend HTTP 422 (whitespace title that passed client-side guard but failed Pydantic validation), the input text is preserved and the backend's `detail` message is shown inline — this is treated as a mutation error, not a validation no-op.
5. No toast, snackbar, or floating notification is used — all error feedback is spatial and contextual.

## Tasks / Subtasks

- [x] Task 1: Verify and lock empty/whitespace input guard in `TodoInput.vue` (AC: 1)
  - [x] Confirm `handleSubmit()` already short-circuits on `!inputTitle.value.trim()` — no API call, no error message
  - [x] Add a unit test in `TodoInput.spec.ts` that explicitly asserts: pressing Enter with empty/whitespace input does NOT call `createTodo` and does NOT show any error message
  - [x] Confirm `handleSubmit()` does NOT clear the input on empty submit (current behavior: early return preserves empty field)

- [x] Task 2: Verify create-failure error UX in `TodoInput.vue` (AC: 2, 4)
  - [x] Confirm `mutationError` ref is set via `getErrorMessage(e)` on catch — this already extracts `detail` from API errors (HTTP 422 included)
  - [x] Confirm `inputTitle.value` is NOT cleared on failure (current behavior: `inputTitle.value = ''` only runs inside `try` on success)
  - [x] Confirm inline error `<p role="alert">` is already rendered when `mutationError` is truthy
  - [x] Add a unit test for HTTP 422 scenario: mock `createTodo` to throw with `{ detail: "Title must not be blank" }`, assert the detail message appears inline and input text is preserved

- [x] Task 3: Add `outline-variant` border flash on update failure in `TodoItem.vue` (AC: 3)
  - [x] Add a `mutationFailed` ref (boolean) to `TodoItem.vue`
  - [x] In `commitEdit()`, when `onCommitEdit` returns `false` (mutation failed), set `mutationFailed = true`, revert `editDraft` to `props.todo.title`, exit edit mode, then clear `mutationFailed` after ~1500ms via `setTimeout`
  - [x] Add a conditional CSS class on the todo row `div`: when `mutationFailed` is true, apply `border border-outline-variant` with a CSS transition for fade-in/fade-out
  - [x] Use complete literal Tailwind classes — no dynamic string construction
  - [x] The border flash is purely visual feedback on the row — no text error message on the row itself (text mutation errors remain in `TodoList.vue`'s existing `<p>` below the list)

- [x] Task 4: Add `outline-variant` border flash on toggle/delete failure in `TodoList.vue` (AC: 3, 5)
  - [x] Add a `failedRowId` ref to `TodoList.vue` to track which row had a mutation error
  - [x] In `handleToggleComplete` and `handleDelete` catch blocks, set `failedRowId.value = id` and clear it after ~1500ms
  - [x] Pass `failedRowId` to `TodoItem` as a prop (e.g., `:mutation-failed="failedRowId === todo.id"`) so the row can display the border flash
  - [x] This replaces the per-item `mutationFailed` ref from Task 3 — the `TodoItem.vue` receives `mutationFailed` as a **prop** from `TodoList.vue` for toggle/delete failures
  - [x] For edit failures, `TodoItem.vue` sets `mutationFailed` locally (from Task 3's `commitEdit` path), since edit success/fail is known inside `TodoItem`
  - [x] Keep the existing `mutationError` text message `<p>` in `TodoList.vue` below the list — the border flash is an additional per-row visual cue

- [x] Task 5: Add/extend unit tests (AC: 1-5)
  - [x] `TodoInput.spec.ts`: test empty submit is a no-op (no `createTodo` call, no error shown)
  - [x] `TodoInput.spec.ts`: test HTTP 422 error shows backend `detail` message inline, input preserved
  - [x] `TodoItem.spec.ts`: test that when `onCommitEdit` returns `false`, title reverts and `border-outline-variant` class appears temporarily
  - [x] `TodoList.spec.ts`: test that toggle failure triggers border flash on the affected row
  - [x] `TodoList.spec.ts`: test that delete failure triggers border flash on the affected row
  - [x] `App.spec.ts`: ensure no full-area `AppError` is shown on mutation failure (mutation errors stay local)

- [x] Task 6: Run story quality gates
  - [x] `npm --prefix todo-frontend run lint`
  - [x] `npm --prefix todo-frontend run type-check`
  - [x] `npm --prefix todo-frontend run test:unit -- --run`
  - [x] `npm --prefix todo-frontend run build`

## Dev Notes

### Epic Context and Boundaries

- This is Story 4.2 in Epic 4 (Resilient UX, Accessibility & Responsive Design). It builds on Story 4.1 which established first-load skeleton and full-area fetch error. This story handles the other error surface: **mutation errors** (create/update/delete failures).
- Scope is constrained to form validation (empty input guard) and mutation error handling (inline errors + row border flash). Do NOT implement keyboard navigation (Story 4.3) or responsive/accessibility audit (Story 4.4).
- The UX design spec is explicit: "No toasts. No snackbars. No floating notifications." All error feedback must be spatial and contextual.

### Current Codebase State (Critical Starting Context)

**Already implemented (DO NOT re-implement):**
- `TodoInput.vue` already has empty/whitespace guard (`!inputTitle.value.trim()` early return in `handleSubmit`), `mutationError` ref with `getErrorMessage(e)`, and inline `<p role="alert">` error display. Text is already preserved on failure.
- `TodoList.vue` already has `mutationError` ref for toggle/delete/edit errors, with a `<p role="alert">` below the list.
- `TodoItem.vue` already handles edit commit via `onCommitEdit` prop returning `boolean`, and reverts `editDraft` on empty/unchanged title.
- `api.ts` already has `getErrorMessage()` that extracts `detail` from API error responses (handles HTTP 422 `detail` field).
- `useTodos.ts` mutation methods (`createTodo`, `updateTodo`, `deleteTodo`) throw on failure — they do NOT set `error.value` (that's for `fetchTodos` only).
- `App.vue`'s `showError` only triggers when `todos.length === 0 && error !== null` — mutation errors never trigger full-area `AppError`.

**What needs to be added:**
- The `outline-variant` border flash on affected rows when update/toggle/delete mutations fail. This is the main new UI behavior.
- Unit tests for empty input guard, HTTP 422 inline error, and border flash behavior.

### Architecture Compliance (Must Follow)

- `useTodos()` called once in `App.vue` only — never in child components. [Source: architecture.md#useTodos()-Composable-Contract]
- Mutation errors handled by local refs in calling components, displayed inline — never routed to `useTodos().error` or `AppError`. [Source: architecture.md#Error-handling-split]
- Keep pessimistic re-fetch after mutations (`fetchTodos()`) — never splice `todos.value` manually. [Source: architecture.md#Update-strategy]
- All components in `components/todos/` only — no `ui/`, `shared/`, or `common/` folders. [Source: architecture.md#Enforcement-Rules]
- Tailwind classes must be complete literal strings — never dynamically constructed. [Source: architecture.md#Tailwind-Design-Token-Rules]
- No `v-html` for user content, no inline `fetch()` calls in components. [Source: architecture.md#Enforcement-Rules]

### Library / Framework Requirements

- Use existing stack — no new dependencies:
  - Vue 3 Composition API (`^3.5.30` in repo)
  - Vitest (`^4.0.18` in repo)
  - Tailwind CSS (`^3.4.19` in repo)
  - `@vue/test-utils` for component testing
- No upgrade required. Implement against pinned project dependencies.

### File Structure Requirements

- Modify:
  - `todo-frontend/src/components/todos/TodoItem.vue` — add border flash visual on mutation failure
  - `todo-frontend/src/components/todos/TodoList.vue` — add `failedRowId` tracking, pass to `TodoItem`
  - `todo-frontend/src/__tests__/TodoInput.spec.ts` — add empty submit and HTTP 422 tests
  - `todo-frontend/src/__tests__/TodoItem.spec.ts` — add border flash test for edit failure
  - `todo-frontend/src/__tests__/TodoList.spec.ts` — add border flash tests for toggle/delete failure
- Do NOT create new component files. Do NOT move existing files.

### Testing Requirements

- Empty input tests must assert no `createTodo` call AND no error message displayed.
- HTTP 422 test must mock a thrown error with `detail` field and verify the backend message renders inline.
- Border flash tests must verify the `border-outline-variant` class appears on the correct row after failure and is removed after timeout (use `vi.useFakeTimers()` / `vi.advanceTimersByTime()`).
- Mutation error isolation: confirm `AppError` (full-area) is never shown for mutation failures.
- Follow existing test patterns: `@vue/test-utils` `mount()`, `vi.fn()` for props, `await flushPromises()`.

### Anti-Patterns to Avoid

- No toast/snackbar/floating notifications — all errors spatial and contextual.
- No mutation errors routing into `useTodos().error` or triggering full-area `AppError`.
- No dynamic Tailwind class string construction (e.g., `` `border-${token}` ``).
- No new state management libraries or composables — use local `ref()` for component-scoped error state.
- No confirmation dialogs for error recovery — failures are shown inline with automatic fade.
- Do NOT add `window.location.reload()` for error recovery.

### Previous Story Intelligence

From Story 4.1 implementation:
- `AppError.vue` was created for full-area fetch error only — do not repurpose for mutation errors.
- Review findings from 4.1 caught issues with: error state hiding already-loaded todos, empty-string fetch errors bypassing UI, hardcoded colors. Apply same attention to edge cases here.
- All 121 existing tests pass. New tests must not break existing ones.
- `LoadingSkeleton.vue` and `AppError.vue` are already in place — no changes needed to those components.

### Git Intelligence

Recent commits show consistent patterns:
- Components are single-file `.vue` with `<script setup lang="ts">` + `<template>` (no `<style>` blocks — Tailwind only)
- Tests use `describe`/`it` with `@vue/test-utils` `mount()` and `vi.fn()` for mocked props
- Conventional commit format: `feat: story X.Y description`

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-4.2:-Form-Validation-&-Mutation-Error-Handling`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#useTodos()-Composable-Contract`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Error-handling-split`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Rules`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Tailwind-Design-Token-Rules`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Feedback-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#ErrorState`]
- [Source: `todo-frontend/src/components/todos/TodoInput.vue`]
- [Source: `todo-frontend/src/components/todos/TodoItem.vue`]
- [Source: `todo-frontend/src/components/todos/TodoList.vue`]
- [Source: `todo-frontend/src/services/api.ts`]
- [Source: `todo-frontend/src/composables/useTodos.ts`]
- [Source: `todo-frontend/src/App.vue`]
- [Source: `_bmad-output/implementation-artifacts/4-1-loading-skeleton-and-full-area-error-state.md`]

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (model ID: gpt-5.3-codex)

### Debug Log References

- `npm --prefix todo-frontend run lint && npm --prefix todo-frontend run type-check && npm --prefix todo-frontend run test:unit -- --run && npm --prefix todo-frontend run build`
- `npm --prefix todo-frontend run test:unit -- src/__tests__/TodoInput.spec.ts src/__tests__/TodoItem.spec.ts src/__tests__/TodoList.spec.ts src/__tests__/App.spec.ts --run`

### Completion Notes List

- Added local mutation-failure flash handling in `TodoItem.vue` for failed inline title edits, including draft reset and exit from edit mode.
- Added shared row failure tracking in `TodoList.vue` (`failedRowId`) for toggle/delete failures and passed failure state into `TodoItem`.
- Added/extended unit coverage for whitespace no-op submits, HTTP 422 inline detail feedback with preserved input, row-level flash behavior, and App-level mutation error isolation.
- Completed story quality gates across frontend linting, type checks, unit tests, and production build.

### File List

- `_bmad-output/implementation-artifacts/4-2-form-validation-and-mutation-error-handling.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `todo-frontend/src/components/todos/TodoItem.vue`
- `todo-frontend/src/components/todos/TodoList.vue`
- `todo-frontend/src/__tests__/App.spec.ts`
- `todo-frontend/src/__tests__/TodoInput.spec.ts`
- `todo-frontend/src/__tests__/TodoItem.spec.ts`
- `todo-frontend/src/__tests__/TodoList.spec.ts`

## Change Log

- 2026-04-07: Implemented Story 4.2 form validation and mutation error handling, including row-level failure flash feedback and full unit test coverage updates.
