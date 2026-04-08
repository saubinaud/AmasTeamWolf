# 09 — Deploy

## Frontend

Push a GitHub → Easypanel detecta y rebuilds automáticamente.

```bash
git add <archivos>
git commit -m "mensaje"
git push origin main
```

El build toma ~2 segundos. El deploy en Easypanel toma ~1-2 minutos después del push.

**Cuenta GitHub:** `saubinaud` (NO `saubinaud-UL`)
Para cambiar cuenta activa: `gh auth switch --user saubinaud`

## Backend

El API corre en un container Docker standalone (`amas-api`). No se rebuilds automáticamente con git push. Hay que copiar los archivos y reiniciar:

```bash
# Copiar un archivo al container
cat api/src/routes/ARCHIVO.js | sshpass -p 'Aubinaud919' ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no root@95.111.254.27 "docker exec -i amas-api tee /app/src/routes/ARCHIVO.js > /dev/null"

# Reiniciar el container
sshpass -p 'Aubinaud919' ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no root@95.111.254.27 "docker restart amas-api"
```

**Para múltiples archivos:**
```bash
for f in index.js db.js routes/asistencia.js routes/qr.js; do
  cat "api/src/$f" | sshpass -p 'Aubinaud919' ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no root@95.111.254.27 "docker exec -i amas-api tee /app/src/$f > /dev/null"
done
sshpass -p 'Aubinaud919' ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no root@95.111.254.27 "docker restart amas-api"
```

**Instalar dependencia nueva en el container:**
```bash
sshpass -p 'Aubinaud919' ssh ... root@95.111.254.27 "docker exec amas-api npm install PAQUETE"
```

## Base de datos

Ejecutar SQL en la BD:
```bash
sshpass -p 'Aubinaud919' ssh ... root@95.111.254.27 "docker exec pallium_amas-db.1.\$(docker service ps pallium_amas-db -q --no-trunc | head -1) psql -U amas_user -d amas_database -c \"SQL_AQUI\""
```

## Verificar deploy

- Frontend: abrir https://amasteamwolf.com y verificar cambios
- Backend: `curl https://amas-api.s6hx3x.easypanel.host/health`
- Logs: `docker logs amas-api --tail 20`
