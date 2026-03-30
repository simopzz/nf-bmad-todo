# Story 1.2: Pre-commit Quality Pipeline

Status: done

## Story

As a developer,
I want pre-commit hooks that enforce code quality and commit message standards automatically,
so that no non-conforming code or commit message can enter the repository.

## Acceptance Criteria

1. **Given** the repository has `.pre-commit-config.yaml` at the root and `pyproject.toml` with a `[tool.ruff]` section in `todo-backend/`, **When** I run `pre-commit install` and attempt to commit Python code with formatting violations, **Then** ruff autoformats the file and blocks the commit, prompting me to re-stage

2. **And** when I attempt to commit Python code with type annotation errors, `ty` blocks the commit with a clear error message

3. **And** the `ty` hook specifies `todo-backend/` as its working directory in `.pre-commit-config.yaml` — it does not run against the repository root where no Python files exist

4. **And** when I attempt to commit with a non-conforming message (e.g. `"fix stuff"`), the conventional commit hook rejects it with a clear error

5. **And** when I commit with a conforming message (e.g. `"feat: add todo endpoint"`), all hooks pass and the commit succeeds

6. **And** the Story 1.4 README will instruct developers to run `pre-commit install` immediately after cloning — hooks are not active until this command is run (this story creates the hooks; Story 1.4 documents them)

## Tasks / Subtasks

