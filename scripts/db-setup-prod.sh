#!/usr/bin/env bash
# One-shot production DB setup from the host (compose project root).
#
# Usage:
#   LEGACY_DUMP_PATH=/path/to/didnegar_new.sql sudo bash scripts/db-setup-prod.sh
#
# If didnegar_new already has tables, dump path is optional:
#   sudo bash scripts/db-setup-prod.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Load .env if present (without clobbering explicit env)
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

ROOT_PASS="${MYSQL_ROOT_PASSWORD:-root}"
DB_USER="${DB_USERNAME:-didnegar}"
SOURCE="${SOURCE_DATABASE:-didnegar_new}"
TARGET="${DB_DATABASE:-didnegar}"
DUMP="${LEGACY_DUMP_PATH:-}"
MYSQL_SERVICE="${MYSQL_SERVICE:-mysql}"
API_SERVICE="${API_SERVICE:-api}"

mysql_root() {
  docker compose exec -T "$MYSQL_SERVICE" \
    mysql -uroot -p"$ROOT_PASS" --protocol=TCP "$@"
}

echo "==> ensure databases ($TARGET, $SOURCE)"
mysql_root -e "
CREATE DATABASE IF NOT EXISTS \`$TARGET\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS \`$SOURCE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`$TARGET\`.* TO '$DB_USER'@'%';
GRANT ALL PRIVILEGES ON \`$SOURCE\`.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
"

TABLE_COUNT="$(
  mysql_root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$SOURCE'" \
    | tr -d '[:space:]'
)"

if [[ "${TABLE_COUNT:-0}" == "0" ]]; then
  if [[ -z "$DUMP" ]]; then
    echo "ERROR: \`$SOURCE\` has no tables."
    echo "Pass the legacy dump path:"
    echo "  LEGACY_DUMP_PATH=/path/to/dump.sql sudo bash scripts/db-setup-prod.sh"
    exit 1
  fi
  if [[ ! -f "$DUMP" ]]; then
    echo "ERROR: dump file not found: $DUMP"
    exit 1
  fi
  echo "==> loading dump into $SOURCE from $DUMP"
  mysql_root "$SOURCE" < "$DUMP"
else
  echo "==> $SOURCE already has $TABLE_COUNT tables (skip dump load)"
fi

echo "==> migrate + import + seed (inside $API_SERVICE)"
docker compose exec -T "$API_SERVICE" npm run db:setup:prod

echo "==> done"
