---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# leapsome-bmad-todo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for leapsome-bmad-todo, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a todo with a text description
FR2: User can view their complete list of todos
FR3: User can edit the text description of an existing todo
FR4: User can mark a todo as complete
FR5: User can mark a completed todo as incomplete
FR6: User can delete a todo
FR7: The system displays todos in reverse chronological order (newest first), hard-coded — not user-configurable
FR8: The system visually distinguishes completed todos from active todos
FR9: The system displays an empty state when no todos exist
FR10: The system displays a loading state while data is being fetched from the backend
FR11: The system displays an error state when the backend is unreachable, with a mechanism to retry
FR12: The system preserves user-entered text if a create or edit operation fails
FR13: The system validates that a todo description is not empty before submission and communicates the validation error to the user
FR14: The system persists todos across browser refresh without data loss
FR15: The system persists todos across container restart without data loss
FR16: The system exposes an endpoint to retrieve all todos in reverse chronological order
FR17: The system exposes an endpoint to create a new todo
FR18: The system exposes an endpoint to update a todo's description and/or completion status independently
FR19: The system exposes an endpoint to delete a todo by ID
FR20: The system exposes a health check endpoint that indicates service availability
FR21: The API returns consistent error responses with a human-readable message for all failure conditions
FR22: The API returns appropriate HTTP status codes for all outcomes (success and error)
FR23: All interactive elements are operable via keyboard navigation
FR24: All interactive elements have appropriate accessible names and roles
FR25: All core interactions are accessible and functional on desktop viewports (≥1280px width) with no layout overflow or element truncation
FR26: All core interactions are accessible and functional on mobile viewports (≥375px width) with no layout overflow or element truncation
FR27: The application meets WCAG 2.1 AA accessibility standards, verified with automated tooling
FR28: The complete application can be started with a single command without manual setup or configuration steps
FR29: All application containers report a healthy status after startup
FR30: The application is reachable and functional within 30 seconds of container startup
FR31: The API base URL is configurable via environment variable to support different deployment environments
FR32: The repository enforces Python code formatting standards via a pre-commit hook
FR33: The repository enforces Python type hint correctness via a pre-commit hook
FR34: The repository enforces conventional commit message format via a pre-commit hook
FR35: The backend includes unit and integration tests achieving at least 70% meaningful line coverage
FR36: The test suite includes end-to-end tests covering the full CRUD lifecycle and error recovery scenarios
FR37: The repository includes documentation that enables a developer with no prior knowledge of the codebase to set up, run, and execute the full test suite using only the README

### NonFunctional Requirements

NFR1: The task list renders within 200ms of page load under normal operating conditions, as measured by Playwright timing assertions at p95
NFR2: Create, toggle, and delete interactions complete within 500ms end-to-end, as measured by Playwright timing assertions at p95
NFR3: The application is reachable and fully functional within 30 seconds of `docker-compose up`
NFR4: A list of 100 todo items renders within 100ms of data receipt with no frame drops below 30fps during scroll
NFR5: The application is free of critical OWASP Top 10 vulnerabilities (XSS, SQL injection, command injection)
NFR6: Security findings from an AI-assisted code review are documented; all critical findings are remediated before v1 release
NFR7: The application does not expose internal error details (stack traces, file paths) in API responses
NFR8: The application passes WCAG 2.1 AA automated checks with zero critical violations, verified with axe-core
NFR9: All functionality is operable using only a keyboard
NFR10: Colour contrast ratios meet WCAG AA minimums for all text and interactive elements
NFR11: All Python code conforms to ruff formatting rules; zero violations in CI
NFR12: All Python functions and methods include type annotations; `ty` type checker passes with zero errors
NFR13: All commits conform to the Conventional Commits specification; non-conforming commits are rejected by the pre-commit hook
NFR14: Backend test coverage is at least 70% meaningful line coverage; coverage report is generated as part of the test run
NFR15: The codebase can be set up, run, and tested by a developer with no prior context using only the README

### Additional Requirements

- **Starter Template (impacts Epic 1 Story 1)**: Frontend scaffolded via `npm create vue@latest` (TypeScript, Vitest, ESLint, Prettier, no Vue Router, no Pinia); backend via `uv init todo-backend` + `uv add fastapi "uvicorn[standard]" sqlalchemy aiosqlite` + `uv add --dev ruff ty pytest pytest-cov httpx`
- Repository root must contain `.pre-commit-config.yaml` (not inside `todo-backend/`) with ruff, ty, and conventional commit hooks
- Named Docker volume `db-data` mounted at `/app/data` in backend container; `DATABASE_URL=sqlite+aiosqlite:////app/data/todos.db` — volume name, mount path, and DATABASE_URL must all agree
- Multi-stage Dockerfiles: backend (uv build stage + non-root runtime user); frontend (Vite build stage + Nginx serve stage)
- Nginx reverse proxy (port 80): `location /api/ { proxy_pass http://backend:8000/api/; }` explicit, no wildcard; `Cache-Control: no-cache` for `index.html`, `max-age=31536000, immutable` for hashed assets
- `VITE_API_URL` always `""` (empty string); Vite dev proxy `/api/ → http://localhost:8000` in `vite.config.ts` handles all dev routing
- CORS: explicit origins via `ALLOWED_ORIGINS` env var (production only; Vite proxy eliminates CORS in dev)
- API prefix: `/api/v1/` on all endpoints
- `GET /api/v1/health` must query SQLite to confirm DB connectivity, not just HTTP availability
- FastAPI docs disabled in production via `ENABLE_DOCS` env var
- Pydantic + SQLAlchemy layers are independent: `repository.py` is the only file that maps between `TodoRecord` (SQLAlchemy) and `TodoResponse`/`TodoCreate` (Pydantic)
- Frontend update strategy: **pessimistic with full re-fetch** — `fetchTodos()` called after every mutation; never manually splice `todos.value`
- `useTodos()` composable called once in `App.vue` only; state passed to children via props
- Component structure: `components/todos/` only — no `ui/`, `shared/`, or `common/` subfolders
- Test patterns: in-memory SQLite (`sqlite+aiosqlite:///:memory:`) with `autouse=True` fixture; Playwright `baseURL: 'http://localhost:80'` against Docker Compose stack; each E2E test fully independent
- `.env` files in `.gitignore`; `.env.example` provided with safe defaults
- `GET /api/v1/todos` returns `{"items": [...]}` envelope (bare array forbidden)
- `docker-compose down -v` permanently deletes all data — README must warn explicitly

### UX Design Requirements

