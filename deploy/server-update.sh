#!/usr/bin/env bash
set -Eeuo pipefail

readonly SOURCE_DIR="${SOURCE_DIR:-/opt/yundu}"
readonly APP_DIR="${APP_DIR:-/opt/new-api}"
readonly BRANCH="${DEPLOY_BRANCH:-main}"
readonly RUNTIME_IMAGE="new-api-source-runtime:go1.26.1-bun1.4.0"
readonly CONTAINER_NAME="new-api"
readonly HEALTH_URL="http://127.0.0.1/api/status"
readonly LOCK_FILE="/var/lock/yundu-deploy.lock"
readonly COMPOSE_FILE="${SOURCE_DIR}/deploy/docker-compose.source.yml"

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "Another deployment is already running." >&2
  exit 1
fi

cd "${SOURCE_DIR}"
readonly PREVIOUS_REVISION="$(git rev-parse HEAD)"
git fetch --prune origin "${BRANCH}"
git checkout -B "${BRANCH}" "origin/${BRANCH}"
git reset --hard "origin/${BRANCH}"

readonly REVISION="$(git rev-parse --short=12 HEAD)"

if ! docker image inspect "${RUNTIME_IMAGE}" >/dev/null 2>&1; then
  echo "The source runtime image is missing; build it once with:"
  echo "docker build -f deploy/Dockerfile.source-runtime -t ${RUNTIME_IMAGE} ."
  exit 1
fi

mkdir -p "${APP_DIR}/backups"
if docker ps --format '{{.Names}}' | grep -Fxq new-api-postgres; then
  docker exec new-api-postgres pg_dump -U root -d new-api -Fc \
    >"${APP_DIR}/backups/pre-deploy-${REVISION}-$(date +%Y%m%d%H%M%S).dump"
fi

restart_from_source() {
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  env SOURCE_DIR="${SOURCE_DIR}" APP_DIR="${APP_DIR}" docker-compose \
    --project-name new-api \
    --env-file "${APP_DIR}/.env.deploy" \
    -f "${COMPOSE_FILE}" \
    up -d --no-build --force-recreate new-api
}

restart_from_source

for attempt in $(seq 1 300); do
  if curl --fail --silent --show-error "${HEALTH_URL}" >/dev/null; then
    echo "Deployment ${REVISION} is healthy."
    exit 0
  fi
  sleep 2
done

echo "Deployment ${REVISION} failed its health check; rolling back." >&2
cd "${SOURCE_DIR}"
git reset --hard "${PREVIOUS_REVISION}"
restart_from_source
exit 1
