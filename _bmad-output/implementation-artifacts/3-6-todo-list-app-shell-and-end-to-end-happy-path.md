# Story 3.6: TodoList, App Shell & End-to-End Happy Path

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see my complete task list with visual completion states and an empty state,
so that the full happy-path loop — add, view, edit, complete, delete — works end-to-end.

## Acceptance Criteria

1. Given the app loads with existing todos, when the task list renders, then todos appear in reverse chronological order (newest first) as received from the API with no client-side re-sorting.
2. Completed todos display with `line-through` title decoration and `on-surface-variant` text color, and remain visible until explicitly deleted.
3. When all todos are deleted, `AppEmpty.vue` renders `blank` variant by default.
4. `AppEmpty.vue` renders `all-done` variant when the list became empty by deleting a completed task (list had only completed tasks when emptied).
5. Full CRUD happy-path works end-to-end in UI wiring: add → appears, edit title → updates, complete toggle → visual state changes, delete → removed.
6. Integration wiring is correct: `useTodos()` is called only in `App.vue`, then state/methods flow App → `TodoList` (props) → `TodoItem` (props/events); no child composable usage.
7. `editingId` integration works in `TodoList`: `editStart` sets active id, `editEnd` resets to `null`, and `:is-editing="editingId === todo.id"` is accurate per row.
8. `toggleComplete` and `delete` from `TodoItem` reach `useTodos` methods in `App.vue` and preserve pessimistic full re-fetch behavior.
9. NFR performance assertions (200ms list render, 500ms CRUD, 100-item render) are explicitly deferred to Story 5.1 Playwright scenarios; Story 3.6 does not add Playwright tests.

## Tasks / Subtasks

- [x] Task 1: Create `TodoList.vue` as the list orchestration component (AC: 1, 5, 6, 7, 8)
  - [x] Add file `todo-frontend/src/components/todos/TodoList.vue`
  - [x] Define props for `todos`, `updateTodo`, and `deleteTodo` using types from `@/types/todo`
  - [x] Keep `editingId` as local `ref<number | null>(null)` in `TodoList`
  - [x] Render semantic list structure (`<ul>` / `<li>`) with `space-y-6` row separation and `aria-live="polite"` on list region
  - [x] Render `TodoItem` for each todo in given order, preserving API order (no local sort)
  - [x] Handle canonical emits from each row:
    - `editStart(id)` → `editingId = id`
    - `editEnd()` → `editingId = null`
    - `toggleComplete(id, completed)` → call parent-provided update handler
    - `delete(id)` → call parent-provided delete handler

- [x] Task 2: Resolve edit-title save wiring without breaking Story 3.5 event contract (AC: 5, 6, 7)
  - [x] Keep `TodoItem` canonical emits unchanged (`editStart`, `editEnd`, `toggleComplete`, `delete`)
  - [x] Introduce a parent callback prop on `TodoItem` for title commit (e.g. `commitEdit(id, title)`), or equivalent non-emit mechanism
  - [x] On Enter/blur with changed non-empty draft, `TodoItem` invokes callback then emits `editEnd`
  - [x] Keep Escape behavior unchanged (restore original title, emit `editEnd`, no update call)
  - [x] Preserve `// TODO: focus management -- Story 4.3` markers

- [x] Task 3: Add completed-state typography and color treatment on rows (AC: 2, 5)
  - [x] Update `TodoItem.vue` title classes to apply `line-through` + subdued tokenized text color for `todo.completed === true`
  - [x] Keep unchecked row typography unchanged
  - [x] Ensure completed rows remain visible until delete action

- [x] Task 4: Create `AppEmpty.vue` with both required variants (AC: 3, 4)
  - [x] Add file `todo-frontend/src/components/todos/AppEmpty.vue`
  - [x] Support exactly two variants: `blank` and `all-done`
  - [x] `blank` content: ✦ icon, headline "A clean slate", explanatory body copy
  - [x] `all-done` content: completed-state icon and celebratory copy for all done
  - [x] Keep typography aligned with design tokens (`font-display` for headline, `font-body` for body), centered layout

