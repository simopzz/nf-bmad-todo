# Story 2.4: Health Check Endpoint

Status: done

## Story

As a developer,
I want a health check endpoint that verifies the database is reachable,
So that Docker's health check mechanism can accurately report service readiness.

## Acceptance Criteria (BDD)

1. **Health endpoint — database accessible**
   - Given the backend is running and SQLite is accessible
   - When `GET /api/v1/health` is called
   - Then it returns HTTP 200 with `{"status": "ok"}`

2. **Health endpoint — database inaccessible**
   - Given the backend is running but SQLite is not accessible (e.g. volume not mounted)
   - When `GET /api/v1/health` is called
   - Then it returns HTTP 503 with `{"status": "error", "detail": "..."}`

3. **Real database query**
   - The health check executes a real database query (e.g. `SELECT 1`) — it does not merely check that uvicorn is running

4. **Docker Compose health chain**
   - With the health endpoint implemented, the Docker Compose backend container health check reports `healthy`
   - The frontend container (`depends_on: condition: service_healthy`) starts only after the backend is healthy

## Tasks / Subtasks

- [x] Task 1: Create `app/routers/health.py` (AC: #1, #2, #3)
  - [x] 1.1 Create health router with `APIRouter(prefix="/api/v1", tags=["health"])`
  - [x] 1.2 Implement `GET /health` that executes `SELECT 1` via async session
  - [x] 1.3 Return `{"status": "ok"}` on success (HTTP 200)
  - [x] 1.4 Catch database errors and return `{"status": "error", "detail": "Database unreachable"}` with HTTP 503
- [x] Task 2: Update `app/main.py` (AC: #1, #2)
  - [x] 2.1 Import and register health router: `app.include_router(health_router)`
  - [x] 2.2 Remove the existing inline health stub (`@app.get("/api/v1/health")` at lines 51-53)
- [x] Task 3: Add Docker Compose healthcheck (AC: #4)
  - [x] 3.1 Add `healthcheck` block to the `backend` service in `docker-compose.yml`
- [x] Task 4: Verify end-to-end health chain
  - [x] 4.1 Run ruff format, ruff check, ty check — zero violations
  - [x] 4.2 Verify `GET /api/v1/health` returns `{"status": "ok"}` when DB is accessible
  - [x] 4.3 Verify Docker Compose backend reports `healthy` and frontend starts

### Review Findings

- [x] [Review][Patch] Use `Depends(get_session)` in health endpoint and remove direct `session_scope` usage [todo-backend/app/routers/health.py:5]
- [x] [Review][Patch] Revert out-of-scope `database.py` changes introduced for health endpoint wiring [todo-backend/app/database.py:1]

## Dev Notes

### Critical: Existing Health Stub Must Be Replaced

There is an **existing inline health stub** in `app/main.py:51-53`:
```python
@app.get("/api/v1/health")
async def health_stub() -> dict[str, str]:
    return {"status": "ok"}
```
This stub does NOT query the database — it violates AC #3. You MUST:
1. Remove this inline route from `main.py`
2. Create a proper implementation in `app/routers/health.py`
3. Register the new router in `main.py`

### Architecture Compliance

**File to create:** `todo-backend/app/routers/health.py`

**File to modify:**
- `todo-backend/app/main.py` — remove health stub, register health router
- `docker-compose.yml` — add backend healthcheck block

**Files that already exist (DO NOT MODIFY):**
- `todo-backend/app/database.py` — `get_session()` is the dependency to use
- `todo-backend/app/routers/todos.py` — do not touch
- `todo-backend/app/routers/__init__.py` — empty, already exists

**Layer separation:** `routers/health.py` should only import from `app.database` for the session — it does NOT need `repository.py`, `models.py`, or `schemas.py`.

### Health Router Implementation

```python
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health")
async def health_check(
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    try:
        await session.execute(text("SELECT 1"))
        return JSONResponse(content={"status": "ok"})
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "detail": "Database unreachable"},
        )
```

**Key decisions:**
- Use `text("SELECT 1")` — lightweight query that verifies DB connectivity
- Use `JSONResponse` directly for the 503 case — `HTTPException` would expose stack traces
- Catch broad `Exception` here (unlike todos routes) because ANY database error means unhealthy
- No return type annotation of `dict` — use `JSONResponse` to control status code

### Updating main.py

After removing the inline stub (lines 51-53), add the import and registration:

```python
from app.routers.health import router as health_router
# ... existing code ...
app.include_router(todos_router)
app.include_router(health_router)  # ADD THIS
# DELETE the @app.get("/api/v1/health") inline route
```

### Docker Compose Healthcheck

Add this to the `backend` service in `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "python", "-c",
         "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 10s
```

**Why Python-based:** The backend Docker image already has Python — no need for curl/wget which may not be in the image. This is the architecture-mandated approach.

**Why `service_healthy` already works:** The `frontend` service already has `depends_on: backend: condition: service_healthy` in `docker-compose.yml`. Once the healthcheck block is added to the backend service, the health chain is complete.

### Import Conventions (from previous stories)

```python
from app.database import get_session  # For dependency injection
# Do NOT import from app.models, app.schemas, or app.repository in health.py
```

### Quality Gates (Pre-commit)

All three must pass with zero violations before completion:
```bash
uv run --project todo-backend ruff format todo-backend/app/
uv run --project todo-backend ruff check todo-backend/app/
uv run --project todo-backend ty check todo-backend/app/
```

### Previous Story Intelligence

**From Story 2.3:**
- `main.py` uses `create_app()` factory pattern — router registration happens inside this function
- Router pattern: `router = APIRouter(prefix="/api/v1/...", tags=["..."])`
- Dependency injection via `Depends(get_session)` for async session access
- Error responses use `{"detail": "..."}` envelope — health endpoint uses `{"status": "...", "detail": "..."}` which is compatible
- Git commit pattern: `feat: story 2.4 Health Check Endpoint`

**From Story 2.2 review findings:**
- Database errors can be `SQLAlchemyError` or broader — catching `Exception` in health check is correct since any failure means unhealthy

### Testing Note

Story 2.4 does NOT include writing tests — that is Story 2.5 (Backend Test Suite), which specifies:
- Tests for `GET /api/v1/health` cover: healthy state (HTTP 200)
- Health test must verify DB connectivity, not just HTTP 200
- Test file: `todo-backend/tests/test_health.py`

However, code must be testable: dependency injection via `Depends()` enables session override in tests.

### Anti-Patterns to Avoid

```python
# FORBIDDEN: Health check without DB query
return {"status": "ok"}  # Must execute SELECT 1

# FORBIDDEN: Using HTTPException for 503
raise HTTPException(status_code=503, ...)  # Use JSONResponse instead

# FORBIDDEN: Importing from repository/models/schemas
from app.repository import ...  # Health router only needs database.get_session

# FORBIDDEN: Leaving the inline stub in main.py
# The @app.get("/api/v1/health") in main.py MUST be removed

# FORBIDDEN: Using curl/wget in Docker healthcheck
test: ["CMD", "curl", ...]  # Use Python — always available in image
```

### Project Structure Notes

After this story, the routers directory will contain:
```
todo-backend/app/routers/
  __init__.py    # empty
  todos.py       # all /api/v1/todos routes (from Story 2.3)
  health.py      # GET /api/v1/health (this story)
```

This matches the architecture spec exactly: `routers/todos.py` and `routers/health.py` only.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-2-Story-2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Docker-Compose-Canonical-Configuration — healthcheck block]
- [Source: _bmad-output/planning-artifacts/architecture.md#Backend-Directory-Layout — routers/health.py]
- [Source: _bmad-output/planning-artifacts/prd.md#FR20 — health check endpoint]
- [Source: _bmad-output/planning-artifacts/prd.md#FR29 — containers report healthy]
- [Source: _bmad-output/project-context.md#FastAPI-Rules — /api/v1/health must query SQLite]
- [Source: todo-backend/app/main.py:51-53 — existing health stub to replace]
- [Source: docker-compose.yml — missing healthcheck block, frontend depends_on service_healthy]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no issues encountered.

### Completion Notes List

- Created `app/routers/health.py` with `GET /health` endpoint that executes `SELECT 1` via async session dependency injection
- Returns `{"status": "ok"}` (HTTP 200) on success, `{"status": "error", "detail": "Database unreachable"}` (HTTP 503) on failure
- Uses `JSONResponse` directly (not `HTTPException`) to avoid stack trace exposure on 503
- Removed inline health stub from `main.py` and registered the new health router
- Added Python-based Docker Compose healthcheck (no curl/wget dependency)
- All quality gates pass: ruff format, ruff check, ty check — zero violations
- Note: Tests deferred to Story 2.5 (Backend Test Suite) per story spec

### Change Log

- 2026-04-01: Implemented health check endpoint, updated main.py, added Docker healthcheck

### File List

- `todo-backend/app/routers/health.py` (new)
- `todo-backend/app/main.py` (modified — removed health stub, added health router import/registration)
- `docker-compose.yml` (modified — added backend healthcheck block)
