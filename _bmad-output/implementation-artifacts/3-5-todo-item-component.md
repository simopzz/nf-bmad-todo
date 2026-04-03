# Story 3.5: TodoItem Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want each task row to display my task with inline editing and hover-revealed actions,
so that I can edit, complete, and delete tasks without leaving the list view.

## Acceptance Criteria

1. Given a task is displayed, when the row is at rest, then it shows `[TaskCheckbox] [task title] [action icons hidden]` with transparent background and `spacing-6` (1.5rem) vertical separation from adjacent rows, with no dividers.
2. Given a task row, when I hover the row, then the background shifts to `surface-highest` and the delete icon transitions from `opacity: 0` to `opacity: 1` in 150ms.
3. Given a task row, when I click the task title, then the title becomes an inline input pre-filled with the current text, background shifts to `surface-lowest`, and a 2px `secondary` left-edge indicator appears.
4. Given inline edit mode is active, when I press Enter or blur the input, then the component saves the edit and calls `updateTodo()` through parent event wiring.
5. Given inline edit mode is active, when I press Escape, then edit mode is canceled, the original title is restored, and no API call occurs.
6. Given multiple tasks, only one task can be in edit mode at a time, enforced by `editingId` in `TodoList` and passed via `:is-editing="editingId === todo.id"`.
7. Given a task row, when I click the delete icon, then the task is immediately removed with no confirmation dialog.
8. Given the delete icon is hidden (`opacity: 0`), then it has `tabindex="-1"` and is not tabbable; when row is hovered or focused, it becomes visible and `tabindex="0"`.
9. The component emits exactly `editStart`, `editEnd`, `toggleComplete`, and `delete`, and performs no direct API calls.
10. The delete button has `aria-label="Delete task"` and the edit input has `aria-label="Edit task"`.
11. Forward compatibility: leave `// TODO: focus management -- Story 4.3` comments where edit-entry and edit-exit focus handling will be implemented later.

## Tasks / Subtasks

- [x] Task 1: Create `TodoItem.vue` presentational contract and event model (AC: 1, 6, 9, 10, 11)
  - [x] Create file `todo-frontend/src/components/todos/TodoItem.vue`
  - [x] Define props with API-shaped types from `@/types/todo`: `todo: Todo` and `isEditing: boolean`
  - [x] Define canonical emits exactly:
    - `editStart: [id: number]`
    - `editEnd: []`
    - `toggleComplete: [id: number, completed: boolean]`
    - `delete: [id: number]`
  - [x] Import and render `TaskCheckbox` with `:completed="todo.completed"` and emit `toggleComplete(todo.id, !todo.completed)` on toggle
  - [x] Add row-level semantic and accessible structure for title display, edit input, and delete action
  - [x] Add `// TODO: focus management -- Story 4.3` comments at edit-entry and edit-exit points

- [x] Task 2: Implement row visual behavior and delete affordance (AC: 1, 2, 7, 8, 10)
  - [x] Rest state: transparent row surface and 1.5rem row spacing (`space-y-6` ownership belongs to list container; item must remain divider-free)
  - [x] Hover/focus state: row background transitions to `surface-highest` in 150ms
  - [x] Delete control transitions opacity 0 -> 1 in 150ms
  - [x] Manage delete focusability explicitly via reactive visibility state (`tabindex="-1"` hidden, `tabindex="0"` visible) so keyboard behavior matches AC
  - [x] Set delete button accessible name to `aria-label="Delete task"`
  - [x] Emit `delete(todo.id)` on delete click with no confirmation UI

- [x] Task 3: Implement inline edit behavior with cancel/commit semantics (AC: 3, 4, 5, 6, 10)
  - [x] Clicking title emits `editStart(todo.id)` and initializes local editable draft from `todo.title`
  - [x] Edit mode renders input with `aria-label="Edit task"`, `surface-lowest` background, and 2px `secondary` left-edge indicator
  - [x] Enter and blur both commit when value changed and non-empty (emit through parent flow via `editEnd`; Story 3.6 wires parent `updateTodo`)
  - [x] Escape cancels edit, restores original text, emits `editEnd`, and performs no mutation call
  - [x] Keep logic component-local and side-effect free: no `useTodos()` and no `api.ts` import

