# Story 1.3: Docker Compose Stack & Health Checks

Status: done

## Story

As a developer,
I want a single `docker-compose up` command that starts the complete application stack with all services healthy,
so that I can verify the application is running without any manual configuration steps.

## Acceptance Criteria

1. **Given** I have cloned the repository and copied `.env.example` to `.env`  
   **When** I run `docker-compose up`  
   **Then** `docker-compose.yml` is syntactically valid and both containers start without errors

2. **And** the backend container health check is configured to poll `GET /api/v1/health` with appropriate interval and retries — full health verification (containers reporting `healthy`) is completed in Story 2.4 once the endpoint exists

3. **And** `GET /` (Nginx) returns HTTP 200 serving the Vue SPA static assets

4. **And** the named volume `db-data` is mounted at `/app/data` in the backend container and `DATABASE_URL` points to `sqlite+aiosqlite:////app/data/todos.db`

5. **And** running `docker-compose down` followed by `docker-compose up` preserves all data (volume survives restart)

6. **And** the Nginx config routes `location /api/` to `http://backend:8000/api/` explicitly — no wildcard proxy

7. **And** `VITE_API_URL` is intentionally absent from `docker-compose.yml` — Nginx handles all routing

8. **And** the backend Dockerfile uses a multi-stage build: a build stage (uv install) and a runtime stage (copy app only); the runtime stage runs as a non-root `appuser`; the volume directory `/app/data` has ownership set to `appuser` before the `USER` switch

9. **And** the frontend Dockerfile uses a multi-stage build: a Vite build stage producing `dist/` and an Nginx serve stage copying `dist/` to `/usr/share/nginx/html`

10. **And** end-to-end volume write verified: after `docker-compose up`, a todo is created via `POST /api/v1/todos`, then `docker-compose restart` is run, and the todo is still returned by `GET /api/v1/todos` — confirming the volume write path works with correct file ownership

## Tasks / Subtasks

- [x] Author root `docker-compose.yml` with canonical service and volume names (AC: 1, 3, 4, 6, 7)
  - [x] Define `backend` and `frontend` services and named volume `db-data`
  - [x] Mount `db-data` to `/app/data` in backend and pass `DATABASE_URL` from `.env`
  - [x] Expose frontend on port `80`
  - [x] Keep `VITE_API_URL` absent from compose config

- [x] Add backend container image definition in `todo-backend/Dockerfile` (AC: 8)
  - [x] Use multi-stage build (`uv` install/build stage + runtime stage)
  - [x] Create non-root runtime user `appuser`
  - [x] Ensure `/app/data` exists and is owned by `appuser` before `USER appuser`
  - [x] Configure backend container healthcheck polling `http://localhost:8000/api/v1/health` with interval/timeout/retries

- [x] Add frontend image and reverse-proxy setup (AC: 3, 6, 9)
  - [x] Create `todo-frontend/Dockerfile` as multi-stage (Vite build -> Nginx runtime)
  - [x] Add `todo-frontend/nginx.conf` with explicit `location /api/ { proxy_pass http://backend:8000/api/; }`
  - [x] Include `mime.types` and static asset serving root `/usr/share/nginx/html`

- [x] Validate compose startup and static serving behavior (AC: 1, 3)
  - [x] Run `docker compose config` for syntax validation
  - [x] Run `docker compose up --build -d` and verify both services start
  - [x] Verify `GET /` returns HTTP 200 and serves frontend assets

- [x] Validate persistence and volume behavior (AC: 4, 5, 10)
  - [x] Verify `docker compose down` then `docker compose up` preserves named volume
  - [x] Verify end-to-end write persistence across `docker compose restart` once `/api/v1/todos` exists
  - [x] If CRUD endpoints are not yet present, record the command sequence for Story 2.3/2.4 completion and keep infrastructure wiring complete now

