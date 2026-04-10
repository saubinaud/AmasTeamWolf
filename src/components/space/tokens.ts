// ── SPACE Design Tokens v3 ──
// SOLID, OPAQUE, PROFESSIONAL — no transparency tricks.
// Every bg is fully opaque. Every border is visible.

export const colors = {
  bg: {
    base: 'bg-zinc-950',
    raised: 'bg-zinc-900',
    elevated: 'bg-zinc-800',
    overlay: 'bg-black/80',
  },
  border: {
    subtle: 'border-zinc-700',
    default: 'border-zinc-700',
    active: 'border-[#FA7B21]',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-zinc-400',
    muted: 'text-zinc-500',
    disabled: 'text-zinc-600',
    accent: 'text-[#FA7B21]',
    error: 'text-red-400',
    success: 'text-emerald-400',
  },
  accent: '#FA7B21',
  accentHover: '#E56D15',
  accentBg: 'bg-[#FA7B21]',
  accentBgHover: 'hover:bg-[#E56D15]',
  accentBgLight: 'bg-[#FA7B21]/10',
} as const;

export const spacing = {
  page: 'p-4 sm:p-5 lg:p-6',
  card: 'p-4 sm:p-5',
  section: 'space-y-4',
  sectionLg: 'space-y-6',
} as const;

export const radius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
} as const;

export const cx = {
  // Buttons
  btnPrimary: 'px-4 py-2.5 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#E56D15] hover:to-[#FA7B21] text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-[#FA7B21]/20 active:scale-[0.98] disabled:opacity-50',
  btnSecondary: 'px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98]',
  btnGhost: 'px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm rounded-xl transition-all duration-200',
  btnDanger: 'px-3 py-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-sm rounded-xl transition-all duration-200',
  btnIcon: 'p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all duration-200',

  // Inputs — SOLID backgrounds
  input: 'w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FA7B21] focus:ring-1 focus:ring-[#FA7B21]/30 transition-all duration-200',
  select: 'w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FA7B21] focus:ring-1 focus:ring-[#FA7B21]/30 transition-all duration-200 appearance-none',
  label: 'block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider',

  // Cards — SOLID backgrounds
  card: 'bg-zinc-900 border border-zinc-700 rounded-2xl',
  cardHover: 'bg-zinc-900 border border-zinc-700 rounded-2xl hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 cursor-pointer',
  cardGlow: 'bg-zinc-900 border border-[#FA7B21]/20 rounded-2xl shadow-lg shadow-[#FA7B21]/5',

  // Table — visible borders, proper spacing
  th: 'px-4 py-3 text-left text-zinc-500 text-[10px] font-semibold uppercase tracking-widest',
  td: 'px-4 py-3.5 text-sm',
  tr: 'border-b border-zinc-700 last:border-0 hover:bg-zinc-800/50 transition-colors',

  // Badge / Pill
  badge: (color: string) => `inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${color}`,

  // Skeleton — visible
  skeleton: 'bg-zinc-800 rounded-2xl animate-pulse',

  // Chip filter — SOLID backgrounds
  chip: (active: boolean) => active
    ? 'px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FA7B21]/15 text-[#FA7B21] border border-[#FA7B21]/30 transition-all duration-200'
    : 'px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300 transition-all duration-200',
} as const;

export const badgeColors = {
  orange: 'bg-[#FA7B21]/15 text-[#FA7B21]',
  yellow: 'bg-amber-500/15 text-amber-400',
  green: 'bg-emerald-500/15 text-emerald-400',
  blue: 'bg-sky-500/15 text-sky-400',
  violet: 'bg-violet-500/15 text-violet-400',
  red: 'bg-red-500/15 text-red-400',
  gray: 'bg-zinc-800 text-zinc-400',
} as const;

export const statGradients = {
  blue: { bg: 'from-sky-500/15 to-sky-500/5', border: 'border-sky-500/20', text: 'text-sky-400', icon: 'text-sky-400' },
  green: { bg: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400' },
  orange: { bg: 'from-[#FA7B21]/15 to-[#FA7B21]/5', border: 'border-[#FA7B21]/20', text: 'text-[#FA7B21]', icon: 'text-[#FA7B21]' },
  violet: { bg: 'from-violet-500/15 to-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400', icon: 'text-violet-400' },
} as const;