- [x] Add `[tool.ruff]` section to `todo-backend/pyproject.toml` (AC: #1)
  - [x] Add `[tool.ruff]` table with `line-length = 100`, `target-version = "py312"`
  - [x] Add `[tool.ruff.lint]` table with `select = ["E", "F", "I", "UP"]`
  - [x] Add `[tool.ruff.format]` table (empty is fine — inherits `line-length`)

- [x] Create `.pre-commit-config.yaml` at repository root (AC: #1, #2, #3, #4, #5)
  - [x] Add ruff hook: `astral-sh/ruff-pre-commit`, both `ruff` (lint + fix) and `ruff-format` hooks
  - [x] Add ty hook: `local` hook running `uv run --project todo-backend ty check todo-backend/`; `pass_filenames: false`; `files: ^todo-backend/.*\.py$`
  - [x] Add conventional commit hook: `compilerla/conventional-pre-commit`, stage `commit-msg`

- [x] Fix deferred Playwright `--pass-with-no-tests` concern (deferred from Story 1.1 review) (AC: n/a — maintenance)
  - [x] In `playwright.config.ts` at repository root, ensure `--pass-with-no-tests` is handled — either add `reportSlowTests: null` or confirm the flag is set in any future CI command; annotate with a comment pointing to the deferred issue

- [x] Verify hooks work end-to-end (AC: #1–#5)
  - [x] Run `pre-commit run --all-files` from repository root — confirm ruff and ty pass on the current scaffold
  - [x] Confirm no false positives on `todo-frontend/` or repository root (ty must not try to type-check non-Python files)

## Dev Notes

### Critical: File Locations

- `.pre-commit-config.yaml` lives at **repository root** — NOT inside `todo-backend/` or `todo-frontend/`
- `[tool.ruff]` config lives in `todo-backend/pyproject.toml` — NOT at repository root
- `pre-commit` is a developer tool, not a Python project dependency — it is installed globally or via `uv tool install pre-commit`, never added to `pyproject.toml` dependencies

### `.pre-commit-config.yaml` — Exact Configuration

```yaml
repos:
  # Ruff: lint (with autofix) + format
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.15.8  # align with ruff version in pyproject.toml dev deps
    hooks:
      - id: ruff
        args: [--fix]
        types_or: [python, pyi]
      - id: ruff-format
        types_or: [python, pyi]

  # ty: type checking — scoped to todo-backend/ only
  - repo: local
    hooks:
      - id: ty
        name: ty type check
        entry: uv run --project todo-backend ty check todo-backend/
        language: system
        files: ^todo-backend/.*\.py$
        pass_filenames: false

  # Conventional Commits: commit message enforcement
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v4.0.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
        args: []  # allow all conventional commit types
```

**Why `local` hook for ty:** ty does not yet publish a managed pre-commit mirror. Using `local` with `uv run --project todo-backend` ensures ty runs inside the uv-managed virtual environment where it is already installed as a dev dependency. No additional global install required.

**Why `pass_filenames: false` on ty:** ty performs whole-project type checking. Passing individual changed filenames would produce incomplete results or errors. Always check `todo-backend/` as a whole.

**Rev pinning:** Use the `v0.15.8` rev for ruff to match the `ruff>=0.15.8` constraint in `pyproject.toml`. For `conventional-pre-commit`, `v4.0.0` is the latest stable release as of early 2026. Run `pre-commit autoupdate` if you want to update later, but pin to tested revs in commits.

### `todo-backend/pyproject.toml` — `[tool.ruff]` Additions

Append to the existing `pyproject.toml` (do NOT replace the existing content):

```toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP"]

[tool.ruff.format]
# inherits line-length from [tool.ruff]
```

**Rule set rationale:**
- `E` — pycodestyle errors
- `F` — Pyflakes (undefined names, unused imports)
- `I` — isort (import ordering)
- `UP` — pyupgrade (modern Python syntax)

Do NOT add `D` (docstring rules) or `ANN` (annotation rules) — they are too noisy for a small project and will fail on existing scaffold stubs.

### ty Hook — Scoping to `todo-backend/`

The AC explicitly states: *"the `ty` hook specifies `todo-backend/` as its working directory — it does not run against the repository root where no Python files exist."*

The `local` hook entry `uv run --project todo-backend ty check todo-backend/` achieves this:
- `--project todo-backend` loads the uv project configuration from `todo-backend/pyproject.toml`
- `ty check todo-backend/` explicitly tells ty which directory to type-check
- `files: ^todo-backend/.*\.py$` ensures the hook only triggers when Python files inside `todo-backend/` change

If `todo-frontend/` TypeScript files change, ty does NOT run. Correct behaviour.

### Conventional Commit Hook — Stage Requirement

The conventional commit hook MUST run on `commit-msg` stage (not `pre-commit` stage). It reads the commit message file, not the staged diff. This is set via `stages: [commit-msg]`.

Without `stages: [commit-msg]`, the hook is silently skipped during commit message validation. Always verify the hook fires with:
```bash
git commit --allow-empty -m "fix stuff"  # should fail
git commit --allow-empty -m "fix: correct ruff violation"  # should pass
```

### Deferred Work from Story 1.1: Playwright `--pass-with-no-tests`

The Story 1.1 code review deferred this item to Story 1.2:
> `e2e/` + `fullyParallel: true` with no tests — CI exits non-zero unless `--pass-with-no-tests` flag is set

**Action:** Add a comment to `playwright.config.ts` documenting that any CI command running Playwright must include `--pass-with-no-tests` until E2E tests are added in Story 5.1. Alternatively, add a minimal no-op test in `e2e/` to prevent the empty-test failure. Do NOT modify `baseURL` or any other config while touching this file.

Recommended approach — add a comment block to `playwright.config.ts`:
```typescript
// NOTE: until E2E tests are added in Story 5.1, run Playwright with:
//   npx playwright test --pass-with-no-tests
// Without this flag, CI will exit non-zero on an empty test suite.
```

### Scope Boundaries — What This Story Does NOT Include

- **Story 1.3:** `docker-compose.yml`, `Dockerfile` files, Nginx — not this story
- **Story 1.4:** README content, `pre-commit install` instructions — not this story (create the hooks here; document them in 1.4)
- **No Python app code:** Do not create `app/main.py` or any application files — that is Epic 2
- **No frontend linting changes:** ESLint/Prettier for the Vue project were set up in Story 1.1 and are not pre-commit hooks in this story
- **No CI/CD pipeline:** GitHub Actions or other CI setup is not part of this story

### Verification Commands

After setting up hooks, verify locally:

```bash
# Install pre-commit (one-time, globally or via uv tool)
pip install pre-commit         # OR: uv tool install pre-commit

# Install hooks into git
pre-commit install
pre-commit install --hook-type commit-msg  # REQUIRED for conventional-commit hook

# Run all hooks against all files
pre-commit run --all-files

# Test ruff: should autofix a trailing whitespace violation
# Test ty: should pass (no Python app code yet, only scaffold)
# Test commit message:
git commit --allow-empty -m "fix stuff"           # should reject
git commit --allow-empty -m "chore: add pre-commit hooks"  # should pass
```

**Expected baseline result:** `pre-commit run --all-files` passes with the current scaffold. No Python app code means `ty` has minimal type surface to check. Ruff will format any Python files it finds (possibly the stub from `uv init` if not deleted; it should have been deleted in Story 1.1).

### Project Structure Notes

Files created/modified in this story:
```
leapsome-bmad-todo/                    # repository root
├── .pre-commit-config.yaml            ← CREATED (ruff, ty, conventional-commits)
└── todo-backend/
    └── pyproject.toml                 ← MODIFIED: append [tool.ruff] sections
```

Files NOT modified:
- `playwright.config.ts` — only add a comment block (no functional changes)
- `todo-frontend/` — ESLint/Prettier configured in Story 1.1; no changes here
- `.gitignore` — already correct from Story 1.1

### References

- Pre-commit hook scoping: [Source: `_bmad-output/planning-artifacts/architecture.md`#Infrastructure Patterns — Pre-commit]
- ruff in toolchain: [Source: `_bmad-output/planning-artifacts/architecture.md`#Backend uv init]
- ty hook requirement: [Source: `_bmad-output/planning-artifacts/epics.md`#Story 1.2]
- FR32–34 traceability: [Source: `_bmad-output/planning-artifacts/architecture.md`#Requirements Overview]
- Deferred Playwright concern: [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]
- Story 1.1 scope boundaries: [Source: `_bmad-output/implementation-artifacts/1-1-repository-and-project-scaffold.md`#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation proceeded without issues.

### Completion Notes List

- Created `.pre-commit-config.yaml` at repo root with ruff (lint+format, scoped to `todo-backend/`), ty (local, scoped to `todo-backend/`), and conventional-pre-commit (commit-msg stage) hooks
- Appended `[tool.ruff]`, `[tool.ruff.lint]`, and `[tool.ruff.format]` sections to `todo-backend/pyproject.toml`
- Added comment block to `playwright.config.ts` documenting the `--pass-with-no-tests` requirement for CI until Story 5.1
- Ran `pre-commit run --all-files` — ruff correctly skipped (no app Python files yet); ty correctly skipped (no app Python files yet); conventional-commit skipped (commit-msg stage only)
- Verified non-conforming commit message `"fix stuff"` rejected; conforming `"chore: add pre-commit hooks"` accepted
- Installed hooks via `pre-commit install` and `pre-commit install --hook-type commit-msg`

### File List

- `.pre-commit-config.yaml` (created)
- `todo-backend/pyproject.toml` (modified — appended ruff config sections)
- `playwright.config.ts` (modified — added comment about `--pass-with-no-tests`)

### Review Findings

- [x] [Review][Decision] Ruff hook ID `ruff-check` deviates from spec's `ruff` — kept `ruff-check` (newer canonical ID)
- [x] [Review][Decision] Ruff hooks include `files: ^todo-backend/.*\.py$` filter not present in spec — kept for correct monorepo scoping
- [x] [Review][Patch] `target-version = "py312"` → `"py313"` to match `.python-version` [todo-backend/pyproject.toml:26] — fixed

### Change Log

- 2026-03-30: Story 1.2 implemented — pre-commit quality pipeline with ruff, ty, and conventional commits
