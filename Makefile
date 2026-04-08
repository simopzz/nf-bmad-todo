# leapsome-bmad-todo Makefile
# Thin wrappers around docker compose commands.
# Future stories will add targets incrementally:
#   Story 5.1 → make test-e2e
#   Story 5.1/5.3 → make test-all

.PHONY: help up up-d down nuke build logs setup test-backend lint-backend lint-frontend test-frontend dev-frontend dev-backend test-e2e test-all

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

setup: ## Create .env from .env.example (safe to re-run), install pre-commit hooks, and install Playwright browsers
	cp -n .env.example .env
	pre-commit install
	npx playwright install --with-deps

test-backend: ## Run backend test suite with coverage
	cd todo-backend && uv run pytest --cov=app --cov-report=term-missing --cov-branch

lint-backend: ## Run ruff format, ruff check, and ty type check on backend
	cd todo-backend && uv run ruff format --check . && uv run ruff check . && uv run ty check

lint-frontend: ## Run frontend lint, type-check, and build validation
	npm --prefix todo-frontend run lint && npm --prefix todo-frontend run type-check && npm --prefix todo-frontend run build

test-frontend: ## Run frontend unit tests (single run)
	npm --prefix todo-frontend run test:unit -- --run

dev-frontend: ## Start Vue dev server locally
	npm --prefix todo-frontend run dev

dev-backend: ## Start FastAPI dev server locally
	cd todo-backend && DATABASE_URL=sqlite+aiosqlite:///./todos.db uv run uvicorn app.main:app --reload

test-e2e: ## Run Playwright E2E tests (requires Docker stack running on port 80)
	npx playwright test --workers=1

test-all: ## Run all test suites sequentially (backend, frontend unit, E2E)
	$(MAKE) test-backend && $(MAKE) test-frontend && $(MAKE) test-e2e
