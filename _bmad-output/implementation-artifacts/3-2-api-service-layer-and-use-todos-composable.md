# Story 3.2: API Service Layer & useTodos Composable

Status: done

## Story

As a developer,
I want a typed API service module and reactive composable that manage all todo state and HTTP calls,
so that Vue components interact only with clean reactive data and never make direct `fetch()` calls.

## Acceptance Criteria

1. Given the design system from Story 3.1 and the backend API from Epic 2 are available, when `api.ts` is implemented, then it exports exactly four functions: `getTodos()`, `createTodo()`, `updateTodo()`, `deleteTodo()` — no additional functions.
2. `getTodos()` unwraps the `{"items": [...]}` envelope internally — callers receive `Todo[]`.
3. `api.ts` throws on any non-2xx response; calling components handle errors locally.
4. `types/todo.ts` defines `Todo`, `TodoCreate`, `TodoUpdate` interfaces with `created_at` typed as `string` (never `Date`).
5. When `useTodos()` composable is implemented in `App.vue` only, then it exposes: `todos` (`Ref<Todo[]>`), `loading` (`Ref<boolean>`), `error` (`Ref<string | null>`), `fetchTodos`, `createTodo`, `updateTodo`, `deleteTodo`.
6. Every mutation calls `fetchTodos()` after success — `todos.value` is never manually spliced or patched.
7. `loading` and `error` are set only by `fetchTodos()` failures — mutation errors are handled by local refs in the calling component.
8. `useTodos()` is called once in `App.vue` only — never imported in child components.
9. `api.ts` is covered by Vitest unit tests: at minimum, `getTodos()` correctly unwraps the `{"items": [...]}` envelope and returns `Todo[]`; `createTodo()` sends a POST with the correct payload shape; both throw on non-2xx responses.
10. A `getErrorMessage(e: unknown): string` utility is defined and exported from `services/api.ts`: it extracts `detail` from the API error response body if present, falls back to `e.message` if `e` is an `Error`, and falls back to `"An unexpected error occurred"` — all components that handle mutation errors import and call this function.

## Tasks / Subtasks

- [x] Task 1: Create TypeScript interfaces in `types/todo.ts` (AC: 4)
  - [x] Define `Todo` interface: `id: number`, `title: string`, `completed: boolean`, `created_at: string`
  - [x] Define `TodoCreate` interface: `title: string`
  - [x] Define `TodoUpdate` interface: `title?: string`, `completed?: boolean`
  - [x] Define `TodoListResponse` interface: `items: Todo[]` (internal to `api.ts` — exported from types but only imported in `api.ts`)

- [x] Task 2: Implement API service module `services/api.ts` (AC: 1, 2, 3, 10)
  - [x] Implement `getTodos(): Promise<Todo[]>` — `GET /api/v1/todos`, unwrap `items` envelope
  - [x] Implement `createTodo(data: TodoCreate): Promise<Todo>` — `POST /api/v1/todos`
  - [x] Implement `updateTodo(id: number, data: TodoUpdate): Promise<Todo>` — `PATCH /api/v1/todos/{id}`
  - [x] Implement `deleteTodo(id: number): Promise<void>` — `DELETE /api/v1/todos/{id}`
  - [x] Implement `getErrorMessage(e: unknown): string` — extract `detail` from API error body, fallback to `e.message`, then `"An unexpected error occurred"`
  - [x] Use `const BASE_URL = '/api/v1/todos'` — relative path, Vite proxy handles routing in dev
  - [x] Throw on non-2xx: check `response.ok`, if false parse error body and throw
  - [x] No data transformation — return API response as-is after envelope unwrapping
  - [x] No state, no reactive refs — pure async functions only

