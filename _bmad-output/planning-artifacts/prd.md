---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-leapsome-bmad-todo.md'
  - 'prd.md'
  - 'task.md'
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
---

# Product Requirements Document - leapsome-bmad-todo

**Author:** simopzz
**Date:** 2026-03-25

## Executive Summary

This project is a full-stack Todo application built as a hands-on BMAD methodology exercise. Its purpose is dual: deliver a minimal but complete personal task management tool, and demonstrate that spec-driven, AI-assisted development — when properly sequenced through PM, Architect, Developer, and QA personas — produces clean, tested, deployable software without ambiguity in the handoff artifacts.

The target user is a single individual managing personal tasks. No accounts, no collaboration, no onboarding. The user opens the application and their task list is immediately available. All core interactions — create, view, edit, complete, delete — are available without guidance. This simplicity is intentional and non-negotiable: scope creep is a failure mode, not a feature.

This PRD is a methodology artifact and a product specification simultaneously. It is consumed by downstream BMAD personas (Architect, Developer, QA) and may be reviewed by a human evaluator. It must read as a credible product document, not a training scaffold.

### What Makes This Special

The constraint is the differentiator. Where most task management tools accumulate features users don't need, this application holds the line at exactly five things: add a task, see the list, edit a task, mark it done, delete it. The experience is frictionless by design.

The deeper insight is that a successful `docker-compose up` is a specification quality signal. If the architecture document was complete and unambiguous, the application runs on first invocation. Reproducible deployment is evidence that the upstream artifacts — this PRD included — were precise enough to leave no gaps for interpretation.

The pre-commit pipeline (ruff autoformatting, type hint linting, conventional commit enforcement) is part of the quality contract from day one. Code that doesn't meet these standards doesn't enter the repository.

### Project Classification

| Dimension | Value |
|---|---|
| **Project Type** | Web application (Vue 3 SPA + FastAPI backend) |
| **Domain** | General — personal productivity, no regulatory compliance |
| **Complexity** | Low — well-understood problem domain, deliberately constrained scope |
| **Project Context** | Greenfield |

## Success Criteria

### User Success

A user unfamiliar with the application can complete all core task-management actions — create, view, edit, complete, delete — without prompting, guidance, or onboarding. The task list is visible immediately on load. Completed tasks are visually distinct from active ones. Empty, loading, and error states are handled gracefully without breaking the experience.

Todos survive browser refresh and container restart without data loss.

### Methodology Success

Every BMAD artifact (product brief, PRD, architecture doc, stories with acceptance criteria, QA reports, AI integration log) is produced in sequence, each feeding cleanly into the next. All BMAD personas — PM, Architect, Developer, QA — are engaged with proper handoff artifacts between them.

The PRD itself is a success signal: if the architecture document can be generated from it without the Architect needing to ask clarifying questions, the PRD was precise enough.

### Technical Success

| Signal | Target |
|---|---|
| Test coverage | ≥70% meaningful line coverage (unit + integration) |
| E2E tests | ≥5 passing Playwright scenarios (full CRUD + error states) |
| Accessibility | WCAG AA — zero critical axe-core violations |
| Deployability | `docker-compose up` succeeds; all containers healthy; `GET /` responds within 30s |
| Python formatting | ruff autoformat passes with zero violations |
| Python type safety | ty type checker passes with zero errors |
| Commit hygiene | Conventional commit enforcement via pre-commit hook; no non-conforming commits in history |
| Security | No critical OWASP issues (XSS, injection); AI-assisted review findings documented |

### Measurable Outcomes

- All five API endpoints (`GET /todos`, `POST /todos`, `PATCH /todos/{id}`, `DELETE /todos/{id}`, `GET /health`) return correct status codes and response shapes under happy-path and error conditions.
- Frontend renders correctly on desktop and mobile viewports.
- Application start-to-healthy time: ≤30 seconds from `docker-compose up`.
- Pre-commit hook blocks any commit that fails ruff, type checks, or conventional commit format.

## Product Scope

### MVP — Minimum Viable Product

