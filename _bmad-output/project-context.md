---
project_name: 'leapsome-bmad-todo'
user_name: 'simopzz'
date: '2026-03-27'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'critical_rules']
status: 'complete'
rule_count: 45
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Vue 3 Composition API + TypeScript | Latest (`npm create vue@latest`) |
| Build tool | Vite | 8.0.2 |
| CSS framework | Tailwind CSS | Latest |
| Unit testing | Vitest | Latest (from Vue scaffold) |
| E2E testing | Playwright | Project root |
| Backend framework | FastAPI | 0.135.2 |
| Language | Python | 3.12+ |
| Async ORM | SQLAlchemy + aiosqlite | Latest |
| Schema validation | Pydantic v2 | — |
| Package manager | uv (Astral) | Latest |
| Linting/Formatting | ruff | Latest |
| Type checking | ty (Astral) | Latest |
| Test tooling | pytest + pytest-cov + httpx | Latest |
| Database | SQLite | via Docker named volume |
| Reverse proxy | Nginx | — |
| Orchestration | Docker Compose | — |

---

## Critical Implementation Rules

### Language-Specific Rules

**TypeScript:**
- `created_at` is always `string` — never `Date`. Display: `new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(todo.created_at))`. No date library.
- `TodoListResponse` is internal to `api.ts` only — never re-exported or passed to composables/components
- `VITE_API_URL` is always `""` (empty string) — Vite proxy handles `/api/` in dev; Nginx handles it in prod. Never set to a URL.
- TypeScript interfaces use `snake_case` fields mirroring API shape exactly — no camelCase transform

**Python:**
- Use `uv` exclusively — never `pip install` or `poetry`. Add deps: `uv add <pkg>` / `uv add --dev <pkg>`
- `ruff` handles formatting AND linting — do not add black, flake8, or isort
- `ty` handles type checking — do not add mypy; run via `uv run ty check`
- All functions require type hints (pre-commit enforced by ty)
- Use `str | None` union syntax (Python 3.10+ style) — not `Optional[str]`
- `TodoUpdate` with both fields `None` → raise `ValueError` → HTTP 400. Validate in schema, not route handler.
- `TodoUpdate` has `model_config = ConfigDict(extra="forbid")` — Pydantic rejects unknown fields
- Backend imports: use `app.models`, `app.schemas`, `app.repository`, `app.database` — no circular imports through `main.py`
- Frontend types: always import from `types/todo.ts` — never redefine inline

### Framework-Specific Rules

**Vue 3 / Composition API:**
- `useTodos()` is called **once only, in `App.vue`**. State/methods passed to children via props. Child components never call `useTodos()` directly.
- Update strategy: **pessimistic with full re-fetch** — after every mutation call `fetchTodos()`. Never splice/mutate `todos.value` directly. Do not optimise this.
- Error split: `useTodos().error` set only by `fetchTodos()` failures → displayed via `AppError.vue`. Mutation errors handled by **local `ref`s in the calling component** → displayed inline. Never propagate mutation errors to `useTodos().error`.
- On mutation error, preserve user input (e.g. `inputTitle.value`) — clear only on success.
- `editingId` ref lives in `TodoList.vue` — one todo in edit mode at a time. Passed as `:is-editing="editingId === todo.id"`.
- Enter → confirm edit → `updateTodo()` → emit `editEnd`. Escape → cancel → restore original title → emit `editEnd` (no API call).
- Form validation (non-empty, max 500 chars) lives in `TodoInput.vue` only — `useTodos` and `api.ts` do not validate.
- `TodoItem` emits are fixed: `editStart`, `editEnd`, `toggleComplete`, `delete` — no variations allowed.

**FastAPI:**
- All routes prefixed `/api/v1/`.
- All errors: `{"detail": "human-readable message"}` — no stack traces.
- HTTP semantics: `200` (GET/PATCH), `201` (POST), `204` (DELETE), `400`/`404`/`500` for errors.
- `GET /api/v1/health` must query SQLite — not just confirm uvicorn started.
- Disable FastAPI docs in production via `ENABLE_DOCS` env var.
- CORS via `ALLOWED_ORIGINS` env var (production only). Dev uses Vite proxy — no CORS config needed locally.
- Log CORS at startup: `logger.info(f"CORS origins: {allowed_origins}")`.

**Layer Separation:**
- `schemas.py` (Pydantic) and `models.py` (SQLAlchemy) are **independent** — no `from_attributes=True` coupling.
- `repository.py` is the **only** file that references both `TodoRecord` and `TodoResponse`/`TodoCreate`. All domain ↔ storage mapping lives here exclusively.

### Testing Rules

**Backend (pytest):**
- Tests in `todo-backend/tests/`; `conftest.py` holds shared fixtures (test engine, async session, test client)
- Use `httpx` async test client — not `requests` or FastAPI's sync `TestClient`
- ≥70% meaningful coverage via `pytest-cov` — not padded with trivial assertions
- Test files mirror router structure: `test_todos.py`, `test_health.py`
- Health test must verify DB connectivity, not just HTTP 200
- Never mock the database in integration tests — test against real SQLite (in-memory or temp file)

