# leapsome-bmad-todo Makefile
# Thin wrappers around docker compose commands.
# Future stories will add targets incrementally:
#   Story 2.5 → make test-backend
#   Story 3.2 → make dev-frontend
#   Story 5.1 → make test-e2e
#   Story 5.1/5.3 → make test-all

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
