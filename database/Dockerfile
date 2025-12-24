# ============================================
# AMAS Team Wolf - Migration Runner
# ============================================
FROM alpine:3.19

# Instalar PostgreSQL client
RUN apk add --no-cache postgresql-client bash

# Directorio de trabajo
WORKDIR /database

# Copiar scripts SQL
COPY 01_schema.sql .
COPY 02_views.sql .

# Script de ejecución
RUN echo '#!/bin/bash' > run.sh && \
    echo 'echo "Esperando PostgreSQL..."' >> run.sh && \
    echo 'until pg_isready -h pallium_amas-db -p 5432 -U amas_user; do sleep 2; done' >> run.sh && \
    echo 'echo "Ejecutando migraciones..."' >> run.sh && \
    echo 'psql "$DATABASE_URL" -f 01_schema.sql' >> run.sh && \
    echo 'psql "$DATABASE_URL" -f 02_views.sql' >> run.sh && \
    echo 'echo "Migraciones completadas"' >> run.sh && \
    echo 'tail -f /dev/null' >> run.sh && \
    chmod +x run.sh

CMD ["./run.sh"]