- [x] Resolve known deferred infrastructure risk from Story 1.1 (AC: 4, 8)
  - [x] Ensure backend runtime guarantees `/app/data` path exists at container startup
  - [x] Confirm SQLite file creation/write succeeds with non-root permissions

### Review Findings

- [x] [Review][Patch] Missing `.dockerignore` files in both `todo-backend/` and `todo-frontend/` — `COPY . .` sends `node_modules/`, `.git/`, test configs into build context; risks stale host binaries shadowing `npm ci` output and slow builds [todo-frontend/Dockerfile:8, todo-backend/Dockerfile]
- [x] [Review][Defer] Placeholder `http.server` backend serves `/app` filesystem including `.venv` — reachable via Nginx `/api/` proxy during dev. Temporary stub, replaced in Story 2 when FastAPI app module is introduced — deferred, pre-existing by design

## Dev Notes

- This story is an infrastructure bridge between Epic 1 scaffolding and Epic 2 backend runtime behavior. Keep scope focused on Docker Compose, container build/runtime setup, reverse proxy, and persistence wiring.

- Story 1.1 and 1.2 are complete and provide required preconditions: repository scaffold, `.env.example`, and pre-commit tooling are already present.

### Critical Technical Guardrails

- Canonical service names must remain: `backend`, `frontend`, and volume `db-data`.

- Canonical DB path lock must remain aligned: `db-data` (volume name) -> `/app/data` (mount path) -> `sqlite+aiosqlite:////app/data/todos.db` (`DATABASE_URL`).

- Nginx route must be explicit and stable:
  - `location /api/ { proxy_pass http://backend:8000/api/; }`
  - No wildcard proxying.

- Keep `VITE_API_URL` out of `docker-compose.yml`; production routing is handled by Nginx, and dev routing by Vite proxy.

- Backend container must run as non-root user and own `/app/data` before runtime.

### Cross-Story Dependency Intelligence

- AC #2 configures healthcheck polling to `/api/v1/health`; full "healthy container" validation is completed in Story 2.4 when health endpoint semantics are implemented (real DB check).

- AC #10 depends on CRUD endpoints from Epic 2 (`POST/GET /api/v1/todos`). Infrastructure and persistence wiring are implemented here; end-to-end API write verification can be executed as soon as Story 2.3 endpoints are available.

- Deferred risk already tracked from Story 1.1: `/app/data` may not exist in runtime image. This story must close that risk in Dockerfile/runtime setup.

### Existing Project State (for Implementation Planning)

- No `docker-compose.yml` exists yet.
- No `Dockerfile` files exist yet.
- No Nginx config file exists yet.
- `todo-backend/` currently has project config only (`pyproject.toml`, `uv.lock`) and no app module yet.
- `todo-frontend/` exists from Vue scaffold.

### Testing Standards for This Story

- Use Docker Compose commands for validation: `docker compose config`, `docker compose up`, `docker compose ps`, `docker compose down`.

- Validate frontend availability through `GET /` on port 80.

- Validate persistence behavior across lifecycle commands (`down`/`up`, then later `restart` + API assertions when endpoints exist).

- Keep Playwright base URL contract unchanged: `http://localhost:80`.

### Git Intelligence Summary

- Recent commits indicate completed scaffolding and quality pipeline stories (`1.1`, `1.2`), and sprint tracking already includes this story as backlog.

- Story files in `_bmad-output/implementation-artifacts` show established conventions:
  - explicit scope boundaries,
  - actionable tasks tied to AC numbers,
  - references tied to planning artifacts.

### Latest Technical Information

- Docker Compose `healthcheck` remains standard service configuration with explicit probe command and timing parameters (`interval`, `timeout`, `retries`, `start_period`).  
  [Source: docs.docker.com Compose services/healthcheck]

- Nginx `proxy_pass` behavior remains path-sensitive; explicit `location /api/` + explicit upstream path avoids accidental routing drift.  
  [Source: nginx.org `ngx_http_proxy_module` docs]

