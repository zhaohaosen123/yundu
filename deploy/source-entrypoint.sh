#!/usr/bin/env sh
set -eu

cd /app/web
bun install --frozen-lockfile --registry "${BUN_REGISTRY:-https://registry.npmmirror.com}"
bun run build

cd /app
go build -trimpath -o /tmp/new-api .
exec /tmp/new-api --log-dir /app/logs
