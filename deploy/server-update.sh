#!/usr/bin/env bash
set -Eeuo pipefail

readonly SOURCE_DIR="${SOURCE_DIR:-/opt/yundu}"
readonly APP_DIR="${APP_DIR:-/opt/new-api}"
readonly BRANCH="${DEPLOY_BRANCH:-main}"
readonly IMAGE_REPOSITORY="new-api-rmb"
readonly CONTAINER_NAME="new-api"
readonly HEALTH_URL="http://127.0.0.1/api/status"
readonly LOCK_FILE="/var/lock/yundu-deploy.lock"

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "Another deployment is already running." >&2
  exit 1
fi

cd "${SOURCE_DIR}"
git fetch --prune origin "${BRANCH}"
git checkout -B "${BRANCH}" "origin/${BRANCH}"
git reset --hard "origin/${BRANCH}"

readonly REVISION="$(git rev-parse --short=12 HEAD)"
readonly VERSIONED_IMAGE="${IMAGE_REPOSITORY}:${REVISION}"
readonly PREVIOUS_IMAGE_ID="$(docker image inspect "${IMAGE_REPOSITORY}:latest" --format '{{.Id}}' 2>/dev/null || true)"

echo "Building ${VERSIONED_IMAGE}"
docker build -f deploy/Dockerfile.server -t "${VERSIONED_IMAGE}" .
docker tag "${VERSIONED_IMAGE}" "${IMAGE_REPOSITORY}:latest"

mkdir -p "${APP_DIR}/backups"
if docker ps --format '{{.Names}}' | grep -Fxq new-api-postgres; then
  docker exec new-api-postgres pg_dump -U root -d new-api -Fc \
    >"${APP_DIR}/backups/pre-deploy-${REVISION}-$(date +%Y%m%d%H%M%S).dump"
fi

cd "${APP_DIR}"
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
docker-compose --env-file .env.deploy -f docker-compose.deploy.yml up -d new-api

for attempt in $(seq 1 60); do
  if curl --fail --silent --show-error "${HEALTH_URL}" >/dev/null; then
    echo "Deployment ${REVISION} is healthy."
    exit 0
  fi
  sleep 2
done

echo "Deployment ${REVISION} failed its health check; rolling back." >&2
if [[ -n "${PREVIOUS_IMAGE_ID}" ]]; then
  docker tag "${PREVIOUS_IMAGE_ID}" "${IMAGE_REPOSITORY}:latest"
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  docker-compose --env-file .env.deploy -f docker-compose.deploy.yml up -d new-api
fi
exit 1