- [x] Task 4: Add unit tests for `TodoItem.vue` behavior contracts (AC: 1-10)
  - [x] Create `todo-frontend/src/__tests__/TodoItem.spec.ts`
  - [x] Verify canonical emits are fired with exact payload contracts for edit start/end, toggleComplete, and delete
  - [x] Verify inline edit activation from title click and pre-filled current title
  - [x] Verify Enter and blur commit path emits expected events
  - [x] Verify Escape cancel path restores original title and emits `editEnd` without commit event
  - [x] Verify delete button accessibility attributes and tabindex switching between hidden/visible states
  - [x] Verify row class tokens for rest vs hover/focus-ready states (`surface-highest`, transition duration)
  - [x] Verify no direct API/composable coupling by asserting component imports only UI/type dependencies

- [x] Task 5: Integrate with existing frontend quality gates (AC: 1-10)
  - [x] Run `npm --prefix todo-frontend run lint`
  - [x] Run `npm --prefix todo-frontend run type-check`
  - [x] Run `npm --prefix todo-frontend run test:unit -- --run`
  - [x] Run `npm --prefix todo-frontend run build`

### Review Findings

- [x] [Review][Decision] Edit commit data contract is ambiguous between AC4 and the fixed emit contract — resolved: keep canonical emits unchanged for Story 3.5 and keep title transport/wiring concerns in Story 3.6 integration. [todo-frontend/src/components/todos/TodoItem.vue:12]
- [x] [Review][Patch] Commit logic now exits edit mode safely for unchanged or blank input and only triggers save flow for changed, non-empty values [todo-frontend/src/components/todos/TodoItem.vue:37]
- [x] [Review][Patch] Enter commit and subsequent blur no longer double-emit edit completion (duplicate parent update flow guarded) [todo-frontend/src/components/todos/TodoItem.vue:44]
- [x] [Review][Patch] Delete affordance now becomes visible/focusable on row focus (not hover-only) to satisfy keyboard access contract [todo-frontend/src/components/todos/TodoItem.vue:60]
- [x] [Review][Patch] Hidden delete button is now non-interactive while opacity is 0 (prevents accidental invisible deletes) [todo-frontend/src/components/todos/TodoItem.vue:95]

## Dev Notes

### Epic Context and Boundaries

- Epic 3 completes the frontend happy path: create, view, edit, complete, delete.
- Story 3.5 is the row interaction core; Story 3.6 owns parent wiring (`TodoList`, `editingId`, and App integration).
- Do not expand scope into global keyboard navigation/focus restoration details from Story 4.3; place TODO markers only.

### Architecture Guardrails (Must Follow)

- Components must stay in `todo-frontend/src/components/todos/` only; do not create `ui/`, `shared/`, or `common/` folders.
- `useTodos()` is called once in `App.vue`; child components (including `TodoItem`) must not call `useTodos()` directly.
- Mutation handling pattern is pessimistic full re-fetch after parent-level mutations; `TodoItem` emits events and does not call API.
- `TodoItem` canonical emit names are fixed and must not vary: `editStart`, `editEnd`, `toggleComplete`, `delete`.
- `editingId` ownership belongs to `TodoList` and is passed as `isEditing` prop.

### Current Codebase State (Implementation Starting Point)

- Existing components in scope:
  - `todo-frontend/src/components/todos/TodoInput.vue`
  - `todo-frontend/src/components/todos/TaskCheckbox.vue`
- Existing state and API plumbing:
  - `todo-frontend/src/composables/useTodos.ts` exposes `createTodo`, `updateTodo`, `deleteTodo`, `fetchTodos`, `todos`, `loading`, `error`
  - `todo-frontend/src/services/api.ts` already enforces error normalization and typed CRUD calls
- Existing frontend tests are in `todo-frontend/src/__tests__/`.

### UX and Visual Requirements to Preserve

- Keep row visuals aligned with Editorial Functionalism tokens:
  - Rest: transparent
  - Hover/focus: `surface-highest`
  - Edit input: `surface-lowest` + 2px `secondary` left edge
  - Motion: 150ms ease-in-out for reveal/surface transitions