- [x] Task 5: Refactor `App.vue` into app-shell orchestration with explicit empty-state decision logic (AC: 3, 4, 5, 6, 8)
  - [x] Keep `useTodos()` instantiation in `App.vue` only (single call)
  - [x] Continue rendering `TodoInput` pinned above list/empty state
  - [x] Render `TodoList` when todos exist
  - [x] Render `AppEmpty` when todos are empty and not loading/error, selecting variant via local state:
    - `blank` for first-load empty or emptied-by-active-delete
    - `all-done` for emptied-by-completed-delete
  - [x] Track deletion context in `App.vue` before calling `deleteTodo(id)` so variant choice is deterministic after re-fetch
  - [x] Keep current behavior boundaries: do not implement Story 4.1 full-area load-error/skeleton behaviors here

- [x] Task 6: Add or update frontend tests for integration and contracts (AC: 1-8)
  - [x] Add `todo-frontend/src/__tests__/TodoList.spec.ts` for list orchestration and event wiring
  - [x] Update `TodoItem.spec.ts` for completed-title visual classes and title-commit callback flow
  - [x] Add an App-level integration test (new `App.spec.ts` or extension of existing tests) to verify:
    - `useTodos` data/method plumbing App → TodoList → TodoItem
    - Empty variant selection logic (`blank` vs `all-done`)
    - No child `useTodos()` usage regressions
  - [x] Keep tests in current repository convention (`src/__tests__/`)

- [x] Task 7: Frontend quality gates for this story (AC: 1-8)
  - [x] `npm --prefix todo-frontend run lint`
  - [x] `npm --prefix todo-frontend run type-check`
  - [x] `npm --prefix todo-frontend run test:unit -- --run`
  - [x] `npm --prefix todo-frontend run build`

### Review Findings

- [x] [Review][Patch] Deletion context can become stale after failed delete [todo-frontend/src/App.vue:19-24]
- [x] [Review][Patch] TodoList async mutation handlers ignore rejected promises [todo-frontend/src/components/todos/TodoList.vue:23-33]

## Dev Notes

### Epic Context and Boundaries

- Story 3.6 is the integration capstone for Epic 3 and must complete the happy-path loop using components from Stories 3.3–3.5.
- Keep scope on happy path + empty-state variant logic; do not pull in Story 4.1 loading skeleton/error-screen behaviors.
- NFR timing assertions are intentionally deferred to Story 5.1 Playwright.

### Architecture Guardrails (Must Follow)

- `useTodos()` is called once in `App.vue` only; children receive data and handlers via props/events.
- Maintain pessimistic mutation strategy: all mutations go through existing composable methods that re-fetch after success.
- Keep all frontend components in `todo-frontend/src/components/todos/`; do not create `ui/`, `shared/`, or other folders.
- Preserve API-shaped `snake_case` types from `@/types/todo` (`created_at` remains string).
- Keep Tailwind classes as complete literals; no class interpolation templates.

### Current Codebase State (Implementation Starting Point)

- Existing orchestration shell is in `todo-frontend/src/App.vue` with `TodoInput` only and inline load/error text.
- Existing row component `TodoItem.vue` already owns inline edit UI, canonical emits, hover/focus delete reveal, and escape/blur logic.
- Existing checkbox component `TaskCheckbox.vue` already provides completion toggle behavior and accessibility contract.
- Existing tests live under `todo-frontend/src/__tests__/` (not `todo-frontend/tests/unit/`).

### Critical Integration Decision: Edit Commit Transport

- Story 3.5 locked emit names and payload contracts, but title updates still need parent wiring in Story 3.6.
- Implement title commit transport without adding/changing emit names. Preferred approach: callback prop from parent (`TodoList`/`App`) invoked by `TodoItem` on valid Enter/blur commit.
- This preserves Story 3.5 contracts and still routes mutation ownership to higher-level components.

### Previous Story Intelligence (Story 3.5)

- Preserve canonical emits exactly: `editStart`, `editEnd`, `toggleComplete`, `delete`.
- Keep delete control keyboard behavior: hidden state uses `tabindex="-1"` and non-interactive pointer events.
- Maintain 150ms transition behavior and tokenized surfaces.
- Keep focus-management TODO markers for Story 4.3 instead of implementing full focus restoration now.

### Git Intelligence Summary

- Recent Story 3 commits are narrow and component-scoped (`feat: story 3.x ...`) with matching implementation artifact + sprint-status updates.
- Story 3.5 introduced `TodoItem.vue` and `TodoItem.spec.ts`; Story 3.6 should integrate and minimally extend this component rather than replace it.
- Frontend story workflow consistently expects lint + type-check + unit tests + build before completion.

