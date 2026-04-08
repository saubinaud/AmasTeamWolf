# Prompt para nueva sesión de Claude Code

> Copia y pega esto al inicio de una nueva terminal de Claude Code en este proyecto.

---

Estás trabajando en **AMAS Team Wolf**, la web de una academia de artes marciales (taekwondo) en Lima, Perú. Es una SPA React + Express + PostgreSQL.

## Para entender el proyecto, lee en este orden:

1. `CLAUDE.md` — Reglas del proyecto (ya cargado automáticamente)
2. `cerebro/00-INICIO.md` — Índice del cerebro
3. `cerebro/01-proyecto.md` — Qué es, quién lo usa
4. `cerebro/02-arquitectura.md` — Stack, estructura de archivos
5. `cerebro/03-rutas-endpoints.md` — Todas las rutas y API endpoints

## Para tareas específicas, lee también:

- Si trabajas con **asistencia/QR**: lee `cerebro/05-horarios-asistencia.md`
- Si trabajas con **base de datos**: lee `cerebro/04-base-datos.md`
- Si necesitas **desplegar**: lee `cerebro/09-deploy.md`
- Si necesitas **accesos al servidor**: lee `cerebro/10-accesos.md` y el archivo local en `src/Accesos Servidor Pallium - Contabo VPS.md`
- Si quieres ver **qué ya se mejoró**: lee `cerebro/07-mejoras-realizadas.md`
- Si quieres ver **qué falta**: lee `cerebro/08-problemas-conocidos.md`
- Si quieres entender **por qué se tomó una decisión**: lee `cerebro/06-decisiones.md`

## Reglas clave:

- Los padres usan **Android gama baja**. Prioriza performance y UX mobile.
- El deploy del frontend es automático (push a main). El backend es manual (SSH + docker exec).
- La cuenta de GitHub es `saubinaud` (cambiar con `gh auth switch`).
- No crear archivos innecesarios. Editar existentes siempre que sea posible.
- Hacer commit y push cuando el usuario lo pida.
- Desplegar backend copiando archivos al container + restart.
