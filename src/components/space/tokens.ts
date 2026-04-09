// ── SPACE Design Tokens v2 ──
// Inspired by the Profile page design language.
// Glassmorphism, gradients, depth layers, orange accent.

export const colors = {
  bg: {
    base: 'bg-[#0a0a0a]',
    raised: 'bg-zinc-900/80 backdrop-blur-sm',
    elevated: 'bg-zinc-800/60 backdrop-blur-sm',
    overlay: 'bg-black/60 backdrop-blur-sm',
    glass: 'bg-white/[0.03] backdrop-blur-xl',
  },
  border: {
    subtle: 'border-white/5',
    default: 'border-white/10',
    active: 'border-[#FA7B21]/40',
    glow: 'border-[#FA7B21]/20',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-white/60',
    muted: 'text-white/40',
    disabled: 'text-white/20',
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
  xl: 'rounded-3xl',
} as const;

export const cx = {
  // Buttons
  btnPrimary: 'px-4 py-2.5 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#E56D15] hover:to-[#FA7B21] text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-[#FA7B21]/20 hover:shadow-[#FA7B21]/30 active:scale-[0.98] disabled:opacity-50',
  btnSecondary: 'px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98]',
  btnGhost: 'px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 text-sm rounded-xl transition-all duration-200',
  btnDanger: 'px-3 py-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 text-sm rounded-xl transition-all duration-200',
  btnIcon: 'p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200',

  // Inputs
  input: 'w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FA7B21]/40 focus:ring-1 focus:ring-[#FA7B21]/20 focus:bg-white/[0.07] transition-all duration-200',
  select: 'w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FA7B21]/40 focus:ring-1 focus:ring-[#FA7B21]/20 transition-all duration-200 appearance-none',
  label: 'block text-white/40 text-xs font-medium mb-1.5 uppercase tracking-wider',

  // Cards
  card: 'bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl',
  cardHover: 'bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl hover:bg-zinc-900/80 hover:border-white/10 transition-all duration-200 cursor-pointer',
  cardGlow: 'bg-zinc-900/60 backdrop-blur-sm border border-[#FA7B21]/10 rounded-2xl shadow-lg shadow-[#FA7B21]/5',

  // Table
  th: 'px-4 py-3 text-left text-white/30 text-[10px] font-medium uppercase tracking-widest',
  td: 'px-4 py-3.5 text-sm',
  tr: 'border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors',

  // Badge / Pill
  badge: (color: string) => `inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${color}`,

  // Skeleton
  skeleton: 'bg-white/5 rounded-2xl animate-pulse',

  // Chip filter
  chip: (active: boolean) => active
    ? 'px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FA7B21]/15 text-[#FA7B21] border border-[#FA7B21]/20 transition-all duration-200'
    : 'px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/60 transition-all duration-200',
} as const;

export const badgeColors = {
  orange: 'bg-[#FA7B21]/10 text-[#FA7B21]',
  yellow: 'bg-amber-500/10 text-amber-400',
  green: 'bg-emerald-500/10 text-emerald-400',
  blue: 'bg-sky-500/10 text-sky-400',
  violet: 'bg-violet-500/10 text-violet-400',
  red: 'bg-red-500/10 text-red-400',
  gray: 'bg-white/5 text-white/40',
} as const;

// Stat card gradient presets
export const statGradients = {
  blue: { bg: 'from-sky-500/10 to-sky-500/5', border: 'border-sky-500/10', text: 'text-sky-400', icon: 'text-sky-400' },
  green: { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400' },
  orange: { bg: 'from-[#FA7B21]/10 to-[#FA7B21]/5', border: 'border-[#FA7B21]/10', text: 'text-[#FA7B21]', icon: 'text-[#FA7B21]' },
  violet: { bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/10', text: 'text-violet-400', icon: 'text-violet-400' },
} as const;
