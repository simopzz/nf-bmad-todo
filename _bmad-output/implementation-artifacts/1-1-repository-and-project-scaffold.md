# Story 1.1: Repository & Project Scaffold

Status: review

## Story

As a developer,
I want a repository with both frontend and backend projects scaffolded and configured,
so that I have a clean, consistent foundation to build on with no manual setup decisions left open.

## Acceptance Criteria

1. **Given** an empty repository, **When** the scaffold is complete, **Then** `todo-frontend/` exists, scaffolded via `npm create vue@latest` with these exact options: TypeScript ✅, JSX ❌, Vue Router ❌, Pinia ❌, Vitest ✅, E2E Testing ❌ (Playwright installed separately at root), ESLint ✅, Prettier ✅, Vue DevTools ✅

2. **And** `todo-backend/` exists, initialised via `uv init todo-backend` with runtime deps `fastapi "uvicorn[standard]" sqlalchemy aiosqlite` and dev deps `ruff ty pytest pytest-cov httpx`

3. **And** Playwright is installed at the **repository root** (not inside `todo-frontend/` or `todo-backend/`) via `npm init playwright@latest` — `playwright.config.ts` and `e2e/` directory live at the repository root

4. **And** a `.gitignore` at repository root excludes: `.env`, `__pycache__`, `node_modules`, `dist`, `*.db`, `*.db-wal`, `*.db-shm`, `.venv`

5. **And** a `.env.example` at repository root documents all required environment variables (`DATABASE_URL`, `ALLOWED_ORIGINS`, `ENABLE_DOCS`) with safe default values

6. **And** `todo-frontend/vite.config.ts` contains a dev proxy: `'/api/'` → `'http://localhost:8000'`

## Tasks / Subtasks

