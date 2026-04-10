# 03 — Rutas y Endpoints

## Frontend (páginas)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | HomePage | Landing principal |
| `/clase-prueba` | LandingConversion | Clase de prueba |
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
| `/inicio-sesion` | InicioSesionPage | Login DNI+password (JWT propio) |
| `/perfil` | PerfilPage/PerfilDesktop | Perfil apoderado + mensajes |
| `/vincular-cuenta` | VincularCuentaPage | Vincular con alumno |
| `/terminos` | TerminosCondicionesPage | Términos |
| `/asistencia` | AsistenciaPage | Registro asistencia (QR) |
| `/asistencia/panel` | AsistenciaPanelPage | Panel profesora |
| `/space` | SpaceLogin + SpaceApp | Panel administrativo (JWT Space) |

## API — Endpoints públicos (sin auth)

### Asistencia
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/asistencia` | Registrar (dni + token QR) |
| GET | `/api/asistencia/hoy` | Asistencias de hoy |
| GET | `/api/asistencia/mensual/:alumnoId` | Resumen mensual |
| GET | `/api/asistencia/resumen-dia` | Agrupado por QR |
| GET | `/api/asistencia/exportar` | CSV |
| GET | `/api/asistencia/dashboard` | Stats mes |

### QR, Matrícula, Renovación, Otros
Ver `api/src/routes/qr.js`, `matricula.js`, `renovacion.js`, `leadership.js`, `implementos.js`, `torneo.js`, `leads.js`, `graduacion.js`, `contratos.js`, `perfil.js`, `vincular.js`.

### Auth apoderados (JWT propio — reemplazo Logto)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro (nombre, dni, email, password) |
| POST | `/api/auth/login` | Login (dni + password) → JWT |
| POST | `/api/auth/verify-code` | Verificación email |
| POST | `/api/auth/recuperar` | Reset password |
| GET  | `/api/auth/perfil` | Carga perfil completo (asistencias, inscripciones, mensajes, pagos, contratos) |
| POST | `/api/auth/congelar` | Congelar inscripción |
| POST | `/api/auth/mensajes/:id/leido` | Marcar mensaje como leído |
| GET  | `/api/auth/contrato/:id/ver` | Ver PDF contrato |
| GET  | `/api/auth/contrato/:id/descargar` | Descargar PDF |

## API — Endpoints Space (requieren spaceAuth JWT)

Prefijo: `/api/space`. Middleware `spaceAuth` en todas (salvo `/auth`).

### Auth Space
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/space/auth/login` | Login Space (email + password) |
| GET  | `/api/space/auth/me` | Usuario actual |

### Dashboard
| GET | `/api/space/dashboard/stats` | Stats generales (alumnos, inscripciones, asistencias hoy, leads) |

### Alumnos
| GET    | `/api/space/alumnos` | Lista paginada (filtros: programa, estado, search) |
| GET    | `/api/space/alumnos/:id` | Detalle + inscripciones + asistencias + implementos |
| POST   | `/api/space/alumnos` | Crear |
| PUT    | `/api/space/alumnos/:id` | Editar |
| DELETE | `/api/space/alumnos/:id` | Soft delete |

### Inscripciones
| GET  | `/api/space/inscripciones` | Lista paginada (filtros) |
| GET  | `/api/space/inscripciones/vencimientos` | Próximas 7 días |
| GET  | `/api/space/inscripciones/:id` | Detalle + alumno + pagos + contratos |
| PUT  | `/api/space/inscripciones/:id` | Editar (allowedFields limitados) |

### Graduaciones
| GET    | `/api/space/graduaciones` | Lista |
| POST   | `/api/space/graduaciones` | Crear |
| PUT    | `/api/space/graduaciones/:id` | Editar |
| POST   | `/api/space/graduaciones/:id/aprobar` | Aprueba → actualiza cinturon_actual + inserta historial_cinturones |
| DELETE | `/api/space/graduaciones/:id` | Eliminar |
| GET    | `/api/space/graduaciones/cinturones` | Lista cinturones |
| GET    | `/api/space/graduaciones/correcciones` | Correcciones |

### Asistencia (6 endpoints)
| GET | `/api/space/asistencia/stats` | KPIs |
| GET | `/api/space/asistencia/hoy` | Hoy (date range + paginación) |
| GET | `/api/space/asistencia/por-fecha` | Por fecha específica |
| GET | `/api/space/asistencia/por-alumno/:id` | Historial alumno |
| GET | `/api/space/asistencia/exportar` | CSV |
| GET | `/api/space/asistencia/resumen-semanal` | Semana |

### Leads
| GET  | `/api/space/leads/stats` | KPIs |
| GET  | `/api/space/leads` | Lista (filtros por estado) |
| GET  | `/api/space/leads/embudo` | Embudo de conversión |
| GET  | `/api/space/leads/exportar` | CSV |
| PUT  | `/api/space/leads/:id` | Editar (incluye observaciones) |

### Config (solo admin — requireAdmin)
| GET/POST/PUT/DELETE | `/api/space/config/usuarios` | CRUD space_usuarios |
| PUT    | `/api/space/config/usuarios/:id/password` | Cambiar password |
| GET/POST/PUT/DELETE | `/api/space/config/sedes` | CRUD sedes |
| GET/POST/PUT/DELETE | `/api/space/config/horarios` | CRUD horarios |
| GET    | `/api/space/config/horarios/por-sede/:sedeId` | Horarios por sede |

### Mensajes
| GET    | `/api/space/mensajes` | Lista enviados (paginado, count leídos) |
| POST   | `/api/space/mensajes` | Enviar (tipo: difusion/programa/individual) |
| GET    | `/api/space/mensajes/:id` | Detalle + quién leyó |
| DELETE | `/api/space/mensajes/:id` | Eliminar |

### Compras (registro implementos)
| GET    | `/api/space/compras` | Lista |
| GET    | `/api/space/compras/stats` | KPIs |
| GET    | `/api/space/compras/armas-alumno/:id` | Armas del alumno (para modal graduación) |
| POST   | `/api/space/compras` | Registrar compra |
| PUT    | `/api/space/compras/:id` | Editar |
| DELETE | `/api/space/compras/:id` | Eliminar |
| GET    | `/api/space/compras/categorias` | Categorías (arma/uniforme/protector/polo) |

### Health
| GET | `/health` | Health check |
