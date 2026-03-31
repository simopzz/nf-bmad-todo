# Story 1.4: Minimal README & Developer Onboarding

Status: done

## Story

As a developer with no prior knowledge of this codebase,
I want a README that tells me exactly how to set up, run, and verify the application,
So that I can have a working stack without asking anyone for help.

## Acceptance Criteria

1. **Given** I have cloned the repository and have Docker and Node.js installed, **When** I read only the README and follow its instructions, **Then** I can run `docker-compose up` and reach the application in a browser at `http://localhost`.
2. **Given** I want to contribute code, **When** I follow the README, **Then** I can run `pre-commit install` and have hooks active (ruff, ty, conventional commits).
3. **Given** I want to manage the stack, **When** I read the README, **Then** it explicitly warns that `docker-compose down -v` permanently deletes all todo data, while `docker-compose down` (without `-v`) preserves data.
4. **Given** I need environment configuration, **When** I read the README, **Then** it notes that `.env` is gitignored and must be created from `.env.example`.
5. **Given** the test infrastructure is not yet complete, **When** I read the README, **Then** it includes placeholder sections for test commands (to be completed in Epic 5).

## Tasks / Subtasks

- [x] Task 1: Replace the placeholder README.md at project root (AC: #1, #2, #3, #4, #5)
  - [x] 1.1: Write project title and one-line description
  - [x] 1.2: Write Prerequisites section (Docker, Docker Compose, Node.js >= 18, Python 3.12+ for local dev)
  - [x] 1.3: Write Quick Start section with step-by-step commands:
    - Clone repo
    - `cp .env.example .env`
    - `docker-compose up` (or `docker compose up`)
    - Open `http://localhost` in browser
  - [x] 1.4: Write Development Setup section:
    - `pre-commit install` instruction (must be run after cloning, hooks are NOT active until this runs)
    - Brief explanation of what hooks enforce (ruff formatting/linting, ty type checking, conventional commits)
  - [x] 1.5: Write Architecture Overview section (brief):
    - Frontend: Vue 3 + TypeScript + Vite, served via Nginx on port 80
    - Backend: FastAPI + SQLAlchemy + SQLite, internal port 8000
    - Nginx reverse proxy: `/api/` routes to backend, everything else serves frontend
    - Persistence: Docker named volume `db-data` at `/app/data`
  - [x] 1.6: Write Data Safety / Stack Management section:
    - `docker-compose down` preserves data (volume retained)
    - `docker-compose down -v` **permanently deletes all todo data** (bold warning)
    - `docker-compose up --build` to rebuild after code changes
  - [x] 1.7: Write Environment Variables section documenting `.env.example` contents:
    - `DATABASE_URL` - SQLite connection string
    - `ALLOWED_ORIGINS` - CORS origins for production
    - `ENABLE_DOCS` - FastAPI Swagger UI toggle
  - [x] 1.8: Write placeholder Testing section:
    - Backend tests: `cd todo-backend && uv run pytest` (placeholder - to be expanded in Epic 5)
    - Frontend tests: `cd todo-frontend && npm run test:unit` (placeholder - to be expanded in Epic 5)
    - E2E tests: placeholder noting Playwright setup coming in Epic 5
  - [x] 1.9: Write placeholder API Documentation section noting `ENABLE_DOCS=true` for local Swagger UI at `/docs`
- [x] Task 2: Verify README accuracy against existing project state (AC: #1, #2, #3, #4)
  - [x] 2.1: Confirm all referenced files exist (`.env.example`, `.pre-commit-config.yaml`, `docker-compose.yml`)
  - [x] 2.2: Confirm `.env.example` variables match what README documents
  - [x] 2.3: Confirm docker-compose service names match README (`backend`, `frontend`)
  - [x] 2.4: Confirm port numbers match (80 external, 8000 internal backend)

### Review Findings

- [x] [Review][Decision] Scope boundary for Story 1.4 vs planning changes — Kept in scope for this Story 1.4 review per user decision.
- [x] [Review][Patch] Make Quick Start browser step cross-platform [README.md:26]
- [x] [Review][Patch] Avoid overwriting existing `.env` on reruns [README.md:19]
- [x] [Review][Patch] Fix completion note that contradicts changed files in this diff [_bmad-output/implementation-artifacts/1-4-minimal-readme-and-developer-onboarding.md:134]

## Dev Notes

### Critical Constraints

- **This is a MINIMAL README** - Epic 5 Story 5.3 will expand it to full documentation with complete test suite instructions, contribution guidelines, and comprehensive API docs. Do NOT over-engineer.
- **The existing `README.md` contains only `# nf-bmad-todo`** - it must be fully replaced, not appended to.
- **Do NOT add content beyond what's needed for "clone, configure, run, verify"** plus the required warnings and placeholders.

### Project Structure Notes

- README lives at project root: `/README.md`
- No other files need to be created or modified for this story
- The README documents infrastructure created in Stories 1.1-1.3; it does not create new infrastructure

### What Already Exists (from Stories 1.1-1.3)

| Artifact | Status | Location |
|----------|--------|----------|
| `.env.example` | Exists | Project root - contains `DATABASE_URL`, `ALLOWED_ORIGINS`, `ENABLE_DOCS` |
| `.pre-commit-config.yaml` | Exists | Project root - ruff, ty, conventional commits hooks |
| `docker-compose.yml` | Exists | Project root - `backend` + `frontend` services, `db-data` volume |
| `todo-backend/Dockerfile` | Exists | Multi-stage, non-root `appuser`, `/app/data` volume mount |
| `todo-frontend/Dockerfile` | Exists | Multi-stage, Vite build + Nginx serve |
| `todo-frontend/nginx.conf` | Exists | Explicit `/api/` proxy to `backend:8000` |
| `todo-backend/pyproject.toml` | Exists | uv-managed Python project with ruff/ty/pytest deps |
| `todo-frontend/package.json` | Exists | Vue 3 scaffold with Vitest, ESLint, Prettier |

### Infrastructure Facts the README Must Reflect Accurately

- **Docker volume triple-lock:** `db-data` (volume name) + `/app/data` (mount path) + `sqlite+aiosqlite:////app/data/todos.db` (DATABASE_URL) - all three must agree
- **Nginx routing:** `location /api/ { proxy_pass http://backend:8000/api/; }` - explicit path, no wildcard
- **`VITE_API_URL` is always empty string** - Nginx handles routing in prod, Vite proxy in dev. Do NOT document `VITE_API_URL` as a user-configurable variable
- **Health checks:** Backend polls `/api/v1/health`; frontend depends on backend via `depends_on: condition: service_healthy`
- **App reachable at `http://localhost`** (port 80, not 8080 or 3000)

### Anti-Patterns to Avoid

- Do NOT document internal implementation details (SQLAlchemy models, Pydantic schemas, etc.)
- Do NOT include troubleshooting sections yet (Epic 5 scope)
- Do NOT add badges, CI status, or contribution guidelines yet
- Do NOT document the API endpoints in detail (just mention `/docs` with `ENABLE_DOCS=true`)
- Do NOT create any new configuration files or scripts
- Do NOT document Makefile targets in detail — Story 1.5 owns the Makefile; this README only mentions `make help` and a few key shortcuts
- Do NOT modify `docker-compose.yml`, Dockerfiles, or any other existing files

### README Tone & Style

- Direct, imperative instructions ("Run...", "Copy...", "Open...")
- Use fenced code blocks for all commands
- Keep sections short - this is a quick-start guide, not a wiki
- Use standard Markdown (GitHub-flavored)

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 1, Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture.md - Project Structure, Infrastructure Patterns]
- [Source: _bmad-output/project-context.md - Technology Stack, Infrastructure Gotchas]
- [Source: _bmad-output/implementation-artifacts/1-3-docker-compose-stack-and-health-checks.md - Completion Notes, File List]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — straightforward documentation task.

### Completion Notes List

- Replaced placeholder `README.md` (previously just `# nf-bmad-todo`) with full developer onboarding guide
- Verified all referenced files exist: `.env.example`, `.pre-commit-config.yaml`, `docker-compose.yml`
- Confirmed `.env.example` variables (`DATABASE_URL`, `ALLOWED_ORIGINS`, `ENABLE_DOCS`) match README table
- Confirmed service names (`backend`, `frontend`) and port mappings (80 external, 8000 internal) match docker-compose.yml
- README includes explicit `docker-compose down -v` data loss warning (AC #3 satisfied)
- README notes `.env` must be created from `.env.example` (AC #4 satisfied)
- Placeholder Testing and API Documentation sections included for Epic 5 expansion (AC #5 satisfied)
- Additional planning/sprint artifacts were updated in this branch; see git diff for the full file list.

### File List

- README.md

### Change Log

- 2026-03-31: Story 1.4 implemented — replaced placeholder README.md with minimal developer onboarding guide covering Quick Start, Development Setup, Architecture Overview, Data Safety, Environment Variables, Testing (placeholder), and API Documentation (placeholder)