- [x] Task 3: Implement `useTodos()` composable in `composables/useTodos.ts` (AC: 5, 6, 7, 8)
  - [x] Expose: `todos: Ref<Todo[]>`, `loading: Ref<boolean>`, `error: Ref<string | null>`
  - [x] Expose: `fetchTodos`, `createTodo`, `updateTodo`, `deleteTodo` as async functions
  - [x] `fetchTodos()`: set `loading=true`, `error=null`, try/catch → on success update `todos.value`, on failure set `error` via `getErrorMessage()`, finally `loading=false`
  - [x] Mutation functions (`createTodo`, `updateTodo`, `deleteTodo`): call corresponding `api.*` function, then call `fetchTodos()` on success. Do NOT catch errors — let them propagate to the calling component for local error handling
  - [x] Call `fetchTodos()` on composable initialization (`onMounted` or immediate call)
  - [x] Never splice/mutate `todos.value` directly — always full re-fetch

- [x] Task 4: Wire `useTodos()` into `App.vue` (AC: 8)
  - [x] Import and call `useTodos()` once in `App.vue` `<script setup>`
  - [x] Remove placeholder content from Story 3.1 shell
  - [x] Pass state and methods to future child components via props (structure ready for Stories 3.3–3.6)
  - [x] Keep the shell layout (`<main>`, `<section>` max-width 640px, `surface` background) intact

- [x] Task 5: Write unit tests for `api.ts` (AC: 9)
  - [x] Test `getTodos()` unwraps `{"items": [...]}` envelope correctly
  - [x] Test `createTodo()` sends POST with correct payload shape
  - [x] Test `updateTodo()` sends PATCH with correct payload shape
  - [x] Test `deleteTodo()` sends DELETE to correct URL
  - [x] Test all functions throw on non-2xx responses
  - [x] Test `getErrorMessage()` extracts `detail`, falls back to `message`, then default string
  - [x] Mock `fetch` globally — do not make real HTTP calls

- [x] Task 6: Write unit tests for `useTodos.ts` (AC: 5, 6, 7)
  - [x] Test `fetchTodos` populates `todos` ref on success
  - [x] Test `fetchTodos` sets `error` on failure
  - [x] Test `loading` flag is set during fetch
  - [x] Test `createTodo` calls `fetchTodos` after success (pessimistic re-fetch)
  - [x] Test mutation errors propagate (not caught by composable)
  - [x] Mock `api.ts` module — do not mock `fetch`

- [x] Task 7: Verify quality gates
  - [x] Run `npm --prefix todo-frontend run lint`
  - [x] Run `npm --prefix todo-frontend run type-check`
  - [x] Run `npm --prefix todo-frontend run test:unit -- --run`
  - [x] Run `npm --prefix todo-frontend run build`
  - [x] Run `make test-backend` (regression safety check)

### Review Findings

- [x] [Review][Patch] `todoModel.loading` and `todoModel.error` missing `.value` in App.vue template — Ref objects on plain objects are not auto-unwrapped; `v-if="todoModel.loading"` is always truthy; `v-if="todoModel.error"` is always truthy; `{{ todoModel.error }}` renders the Ref object, not the string. [App.vue:15-17]
- [x] [Review][Defer] `TodoListResponse` publicly exported from `types/todo.ts` [types/todo.ts:17] — deferred, violates "internal to api.ts" guardrail but no consumer currently imports it; move to api.ts internals in a follow-up
- [x] [Review][Defer] Race condition in concurrent `fetchTodos` calls — no cancellation or sequence guard; stale responses can overwrite newer data [composables/useTodos.ts:20] — deferred, inherent tradeoff of pessimistic-refetch pattern; out of scope for Story 3.2
- [x] [Review][Defer] `getErrorMessage({ detail: null })` returns the string `"null"` to users [services/api.ts:30] — deferred, backend contract returns strings not null; addressed in defensive hardening pass

## Dev Notes

### Epic Context and Business Goal

Epic 3 delivers the complete frontend happy-path loop (create, view, edit, complete, delete). Story 3.2 builds the data layer that all subsequent component stories (3.3–3.6) depend on. If the API service or composable contracts are wrong here, every downstream story breaks. This is the bridge between the backend API (Epic 2) and the frontend UI (Stories 3.3–3.6).