All three user journeys must be fully supported at v1 release.

**Core application:**
- Create a todo (required text description)
- View all todos (reverse chronological, hard-coded order)
- Edit a todo's text description inline
- Mark a todo complete / incomplete (toggle)
- Delete a todo
- Empty, loading, and error states (frontend)

**Infrastructure:**
- SQLite persistence — durable across browser refresh and container restart
- FastAPI backend — five defined endpoints
- Vue 3 SPA (Composition API) — Vite build
- Docker Compose — single `docker-compose up`, no external dependencies

**Quality pipeline:**
- Pre-commit pipeline: ruff, ty (type checking), conventional commits
- Unit, integration, and E2E test suite (Playwright, ≥5 scenarios)
- WCAG AA compliance (axe-core verified)
- README with setup and test instructions

**BMAD deliverables:**
- Product brief, PRD, architecture doc, stories with acceptance criteria, QA reports, AI integration log

### Phase 2: Growth

- User authentication and personal accounts (enables cross-device sync)
- Task prioritisation, labels, or deadlines
- Search and filtering
- PWA support

### Phase 3: Expansion

- Multi-user collaboration and lightweight sharing
- Smart features: recurring tasks, deadline-aware sorting, natural language input
- Mobile native app (leveraging the existing API contract)

### Risk Mitigation

**Technical:** SQLite volume persistence in Docker is the highest-probability friction point (file permissions, mount paths). Mitigated by explicit volume configuration in `docker-compose.yml` and a container restart test in the E2E suite.

**Methodology:** AI-generated code quality is gated by the pre-commit pipeline and the ≥70% test coverage requirement. The test suite is the backstop against silent regressions.

## User Journeys

### Journey 1: The Task Dumper (Primary User — Happy Path)

**Meet Alex.** Alex is a developer who keeps a running mental list of things to handle — pull a library update, prep a meeting agenda, follow up on a code review. The list never shrinks, and it lives entirely in their head, which means items surface at the wrong moment or vanish completely.

**Opening scene:** It's Monday morning. Alex opens the Todo app for the first time. There's no login form, no "what's your name?" prompt. The screen shows an empty list and an input field. Alex types "prep retro notes" and hits Enter.

**Rising action:** The item appears instantly at the top of the list. Alex adds three more in quick succession. Partway through typing the fourth, they realise the wording is wrong — they click the description inline and edit it without losing their place. One item from last week is already done; they toggle it complete and it shifts to a visually distinct completed state.

**Climax:** Alex closes the browser tab and reopens it 20 minutes later. Every item is exactly where they left it. No sync spinner, no "session expired" prompt. Just the list, as they left it.

**Resolution:** At end of day, Alex deletes the completed items. The list is clean. The app asked nothing of them and got out of the way.

**Requirements revealed:** Immediate load with persisted state, inline editing, completion toggle with visual distinction, delete, empty state after all items removed.

---

### Journey 2: The Error Encounter (Primary User — Edge Case / Error Recovery)

**Meet the same Alex**, on a day when the backend is temporarily unreachable (container restarting, network blip).

**Opening scene:** Alex opens the app. The task list doesn't load. Instead of a blank white screen or a silent spinner that never resolves, a clear error message tells them something went wrong and that they can try again.

**Rising action:** Alex clicks "retry" (or refreshes). The connection recovers and the list loads correctly. Later, Alex tries to add a new todo — the request fails mid-flight. The input field doesn't silently discard the text; Alex sees an error indicator, and their typed text is still there to retry without retyping.

**Climax:** Alex submits an empty description by accident. The form doesn't submit — a short validation message explains a description is required, without disrupting the rest of the interface.

**Resolution:** Alex never lost data due to a transient error. Every failure state was communicated clearly, with a recovery path.

**Requirements revealed:** Error state UI, retry mechanism, form validation (required field), non-destructive failure handling on create/edit, loading state distinct from error state.

---

### Journey 3: The Developer Deploy (Ops User — First Run)

**Meet Sam**, a developer evaluating the app from the repository. Sam has never seen the codebase before.