- FastAPI metadata/docs controls remain configurable at app initialization and align with project requirement to disable docs in production via env configuration.  
  [Source: fastapi.tiangolo.com metadata tutorial]

### Project Structure Notes

- Expected files to create in this story:
  - `docker-compose.yml` (repo root)
  - `todo-backend/Dockerfile`
  - `todo-frontend/Dockerfile`
  - `todo-frontend/nginx.conf`

- Keep alignment with architecture structure while acknowledging sequencing:
  - Docker infrastructure lands in Epic 1,
  - backend app routers/endpoints land in Epic 2.

### References

- Story definition and AC source: [Source: `_bmad-output/planning-artifacts/epics.md#Story-1.3-Docker-Compose-Stack--Health-Checks`]
- Epic 1 scope and FR mapping: [Source: `_bmad-output/planning-artifacts/epics.md#Epic-1-Project-Scaffold--Development-Infrastructure`]
- Deferred infra risk (`/app/data` startup path): [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]
- Canonical Docker/volume/routing rules: [Source: `_bmad-output/planning-artifacts/architecture.md#Infrastructure-Patterns`]
- Canonical compose defaults and healthcheck sample: [Source: `_bmad-output/planning-artifacts/architecture.md#Docker-Compose-Canonical-Configuration`]
- Deployment requirements FR28–31: [Source: `_bmad-output/planning-artifacts/prd.md#Deployment--Operations`]
- Project-level implementation constraints: [Source: `_bmad-output/project-context.md#Critical-Implementation-Rules`]

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (model ID: gpt-5.3-codex)

### Debug Log References

- Sprint status auto-discovery selected `1-3-docker-compose-stack-and-health-checks` as first backlog story.
- Existing implementation artifacts analyzed: `1-1` and `1-2` stories plus deferred work register.
- Baseline red-phase check confirmed missing compose file (`docker compose config` failed before implementation).
- Green-phase validation passed: `docker compose config`, `docker compose up --build -d`, `docker compose ps`, and `curl http://localhost/` (`200`).
- Persistence probe verified via SQLite write/read in mounted `/app/data/todos.db` before and after `docker compose down && docker compose up -d` and after `docker compose restart backend` (row count preserved: `2 -> 2 -> 2`).

### Completion Notes List

- Implemented root `docker-compose.yml` with canonical services (`backend`, `frontend`) and volume (`db-data`), mounted to `/app/data` with backend env loaded from `.env`.
- Implemented backend multi-stage Dockerfile using uv build stage + runtime stage, non-root `appuser`, `/app/data` creation/ownership before `USER`, and healthcheck polling `GET /api/v1/health`.
- Implemented frontend multi-stage Dockerfile (Vite build -> Nginx runtime) and explicit Nginx reverse-proxy config: `location /api/ { proxy_pass http://backend:8000/api/; }`, with `mime.types` and SPA static serving.
- Verified static serving (`GET /` returned `200`) and service startup using compose commands.
- Verified deferred infrastructure risk is closed by confirming non-root write access and SQLite file creation in `/app/data`.
- Recorded AC #10 command sequence for Story 2.3/2.4 API-level verification (when CRUD endpoints exist):
  - `docker compose up --build -d`
  - `curl -X POST http://localhost/api/v1/todos -H 'content-type: application/json' -d '{"title":"story-1-3-persist-check"}'`
  - `docker compose restart backend`
  - `curl http://localhost/api/v1/todos`
  - Assert created todo remains present after restart.

### File List

- `docker-compose.yml` (created)
- `todo-backend/Dockerfile` (created)
- `todo-frontend/Dockerfile` (created)
- `todo-frontend/nginx.conf` (created)
- `_bmad-output/implementation-artifacts/1-3-docker-compose-stack-and-health-checks.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

### Change Log

- 2026-03-30: Implemented Story 1.3 Docker infrastructure (compose stack, backend/frontend Dockerfiles, Nginx reverse proxy, volume persistence wiring, non-root runtime hardening, and compose validation runs).
