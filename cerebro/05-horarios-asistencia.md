# 05 — Sistema de Asistencia y Horarios

## Flujo de asistencia

```
Profesora abre panel → selecciona clase del día → genera QR
                                                      ↓
                                              Token UUID en BD
                                                      ↓
                                    Link: amasteamwolf.com/asistencia?token=UUID
                                                      ↓
                              Padre escanea QR → ingresa DNI → asistencia registrada
```

## Horarios por día

Los horarios están hardcodeados en `AsistenciaPanelPage.tsx` (constante `HORARIOS`).

### Lunes, Miércoles, Viernes
| Hora | Programa |
|------|----------|
| 3:30 PM | Súper Baby Wolf |
| 4:00 PM | Baby Wolf |
| 4:30 PM | Baby Wolf |
| 5:00 PM | Little Wolf |
| 5:30 PM | Little Wolf |
| 6:00 PM | Little Wolf |
| 6:30 PM | Junior Wolf |

### Martes, Jueves
| Hora | Programa |
|------|----------|
| 3:00 PM | Súper Baby Wolf |
| 3:30 PM | Súper Baby Wolf |
| 4:00 PM | Baby Wolf |
| 4:30 PM | Baby Wolf |
| 5:00 PM | Little Wolf |
| 5:30 PM | Little Wolf |
| 6:00 PM | Little Wolf |
| 6:30 PM | Adolescentes Wolf |

### Sábado
| Hora | Programa |
|------|----------|
| 9:30 AM | Súper Baby Wolf |
| 10:00 AM | Baby Wolf |
| 11:00 AM | Baby Wolf |
| 11:30 AM | Little Wolf |
| 12:00 PM | Little Wolf |
| 12:30 PM | Junior Wolf |
| 1:30 PM | Adolescentes Wolf |

## Panel de la profesora

URL: `https://amasteamwolf.com/asistencia/panel`
PIN: `2026`

### Funcionalidades
- **Selector de clase**: muestra clases del día según día de la semana
- **Auto-detección**: pre-selecciona la clase actual/próxima
- **Multi-sesión QR**: cada clase tiene su propio QR independiente
- **Registro manual**: DNI directo para padres sin QR
- **Alertas pocas clases**: notifica cuando alumno tiene ≤3 clases
- **Countdown QR**: temporizador de expiración (2 horas)
- **Modo proyector**: QR grande para TV/tablet
- **Resumen del día**: asistencias agrupadas por clase
- **Dashboard mensual**: stats por programa, día, top alumnos
- **Exportar CSV**: descarga asistencias del día

## Colores por programa

| Programa | Color |
|----------|-------|
| Súper Baby Wolf | Rosa (pink-500) |
| Baby Wolf | Celeste (sky-500) |
| Little Wolf | Verde (emerald-500) |
| Junior Wolf | Ámbar (amber-500) |
| Adolescentes Wolf | Violeta (violet-500) |
