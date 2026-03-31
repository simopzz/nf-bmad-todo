# Story 1.5: Developer Makefile

Status: done

## Story

As a developer,
I want a Makefile at the repository root that wraps common development commands,
So that I can operate the stack with short, memorable commands and the README stays lean.

## Acceptance Criteria

1. **Given** I have cloned the repository and have Docker and Make installed, **When** I run `make help`, **Then** it prints a list of all available targets with brief descriptions.
2. **Given** the Makefile exists, **When** I run `make up`, **Then** it runs `docker compose up` (foreground).
3. **Given** the Makefile exists, **When** I run `make up-d`, **Then** it runs `docker compose up -d` (detached).
4. **Given** the Makefile exists, **When** I run `make down`, **Then** it runs `docker compose down` (preserves data, volume retained).
5. **Given** the Makefile exists, **When** I run `make nuke`, **Then** it runs `docker compose down -v` **and** prints a warning that all todo data has been permanently deleted.
6. **Given** the Makefile exists, **When** I run `make build`, **Then** it runs `docker compose up --build`.
7. **Given** the Makefile exists, **When** I run `make logs`, **Then** it runs `docker compose logs -f`.
8. **Given** the Makefile exists, **When** I run `make setup`, **Then** it runs `cp -n .env.example .env && pre-commit install` — safe to re-run (does NOT overwrite an existing `.env`).
9. **Given** the Makefile exists, **Then** all targets are declared under `.PHONY`.
10. **Given** the Makefile exists, **Then** each target is a thin wrapper — no custom shell logic beyond the underlying command plus optional `@echo` feedback.
11. **Given** the Makefile exists, **Then** it includes a header comment noting that future stories will add targets incrementally.

## Tasks / Subtasks

