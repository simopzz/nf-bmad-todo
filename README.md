# leapsome-bmad-todo

A full-stack todo application: Vue 3 frontend + FastAPI backend, orchestrated with Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- [Node.js](https://nodejs.org/) >= 18 (for local frontend development)
- Python 3.12+ (for local backend development)

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd leapsome-bmad-todo

# 2. Create your local environment file
[ -f .env ] || cp .env.example .env

# 3. Start the stack
docker-compose up
# or: docker compose up

# 4. Open in browser
xdg-open http://localhost 2>/dev/null || open http://localhost 2>/dev/null || echo "Open http://localhost in your browser"
```

The application is available at **http://localhost** (port 80).

## Development Setup

After cloning, activate the pre-commit hooks:

```bash
pre-commit install
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
docker-compose down

# Stop the stack and DELETE all data — PERMANENT, cannot be undone
docker-compose down -v

# Rebuild images after code changes
docker-compose up --build
```

> ⚠️ **Warning:** `docker-compose down -v` **permanently deletes all todo data**. Use with care.

## Environment Variables

Copy `.env.example` to `.env` before starting. The `.env` file is gitignored and must be created manually.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite connection string (e.g. `sqlite+aiosqlite:////app/data/todos.db`) |
| `ALLOWED_ORIGINS` | Space-separated CORS origins for production |
| `ENABLE_DOCS` | Set to `true` to enable FastAPI Swagger UI at `/docs` |

## Testing

> **Placeholder** — Test suite is being expanded in Epic 5.

```bash
# Backend tests
cd todo-backend && uv run pytest

# Frontend unit tests
cd todo-frontend && npm run test:unit

# E2E tests (Playwright — requires running stack)
# Setup coming in Epic 5
```

## API Documentation

Set `ENABLE_DOCS=true` in your `.env` file to enable the interactive Swagger UI at `http://localhost/docs`.

> **Placeholder** — Full API documentation coming in Epic 5.
