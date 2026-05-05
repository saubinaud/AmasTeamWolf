// ---------------------------------------------------------------------------
// Lógica compartida para Inscripción / Renovación en Space.
// Portada desde FormularioMatricula + FormularioRenovacion de la web pública.
// Mantiene paridad 1:1 con la web: mismos feriados, mismos precios,
// mismos horarios por edad, mismos códigos promocionales.
// ---------------------------------------------------------------------------

// ========== FERIADOS ==========

export const FERIADOS_FIJOS_PERU = [
  { mes: 1, dia: 1, nombre: 'Año Nuevo' },
  { mes: 5, dia: 1, nombre: 'Día del Trabajo' },
  { mes: 6, dia: 7, nombre: 'Batalla de Arica y Día de la Bandera' },
  { mes: 6, dia: 29, nombre: 'San Pedro y San Pablo' },
  { mes: 7, dia: 23, nombre: 'Día de la Fuerza Aérea del Perú' },
  { mes: 7, dia: 28, nombre: 'Fiestas Patrias - Independencia' },
  { mes: 7, dia: 29, nombre: 'Fiestas Patrias' },
  { mes: 8, dia: 6, nombre: 'Batalla de Junín' },
  { mes: 8, dia: 30, nombre: 'Santa Rosa de Lima' },
  { mes: 10, dia: 8, nombre: 'Combate de Angamos' },
  { mes: 11, dia: 1, nombre: 'Todos los Santos' },
  { mes: 12, dia: 8, nombre: 'Inmaculada Concepción' },
  { mes: 12, dia: 9, nombre: 'Batalla de Ayacucho' },
  { mes: 12, dia: 25, nombre: 'Navidad' },
];

export const FERIADOS_MOVILES: Record<number, Array<{ fecha: string; nombre: string }>> = {
  2025: [
    { fecha: '2025-04-17', nombre: 'Jueves Santo' },
    { fecha: '2025-04-18', nombre: 'Viernes Santo' },
  ],
  2026: [
    { fecha: '2026-04-02', nombre: 'Jueves Santo' },
    { fecha: '2026-04-03', nombre: 'Viernes Santo' },
  ],
};

// ========== PROGRAMAS ==========

export type ProgramaKey = '1mes' | 'full' | '6meses' | '12meses_sin' | '12meses_con';

export const PROGRAMA_CLASES: Record<ProgramaKey, number> = {
  '1mes': 8,
  full: 24,
  '6meses': 48,
  '12meses_sin': 96,
  '12meses_con': 96,
};

export const PRECIOS_BASE: Record<ProgramaKey, number> = {
  '1mes': 330,
  full: 869,
  '6meses': 1699,
  '12meses_sin': 2999,
  '12meses_con': 3699,
};

export const NOMBRES_PROGRAMA: Record<ProgramaKey, string> = {
  '1mes': '1 Mes',
  full: '3 Meses Full',
  '6meses': '6 Meses',
  '12meses_sin': '12 Meses Full (Sin Implementos)',
  '12meses_con': 'WOLF ELITE 365',
};

export const PROGRAMAS_INSCRIPCION: ProgramaKey[] = ['1mes', 'full', '6meses'];
export const PROGRAMAS_RENOVACION: ProgramaKey[] = ['full', '6meses', '12meses_sin', '12meses_con'];

// ========== TALLAS ==========

export const TALLAS_OPTIONS = ['2', '4', '6', '8', '10', '12', '14', 'S', 'M', 'L', 'XL'] as const;

// ========== PRECIOS POLOS ==========

export const PRECIOS_POLOS: Record<'0' | '1' | '2' | '3', number> = {
  '0': 0,
  '1': 60,
  '2': 110,
  '3': 150,
};

// ========== CÓDIGOS PROMOCIONALES ==========

export interface CodigoPromocional {
  tipo:
    | 'descuento_dinero'
    | 'descuento_porcentaje'
    | 'clases_extra'
    | 'mes_gratis'
    | 'polo_gratis'
    | 'uniforme_gratis'
    | 'desbloquear_1mes';
  valor: number;
  descripcion: string;
  programasAplicables: ProgramaKey[];
  activo: boolean;
}

export interface CodigoAplicado {
  valido: boolean;
  tipo?: CodigoPromocional['tipo'];
  valor?: number;
  descripcion?: string;
  codigo?: string;
  mensaje?: string;
}

