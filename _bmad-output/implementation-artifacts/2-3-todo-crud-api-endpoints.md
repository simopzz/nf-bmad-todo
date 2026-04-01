# Story 2.3: Todo CRUD API Endpoints

Status: done

## Story

As a user,
I want a REST API that lets me create, read, update, and delete todos,
So that my todo data is accessible from the frontend with correct semantics.

## Acceptance Criteria (BDD)

1. **GET /api/v1/todos - List todos**
   - Given the repository layer from Story 2.2 is in place
   - When `GET /api/v1/todos` is called
   - Then it returns HTTP 200 with body `{"items": [...]}` (bare array forbidden)

2. **POST /api/v1/todos - Create todo**
   - When `POST /api/v1/todos` is called with valid `{"title": "..."}`
   - Then it returns HTTP 201 with the created `TodoResponse`

3. **POST /api/v1/todos - Empty title rejection**
   - When `POST /api/v1/todos` is called with empty or whitespace-only title
   - Then it returns HTTP 422 with `{"detail": "..."}` (no stack trace)

4. **PATCH /api/v1/todos/{id} - Update todo**
   - When `PATCH /api/v1/todos/{id}` is called with valid body
   - Then it returns HTTP 200 with the updated `TodoResponse`

5. **PATCH /api/v1/todos/{id} - Empty body rejection**
   - When `PATCH /api/v1/todos/{id}` is called with both `title` and `completed` as null
   - Then it returns HTTP 400 with `{"detail": "..."}`

6. **PATCH /api/v1/todos/{id} - Not found**
   - When `PATCH /api/v1/todos/{id}` is called with unknown id
   - Then it returns HTTP 404 with `{"detail": "Todo not found"}`

7. **DELETE /api/v1/todos/{id} - Delete todo**
   - When `DELETE /api/v1/todos/{id}` is called with valid id
   - Then it returns HTTP 204 with no body

8. **DELETE /api/v1/todos/{id} - Not found**
   - When `DELETE /api/v1/todos/{id}` is called with unknown id
   - Then it returns HTTP 404 with `{"detail": "Todo not found"}`

9. **Error envelope consistency**
   - All error responses use `{"detail": "..."}` envelope
   - Internal details (stack traces, file paths) are never exposed

10. **Exception handling safety**
    - Only `NotFoundError` is caught and converted to HTTP 404
    - Bare `except Exception` blocks are forbidden
    - Unhandled exceptions propagate as HTTP 500

11. **API documentation opt-in**
    - `ENABLE_DOCS` defaults to `false` when env var absent
    - When `ENABLE_DOCS=false` or absent, `GET /docs` and `GET /redoc` return HTTP 404

## Tasks / Subtasks