### Current Codebase Baseline (Observed)

- Backend API is fully operational: `GET/POST/PATCH/DELETE /api/v1/todos` + `GET /api/v1/health`
- `GET /api/v1/todos` returns `{"items": [...]}` envelope with `TodoResponse` objects
- `POST /api/v1/todos` expects `{"title": "..."}`, returns created `TodoResponse` (HTTP 201)
- `PATCH /api/v1/todos/{id}` expects `{"title": "...", "completed": true/false}` (both optional), returns updated `TodoResponse`
- `DELETE /api/v1/todos/{id}` returns HTTP 204, empty body
- All errors return `{"detail": "human-readable message"}`
- Vite proxy already configured: `/api/` → `http://localhost:8000` in `vite.config.ts`
- Frontend has `@` path alias to `./src` in `tsconfig.app.json`
- Frontend directory `src/` currently contains: `App.vue`, `main.ts`, `style.css`, `assets/` (logo only), `__tests__/`
- No `types/`, `services/`, or `composables/` directories exist yet — this story creates them

### Architecture Guardrails (Must Follow)

**TypeScript Interface Contracts (exact shape, no deviations):**
```typescript
// types/todo.ts
export interface Todo {
  id: number
  title: string
  completed: boolean
  created_at: string        // ISO 8601 string — NEVER a Date object
}

export interface TodoCreate {
  title: string
}

export interface TodoUpdate {
  title?: string            // both optional — PATCH semantics
  completed?: boolean
}

export interface TodoListResponse {
  items: Todo[]             // used ONLY inside api.ts — never exported elsewhere
}
```

**`api.ts` Contract (exact signatures):**
```typescript
// services/api.ts — pure async functions, no state, throws on error
export async function getTodos(): Promise<Todo[]>
export async function createTodo(data: TodoCreate): Promise<Todo>
export async function updateTodo(id: number, data: TodoUpdate): Promise<Todo>
export async function deleteTodo(id: number): Promise<void>
export function getErrorMessage(e: unknown): string
```

**`useTodos()` Contract (exact shape):**
```typescript
// composables/useTodos.ts
const {
  todos,        // Ref<Todo[]>
  loading,      // Ref<boolean> — true only during fetchTodos()
  error,        // Ref<string | null> — set ONLY by fetchTodos() failures
  fetchTodos,   // () => Promise<void>
  createTodo,   // (title: string) => Promise<void>
  updateTodo,   // (id: number, patch: TodoUpdate) => Promise<void>
  deleteTodo,   // (id: number) => Promise<void>
} = useTodos()
```

**Critical rules:**
- `VITE_API_URL` is always `""` (empty string) — use relative URL `/api/v1/todos` in `api.ts`
- `TodoListResponse` is internal to `api.ts` — never passed to composables/components
- `created_at` is always `string` in frontend — never `Date`
- JSON fields use `snake_case` — no camelCase transform
- Pessimistic re-fetch after every mutation — never splice `todos.value`
- `useTodos()` called once in `App.vue` only — state passed to children via props
- Mutation errors propagate to calling component — NOT caught by `useTodos()`
- `useTodos().error` is set ONLY by `fetchTodos()` failures
- No `v-html` for user content — always `{{ }}` interpolation
- No inline `fetch()` calls in Vue components — always use `api.ts`

### Error Handling Architecture

```
fetchTodos() failure → useTodos.error set → AppError.vue (Story 4.1)
mutation failure     → error propagates   → local ref in calling component (Story 4.2)
                                          → displayed inline per component
```

**`getErrorMessage(e: unknown): string` implementation:**
```typescript
export function getErrorMessage(e: unknown): string {
  if (e instanceof Response) {
    // Should not reach here — errors are pre-parsed
  }
  if (typeof e === 'object' && e !== null && 'detail' in e) {
    return String((e as { detail: string }).detail)
  }
  if (e instanceof Error) {
    return e.message
  }
  return 'An unexpected error occurred'
}
```

