# Story 4.1: Loading Skeleton & Full-Area Error State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see a purposeful loading state on first load and a clear error state with a working retry when the backend is unreachable,
so that I always know what the app is doing and can recover without refreshing the page.

## Acceptance Criteria

1. Given the app is loading todos for the first time, when the API fetch is in flight, then `LoadingSkeleton.vue` renders 3-4 shimmer rows matching the height and layout proportions of `TodoItem` (no centered spinner).
2. Shimmer animation uses a CSS `@keyframes` sweep from `surface-low` -> `surface-highest` -> `surface-low`; `surface-highest` is the midpoint, and `surface-dim` is not used.
3. Skeleton is shown only during initial fetch and uses `v-if="loading && todos.length === 0"` (never plain `v-if="loading"`).
4. After a todo is created, existing list content remains visible during post-mutation re-fetch; skeleton does not reappear.
5. Given backend is unreachable on initial load, when `fetchTodos()` fails, then `AppError.vue` renders `load-error` variant with "Couldn't load your tasks" copy and a primary gradient Retry button.
6. Clicking Retry calls `fetchTodos()` again.
7. When backend recovers and user clicks Retry, the list loads successfully (retry is functional, not decorative).
8. Error state container is wrapped with `role="status"` so screen readers announce it without requiring focus.

## Tasks / Subtasks

- [x] Task 1: Create `LoadingSkeleton.vue` for first-load placeholder UX (AC: 1, 2, 3)
  - [x] Add `todo-frontend/src/components/todos/LoadingSkeleton.vue`
  - [x] Render 3-4 placeholder rows that mirror `TodoItem` shape (checkbox zone + title line + action affordance zone)
  - [x] Implement scoped CSS `@keyframes` shimmer using existing tokens (`surface-low`, `surface-highest`) with 150ms-friendly visual rhythm
  - [x] Keep class names literal (no dynamic class interpolation)
  - [x] Ensure component is presentational only (no API/composable calls)

- [x] Task 2: Create `AppError.vue` load-error variant with retry action (AC: 5, 8)
  - [x] Add `todo-frontend/src/components/todos/AppError.vue`
  - [x] Implement full-area load-error content: heading, supporting copy, and primary gradient Retry button
  - [x] Add `role="status"` on the error container and keep accessible button labeling
  - [x] Expose retry via prop callback (e.g., `onRetry: () => Promise<void> | void`) or explicit emit consumed by `App.vue`

- [x] Task 3: Update `App.vue` state orchestration for loading/error/list rendering (AC: 3, 4, 5, 6, 7)
  - [x] Replace current plain text loading/error header messages with componentized state rendering
  - [x] Render `LoadingSkeleton` only when `todoModel.loading.value && todoModel.todos.value.length === 0 && !todoModel.error.value`
  - [x] Render `AppError` when `todoModel.error.value` is set (fetch failure path only)
  - [x] Wire Retry action to `todoModel.fetchTodos`
  - [x] Preserve existing `TodoInput` + `TodoList` + `AppEmpty` behavior and current optimistic boundaries (no global re-architecture)
  - [x] Ensure existing list stays visible during post-mutation re-fetches when todos already exist

- [x] Task 4: Verify mutation-error boundaries remain unchanged (AC: 4, 5)
  - [x] Keep `useTodos().error` dedicated to `fetchTodos()` failures
  - [x] Keep mutation errors local to `TodoInput.vue` / `TodoList.vue` inline displays
  - [x] Confirm no mutation error path incorrectly triggers full-page `AppError`

- [x] Task 5: Add/extend frontend unit tests for loading and retry flow (AC: 1-8)
  - [x] Add `todo-frontend/src/__tests__/LoadingSkeleton.spec.ts`
  - [x] Add `todo-frontend/src/__tests__/AppError.spec.ts`
  - [x] Extend `todo-frontend/src/__tests__/App.spec.ts` to verify:
    - [x] initial-load skeleton render conditions
    - [x] skeleton hidden when todos exist (including while re-fetching)
    - [x] fetch failure renders load-error state
    - [x] Retry triggers a second fetch and successful recovery renders list
    - [x] `role="status"` is present on load-error container

- [x] Task 6: Run story quality gates
  - [x] `npm --prefix todo-frontend run lint`
  - [x] `npm --prefix todo-frontend run type-check`
  - [x] `npm --prefix todo-frontend run test:unit -- --run`
  - [x] `npm --prefix todo-frontend run build`

### Review Findings

- [x] [Review][Patch] App-level error state can hide already-loaded todos after a re-fetch failure [todo-frontend/src/App.vue:49]
- [x] [Review][Patch] Empty-string fetch errors can bypass error UI and incorrectly show empty state [todo-frontend/src/App.vue:19]
- [x] [Review][Patch] Skeleton shimmer keyframes use hardcoded colors instead of required surface token sweep [todo-frontend/src/components/todos/LoadingSkeleton.vue:29]
- [x] [Review][Patch] Skeleton row layout omits action-affordance placeholder zone [todo-frontend/src/components/todos/LoadingSkeleton.vue:13]
- [x] [Review][Patch] Retry button uses secondary gradient instead of required primary gradient [todo-frontend/src/components/todos/AppError.vue:18]

## Dev Notes

### Epic Context and Boundaries

- This story is Epic 4 entry-point work for FR10/FR11 and must establish resilient first-load UX before deeper validation/accessibility work in Stories 4.2-4.4.
- Scope is constrained to first-load skeleton and full-area fetch error with retry. Do not implement Story 4.2 mutation validation behavior beyond preserving current boundaries.
- Retry behavior must be proven functionally in tests (button presence alone is insufficient).

