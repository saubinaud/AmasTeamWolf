# 17 — Menú desplegable de Space (sidebar)

## Cómo funciona

El sidebar de Space usa un sistema de **navegación con grupos desplegables** implementado en `src/components/space/SpaceLayout.tsx`.

## Estructura de datos

```typescript
// Ítem simple
interface NavItem {
  page: SpacePage;    // ID único de la página
  label: string;     // Texto visible
  icon: IconType;    // Ícono lucide-react
}

// Grupo desplegable (contiene hijos)
interface NavGroup {
  key: string;       // ID del grupo (ej: 'inscripciones-group')
  label: string;     // Texto del grupo
  icon: IconType;    // Ícono del grupo
  children: NavItem[]; // Páginas hijas
}

type NavEntry = NavItem | NavGroup;
```

## Configuración del menú

```typescript
const NAV: NavEntry[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'alumnos', label: 'Alumnos', icon: Users },
  {
    key: 'inscripciones-group',
    label: 'Inscripciones',
    icon: FileSignature,
    children: [
      { page: 'inscripciones', label: 'Inscritos', icon: ClipboardList },
      { page: 'inscribir', label: 'Inscribir', icon: Sparkles },
      { page: 'renovar', label: 'Renovar', icon: RefreshCw },
    ],
  },
  { page: 'graduaciones', label: 'Graduaciones', icon: GraduationCap },
  {
    key: 'asistencia-group',
    label: 'Asistencia',
    icon: CalendarCheck,
    children: [
      { page: 'asistencia', label: 'Reportes', icon: BarChart3 },
      { page: 'tomar-asistencia', label: 'Tomar asistencia', icon: QrCode },
      { page: 'asistencia-historica', label: 'Registrar pasadas', icon: History },
      { page: 'asistencia-profesores', label: 'Asistencia profesores', icon: UserCheck },
    ],
  },
  { page: 'leads', label: 'Leads', icon: UserPlus },
  // ... más ítems simples
];
```

## Lógica de permisos

```typescript
function puedeVer(user: SpaceUser, page: SpacePage): boolean {
  if (page === 'dashboard') return true;              // Dashboard siempre visible
  if (user.permisos === null || user.permisos === undefined) return true; // Admin = todo
  return user.permisos.includes(page);                // Profesor = solo lo permitido
}
```

- **Admin** (`permisos: null`): ve todo el menú completo
- **Profesor** (`permisos: ['tomar-asistencia', 'asistencia']`): ve solo Dashboard + las páginas en su array
- **Grupos**: se ocultan si ningún hijo es visible

## Auto-expand del grupo activo

```typescript
useEffect(() => {
  for (const entry of NAV) {
    if (isGroup(entry) && entry.children.some((c) => c.page === currentPage)) {
      setExpandedGroups((prev) => ({ ...prev, [entry.key]: true }));
    }
  }
}, [currentPage]);
```

Si la página activa está dentro de un grupo, ese grupo se expande automáticamente.

## Toggle manual

```typescript
const toggleGroup = (key: string) => {
  setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
};
```

Click en el header del grupo → toggle expand/collapse.

## Renderizado

- **Ítem simple**: botón con ícono + label + punto naranja si activo
- **Grupo**: botón con ícono + label + chevron rotado (90° si abierto)
- **Hijos del grupo**: indentados con `ml-3 pl-3 border-l border-stone-200`
- **Activo**: `bg-orange-50 text-stone-900 font-medium border border-stone-200`
- **Inactivo**: `text-stone-500 hover:text-stone-800 hover:bg-stone-50`

## Responsive

- **Desktop** (≥768px): sidebar fijo a la izquierda, 256px ancho
- **Mobile** (<768px): overlay con backdrop oscuro, se cierra al navegar o tocar fuera

## Cómo agregar un nuevo ítem al menú

1. Agregar la página al type `SpacePage` en `SpaceApp.tsx`
2. Agregar entrada en el array `NAV` en `SpaceLayout.tsx`
3. Agregar el título en `TITLES` record
4. Agregar el componente lazy en `SpaceApp.tsx`
5. Renderizar condicionalmente en el `<SpaceLayout>` children
6. Si necesita permisos: agregarlo a `PAGINAS_VALIDAS` en `space-config.js` (backend)
