// ── SPACE Design Tokens v4 — NODUM Light ──
// Apple purposeful minimalism + Airbnb clean spacing + Seiko Presage deep colors.
// Body: #f7f7f7 | Cards: white | Text: stone | Accent: coral via CSS var.

export const colors = {
  bg: {
    base: 'bg-[#f7f7f7]',
    raised: 'bg-white',
    elevated: 'bg-stone-50',
    overlay: 'bg-black/40',
  },
  border: {
    subtle: 'border-stone-100',
    default: 'border-stone-200',
    active: 'border-[var(--accent)]',
  },
  text: {
    primary: 'text-stone-900',
    secondary: 'text-stone-500',
    muted: 'text-stone-400',
    disabled: 'text-stone-300',
    accent: 'text-[var(--accent)]',
    error: 'text-rose-600',
    success: 'text-teal-700',
  },
  accent: 'var(--accent)',
  accentHover: 'var(--accent-hover)',
  accentBg: 'bg-[var(--accent)]',
  accentBgHover: 'hover:bg-[var(--accent-hover)]',
  accentBgLight: 'bg-[var(--accent-light)]',
} as const;

export const spacing = {
  page: 'p-5 lg:p-8',
  card: 'p-5 sm:p-6',
  section: 'space-y-4',
  sectionLg: 'space-y-6',
} as const;

export const radius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
} as const;

export const cx = {
  // Buttons — no shadows, no gradients, solid accent
  btnPrimary: 'px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-lg transition-colors active:scale-[0.98] disabled:opacity-50',
  btnSecondary: 'px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-sm font-semibold rounded-lg transition-colors active:scale-[0.98]',
  btnGhost: 'px-3 py-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 text-sm font-medium rounded-lg transition-colors',
  btnDanger: 'px-3 py-2 text-rose-600 hover:bg-rose-50 text-sm font-medium rounded-lg transition-colors',
  btnIcon: 'p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors',

  // Inputs — white bg, stone borders, darken on focus (no color ring)
  input: 'w-full px-4 py-2.5 bg-white border border-stone-300 rounded-lg text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:border-stone-500 transition-colors',
  select: 'w-full px-4 py-2.5 bg-white border border-stone-300 rounded-lg text-stone-800 text-sm focus:outline-none focus:border-stone-500 transition-colors appearance-none',
  label: 'block text-stone-500 text-xs font-semibold mb-1.5 tracking-wide',

  // Cards — white, subtle border, no shadow (shadow on hover only)
  card: 'bg-white border border-stone-200 rounded-xl',
  cardHover: 'bg-white border border-stone-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer',
  cardGlow: 'bg-white border border-[var(--accent)]/20 rounded-xl',

  // Table — thin borders, stone tones
  th: 'px-4 py-3 text-left text-stone-400 text-[11px] font-semibold uppercase tracking-wider',
  td: 'px-4 py-3.5 text-sm',
  tr: 'border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors',

  // Badge / Pill
  badge: (color: string) => `inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${color}`,

  // Skeleton
  skeleton: 'bg-stone-100 rounded-xl animate-pulse',

  // Chip filter
  chip: (active: boolean) => active
    ? 'px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20 transition-colors'
    : 'px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-stone-500 border border-stone-300 hover:bg-stone-50 hover:text-stone-700 transition-colors',
} as const;

export const badgeColors = {
  orange: 'bg-orange-50 text-orange-600',
  yellow: 'bg-amber-50 text-amber-600',
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
  red: 'bg-rose-50 text-rose-600',
  gray: 'bg-stone-100 text-stone-500',
} as const;

export const statGradients = {
  blue: { bg: 'from-sky-50 to-white', border: 'border-sky-100', text: 'text-sky-700', icon: 'text-sky-500' },
  green: { bg: 'from-emerald-50 to-white', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500' },
  orange: { bg: 'from-orange-50 to-white', border: 'border-orange-100', text: 'text-orange-700', icon: 'text-orange-500' },
  violet: { bg: 'from-violet-50 to-white', border: 'border-violet-100', text: 'text-violet-700', icon: 'text-violet-500' },
} as const;
