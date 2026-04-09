# AI-Assisted Security Review

## Scope

- Backend: `todo-backend/app/main.py`, `todo-backend/app/routers/todos.py`, `todo-backend/app/repository.py`, `todo-backend/app/schemas.py`
- Frontend: `todo-frontend/src/components/todos/TodoInput.vue`, `TodoItem.vue`, `TodoList.vue`, `TaskCheckbox.vue`, `AppError.vue`, `AppEmpty.vue`
- API client normalization: `todo-frontend/src/services/api.ts`

## Methodology

1. Manual code review focused on OWASP Top 10 vectors requested by story scope.
2. Command-based assertions for dangerous patterns.
3. Regression and quality-gate execution after review.

## Findings

| ID | Severity | Category | File(s) | Evidence | Impact | Fix/Rationale | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | low | XSS (`v-html` usage) | `todo-frontend/src` | `rg -n "v-html" todo-frontend/src` → no matches | No unescaped HTML rendering path found in app source | No finding (required assertion) | closed-no-finding |
| SEC-002 | low | Data exposure (client logs) | `todo-frontend/src` | `rg -n "console\\.(log|debug|info|warn|error)" todo-frontend/src` → no matches | No sensitive data logging surface in frontend app source | No finding (required assertion) | closed-no-finding |
| SEC-003 | low | API error contract / stack trace exposure | `todo-backend/app/routers/todos.py`, `todo-backend/tests/test_todos.py` | `rg -n "HTTPException\\(|detail\\s*=\\s*" todo-backend/app` and `rg -n "Todo not found|detail" todo-backend/tests` | Errors are surfaced as controlled `{"detail":"..."}` payloads; no traceback response path in router layer | No finding (required assertion) | closed-no-finding |
| SEC-004 | low | Input validation enforcement | `todo-backend/app/schemas.py` | `rg -n "extra\\s*=\\s*\"forbid\"|title_must_not_be_whitespace_only|at_least_one_field" todo-backend/app/schemas.py` | Pydantic validation rejects unknown fields, whitespace-only title, and empty update payloads | No finding (required assertion) | closed-no-finding |
| SEC-005 | low | SQL injection | `todo-backend/app/repository.py` | `rg -n "select\\(TodoRecord\\)|where\\(TodoRecord\\.id == id\\)" todo-backend/app/repository.py` | ORM query construction used; no raw concatenated SQL | No finding | closed-no-finding |
| SEC-006 | low | Command injection | `todo-backend/app` | `rg -n "eval\\(|exec\\(|subprocess|os\\.system" todo-backend/app` → no matches | No command execution primitives in reviewed backend code | No finding | closed-no-finding |
| SEC-007 | low | CORS misconfiguration / docs exposure | `todo-backend/app/main.py` | `rg -n "ALLOWED_ORIGINS\|ENABLE_DOCS\|allow_credentials" todo-backend/app/main.py` — wildcard guarded, docs gated by `ENABLE_DOCS` | Avoids wildcard+credentials CORS invalid config and limits docs exposure in production | No finding | closed-no-finding |
| SEC-008 | low | Unhandled exception propagation (DB layer) | `todo-backend/app/repository.py:68-81` | `_commit()` and `_commit_and_refresh()` catch `SQLAlchemyError`, rollback, then re-raise bare; router only catches `NotFoundError`; FastAPI default handler returns `{"detail": "Internal Server Error"}` with no traceback | Accepted risk — FastAPI's default 500 handler returns a generic JSON body with no traceback or query detail; this app is single-user, local, behind Nginx with no public exposure | Accepted risk: local single-user app; FastAPI 500 default is safe; no ORM query strings reach the HTTP response body | accepted-risk |
| SEC-009 | low | Configuration value logged at startup | `todo-backend/app/main.py:40` | `logger.info(f"CORS origins: {allowed_origins}")` logs the full allow-list at startup | Accepted risk — startup log only visible in server console/container logs; not an HTTP response surface; list contains no credentials; local deployment only | Accepted risk: startup-only, not accessible to web clients, no credentials in value | accepted-risk |

