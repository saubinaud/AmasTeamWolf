# 01 — El Proyecto

## Qué es

AMAS Team Wolf es una **academia de artes marciales (taekwondo)** en Lima, Perú. La web es su plataforma digital para:
- Inscribir alumnos (matrícula de 1, 3 o 6 meses)
- Registrar asistencia por QR
- Vender implementos (uniformes, protectores)
- Gestionar renovaciones
- Registrar graduaciones
- Torneos
- Programa Leadership Wolf

## Quién la usa

- **Padres/apoderados** — Inscriben a sus hijos, pagan, ven asistencia, renuevan programas. Usan celular (Android gama baja-media, principalmente).
- **Profesoras** — Generan QR de asistencia, marcan asistencia manual, ven presentes por clase. Usan celular o tablet.
- **Sebastien (dueño)** — Administra todo. Tiene 2 academias: AMAS Team Wolf y Dragon Knight. Ambas comparten el mismo sistema.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS v4 + Vite |
| Animaciones | motion/react (Framer Motion) |
| UI | shadcn/ui (Radix) + sonner (toasts) + lucide-react (íconos) |
| Backend | Express.js (Node.js) |
| Base de datos | PostgreSQL 17 |
| Auth | Logto (auth.nodumstudio.com) |
| Email | Notifuse (transaccional) |
| Archivos | Cloudinary (PDFs, imágenes) |
| Analytics | Umami + Google Analytics 4 + Facebook Pixel |
| Hosting | Contabo VPS + Easypanel (Docker Swarm) |
| Deploy frontend | Push a GitHub → Easypanel auto-build |
| Deploy backend | SSH al servidor → docker exec + restart |

## Dominio

- Web: `https://amasteamwolf.com`
- API: `https://amas-api.s6hx3x.easypanel.host/api`