**Opening scene:** Sam clones the repo, reads the README, runs `docker-compose up`. No manual setup steps, no missing environment variables, no tribal knowledge required.

**Rising action:** Containers build, start, and report healthy within 30 seconds. Sam navigates to the app in a browser — it loads. Sam creates a todo, refreshes — it persists. Sam runs `docker-compose down` and back up — the todo is still there.

**Climax:** Sam runs the test suite. All unit, integration, and E2E tests pass. Coverage shows ≥70%. Sam triggers the pre-commit hook manually — ruff passes, ty type checks pass, a deliberately malformed commit message is rejected with a clear conventional commit error.

**Resolution:** Sam has full confidence the app works as specified. The README was sufficient.

**Requirements revealed:** Self-contained Docker Compose setup, health checks, volume-backed SQLite persistence, documented test commands, pre-commit hook configuration in repo.

---

### Journey Requirements Summary

| Capability | Revealed By |
|---|---|
| Immediate task list load on open | Journey 1 |
| Create todo with required text description | Journeys 1, 2 |
| Inline edit of todo description | Journey 1 |
| Complete / incomplete toggle with visual distinction | Journey 1 |
| Delete todo | Journey 1 |
| Empty state (no todos) | Journey 1 |
| Loading state (data in flight) | Journey 2 |
| Error state with retry (network/backend failure) | Journey 2 |
| Form validation — required field | Journey 2 |
| Non-destructive error handling (preserve user input) | Journey 2 |
| SQLite persistence across browser refresh | Journeys 1, 3 |
| SQLite persistence across container restart | Journey 3 |
| Single `docker-compose up` deployment | Journey 3 |
| Health checks on all containers | Journey 3 |
| Pre-commit pipeline (ruff, ty type checks, conventional commits) | Journey 3 |
| Documented test commands in README | Journey 3 |

## Web Application Specific Requirements

### Project-Type Overview

A single-page application (SPA) built with Vue 3 (Composition API) communicating with a FastAPI REST backend. No server-side rendering, no multi-page routing — the entire UI is a single view rendering the task list. All persistence is handled by the backend.

### Technical Architecture Considerations

The frontend makes direct HTTP requests to the backend REST API. No WebSocket or real-time subscription layer is required — the single-user, request/response model is sufficient. State management is component-local; Pinia is not required for v1 but must not be ruled out by the architecture.

### Browser Matrix

| Browser | Support |
|---|---|
| Chrome (last 2 versions) | ✅ Required |
| Firefox (last 2 versions) | ✅ Required |
| Safari (last 2 versions) | ✅ Required |
| Edge (last 2 versions) | ✅ Required |
| Legacy browsers (IE, older mobile) | ❌ Out of scope |

### Responsive Design

The application must render correctly and remain fully usable on desktop and mobile viewports. No specific breakpoint contract is mandated — "works reasonably on both" is the bar for v1. Mobile layout must not obscure any core interaction (create, edit, toggle, delete).

### SEO

Not applicable. No public discoverability requirement; no meta tags, structured data, or crawler optimisation needed.

### Implementation Considerations

- Vite as the build tool (standard Vue 3 toolchain)
- No client-side routing library required — single view
- API base URL configurable via environment variable for Docker Compose compatibility
- Frontend served as static assets (Nginx or equivalent) in production container

## Functional Requirements

### Task Management

- **FR1:** User can create a todo with a text description
- **FR2:** User can view their complete list of todos
- **FR3:** User can edit the text description of an existing todo
- **FR4:** User can mark a todo as complete
- **FR5:** User can mark a completed todo as incomplete
- **FR6:** User can delete a todo

### Task Display & State

- **FR7:** The system displays todos in reverse chronological order (newest first), hard-coded — not user-configurable
- **FR8:** The system visually distinguishes completed todos from active todos
- **FR9:** The system displays an empty state when no todos exist
- **FR10:** The system displays a loading state while data is being fetched from the backend
- **FR11:** The system displays an error state when the backend is unreachable, with a mechanism to retry
- **FR12:** The system preserves user-entered text if a create or edit operation fails
- **FR13:** The system validates that a todo description is not empty before submission and communicates the validation error to the user

