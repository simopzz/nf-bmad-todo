# Story 2.2: Todo Repository

Status: done

## Story

As a developer,
I want a repository layer that encapsulates all database operations for todos,
So that API routes interact only with clean Python objects, never raw SQL or ORM constructs.

## Acceptance Criteria

1. **Given** the database layer from Story 2.1 is in place, **When** `get_all()` is called, **Then** it returns a `list[TodoResponse]` ordered by `created_at DESC`.
2. **Given** valid `TodoCreate` data, **When** `create(data)` is called, **Then** a new `TodoRecord` is persisted and its `TodoResponse` is returned.
3. **Given** an existing todo id and valid `TodoUpdate` data, **When** `update(id, data)` is called, **Then** only the provided fields are updated (title and/or completed independently) and the updated `TodoResponse` is returned.
4. **Given** an id that does not exist, **When** `update(id, data)` or `delete(id)` is called, **Then** `NotFoundError` is raised (no other exception type is used for the not-found case).
5. **Given** an existing todo id, **When** `delete(id)` is called, **Then** the record is removed and nothing is returned.
6. **Given** any method call, **Then** all operations use async SQLAlchemy sessions — no sync calls.
7. **Given** the `repository.py` file, **Then** it contains zero FastAPI imports — it is a pure data-access layer.

## Tasks / Subtasks