UX-DR1: Implement custom design token system in `tailwind.config.js` with DESIGN.md palette values: `primary_container` (#1E293B), `secondary` / `brand.emerald` (#006C4A), `surface` (#F7F9FB), `surface_container_low` (#F2F4F6), `surface_container_lowest` (#FFFFFF), `surface_container_highest` (hover state), `on_surface`, `on_surface_variant`, `outline_variant`; dual font families `display` (Plus Jakarta Sans) and `body` (Inter)
UX-DR2: Implement dual-font system (Plus Jakarta Sans for display/headlines + Inter for body/labels) loaded via Google Fonts in `index.html` before Vite entry point; never use standard Tailwind font scale for these roles
UX-DR3: Implement `TaskInput` component: always-pinned below app header, full-width input with placeholder "What needs doing? Press Enter to add…", Enter to commit / Escape to clear, auto-focused when list is empty; `role="textbox"` + `aria-label="Add a task"`; active state: `surface_container_lowest` bg + 2px `secondary` left-edge indicator
UX-DR4: Implement `TodoItem` (`TaskRow`) component with hover-reveal action icons (opacity 0→1 in 150ms): delete (trash, right-aligned) and edit (pencil); click title to enter inline edit mode; click checkbox to toggle complete; `role="listitem"`, delete button `aria-label="Delete task"`, edit input `aria-label="Edit task"`
UX-DR5: Implement `TaskCheckbox` component: square shape `border-radius: 0.375rem` (md), 18×18px visual, 44×44px touch target via padding; unchecked: `outline_variant` border + transparent fill; hover: border shifts to `on_surface`; checked: `secondary` (#006C4A) fill + white `✓` checkmark; 150ms ease-in-out fill transition; `role="checkbox"` + `aria-checked`
UX-DR6: Implement `AppEmpty` (`EmptyState`) component with two variants: `blank` (✦ icon, "A clean slate" headline, body copy) and `all-done` (✓ secondary-green icon, "All done" headline); Plus Jakarta Sans headline + Inter body; centered; shown in list zone below pinned input
UX-DR7: Implement `AppError` (`ErrorState`) component with two variants: `load-error` (full list area, "Couldn't load your tasks", primary gradient Retry button) and `action-error` (per-row inline, `outline_variant` border flash + silent revert); no toast/snackbar notifications
UX-DR8: Implement `LoadingSkeleton` component: 3–4 shimmer rows matching `TaskRow` height/layout proportions; CSS `@keyframes` shimmer sweep (`surface_container_low` → `surface_dim` → `surface_container_low`); shown only during initial load, never on subsequent mutations
UX-DR9: Implement D1×D4 Hybrid layout: app shell max-width 640px centered via `margin: 0 auto`; page background `surface`; header zone `surface_container_lowest`; pinned input zone `surface_container_lowest` with `2px solid surface_container_low` bottom separator (one permitted structural line); task list zone `surface_container_low`; task rows `transparent` background at rest with no border-radius, `surface_container_highest` on hover; `spacing-6` (1.5rem) vertical rhythm between rows; no 1px dividers ever
UX-DR10: Implement completion transition: checkbox fills `secondary` (#006C4A) + white `✓`; task title shifts to `line-through` decoration + `on_surface_variant` color; smooth CSS transition 150ms ease-in-out on both properties simultaneously; completed task remains visible in resolved state until explicitly deleted
UX-DR11: Implement hover/focus interaction patterns: row hover background shifts transparent → `surface_container_highest` (150ms); action icons opacity 0→1 (150ms); keyboard focus ring uses `secondary` color outline — never removed or hidden; active input left-edge `secondary` 2px indicator (not full border wrap)
UX-DR12: Implement responsive adaptations: mobile (< 640px) full-width `padding: 0 1rem`; action icons always visible (`opacity: 1`) on touch devices — hover-only is inaccessible on mobile; `padding-bottom: env(safe-area-inset-bottom)` on list for mobile keyboard clearance; all interactive targets ≥ 44×44px
UX-DR13: Implement screen reader semantic HTML: `<ul>/<li>` for task list; `<button>` for icon actions; `<input>` for text fields; `aria-live="polite"` on task list region for dynamic additions/removals; `role="status"` on empty and error state containers; native `<input type="checkbox">` preferred for `TaskCheckbox`
UX-DR14: Implement inline edit mode in `TodoItem`: click task title to activate; input pre-filled with current text; left-edge `secondary` 2px indicator; background shifts to `surface_container_lowest`; Enter or blur saves and calls `updateTodo()`; Escape cancels and restores original title; only one item editable at a time (enforced by `editingId` ref in `TodoList`); failed edit reverts to original title with subtle `outline_variant` border flash

### FR Coverage Map

```
FR1:  Epic 3 — Create todo (TodoInput + useTodos.createTodo)
FR2:  Epic 3 — View todo list (TodoList renders from useTodos.todos)
FR3:  Epic 3 — Edit todo inline (TodoItem inline edit mode)
FR4:  Epic 3 — Mark complete (TaskCheckbox toggle → updateTodo)
FR5:  Epic 3 — Mark incomplete (TaskCheckbox re-toggle → updateTodo)
FR6:  Epic 3 — Delete todo (hover-reveal delete → deleteTodo)
FR7:  Epic 2 + 3 — Reverse chronological order (API returns ordered; frontend renders as-received)
FR8:  Epic 3 — Visual completion distinction (strike-through + on_surface_variant + emerald fill)
FR9:  Epic 3 — Empty state (AppEmpty component, both variants)
FR10: Epic 4 — Loading state (LoadingSkeleton shimmer component)
FR11: Epic 4 — Error state with retry (AppError load-error variant + Retry button)
FR12: Epic 4 — Preserve input text on failure (TodoInput local error handling)
FR13: Epic 4 — Form validation required field (TodoInput client-side validation)
FR14: Epic 2 — Persistence across browser refresh (SQLite + named Docker volume)
FR15: Epic 2 — Persistence across container restart (named volume survives docker-compose down/up)
FR16: Epic 2 — GET /api/v1/todos endpoint (returns {"items": [...]} envelope)
FR17: Epic 2 — POST /api/v1/todos endpoint
FR18: Epic 2 — PATCH /api/v1/todos/{id} endpoint (title and/or completed independently)
FR19: Epic 2 — DELETE /api/v1/todos/{id} endpoint (HTTP 204)
FR20: Epic 2 Story 2.4 — GET /api/v1/health endpoint (queries SQLite connectivity); Docker Compose health check configured in Story 1.3 references this endpoint
FR21: Epic 2 — Consistent error envelope {"detail": "..."} across all endpoints
FR22: Epic 2 — Appropriate HTTP status codes (200, 201, 204, 400, 404, 500)
FR23: Epic 4 — Keyboard navigation (Tab, Space/Enter, Escape)
FR24: Epic 4 — Accessible names and roles (ARIA attributes on all interactive elements)
FR25: Epic 4 — Desktop viewport usability (≥1280px, no overflow/truncation)
FR26: Epic 4 — Mobile viewport usability (≥375px, no overflow/truncation)
FR27: Epic 4 — WCAG 2.1 AA (axe-core verified, zero critical violations)
FR28: Epic 1 — Single-command startup (docker-compose up)
FR29: Epic 1 — All containers healthy after startup
FR30: Epic 1 — App reachable within 30 seconds of startup
FR31: Epic 1 — API base URL configurable via environment variable
FR32: Epic 1 — ruff pre-commit hook enforced
FR33: Epic 1 — ty type checking pre-commit hook enforced
FR34: Epic 1 — Conventional commit pre-commit hook enforced
FR35: Epic 2 — Backend unit + integration tests ≥70% coverage (pytest + pytest-cov)
FR36: Epic 5 — E2E Playwright tests ≥5 scenarios (full CRUD + error recovery)
FR37: Epic 5 — README enables zero-prior-knowledge setup, run, and test
Additional (task.md): Epic 5 Story 5.4 — AI integration log documenting agent usage, MCP usage, test generation, debugging, and limitations
```

## Epic List

### Epic 1: Project Scaffold & Development Infrastructure
A developer (Sam, Journey 3) can clone the repository, run `docker-compose up`, and have both services healthy and the app reachable within 30 seconds — with pre-commit hooks for ruff, ty, and conventional commits enforced — using only the README, with zero manual setup steps.
**FRs covered:** FR20, FR28, FR29, FR30, FR31, FR32, FR33, FR34
**Notes:** NFR13 (conventional commits) enforcement mechanism lives here (pre-commit hook). Verification that the full history is clean is deferred to Epic 5.
**Required deliverables (explicit scope):** `.env.example` with safe defaults is a required story output — without it a developer cannot configure the stack. A minimal README covering `docker-compose up` and `pre-commit install` is an Epic 1 story; Epic 5 extends it to full coverage. At the end of Epic 1, a developer with no prior knowledge can run the stack using only what is in the repository.

### Epic 2: Backend Task API & Data Persistence
Users' todos are durably persisted in SQLite and accessible via a complete, tested REST API — all 5 endpoints operational with correct HTTP semantics and error envelopes, data survives container restart and browser refresh — with a backend test suite achieving ≥70% coverage. Security guards (no stack traces, XSS/injection prevention via Pydantic) enforced from day one.
**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR19, FR21, FR22, FR35
**NFRs addressed:** NFR5 (OWASP — Pydantic validation blocks XSS/injection), NFR7 (no stack traces in API responses), NFR11, NFR12 (ruff + ty zero violations)
**FR7 note:** Epic 2 AC — API returns todos ordered by `created_at DESC`. Frontend renders in received order (no client-side re-sort) — verified in Epic 3.

### Epic 3: Core Frontend Task Management
A user (Alex, Journey 1 happy path) can create, view, edit, complete, and delete todos through a polished web interface built on the full Editorial Functionalism design system — design tokens configured, dual fonts loaded, all five bespoke components implemented — with the happy-path flow working end-to-end including the empty state, completion transition, and hover-reveal interactions.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9
**UX-DRs covered:** UX-DR1–UX-DR14
**NFRs addressed:** NFR1 (200ms list render), NFR2 (500ms CRUD), NFR4 (100-item scroll performance) — all measured via Playwright timing assertions written in this epic
**Story ordering constraint:** UX-DR1 (design tokens in `tailwind.config.js`) and UX-DR2 (font loading in `index.html`) MUST be completed before any component story begins. `api.ts` service module and `useTodos()` composable are implemented as an explicit story before component stories — these are independently testable layers per the architecture contract.
**FR7 note:** Frontend renders the list in the order received from the API — no client-side re-sorting.
**Completion transition AC (qualitative):** The task completion transition must be verified as a smooth 150ms CSS ease-in-out — not an instant snap. Acceptance criterion: checkbox fill and title strike-through animate simultaneously over ~150ms; no jarring visual jump. Verified via Playwright `waitForTimeout(75)` mid-transition state check or explicit visual review.

### Epic 4: Resilient UX, Accessibility & Responsive Design
A user (Alex, Journey 2 error encounter) always knows the app's state, can recover from any error without losing their work, and can operate the full interface via keyboard alone — with WCAG 2.1 AA verified by axe-core, all interactive targets ≥44px, correct responsive behaviour at both ≥375px (mobile) and ≥1280px (desktop) viewports, and mobile keyboard clearance handled via `env(safe-area-inset-bottom)`.
**FRs covered:** FR10, FR11, FR12, FR13, FR23, FR24, FR25, FR26, FR27
**NFRs addressed:** NFR3 (≤30s startup verified), NFR8 (WCAG AA axe-core zero critical violations), NFR9 (keyboard-only operable), NFR10 (contrast ratios meet AA minimums)
**UX-DR12 note:** Mobile keyboard clearance (`padding-bottom: env(safe-area-inset-bottom)`) explicitly verified at ≥375px viewport with soft keyboard open.
**FR12 dual-case AC (explicit):** Stories covering FR12 must include two distinct acceptance criteria: (a) a failed *create* operation preserves the user's typed text in the input field — user can retry without retyping; (b) a failed *edit* operation reverts the task title to its original value — no data corruption on network failure. These are two separate cases, not one vague "handles errors" statement.
**Retry button AC:** The retry mechanism in the error state must be verified with a "retry succeeds" case — not just "retry button is present." AC: given the backend is unreachable on first load, when the user clicks Retry after the backend recovers, then the task list loads successfully.

### Epic 5: End-to-End Quality Assurance & Documentation
The full stack is verified end-to-end with ≥5 independent Playwright scenarios covering the complete CRUD lifecycle and error recovery, an AI-assisted security review is completed with all critical findings resolved, all NFRs are verified and traceable, the README enables any developer with no prior knowledge to set up, run, and execute the full test suite, and an AI integration log documents all AI-assisted development decisions for evaluator review.
**FRs covered:** FR36, FR37
**NFRs addressed:** NFR6, NFR13, NFR14, NFR15
**NFR6 AC:** AI-assisted review of `main.py`, `routers/todos.py`, `repository.py`, and all Vue components handling user input is completed. Findings logged in `_bmad-output/ai-review.md`. All critical findings (XSS, injection, data exposure) resolved before this epic is marked complete.
**NFR13 AC:** `git log --oneline` shows no non-conforming commits in history (enforcement was Epic 1; this is the final verification).
**NFR14 AC:** Coverage report generated as part of `pytest --cov` run; report artifact retained.
**NFR15 AC:** A developer with no prior knowledge follows only the README to clone, run `docker-compose up`, and execute the full test suite — all steps succeed without additional guidance.

---

## Epic 1: Project Scaffold & Development Infrastructure

A developer (Sam, Journey 3) can clone the repository, run `docker-compose up`, and have both services healthy and the app reachable within 30 seconds — with pre-commit hooks for ruff, ty, and conventional commits enforced — using only the README, with zero manual setup steps.

### Story 1.1: Repository & Project Scaffold

As a developer,
I want a repository with both frontend and backend projects scaffolded and configured,
So that I have a clean, consistent foundation to build on with no manual setup decisions left open.

**Acceptance Criteria:**

**Given** an empty repository
**When** I follow the scaffold setup
**Then** `todo-frontend/` exists, scaffolded via `npm create vue@latest` with the following explicit option selections: TypeScript ✅, JSX ❌, Vue Router ❌, Pinia ❌, Vitest ✅, E2E Testing ❌ (Playwright installed separately), ESLint ✅, Prettier ✅, Vue DevTools ✅
**And** `todo-backend/` exists, initialised via `uv init` with `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `aiosqlite` as runtime deps and `ruff`, `ty`, `pytest`, `pytest-cov`, `httpx` as dev deps
**And** Playwright is installed at the repository root via `npm init playwright@latest` run from the repository root directory (not inside `todo-frontend/` or `todo-backend/`) — `playwright.config.ts` and the `e2e/` test directory live at the repository root
**And** a `.gitignore` at repository root excludes `.env`, `__pycache__`, `node_modules`, `dist`, `*.db`, `*.db-wal`, `*.db-shm`, `.venv`
**And** a `.env.example` at repository root documents all required environment variables (`DATABASE_URL`, `ALLOWED_ORIGINS`, `ENABLE_DOCS`) with safe default values
**And** `todo-frontend/vite.config.ts` includes a dev proxy: `/api/` → `http://localhost:8000`

### Story 1.2: Pre-commit Quality Pipeline

As a developer,
I want pre-commit hooks that enforce code quality and commit message standards automatically,
So that no non-conforming code or commit message can enter the repository.

**Acceptance Criteria:**

**Given** the repository has `.pre-commit-config.yaml` at the root and `pyproject.toml` with a `[tool.ruff]` section in `todo-backend/`
**When** I run `pre-commit install` and attempt to commit Python code with formatting violations
**Then** ruff autoformats the file and blocks the commit, prompting me to re-stage
**And** when I attempt to commit Python code with type annotation errors, `ty` blocks the commit with a clear error message
**And** the `ty` hook specifies `todo-backend/` as its working directory in `.pre-commit-config.yaml` — it does not run against the repository root where no Python files exist
**And** when I attempt to commit with a non-conforming message (e.g. `"fix stuff"`), the conventional commit hook rejects it with a clear error
**And** when I commit with a conforming message (e.g. `"feat: add todo endpoint"`), all hooks pass and the commit succeeds
**And** the Story 1.4 README instructs developers to run `pre-commit install` immediately after cloning — hooks are not active until this command is run

### Story 1.3: Docker Compose Stack & Health Checks

As a developer,
I want a single `docker-compose up` command that starts the complete application stack with all services healthy,
So that I can verify the application is running without any manual configuration steps.

**Acceptance Criteria:**

**Given** I have cloned the repository and copied `.env.example` to `.env`
**When** I run `docker-compose up`
**Then** `docker-compose.yml` is syntactically valid and both containers start without errors
**And** the backend container health check is configured to poll `GET /api/v1/health` with appropriate interval and retries — full health verification (containers reporting `healthy`) is completed in Story 2.4 once the endpoint exists
**And** `GET /` (Nginx) returns HTTP 200 serving the Vue SPA static assets
**And** the named volume `db-data` is mounted at `/app/data` in the backend container and `DATABASE_URL` points to `sqlite+aiosqlite:////app/data/todos.db`
**And** running `docker-compose down` followed by `docker-compose up` preserves all data (volume survives restart)
**And** the Nginx config routes `location /api/` to `http://backend:8000/api/` explicitly — no wildcard proxy
**And** `VITE_API_URL` is intentionally absent from `docker-compose.yml` — Nginx handles all routing
**And** the backend Dockerfile uses a multi-stage build: a build stage (uv install) and a runtime stage (copy app only); the runtime stage runs as a non-root `appuser`; the volume directory `/app/data` has ownership set to `appuser` before the `USER` switch
**And** the frontend Dockerfile uses a multi-stage build: a Vite build stage producing `dist/` and an Nginx serve stage copying `dist/` to `/usr/share/nginx/html`
**And** end-to-end volume write verified: after `docker-compose up`, a todo is created via `POST /api/v1/todos`, then `docker-compose restart` is run, and the todo is still returned by `GET /api/v1/todos` — confirming the volume write path works with correct file ownership

### Story 1.4: Minimal README & Developer Onboarding

As a developer with no prior knowledge of this codebase,
I want a README that tells me exactly how to set up, run, and verify the application,
So that I can have a working stack without asking anyone for help.

**Acceptance Criteria:**

**Given** I have cloned the repository and have Docker and Node.js installed
**When** I read only the README and follow its instructions
**Then** I can run `docker-compose up` and reach the application in a browser
**And** I can run `pre-commit install` and have hooks active
**And** the README explicitly warns that `docker-compose down -v` permanently deletes all todo data
**And** the README notes that `.env` is gitignored and must be created from `.env.example`
**And** the README includes placeholder sections for test commands (to be completed in Epic 5)

---

## Epic 2: Backend Task API & Data Persistence

Users' todos are durably persisted in SQLite and accessible via a complete, tested REST API — all 5 endpoints operational with correct HTTP semantics and error envelopes, data survives container restart and browser refresh — with a backend test suite achieving ≥70% coverage. Security guards (no stack traces, XSS/injection prevention via Pydantic) enforced from day one.

### Story 2.1: Database Models, Schemas & Persistence Layer

As a developer,
I want SQLAlchemy models, Pydantic schemas, and database initialisation configured,
So that the backend has a typed, validated data layer before any endpoints are built.

**Acceptance Criteria:**

**Given** the backend project exists from Story 1.1
**When** the backend starts
**Then** `TodoRecord` SQLAlchemy model exists with fields: `id` (Integer, auto-increment primary key), `title` (String, non-null), `completed` (Boolean, default False), `created_at` (DateTime, server default utcnow)
**And** `TodoCreate` Pydantic schema accepts `title` (non-empty string); Pydantic rejects empty or whitespace-only titles at the schema level
**And** `TodoUpdate` Pydantic schema accepts optional `title` and optional `completed` — both independently nullable
**And** `TodoResponse` Pydantic schema exposes `id`, `title`, `completed`, `created_at`
**And** `database.py` creates all tables on startup via a FastAPI lifespan context manager — table creation is NOT triggered at import time or as a module-level side effect
**And** `repository.py` is the only file that maps between `TodoRecord` and Pydantic schemas — no direct ORM access outside this file
**And** `TodoUpdate` with both `title=None` and `completed=None` (empty PATCH body) raises a `ValueError` in Pydantic validation and the endpoint returns HTTP 400 with `{"detail": "..."}` — a no-op PATCH is not permitted

### Story 2.2: Todo Repository

As a developer,
I want a repository layer that encapsulates all database operations for todos,
So that API routes interact only with clean Python objects, never raw SQL or ORM constructs.

**Acceptance Criteria:**

**Given** the database layer from Story 2.1 is in place
**When** each repository method is called
**Then** `get_all()` returns a list of `TodoResponse` ordered by `created_at DESC`
**And** `create(data: TodoCreate)` persists a new `TodoRecord` and returns its `TodoResponse`
**And** `update(id, data: TodoUpdate)` updates only the provided fields (title and/or completed independently) and returns the updated `TodoResponse`, or raises a `NotFoundError` if the id does not exist
**And** `delete(id)` removes the record and returns nothing, or raises a `NotFoundError` if the id does not exist
**And** `NotFoundError` is defined as a custom exception class in `repository.py` (e.g. `class NotFoundError(Exception): pass`) — route handlers in Story 2.3 catch this specific type and convert it to HTTP 404; no other exception type is used for the not-found case
**And** all methods use async SQLAlchemy sessions
**And** `repository.py` contains no FastAPI imports — it is a pure data-access layer

### Story 2.3: Todo CRUD API Endpoints

As a user,
I want a REST API that lets me create, read, update, and delete todos,
So that my todo data is accessible from the frontend with correct semantics.

**Acceptance Criteria:**

**Given** the repository layer from Story 2.2 is in place
**When** `GET /api/v1/todos` is called
**Then** it returns HTTP 200 with body `{"items": [...]}` — bare array responses are forbidden
**And** when `POST /api/v1/todos` is called with a valid `{"title": "..."}` body, it returns HTTP 201 with the created `TodoResponse`
**And** when `POST /api/v1/todos` is called with an empty or whitespace-only title, it returns HTTP 422 with `{"detail": "..."}` — no stack trace
**And** when `PATCH /api/v1/todos/{id}` is called with a valid body, it returns HTTP 200 with the updated `TodoResponse`
**And** when `PATCH /api/v1/todos/{id}` is called with a body where both `title` and `completed` are null, it returns HTTP 400 with `{"detail": "..."}` — empty PATCH is rejected
**And** when `PATCH /api/v1/todos/{id}` is called with an unknown id, it returns HTTP 404 with `{"detail": "Todo not found"}`
**Note:** FR7 ordering (`created_at DESC`) is verified by the test suite in Story 2.5 — Story 2.3 verifies the response shape and HTTP semantics only
**And** when `DELETE /api/v1/todos/{id}` is called with a valid id, it returns HTTP 204 with no body
**And** when `DELETE /api/v1/todos/{id}` is called with an unknown id, it returns HTTP 404 with `{"detail": "Todo not found"}`
**And** all error responses use `{"detail": "..."}` envelope — internal error details (stack traces, file paths) are never exposed
**And** unhandled exceptions (HTTP 500) are not accidentally caught by the `NotFoundError` handler — a bare `except Exception` block is forbidden; only `NotFoundError` is caught and converted to HTTP 404
**And** `ENABLE_DOCS` defaults to `false` when the environment variable is absent — API docs are opt-in, not opt-out; when `ENABLE_DOCS=false` or absent, `GET /docs` and `GET /redoc` return HTTP 404

### Story 2.4: Health Check Endpoint

As a developer,
I want a health check endpoint that verifies the database is reachable,
So that Docker's health check mechanism can accurately report service readiness.

**Acceptance Criteria:**

**Given** the backend is running
**When** `GET /api/v1/health` is called and SQLite is accessible
**Then** it returns HTTP 200 with `{"status": "ok"}`
**And** when SQLite is not accessible (e.g. volume not mounted), it returns HTTP 503 with `{"status": "error", "detail": "..."}`
**And** the health check executes a real database query (e.g. `SELECT 1`) — it does not merely check that uvicorn is running
**And** with the health endpoint now implemented, the Docker Compose backend container health check (configured in Story 1.3) reports `healthy` — verifying the end-to-end health check chain works as intended

### Story 2.5: Backend Test Suite

As a developer,
I want a backend test suite with ≥70% meaningful line coverage,
So that the API's correctness is verified and regressions are caught automatically.

**Acceptance Criteria:**

**Given** pytest and pytest-cov are installed as dev dependencies
**When** `pytest --cov=todo_backend --cov-report=term-missing --cov-branch` is run
**Then** all tests pass and line + branch coverage is ≥70%
**And** tests for `GET /api/v1/todos` cover: empty list, list with items (ordered newest first)
**And** tests for `POST /api/v1/todos` cover: valid creation (HTTP 201), empty title (HTTP 422)
**And** tests for `PATCH /api/v1/todos/{id}` cover: update title only, update completed only, update both, unknown id (HTTP 404)
**And** tests for `DELETE /api/v1/todos/{id}` cover: successful deletion (HTTP 204), unknown id (HTTP 404)
**And** tests for `GET /api/v1/health` cover: healthy state (HTTP 200)
**And** all tests use an in-memory SQLite database (`sqlite+aiosqlite:///:memory:`) via an `autouse=True` fixture — no file-based database in tests
**And** tests use `httpx.AsyncClient` with the FastAPI `app` — no mocking of the repository or database layers

---

## Epic 3: Core Frontend Task Management

A user (Alex, Journey 1 happy path) can create, view, edit, complete, and delete todos through a polished web interface built on the full Editorial Functionalism design system — design tokens configured, dual fonts loaded, all five bespoke components implemented — with the happy-path flow working end-to-end including the empty state, completion transition, and hover-reveal interactions.

### Story 3.1: Design System Foundation

As a developer,
I want the design token system, fonts, and Tailwind configuration in place,
So that all subsequent components use consistent, correct visual primitives from the start.

**Acceptance Criteria:**

**Given** the frontend project exists from Story 1.1
**When** Tailwind is configured
**Then** `tailwind.config.js` defines custom tokens: `colors.brand.emerald` (`#006C4A`), `colors.primary-container` (`#1E293B`), `colors.secondary` (`#006C4A`), `colors.surface` (`#F7F9FB`), `colors.surface-low` (`#F2F4F6`), `colors.surface-lowest` (`#FFFFFF`), `colors.surface-highest` (dark hover state), `colors.outline-variant` (ghost border, used at 15% opacity for accessibility mode only), `fontFamily.display` (`['Plus Jakarta Sans', 'sans-serif']`), `fontFamily.body` (`['Inter', 'sans-serif']`)
**And** Plus Jakarta Sans and Inter are loaded in `index.html` via Google Fonts before the Vite entry point
**And** standard Tailwind `emerald-*` scale is not used anywhere — only `brand.emerald`
**And** no 1px solid borders exist in any component — all boundaries are defined by background color transitions
**And** no Tailwind classes are constructed via string interpolation anywhere in `.vue` or `.ts` files — all class strings are complete literals (verified by grep: no backtick-interpolated Tailwind patterns exist in the codebase)
**And** Google Fonts `<link rel="preconnect">` and `<link rel="stylesheet">` tags appear in `index.html` before the `<script type="module">` Vite entry point — fonts are available on first paint
**And** the app shell layout is implemented in `App.vue`: max-width 640px, horizontally centered, `surface` page background

### Story 3.2: API Service Layer & useTodos Composable

As a developer,
I want a typed API service module and reactive composable that manage all todo state and HTTP calls,
So that Vue components interact only with clean reactive data and never make direct `fetch()` calls.

**Acceptance Criteria:**

**Given** the design system from Story 3.1 and the backend API from Epic 2 are available
**When** `api.ts` is implemented
**Then** it exports exactly four functions: `getTodos()`, `createTodo()`, `updateTodo()`, `deleteTodo()` — no additional functions
**And** `getTodos()` unwraps the `{"items": [...]}` envelope internally — callers receive `Todo[]`
**And** `api.ts` throws on any non-2xx response; calling components handle errors locally
**And** `types/todo.ts` defines `Todo`, `TodoCreate`, `TodoUpdate` interfaces with `created_at` typed as `string` (never `Date`)
**When** `useTodos()` composable is implemented in `App.vue` only
**Then** it exposes: `todos` (`Ref<Todo[]>`), `loading` (`Ref<boolean>`), `error` (`Ref<string | null>`), `fetchTodos`, `createTodo`, `updateTodo`, `deleteTodo`
**And** every mutation calls `fetchTodos()` after success — `todos.value` is never manually spliced or patched
**And** `loading` and `error` are set only by `fetchTodos()` failures — mutation errors are handled by local refs in the calling component
**And** `useTodos()` is called once in `App.vue` only — never imported in child components
**And** `api.ts` is covered by Vitest unit tests: at minimum, `getTodos()` correctly unwraps the `{"items": [...]}` envelope and returns `Todo[]`; `createTodo()` sends a POST with the correct payload shape; both throw on non-2xx responses
**And** a `getErrorMessage(e: unknown): string` utility is defined and exported from `services/api.ts` (the same module that throws the errors): it extracts `detail` from the API error response body if present, falls back to `e.message` if `e` is an `Error`, and falls back to `"An unexpected error occurred"` — all components that handle mutation errors import and call this function via `import { getErrorMessage } from '@/services/api'`

### Story 3.3: TaskInput Component

As a user,
I want an always-visible input field to add new tasks with keyboard-native entry,
So that I can add tasks instantly without navigating to a different screen or clicking a submit button.

**Acceptance Criteria:**

**Given** the app is loaded
**When** the task list is empty
**Then** `TodoInput.vue` is auto-focused so I can immediately start typing
**And** when I type a task title and press Enter, the task is submitted and the input clears — retaining focus for the next entry
**And** when I press Escape, the input clears without submitting
**And** when I click away (blur), the input clears without submitting
**And** the input is pinned below the app header and always visible above the task list
**And** the placeholder text is "What needs doing? Press Enter to add…"
**And** at rest the input has `surface-low` background; when focused it shifts to `surface-lowest` background with a 2px `secondary` left-edge indicator (not a full border wrap)
**And** the component has `role="textbox"` and `aria-label="Add a task"`
**Note:** Empty or whitespace-only input handling is explicitly out of scope for this story — it is implemented in Story 4.2. This story covers only non-empty input submission behaviour.

### Story 3.4: TaskCheckbox Component

As a user,
I want a visually distinctive checkbox to toggle task completion,
So that completing a task feels like a meaningful, satisfying interaction.

**Acceptance Criteria:**

**Given** a task is displayed in the list
**When** the checkbox is at rest (unchecked)
**Then** it shows a square shape with `border-radius: 0.375rem`, `outline-variant` border, transparent fill, 18×18px visual size, 44×44px touch target via padding
**And** when hovered, the border shifts to `on-surface`
**When** I click the checkbox
**Then** it fills with `secondary` (#006C4A) and shows a white `✓` checkmark
**And** the fill and checkmark appearance animate simultaneously with a 150ms ease-in-out transition — not an instant snap
**And** the 44×44px touch target is verified by clicking the padding area outside the 18×18px visual — clicks anywhere within the full touch target register the toggle, not only clicks directly on the visual square
**And** the component has `role="checkbox"` and `:aria-checked="todo.completed"` (Vue boolean binding) — never a static string `"true"` or `"false"`
**And** Space key activates the checkbox when focused

### Story 3.5: TodoItem Component

As a user,
I want each task row to display my task with inline editing and hover-revealed actions,
So that I can edit, complete, and delete tasks without leaving the list view.

**Acceptance Criteria:**

**Given** a task is displayed in the list
**When** the row is at rest
**Then** it shows `[TaskCheckbox] [task title] [action icons hidden]` with transparent background and `spacing-6` (1.5rem) vertical separation from adjacent rows — no dividers
**And** when I hover the row, the background shifts to `surface-highest` and the delete icon transitions from `opacity: 0` to `opacity: 1` in 150ms
**When** I click the task title
**Then** the title becomes an inline input pre-filled with the current text, background shifts to `surface-lowest`, and a 2px `secondary` left-edge indicator appears
**And** pressing Enter or blurring saves the edit and calls `updateTodo()`
**And** pressing Escape cancels and restores the original title with no API call
**And** only one task can be in edit mode at a time — enforced by `editingId` ref in `TodoList`
**When** I click the delete icon
**Then** the task is immediately removed from the list with no confirmation dialog
**And** the delete icon has `tabindex="-1"` when hidden (`opacity: 0`) — it is not reachable via keyboard Tab when invisible; it becomes focusable (`tabindex="0"`) only when the row is hovered or focused
**And** the component emits: `editStart`, `editEnd`, `toggleComplete`, `delete` — no direct API calls from `TodoItem`
**And** the delete button has `aria-label="Delete task"` and the edit input has `aria-label="Edit task"`
**Note:** The `editingId` state management contract is owned by Story 3.6 (`TodoList.vue`): `editStart` sets `editingId` to the task id; `editEnd` resets it to `null`; `:is-editing="editingId === todo.id"` is passed as a prop to each `TodoItem`. Story 3.5 emits the events; Story 3.6 handles them.
**Forward reference — accessibility:** Auto-focus on edit mode activation and focus restoration on edit exit (WCAG 2.4.3) are requirements specified in Story 4.3 that must be implemented in `TodoItem.vue`. These are not deferred polish — Story 4.3 explicitly modifies `TodoItem.vue` to add focus management. Story 3.5 should leave `// TODO: focus management — Story 4.3` comments at the relevant locations.

### Story 3.6: TodoList, App Shell & End-to-End Happy Path

As a user,
I want to see my complete task list with visual completion states and an empty state,
So that the full happy-path loop — add, view, edit, complete, delete — works end-to-end.

**Acceptance Criteria:**

**Given** the app loads with existing todos
**When** the task list renders
**Then** todos appear in reverse chronological order (newest first) as received from the API — no client-side re-sorting
**And** completed todos display with `line-through` title decoration and `on-surface-variant` text color — visually distinct from active todos
**And** completed todos remain visible in the list until explicitly deleted
**When** all todos are deleted
**Then** `AppEmpty.vue` renders with the `blank` variant: ✦ icon, "A clean slate" headline, explanatory body copy
**And** the `all-done` variant renders when the last task removed was in a completed state (i.e. the list had only completed tasks when it became empty); the `blank` variant renders when the last task removed was active
**And** the full CRUD loop works end-to-end: add a task → it appears → edit its title → title updates → mark complete → visual state changes → delete → removed from list
**And** integration verified: `useTodos()` state and methods flow correctly from `App.vue` → `TodoList` (via props) → `TodoItem` (via props); no child component calls `useTodos()` directly
**And** `editingId` integration verified: `editStart` event sets `editingId` to the emitting task's id; `editEnd` event resets it to `null`; `:is-editing` prop is correctly `true` for the active task and `false` for all others
**And** mutation events verified: `toggleComplete` and `delete` events from `TodoItem` reach the corresponding `useTodos` methods in `App.vue` and trigger a full re-fetch
**Note:** NFR1 (200ms list render) and NFR2 (500ms CRUD operations) are verified via Playwright timing assertions written in Story 5.1 (Scenarios 6–7) — Playwright requires a running Docker Compose stack not available during Epic 3.
**Note:** NFR4 (100-item list render) verified in Story 5.1 (Scenario 8) — seeded via 100 sequential `POST /api/v1/todos` calls as test setup cost (not included in the measured 100ms render window). The render time is measured from when the API response arrives, not from test start.

---

## Epic 4: Resilient UX, Accessibility & Responsive Design

A user (Alex, Journey 2 error encounter) always knows the app's state, can recover from any error without losing their work, and can operate the full interface via keyboard alone — with WCAG 2.1 AA verified by axe-core, all interactive targets ≥44px, correct responsive behaviour at both ≥375px (mobile) and ≥1280px (desktop) viewports, and mobile keyboard clearance handled via `env(safe-area-inset-bottom)`.

### Story 4.1: Loading Skeleton & Full-Area Error State

As a user,
I want to see a purposeful loading state on first load and a clear error state with a working retry when the backend is unreachable,
So that I always know what the app is doing and can recover without refreshing the page.

**Acceptance Criteria:**

**Given** the app is loading todos for the first time
**When** the API fetch is in flight
**Then** `LoadingSkeleton.vue` renders 3–4 shimmer rows matching the height and layout proportions of `TodoItem` — no centered spinner
**And** the shimmer animation is a CSS `@keyframes` sweep from `surface-low` → `surface-highest` → `surface-low` — `surface-highest` is the shimmer midpoint (defined in Story 3.1 token config); `surface-dim` is not a defined token and must not be used
**And** the skeleton is shown only during the initial fetch — never shown on subsequent mutations
**And** the skeleton component uses `v-if="loading && todos.length === 0"` — not `v-if="loading"` alone — so it appears only when loading with an empty list, never during post-mutation re-fetches of an existing list
**And** after a todo is created, the existing task list remains visible during the post-mutation re-fetch — the skeleton does NOT reappear; the list updates in place when the re-fetch completes
**Given** the backend is unreachable on initial load
**When** `fetchTodos()` fails
**Then** `AppError.vue` renders the `load-error` variant: "Couldn't load your tasks" message and a primary gradient Retry button
**And** when I click Retry, `fetchTodos()` is called again
**And** when the backend recovers and I click Retry, the task list loads successfully — the retry actually works (not decorative)
**And** the error state is wrapped in `role="status"` so screen readers announce it without requiring focus

### Story 4.2: Form Validation & Mutation Error Handling

As a user,
I want the app to validate my input and handle failed operations gracefully,
So that I never lose typed text due to a transient error and always know when something went wrong.

**Acceptance Criteria:**

**Given** the add-task input is focused
**When** I press Enter with an empty or whitespace-only input
**Then** the form does not submit — the empty submission is a silent no-op (no error message, no API call)
**Given** I have typed a task title and the create API call fails
**When** the error is returned
**Then** my typed text is preserved in the input field — I can retry without retyping (FR12 create case)
**And** a subtle inline error indicator is shown near the input
**Given** I am editing a task title inline and the update API call fails
**When** the error is returned
**Then** the task title reverts to its original value — no data corruption (FR12 edit case)
**And** a subtle `outline-variant` border flash appears on the affected row then fades
**And** when a create call fails due to backend HTTP 422 (whitespace title that passed client-side guard but failed Pydantic validation), the input text is preserved and the backend's `detail` message is shown inline — this is treated as a mutation error, not a validation no-op
**And** no toast, snackbar, or floating notification is used — all error feedback is spatial and contextual

### Story 4.3: Keyboard Navigation & Screen Reader Support

As a user who navigates by keyboard,
I want to operate every feature of the app without a mouse,
So that the application is fully accessible to keyboard and assistive technology users.

**Acceptance Criteria:**

**Given** I am navigating the app with Tab only
**When** I Tab through the interface
**Then** focus moves in visual DOM order: add-input → task rows (checkbox → title → delete icon) → next task row
**And** a visible focus ring using `secondary` color outline appears on every focused element — never hidden or removed
**And** Space or Enter activates the checkbox when it is focused
**And** Enter activates the delete button when it is focused
**And** `TodoItem.vue` is updated to add focus management: when inline edit mode is activated (`:is-editing` prop becomes `true`), focus moves automatically to the inline input via `nextTick(() => inputRef.value?.focus())` — focus is never lost or stranded on a non-interactive element (WCAG 2.4.3)
**And** when Escape or blur exits inline edit mode, focus returns to the task row element via `rowRef.value?.focus()` — not to `document.body` or an unrelated element
**And** the task list region has `aria-live="polite"` so additions and removals are announced by screen readers
**And** the empty state and error state containers have `role="status"` so their content is announced without requiring focus
**And** semantic HTML is used throughout: `<ul>/<li>` for the task list, `<button>` for icon actions, `<input type="checkbox">` for the checkbox

### Story 4.4: Responsive Design & WCAG AA Audit

As a user on any device,
I want the app to be fully usable on mobile and desktop viewports and to meet WCAG 2.1 AA standards,
So that no core interaction is inaccessible regardless of device or ability.

**Acceptance Criteria:**

**Given** the app is viewed at ≥1280px (desktop)
**When** all core interactions are performed
**Then** no layout overflow, element truncation, or interaction obstruction occurs (FR25)
**Given** the app is viewed at ≥375px (mobile)
**When** all core interactions are performed
**Then** no layout overflow, element truncation, or interaction obstruction occurs (FR26)
**And** delete and edit action icons are always visible (`opacity: 1`) on touch devices — hover-only affordances are inaccessible on mobile
**And** `padding-bottom: env(safe-area-inset-bottom)` is applied to the task list to prevent content hidden behind the mobile soft keyboard (UX-DR12)
**And** all interactive targets are ≥44×44px (WCAG 2.5.5) — checkboxes and icon buttons padded to target size
**And** colour contrast ratios meet WCAG AA minimums: `on-surface` on `surface-lowest` ≥4.5:1 for body text; `secondary` (#006C4A) on white ≥3:1 for UI elements (NFR10)
**And** axe-core automated scan reports zero critical WCAG 2.1 AA violations (NFR8) — scan runs against the production Docker Compose stack at port 80 (built assets), not the Vite dev server
**And** the axe-core scan results are saved to `_bmad-output/accessibility-report.md` — minimum content: tool version, scan date, zero-violations summary, and the Playwright command used to generate the scan — satisfying the "QA reports (accessibility)" deliverable from the assignment
**And** NFR3 verified: app is reachable and fully functional within 30 seconds of `docker-compose up`

---

## Epic 5: End-to-End Quality Assurance & Documentation

The full stack is verified end-to-end with ≥5 independent Playwright scenarios covering the complete CRUD lifecycle and error recovery, an AI-assisted security review is completed with all critical findings resolved, all NFRs are verified and traceable, and the README enables any developer with no prior knowledge to set up, run, and execute the full test suite.

### Story 5.1: Playwright End-to-End Test Suite

As a developer,
I want a Playwright E2E test suite covering the full CRUD lifecycle and error recovery,
So that the entire application is verified working as an integrated system and regressions are caught at the stack boundary.

**Acceptance Criteria:**

**Given** the complete application stack is running via `docker-compose up`
**When** `npx playwright test` is run with `baseURL: 'http://localhost:80'`
**Then** ≥5 independent test scenarios pass, covering:
- **Scenario 1 — Full CRUD lifecycle:** Add a task → verify it appears → edit its title → verify updated → mark complete → verify visual completion state → delete → verify removed
- **Scenario 2 — Empty state:** Delete all tasks → verify `AppEmpty` blank variant renders
- **Scenario 3 — Persistence across reload:** Add a task → reload the page → verify task still appears
- **Scenario 4 — Error recovery:** Use `page.route()` to intercept and fail the `GET /api/v1/todos` request (not container manipulation) → verify `AppError` load-error variant renders with Retry button → remove the route intercept → click Retry → verify task list loads successfully
- **Scenario 5 — Form validation:** Attempt to submit empty input → verify no task is added and input remains empty
- **Scenario 6 — NFR1 timing:** Navigate to the app → assert task list is visible within 200ms of navigation (Playwright `performance.now()` timing assertion at p95)
- **Scenario 7 — NFR2 timing:** Create a todo → assert list re-renders within 500ms; toggle complete → assert within 500ms; delete → assert within 500ms (Playwright timing assertions at p95)
- **Scenario 8 — NFR4 performance:** Seed 100 todos via 100 sequential `POST /api/v1/todos` API calls (setup cost, not measured) → navigate to app → assert list renders within 100ms from API response receipt; scroll through list → assert no frame drops below 30fps via browser Performance API
**And** each test begins with a `beforeEach` hook that deletes all todos via `DELETE /api/v1/todos/{id}` for each item (or verifies the list is empty) — test independence is mechanically enforced, not assumed
**And** each test is fully independent — it creates and cleans up its own data
**And** tests never assert on specific `id` values — they assert on title content or list length
**And** NFR1 timing assertion: task list visible within 200ms of navigation
**And** NFR2 timing assertion: create, toggle, and delete each complete within 500ms

### Story 5.2: AI-Assisted Security Review

As a developer,
I want an AI-assisted security review of the codebase with all critical findings resolved,
So that the application is free of critical OWASP Top 10 vulnerabilities before release.

**Acceptance Criteria:**

**Given** the complete codebase is implemented
**When** an AI-assisted review is conducted on `main.py`, `routers/todos.py`, `repository.py`, and all Vue components that handle user input
**Then** findings are logged in `_bmad-output/ai-review.md` with severity (critical / high / medium / low) and resolution status for each finding
**And** all critical findings (XSS, SQL injection, command injection, data exposure) are resolved before this story is marked complete
**And** the review confirms: no `v-html` used with user-supplied content; all user input passes through Pydantic validation; no stack traces exposed in API responses; no sensitive data in client-side logs
**And** high and medium findings are documented with either a code fix or a specific accepted-risk rationale — "accepted risk" without rationale is not a valid resolution; rationale must reference the specific context that reduces the risk (e.g. single-user, local app, no auth surface, no sensitive data)

### Story 5.3: Full README & Documentation Completion

As a developer with no prior knowledge of this codebase,
I want a complete README that covers setup, running, testing, and known operational caveats,
So that I can clone, run, and fully verify the application without asking anyone for help.

**Acceptance Criteria:**

**Given** I have cloned the repository
**When** I read only the README and follow its instructions
**Then** I can run `docker-compose up` and reach the application in a browser (extending the skeleton from Story 1.4)
**And** I can run `pre-commit install` and have all hooks active
**And** I can run the backend test suite with `pytest --cov` and see the coverage report
**And** I can run `npx playwright test` and see all E2E tests pass
**And** the README explicitly warns that `docker-compose down -v` permanently deletes all todo data
**And** the README documents all environment variables from `.env.example` with descriptions
**And** `git log --oneline` shows no non-conforming commit messages in the repository history (NFR13 final verification)
**And** a developer unfamiliar with the codebase completes all README steps without needing additional guidance (NFR15)
**And** the README includes a "BMAD Methodology" section (or links to `_bmad-output/BMAD-PROCESS.md`) that explains the artifact chain used: product brief → PRD → architecture → UX design → epics/stories → implementation, satisfying the assignment deliverable "Documentation of how BMAD guided the implementation"

### Story 5.4: AI Integration Log

As a developer documenting the BMAD methodology exercise,
I want a maintained log of how AI tools were used throughout the project,
So that the methodology is traceable and evaluators can assess AI-assisted development decisions.

**Acceptance Criteria:**

**Given** the project is complete
**When** `_bmad-output/ai-integration-log.md` is reviewed
**Then** it documents all five required categories from the assignment:
- **Agent Usage:** which tasks were completed with AI assistance and which prompts worked best
- **MCP Server Usage:** which MCP servers were used and how they helped — including documented tool substitutions: `httpx` integration tests used in place of Postman MCP; Playwright timing assertions used in place of Chrome DevTools MCP performance profiling; rationale documented for each substitution
- **Test Generation:** how AI assisted in generating test cases and what it missed or got wrong
- **Debugging with AI:** specific cases where AI helped identify or resolve issues during development
- **Limitations:** what AI could not do well and where human expertise was critical to the outcome

**And** the log is populated incrementally throughout development — at minimum one entry added at the conclusion of each epic; it is not written retrospectively after all code is complete
**And** entries reference specific story numbers where relevant (e.g. "Story 2.3: AI generated initial endpoint stubs; human review caught missing bare-except guard")
**And** the log is readable by an evaluator with no prior knowledge of the codebase — no assumed context
**And** the file is referenced from the README so evaluators can find it without searching the repository
