#!/usr/bin/env bash
# One-shot production DB setup from the host (compose project root).
#
# Does everything:
#   1) ensure Nest DB + legacy DB
#   2) load SQL dump into SOURCE_DATABASE (rewrites USE `didnegar` → source name)
#   3) migrate + import legacy → Nest + seed super-admin
#
# Usage (from /var/www):
#   sudo bash scripts/db-setup-prod.sh
#   LEGACY_DUMP_PATH=/var/www/dumps/didnegar-20260913-151630.sql sudo bash scripts/db-setup-prod.sh
#   FORCE_DUMP_RELOAD=1 sudo bash scripts/db-setup-prod.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

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
API_SERVICE="${API_SERVICE:-api}"
FORCE_DUMP_RELOAD="${FORCE_DUMP_RELOAD:-0}"

resolve_dump() {
  if [[ -n "${LEGACY_DUMP_PATH:-}" && -f "${LEGACY_DUMP_PATH}" ]]; then
    echo "${LEGACY_DUMP_PATH}"
    return
  fi
  local candidates=(
    "${ROOT_DIR}/dumps/didnegar-20260913-151630.sql"
    "/var/www/dumps/didnegar-20260913-151630.sql"
    "${ROOT_DIR}/dumps/didnegar_new.sql"
    "/var/www/dumps/didnegar_new.sql"
  )
  local f
  for f in "${candidates[@]}"; do
    if [[ -f "$f" ]]; then
      echo "$f"
      return
    fi
  done
  # first *.sql in dumps/
  local first
  first="$(ls -1 "${ROOT_DIR}/dumps"/*.sql 2>/dev/null | head -n 1 || true)"
  if [[ -n "$first" && -f "$first" ]]; then
    echo "$first"
    return
  fi
  first="$(ls -1 /var/www/dumps/*.sql 2>/dev/null | head -n 1 || true)"
  if [[ -n "$first" && -f "$first" ]]; then
    echo "$first"
    return
  fi
  echo ""
}

detect_mysql_service() {
  if [[ -n "${MYSQL_SERVICE:-}" ]]; then
    echo "${MYSQL_SERVICE}"
    return
  fi
  local services
  services="$(docker compose ps --services 2>/dev/null || true)"
  local name
  for name in migration-mysql api-mysql mysql db; do
    if echo "$services" | grep -qx "$name"; then
      echo "$name"
      return
    fi
  done
  # fallback: service whose name contains mysql
  name="$(echo "$services" | grep -i mysql | head -n 1 || true)"
  if [[ -n "$name" ]]; then
    echo "$name"
    return
  fi
  echo ""
}

MYSQL_SERVICE="$(detect_mysql_service)"
if [[ -z "$MYSQL_SERVICE" ]]; then
  echo "ERROR: no MySQL compose service found (tried migration-mysql, api-mysql, mysql)."
  echo "Set MYSQL_SERVICE=... and retry."
  exit 1
fi

DUMP="$(resolve_dump)"

mysql_root() {
  docker compose exec -T "$MYSQL_SERVICE" \
    mysql -uroot -p"$ROOT_PASS" --protocol=TCP "$@"
}

echo "==> MySQL service: $MYSQL_SERVICE"
echo "==> target DB: $TARGET | source DB: $SOURCE"

echo "==> ensure databases"
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

NEED_DUMP=0
if [[ "${TABLE_COUNT:-0}" == "0" ]]; then
  NEED_DUMP=1
fi
# dump may have been loaded into wrong DB name — no countries means reload
HAS_COUNTRIES="$(
  mysql_root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$SOURCE' AND table_name='countries'" \
    | tr -d '[:space:]'
)"
if [[ "${HAS_COUNTRIES:-0}" == "0" ]]; then
  NEED_DUMP=1
fi
if [[ "$FORCE_DUMP_RELOAD" == "1" ]]; then
  NEED_DUMP=1
fi

if [[ "$NEED_DUMP" == "1" ]]; then
  if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
    echo "ERROR: \`$SOURCE\` has no usable legacy tables (countries missing)."
    echo "Put the dump on the server and re-run:"
    echo "  LEGACY_DUMP_PATH=/var/www/dumps/didnegar-20260913-151630.sql sudo bash scripts/db-setup-prod.sh"
    exit 1
  fi

  echo "==> recreate $SOURCE and load dump: $DUMP"
  echo "    (rewrites USE/CREATE \`didnegar\` → \`$SOURCE\`)"
  mysql_root -e "DROP DATABASE IF EXISTS \`$SOURCE\`; CREATE DATABASE \`$SOURCE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON \`$SOURCE\`.* TO '$DB_USER'@'%'; FLUSH PRIVILEGES;"

  # Dump files often contain CREATE/USE \`didnegar\` — force into SOURCE_DATABASE
  sed -e "s/\`didnegar\`/\`${SOURCE}\`/g" "$DUMP" \
    | docker compose exec -T "$MYSQL_SERVICE" \
      mysql -uroot -p"$ROOT_PASS" --protocol=TCP "$SOURCE"

  HAS_COUNTRIES="$(
    mysql_root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$SOURCE' AND table_name='countries'" \
      | tr -d '[:space:]'
  )"
  if [[ "${HAS_COUNTRIES:-0}" == "0" ]]; then
    echo "ERROR: after dump load, \`$SOURCE\`.countries still missing."
    exit 1
  fi
  echo "==> dump OK ($SOURCE.countries present)"
else
  echo "==> $SOURCE already has tables (countries present) — skip dump load"
fi

echo "==> migrate + import + seed (inside $API_SERVICE)"
docker compose exec -T "$API_SERVICE" npm run db:setup:prod

echo "==> done"
