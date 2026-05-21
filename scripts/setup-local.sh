#!/usr/bin/env bash
set -euo pipefail

# Setup local dev environment for AMAS Team Wolf
# Usage: bash scripts/setup-local.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP="$ROOT_DIR/database/backup_local.sql"
DB_PORT=5433
DB_USER=amas_user
DB_NAME=amas_database
DB_PASS=amas_local_2026

echo "=== AMAS Team Wolf — Local Dev Setup ==="

# 1. Start PostgreSQL
echo "[1/3] Starting PostgreSQL 17..."
cd "$ROOT_DIR"
docker compose up -d

# 2. Wait for readiness
echo "[2/3] Waiting for PostgreSQL..."
until docker compose exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  sleep 1
done
echo "       PostgreSQL ready."

# 3. Restore backup (strip \restrict line)
echo "[3/3] Restoring backup..."
sed '/^\\restrict/d' "$BACKUP" | \
  PGPASSWORD="$DB_PASS" psql -h localhost -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --quiet 2>&1 | \
  tail -1

echo ""
echo "=== Done! ==="
echo "  DB:  localhost:$DB_PORT ($DB_USER / $DB_PASS / $DB_NAME)"
echo "  API: cd api && cp .env.example .env  # edit DB_HOST=localhost DB_PORT=$DB_PORT DB_PASS=$DB_PASS"
echo "       npm run dev"
echo "  FE:  npm run dev"