### Current Codebase State (Important Starting Context)

- `App.vue` currently shows loading and fetch-error as plain `<p>` text in the header; no `LoadingSkeleton.vue` or `AppError.vue` exists yet.
- `useTodos()` already exposes `fetchTodos`, `loading`, `error`, and pessimistic mutation methods; it auto-invokes `fetchTodos()` on creation.
- `TodoList.vue` already has local `mutationError` handling for update/delete failures.
- `TodoInput.vue` already has local `mutationError` handling and preserves typed input on create failure.
- `AppEmpty.vue` and `TodoList.vue` rendering is already in place from Story 3.6.

### Architecture Compliance (Must Follow)

- Call `useTodos()` once in `App.vue` only; do not instantiate it in child components.
- Keep all new components inside `todo-frontend/src/components/todos/`.
- Keep pessimistic full re-fetch behavior after mutations (`fetchTodos()`), and do not patch `todos.value` manually.
- Keep mutation errors local and contextual; reserve app-level error state for `fetchTodos()` failures.
- Keep Tailwind classes as complete literals and maintain design-token usage (`surface-*`, `primary-container`, `secondary`, `outline-variant`).
- Do not introduce third-party UI component libraries or new state libraries.

### Library / Framework Requirements

- Use existing stack and conventions:
  - Vue 3 Composition API (`^3.5.30` in repo)
  - Vite (`^7.3.1` in repo)
  - Vitest (`^4.0.18` in repo)
  - Tailwind CSS (`^3.4.19` in repo)
- Latest npm releases checked during story creation: Vue `3.5.32`, Vite `8.0.3`, Vitest `4.1.2`, Tailwind CSS `4.2.2`.
- No upgrade is required in this story; implement against pinned project dependencies.

### File Structure Requirements

- Create:
  - `todo-frontend/src/components/todos/LoadingSkeleton.vue`
  - `todo-frontend/src/components/todos/AppError.vue`
  - `todo-frontend/src/__tests__/LoadingSkeleton.spec.ts`
  - `todo-frontend/src/__tests__/AppError.spec.ts`
- Update:
  - `todo-frontend/src/App.vue`
  - `todo-frontend/src/__tests__/App.spec.ts`
- Do not move existing files or create alternate component directories.

### Testing Requirements

- Loading state tests must validate conditional rendering semantics (`loading && todos.length === 0`).
- Retry tests must cover failure -> retry click -> success transition in one scenario.
- Tests must confirm list visibility behavior when re-fetching with existing todos (no skeleton flash regression).
- Preserve existing design-foundation constraints (no dynamic class interpolation, no non-token emerald classes).

### Anti-Patterns to Avoid

- No centered spinner fallback for first load.
- No decorative Retry button that does not call `fetchTodos()`.
- No mutation-error routing into global load-error surface.
- No usage of undefined token names such as `surface-dim`.
- No direct API `fetch()` calls from presentation components.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-4.1:-Loading-Skeleton-&-Full-Area-Error-State`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic-4:-Resilient-UX,-Accessibility-&-Responsive-Design`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#useTodos()-Composable-Contract`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Rules`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Loading-&-Empty-State-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#ErrorState`]
- [Source: `_bmad-output/project-context.md#Framework-Specific-Rules`]
- [Source: `todo-frontend/src/App.vue`]
- [Source: `todo-frontend/src/composables/useTodos.ts`]
- [Source: `todo-frontend/src/components/todos/TodoList.vue`]
- [Source: `todo-frontend/src/components/todos/TodoInput.vue`]
- [Source: `todo-frontend/src/__tests__/App.spec.ts`]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- N/A

### Completion Notes List

- Created `LoadingSkeleton.vue` with 4 shimmer rows matching TodoItem layout, using CSS @keyframes animation sweeping between `surface-low` and `surface-highest` tokens.
- Created `AppError.vue` with load-error variant, "Couldn't load your tasks" copy, primary gradient Retry button, and `role="status"` for screen reader accessibility.
- Updated `App.vue` to replace plain text loading/error messages with componentized rendering: `LoadingSkeleton` shown only on initial fetch (`loading && todos.length === 0 && !error`), `AppError` shown on fetch failure with retry wired to `fetchTodos`.
- Verified mutation-error boundaries remain intact: `useTodos().error` set only by `fetchTodos()`, mutation errors handled locally in `TodoInput.vue` and `TodoList.vue`.
- Added 4 unit tests for `LoadingSkeleton`, 5 for `AppError`, and 7 integration tests in `App.spec.ts` covering skeleton render conditions, re-fetch behavior, error state, retry recovery, role="status", and mutation-error isolation.
- All 121 tests pass. Lint, type-check, and build all clean.

### Change Log

- 2026-04-03: Implemented story 4.1 — LoadingSkeleton, AppError, App.vue orchestration, and comprehensive tests.

### File List

- `todo-frontend/src/components/todos/LoadingSkeleton.vue` (created)
- `todo-frontend/src/components/todos/AppError.vue` (created)
- `todo-frontend/src/App.vue` (updated)
- `todo-frontend/src/__tests__/LoadingSkeleton.spec.ts` (created)
- `todo-frontend/src/__tests__/AppError.spec.ts` (created)
- `todo-frontend/src/__tests__/App.spec.ts` (updated)
- `_bmad-output/implementation-artifacts/4-1-loading-skeleton-and-full-area-error-state.md` (updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)