### Latest Technical Information

- Active frontend stack in repository:
  - Vue `^3.5.30`
  - Vite `^7.3.1`
  - Vitest `^4.0.18`
  - Tailwind CSS `^3.4.19`
- No dependency upgrades are required for Story 3.6. Implement against current project versions and conventions.

### Project Structure Notes

- Create:
  - `todo-frontend/src/components/todos/TodoList.vue`
  - `todo-frontend/src/components/todos/AppEmpty.vue`
  - `todo-frontend/src/__tests__/TodoList.spec.ts`
  - optionally `todo-frontend/src/__tests__/App.spec.ts` (or extend existing tests)
- Update:
  - `todo-frontend/src/App.vue`
  - `todo-frontend/src/components/todos/TodoItem.vue`
  - `todo-frontend/src/__tests__/TodoItem.spec.ts`
- Architecture document references `tests/unit`, but repository reality is `src/__tests__`; follow repository reality.

### Testing Requirements

- Verify list order is preserved from API response order (no client sorting).
- Verify `editingId` single-row edit ownership and transitions.
- Verify completed visual treatment (`line-through`, subdued color token class).
- Verify delete and toggle event paths trigger parent handlers and preserve full re-fetch workflow through `useTodos`.
- Verify empty-state variant decision logic after final deletion (`blank` vs `all-done`).
- Keep tests deterministic and free of network calls by mocking service/composable boundaries as needed.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.6:-TodoList,-App-Shell-&-End-to-End-Happy-Path`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.5:-TodoItem-Component`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-4.1:-Loading-Skeleton-&-Full-Area-Error-State`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#useTodos()-Composable-Contract`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#TodoItem-Component-Contract`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Rules`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Journey-5:-First-Load-/-Return-Visit`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Loading-&-Empty-State-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design-&-Accessibility`]
- [Source: `_bmad-output/planning-artifacts/prd.md#Functional-Requirements`]
- [Source: `_bmad-output/planning-artifacts/prd.md#Accessibility-&-Responsive-Design`]
- [Source: `todo-frontend/src/App.vue`]
- [Source: `todo-frontend/src/composables/useTodos.ts`]
- [Source: `todo-frontend/src/components/todos/TodoInput.vue`]
- [Source: `todo-frontend/src/components/todos/TodoItem.vue`]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- N/A

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story includes integration guardrails that resolve Story 3.5 edit-commit contract ambiguity without breaking canonical event names.
- Story prepared for implementation with explicit boundaries to avoid leaking Story 4.1/5.1 scope.
- Implemented TodoList.vue as list orchestration component with editingId management, semantic `<ul>/<li>` structure, and `aria-live="polite"`.
- Added `onCommitEdit` callback prop to TodoItem for title commit transport — preserves all canonical emits unchanged.
- Added completed-state visual treatment: `line-through` + `text-on-surface-variant` for completed todos.
- Created AppEmpty.vue with `blank` and `all-done` variants using design token typography.
- Refactored App.vue into full app-shell: `useTodos()` called once, data/methods flow via props to TodoList → TodoItem. Empty-state variant selection tracks deletion context (was the deleted todo completed and was it the last one?).
- Added comprehensive test coverage: TodoList.spec.ts (12 tests), AppEmpty.spec.ts (8 tests), App.spec.ts (8 tests), updated TodoItem.spec.ts (+8 tests). Total: 100 tests passing.
- All quality gates pass: lint, type-check, unit tests, build.

### Change Log

- 2026-04-03: Story 3.6 implementation complete — TodoList, AppEmpty, App shell orchestration, edit-title wiring, completed-state typography, full test coverage.

### File List

- `_bmad-output/implementation-artifacts/3-6-todo-list-app-shell-and-end-to-end-happy-path.md` (updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)
- `todo-frontend/src/components/todos/TodoList.vue` (created)
- `todo-frontend/src/components/todos/AppEmpty.vue` (created)
- `todo-frontend/src/components/todos/TodoItem.vue` (modified)
- `todo-frontend/src/App.vue` (modified)
- `todo-frontend/src/__tests__/TodoList.spec.ts` (created)
- `todo-frontend/src/__tests__/AppEmpty.spec.ts` (created)
- `todo-frontend/src/__tests__/App.spec.ts` (created)
- `todo-frontend/src/__tests__/TodoItem.spec.ts` (modified)