- Completion behavior uses `TaskCheckbox` as the row's completion control and must preserve the reward-feel interaction pattern already established in Story 3.4.
- Delete remains immediate, no confirmation modal.

### Previous Story Intelligence (Story 3.4)

- Include explicit `type="button"` on action buttons to avoid accidental form submission.
- Preserve 150ms transition quality; previous review flagged non-animated visual state changes.
- Guard keyboard repeat behavior where relevant (Space-hold emitted multiple toggles in earlier iteration).
- Respect existing design-foundation regex constraints: avoid plain `border` utility patterns that fail structural tests.

### Git Intelligence Summary

- Recent implementation pattern is one story per focused commit (`feat: story 3.x ...`) with matching implementation artifact updates.
- Story 3.4 introduced `TaskCheckbox.vue` and corresponding unit tests; Story 3.5 should reuse that component rather than duplicating checkbox logic.
- Frontend stories consistently include lint, type-check, unit tests, and build in the quality gate checklist.

### Latest Technical Information

- Frontend stack versions in repository are current and compatible with required implementation patterns:
  - Vue `^3.5.30`
  - Vite `^7.3.1`
  - Vitest `^4.0.18`
  - Tailwind CSS `^3.4.19`
- No migration or version-upgrade work is required for this story; implementation should follow current project conventions and existing utilities.

### Project Structure Notes

- Story 3.5 should create:
  - `todo-frontend/src/components/todos/TodoItem.vue`
  - `todo-frontend/src/__tests__/TodoItem.spec.ts`
- Story 3.5 should not create `TodoList.vue` or integrate `TodoItem` into `App.vue` (that is Story 3.6).
- Keep API shape and field naming in snake_case (`created_at`) by importing types from `@/types/todo`.

### Testing Requirements

- Unit tests must validate behavior, not only static markup:
  - emit payload correctness
  - edit-mode transitions and cancel semantics
  - delete tabindex visibility contract
  - accessibility labels and role usage
- Keep tests in Vitest + Vue Test Utils style already used in `TodoInput.spec.ts` and `TaskCheckbox.spec.ts`.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.5-TodoItem-Component`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.6-TodoList-App-Shell--End-to-End-Happy-Path`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-4.3-Keyboard-Navigation--Screen-Reader-Support`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#useTodos-Composable-Contract`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#TodoItem-Component-Contract`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Tailwind-Design-Token-Rules`]
- [Source: `_bmad-output/planning-artifacts/prd.md#Functional-Requirements`]
- [Source: `_bmad-output/planning-artifacts/prd.md#Accessibility--Responsive-Design`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Journey-3-Edit-a-Task`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Journey-4-Delete-a-Task`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Hover--Focus-Patterns`]
- [Source: `_bmad-output/project-context.md#Framework-Specific-Rules`]
- [Source: `_bmad-output/implementation-artifacts/3-4-task-checkbox-component.md`]
- [Source: `todo-frontend/src/composables/useTodos.ts`]
- [Source: `todo-frontend/src/components/todos/TaskCheckbox.vue`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- N/A

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story prepared for implementation with explicit contracts, boundaries, and regression guardrails.
- Implemented `TodoItem.vue` with: reactive `isHovered` state driving delete button opacity/tabindex; `editDraft` ref reset via `watch(isEditing)` for cancel-safe drafts; canonical emit set (editStart, editEnd, toggleComplete, delete); `// TODO: focus management -- Story 4.3` comments at edit-entry and exit points.
- Created 19 unit tests in `TodoItem.spec.ts` covering all ACs: emit contracts, inline edit activation, commit/cancel paths, delete a11y, tabindex visibility, row hover tokens, no API coupling.
- All quality gates passed: lint ✅, type-check ✅, 59/59 tests ✅, build ✅.

### File List

- `_bmad-output/implementation-artifacts/3-5-todo-item-component.md` (created)
- `todo-frontend/src/components/todos/TodoItem.vue` (created)
- `todo-frontend/src/__tests__/TodoItem.spec.ts` (created)

## Change Log

- 2026-04-03: Story implemented - created TodoItem.vue presentational component with inline edit, hover-revealed delete, and canonical event model; 19 unit tests added covering all acceptance criteria.