- [x] Create `.gitignore` at repository root (AC: #4)
  - [x] Include: `.env`, `__pycache__/`, `node_modules/`, `dist/`, `*.db`, `*.db-wal`, `*.db-shm`, `.venv/`
- [x] Create `.env.example` at repository root (AC: #5)
  - [x] `DATABASE_URL=sqlite+aiosqlite:////app/data/todos.db`
  - [x] `ALLOWED_ORIGINS=http://localhost:80`
  - [x] `ENABLE_DOCS=true`
- [x] Scaffold frontend (AC: #1)
  - [x] Run `npm create vue@latest` — project name `todo-frontend`, options: TypeScript ✅, JSX ❌, Vue Router ❌, Pinia ❌, Vitest ✅, E2E Testing ❌, ESLint ✅, Prettier ✅, Vue DevTools ✅
  - [x] Verify `todo-frontend/` created with `src/`, `vite.config.ts`, `tsconfig.json`, `package.json`
- [x] Configure Vite dev proxy (AC: #6)
  - [x] In `todo-frontend/vite.config.ts`, add `server.proxy`: `'/api/'` → `{ target: 'http://localhost:8000', changeOrigin: true }`
  - [x] Confirm `VITE_API_URL` is NOT set in any config — it is always `""` (empty string)
- [x] Scaffold backend (AC: #2)
  - [x] Run `uv init todo-backend` from repository root
  - [x] Run `uv add fastapi "uvicorn[standard]" sqlalchemy aiosqlite` from `todo-backend/`
  - [x] Run `uv add --dev ruff ty pytest pytest-cov httpx` from `todo-backend/`
  - [x] Verify `todo-backend/pyproject.toml`, `uv.lock`, and `.venv/` (or equivalent uv managed env) exist
- [x] Install Playwright at repository root (AC: #3)
  - [x] Run `npm init playwright@latest` from repository root — **not** inside `todo-frontend/` or `todo-backend/`
  - [x] Confirm `playwright.config.ts` and `e2e/` are at repository root
  - [x] Set `baseURL: 'http://localhost:80'` in `playwright.config.ts` — this is fixed and never changes

## Dev Notes

### Scope Boundaries — What This Story Does NOT Include

- **Story 1.2:** `.pre-commit-config.yaml`, ruff/ty/conventional-commit hooks — not this story
- **Story 1.3:** `docker-compose.yml`, `Dockerfile` files, Nginx config, health checks — not this story
- **Story 1.4:** `README.md` content beyond placeholder — not this story

Do not add these. The scaffold is a clean foundation; each subsequent story adds one layer.

### Critical Architecture Constraints

**`VITE_API_URL` is always `""`** — never set it to any URL value. The Vite dev proxy (`/api/` → `http://localhost:8000`) handles all API routing in development. Nginx handles it in production. Never bake a URL into any build config.

**Playwright goes at repository root** — if you accidentally run `npm init playwright@latest` inside `todo-frontend/`, the E2E layer will be broken for all future stories. The `playwright.config.ts` must be at the repository root, and `baseURL` must be `'http://localhost:80'` (production Nginx port, not dev port).

**`uv init` creates the project directory** — running `uv init todo-backend` from the repository root creates `todo-backend/` with a `pyproject.toml` and a `hello.py` stub. Delete the stub (`hello.py`) — it is not needed. The actual app code (`app/` directory structure) is created in Story 2.

**Do not create app source files** — this story only scaffolds the two projects and installs dependencies. Do not create `app/main.py`, `App.vue`, `api.ts`, or any application-level files. Those come in later stories.

### File Structure After This Story

```
(repository root)
├── .gitignore
├── .env.example
├── playwright.config.ts          ← at root, NOT inside todo-frontend/
├── e2e/                          ← Playwright test directory, at root
├── package.json                  ← from npm init playwright@latest (root)
├── node_modules/                 ← root Playwright deps (gitignored)
├── todo-frontend/                ← Vue 3 SPA scaffold
│   ├── src/
│   │   ├── App.vue               ← scaffold default (do not modify in this story)
│   │   └── ...
│   ├── vite.config.ts            ← MODIFIED: add /api/ proxy
│   ├── tsconfig.json
│   └── package.json
└── todo-backend/                 ← FastAPI backend
    ├── pyproject.toml            ← includes ruff, ty, pytest, fastapi etc.
    ├── uv.lock
    └── (no app/ directory yet — created in Story 2)
```

### Vite Config Proxy — Exact Pattern

```typescript
// todo-frontend/vite.config.ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api/': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

Do not alter the existing `plugins` or `resolve.alias` sections — only append the `server.proxy` block.

### Playwright Config — Exact `baseURL`

```typescript
// playwright.config.ts (root)
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:80',   // ALWAYS 80 — never localhost:5173 or :8000
  },
  // ... rest of generated config
})
```

The `baseURL` is `http://localhost:80` because E2E tests run against the Docker Compose stack (Nginx on port 80), not the Vite dev server. Do not change this value.

### `.env.example` Content

```bash
# Database
DATABASE_URL=sqlite+aiosqlite:////app/data/todos.db

# CORS — space-separated list of allowed origins (production only)
ALLOWED_ORIGINS=http://localhost:80

# FastAPI docs — set to true in dev; absent or false in production
ENABLE_DOCS=true
```

### Toolchain Versions (from Architecture Document)

- FastAPI: 0.135.2 (Python 3.12+)
- Vite: 8.0.2 (Rolldown-powered — ~10-30x faster builds)
- `uv` manages virtual environment and lockfile (`uv.lock`) — replaces pip/poetry/virtualenv

### Project Structure Notes

- Repository root owns: `.gitignore`, `.env.example`, `playwright.config.ts`, `e2e/`
- `todo-frontend/` owns: Vue SPA, Vitest unit tests (`tests/unit/`), `tailwind.config.js` (added in Story 3.1), `vite.config.ts`
- `todo-backend/` owns: FastAPI app, pytest test suite (`tests/`), `pyproject.toml` with `[tool.ruff]` config (added in Story 1.2), `Dockerfile` (added in Story 1.3)
- `.pre-commit-config.yaml` lives at **repository root** (not inside `todo-backend/`) — this is a repo-level concern, set up in Story 1.2

### References

- Starter template: [Source: `_bmad-output/planning-artifacts/architecture.md`#Starter Template Evaluation]
- File structure: [Source: `_bmad-output/planning-artifacts/architecture.md`#Structure Patterns]
- Vite proxy: [Source: `_bmad-output/planning-artifacts/architecture.md`#Frontend Architecture]
- Story 1.1 AC: [Source: `_bmad-output/planning-artifacts/epics.md`#Story 1.1]
- Additional requirements: [Source: `_bmad-output/planning-artifacts/epics.md`#Additional Requirements]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `create-vue` doesn't support `--e2e false` or `--devtools` flags — E2E excluded by omission; Vue DevTools included via `vite-plugin-vue-devtools` scaffold default
- `uv init` creates `main.py` (not `hello.py`) as stub — deleted as per Dev Notes
- `npm init playwright@latest` default `testDir` is `tests/` — updated to `e2e/` and `baseURL` set to `http://localhost:80` per AC

### Completion Notes List

- Created/updated `.gitignore` with all required entries: `.env`, `__pycache__/`, `node_modules/`, `dist/`, `*.db`, `*.db-wal`, `*.db-shm`, `.venv/`
- Created `.env.example` with `DATABASE_URL`, `ALLOWED_ORIGINS`, `ENABLE_DOCS`
- Scaffolded `todo-frontend/` via `npm create vue@latest` with TypeScript, Vitest, ESLint, Prettier, Vue DevTools (via `vite-plugin-vue-devtools`)
- Added `server.proxy` to `todo-frontend/vite.config.ts`: `/api/` → `http://localhost:8000`; `VITE_API_URL` not set
- Scaffolded `todo-backend/` via `uv init`; added all runtime and dev deps; deleted stub `main.py`
- Installed Playwright at repository root; `playwright.config.ts` has `testDir: './e2e'` and `baseURL: 'http://localhost:80'`
- Frontend: Vitest 1 test pass, ESLint 0 errors, TypeScript type-check clean

### File List

- `.gitignore` (modified — added `node_modules/`, `*.db`, `*.db-wal`, `*.db-shm`)
- `.env.example` (created)
- `todo-frontend/` (created — full Vue 3 scaffold)
- `todo-frontend/vite.config.ts` (modified — added `server.proxy`)
- `todo-backend/pyproject.toml` (created)
- `todo-backend/uv.lock` (created)
- `todo-backend/.venv/` (created — uv managed)
- `playwright.config.ts` (created at root)
- `e2e/.gitkeep` (created)
- `package.json` (created at root — Playwright deps)
- `package-lock.json` (created at root)

## Change Log

- 2026-03-28: Initial implementation — scaffolded Vue 3 frontend, FastAPI backend, Playwright E2E at root; configured Vite proxy; created `.gitignore` and `.env.example` (Agent: claude-sonnet-4-6)
