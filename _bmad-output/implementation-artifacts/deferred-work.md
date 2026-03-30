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