## Remediation Status

- Critical findings: **0**
- High findings: **0**
- Medium findings: **0**
- Low findings: **9** (7 closed as no-finding assertions; 2 closed as accepted-risk with explicit rationale)

### Accepted-Risk Rationale

- **SEC-008**: `SQLAlchemyError` re-raised from repository layer reaches FastAPI's default exception handler, which returns `{"detail": "Internal Server Error"}` — no traceback or query text in the HTTP response body. Acceptable for a local, single-user, non-public application.
- **SEC-009**: `ALLOWED_ORIGINS` list is logged at startup for operator visibility. The list contains only URLs (no secrets or credentials), is written to the server-side container log only, and is never included in HTTP responses. Acceptable for a local deployment.

## Verification Commands and Output Snippets

```bash
$ rg -n "v-html" todo-frontend/src
No matches found.

$ rg -n "console\.(log|debug|info|warn|error)" todo-frontend/src
No matches found.

$ rg -n "HTTPException\(|detail\s*=\s*" todo-backend/app
todo-backend/app/routers/todos.py:42:        raise HTTPException(status_code=404, detail="Todo not found")
todo-backend/app/routers/todos.py:53:        raise HTTPException(status_code=404, detail="Todo not found")

$ rg -n "Todo not found|detail" todo-backend/tests
todo-backend/tests/test_todos.py:75:    assert r.json() == {"detail": "Todo not found"}
todo-backend/tests/test_todos.py:87:    assert verify_r.json() == {"detail": "Todo not found"}

$ rg -n "extra\s*=\s*\"forbid\"|title_must_not_be_whitespace_only|at_least_one_field" todo-backend/app/schemas.py
todo-backend/app/schemas.py:8:    model_config = ConfigDict(extra="forbid")
todo-backend/app/schemas.py:12:    def title_must_not_be_whitespace_only(cls, value: str) -> str:
todo-backend/app/schemas.py:21:    model_config = ConfigDict(extra="forbid")
todo-backend/app/schemas.py:25:    def title_must_not_be_whitespace_only(cls, value: str) -> str:
todo-backend/app/schemas.py:31:    def at_least_one_field(self) -> "TodoUpdate":

$ rg -n "select\(TodoRecord\)|where\(TodoRecord\.id == id\)" todo-backend/app/repository.py
todo-backend/app/repository.py:19:            select(TodoRecord).order_by(TodoRecord.created_at.desc())
todo-backend/app/repository.py:44:        result = await self.session.execute(select(TodoRecord).where(TodoRecord.id == id))
todo-backend/app/repository.py:61:        result = await self.session.execute(select(TodoRecord).where(TodoRecord.id == id))

$ rg -n "eval\(|exec\(|subprocess|os\.system" todo-backend/app
No matches found.

$ rg -n "ALLOWED_ORIGINS|allow_credentials|ENABLE_DOCS|docs_url|redoc_url|openapi_url" todo-backend/app/main.py
todo-backend/app/main.py:24:    enable_docs = os.environ.get("ENABLE_DOCS", "false").lower() == "true"
todo-backend/app/main.py:28:        docs_url="/docs" if enable_docs else None,
todo-backend/app/main.py:29:        redoc_url="/redoc" if enable_docs else None,
todo-backend/app/main.py:30:        openapi_url="/openapi.json" if enable_docs else None,
todo-backend/app/main.py:33:    raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
todo-backend/app/main.py:35:    if "*" in allowed_origins:
todo-backend/app/main.py:45:        allow_credentials=True,
```

## Quality Gates

> Note: outputs below are representative paraphrases of actual runs, not verbatim captures.

```
make test-backend   → 13 passed, coverage 73%
make test-frontend  → 11 test files, 140 tests passed
make test-e2e       → 10 passed
make lint-backend   → ruff format/check + ty check passed
make lint-frontend  → lint + type-check + build passed
```