### Data Persistence

- **FR14:** The system persists todos across browser refresh without data loss
- **FR15:** The system persists todos across container restart without data loss

### API Contract

- **FR16:** The system exposes an endpoint to retrieve all todos in reverse chronological order
- **FR17:** The system exposes an endpoint to create a new todo
- **FR18:** The system exposes an endpoint to update a todo's description and/or completion status independently
- **FR19:** The system exposes an endpoint to delete a todo by ID
- **FR20:** The system exposes a health check endpoint that indicates service availability
- **FR21:** The API returns consistent error responses with a human-readable message for all failure conditions
- **FR22:** The API returns appropriate HTTP status codes for all outcomes (success and error)

### Accessibility & Responsive Design

- **FR23:** All interactive elements are operable via keyboard navigation
- **FR24:** All interactive elements have appropriate accessible names and roles
- **FR25:** All core interactions (create, edit, complete, delete, view) are accessible and functional on desktop viewports (≥1280px width) with no layout overflow or element truncation
- **FR26:** All core interactions (create, edit, complete, delete, view) are accessible and functional on mobile viewports (≥375px width) with no layout overflow or element truncation
- **FR27:** The application meets WCAG 2.1 AA accessibility standards, verified with automated tooling

### Deployment & Operations

- **FR28:** The complete application can be started with a single command without manual setup or configuration steps
- **FR29:** All application containers report a healthy status after startup
- **FR30:** The application is reachable and functional within 30 seconds of container startup
- **FR31:** The API base URL is configurable via environment variable to support different deployment environments

### Developer Experience & Quality Pipeline

- **FR32:** The repository enforces Python code formatting standards via a pre-commit hook
- **FR33:** The repository enforces Python type hint correctness via a pre-commit hook
- **FR34:** The repository enforces conventional commit message format via a pre-commit hook
- **FR35:** The backend includes unit and integration tests achieving at least 70% meaningful line coverage
- **FR36:** The test suite includes end-to-end tests covering the full CRUD lifecycle and error recovery scenarios
- **FR37:** The repository includes documentation that enables a developer with no prior knowledge of the codebase to set up, run, and execute the full test suite using only the README, as validated by Journey 3 (Developer Deploy) acceptance criteria

## Non-Functional Requirements

### Performance

- **NFR1:** The task list renders within 200ms of page load under normal operating conditions, as measured by Playwright timing assertions at p95 in the E2E test suite
- **NFR2:** Create, toggle, and delete interactions complete within 500ms end-to-end, as measured by Playwright timing assertions at p95 in the E2E test suite
- **NFR3:** The application is reachable and fully functional within 30 seconds of `docker-compose up`
- **NFR4:** A list of 100 todo items renders within 100ms of data receipt with no frame drops below 30fps during scroll, as measurable by the browser performance API

### Security

- **NFR5:** The application is free of critical OWASP Top 10 vulnerabilities, specifically: XSS, SQL injection, and command injection
- **NFR6:** Security findings from an AI-assisted code review are documented; all critical findings are remediated before v1 release
- **NFR7:** The application does not expose internal error details (stack traces, file paths) in API responses

### Accessibility

- **NFR8:** The application passes WCAG 2.1 AA automated checks with zero critical violations, verified with axe-core
- **NFR9:** All functionality is operable using only a keyboard
- **NFR10:** Colour contrast ratios meet WCAG AA minimums for all text and interactive elements

### Maintainability

- **NFR11:** All Python code conforms to ruff formatting rules; zero violations in CI
- **NFR12:** All Python functions and methods include type annotations; `ty` type checker passes with zero errors
- **NFR13:** All commits conform to the Conventional Commits specification; non-conforming commits are rejected by the pre-commit hook
- **NFR14:** Backend test coverage is at least 70% meaningful line coverage; coverage report is generated as part of the test run
- **NFR15:** The codebase can be set up, run, and tested by a developer with no prior context using only the README
