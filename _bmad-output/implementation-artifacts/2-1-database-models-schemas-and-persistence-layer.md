# Story 2.1: Database Models, Schemas & Persistence Layer

Status: done

## Story

As a developer,
I want SQLAlchemy models, Pydantic schemas, and database initialisation configured,
so that the backend has a typed, validated data layer before any endpoints are built.

## Acceptance Criteria

1. **Given** the backend project exists from Story 1.1, **When** the backend starts, **Then** `TodoRecord` SQLAlchemy model exists with fields: `id` (Integer, auto-increment primary key), `title` (String, non-null), `completed` (Boolean, default False), `created_at` (DateTime, server default utcnow).
2. **Given** the backend starts, **Then** `TodoCreate` Pydantic schema accepts `title` (non-empty string); Pydantic rejects empty or whitespace-only titles at the schema level (`min_length=1, max_length=500`).
3. **Given** the backend starts, **Then** `TodoUpdate` Pydantic schema accepts optional `title` and optional `completed` — both independently nullable.
4. **Given** the backend starts, **Then** `TodoResponse` Pydantic schema exposes `id`, `title`, `completed`, `created_at`.
5. **Given** the backend starts, **Then** `database.py` creates all tables on startup via a FastAPI lifespan context manager — table creation is NOT triggered at import time or as a module-level side effect.
6. **Given** the backend starts, **Then** `repository.py` is the only file that maps between `TodoRecord` and Pydantic schemas — no direct ORM access outside this file.
7. **Given** a PATCH body where both `title=None` and `completed=None`, **Then** `TodoUpdate` raises a `ValueError` in Pydantic validation — an empty PATCH body is not permitted (HTTP 400 in Story 2.3).
8. **Given** the app module exists, **Then** the backend `Dockerfile` `CMD` is updated from the `http.server` placeholder to `uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers`.
9. **Given** the app starts, **Then** `GET /api/v1/health` returns HTTP 200 `{"status": "ok"}` — a minimal health stub so the Docker Compose health check stops failing (full implementation in Story 2.4).
10. **Given** `ALLOWED_ORIGINS` env var is set to a space-separated string, **Then** FastAPI CORS middleware uses those origins (production); in development the Vite proxy makes CORS irrelevant.

## Tasks / Subtasks

