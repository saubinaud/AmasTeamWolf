// Tokens de los formularios públicos (matrícula, renovación, Leadership).
// Marca JMA: naranja #F47B20, negro #231F20, Arial Black en títulos y cifras,
// Arial en el texto. Ningún hex suelto en los componentes: todo sale de aquí.

export const marca = {
  naranja: '#F47B20',
  naranjaOscuro: '#D9661A',
  negro: '#231F20',
} as const;

const display = "[font-family:'Arial_Black','Arial_Bold',Gadget,Arial,sans-serif]";
const texto = '[font-family:Arial,Helvetica,sans-serif]';

export const cx = {
  pagina: `min-h-screen bg-[#171415] text-white ${texto}`,
  contenedor: 'mx-auto w-full max-w-2xl px-4 sm:px-6',
  display,
  h1: `${display} text-[28px] leading-[1.1] sm:text-4xl text-white tracking-tight`,
  h2: `${display} text-lg sm:text-xl text-white`,
  cifra: `${display} tabular-nums`,

  textoSec: 'text-white/70',
  textoApagado: 'text-white/45',

  // Bloques: una tarjeta por sección, sin sombra
  card: 'rounded-2xl bg-[#231F20] border border-white/10',
  cardPad: 'p-4 sm:p-6',

  label: 'block text-[15px] font-bold text-white mb-2',
  ayuda: 'text-[13px] text-white/55 mt-1.5',
  input:
    'w-full h-12 rounded-xl bg-[#2E2829] border border-white/15 px-4 text-[16px] text-white placeholder:text-white/35 ' +
    'outline-none transition-colors duration-100 focus:border-[#F47B20]',

  // Opción tocable (chips, tarjetas de fecha, días)
  opcion:
    'min-h-[48px] rounded-xl border px-3 text-[15px] font-bold transition-colors duration-100 ' +
    'flex items-center justify-center text-center select-none',
  opcionOff: 'border-white/15 bg-[#2E2829] text-white/85 active:bg-white/10',
  opcionOn: 'border-[#F47B20] bg-[#F47B20]/15 text-white',
  opcionBloq: 'border-white/5 bg-transparent text-white/25 cursor-not-allowed',

  btnPrimario:
    `${display} h-14 rounded-xl bg-[#F47B20] px-6 text-[17px] text-[#231F20] transition-colors duration-100 ` +
    'active:bg-[#D9661A] hover:bg-[#FF8A30] disabled:bg-white/15 disabled:text-white/40 disabled:cursor-not-allowed ' +
    'flex items-center justify-center gap-2',
  btnSecundario:
    'h-12 rounded-xl border border-white/20 px-5 text-[15px] font-bold text-white transition-colors duration-100 ' +
    'hover:border-white/40 active:bg-white/10 disabled:text-white/30 disabled:border-white/10',
  btnTexto: 'min-h-[44px] px-2 text-[14px] font-bold text-[#F47B20] underline-offset-4 hover:underline',

  avisoOk: 'rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-[14px] text-emerald-200',
  avisoAmbar: 'rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-[14px] text-amber-100',
  avisoError: 'rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-[14px] text-rose-200',
  divisor: 'border-t border-white/10',
} as const;

/** Clases de una opción según su estado. */
export function claseOpcion(activa: boolean, bloqueada = false) {
  return `${cx.opcion} ${bloqueada ? cx.opcionBloq : activa ? cx.opcionOn : cx.opcionOff}`;
}
