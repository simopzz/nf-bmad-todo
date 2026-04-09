# Story 5.2: AI-Assisted Security Review

Status: done

## Story

As a developer,
I want an AI-assisted security review of the codebase with all critical findings resolved,
So that the application is free of critical OWASP Top 10 vulnerabilities before release.

## Acceptance Criteria

1. **Given** the complete codebase is implemented, **when** an AI-assisted review is conducted on `main.py`, `routers/todos.py`, `repository.py`, and all Vue components that handle user input, **then** findings are logged in `_bmad-output/ai-review.md` with severity (critical / high / medium / low) and resolution status for each finding.
2. **And** all critical findings (XSS, SQL injection, command injection, data exposure) are resolved before this story is marked complete.
3. **And** the review confirms: no `v-html` used with user-supplied content; all user input passes through Pydantic validation; no stack traces exposed in API responses; no sensitive data in client-side logs.
4. **And** high and medium findings are documented with either a code fix or a specific accepted-risk rationale. “Accepted risk” is valid only with concrete, project-specific rationale.

## Tasks / Subtasks

- [x] Task 1: Create structured security findings log (AC: 1, 4)
  - [x] Create `_bmad-output/ai-review.md` with sections: scope, methodology, findings table, remediation status, accepted-risk rationale.
  - [x] Use one row per finding with: ID, file, vulnerability category, severity, evidence, impact, fix/rationale, status.
  - [x] Include an explicit “No finding” entry for each required check when no issue is found (defensive traceability).

- [x] Task 2: Review backend security surfaces and remediate critical findings (AC: 1, 2, 3)
  - [x] Review `todo-backend/app/main.py` for safe CORS and docs exposure behavior.
  - [x] Review `todo-backend/app/routers/todos.py` for safe error semantics and data exposure.
  - [x] Review `todo-backend/app/repository.py` for query safety, transaction handling, and exception behavior.
  - [x] Confirm `todo-backend/app/schemas.py` enforces strict validation (`extra="forbid"`, trimmed non-empty titles, constrained update payloads).

- [x] Task 3: Review frontend user-input surfaces and remediate critical findings (AC: 1, 2, 3)
  - [x] Review all todo input/edit/render components: `TodoInput.vue`, `TodoItem.vue`, `TodoList.vue`, `TaskCheckbox.vue`, `AppError.vue`, `AppEmpty.vue`.
  - [x] Confirm user content rendering uses escaped interpolation (`{{ ... }}`) and that no dangerous HTML injection patterns are used.
  - [x] Confirm client error handling does not leak sensitive implementation details in UI or logs.

- [x] Task 4: Validate required security assertions with reproducible checks (AC: 3)
  - [x] Prove no `v-html` usage in app source (exclude framework internals/tooling directories from findings).
  - [x] Prove no client-side sensitive-data logging in application source.
  - [x] Prove API error responses preserve the `{"detail": "..."}` contract and do not expose stack traces.
  - [x] Record each proof command/output snippet in `_bmad-output/ai-review.md`.

- [x] Task 5: Complete verification and status integrity (AC: 1-4)
  - [x] Run backend tests, frontend unit tests, and E2E tests after any code remediations.
  - [x] Ensure any critical finding is closed with code-level remediation before moving story status to `done`.
  - [x] For any unresolved non-critical finding, include explicit accepted-risk rationale tied to project constraints (single-user, local app, no auth surface, no sensitive data-at-rest beyond todos).

## Dev Notes

### Epic and Story Context

This is Story 5.2 in Epic 5 (End-to-End Quality Assurance & Documentation). Story 5.1 is complete and established E2E quality gates. This story now establishes security-review traceability and closes critical security risks before final documentation stories.  
[Source: `_bmad-output/planning-artifacts/epics.md#Epic-5-End-to-End-Quality-Assurance--Documentation`]  
[Source: `_bmad-output/planning-artifacts/epics.md#Story-52-AI-Assisted-Security-Review`]

### In-Scope Security Surface (Do Not Expand Scope)

- Backend: `todo-backend/app/main.py`, `todo-backend/app/routers/todos.py`, `todo-backend/app/repository.py`, and validation path in `todo-backend/app/schemas.py`.
- Frontend user-input/render path: `todo-frontend/src/components/todos/*.vue`, plus API error normalization in `todo-frontend/src/services/api.ts`.
- Security evidence artifact: `_bmad-output/ai-review.md`.

