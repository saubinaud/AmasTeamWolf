# Fase 4 — Colores, Inputs y Focus States

> Estado: Pendiente | Prioridad: ALTA

## Tareas

### 4.1 Reemplazar #FF6700 por #FA7B21
- TorneoPage.tsx — focus:border-[#FF6700] → focus:border-[#FA7B21]
- RegistroShowroomPage.tsx — focus:border-[#FF6700] y border-[#FF6700]

### 4.2 Estandarizar focus en todos los inputs
- Patrón: focus:border-[#FA7B21] focus:ring-4 focus:ring-[#FA7B21]/30
- FormularioMatricula, FormularioRenovacion, todos los formularios

### 4.3 Touch targets mínimo 44px
- CartDrawerHome.tsx: botones +/- cantidad (h-7 w-7 → h-11 w-11)
- PopupPago.tsx: botón cerrar (w-6 h-6 → mín 44px tap area)

### 4.4 active:scale-95 en TODOS los botones interactivos
- CartDrawerHome, FormularioMatricula, todos los que falten
