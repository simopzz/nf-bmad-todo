---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-27'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/product-brief-leapsome-bmad-todo.md'
  - '_bmad-output/planning-artifacts/prd-validation-report.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
workflowType: 'architecture'
project_name: 'leapsome-bmad-todo'
user_name: 'simopzz'
date: '2026-03-26'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
37 FRs across 7 categories:
- **Task Management (FR1–6):** Full CRUD on a single `Todo` entity — create, read, edit, complete/incomplete toggle, delete
- **Display & State (FR7–13):** Reverse-chronological ordering, visual completion distinction, empty/loading/error states, non-destructive error handling, form validation
- **Data Persistence (FR14–15):** SQLite durability across browser refresh and container restart
- **API Contract (FR16–22):** 5 REST endpoints (GET/POST /todos, PATCH/DELETE /todos/{id}, GET /health), consistent error envelope `{"detail": "..."}`, appropriate HTTP status codes
- **Accessibility & Responsive (FR23–27):** Keyboard navigation, accessible names/roles, desktop (≥1280px) and mobile (≥375px) layout fidelity, WCAG 2.1 AA
- **Deployment & Operations (FR28–31):** Single `docker-compose up`, health checks, ≤30s cold-start, configurable API base URL via env var
- **Dev Experience & Quality (FR32–37):** ruff, ty type checking, conventional commits (all pre-commit), ≥70% backend test coverage, ≥5 Playwright E2E scenarios, self-contained README

**Non-Functional Requirements:**
- **Performance:** Task list ≤200ms p95 (Playwright); CRUD operations ≤500ms p95; 100-item list within 100ms with no frame drops below 30fps
- **Security:** No critical OWASP Top 10 (XSS, SQL injection, command injection); no stack traces in API responses
- **Accessibility:** WCAG 2.1 AA, zero axe-core critical violations, keyboard-only operable
- **Maintainability:** ruff zero violations, ty zero type errors, conventional commits enforced, ≥70% meaningful coverage, README-sufficient onboarding

**Scale & Complexity:**

- Primary domain: Full-stack web (SPA + REST API + SQLite)
- Complexity level: Low — single entity, single user, no auth, no real-time
- Estimated architectural components: 4 (Frontend SPA, FastAPI backend, SQLite DB, Nginx)

### Technical Constraints & Dependencies

- **Vue 3 Composition API + Vite** — frontend build toolchain; no Vue Router (single view); Pinia explicitly deferred (component-local state sufficient for v1)
- **FastAPI (Python)** — REST backend; must support CORS for frontend-backend communication in Docker Compose network
- **SQLite via Docker volume** — highest-risk integration point; requires explicit volume mount configuration and file permission handling
- **Nginx** — serves compiled frontend static assets in production container
- **Docker Compose** — multi-container orchestration; no external cloud services; health checks mandatory on all containers
- **No WebSocket / real-time layer** — pure HTTP request/response model is sufficient
- **No authentication for v1** — no session management, no token handling, no user model

### Cross-Cutting Concerns Identified

1. **Error handling** — All 5 API endpoints must return `{"detail": "..."}` envelope; frontend must surface errors without losing user-entered text
2. **WCAG AA accessibility** — Affects every interactive component: checkbox, input, inline edit, delete button
3. **Docker containerization** — All services (frontend, backend, db volume) must be container-native; environment variables bridge frontend ↔ backend URL at build/runtime
4. **Python quality pipeline** — ruff autoformat + ty type checking + conventional commits configured as pre-commit hooks; must be part of repo initialization
5. **Performance budgets** — 200ms list render and 500ms CRUD operations must be verifiable via Playwright timing assertions — not just aspirational targets
6. **UX state machine** — Each todo item has an edit mode (component-local); the app itself has three top-level states (loading, error, loaded); these state transitions must be unambiguous in component design

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — Vue 3 SPA (frontend) + FastAPI REST API (backend) + SQLite persistence. Both services containerized via Docker Compose. Stack was pre-selected in the Product Brief based on AI tooling maturity and methodology fit.

No deviation from the declared stack is considered; this step documents exact initialization commands with current versions.

### Frontend: `npm create vue@latest`

**Initialization Command:**
```bash
npm create vue@latest
# Project name: todo-frontend
# TypeScript: Yes
# JSX: No
# Vue Router: No (single-view app, no routing needed)
# Pinia: No (component-local state sufficient for v1)
# Vitest: Yes (unit testing)
# E2E Testing: No (Playwright installed separately at project root)
# ESLint: Yes
# Prettier: Yes
# Vue DevTools: Yes
```

**Architectural decisions made by scaffold:**
- Vite 8.x build tooling (Rolldown-powered, ~10-30x faster builds)
- TypeScript configured out of the box
- Vitest for component unit tests
- ESLint + Prettier for code quality
- Single-view structure (no router) — clean starting point

### Backend: `uv init` + FastAPI

**Initialization Command:**
```bash
uv init todo-backend
cd todo-backend
uv add fastapi "uvicorn[standard]" sqlalchemy aiosqlite
uv add --dev ruff ty pytest pytest-cov httpx
```