Keep the review tightly mapped to story ACs and OWASP-relevant vectors named in AC2/AC3 (XSS, SQL injection, command injection, data exposure). Avoid introducing unrelated hardening work.

### Current Security Baseline (Verified)

- No `v-html` use in frontend todo components; user strings are rendered through Vue interpolation.
- Backend write/update payloads are schema-validated with `extra="forbid"` and whitespace-only rejection.
- SQL access is ORM-based (`select(TodoRecord)`), not raw string-concatenated SQL.
- API errors use `HTTPException(..., detail=...)` in router layer and normalized detail extraction in frontend API service.
- CORS wildcard is explicitly blocked when credentials are enabled.

[Source: `todo-frontend/src/components/todos/TodoInput.vue`]  
[Source: `todo-frontend/src/components/todos/TodoItem.vue`]  
[Source: `todo-backend/app/schemas.py`]  
[Source: `todo-backend/app/repository.py`]  
[Source: `todo-backend/app/routers/todos.py`]  
[Source: `todo-backend/app/main.py`]  
[Source: `todo-frontend/src/services/api.ts`]

### Required Findings Log Format

Use `_bmad-output/ai-review.md` with at least:

1. Scope and methodology (AI-assisted review approach + command-based verification).
2. Findings table: `ID | Severity | Category | File(s) | Evidence | Impact | Resolution | Status`.
3. Mandatory assertion checks:
   - No `v-html` with user content.
   - Pydantic validation on user input path.
   - No stack traces exposed to API clients.
   - No sensitive data in frontend logs.
4. Resolution summary:
   - Critical: must be `resolved`.
   - High/Medium: `resolved` or `accepted-risk` with explicit rationale.

### Architecture Compliance Guardrails

- Preserve API path/versioning and error envelope conventions (`/api/v1/...`, `{"detail": "..."}`).
- Preserve layered boundaries (routers map HTTP concerns, repository owns persistence mapping, schemas own validation).
- Keep frontend state flow unchanged (`useTodos` full re-fetch strategy after mutations).
- Do not add new infrastructure/services for this story; this is review + remediation + documentation.

[Source: `_bmad-output/planning-artifacts/architecture.md#Requirements-Overview`]  
[Source: `_bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries`]  
[Source: `_bmad-output/planning-artifacts/architecture.md#Requirements-Coverage-Validation`]

### Project Structure Notes

- Place the review deliverable at `_bmad-output/ai-review.md` (root-level BMAD output artifact).
- If remediation is needed, edit only the impacted application files; avoid touching generated BMAD workflow assets.
- Keep test locations unchanged (`todo-backend/tests`, `todo-frontend/src/__tests__`, `e2e/`).

### Previous Story Intelligence (5.1)

- Story 5.1 added `test-e2e` and `test-all` Make targets and stabilized E2E behavior around real selectors and deterministic cleanup.
- Reuse these quality gates after any remediation to prevent regressions while closing security findings.
- Do not modify unrelated E2E behavior for this story; only adjust tests if a remediation changes observable behavior.

[Source: `_bmad-output/implementation-artifacts/5-1-playwright-end-to-end-test-suite.md#Completion-Notes-List`]  
[Source: `_bmad-output/implementation-artifacts/5-1-playwright-end-to-end-test-suite.md#File-List`]

### Git Intelligence Summary

Recent commits confirm the active baseline and sequence for this epic:

- `feat: story 5.1 Playwright End-to-End Test Suite`
- `feat: story 4.4 Responsive Design & WCAG AA Audit`
- `feat: story 4.3 Keyboard Navigation & Screen Reader Support`
- `feat: story 4.2 Form Validation & Mutation Error Handling`
- `feat: story 4.1 Loading Skeleton & Full-Area Error State`

Security remediations in this story should be narrowly scoped, preserving behavior validated by these prior story increments.

### Latest Technical Information

- OWASP Top 10 remains the canonical awareness baseline for web app risk categories; this story should map findings to those categories for consistent reporting.
- Vue security guidance continues to emphasize avoiding untrusted template compilation and relying on escaped interpolation for user content.
- FastAPI guidance continues to center on explicit `HTTPException` usage with controlled `detail` payloads for client-facing errors.

