# ============================================
# AMAS Team Wolf - PostgreSQL Database
# ============================================
# Imagen base de PostgreSQL con scripts de inicialización
# Los scripts en /docker-entrypoint-initdb.d/ se ejecutan
# automáticamente la primera vez que se crea el contenedor
# ============================================

FROM postgres:16-alpine

# Variables de entorno (pueden sobrescribirse en EasyPanel)
ENV POSTGRES_DB=amas_database
ENV POSTGRES_USER=amas_user
ENV POSTGRES_PASSWORD=changeme_in_easypanel

# Copiar scripts de inicialización
# Se ejecutan en orden alfabético al crear la BD
COPY 01_schema.sql /docker-entrypoint-initdb.d/
COPY 02_views.sql /docker-entrypoint-initdb.d/

# Puerto estándar de PostgreSQL
EXPOSE 5432

# Volumen para persistencia de datos
VOLUME ["/var/lib/postgresql/data"]