**Why `uv` over `pip`/`poetry`:**
- 10-100x faster dependency resolution (written in Rust, from Astral — same team as ruff and ty)
- Single tool replaces pip, virtualenv, pip-tools — zero setup ceremony
- Aligns perfectly with ruff and ty (all Astral tools, same workflow)

**FastAPI version:** 0.135.2 (Python 3.12+) | **Vite version:** 8.0.2

**Architectural decisions made:**
- `uv` manages virtual environment and lockfile (`uv.lock`)
- `ruff` handles formatting AND linting (replaces black + flake8 + isort)
- `ty` handles type checking (replaces mypy) — from Astral, same toolchain as ruff
- `pytest` + `pytest-cov` for unit/integration tests (≥70% coverage requirement)
- `httpx` for async test client (FastAPI TestClient)

**Note:** Project initialization (scaffolding both `todo-frontend` and `todo-backend` directories, configuring Docker Compose, pre-commit hooks) should be the **first implementation story**.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- SQLAlchemy ORM + `CREATE TABLE IF NOT EXISTS` on startup
- CORS: explicit origins via `ALLOWED_ORIGINS` env var (production only — dev uses Vite proxy)
- API prefix: `/api/v1/`
- Tailwind CSS for styling
- Nginx reverse proxy (single port 80)
- Named Docker volume for SQLite persistence (`db-data` → `/app/data` → `DATABASE_URL`)
- Pydantic schemas and SQLAlchemy models are **independent layers** — explicit mapping in `repository.py`

**Important Decisions (Shape Architecture):**
- Feature-grouped component structure (`components/todos/` only — no `ui/` or `shared/` folders)
- `useTodos()` composable + `api.ts` service module — **pessimistic updates with full re-fetch**
- `VITE_API_URL` always `""` (empty string); Vite dev proxy handles `/api/` routing in development
- `/api/v1/health` verifies DB connectivity, not just HTTP availability
- `TodoCreate.title: str = Field(min_length=1, max_length=500)`
- FastAPI docs disabled in production via `ENABLE_DOCS` env var

**Deferred Decisions (Post-MVP):**
- Authentication / user accounts
- Pinia state management
- Vue Router
- Alembic migrations — `CREATE TABLE IF NOT EXISTS` does not handle column additions; Phase 2 schema changes require manual `ALTER TABLE` or volume reset

---

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | SQLAlchemy ORM + `aiosqlite` | Async-native, tight Pydantic integration, well-established FastAPI pattern |
| Migrations | `CREATE TABLE IF NOT EXISTS` on startup | Single entity, greenfield — Alembic overhead unwarranted for v1. **Note:** column additions in Phase 2 require `ALTER TABLE` or volume reset |
| Validation | Pydantic models (FastAPI default) | Request/response validation, serialization, and OpenAPI docs in one |
| Title constraint | `Field(min_length=1, max_length=500)` | Prevents empty submissions and payload flooding |
| Database path binding | `db-data` volume → `/app/data` mount → `sqlite+aiosqlite:////app/data/todos.db` | **All three must agree** — a mismatch causes silent data loss on container restart |
| WAL sidecar files | `todos.db`, `todos.db-wal`, `todos.db-shm` may all exist on volume | All three constitute the database state — do not copy `todos.db` alone for backup |

### Layer Separation

| Layer | Module | Responsibility |
|-------|--------|----------------|
| Domain / API | `schemas.py` — `TodoCreate`, `TodoResponse` (Pydantic) | API contract; independent of storage shape |
| Repository | `repository.py` — `TodoRepository` | Explicit mapping between domain and storage; only layer that changes if storage changes |
| Storage | `models.py` — `TodoRecord` (SQLAlchemy ORM) | Database representation; isolated from API contract |

