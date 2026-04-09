// ── SPACE Design Tokens ──
// Single source of truth for all design values.
// Import and use these instead of hardcoding classes.

export const colors = {
  // Surfaces (layered depth)
  bg: {
    base: 'bg-zinc-950',        // page background
    raised: 'bg-zinc-900',      // cards, sidebar, modals
    elevated: 'bg-zinc-800',    // active items, hover states, inputs
    overlay: 'bg-black/50',     // modal/sidebar overlay
  },
  // Borders
  border: {
    subtle: 'border-zinc-800',
    default: 'border-zinc-700',
    active: 'border-[#FA7B21]',
  },
  // Text
  text: {
    primary: 'text-white',
    secondary: 'text-white/60',
    muted: 'text-white/40',
    disabled: 'text-white/20',
    accent: 'text-[#FA7B21]',
    error: 'text-red-400',
    success: 'text-emerald-400',
  },
  // Accent
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

// Reusable class strings
export const cx = {
  // Buttons
  btnPrimary: 'px-4 py-2.5 bg-[#FA7B21] hover:bg-[#E56D15] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50',
  btnSecondary: 'px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors',
  btnGhost: 'px-3 py-2 text-white/50 hover:text-white hover:bg-zinc-800 text-sm rounded-lg transition-colors',
  btnDanger: 'px-3 py-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/5 text-sm rounded-lg transition-colors',
  btnIcon: 'p-2 text-white/40 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors',

  // Inputs
  input: 'w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FA7B21] focus:ring-1 focus:ring-[#FA7B21]/20 transition-colors',
  select: 'w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#FA7B21] focus:ring-1 focus:ring-[#FA7B21]/20 transition-colors appearance-none',
  label: 'block text-white/50 text-xs font-medium mb-1.5',

  // Cards
  card: 'bg-zinc-900 rounded-xl',
  cardHover: 'bg-zinc-900 rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer',

  // Table
  th: 'px-4 py-3 text-left text-white/40 text-xs font-medium uppercase tracking-wider',
  td: 'px-4 py-3 text-sm',
  tr: 'border-b border-zinc-800/50 last:border-0',

  // Badge / Pill
  badge: (color: string) => `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`,

  // Skeleton
  skeleton: 'bg-zinc-800 rounded animate-pulse',
} as const;

// Badge color presets
export const badgeColors = {
  orange: 'bg-[#FA7B21]/10 text-[#FA7B21]',
  yellow: 'bg-yellow-500/10 text-yellow-400',
  green: 'bg-emerald-500/10 text-emerald-400',
  blue: 'bg-blue-500/10 text-blue-400',
  violet: 'bg-violet-500/10 text-violet-400',
  red: 'bg-red-500/10 text-red-400',
  gray: 'bg-zinc-800 text-white/50',
} as const;
