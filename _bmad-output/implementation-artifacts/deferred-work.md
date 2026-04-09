# Deferred Work

## Deferred from: code review of 1-1-repository-and-project-scaffold (2026-03-28)

- `e2e/` + `fullyParallel: true` with no tests — CI exits non-zero unless `--pass-with-no-tests` flag is set in `playwright.config.ts` — Story 1.2 CI setup concern
- `vueDevTools()` unconditional in `vite.config.ts` — included in production bundles without mode guard — future story concern; scaffold default accepted for now
- Root `package.json` has empty `scripts` block — no `test:e2e` entry for Playwright — out of story 1.1 scope
- `/app/data/` directory not guaranteed at container start — SQLite `OperationalError` if absent — Story 1.3 Docker/volume setup
- `ALLOWED_ORIGINS` space-separated format not validated — Story 2 CORS implementation concern

## Deferred from: code review of 1-1-repository-and-project-scaffold (2026-03-30)

- `.gitignore` `test/` rule from Vue template may shadow future test directories — generated template artifact, low risk
- No root-level `tsconfig.json` governing `playwright.config.ts` — IDE type-checking gap, not blocking execution
- Root `package.json` has boilerplate `main: "index.js"` and `directories.doc` referencing non-existent paths — npm init artifact
- Root `package.json` `type: "commonjs"` while root-level configs use ESM syntax — Playwright handles .ts via own transformer, not currently broken

## Deferred from: code review of 1-3-docker-compose-stack-and-health-checks (2026-03-31)

- Placeholder `http.server` backend serves `/app` filesystem (including `.venv`) over HTTP — reachable via Nginx `/api/` proxy during dev. Temporary stub replaced in Story 2 when FastAPI app module is introduced

## Deferred from: code review of 2-1-database-models-schemas-and-persistence-layer (2026-04-01)

- `--proxy-headers` enabled without `--forwarded-allow-ips` — clients can spoof `X-Forwarded-For`; address in production hardening story
- No migration strategy — `create_all` is a no-op on existing schema; future column changes silently skipped; introduce Alembic in a later story
- `TodoRecord.title` has no DB-level length constraint — `max_length=500` enforced at API layer only; DB-bypass inserts can store unbounded strings
- `TodoUpdate.field_validator("title")` `if value is not None` guard is dead code — Pydantic v2 skips field validators for `None` on Optional fields; behavior is correct but annotation is misleading

## Deferred from: code review of 2-5-backend-test-suite (2026-04-02)

- `asyncio.sleep(1)` in `test_get_todos_ordered_newest_first` adds 1s delay per run — known workaround for SQLite second-level datetime precision; consider controlled timestamps or ID-based ordering in future
- No test for PATCH `{}` empty body — `at_least_one_field` validator and `extra="forbid"` untested; out of AC scope but valuable for regression safety
- Health check 503 path (DB unreachable) entirely untested — AC only requires healthy state; error response shape `{"status": "error", "detail": "..."}` not validated
- Title boundary tests (1 char min, 500 char max, 501 char rejection) not covered — Pydantic `min_length=1, max_length=500` on `TodoCreate.title` untested at boundaries
- No test for POST with missing `title` field entirely (`{}` or empty body) — different Pydantic validation path from empty-string test

## Deferred from: code review of 3-1-design-system-foundation (2026-04-02)

- `lint-frontend` Makefile target bundles `npm run build` into lint step — semantically unusual but intent is explicit in comment; acceptable for now
- Hard-coded placeholder text in `App.vue` ("Design system foundation is ready...") — scaffolding prose that should be replaced or removed when Story 3.3+ wire in real content
- `tailwind.config.js` module may be stale-cached in Vitest watch mode — affects developer experience only, does not impact CI single-run execution
- Google Fonts loaded without SRI hash — supply-chain risk in principle, but standard practice for CDN-hosted fonts; revisit in security review story (5.2)

## Deferred from: code review of 3-2-api-service-layer-and-use-todos-composable (2026-04-02)

- `TodoListResponse` publicly exported from `types/todo.ts` — violates "internal to api.ts" guardrail; no consumer currently imports it so no active harm, but move to api.ts internals in a follow-up
- Race condition in concurrent `fetchTodos` calls — no AbortController or sequence guard; stale responses can overwrite newer data; inherent tradeoff of pessimistic-refetch pattern; out of scope for Story 3.2
- `getErrorMessage({ detail: null })` returns the string `"null"` to users — backend contract returns strings not null but this is a defensive hardening gap; address in a later story

## Deferred from: code review of 5-2-ai-assisted-security-review (2026-04-09)

- Backend test coverage at 73% not cross-referenced against security-relevant code paths — pre-existing quality gap; specific uncovered branches in reviewed files not mapped to security impact
- No-finding entries in ai-review.md all assigned severity "low" rather than a neutral marker (e.g., `n/a`) — minor documentation style issue; "low" implies a minor issue was found