Pydantic schemas and SQLAlchemy models are **independent** — no `from_attributes=True` coupling. `repository.py` owns the mapping. Switching storage only touches `TodoRecord` and `TodoRepository`.

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Authentication | None (v1) | Single user, local app — no auth surface area |
| CORS | Explicit origins via `ALLOWED_ORIGINS` env var | Production-only guard; Vite proxy eliminates CORS in development |
| Input validation | Pydantic request bodies + `Field` constraints | XSS and injection prevention via typed, validated models |
| Error responses | `{"detail": "human-readable message"}` envelope | Consistent across all 5 endpoints; no stack traces exposed |
| FastAPI docs | Disabled in production via `ENABLE_DOCS` env var | Prevents interactive API access in deployed containers |
| `.env` files | In `.gitignore`; `.env.example` provided | Prevents accidental credential/config commits |
| CORS startup log | `logger.info(f"CORS origins: {allowed_origins}")` | Makes misconfiguration immediately visible |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Style | REST | Sufficient for 5 CRUD endpoints; no real-time requirement |
| URL prefix | `/api/v1/` | Enables clean Nginx routing; future-versioning ready |
| Documentation | FastAPI auto-generated OpenAPI — dev only | Disabled in production; enabled locally via `ENABLE_DOCS=true` |
| HTTP semantics | 200 (GET/PATCH), 201 (POST), 204 (DELETE), 400/404/500 (errors) | Standard; explicit in Product Brief API contract |
| Health check | `GET /api/v1/health` queries SQLite | Must confirm DB file is accessible — not just "uvicorn started" |

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSS | Tailwind CSS | Design token system maps to `tailwind.config.js`; accelerates Editorial Functionalism implementation |
| Component structure | `components/todos/` **only** | No `ui/` or `shared/` folders in v1 — convention explicit to prevent AI agents creating ad-hoc folders |
| Components | `TodoList.vue`, `TodoItem.vue`, `TodoInput.vue`, `AppError.vue`, `AppEmpty.vue` | One component per UI concern |
| API layer | `useTodos()` composable + `api.ts` service module | Composable owns reactive state; `api.ts` owns typed HTTP calls — independently testable |
| Update strategy | **Pessimistic with full re-fetch** | After each mutation, re-fetch full list from API. No optimistic updates or rollback logic. Simpler, debuggable, meets 500ms budget |
| Dev API routing | Vite proxy: `/api/` → `http://localhost:8000` in `vite.config.ts` | `VITE_API_URL` always `""`. Dev and production behave identically |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SQLite persistence | Named Docker volume `db-data` → `/app/data` | Portable, no host file permission issues. Volume name + mount path + DATABASE_URL must all agree |
| Frontend serving | Nginx reverse proxy, single port 80 | `/api/` → FastAPI:8000; everything else → Vue static assets |
| Nginx routing | `location /api/ { proxy_pass http://backend:8000/api/; }` **only** | No wildcard proxy — prevents accidental FastAPI root exposure |
| `VITE_API_URL` | Intentionally absent from `docker-compose.yml` — always `""` | Nginx proxy handles routing; no build-time URL baking risk |
| Environment variables | `DATABASE_URL`, `ALLOWED_ORIGINS`, `ENABLE_DOCS` (backend) | All environment-specific config externalized |
| Container health checks | `GET /api/v1/health` (DB connectivity); Nginx `GET /` | Backend healthy only when SQLite is accessible |
| Data safety | `docker-compose down` preserves data; `docker-compose down -v` **permanently deletes all todo data** | README must warn explicitly |

### Decision Impact Analysis

**Implementation Sequence:**
1. Repo scaffold (pre-commit hooks, `.gitignore`, `.env.example`, `docker-compose.yml`, `vite.config.ts` with proxy)
2. Backend: `uv init` → `models.py` (SQLAlchemy) → `schemas.py` (Pydantic) → `repository.py` (mapping) → FastAPI routes → `/health` with DB check → pytest suite
3. Frontend: `npm create vue@latest` → Tailwind config → `api.ts` → `useTodos()` (pessimistic) → components in `components/todos/`
4. Docker: Nginx config (explicit `location /api/`) → multi-stage Dockerfiles → named volume with explicit path binding → health checks
5. E2E: Playwright suite against `docker-compose up`

**Cross-Component Dependencies:**
- `VITE_API_URL` is always `""` — Vite proxy config in `vite.config.ts` is the dev routing mechanism; `ALLOWED_ORIGINS` is production-only
- Volume name, container mount path, and `DATABASE_URL` must all reference `/app/data` — divergence causes silent data loss
- `repository.py` is the only file that references both `TodoRecord` (SQLAlchemy) and `TodoResponse`/`TodoCreate` (Pydantic) — all storage changes are isolated here
- `ENABLE_DOCS=true` in dev `.env`; absent or `false` in production

## Implementation Patterns & Consistency Rules

**29 conflict areas identified** across naming, structure, format, process, and infrastructure.

---

### Naming Patterns

**Database Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| Table names | `snake_case`, plural | `todos` |
| Column names | `snake_case` | `id`, `title`, `completed`, `created_at` |
| SQLAlchemy class | `PascalCase` + `Record` suffix | `TodoRecord` |

**API Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| Endpoint paths | `snake_case`, plural nouns | `/api/v1/todos` |
| Path parameters | `{id}` (FastAPI style) | `/api/v1/todos/{id}` |
| JSON field names | `snake_case` throughout | `{"created_at": "..."}` |
| Query parameters | `snake_case` | `?completed=true` |

**Python Code Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| Functions | `snake_case` | `get_all_todos()` |
| Classes | `PascalCase` | `TodoRepository` |
| Pydantic models | `PascalCase` | `TodoCreate`, `TodoResponse` |
| Files | `snake_case.py` | `repository.py` |
| Constants | `UPPER_SNAKE_CASE` | `DATABASE_URL` |

**TypeScript/Vue Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| Components | `PascalCase.vue` | `TodoItem.vue` |
| Composables | `use` + `PascalCase.ts` | `useTodos.ts` |
| Service modules | `camelCase.ts` | `api.ts` |
| TypeScript interfaces | `PascalCase` | `Todo`, `TodoCreate` |
| Variables/functions | `camelCase` | `fetchTodos()`, `isLoading` |
| Template props | `kebab-case` | `:is-editing="..."` |

---

### TypeScript Interface Contracts