- [x] Task 1: Implement `TodoRepository` methods in `todo-backend/app/repository.py` (AC: #1–#7)
  - [x] 1.1: Replace `get_all()` stub — query `TodoRecord` ordered by `created_at DESC`, map to `list[TodoResponse]`
  - [x] 1.2: Replace `create()` stub — instantiate `TodoRecord`, `session.add`, `commit`, `refresh`, return `TodoResponse`
  - [x] 1.3: Replace `update()` stub — fetch by id, raise `NotFoundError` if missing, update only non-None fields, `commit`, `refresh`, return `TodoResponse`
  - [x] 1.4: Replace `delete()` stub — fetch by id, raise `NotFoundError` if missing, `session.delete`, `commit`
- [x] Task 2: Pre-commit and type-check validation
  - [x] 2.1: Run `ruff format todo-backend/app/` and `ruff check todo-backend/app/` — zero violations
  - [x] 2.2: Run `ty check todo-backend/app/` — zero errors

### Review Findings

- [x] [Review][Patch] Missing rollback after failed commit/refresh can poison session [todo-backend/app/repository.py:34]

## Dev Notes

### File To Modify

**One file only:** `todo-backend/app/repository.py`

The stub is already in place from Story 2.1. **Do NOT** modify `schemas.py`, `models.py`, `database.py`, or `main.py`.

### Current State of `repository.py` (Story 2.1 Stub)

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

### Canonical Implementation

Replace the entire `repository.py` with:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TodoRecord
from app.schemas import TodoCreate, TodoResponse, TodoUpdate


class NotFoundError(Exception):
    pass


class TodoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all(self) -> list[TodoResponse]:
        result = await self.session.execute(
            select(TodoRecord).order_by(TodoRecord.created_at.desc())
        )
        records = result.scalars().all()
        return [
            TodoResponse(
                id=r.id,
                title=r.title,
                completed=r.completed,
                created_at=r.created_at,
            )
            for r in records
        ]

    async def create(self, data: TodoCreate) -> TodoResponse:
        record = TodoRecord(title=data.title, completed=False)
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return TodoResponse(
            id=record.id,
            title=record.title,
            completed=record.completed,
            created_at=record.created_at,
        )

    async def update(self, id: int, data: TodoUpdate) -> TodoResponse:
        result = await self.session.execute(
            select(TodoRecord).where(TodoRecord.id == id)
        )
        record = result.scalar_one_or_none()
        if record is None:
            raise NotFoundError(f"Todo {id} not found")
        if data.title is not None:
            record.title = data.title
        if data.completed is not None:
            record.completed = data.completed
        await self.session.commit()
        await self.session.refresh(record)
        return TodoResponse(
            id=record.id,
            title=record.title,
            completed=record.completed,
            created_at=record.created_at,
        )

    async def delete(self, id: int) -> None:
        result = await self.session.execute(
            select(TodoRecord).where(TodoRecord.id == id)
        )
        record = result.scalar_one_or_none()
        if record is None:
            raise NotFoundError(f"Todo {id} not found")
        await self.session.delete(record)
        await self.session.commit()
```

### Layer Separation — Critical Rules

| Rule | Enforcement |
|------|-------------|
| `TodoRecord` is referenced **only** in `repository.py` | No other file may import `TodoRecord` |
| `TodoResponse` is constructed **manually** from ORM fields | `from_attributes=True` is **forbidden** on any Pydantic schema |
| No FastAPI imports in `repository.py` | It is a pure data-access layer — no `Depends`, `Request`, `HTTPException` |
| No abstract base classes | Repository is deliberately flat (architectural decision) |
| Session is **never** instantiated directly | Sessions are injected via `Depends(get_session)` by route handlers (Story 2.3) |

### SQLAlchemy Async Query Patterns (Reference)

```python
# Select all rows, ordered
result = await session.execute(select(Model).order_by(Model.field.desc()))
rows = result.scalars().all()  # → list[Model]

# Select by id — returns None if not found
result = await session.execute(select(Model).where(Model.id == id))
row = result.scalar_one_or_none()  # → Model | None

# Insert
session.add(record)
await session.commit()
await session.refresh(record)  # repopulates server defaults (e.g. created_at, id)

# Delete
await session.delete(record)
await session.commit()
```

**Why `refresh` after commit?** Server-side defaults (`id`, `created_at`) are populated by the DB on INSERT. Without `refresh`, these fields are `None` on the Python object.

### Type Annotation Requirements

Every method must have complete type annotations — `ty` enforces zero errors:

- `get_all(self) -> list[TodoResponse]`
- `create(self, data: TodoCreate) -> TodoResponse`
- `update(self, id: int, data: TodoUpdate) -> TodoResponse`
- `delete(self, id: int) -> None`

### Anti-Patterns to Avoid

- ❌ `from_attributes=True` on any Pydantic schema — Pydantic and SQLAlchemy are independent layers
- ❌ `from app.models import TodoRecord` in any file **except** `repository.py`
- ❌ FastAPI imports (`Depends`, `HTTPException`, etc.) in `repository.py`
- ❌ `session.execute(text("SELECT ..."))` raw SQL — use `select(TodoRecord)` ORM queries
- ❌ Abstract base classes or interfaces on `TodoRepository`
- ❌ Running `uv add` — all deps already in `pyproject.toml`
- ❌ Touching `schemas.py`, `models.py`, `database.py`, `main.py`
- ❌ Creating `tests/` — that's Story 2.5
- ❌ Creating router — that's Story 2.3

### Dependency Versions (from pyproject.toml — DO NOT change)

| Package | Version |
|---------|---------|
| fastapi | >=0.135.2 |
| sqlalchemy | >=2.0.48 |
| aiosqlite | >=0.22.1 |
| uvicorn[standard] | >=0.42.0 |
| pytest-asyncio | >=0.26.0 |

### Validation Commands

```bash
uv run --project todo-backend ruff format todo-backend/app/
uv run --project todo-backend ruff check todo-backend/app/
uv run --project todo-backend ty check todo-backend/app/
```

All three must report zero violations. Do not proceed if any fail.

### Previous Story Intelligence (Story 2.1 Patterns)

From Story 2.1 review findings and dev notes:
- `TodoResponse` must NOT use `model_config = ConfigDict(from_attributes=True)` — repository manually maps `TodoRecord` fields to `TodoResponse` constructor arguments
- `TodoCreate` strips whitespace on title (validator returns `value.strip()`) — rely on this, do not re-strip in the repository
- `TodoUpdate.field_validator("title")` skips `None` (Pydantic v2 behavior) — `data.title is not None` guard in `update()` is the correct pattern
- `asyncio_mode = "auto"` is set in `pyproject.toml` — no decorator needed on async tests (relevant for Story 2.5)
- Validation commands: `ruff format`, `ruff check`, `ty check` — must all pass before story is complete

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Repository Contract, Layer Separation, Data Architecture]
- [Source: _bmad-output/implementation-artifacts/2-1-database-models-schemas-and-persistence-layer.md — Canonical models, schemas, previous review findings]
- [Source: todo-backend/app/repository.py — existing stub implementation]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues encountered.

### Completion Notes List

- Replaced all four `NotImplementedError` stubs with full async SQLAlchemy implementations.
- `get_all()`: queries `TodoRecord` ordered by `created_at DESC`, maps to `list[TodoResponse]`.
- `create()`: instantiates `TodoRecord`, adds/commits/refreshes, returns `TodoResponse`.
- `update()`: fetches by id, raises `NotFoundError` if missing, patches only non-None fields, commits/refreshes, returns `TodoResponse`.
- `delete()`: fetches by id, raises `NotFoundError` if missing, deletes and commits.
- Zero FastAPI imports — pure data-access layer.
- All validation commands pass: `ruff format`, `ruff check`, `ty check` — zero violations.

### File List

- `todo-backend/app/repository.py` (modified)

## Change Log

- 2026-04-01: Story created by create-story workflow
- 2026-04-01: Story implemented by dev agent — all tasks complete, status set to review
