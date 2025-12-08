#!/usr/bin/env bash
set -euo pipefail

# Run local real integration tests by starting the dev server (Vite + local API)
# and posting a real request to the /api/extension-errors endpoint.

DEV_API_PORT=${DEV_API_PORT:-5252}
VITE_PORT=${VITE_PORT:-5173}
API_KEY=${TEST_PJE_API_KEY:-valid-test-api-key}
BASE_URL="http://127.0.0.1:${DEV_API_PORT}"

echo "Starting local dev server with API..."
npm run dev:with-api &
DEV_PID=$!

function cleanup() {
  echo "Stopping dev server (PID ${DEV_PID})..."
  kill ${DEV_PID} || true
}
trap cleanup EXIT

echo "Waiting for local dev API to be ready on ${BASE_URL}..."
for i in {1..30}; do
  if curl -sSf "${BASE_URL}/api/expedientes" > /dev/null 2>&1; then
    echo "Local API is ready"
    break
  fi
  sleep 1
done

echo "Posting a batch of extension error events..."
TIMESTAMP=$(date --iso-8601=seconds)
EVENT_PAYLOAD="{\"id\": \"local-test-1\", \"timestamp\": \"${TIMESTAMP}\", \"message\": \"Local test error\" }"

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/extension-errors" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  --data "${EVENT_PAYLOAD}")

echo "Response: ${RESPONSE}"

echo "Fetching errors to validate storage..."
LIST=$(curl -s -X GET "${BASE_URL}/api/extension-errors")
echo "List: ${LIST}"

if echo "${LIST}" | grep -q "local-test-1"; then
  echo "✅ Local real test succeeded: extension error stored and retrieved"
  exit 0
else
  echo "❌ Local real test failed: event not found in results"
  exit 1
fi
