# 01 — El Proyecto

## Qué es

AMAS Team Wolf es una **academia de artes marciales (taekwondo)** en Lima, Perú. La web es su plataforma digital para:
- Inscribir alumnos (matrícula de 1, 3 o 6 meses)
- Registrar asistencia por QR
- Vender implementos (uniformes, protectores, polos, armas)
- Gestionar renovaciones
- Registrar graduaciones (con historial de cinturones)
- Torneos
- Programa Leadership Wolf
- **Space**: panel administrativo completo (dashboard, alumnos, inscripciones, asistencia, leads, graduaciones, compras, mensajes, configuración)
- **Perfil del apoderado**: asistencias, progreso, pagos, contratos, mensajes del Space

## Quién la usa

- **Padres/apoderados** — Inscriben a sus hijos, pagan, ven asistencia, renuevan programas, reciben mensajes del Space. Usan celular (Android gama baja-media).
- **Profesoras** — Generan QR de asistencia, marcan asistencia manual, ven presentes por clase.
- **Sebastien (dueño)** — Administra todo desde Space. Tiene 2 academias: AMAS Team Wolf y Dragon Knight, mismo sistema.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + **Tailwind CSS v4.2.2 (dinámico, @tailwindcss/vite)** + Vite |
| Animaciones | motion/react (Framer Motion) |
| UI | shadcn/ui (Radix) + sonner + lucide-react + **React Portal (Modal.tsx)** |
| Backend | Express.js (Node.js) |
| Base de datos | PostgreSQL 17 |
| Auth público | **JWT propio (bcrypt + jsonwebtoken)** — DNI + password (ya NO Logto) |
| Auth Space | JWT propio con middleware `spaceAuth` + `requireAdmin` |
| Email | Notifuse (transaccional) |
| Archivos | **PDFs en BD (bytea) + disco (/opt/amas-contratos)** — ya NO Cloudinary |
| Analytics | Umami + Google Analytics 4 + Facebook Pixel |
| Hosting | Contabo VPS + Easypanel (Docker Swarm) |
| Deploy frontend | Push a GitHub → Easypanel auto-build |
| Deploy backend | SSH + scp + docker restart |

## Dominio

- Web: `https://amasteamwolf.com`
- API: `https://amas-api.s6hx3x.easypanel.host/api`
- Space: `https://amasteamwolf.com/space`