- [x] Task 1: Create backend `app/` package structure (AC: #1–#7)
  - [x] 1.1: Create `todo-backend/app/__init__.py` (empty)
  - [x] 1.2: Create `todo-backend/app/models.py` — `TodoRecord` SQLAlchemy model + `Base`
  - [x] 1.3: Create `todo-backend/app/schemas.py` — `TodoCreate`, `TodoUpdate`, `TodoResponse`
  - [x] 1.4: Create `todo-backend/app/database.py` — async engine, session factory, `create_tables()`
  - [x] 1.5: Create `todo-backend/app/repository.py` — `NotFoundError` + `TodoRepository` stub (all methods raise `NotImplementedError` for now — will be implemented in Story 2.2)
  - [x] 1.6: Create `todo-backend/app/routers/__init__.py` (empty)
- [x] Task 2: Create `main.py` with lifespan, CORS, and minimal health stub (AC: #5, #9, #10)
  - [x] 2.1: Create `todo-backend/app/main.py` — FastAPI app with lifespan context manager calling `create_tables()`
  - [x] 2.2: Add CORS middleware using `ALLOWED_ORIGINS` env var (space-separated, default `""`)
  - [x] 2.3: Add `GET /api/v1/health` stub returning `{"status": "ok"}` — enough for Docker health check
  - [x] 2.4: Add startup log: `logger.info(f"CORS origins: {allowed_origins}")`
  - [x] 2.5: Disable OpenAPI docs when `ENABLE_DOCS != "true"` (env var check)
- [x] Task 3: Update Dockerfile CMD (AC: #8)
  - [x] 3.1: Replace `CMD ["python", "-m", "http.server", "8000", "--bind", "0.0.0.0"]` with `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]`
  - [x] 3.2: Add `COPY app/ app/` instruction in the Dockerfile runtime stage (before `USER appuser`)
- [x] Task 4: Configure pytest-asyncio (AC: implied by test patterns)
  - [x] 4.1: Add `[tool.pytest.ini_options] asyncio_mode = "auto"` to `todo-backend/pyproject.toml`
- [x] Task 5: Pre-commit and type-check validation
  - [x] 5.1: Run `ruff format todo-backend/app/` and `ruff check todo-backend/app/` — zero violations
  - [x] 5.2: Run `ty check todo-backend/app/` — zero errors (all functions/methods must have type annotations)

### Review Findings

- [x] [Review][Decision] `TodoCreate` missing `extra="forbid"` — fixed: added `model_config = ConfigDict(extra="forbid")` to `TodoCreate`
- [x] [Review][Decision] `TodoCreate` whitespace validator rejects but does not strip — fixed: validators in both `TodoCreate` and `TodoUpdate` now return `value.strip()`
- [x] [Review][Patch] `get_session()` return type is `AsyncIterator[AsyncSession]` — fixed: updated to `AsyncGenerator[AsyncSession]` [todo-backend/app/database.py:19]
- [x] [Review][Patch] SQLite `/app/data/` directory not created in Dockerfile — pre-existing fix confirmed: `mkdir -p /app/data` already in Dockerfile line 18
- [x] [Review][Patch] `COPY app/ app/` uses no `--chown` flag — fixed: `COPY --chown=appuser:appuser app/ app/` [todo-backend/Dockerfile]
- [x] [Review][Patch] CORS: `allow_credentials=True` with no guard against `ALLOWED_ORIGINS=*` — fixed: startup `ValueError` raised when `*` detected in origins [todo-backend/app/main.py]
- [x] [Review][Defer] `--proxy-headers` enabled without `--forwarded-allow-ips` — clients can spoof `X-Forwarded-For`; low severity for internal use, address in production hardening story [todo-backend/Dockerfile CMD]
- [x] [Review][Defer] No migration strategy — `create_all` is a no-op on existing schema; future column changes will be silently skipped; introduce Alembic in a later story — deferred, v1 design decision per spec
- [x] [Review][Defer] `TodoRecord.title` has no DB-level length constraint — `max_length=500` enforced at API layer only; DB-bypass inserts can store unbounded strings — deferred, pre-existing architectural choice
- [x] [Review][Defer] `TodoUpdate.field_validator("title")` `if value is not None` guard is dead code — Pydantic v2 skips field validators for `None` on Optional fields; `None` branch is unreachable — deferred, behavior is correct, code clarity only

## Dev Notes

### What Exists — Do NOT Re-create

| File | Location | Status |
|------|----------|--------|
| `pyproject.toml` | `todo-backend/` | Exists — all deps already pinned. Do NOT run `uv add`. |
| `Dockerfile` | `todo-backend/` | Exists — update CMD only, do not restructure the multi-stage build |
| `uv.lock` | `todo-backend/` | Exists — do not touch |
| `docker-compose.yml` | repo root | Exists — do not touch |
| `.pre-commit-config.yaml` | repo root | Exists — do not touch |

### Backend Package Layout (create these)

```
todo-backend/
  app/
    __init__.py          ← empty
    main.py              ← FastAPI app + lifespan + CORS + health stub
    models.py            ← TodoRecord (SQLAlchemy)
    schemas.py           ← TodoCreate, TodoUpdate, TodoResponse
    database.py          ← engine + session factory + create_tables()
    repository.py        ← NotFoundError + TodoRepository (stub methods)
    routers/
      __init__.py        ← empty
  tests/                 ← NOT created in this story (Story 2.5)
```

### Canonical Implementations

**`models.py`:**
```python
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class TodoRecord(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
```

**`schemas.py`:**
```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)


class TodoUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    completed: bool | None = None
    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def at_least_one_field(self) -> "TodoUpdate":
        if self.title is None and self.completed is None:
            raise ValueError("At least one of 'title' or 'completed' must be provided")
        return self


class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool
    created_at: datetime
```

**Critical**: `TodoResponse` uses NO `from_attributes=True` — Pydantic and SQLAlchemy are independent layers. `repository.py` owns the mapping. Do NOT add `model_config = ConfigDict(from_attributes=True)` to any schema.

**`database.py`:**
```python
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import Base

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:////app/data/todos.db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:  # type: ignore[return]
    async with AsyncSessionLocal() as session:
        yield session
```

**Do NOT call `create_tables()` at module level** — only call it from the lifespan context manager in `main.py`.

**`repository.py`:**
```python
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import TodoCreate, TodoResponse, TodoUpdate


class NotFoundError(Exception):
    pass


class TodoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all(self) -> list[TodoResponse]:
        raise NotImplementedError("Implemented in Story 2.2")

    async def create(self, data: TodoCreate) -> TodoResponse:
        raise NotImplementedError("Implemented in Story 2.2")

    async def update(self, id: int, data: TodoUpdate) -> TodoResponse:
        raise NotImplementedError("Implemented in Story 2.2")

    async def delete(self, id: int) -> None:
        raise NotImplementedError("Implemented in Story 2.2")
```

**`main.py`:**
```python
import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await create_tables()
    yield


def create_app() -> FastAPI:
    enable_docs = os.environ.get("ENABLE_DOCS", "false").lower() == "true"
    app = FastAPI(
        title="Todo API",
        lifespan=lifespan,
        docs_url="/docs" if enable_docs else None,
        redoc_url="/redoc" if enable_docs else None,
        openapi_url="/openapi.json" if enable_docs else None,
    )

    raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
    allowed_origins = [o for o in raw_origins.split() if o]
    logger.info(f"CORS origins: {allowed_origins}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/v1/health")
    async def health_stub() -> dict[str, str]:
        """Minimal stub — real DB check implemented in Story 2.4."""
        return {"status": "ok"}

    return app


app = create_app()
```

### Dockerfile Update (Task 3)

Change the `CMD` line (the last line) in `todo-backend/Dockerfile`:

**Before:**
```dockerfile
CMD ["python", "-m", "http.server", "8000", "--bind", "0.0.0.0"]
```

**After:**
```dockerfile
COPY app/ app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
```

Add `COPY app/ app/` BEFORE the `USER appuser` line — files must be owned by `appuser` or accessible to it. The final Dockerfile runtime stage order should be:
1. `COPY --from=build /build/.venv /app/.venv`
2. `HEALTHCHECK ...`
3. `COPY app/ app/`
4. `USER appuser`
5. `EXPOSE 8000`
6. `CMD [...]`

### pytest-asyncio Configuration

`pytest-asyncio>=0.26.0` is already in `pyproject.toml`. Add this to `todo-backend/pyproject.toml`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

Without this, async test functions will fail silently with `PytestUnraisableExceptionWarning` or be collected but not awaited.

### Type Annotation Requirements

Every function and method MUST have complete type annotations — `ty` enforces zero errors:
- `create_tables() -> None`
- `get_session() -> AsyncSession` (with `yield` — use `AsyncGenerator[AsyncSession, None]` or `# type: ignore[return]`)
- `TodoRepository.__init__(self, session: AsyncSession) -> None`
- All repository methods: return types as shown above
- `health_stub() -> dict[str, str]`

### Dependency Versions (from pyproject.toml — DO NOT change)

| Package | Version |
|---------|---------|
| fastapi | >=0.135.2 |
| sqlalchemy | >=2.0.48 |
| aiosqlite | >=0.22.1 |
| uvicorn[standard] | >=0.42.0 |
| pytest-asyncio | >=0.26.0 |

### Anti-Patterns to Avoid

- ❌ `from_attributes=True` on any Pydantic schema — Pydantic and SQLAlchemy are independent layers
- ❌ Calling `create_tables()` at module import time — only via lifespan
- ❌ Importing `TodoRecord` in any file except `repository.py`
- ❌ Bare `except Exception:` blocks
- ❌ Running `uv add` — all deps already in `pyproject.toml`
- ❌ Touching `docker-compose.yml`, `.pre-commit-config.yaml`, `.env.example`
- ❌ Creating `tests/` directory — that's Story 2.5
- ❌ Implementing router endpoints — that's Stories 2.2–2.4

### Deferred Work Note

From `deferred-work.md`: "Placeholder `http.server` backend serves `/app` filesystem (including `.venv`) over HTTP — reachable via Nginx `/api/` proxy during dev. Temporary stub replaced in Story 2 when FastAPI app module is introduced" — **this story resolves that deferred item**.

Also from deferred work: "`ALLOWED_ORIGINS` space-separated format not validated — Story 2 CORS implementation concern" — the `main.py` above handles this with `raw_origins.split()`.

### Project Structure Notes

- All new files go under `todo-backend/app/` — no files at the `todo-backend/` root (except pyproject.toml/Dockerfile which already exist)
- Table name is `todos` (plural, snake_case) per architecture naming convention
- No migrations — `CREATE TABLE IF NOT EXISTS` on startup via `Base.metadata.create_all` is the v1 strategy

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture, Layer Separation, Pydantic Schema Contracts, Repository Contract]
- [Source: _bmad-output/planning-artifacts/architecture.md — Structure Patterns (backend directory layout)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Enforcement Rules and Anti-patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md — Test Patterns (pytest-asyncio)]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — http.server placeholder, ALLOWED_ORIGINS concern]
- [Source: todo-backend/pyproject.toml — exact installed versions]
- [Source: todo-backend/Dockerfile — existing multi-stage build structure]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

 - `uv run --project todo-backend ruff format todo-backend/app` → clean
 - `uv run --project todo-backend ruff check todo-backend/app` → all checks passed
 - `uv run --project todo-backend ty check todo-backend/app` → all checks passed
 - `uv run --project todo-backend pytest -q` → 68 passed

### Completion Notes List

- Implemented backend `app/` package with SQLAlchemy model, Pydantic schemas, database engine/session setup, repository stubs, and FastAPI app entrypoint.
- Enforced schema validation rules: `TodoCreate` and `TodoUpdate` reject whitespace-only titles; `TodoUpdate` forbids unknown fields and rejects empty patch bodies.
- Wired table creation through FastAPI lifespan only (`create_tables()` not called at import time).
- Added production-oriented CORS setup using space-separated `ALLOWED_ORIGINS`; startup CORS origin logging added.
- Added minimal `GET /api/v1/health` returning `{"status":"ok"}` for container health checks.
- Updated backend Docker runtime stage to copy `app/` and run uvicorn app entrypoint.
- Added pytest-asyncio auto mode setting in `pyproject.toml`.
- Validated implementation with repo-standard checks (ruff, ty, pytest).

### File List

- `todo-backend/app/__init__.py` (new)
- `todo-backend/app/routers/__init__.py` (new)
- `todo-backend/app/models.py` (new)
- `todo-backend/app/schemas.py` (new)
- `todo-backend/app/database.py` (new)
- `todo-backend/app/repository.py` (new)
- `todo-backend/app/main.py` (new)
- `todo-backend/Dockerfile` (modified)
- `todo-backend/pyproject.toml` (modified)
- `_bmad-output/implementation-artifacts/2-1-database-models-schemas-and-persistence-layer.md` (story file updates)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status update)

## Change Log

- 2026-03-31: Implemented Story 2.1 app data layer and startup wiring; updated Docker CMD/COPY and pytest asyncio mode; validated with ruff, ty, and pytest.
