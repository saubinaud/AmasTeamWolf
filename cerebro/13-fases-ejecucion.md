# 13 — Fases de Ejecución

Actualizado: 2026-04-13

## Estado de avance

| Fase | Estado | Contenido | Commit |
|------|--------|-----------|--------|
| F1 | ✅ Completa | Tipos documento (DNI/CE/Pasaporte) + búsqueda normalizada | a12840d + 936462b |
| F2 | ✅ Completa | Info apoderado editable + barra progreso clases | 7e8eecc |
| F3 | ✅ Completa | Consulta pública asistencias (/consulta-asistencia) | 7e8eecc |
| F4 | ✅ Completa | Pagos parciales + historial + registrar pago manual | 0e9cb06 |
| F5 | ✅ Completa | Frecuencia semanal (1x/2x) | 7e8eecc |
| F6 | ✅ Completa | Código referido AMAS-XXXX + bono S/60 | 0e9cb06 |
| F7 | ✅ Completa | Módulo clases de prueba (embudo conversión) | acdfce4 |
| F8 | ✅ Completa | Módulo profesores (CRUD + asistencia) | 0e9cb06 |
| F9 | ✅ Completa | Graduaciones batch + elegibilidad Leadership/Fighter | acdfce4 |
| F10 | ✅ Completa | Catálogo implementos + precios automáticos | acdfce4 |
| F11 | ⏳ Pendiente | Pasarela Culqi (requiere cuenta Culqi con API keys) | — |
| F12 | ⏳ Pendiente | Torneos desde perfil | — |
| F13 | ⏳ Pendiente | QR único inteligente | — |
| F14 | 🔒 Bloqueada | Wolf Instructor, Fighter Wolf, contrato, cartillas (info David) | — |

## Fixes post-fases

| Fix | Commit | Descripción |
|-----|--------|-------------|
| Búsqueda rota | 086819a | Param SQL desfasados en space-alumnos.js |
| Input tipo doc | 086819a | Campos separados (select + input) |
| Frecuencia inventada | 086819a | "—" si null/default |
| Filtro por vencer | 086819a | Select 5/7/15/30 días + link desde dashboard |
| Heatmap dashboard | 2e9400b | Mapa calor asistencias 30 días |
| Asistencia profesores sidebar | 2e9400b | Nuevo módulo en grupo Asistencia |
| Entrega profesional | 106399f | Select dropdown + fecha editable |
| Login 500 | b73c6e1 | Columnas generadas no aplicadas en prod |
| Performance | 42e394f | Columnas generadas + 5 índices (REPLACE → norm) |
| Auditoría completa | 10cd5dc | 19 rutas backend LIMPIAS + 6 issues HIGH frontend |

## Ciclo de ejecución por fase

```
1. Implementar (sub-agentes en worktrees aislados si paralelo)
2. Build check (npm run build)
3. Sub-agente tester: SQL columns vs schema real
4. Sub-agente reviewer: optional chaining, error handling
5. Fix issues HIGH
6. Verificar migración BD con SELECT
7. Deploy backend (scp + restart)
8. Verificar health + login + logs
9. Push frontend (git push → Easypanel auto-build)
10. Commit con mensaje detallado
```
