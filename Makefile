# leapsome-bmad-todo Makefile
# Thin wrappers around docker compose commands.
# Future stories will add targets incrementally:
#   Story 3.2 → make dev-frontend
#   Story 5.1 → make test-e2e
#   Story 5.1/5.3 → make test-all

.PHONY: help up up-d down nuke build logs setup test-backend lint-backend lint-frontend test-frontend

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

test-backend: ## Run backend test suite with coverage
	cd todo-backend && uv run pytest --cov=app --cov-report=term-missing --cov-branch

lint-backend: ## Run ruff format, ruff check, and ty type check on backend
	cd todo-backend && uv run ruff format --check . && uv run ruff check . && uv run ty check

lint-frontend: ## Run frontend lint, type-check, and build validation
	npm --prefix todo-frontend run lint && npm --prefix todo-frontend run type-check && npm --prefix todo-frontend run build

test-frontend: ## Run frontend unit tests (single run)
	npm --prefix todo-frontend run test:unit -- --run