```typescript
// types/todo.ts — canonical definitions, no deviations
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

`created_at` is **always `string`** in the frontend. Display using `Intl.DateTimeFormat` — no date library:
```typescript
new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(todo.created_at))
```

---

### Pydantic Schema Contracts

```python
# schemas.py
class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)

class TodoUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    completed: bool | None = None
    model_config = ConfigDict(extra="forbid")   # reject unknown fields
    # Empty body (title=None, completed=None) → raise ValueError → HTTP 400

class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool
    created_at: datetime
```

`TodoListResponse` lives in `schemas.py` but is an implementation detail of `api.ts` — not exposed to route handlers or composables directly.

---

### Structure Patterns

**Backend directory layout:**
```
todo-backend/
  app/
    main.py          # FastAPI instantiation, CORS middleware, router registration, startup log
    models.py        # SQLAlchemy ORM — TodoRecord ONLY
    schemas.py       # Pydantic — TodoCreate, TodoUpdate, TodoResponse, TodoListResponse
    repository.py    # TodoRepository — all DB operations + domain↔storage mapping
    database.py      # engine, async session factory, create_tables() — importable without side effects
    routers/
      todos.py       # all /api/v1/todos routes
      health.py      # GET /api/v1/health (queries SQLite)
  tests/
    conftest.py      # shared fixtures: test engine, test session, test client
    test_todos.py
    test_health.py
  pyproject.toml     # includes [tool.ruff] config
  .pre-commit-config.yaml
  Dockerfile
```

**Frontend directory layout:**
```
todo-frontend/
  src/
    App.vue                    # useTodos() instantiated HERE ONLY; state passed via props
    components/
      todos/                   # ONLY subfolder — no ui/, shared/, or common/
        TodoList.vue           # owns editingId ref; renders TodoItem list
        TodoItem.vue           # display + inline edit mode; emits editStart/editEnd/toggleComplete/delete
        TodoInput.vue          # new todo input; client-side validation lives HERE
        AppError.vue           # reads error from props (fetch failures only)
        AppEmpty.vue           # empty state display
    composables/
      useTodos.ts              # reactive state + all mutations
    services/
      api.ts                   # typed HTTP functions; handles TodoListResponse internally
    types/
      todo.ts                  # Todo, TodoCreate, TodoUpdate, TodoListResponse interfaces
  tests/
    unit/
  index.html                   # includes Google Fonts: Plus Jakarta Sans, Inter
  vite.config.ts               # Vite proxy: /api/ → http://localhost:8000
  tailwind.config.js           # design tokens: brand.emerald, font.display/body, gap.task
  playwright.config.ts         # baseURL: 'http://localhost:80' ALWAYS
```

---

### Format Patterns

**API Response Formats:**

| Scenario | Format | Rationale |
|----------|--------|-----------|
| GET list | `{"items": [...]}` | Envelope preserves pagination extensibility (Phase 2). **Do not revert to bare array.** |
| POST / PATCH | Direct `TodoResponse` object | Single resource — no envelope needed |
| DELETE | HTTP 204, empty body | Standard REST |
| All errors | `{"detail": "human-readable message"}` | FastAPI default; no stack traces |

**JSON field naming:** `snake_case` throughout. No camelCase transform. TypeScript interfaces mirror API shape exactly.

**Date format:** ISO 8601 with timezone from backend. Display via `Intl.DateTimeFormat` in frontend. No date library.

---

### `useTodos()` Composable Contract

```typescript
// composables/useTodos.ts — complete public API
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

**Instantiation rule:** `useTodos()` is called **once, in `App.vue` only**. State and methods are passed to children via props. Child components never call `useTodos()` directly.

**Update strategy — pessimistic with full re-fetch:**
```typescript
async function createTodo(title: string) {
  loading.value = true
  error.value = null
  try {
    await api.createTodo({ title })
    await fetchTodos()    // always re-fetch — never splice todos.value manually
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}
```
**Rationale:** Pessimistic re-fetch is intentional. ~5KB payload is negligible on localhost. Zero reconciliation logic is the simplicity dividend. Do not "optimise" this without explicit architectural approval.

**Error handling split:**
- `useTodos().error` — set by `fetchTodos()` failures only; displayed via `AppError.vue`
- Mutation errors (`createTodo`, `updateTodo`, `deleteTodo`) — handled by **local `ref`s in the calling component**; displayed inline

```typescript
// TodoInput.vue — local mutation error
const mutationError = ref<string | null>(null)
async function handleSubmit() {
  try {
    await createTodo(inputTitle.value)
    inputTitle.value = ''        // clear only on success
  } catch (e) {
    mutationError.value = getErrorMessage(e)
    // inputTitle.value preserved — user can retry without retyping
  }
}
```

---

### `TodoItem` Component Contract

**Edit mode ownership:**
```typescript
// TodoList.vue owns editingId
const editingId = ref<number | null>(null)
// Passed to TodoItem as: :is-editing="editingId === todo.id"
```

**Canonical emit names (fixed — no variations):**
```typescript
const emit = defineEmits<{
  editStart: [id: number]
  editEnd: []
  toggleComplete: [id: number, completed: boolean]
  delete: [id: number]
}>()
```