export const CODIGOS_PROMOCIONALES: Record<string, CodigoPromocional> = {
  // Descuentos en dinero
  'AMAS-DESC10': { tipo: 'descuento_dinero', valor: 10, descripcion: 'Descuento de S/ 10', programasAplicables: ['1mes', 'full', '6meses'], activo: true },
  'AMAS-DESC20': { tipo: 'descuento_dinero', valor: 20, descripcion: 'Descuento de S/ 20', programasAplicables: ['1mes', 'full', '6meses'], activo: true },
  'AMAS-DESC50': { tipo: 'descuento_dinero', valor: 50, descripcion: 'Descuento de S/ 50', programasAplicables: ['1mes', 'full', '6meses', '12meses_sin', '12meses_con'], activo: true },
  'AMAS-DESC100': { tipo: 'descuento_dinero', valor: 100, descripcion: 'Descuento de S/ 100', programasAplicables: ['1mes', 'full', '6meses', '12meses_sin', '12meses_con'], activo: true },
  'AMAS-DESC150': { tipo: 'descuento_dinero', valor: 150, descripcion: 'Descuento de S/ 150', programasAplicables: ['full', '6meses'], activo: true },
  'AMAS-DESC200': { tipo: 'descuento_dinero', valor: 200, descripcion: 'Descuento de S/ 200', programasAplicables: ['full', '6meses'], activo: true },
  PRIMAVEZ: { tipo: 'descuento_dinero', valor: 80, descripcion: 'Descuento de S/ 80 para nuevos alumnos', programasAplicables: ['1mes', 'full', '6meses'], activo: true },

  // Descuentos porcentuales
  AMAS10OFF: { tipo: 'descuento_porcentaje', valor: 10, descripcion: '10% de descuento', programasAplicables: ['1mes', 'full', '6meses'], activo: true },
  AMAS15OFF: { tipo: 'descuento_porcentaje', valor: 15, descripcion: '15% de descuento', programasAplicables: ['1mes', 'full', '6meses', '12meses_sin', '12meses_con'], activo: true },
  AMAS20OFF: { tipo: 'descuento_porcentaje', valor: 20, descripcion: '20% de descuento', programasAplicables: ['full', '6meses'], activo: true },
  BLACKFRIDAY: { tipo: 'descuento_porcentaje', valor: 25, descripcion: '25% de descuento Black Friday', programasAplicables: ['1mes', 'full', '6meses'], activo: true },

  // Clases extra
  'AMAS-4CLASES': { tipo: 'clases_extra', valor: 4, descripcion: '+4 clases gratis', programasAplicables: ['1mes', 'full'], activo: true },
  'AMAS-8CLASES': { tipo: 'clases_extra', valor: 8, descripcion: '+8 clases gratis', programasAplicables: ['1mes', 'full'], activo: true },
  'AMAS-12CLASES': { tipo: 'clases_extra', valor: 12, descripcion: '+12 clases gratis', programasAplicables: ['full'], activo: true },

  // Mes gratis
  MESGRATIS: { tipo: 'mes_gratis', valor: 8, descripcion: '+1 mes gratis (8 clases)', programasAplicables: ['full'], activo: true },
  '2X1FINAL': { tipo: 'mes_gratis', valor: 16, descripcion: '+2 meses gratis (16 clases)', programasAplicables: ['full'], activo: true },

  // Polos y uniforme
  POLO1GRATIS: { tipo: 'polo_gratis', valor: 1, descripcion: '+1 polo oficial gratis (S/ 60)', programasAplicables: ['1mes', 'full', '6meses'], activo: true },
  POLO2GRATIS: { tipo: 'polo_gratis', valor: 2, descripcion: '+2 polos oficiales gratis (S/ 110)', programasAplicables: ['1mes', 'full'], activo: true },
  UNIFORMEGRATIS: { tipo: 'uniforme_gratis', valor: 220, descripcion: 'Uniforme completo gratis (S/ 220)', programasAplicables: ['1mes'], activo: true },

  // Familiares y referidos
  HERMANOS10: { tipo: 'descuento_dinero', valor: 100, descripcion: '100 soles de descuento por 1 hermano', programasAplicables: ['1mes', 'full'], activo: true },
  HERMANOS15: { tipo: 'descuento_dinero', valor: 150, descripcion: '150 soles de descuento por inscribir 2+ hermanos', programasAplicables: ['1mes', 'full'], activo: true },
  FAMILIAR20: { tipo: 'descuento_porcentaje', valor: 20, descripcion: '20% descuento familiar (3+ miembros)', programasAplicables: ['1mes', 'full'], activo: true },
  AMIGO50: { tipo: 'descuento_dinero', valor: 50, descripcion: 'S/ 50 descuento por referir a un amigo', programasAplicables: ['1mes', 'full'], activo: true },
  AMIGO100: { tipo: 'descuento_dinero', valor: 100, descripcion: 'S/ 100 descuento por referir 2+ amigos', programasAplicables: ['1mes', 'full'], activo: true },

  // Renovaciones
  RENUEVA100: { tipo: 'descuento_dinero', valor: 100, descripcion: 'S/ 100 descuento por renovación anticipada', programasAplicables: ['full', '6meses', '12meses_sin', '12meses_con'], activo: true },
  RENOVAR1MES: { tipo: 'desbloquear_1mes', valor: 0, descripcion: 'Desbloquea el programa de 1 mes', programasAplicables: ['1mes'], activo: true },
};