**Throw pattern in `api.ts`:**
```typescript
if (!response.ok) {
  const body = await response.json().catch(() => ({}))
  const error = new Error(body.detail || response.statusText)
  ;(error as any).detail = body.detail
  throw error
}
```

### Implementation Constraints for This Story

- Do NOT implement any UI components (`TodoInput`, `TodoItem`, `TodoList`, `AppError`, `AppEmpty`) — those are Stories 3.3–3.6
- Do NOT add form validation logic — that lives in `TodoInput.vue` (Story 3.3) and `useTodos`/`api.ts` explicitly do not validate
- Do NOT implement loading skeleton or error display components — Story 4.1
- Do NOT introduce Pinia, Vue Router, or global state libraries — explicitly deferred from v1
- Do NOT add any date parsing library — display dates with `Intl.DateTimeFormat` (done by consuming components, not this story)
- Keep `App.vue` as a structural shell — wire `useTodos()` but leave component slots for Stories 3.3–3.6
- Do NOT add client-side caching or optimistic updates — pessimistic re-fetch is intentional

### Testing Strategy

**`api.ts` tests (mock `fetch`):**
- Use `vi.stubGlobal('fetch', ...)` or `vi.fn()` to mock `fetch`
- Verify correct URLs, methods, headers, and body shapes
- Verify envelope unwrapping (`getTodos` extracts `items`)
- Verify throw behavior on non-2xx responses
- Verify `getErrorMessage()` extraction logic

**`useTodos.ts` tests (mock `api.ts` module):**
- Use `vi.mock('@/services/api')` to mock the api module
- Test reactive state updates (`todos`, `loading`, `error` refs)
- Test that mutations trigger `fetchTodos()` re-fetch
- Test that mutation errors propagate (not swallowed)
- Mount the composable using a wrapper component or `@vue/test-utils` with `setup()` function

**Test file locations:**
- `todo-frontend/src/__tests__/api.spec.ts`
- `todo-frontend/src/__tests__/useTodos.spec.ts`

### Previous Story Intelligence (Story 3.1)

**Learnings from Story 3.1 code review:**
- `process.cwd()` in tests works correctly when invoked via `npm --prefix` — do not use `import.meta.url` in jsdom environment (it returns HTTP URLs, not file URLs)
- Tailwind v3 is installed (not v4) — use `tailwind.config.js` format
- `@` alias is configured in `tsconfig.app.json` paths: `"@/*": ["./src/*"]`
- Vitest environment is `jsdom` — component mounting works but `import.meta.url` is not a file URL
- All scaffold components were removed in Story 3.1 — `src/components/` directory may not exist yet
- `src/style.css` is the canonical entrypoint with Tailwind directives

**Git patterns established:**
- Commit message format: `feat: story X.Y <description>`
- Quality gates: lint, type-check, unit tests, build must all pass
- Frontend quality: `make lint-frontend` and `make test-frontend` targets available

### File-Level Implementation Plan

- Create:
  - `todo-frontend/src/types/todo.ts` — TypeScript interfaces
  - `todo-frontend/src/services/api.ts` — HTTP service functions + `getErrorMessage`
  - `todo-frontend/src/composables/useTodos.ts` — reactive composable
  - `todo-frontend/src/__tests__/api.spec.ts` — api.ts unit tests
  - `todo-frontend/src/__tests__/useTodos.spec.ts` — composable unit tests
- Modify:
  - `todo-frontend/src/App.vue` — wire `useTodos()`, remove placeholder content

### Out of Scope (Do Not Implement Here)

- `TodoInput.vue` (Story 3.3)
- `TaskCheckbox` behavior/component (Story 3.4)
- `TodoItem.vue` interactions (Story 3.5)
- `TodoList` integration, empty variants, full happy-path orchestration (Story 3.6)
- `AppError.vue`, `AppEmpty.vue` display components (Story 3.6 / Epic 4)
- Loading skeleton (Story 4.1)
- Form validation (Story 4.2)
- Keyboard navigation and screen reader support (Story 4.3)