**Edit mode behaviour:**
- Enter → confirm edit → call `updateTodo()` → `editEnd`
- Escape → cancel → restore original title → `editEnd` (no API call)
- Only one item in edit mode at a time — enforced by `editingId` in `TodoList`

**Delete behaviour:** Single click, no confirmation dialog. Intentional by proximity.

**Form validation:** Lives in `TodoInput.vue` only. `useTodos.createTodo()` and `api.ts` do not validate. Backend is last line of defence.

---

### `api.ts` Service Contract

```typescript
// services/api.ts — pure async functions, no state, throws on error
export async function getTodos(): Promise<Todo[]>        // unwraps items from envelope internally
export async function createTodo(data: TodoCreate): Promise<Todo>
export async function updateTodo(id: number, data: TodoUpdate): Promise<Todo>
export async function deleteTodo(id: number): Promise<void>
// No additional functions — API surface is exactly 5 endpoints
```

`TodoListResponse` is used **only inside `getTodos()`** — never imported or referenced elsewhere.

`api.ts` performs **no data transformation** — returns API response as-is (after envelope unwrapping). No sorting, filtering, or field mapping.

---

### Repository Contract

```python
# repository.py — canonical method signatures (type hints enforced by ruff)
class TodoRepository:
    async def get_all(self) -> list[TodoResponse]: ...
    async def create(self, data: TodoCreate) -> TodoResponse: ...
    async def update(self, id: int, data: TodoUpdate) -> TodoResponse: ...
    async def delete(self, id: int) -> None: ...
```

**Layer rules:**
- Route handlers import `TodoRepository` only — never `TodoRecord`
- `TodoRecord` is referenced only inside `repository.py`
- Repository is deliberately flat — **no abstract base classes, no interfaces**
- The repository pattern is more structured than strictly necessary for v1; this is intentional for storage-layer independence

**Session management:**
```python
# Every route handler receives a fresh session via Depends
async def list_todos(session: AsyncSession = Depends(get_session)):
    repo = TodoRepository(session)
```
Never instantiate `AsyncSession` directly. Never share sessions across requests.

---

### Tailwind Design Token Rules

```javascript
// tailwind.config.js — canonical token names
theme: {
  extend: {
    colors: {
      brand: { emerald: '#006C4A' }   // completion accent ONLY — no other uses
    },
    fontFamily: {
      display: ['Plus Jakarta Sans', 'sans-serif'],  // todo titles, headings
      body: ['Inter', 'sans-serif'],                  // UI labels, chrome
    }
  }
}
```

**Rules:**
- Never hardcode `#006C4A` — always use `text-brand-emerald` / `bg-brand-emerald`
- Never use standard Tailwind `emerald-*` scale — only `brand.emerald`
- Tailwind classes must be **complete literal strings** — never dynamically constructed:
  - ✅ `class="text-brand-emerald"`
  - ❌ `` class=`text-${colorVar}` `` (purged from production build)
- Fonts must be imported in `index.html` before the Vite entry point

---

### Infrastructure Patterns

**`docker-compose.yml` requirements:**
- `depends_on: condition: service_healthy` for frontend → backend dependency
- Backend health check queries SQLite — not just HTTP up
- Named volume `db-data` mounted at `/app/data` in backend container
- `VITE_API_URL` intentionally absent — always empty string

**Backend Dockerfile:**
- Multi-stage build: build stage (uv install) + runtime stage (copy app)
- Runtime stage runs as non-root user (`USER appuser`)
- Volume directory ownership set in Dockerfile before `USER` switch

**Nginx configuration:**
- Root: `/usr/share/nginx/html` (maps to `dist/` from build)
- `include /etc/nginx/mime.types` — never minimal config
- `Cache-Control: no-cache` for `index.html`
- `Cache-Control: max-age=31536000, immutable` for `assets/**` (hashed filenames)
- `location /api/ { proxy_pass http://backend:8000/api/; }` — explicit, no wildcard

**Pre-commit:**
- `.pre-commit-config.yaml` at **repository root** (not inside `todo-backend/`)
- `pyproject.toml` includes `[tool.ruff]` section with project-specific config
- `ty` runs as a pre-commit hook for type checking (zero errors required)
- `README` lists `pre-commit install` as a required setup step

---

### Test Patterns

**Backend — `conftest.py` canonical fixture:**
```python
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(autouse=True)
async def setup_db(engine):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```
- Always in-memory SQLite — never file-based test DB
- `autouse=True` — every test gets fresh schema
- `drop_all` after each test — no state bleed
- Note: transaction rollback is preferred at scale (>100 tests); `drop_all` is sufficient for v1

**Playwright E2E:**
- `baseURL: 'http://localhost:80'` — always the Docker Compose stack
- CI runs `docker-compose up --wait` before any Playwright command
- Tests never assert on specific `id` values — assert on title content or list length
- Each test is fully independent — creates and cleans up its own data

---

### Enforcement Rules

