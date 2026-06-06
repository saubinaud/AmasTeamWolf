// ========== FERIADOS Y UTILIDADES DE FECHAS ==========

/** Feriado fijo (se repite cada año) */
export interface FeriadoFijo {
  mes: number;
  dia: number;
  nombre: string;
}

/** Feriado móvil (fecha específica por año) */
export interface FeriadoMovil {
  fecha: string;
  nombre: string;
}

/**
 * Feriados fijos de Perú - Feriados obligatorios no laborables según Decreto Legislativo 713
 * Fuente: https://gestion.pe/peru/feriados-2025-en-peru-conoce-los-dias-festivos-y-no-laborales-para-este-ano-noticia/
 */
export const FERIADOS_FIJOS_PERU: FeriadoFijo[] = [
  { mes: 1, dia: 1, nombre: "Año Nuevo" },
  { mes: 5, dia: 1, nombre: "Día del Trabajo" },
  { mes: 6, dia: 7, nombre: "Batalla de Arica y Día de la Bandera" },
  { mes: 6, dia: 29, nombre: "San Pedro y San Pablo" },
  { mes: 7, dia: 23, nombre: "Día de la Fuerza Aérea del Perú" },
  { mes: 7, dia: 28, nombre: "Fiestas Patrias - Independencia" },
  { mes: 7, dia: 29, nombre: "Fiestas Patrias" },
  { mes: 8, dia: 6, nombre: "Batalla de Junín" },
  { mes: 8, dia: 30, nombre: "Santa Rosa de Lima" },
  { mes: 10, dia: 8, nombre: "Combate de Angamos" },
  { mes: 11, dia: 1, nombre: "Todos los Santos" },
  { mes: 12, dia: 8, nombre: "Inmaculada Concepción" },
  { mes: 12, dia: 9, nombre: "Batalla de Ayacucho" },
  { mes: 12, dia: 25, nombre: "Navidad" }
];

/** Feriados móviles por año (Semana Santa, etc.) */
export const FERIADOS_MOVILES: Record<number, FeriadoMovil[]> = {
  2025: [
    { fecha: "2025-04-17", nombre: "Jueves Santo" },
    { fecha: "2025-04-18", nombre: "Viernes Santo" }
  ],
  2026: [
    { fecha: "2026-04-02", nombre: "Jueves Santo" },
    { fecha: "2026-04-03", nombre: "Viernes Santo" }
  ]
};

/** Verificar si una fecha es feriado (fijo o móvil) */
export function esFeriado(fecha: Date): boolean {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  const esFeriadoFijo = FERIADOS_FIJOS_PERU.some(f => f.mes === mes && f.dia === dia);
  if (esFeriadoFijo) return true;

  const fechaStr = fecha.toISOString().split('T')[0];
  const moviles = FERIADOS_MOVILES[anio] || [];
  return moviles.some(f => f.fecha === fechaStr);
}

/** Verificar si es cierre vacacional de AMAS (20 dic - 4 ene) */
export function esCierreVacacionalAMAS(fecha: Date): boolean {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  if (mes === 12 && dia >= 20) return true;
  if (mes === 1 && dia <= 4) return true;

  return false;
}

/** Verificar si una fecha es día hábil (no domingo, no feriado, no cierre vacacional) */
export function isDiaHabil(fecha: Date): boolean {
  const diaSemana = fecha.getDay();
  return diaSemana !== 0 && !esFeriado(fecha) && !esCierreVacacionalAMAS(fecha);
}