### Project Structure Notes

After this story, the frontend `src/` directory should look like:
```
src/
  App.vue                    # useTodos() instantiated HERE ONLY
  main.ts
  style.css
  types/
    todo.ts                  # Todo, TodoCreate, TodoUpdate, TodoListResponse
  services/
    api.ts                   # 4 typed HTTP functions + getErrorMessage
  composables/
    useTodos.ts              # reactive state + all mutations
  __tests__/
    designFoundation.spec.ts # existing from Story 3.1
    api.spec.ts              # NEW: api.ts unit tests
    useTodos.spec.ts         # NEW: composable unit tests
  assets/
    logo.svg
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.2-API-Service-Layer-&-useTodos-Composable`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#TypeScript-Interface-Contracts`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#useTodos-Composable-Contract`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#api.ts-Service-Contract`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Rules`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Format-Patterns`]
- [Source: `_bmad-output/project-context.md#Critical-Implementation-Rules`]
- [Source: `_bmad-output/project-context.md#Framework-Specific-Rules`]
- [Source: `_bmad-output/implementation-artifacts/3-1-design-system-foundation.md#Review-Findings`]
- [Source: `todo-backend/app/routers/todos.py` — actual API endpoint implementations]
- [Source: `todo-backend/app/schemas.py` — Pydantic schema shapes (TodoCreate, TodoUpdate, TodoResponse)]
- [Source: `todo-frontend/vite.config.ts` — Vite proxy configuration]

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (model ID: gpt-5.3-codex)

### Debug Log References

- Auto-selected first ready story from sprint order: `3-2-api-service-layer-and-use-todos-composable`.
- Loaded project context and story guardrails before implementation.
- Red phase complete: added `api.spec.ts` and `useTodos.spec.ts`; confirmed failing test run due to missing modules.
- Green/refactor phase complete: implemented `types/todo.ts`, `services/api.ts`, `composables/useTodos.ts`, and wired `useTodos()` once in `App.vue`.
- Fixed follow-up test/type issues:
  - Removed template literal URL interpolation in `api.ts` to satisfy Story 3.1 guardrail test.
  - Stabilized `useTodos.spec.ts` deferred fetch resolver typing and behavior.
  - Corrected Vue template ref access (`todoModel.todos.value.length`) for `vue-tsc`.
- Full validation sequence passed:
  - `npm --prefix todo-frontend run lint`
  - `npm --prefix todo-frontend run type-check`
  - `npm --prefix todo-frontend run test:unit -- --run`
  - `npm --prefix todo-frontend run build`
  - `make test-backend`

### Completion Notes List

- Implemented strongly typed todo contracts in `src/types/todo.ts` with `created_at: string`.
- Implemented `src/services/api.ts` with exactly the story-required CRUD functions, envelope unwrapping in `getTodos()`, non-2xx throw handling, and exported `getErrorMessage(e: unknown)`.
- Implemented `src/composables/useTodos.ts` with reactive `todos`, `loading`, `error`, fetch-driven error handling, pessimistic mutation re-fetch, and mutation error propagation.
- Wired `useTodos()` in `App.vue` once, removed Story 3.1 placeholder copy, and kept shell layout intact.
- Added unit tests for API service and composable behavior, including non-2xx throw paths and error message extraction fallbacks.
- Verified no regressions through frontend quality gates and backend regression tests.

### File List

- `_bmad-output/implementation-artifacts/3-2-api-service-layer-and-use-todos-composable.md` (updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)
- `todo-frontend/src/types/todo.ts` (created)
- `todo-frontend/src/services/api.ts` (created)
- `todo-frontend/src/composables/useTodos.ts` (created)
- `todo-frontend/src/App.vue` (modified)
- `todo-frontend/src/__tests__/api.spec.ts` (created)
- `todo-frontend/src/__tests__/useTodos.spec.ts` (created)

### Change Log

- 2026-04-02: Implemented Story 3.2 API service layer and `useTodos` composable with full quality-gate validation and regression checks.