**All AI agents MUST:**
- Route all DB operations through `TodoRepository` — never query `TodoRecord` in route handlers
- Call `fetchTodos()` after every mutation — never manually patch `todos.value`
- Place all new Vue components in `components/todos/` only
- Add all Python dependencies via `uv add`
- Use `Depends(get_session)` for every route that touches the DB
- Use complete literal Tailwind class strings — no dynamic construction

**Anti-patterns (never do these):**
- ❌ `TodoRecord` imported in route handlers
- ❌ `from_attributes=True` on Pydantic schemas
- ❌ `todos.value.push(newTodo)` or `todos.value.filter(...)` after mutations — always re-fetch
- ❌ `camelCase` JSON fields (`{"createdAt": ...}`) — always `snake_case`
- ❌ `components/ui/`, `components/shared/`, or any folder besides `components/todos/`
- ❌ Inline `fetch()` calls in Vue components — always use `api.ts`
- ❌ `v-html` for user-supplied content — always `{{ todo.title }}`
- ❌ `window.location.reload()` after mutations — always call `fetchTodos()`
- ❌ `useTodos()` called in any component other than `App.vue`
- ❌ Dynamic Tailwind class construction with string interpolation
- ❌ Returning bare array from `GET /api/v1/todos` — always `{"items": [...]}`
- ❌ Abstract base classes or interfaces on `TodoRepository`
- ❌ Any endpoint beyond the 5 defined in the API contract

## Project Structure & Boundaries

### Complete Project Directory Structure

```
leapsome-bmad-todo/                    # repository root
├── README.md                          # setup, run, test instructions
├── docker-compose.yml                 # production stack definition
├── .env.example                       # safe defaults; .env is gitignored
├── .gitignore                         # includes .env, __pycache__, node_modules, dist
├── .pre-commit-config.yaml            # ruff, type hints, conventional commits — REPO ROOT
│
├── todo-backend/
│   ├── Dockerfile                     # multi-stage; runtime runs as non-root user
│   ├── pyproject.toml                 # uv project config + [tool.ruff] config
│   ├── uv.lock                        # committed lockfile
│   ├── .python-version                # pins Python 3.12
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app, CORS middleware, router registration,
│   │   │                              # startup log of ALLOWED_ORIGINS
│   │   ├── models.py                  # SQLAlchemy — TodoRecord ONLY
│   │   ├── schemas.py                 # Pydantic — TodoCreate, TodoUpdate,
│   │   │                              # TodoResponse, TodoListResponse
│   │   ├── repository.py              # TodoRepository — all DB ops + domain↔storage mapping
│   │   ├── database.py                # engine, AsyncSessionLocal, create_tables()
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── todos.py               # GET/POST /api/v1/todos,
│   │       │                          # PATCH/DELETE /api/v1/todos/{id}
│   │       └── health.py              # GET /api/v1/health (queries SQLite)
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py                # in-memory DB, autouse fixture, test client
│       ├── test_todos.py              # CRUD + error cases (≥70% coverage)
│       └── test_health.py             # health check with DB up and DB down scenarios
│
├── todo-frontend/
│   ├── Dockerfile                     # multi-stage: build (node) + serve (nginx)
│   ├── nginx.conf                     # location /api/ proxy; mime.types; cache headers
│   ├── index.html                     # Google Fonts: Plus Jakarta Sans, Inter
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts                 # proxy /api/ → http://localhost:8000 (dev only)
│   ├── tailwind.config.js             # brand.emerald, font.display/body tokens
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── .prettierrc
│   └── src/
│   │   ├── main.ts                    # Vue app entry point
│   │   ├── App.vue                    # useTodos() instantiated HERE ONLY
│   │   ├── style.css                  # @tailwind base/components/utilities
│   │   ├── types/
│   │   │   └── todo.ts                # Todo, TodoCreate, TodoUpdate, TodoListResponse
│   │   ├── services/
│   │   │   └── api.ts                 # 4 typed HTTP functions; unwraps items envelope
│   │   ├── composables/
│   │   │   └── useTodos.ts            # todos, loading, error refs + 4 mutations
│   │   └── components/
│   │       └── todos/                 # ONLY subfolder — no ui/ or shared/
│   │           ├── TodoList.vue       # owns editingId ref
│   │           ├── TodoItem.vue       # display + inline edit; 4 canonical emits
│   │           ├── TodoInput.vue      # new todo input; client-side validation here
│   │           ├── AppError.vue       # fetch error display
│   │           └── AppEmpty.vue       # empty state display
│   └── tests/
│       └── unit/
│           ├── useTodos.test.ts       # composable unit tests (mocked api.ts)
│           ├── TodoInput.test.ts      # validation, submit, error display
│           └── TodoItem.test.ts       # edit mode, toggle, delete emits
│
└── e2e/                               # Playwright — system-level, targets Docker stack
    ├── package.json                   # playwright dependency
    ├── playwright.config.ts           # baseURL: http://localhost:80
    └── tests/
        ├── todo-crud.spec.ts          # create, edit, toggle, delete (Journey 1)
        ├── todo-error.spec.ts         # backend unreachable, retry (Journey 2)
        └── todo-empty.spec.ts         # empty state, first-run experience
```

---

### Architectural Boundaries

**API Boundary — the only public interface:**