- [x] Task 1: Create `app/routers/todos.py` (AC: #1-#10)
  - [x] 1.1 Create router with `/api/v1/todos` prefix
  - [x] 1.2 Implement dependency injection for `TodoRepository` via `get_session`
  - [x] 1.3 Implement `GET /api/v1/todos` returning `{"items": [...]}`
  - [x] 1.4 Implement `POST /api/v1/todos` returning HTTP 201
  - [x] 1.5 Implement `PATCH /api/v1/todos/{id}` with `NotFoundError` → 404 conversion
  - [x] 1.6 Implement `DELETE /api/v1/todos/{id}` returning HTTP 204
  - [x] 1.7 Add error handler for `NotFoundError` (no bare `except Exception`)
- [x] Task 2: Update `app/main.py` to register todo router and control docs (AC: #11)
  - [x] 2.1 Import and include `todos` router
  - [x] 2.2 Implement `ENABLE_DOCS` env var logic (disable `/docs` and `/redoc` when false/absent)
- [x] Task 3: Verify all endpoints work end-to-end (AC: #1-#11)
  - [x] 3.1 Run ruff format, ruff check, ty check with zero violations
  - [x] 3.2 Manually verify all endpoints respond with correct status codes and shapes

### Review Findings

- [x] [Review][Patch] PATCH body parsing can raise unhandled 500 errors on malformed/non-object JSON [todo-backend/app/routers/todos.py:40]
- [x] [Review][Patch] PATCH route catches `ValidationError`, violating AC #10's "catch only `NotFoundError`" constraint [todo-backend/app/routers/todos.py:48]
- [x] [Review][Patch] Pre-validation null-check can return 400 for unknown-field payloads that should fail schema validation with 422 [todo-backend/app/routers/todos.py:41]

## Dev Notes

### Architecture Compliance

**Layer separation is non-negotiable:**
- `routers/todos.py` handles HTTP semantics only (status codes, error conversion, response envelopes)
- `repository.py` owns all DB operations and Pydantic↔SQLAlchemy mapping
- Route handlers NEVER import `TodoRecord` — only `TodoResponse`, `TodoCreate`, `TodoUpdate` from `schemas.py`
- Route handlers NEVER import from `models.py`

**Dependency injection pattern:**
```python
from app.database import get_session
from app.repository import TodoRepository, NotFoundError
from app.schemas import TodoCreate, TodoResponse, TodoUpdate

async def get_repo(session: AsyncSession = Depends(get_session)) -> TodoRepository:
    return TodoRepository(session)
```

**Error handling — catch ONLY `NotFoundError`:**
```python
try:
    result = await repo.update_todo(todo_id, data)
except NotFoundError:
    raise HTTPException(status_code=404, detail="Todo not found")
# NO bare except Exception — let other errors propagate as HTTP 500
```

### Response Format Requirements

| Endpoint | Success Code | Response Shape |
|----------|-------------|---------------|
| `GET /api/v1/todos` | 200 | `{"items": [TodoResponse...]}` |
| `POST /api/v1/todos` | 201 | `TodoResponse` |
| `PATCH /api/v1/todos/{id}` | 200 | `TodoResponse` |
| `DELETE /api/v1/todos/{id}` | 204 | Empty body |
| All errors | 400/404/422 | `{"detail": "..."}` |

### ENABLE_DOCS Implementation

```python
enable_docs = os.getenv("ENABLE_DOCS", "false").lower() == "true"
app = FastAPI(docs_url="/docs" if enable_docs else None, redoc_url="/redoc" if enable_docs else None)
```

### Existing Repository Methods (from Story 2.2)

The `TodoRepository` class in `app/repository.py` provides:
- `get_all_todos() -> list[TodoResponse]` — returns todos ordered by `created_at` DESC
- `create_todo(data: TodoCreate) -> TodoResponse` — creates and returns with server-generated `id` and `created_at`
- `update_todo(todo_id: int, data: TodoUpdate) -> TodoResponse` — raises `NotFoundError` if not found
- `delete_todo(todo_id: int) -> None` — raises `NotFoundError` if not found

Custom exception: `NotFoundError(Exception)` defined in `repository.py`

### Existing Schemas (from Story 2.1)

Already implemented in `app/schemas.py`:
- `TodoCreate` — `title: str` with `Field(min_length=1, max_length=500)` + `@field_validator("title")` strips whitespace, rejects empty
- `TodoUpdate` — `title: str | None`, `completed: bool | None`, `ConfigDict(extra="forbid")`, `@model_validator` rejects both-None
- `TodoResponse` — `id: int`, `title: str`, `completed: bool`, `created_at: datetime`

Pydantic validation returns HTTP 422 automatically via FastAPI for invalid input (empty title, extra fields).
The `@model_validator` in `TodoUpdate` raises `ValueError` which FastAPI converts to HTTP 422 (not 400). To get HTTP 400 for empty PATCH, catch `ValueError` in the route or use a custom approach.

### Existing main.py Structure (from Story 2.1)

`app/main.py` already has:
- FastAPI app with lifespan context manager calling `create_tables()`
- CORS middleware with `ALLOWED_ORIGINS` env var validation
- Logger configured

You must ADD to this file:
- Router registration: `app.include_router(todos_router)`
- `ENABLE_DOCS` logic applied to `FastAPI()` constructor

### Anti-Patterns to Avoid

```python
# FORBIDDEN: from_attributes=True on schemas
class TodoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # DO NOT ADD

# FORBIDDEN: Bare except in route handlers
except Exception:  # NO — only catch NotFoundError

# FORBIDDEN: Importing TodoRecord in routes
from app.models import TodoRecord  # Only in repository.py

# FORBIDDEN: Importing FastAPI in repository.py
from fastapi import HTTPException  # Forbidden in repository.py

# FORBIDDEN: Bare array response
return todos  # Must be {"items": todos}

# FORBIDDEN: Calling create_tables() outside lifespan
create_tables()  # Only in main.py lifespan
```

### Project Structure Notes

**File to create:**
- `todo-backend/app/routers/todos.py` — all 4 CRUD endpoints

**File to modify:**
- `todo-backend/app/main.py` — register router + ENABLE_DOCS

**Files that already exist (DO NOT MODIFY):**
- `todo-backend/app/models.py` — `TodoRecord` SQLAlchemy model
- `todo-backend/app/schemas.py` — Pydantic schemas with validators
- `todo-backend/app/repository.py` — `TodoRepository` + `NotFoundError`
- `todo-backend/app/database.py` — engine, session factory, `create_tables()`
- `todo-backend/app/routers/__init__.py` — empty, already exists

**Import conventions established:**
```python
from app.models import ...      # Only in repository.py and database.py
from app.schemas import ...     # In repository.py and routers
from app.repository import ...  # In routers only
from app.database import ...    # In repository.py and routers (for get_session)
```

### Quality Gates (Pre-commit)

All three must pass with zero violations before completion:
```bash
uv run --project todo-backend ruff format todo-backend/app/
uv run --project todo-backend ruff check todo-backend/app/
uv run --project todo-backend ty check todo-backend/app/
```

### Previous Story Intelligence

**From Story 2.2 review findings:**
- Session refresh after mutations is critical — `session.refresh(record)` after `commit()` to populate `id`, `created_at`
- Repository uses `_commit()` and `_commit_and_refresh()` helpers with `try/except SQLAlchemyError` + rollback
- `scalar_one_or_none()` for single-record lookups (returns None → NotFoundError)
- `scalars().all()` for list queries
- `order_by(TodoRecord.created_at.desc())` for DESC ordering

**Git commit pattern:** Single atomic commit per story with conventional message: `feat: story 2.3 Todo CRUD API Endpoints`

### Testing Note

Story 2.3 does NOT include writing tests — that is Story 2.5 (Backend Test Suite). However, all code must be structured to be testable:
- Dependency injection via `Depends()` enables test fixture override
- Pure functions where possible
- No global state

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-2-Story-2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Design]
- [Source: _bmad-output/planning-artifacts/architecture.md#Layer-Separation]
- [Source: _bmad-output/planning-artifacts/prd.md#FR16-FR22]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#API-Interaction-Patterns]
- [Source: _bmad-output/project-context.md#Backend-Framework-Rules]
- [Source: todo-backend/app/repository.py — NotFoundError, TodoRepository methods]
- [Source: todo-backend/app/schemas.py — TodoCreate, TodoUpdate, TodoResponse validators]
- [Source: todo-backend/app/main.py — existing lifespan, CORS setup]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed PATCH both-null case: `TodoUpdate` field_validator crashes on `None.strip()` when `title=null`. Handled by checking both-null in route before Pydantic validation, returning HTTP 400 per AC #5.

### Completion Notes List

- Created `app/routers/todos.py` with all 4 CRUD endpoints (GET, POST, PATCH, DELETE)
- Dependency injection via `get_repo()` using `Depends(get_session)` for testability
- GET returns `{"items": [...]}` envelope (no bare array)
- POST returns 201 with created TodoResponse
- PATCH handles both-null body → 400, NotFoundError → 404, valid update → 200
- DELETE returns 204 on success, 404 on not found
- Only `NotFoundError` is caught — no bare `except Exception`
- All error responses use `{"detail": "..."}` envelope
- Registered router in `main.py` via `app.include_router(todos_router)`
- ENABLE_DOCS was already implemented in main.py (from prior story)
- All quality gates pass: ruff format, ruff check, ty check — zero violations
- All 10 endpoint scenarios verified manually against ACs

### Change Log

- 2026-04-01: Implemented Story 2.3 — Todo CRUD API Endpoints

### File List

- `todo-backend/app/routers/todos.py` (NEW) — CRUD router with GET/POST/PATCH/DELETE endpoints
- `todo-backend/app/main.py` (MODIFIED) — Added router import and registration