// ========== INTERFACES ==========

export interface HorariosInfo {
  horarioSemana: string;
  horarioSabado: string;
  horarioManana: string;
  diasSemana: string;
  categoria: string;
}

// ========== HELPERS ==========

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Obtener componentes de fecha en timezone Lima (evita desfase UTC)
function toLimaDate(d: Date): { year: number; month: number; day: number; weekday: number } {
  const parts = d.toLocaleDateString('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const [weekdayStr, dateStr] = parts.split(', ');
  const [m, day, y] = dateStr.split('/').map(Number);
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { year: y, month: m, day, weekday: weekdays[weekdayStr] ?? d.getDay() };
}

// Crear Date desde año/mes/día en Lima (sin desfase UTC)
export function dateFromLima(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0); // noon to avoid DST edge
}

// Parse ISO date string '2026-05-05' → Date en Lima (sin desfase UTC)
export function parseISOToLima(isoStr: string): Date {
  const [y, m, d] = isoStr.split('-').map(Number);
  return dateFromLima(y, m, d);
}

export function obtenerNombreDia(fecha: Date): string {
  const { weekday } = toLimaDate(fecha);
  return DIAS[weekday];
}

export function calcularHorarios(fechaNacimiento: string): HorariosInfo {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edadMeses = Math.floor((hoy.getTime() - nacimiento.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const edadAnios = Math.floor(edadMeses / 12);

  let horarioSemana = '';
  let horarioSabado = '';
  let horarioManana = '';
  let diasSemana = 'Lunes a Viernes';
  let categoria = '';

  if (edadMeses >= 11 && edadMeses <= 15) {
    horarioSemana = '3:00 PM';
    horarioSabado = '9:00 AM';
    horarioManana = '9:00 AM';
  } else if (edadMeses >= 16 && edadMeses <= 20) {
    horarioSemana = '3:30 PM';
    horarioSabado = '9:30 AM';
    horarioManana = '9:30 AM';
  } else if (edadMeses >= 21 && edadMeses <= 26) {
    horarioSemana = '4:00 PM';
    horarioSabado = '10:00 AM';
    horarioManana = '10:00 AM';
  } else if (edadMeses >= 27 && edadMeses <= 32) {
    horarioSemana = '4:30 PM';
    horarioSabado = '10:30 AM';
    horarioManana = '10:30 AM';
  } else if (edadMeses >= 33 && edadMeses <= 38) {
    horarioSemana = '5:00 PM';
    horarioSabado = '11:00 AM';
    horarioManana = '11:00 AM';
  } else if (edadMeses >= 39 && edadMeses <= 48) {
    horarioSemana = '5:30 PM';
    horarioSabado = '11:30 AM';
    horarioManana = '11:30 AM';
  } else if (edadMeses >= 49 && edadMeses <= 71) {
    horarioSemana = '6:00 PM';
    horarioSabado = '12:00 PM';
    horarioManana = '12:00 PM';
  } else if (edadAnios >= 6 && edadAnios <= 11) {
    horarioSemana = '6:30 PM';
    horarioSabado = '12:30 PM';
    horarioManana = '12:30 PM';
    diasSemana = 'Lunes, Miércoles y Viernes';
    categoria = 'Juniors';
  } else if (edadAnios >= 12 && edadAnios <= 17) {
    horarioSemana = '6:30 PM';
    horarioSabado = '1:30 PM';
    horarioManana = '1:30 PM';
    diasSemana = 'Martes y Jueves';
    categoria = 'Adolescentes';
  }

  return { horarioSemana, horarioSabado, horarioManana, diasSemana, categoria };
}

export function esFeriado(fecha: Date): boolean {
  const { year, month, day } = toLimaDate(fecha);

  const esFijo = FERIADOS_FIJOS_PERU.some((f) => f.mes === month && f.dia === day);
  if (esFijo) return true;

  const fechaStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const moviles = FERIADOS_MOVILES[year] || [];
  return moviles.some((f) => f.fecha === fechaStr);
}

export function esCierreVacacionalAMAS(fecha: Date): boolean {
  const { month, day } = toLimaDate(fecha);
  if (month === 12 && day >= 20) return true;
  if (month === 1 && day <= 4) return true;
  return false;
}

// Devuelve las próximas 5 fechas hábiles a partir de mañana (timezone Lima)
export function obtenerFechasDisponiblesInicio(): Date[] {
  const now = new Date();
  const { year, month, day } = toLimaDate(now);
  const fechas: Date[] = [];
  let contadas = 0;
  let cursorDay = day + 1;
  let cursorMonth = month;
  let cursorYear = year;

  while (contadas < 5) {
    // Advance month if needed
    const daysInMonth = new Date(cursorYear, cursorMonth, 0).getDate();
    if (cursorDay > daysInMonth) {
      cursorDay = 1;
      cursorMonth++;
      if (cursorMonth > 12) { cursorMonth = 1; cursorYear++; }
    }

    const cursor = dateFromLima(cursorYear, cursorMonth, cursorDay);
    const { weekday } = toLimaDate(cursor);

    if (weekday === 0 || esCierreVacacionalAMAS(cursor)) {
      cursorDay++;
      continue;
    }

    fechas.push(cursor);
    contadas++;
    cursorDay++;
  }

  return fechas;
}

export function diasPermitidosPorTurnoCategoria(
  turno: 'manana' | 'tarde',
  categoria: string,
): string[] {
  if (turno === 'manana') return ['Martes', 'Jueves', 'Sábado'];
  if (categoria === 'Juniors') return ['Lunes', 'Miércoles', 'Viernes'];
  if (categoria === 'Adolescentes') return ['Martes', 'Jueves'];
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
}

export interface CalculoFechaFin {
  fechaFin: Date;
  clasesTotales: number;
  semanasAproximadas: number;
}

export function calcularFechaFin(
  fechaInicio: Date,
  programa: ProgramaKey,
  diasTentativos: string[],
  clasesExtra: number = 0,
): CalculoFechaFin {
  const clasesTotales = PROGRAMA_CLASES[programa] + clasesExtra;
  const inicio = toLimaDate(fechaInicio);
  let cursorDay = inicio.day;
  let cursorMonth = inicio.month;
  let cursorYear = inicio.year;
  let clasesContadas = 1;

  while (clasesContadas < clasesTotales) {
    cursorDay++;
    const daysInMonth = new Date(cursorYear, cursorMonth, 0).getDate();
    if (cursorDay > daysInMonth) {
      cursorDay = 1;
      cursorMonth++;
      if (cursorMonth > 12) { cursorMonth = 1; cursorYear++; }
    }

    const cursor = dateFromLima(cursorYear, cursorMonth, cursorDay);
    const { weekday } = toLimaDate(cursor);

    if (weekday === 0) continue;
    if (esCierreVacacionalAMAS(cursor)) continue;

    const nombreDia = DIAS[weekday];
    if (diasTentativos.includes(nombreDia)) {
      if (esFeriado(cursor)) continue;
      clasesContadas++;
    }
  }

  const fechaFin = dateFromLima(cursorYear, cursorMonth, cursorDay);
  return {
    fechaFin,
    clasesTotales,
    semanasAproximadas: Math.ceil(
      (fechaFin.getTime() - fechaInicio.getTime()) / (7 * 24 * 60 * 60 * 1000),
    ),
  };
}

export function validarCodigoPromocional(
  codigo: string,
  programa: ProgramaKey,
): CodigoAplicado {
  const codigoUpper = codigo.toUpperCase().trim();
  const promo = CODIGOS_PROMOCIONALES[codigoUpper];

  if (!promo) return { valido: false, mensaje: 'Código no válido' };
  if (!promo.activo) return { valido: false, mensaje: 'Código inactivo' };
  if (!promo.programasAplicables.includes(programa)) {
    return { valido: false, mensaje: 'Este código no aplica al programa seleccionado' };
  }

  return {
    valido: true,
    tipo: promo.tipo,
    valor: promo.valor,
    descripcion: promo.descripcion,
    codigo: codigoUpper,
  };
}

export function obtenerClasesExtraDePromo(codigo: string): number {
  const promo = CODIGOS_PROMOCIONALES[codigo];
  if (!promo) return 0;
  if (promo.tipo === 'clases_extra') return promo.valor;
  if (promo.tipo === 'mes_gratis') return promo.valor;
  return 0;
}

export function formatearFechaLarga(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Lima',
    });
  } catch {
    return iso;
  }
}

export function toISODateString(d: Date): string {
  const { year, month, day } = toLimaDate(d);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