```
External:  Browser → GET/POST /api/v1/todos
                   → PATCH/DELETE /api/v1/todos/{id}
                   → GET /api/v1/health
                   → GET / (static assets via Nginx)

Internal:  Nginx → FastAPI:8000 (Docker network, /api/ prefix only)
           FastAPI → SQLite (/app/data/todos.db on named volume db-data)
```

**Layer Boundaries — backend:**

```
HTTP Layer      routers/todos.py, routers/health.py
                  ↕ Pydantic schemas (TodoCreate, TodoResponse)
Domain Layer    repository.py (TodoRepository)
                  ↕ explicit mapping (_to_response())
Storage Layer   models.py (TodoRecord) + database.py
                  ↕ aiosqlite driver
Data            /app/data/todos.db (Docker named volume: db-data)
```

**Layer Boundaries — frontend:**

```
View Layer      components/todos/*.vue
                  ↕ props + emits
Composable      composables/useTodos.ts (todos, loading, error)
                  ↕ function calls
Service         services/api.ts (HTTP only, no state)
                  ↕ HTTP/JSON (via Nginx or Vite proxy)
API             /api/v1/*
```

---

### Requirements to Structure Mapping

| FR Category | Primary Files |
|-------------|---------------|
| FR1–6 (CRUD) | `routers/todos.py`, `repository.py`, `TodoInput.vue`, `TodoItem.vue`, `useTodos.ts`, `api.ts` |
| FR7–13 (Display & States) | `TodoList.vue`, `TodoItem.vue`, `AppError.vue`, `AppEmpty.vue`, `useTodos.ts` |
| FR14–15 (Persistence) | `database.py`, `models.py`, `docker-compose.yml` (volume config) |
| FR16–22 (API Contract) | `routers/todos.py`, `routers/health.py`, `schemas.py` |
| FR23–27 (Accessibility) | All `components/todos/*.vue` (ARIA, keyboard nav, WCAG AA) |
| FR28–31 (Deployment) | `docker-compose.yml`, both `Dockerfile`s, `nginx.conf` |
| FR32–37 (Dev Quality) | `.pre-commit-config.yaml`, `pyproject.toml`, `tests/`, `e2e/`, `README.md` |

---

### Data Flow

**Happy path (create):**
```
User types title → TodoInput.vue validates (client-side)
  → useTodos.createTodo() → api.createTodo() → POST /api/v1/todos
  → TodoRepository.create() → TodoRecord inserted → TodoResponse returned
  → useTodos.fetchTodos() → GET /api/v1/todos → {"items": [...]}
  → todos.value updated → TodoList.vue re-renders
```

**Error path:**
```
API failure → api.ts throws
  → fetchTodos failure: useTodos.error set → AppError.vue shown
  → mutation failure: component localError ref set → inline error shown
                      user input preserved in TodoInput.vue
```

**Edit mode state flow:**
```
User clicks edit → TodoItem emits editStart(id)
  → TodoList.editingId = id → TodoItem receives isEditing=true
  → User types → Enter: updateTodo() called → fetchTodos() → editEnd
               → Escape: editEnd emitted → editingId = null (no API call)
```

### Docker Compose Canonical Configuration

**Service names (fixed — referenced by Nginx proxy and health checks):**
- Backend service: `backend` (FastAPI, internal port 8000)
- Frontend service: `frontend` (Nginx, external port 80)
- Volume name: `db-data`

**`.env.example` (canonical defaults):**
```bash
# Backend
DATABASE_URL=sqlite+aiosqlite:////app/data/todos.db
ALLOWED_ORIGINS=http://localhost,http://localhost:80
ENABLE_DOCS=true
```

**Backend health check (uses Python — always available in image):**
```yaml
healthcheck:
  test: ["CMD", "python", "-c",
         "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 10s
```

## Architecture Validation Results

### Coherence Validation ✅

All technology choices are compatible: Vue 3 + TypeScript + Vite 8 + Tailwind; FastAPI 0.135.2 + Python 3.12 + SQLAlchemy + aiosqlite; uv + ruff + ty (same Astral toolchain); Nginx reverse proxy + Vite dev proxy (same `/api/` URL shape, different runtime mechanisms). Named volume, non-root user, and `DATABASE_URL` all reference `/app/data` consistently. `snake_case` JSON flows consistently from Python through TypeScript interfaces. Repository pattern aligns with independent Pydantic/SQLAlchemy layer decision. Pessimistic re-fetch aligns with component-local state model. `useTodos()` singleton aligns with props-down communication. `{"items": [...]}` envelope aligns with `TodoListResponse` in both Pydantic and TypeScript.

### Requirements Coverage Validation

