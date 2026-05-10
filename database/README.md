# Database Schema — AMAS Team Wolf

## Source of Truth

The file `01_schema.sql` is **exported from production** via:
```bash
docker exec ccb9fe12b17b pg_dump -U amas_user -d amas_database --schema-only --no-owner --no-privileges > 01_schema.sql
```

**DO NOT** use this file to create a fresh database directly — it may have dependency ordering issues with generated columns that require the `unaccent` extension.

## Fresh Deploy

To restore from backup:
```bash
# 1. Create extension (requires superuser)
psql -U amas_user -d amas_database -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
psql -U amas_user -d amas_database -c "CREATE OR REPLACE FUNCTION public.unaccent_immutable(text) RETURNS text AS \$\$ SELECT public.unaccent(\$1); \$\$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;"

# 2. Restore from backup
gunzip -c /opt/backups/postgres/pallium_amas-db_LATEST.sql.gz | psql -U amas_user -d amas_database
```

## Schema Changes

Apply changes directly via SSH + psql:
```bash
sshpass -p 'PASSWORD' ssh root@95.111.254.27 "docker exec ccb9fe12b17b psql -U amas_user -d amas_database -c 'ALTER TABLE ...'"
```

After changes, re-export `01_schema.sql` to keep it current.

See `cerebro/09-deploy.md` for full deploy instructions.
