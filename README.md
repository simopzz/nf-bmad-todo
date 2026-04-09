# leapsome-bmad-todo

A full-stack todo application: Vue 3 frontend + FastAPI backend, orchestrated with Docker Compose.

## Prerequisites

**To run the application:**
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- [GNU Make](https://www.gnu.org/software/make/) (standard on Linux/macOS; on Windows use WSL or Git Bash)

**To contribute / develop:**
- [Node.js](https://nodejs.org/) >= 18 (Playwright browser install via `make setup`; frontend development)
- [pre-commit](https://pre-commit.com/#install) (git hooks via `make setup`)
- Python 3.12+ (backend development)

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd leapsome-bmad-todo

# 2. Create .env, install pre-commit hooks, and install Playwright browsers (safe to re-run)
make setup

# 3. Start the stack
make up

# 4. Open in browser
xdg-open http://localhost 2>/dev/null || open http://localhost 2>/dev/null || echo "Open http://localhost in your browser"
```

The application is available at **http://localhost** (port 80).

> Run `make help` to see all available Makefile targets.

## Development Setup

Run this once per clone:

```bash
make setup
# or manually: pre-commit install
```

> **Note:** Hooks are NOT active until this command is run. You must run it once per local clone.

The hooks enforce:
- **ruff** — Python formatting and linting
- **ty** — Python type checking
- **Conventional Commits** — commit message format (`feat:`, `fix:`, `chore:`, etc.)

## Architecture Overview

| Layer | Technology | Details |
|-------|-----------|---------|
| Frontend | Vue 3 + TypeScript + Vite | Served via Nginx on port 80 |
| Backend | FastAPI + SQLAlchemy + SQLite | Internal port 8000 |
| Reverse proxy | Nginx | `/api/` routes to backend; everything else serves frontend |
| Persistence | Docker named volume `db-data` | Mounted at `/app/data` inside backend container |

## Data Safety / Stack Management

```bash
# Stop the stack — data is PRESERVED (volume retained)
make down

# Stop the stack and DELETE all data — PERMANENT, cannot be undone
make nuke

# Rebuild images after code changes
make build
```

> ⚠️ **Warning:** `make nuke` (`docker compose down -v`) **permanently deletes all todo data**. Use with care.

## Environment Variables

Copy `.env.example` to `.env` before starting. The `.env` file is gitignored and must be created manually.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite connection string used by the backend. Docker default: `sqlite+aiosqlite:////app/data/todos.db` (persists in `db-data` volume). Local dev override: `sqlite+aiosqlite:///./todos.db`. |
| `ALLOWED_ORIGINS` | Space-separated allowlist for production CORS origins. Do not use `*` when credentials are enabled. |
| `ENABLE_DOCS` | `true` enables FastAPI Swagger UI at `/docs`; set `false` (or unset) for production-style runs. |

## Testing

```bash
# Backend tests with coverage report
make test-backend

# Frontend unit tests
make test-frontend

# E2E tests (Playwright — requires running stack)
make test-e2e

# Run all test suites (backend + frontend + e2e)
make test-all
```

## Makefile Command Map

The README treats `Makefile` as the source of truth for exact recipe syntax.  
Use `make help` to list targets; use the map below for intent.

| Purpose | Make target |
|---------|-------------|
| First-time setup | `make setup` |
| Start stack (foreground) | `make up` |
| Start stack (detached) | `make up-d` |
| Stop stack (keep data) | `make down` |
| Stop stack (delete data) | `make nuke` |
| Rebuild and run | `make build` |
| Backend tests + coverage | `make test-backend` |
| Frontend unit tests | `make test-frontend` |
| E2E tests | `make test-e2e` |
| Full test pass | `make test-all` |
| Backend quality checks | `make lint-backend` |
| Frontend quality checks | `make lint-frontend` |
| Follow service logs | `make logs` |

## API Documentation

Set `ENABLE_DOCS=true` in your `.env` file to enable the interactive Swagger UI at `http://localhost/docs`.

OpenAPI is served by FastAPI and reflects the live `/api/v1` routes. In production-style runs, docs can be disabled by setting `ENABLE_DOCS=false`.

## BMAD Methodology

This repository was planned and implemented through BMAD artifacts in this chain:

`product brief -> PRD -> architecture -> UX design -> epics/stories -> implementation artifacts`

Key generated artifacts:

- Product brief: [`_bmad-output/planning-artifacts/product-brief-leapsome-bmad-todo.md`](_bmad-output/planning-artifacts/product-brief-leapsome-bmad-todo.md)
- PRD: [`_bmad-output/planning-artifacts/prd.md`](_bmad-output/planning-artifacts/prd.md)
- Architecture: [`_bmad-output/planning-artifacts/architecture.md`](_bmad-output/planning-artifacts/architecture.md)
- UX design: [`_bmad-output/planning-artifacts/ux-design-specification.md`](_bmad-output/planning-artifacts/ux-design-specification.md)
- Epics and stories: [`_bmad-output/planning-artifacts/epics.md`](_bmad-output/planning-artifacts/epics.md)
- Implementation stories: [`_bmad-output/implementation-artifacts/`](_bmad-output/implementation-artifacts/)