[Source: https://owasp.org/www-project-top-ten/]  
[Source: https://vuejs.org/guide/best-practices/security]  
[Source: https://fastapi.tiangolo.com/tutorial/handling-errors/]

### Anti-Patterns to Avoid

- Do not mark the story complete while any critical finding remains open.
- Do not write “accepted risk” without concrete rationale tied to this system’s constraints.
- Do not add broad exception-swallowing logic to “hide” errors.
- Do not introduce raw SQL or unsafe HTML rendering while remediating findings.
- Do not scope findings to only backend or only frontend; both surfaces are explicitly required by AC.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-52-AI-Assisted-Security-Review`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic-5-End-to-End-Quality-Assurance--Documentation`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements-Overview`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements-Coverage-Validation`]
- [Source: `_bmad-output/project-context.md#Critical-Implementation-Rules`]
- [Source: `_bmad-output/implementation-artifacts/5-1-playwright-end-to-end-test-suite.md#Dev-Notes`]
- [Source: `_bmad-output/implementation-artifacts/5-1-playwright-end-to-end-test-suite.md#Completion-Notes-List`]
- [Source: `todo-backend/app/main.py`]
- [Source: `todo-backend/app/routers/todos.py`]
- [Source: `todo-backend/app/repository.py`]
- [Source: `todo-backend/app/schemas.py`]
- [Source: `todo-frontend/src/services/api.ts`]
- [Source: `todo-frontend/src/components/todos/TodoInput.vue`]
- [Source: `todo-frontend/src/components/todos/TodoItem.vue`]
- [Source: `todo-frontend/src/components/todos/TodoList.vue`]
- [Source: `todo-frontend/src/components/todos/TaskCheckbox.vue`]
- [Source: `todo-frontend/src/components/todos/AppError.vue`]
- [Source: `todo-frontend/src/components/todos/AppEmpty.vue`]
- [Source: https://owasp.org/www-project-top-ten/]
- [Source: https://vuejs.org/guide/best-practices/security]
- [Source: https://fastapi.tiangolo.com/tutorial/handling-errors/]

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `git --no-pager log --oneline -5` (recent implementation sequence)
- `rg "v-html" todo-frontend/src` (frontend HTML injection surface check)
- `rg -n "console\.(log|debug|info|warn|error)" todo-frontend/src`
- `rg -n "HTTPException\(|detail\s*=\s*" todo-backend/app`
- `rg -n "Todo not found|detail" todo-backend/tests`
- `rg -n "extra\s*=\s*\"forbid\"|title_must_not_be_whitespace_only|at_least_one_field" todo-backend/app/schemas.py`
- `rg -n "select\(TodoRecord\)|where\(TodoRecord\.id == id\)" todo-backend/app/repository.py`
- `rg -n "eval\(|exec\(|subprocess|os\.system" todo-backend/app`
- `make test-backend`
- `make test-frontend`
- `make test-e2e`
- `make lint-backend`
- `make lint-frontend`

### Completion Notes List

- Added `_bmad-output/ai-review.md` with scope, methodology, structured findings table, command-based proof snippets, and remediation summary.
- Completed security review for required backend/frontend files with explicit OWASP-relevant findings coverage (XSS, SQL injection, command injection, data exposure).
- Verified required assertions: no `v-html` in app source, no client-side sensitive-data logging, strict Pydantic validation path, and controlled API error `detail` responses.
- Ran backend, frontend unit, and E2E suites plus backend/frontend lint/type/build quality gates.
- No critical/high/medium findings identified; all required checks documented as explicit closed no-finding entries.

### File List

- `_bmad-output/ai-review.md`
- `_bmad-output/implementation-artifacts/5-2-ai-assisted-security-review.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

- [x] [Review][Patch] SQLAlchemyError propagation path not documented in review [`todo-backend/app/repository.py:71-80`, `todo-backend/app/routers/todos.py`]
- [x] [Review][Patch] Quality gate outputs are paraphrased summaries, not captured verbatim [`_bmad-output/ai-review.md`]
- [x] [Review][Patch] SEC-007 has no verification command evidence in the Commands section [`_bmad-output/ai-review.md`]
- [x] [Review][Patch] Backend ALLOWED_ORIGINS logged at startup not documented in review [`todo-backend/app/main.py:40`]
- [x] [Review][Defer] Backend test coverage at 73% not cross-referenced against security-relevant code paths — deferred, pre-existing
- [x] [Review][Defer] No-finding entries all assigned severity "low" rather than a neutral marker — deferred, pre-existing

## Change Log

- 2026-04-09: Completed AI-assisted security review, produced `_bmad-output/ai-review.md`, validated required assertions with reproducible evidence, and updated story status/tasks for review.
- 2026-04-09: Code review completed — 4 patch findings, 2 deferred, 7 dismissed.
