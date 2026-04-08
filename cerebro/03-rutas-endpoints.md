# 03 — Rutas y Endpoints

## Frontend (páginas)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | HomePage | Landing principal |
| `/clase-prueba` | LandingConversion | Landing clase de prueba |
| `/leadership` | HomePage (sección) | Scroll a Leadership |
| `/registro-3-meses` | RegistroTresMesesPage | Matrícula 3 meses |
| `/registro-6-meses` | RegistroSeisMesesPage | Matrícula 6 meses |
| `/registro-mensual` | RegistroMensualPage | Matrícula mensual |
| `/registro-leadership` | RegistroLeadershipPage | Inscripción Leadership |
| `/tienda` | TiendaPage | Tienda de implementos |
| `/graduacion` | GraduacionPage | Graduaciones |
| `/torneo` | TorneoPage | Inscripción torneo |
| `/renovacion` | RenovacionPage | Renovación programa |
| `/renovacion-navidad` | RenovacionNavidadPage | Promo navideña |
| `/registro-showroom` | RegistroShowroomPage | Visita showroom |
| `/inicio-sesion` | InicioSesionPage | Login |
| `/callback` | LogtoCallback | OAuth callback Logto |
| `/perfil` | PerfilPage/PerfilDesktop | Perfil alumno |
| `/vincular-cuenta` | VincularCuentaPage | Vincular auth con alumno |
| `/terminos` | TerminosCondicionesPage | Términos y condiciones |
| `/asistencia` | AsistenciaPage | Registro asistencia (QR) |
| `/asistencia/panel` | AsistenciaPanelPage | Panel profesora |

## API Endpoints

### Asistencia
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/asistencia` | Registrar asistencia (dni + token QR) |
| GET | `/api/asistencia/hoy` | Asistencias de hoy (?token= para filtrar) |
| GET | `/api/asistencia/mensual/:alumnoId` | Resumen mensual |
| GET | `/api/asistencia/resumen-dia` | Agrupado por sesión QR |
| GET | `/api/asistencia/exportar` | CSV (?fecha=YYYY-MM-DD) |
| GET | `/api/asistencia/dashboard` | Stats mensuales (?mes=YYYY-MM) |

### QR
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/qr/generar` | Genera sesión QR (sede_id, hora_clase, programa) |
| GET | `/api/qr/validar/:token` | Valida token QR |
| GET | `/api/qr/activas` | Sesiones activas de hoy |

### Matrícula / Renovación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/matricula` | Nueva inscripción |
| POST | `/api/renovacion` | Renovar programa |
| POST | `/api/renovacion/navidad` | Promo navideña |

### Otros
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/leadership` | Inscripción Leadership |
| POST | `/api/perfil` | Obtener/vincular perfil |
| POST | `/api/vincular` | Buscar/vincular cuenta |
| POST | `/api/leads` | Crear lead |
| POST | `/api/leads/showroom` | Lead showroom |
| POST | `/api/contratos/generar` | Generar PDF contrato |
| POST | `/api/implementos` | Pedido implementos |
| GET | `/api/graduacion` | Lista graduaciones |
| GET | `/api/torneo/consultar?dni=` | Buscar alumno por DNI |
| POST | `/api/torneo` | Registrar torneo |
| GET | `/health` | Health check |