| Category | Status | Notes |
|----------|--------|-------|
| FR1–6 (CRUD) | ✅ Full | Routes + Repository + Components + Composable |
| FR7–13 (Display & State) | ✅ Full | AppError, AppEmpty, TodoItem edit mode, useTodos loading/error |
| FR14–15 (Persistence) | ✅ Full | SQLAlchemy + named volume + startup `create_tables()` |
| FR16–22 (API Contract) | ✅ Full | 5 endpoints, schemas, error envelope, HTTP semantics |
| FR23–27 (Accessibility) | ⚠️ Partial | WCAG AA required in all components; specific ARIA patterns deferred to story-level |
| FR28–31 (Deployment) | ✅ Full | docker-compose, Dockerfiles, Nginx, health checks, cold-start |
| FR32–37 (Dev Quality) | ✅ Full | pre-commit, ruff, pytest, Playwright, README |
| NFR1–4 (Performance) | ✅ Full | Simple HTTP + SQLite supports budgets; Playwright timing assertions enforce them |
| NFR5–7 (Security) | ✅ Full | Pydantic validation, ORM (no SQL injection), Vue escaping (no XSS), no stack traces |
| NFR8–10 (Accessibility) | ⚠️ Partial | WCAG AA target set; implementation specifics at component level |
| NFR11–15 (Maintainability) | ✅ Full | ruff, ty, conventional commits, ≥70% coverage, README onboarding |

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with versions. 29 agent conflict points identified and resolved. Anti-patterns enumerated (12 explicit prohibitions). Rationale documented for non-obvious choices (pessimistic re-fetch, items envelope, repository pattern).

**Structure Completeness:** Every file named in the directory tree. Layer boundaries diagrammed. Data flow documented for happy path, error path, and edit mode.

**Pattern Completeness:** Naming conventions cover all layers. TypeScript interfaces and Pydantic schemas fully specified. Composable contract, service contract, and repository contract all defined. Infrastructure patterns cover Docker, Nginx, pre-commit, and test setup.

### Gap Analysis Results

**Critical gaps resolved:**
1. Docker Compose service names — `backend`, `frontend`, `db-data` now canonical
2. `.env.example` content — variables and defaults specified
3. Backend health check command — Python-based, no curl/wget dependency

**Important gap acknowledged:**
- WCAG AA implementation specifics (ARIA landmark regions, focus management) — deferred to story-level implementation; architectural intent is clear

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (37 FRs, 15 NFRs, 3 user journeys)
- [x] Scale and complexity assessed (Low — single entity, single user, greenfield)
- [x] Technical constraints identified (SQLite volume, Nginx proxy, no auth v1)
- [x] Cross-cutting concerns mapped (error handling, WCAG, Docker, quality pipeline)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions (FastAPI 0.135.2, Vite 8, Python 3.12)
- [x] Technology stack fully specified
- [x] Layer separation explicit (Pydantic ≠ SQLAlchemy, repository as bridge)
- [x] Security decisions documented (CORS, input validation, no stack traces)

**✅ Implementation Patterns**
- [x] Naming conventions established across all layers
- [x] TypeScript and Pydantic contracts fully specified
- [x] Composable, service, and repository contracts defined
- [x] 12 anti-patterns explicitly prohibited
- [x] Infrastructure failure modes documented with mitigations

**✅ Project Structure**
- [x] Complete directory structure (every file named)
- [x] Layer boundary diagrams (frontend + backend)
- [x] Data flow diagrams (create, error, edit mode)
- [x] FR1–37 mapped to specific files

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High** — all major conflict points identified, debated through multiple elicitation rounds (Architecture Decision Records, Red Team, Failure Mode Analysis, Critical Perspective, Graph of Thoughts, Code Review Gauntlet, What If Scenarios), and resolved with documented rationale.

**Key Strengths:**
- Layer separation with explicit repository bridge — storage changes are fully isolated
- 29 agent conflict points resolved — minimal implementation ambiguity remains
- Pessimistic re-fetch with documented rationale — agents won't silently "optimise" it
- `{"items": [...]}` envelope with documented rationale — pagination-ready, no breaking change risk
- Infrastructure failure modes baked into patterns — Docker/SQLite/Nginx pitfalls documented upfront

**Areas for Future Enhancement (Phase 2+):**
- Pinia state management (cross-component state needs)
- Alembic migrations (schema evolution)
- Vue Router (multiple views)
- Authentication layer (multi-user)
- Rate limiting and pagination (scale)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions as documented — rationale is explicit for non-obvious choices
- Use implementation patterns consistently — conflict points are pre-resolved
- Respect project structure and layer boundaries — the repository is the only file that crosses the domain/storage boundary
- Refer to this document for all architectural questions before making independent decisions

**First Implementation Story:**
```bash
# Repository scaffold
mkdir leapsome-bmad-todo && cd leapsome-bmad-todo
git init
# Create .gitignore, .env.example, .pre-commit-config.yaml, docker-compose.yml

# Backend
uv init todo-backend && cd todo-backend
uv add fastapi "uvicorn[standard]" sqlalchemy aiosqlite
uv add --dev ruff ty pytest pytest-cov httpx

# Frontend
npm create vue@latest todo-frontend
# Select: TypeScript ✅ | Vue Router ❌ | Pinia ❌ | Vitest ✅ | E2E ❌ | ESLint ✅ | Prettier ✅
cd todo-frontend && npm install tailwindcss @tailwindcss/vite

# E2E
mkdir e2e && cd e2e && npm init -y && npm install -D @playwright/test
```