**Frontend (Vitest):**
- Unit tests in `todo-frontend/tests/unit/`
- File naming: `*.spec.ts` or `*.test.ts`

**E2E (Playwright):**
- `playwright.config.ts` at project root; `baseURL` is always `http://localhost:80` (Docker Compose stack only)
- Minimum 5 passing scenarios: create todo, complete todo, delete todo, empty state, error handling
- Playwright runs against `docker-compose up` — not the Vite dev server
- Performance: list render ≤200ms p95, CRUD ≤500ms p95 — use Playwright timing assertions
- Accessibility: zero axe-core critical violations — automated via Playwright

### Code Quality & Style Rules

**Naming Conventions:**

| Element | Convention | Example |
|---------|-----------|---------|
| DB tables | `snake_case`, plural | `todos` |
| DB columns | `snake_case` | `id`, `title`, `completed`, `created_at` |
| SQLAlchemy class | `PascalCase` + `Record` suffix | `TodoRecord` |
| API paths | `snake_case`, plural nouns | `/api/v1/todos` |
| JSON fields | `snake_case` throughout | `{"created_at": "..."}` |
| Python functions | `snake_case` | `get_all_todos()` |
| Python classes | `PascalCase` | `TodoRepository` |
| Pydantic models | `PascalCase` | `TodoCreate`, `TodoResponse` |
| Python files | `snake_case.py` | `repository.py` |
| Python constants | `UPPER_SNAKE_CASE` | `DATABASE_URL` |
| Vue components | `PascalCase.vue` | `TodoItem.vue` |
| Composables | `use` + `PascalCase.ts` | `useTodos.ts` |
| Service modules | `camelCase.ts` | `api.ts` |
| TypeScript interfaces | `PascalCase` | `Todo`, `TodoCreate` |
| TS variables/functions | `camelCase` | `fetchTodos()`, `isLoading` |
| Template props | `kebab-case` | `:is-editing="..."` |

**File & Folder Structure:**
- Frontend components go **only** in `components/todos/` — never create `ui/`, `shared/`, or `common/` in v1
- Exactly 5 components: `TodoList.vue`, `TodoItem.vue`, `TodoInput.vue`, `AppError.vue`, `AppEmpty.vue`
- Backend routers: `app/routers/todos.py` and `app/routers/health.py` only
- Types defined once in `types/todo.ts` — never inline

**Linting/Formatting:**
- `ruff` config in `pyproject.toml` under `[tool.ruff]` — no separate config files
- `ty` config in `pyproject.toml` under `[tool.ty]` — no separate config files
- Pre-commit enforces ruff + ty + conventional commits — never skip with `--no-verify`
- Zero ruff violations and zero ty type errors required before commit
- Conventional commits enforced: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, etc.

### Critical Don't-Miss Rules

**Infrastructure Gotchas:**
- **Docker volume triple-lock:** `db-data` (volume name) + `/app/data` (mount path) + `sqlite+aiosqlite:////app/data/todos.db` (DATABASE_URL) must all agree. Mismatch = silent data loss on restart.
- **SQLite WAL:** Database is 3 files — `todos.db`, `todos.db-wal`, `todos.db-shm`. Never back up `todos.db` alone.
- **`docker-compose down -v` permanently deletes all todo data** — README must warn explicitly. `docker-compose down` (no `-v`) preserves data.
- **Nginx routing:** `location /api/ { proxy_pass http://backend:8000/api/; }` — explicit path only, no wildcard proxy.
- **`VITE_API_URL` must NOT appear in `docker-compose.yml`** — Nginx handles routing; setting it risks baking a wrong URL into the build.

**Security:**
- Never expose stack traces — `{"detail": "..."}` only in all error responses
- Never use `v-html` for user-supplied content — use `{{ }}` interpolation or `:textContent`
- SQLAlchemy ORM prevents SQL injection — never use raw SQL string concatenation
- `.env` in `.gitignore`; always provide `.env.example`

**Performance:**
- `GET /api/v1/todos` ≤200ms p95 (Playwright verified)
- All CRUD ≤500ms p95; 100-item render ≤100ms, no frame drops below 30fps
- Do not add client-side caching or optimistic updates — pessimistic re-fetch is intentional and meets the budget

**Accessibility:**
- Every interactive element needs accessible name/role: checkbox, input, edit field, delete button
- All actions keyboard-operable without mouse
- WCAG 2.1 AA — zero axe-core critical violations

**Explicitly Deferred (do NOT implement in v1):**
- Auth / user accounts, Pinia, Vue Router, Alembic migrations, optimistic updates, WebSocket/real-time

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge during implementation

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack or architectural decisions change
- Review periodically for outdated rules

_Last Updated: 2026-03-27_
