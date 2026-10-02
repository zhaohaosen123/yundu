WEB_DIR = ./web
API_DIR = .
DEV_WEB_PORT ?= 5174
DEV_COMPOSE_FILE = docker-compose.dev.yml
DEV_ENV_FILE = .env.local
DEV_API_SERVICE = new-api

.PHONY: all build-web build-all-web start-api dev dev-api dev-api-rebuild dev-web reset-setup test

all: build-all-web start-api

build-web:
	@echo "Building web frontend..."
	@cd $(WEB_DIR) && bun install --frozen-lockfile
	@cd $(WEB_DIR) && DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$$(cat ../VERSION) bun run build

build-all-web: build-web

start-api:
	@test -n "$$SQL_DSN" || (echo "SQL_DSN is required; local development must use the shared remote database." && exit 1)
	@echo "Starting api dev server with the shared remote database..."
	@cd $(API_DIR) && go run main.go &

dev-api:
	@echo "Starting api services with the shared remote database (docker)..."
	@docker compose --env-file $(DEV_ENV_FILE) -f $(DEV_COMPOSE_FILE) up -d

dev-api-rebuild:
	@echo "Restarting api service from mounted source (docker)..."
	@docker compose --env-file $(DEV_ENV_FILE) -f $(DEV_COMPOSE_FILE) up -d $(DEV_API_SERVICE)
	@docker compose --env-file $(DEV_ENV_FILE) -f $(DEV_COMPOSE_FILE) restart $(DEV_API_SERVICE)

dev-web:
	@echo "Starting web frontend dev server..."
	@echo "Web frontend: http://localhost:$(DEV_WEB_PORT)"
	@cd $(WEB_DIR) && bun install
	@cd $(WEB_DIR) && bun run dev -- --host 0.0.0.0 --port $(DEV_WEB_PORT)

dev: dev-api dev-web

# The main package embeds the ignored web/dist output and is covered after build-web.
test:
	@echo "Testing root Go module..."
	@root_module=$$(GOWORK=off go list -m); \
		root_packages=$$(GOWORK=off go list -e ./... | grep -vxF "$$root_module"); \
		GOWORK=off go test $$root_packages
	@echo "Testing relaykit Go module..."
	@cd relaykit && GOWORK=off go test ./...

reset-setup:
	@echo "Refusing to reset setup data: local development now uses the shared remote database."
	@echo "Use an audited administrator workflow for remote data changes."
	@exit 1