- [x] Task 1: Create `Makefile` at project root (AC: #1–#11)
  - [x] 1.1: Add file header comment explaining incremental growth convention
  - [x] 1.2: Implement `.PHONY` declaration covering all targets
  - [x] 1.3: Implement `help` target using `##` comment parsing pattern
  - [x] 1.4: Implement `up` target → `docker compose up`
  - [x] 1.5: Implement `up-d` target → `docker compose up -d`
  - [x] 1.6: Implement `down` target → `docker compose down`
  - [x] 1.7: Implement `nuke` target → `@echo` warning + `docker compose down -v`
  - [x] 1.8: Implement `build` target → `docker compose up --build`
  - [x] 1.9: Implement `logs` target → `docker compose logs -f`
  - [x] 1.10: Implement `setup` target → `cp -n .env.example .env && pre-commit install`
- [x] Task 2: Update `README.md` to reference Makefile shortcuts (AC: #1)
  - [x] 2.1: Add `make help` reference in Quick Start section or a new "Using Make" section
  - [x] 2.2: Annotate existing raw `docker-compose` commands with their `make` equivalents (e.g. `make up`, `make down`, `make nuke`)
  - [x] 2.3: Note that `make setup` automates the `.env` copy + pre-commit install steps

### Review Findings

- [x] [Review][Decision] `make setup` hard-fails when `pre-commit` is unavailable — dismissed: strict AC behavior retained by product decision.

## Dev Notes

### The Single Deliverable

This story creates ONE new file (`Makefile`) and updates ONE existing file (`README.md`). Nothing else. No new services, no new config, no new scripts.

### Makefile Implementation Pattern

Use the `##` comment parsing pattern for `make help` — it is idiomatic and requires zero external tooling:

```makefile
# leapsome-bmad-todo Makefile
# Thin wrappers around docker compose commands.
# Future stories will add targets incrementally — see Incremental Growth Convention below.

.PHONY: help up up-d down nuke build logs setup

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'

up: ## Start the stack (foreground)
	docker compose up

up-d: ## Start the stack (detached)
	docker compose up -d

down: ## Stop the stack (data preserved)
	docker compose down

nuke: ## Stop the stack and DELETE all data (irreversible)
	@echo "WARNING: All todo data will be permanently deleted."
	docker compose down -v

build: ## Rebuild images and start the stack
	docker compose up --build

logs: ## Follow service logs
	docker compose logs -f

setup: ## Create .env from .env.example (safe to re-run) and install pre-commit hooks
	cp -n .env.example .env
	pre-commit install
```

### Critical Implementation Rules

- **Use `docker compose`** (v2 space syntax, no hyphen) in all Makefile targets — this is the modern CLI. The README uses both for compatibility but the Makefile standardises on v2.
- **`cp -n`**: The `-n` flag means "no-clobber" — will NOT overwrite an existing `.env`. This makes `make setup` safe to re-run.
- **`make nuke` warning**: MUST print a warning before running `docker compose down -v`. Use `@echo` — note the `@` suppresses the command echo, showing only the message.
- **No `@` on commands** unless suppressing is intentional (e.g. the `@grep` in `help` and `@echo` in `nuke`). Standard targets should show the command being run for transparency.
- **`.PHONY` must list every target** — prevents conflicts with files named the same as targets (e.g. a file named `build`).
- **Thin wrappers only** — no shell conditionals, loops, or business logic. Each target is one underlying command (plus optional `@echo` feedback).

### README Update Scope

Story 1.4 created the README with raw `docker-compose` commands. This story adds `make` shortcuts alongside them. Scope:

- Quick Start: add `make setup` as the preferred one-liner for `.env` copy + hook install
- Data Safety section: annotate `docker-compose down` → `make down`, `docker-compose down -v` → `make nuke`, `docker-compose up --build` → `make build`
- Add brief note: "Run `make help` to see all available targets"
- Do NOT remove raw docker-compose commands — keep them as the fallback for environments without `make`
- Do NOT add new README sections beyond what's needed

### Incremental Growth Convention (Informational Only)

The Makefile header comment should note that future stories add targets. Expected additions (do NOT implement now):
- Story 2.5: `make test-backend` → `cd todo-backend && uv run pytest --cov`
- Story 3.2: `make dev-frontend` → `cd todo-frontend && npm run dev`
- Story 5.1: `make test-e2e` → `npx playwright test`
- Story 5.1 or 5.3: `make test-all` → runs all test suites sequentially

### What Already Exists (Do Not Modify)

| Artifact | Location | Notes |
|----------|----------|-------|
| `docker-compose.yml` | Project root | Services: `backend`, `frontend`. Volume: `db-data`. Do NOT touch. |
| `.env.example` | Project root | Source file for `cp -n .env.example .env` in `make setup`. Do NOT touch. |
| `.pre-commit-config.yaml` | Project root | Installed by `pre-commit install` in `make setup`. Do NOT touch. |
| `README.md` | Project root | UPDATE with `make` shortcuts — minimal edits only. |

### Anti-Patterns to Avoid

- Do NOT use `docker-compose` (hyphen/v1 syntax) in the Makefile — use `docker compose` (v2 space syntax)
- Do NOT add `SHELL := /bin/bash` or other shell configuration unless strictly necessary
- Do NOT add targets for backend tests, frontend dev server, or E2E tests — those belong to future stories
- Do NOT use `$(MAKE)` recursive calls
- Do NOT add a `clean` or `prune` target — `nuke` is the only destructive target
- Do NOT create any new files beyond `Makefile`
- Do NOT restructure or heavily rewrite the README — only annotate existing commands with `make` equivalents

### Previous Story Context

Story 1.4 (Minimal README) established:
- README uses raw `docker-compose` commands (v1/v2 compatible)
- Story 1.4 Dev Notes explicitly stated: "Do NOT document Makefile targets in detail — Story 1.5 owns the Makefile; this README only mentions `make help` and a few key shortcuts"
- Story 1.4 Epic AC said: "the README references Makefile targets (e.g. `make up`, `make down`) alongside raw commands where applicable, noting that Story 1.5 provides the Makefile" — this cross-reference was intentionally deferred to Story 1.5

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.5]
- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.4 AC mentioning Makefile reference]
- [Source: _bmad-output/implementation-artifacts/1-4-minimal-readme-and-developer-onboarding.md — Anti-Patterns, Dev Notes]
- [Source: _bmad-output/planning-artifacts/architecture.md — Infrastructure & Deployment patterns]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Created `Makefile` at project root with all 8 targets: `help`, `up`, `up-d`, `down`, `nuke`, `build`, `logs`, `setup`
- `make help` verified working — prints all targets with descriptions using `##` comment parsing
- All targets declared in `.PHONY`
- `nuke` prints `@echo` warning before `docker compose down -v`
- `setup` uses `cp -n` (no-clobber) to avoid overwriting existing `.env`
- Updated `README.md` Quick Start to use `make setup` + `make up`, Data Safety section annotated with `make` equivalents
- Added `make help` tip in Quick Start
- Pre-commit hooks pass on all changed files

### File List

- `Makefile` (new)
- `README.md` (modified)
- `_bmad-output/implementation-artifacts/1-5-developer-makefile.md` (story file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status update)

## Change Log

- 2026-03-31: Story 1.5 implemented — created Makefile with 8 targets, updated README with make shortcuts
