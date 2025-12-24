# ============================================
# AMAS Team Wolf - Migration Runner
# ============================================
# Contenedor ligero para ejecutar migraciones SQL
# ============================================

FROM alpine:3.19

# Instalar PostgreSQL client
RUN apk add --no-cache postgresql-client bash

# Crear directorio de trabajo
WORKDIR /migrations

# Copiar scripts SQL
COPY database/01_schema.sql .
COPY database/02_views.sql .

# Script de ejecución
COPY <<'EOF' /migrations/run.sh
#!/bin/bash
echo "Esperando a que PostgreSQL esté listo..."
until pg_isready -h pallium_amas-db -p 5432 -U amas_user; do
  sleep 2
done

echo "Ejecutando migraciones..."
psql "$DATABASE_URL" -f /migrations/01_schema.sql
psql "$DATABASE_URL" -f /migrations/02_views.sql
echo "Migraciones completadas"

# Mantener el contenedor vivo
tail -f /dev/null
EOF

RUN chmod +x /migrations/run.sh

CMD ["/migrations/run.sh"]
