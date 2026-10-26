> **OBSOLETO (oct-2026).** Copia antigua, no la usa el build de amas-web (`tsconfig` solo incluye `src/`). El contrato vigente lo sirve el API (`GET /api/contratos/texto`) y lo pinta `src/components/ContratoFirma.tsx`. No editar aquí.

# 📋 Formularios Academia - Template

Template completo y funcional del sistema de formularios de inscripción y renovación para academias. Incluye formularios de matrícula (leads) y renovación con toda la lógica de negocio.

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir en el navegador
# http://localhost:5173
```

## 📁 Estructura del Proyecto

```
src/
├── App.tsx                          # Página principal con navegación
├── main.tsx                         # Punto de entrada React
├── index.css                        # Estilos (Tailwind + custom)
├── components/
│   ├── FormularioMatricula.tsx       # Formulario de leads/inscripción
│   ├── FormularioRenovacion.tsx      # Formulario de renovación
│   ├── RegistroMensualPage.tsx       # Página programa 1 mes
│   ├── RegistroTresMesesPage.tsx     # Página programa 3 meses
│   ├── RegistroSeisMesesPage.tsx     # Página programa 6 meses
│   ├── RenovacionPage.tsx           # Página de renovación
│   └── ui/                          # Componentes UI (shadcn)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── sonner.tsx
│       └── utils.ts
├── hooks/
│   └── useUmami.ts                  # Analytics (opcional)
└── utils/
    └── matriculaHelpers.ts          # Funciones compartidas
```

## ⚠️ Qué Personalizar

### 1. Nombre y Marca
Busca y reemplaza en todos los archivos:
- `AMAS` → Nombre de tu academia
- `Wolf` → Tu marca
- `amasteamwolf.com` → Tu dominio

### 2. Color Principal
El color naranja `#FA7B21` se usa en todos los componentes. Para cambiarlo:
- Buscar y reemplazar `#FA7B21` en todos los `.tsx` y `.css`
- Buscar y reemplazar `FA7B21` (sin #) para variantes con opacidad
- También buscar `FCA929` que es el color secundario/dorado

### 3. Precios y Programas
En cada formulario, modifica las constantes al inicio del archivo:
- `PRECIOS_BASE` — Precios de cada programa
- `PROGRAMA_CLASES` — Número de clases por programa
- `NOMBRES_PROGRAMA` — Nombres mostrados al usuario
- `PLANES_INFO` — Información completa de planes (renovación)

### 4. Horarios por Edad
En la función `calcularHorarios()`, ajusta los rangos de edad y horarios según tu academia.

### 5. Códigos Promocionales
Modifica `CODIGOS_PROMOCIONALES` para agregar, quitar o cambiar los códigos de descuento.

### 6. Feriados
Actualiza `FERIADOS_FIJOS_PERU` y `FERIADOS_MOVILES` según tu país.

### 7. Cierre Vacacional
Modifica `esCierreVacacionalAMAS()` con las fechas de cierre de tu academia.

### 8. Webhooks (Envío de Datos)
En `FormularioMatricula.tsx`, busca `webhookUrl` y cambia las URLs:
```ts
const webhookUrl = 'https://TU-WEBHOOK-URL/formulario';
```
En `FormularioRenovacion.tsx`, busca igualmente `webhookUrl`.

### 9. Analytics (Opcional)
Si usas Umami u otro servicio de analytics, configura el script en `index.html`. El hook `useUmami.ts` es tolerante a fallos y no generará errores si no hay analytics configurado.

## 🏗️ Build para Producción

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`.

## 📦 Tecnologías

- **React 18** + TypeScript
- **Vite** (bundler)
- **Tailwind CSS** (estilos)
- **shadcn/ui** (componentes UI base)
- **Radix UI** (componentes accesibles)
- **Lucide React** (iconos)
- **Sonner** (notificaciones toast)
