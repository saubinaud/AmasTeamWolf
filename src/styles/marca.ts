// Estilos comunes de la web pública (portada, programas, clase de prueba,
// Leadership, tienda, graduaciones, torneo). Una sola fuente: si cambia el
// naranja o el botón principal, cambia aquí y en ningún otro lado.
//
// Marca: naranja #FA7B21 con su degradado a ámbar #FCA929 (los dos tonos del
// logo). La matrícula usa el mismo naranja desde components/matricula/tokens.ts.
//
// Las clases van escritas enteras (sin armar hex con ${}) para que Tailwind las
// encuentre al compilar.

export const marca = {
  naranja: '#FA7B21',
  ambar: '#FCA929',
  naranjaOscuro: '#E0661A',
  fondo: '#0A0705',
} as const;

/** Texto en tres niveles: principal, secundario y apagado. */
export const texto = {
  principal: 'text-white',
  secundario: 'text-white/70',
  apagado: 'text-white/45',
} as const;

const primario =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FA7B21] to-[#FCA929] ' +
  'font-semibold text-white shadow-lg shadow-[#FA7B21]/25 transition-[box-shadow,transform] duration-150 ' +
  'hover:shadow-[#FA7B21]/45 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCA929] focus-visible:ring-offset-2 focus-visible:ring-offset-black';

export const ui = {
  // Página y secciones
  pagina: 'min-h-screen bg-[#0A0705] text-white',
  contenedor: 'container mx-auto px-4',
  seccion: 'container mx-auto px-4 py-16 md:py-24',
  cabeceraSeccion: 'mx-auto mb-10 max-w-2xl text-center md:mb-14',

  // Títulos (frase normal, nunca Mayúscula En Cada Palabra)
  antetitulo: 'text-xs font-semibold uppercase tracking-[0.18em] text-[#FCA929]',
  h1: 'text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl',
  h2: 'text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl',
  h3: 'text-xl font-semibold leading-snug text-white',
  bajada: 'text-base leading-relaxed text-white/70 sm:text-lg',
  /** Una palabra del título con el degradado de la marca */
  resalte: 'bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent',

  // Botones: 48 px de alto (44 px los compactos), foco visible
  btnPrimary: `${primario} min-h-[48px] px-6 text-base`,
  btnPrimarySm: `${primario} min-h-[44px] px-4 text-sm`,
  btnSecondary:
    'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 px-6 text-base font-semibold text-white ' +
    'transition-colors duration-150 hover:border-white/35 hover:bg-white/[0.04] active:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 ' +
    'focus-visible:outline-none focus-visible:border-[#FCA929]',
  btnGhost:
    'inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-base font-medium text-[#FCA929] transition-colors duration-150 ' +
    'hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCA929]/60',
  /** Botón compacto dentro de una tarjeta pequeña (tienda): 44 px de alto */
  btnCompacto:
    'inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#FA7B21]/40 bg-[#FA7B21]/10 px-3 ' +
    'text-sm font-semibold text-white transition-colors duration-150 hover:border-[#FA7B21] hover:bg-[#FA7B21]/20 active:bg-[#FA7B21]/30 ' +
    'focus-visible:outline-none focus-visible:border-[#FCA929]',

  // Campos: label arriba; al enfocar, el borde toma el naranja
  label: 'mb-2 block text-sm font-medium text-white/80',
  ayuda: 'mt-1.5 text-sm text-white/45',
  error: 'mt-1.5 text-sm text-red-300',
  input:
    'w-full min-h-[48px] rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 ' +
    'outline-none transition-colors duration-150 focus:border-[#FA7B21] focus:bg-white/[0.06]',

  // Tarjetas: un solo borde sutil
  card: 'rounded-3xl border border-white/10 bg-white/[0.03]',
  cardChica: 'rounded-2xl border border-white/10 bg-white/[0.03]',
  cardDestacada: 'rounded-3xl bg-zinc-950 ring-1 ring-[#FA7B21]/60',
  cardPad: 'p-6 sm:p-8',

  // Chips y cintas
  chip: 'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-white/80',
  cinta: 'inline-flex items-center rounded-full bg-[#FA7B21] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white',
  /** Opción tocable (días, filtros) */
  opcion:
    'min-h-[48px] rounded-xl border px-3 text-sm font-medium transition-colors duration-150 flex items-center justify-center text-center select-none',
  opcionOff: 'border-white/10 bg-white/[0.03] text-white/75 hover:border-white/25',
  opcionOn: 'border-[#FCA929] bg-[#FA7B21]/15 text-white',

  // Detalles
  icono: 'text-[#FCA929]',
  enlace: 'text-white/60 transition-colors duration-150 hover:text-[#FCA929]',
  divisor: 'border-t border-white/10',
  esqueleto: 'animate-pulse rounded-3xl bg-white/5',
} as const;

/** Clases de una opción tocable según esté elegida o no. */
export const claseOpcion = (activa: boolean) => `${ui.opcion} ${activa ? ui.opcionOn : ui.opcionOff}`;
