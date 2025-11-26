// ========== CONSTANTES ==========

// Feriados fijos de Perú
export const FERIADOS_FIJOS_PERU = [
  { mes: 1, dia: 1, nombre: "Año Nuevo" },
  { mes: 5, dia: 1, nombre: "Día del Trabajo" },
  { mes: 6, dia: 29, nombre: "San Pedro y San Pablo" },
  { mes: 7, dia: 28, nombre: "Fiestas Patrias" },
  { mes: 7, dia: 29, nombre: "Fiestas Patrias" },
  { mes: 8, dia: 30, nombre: "Santa Rosa de Lima" },
  { mes: 10, dia: 8, nombre: "Combate de Angamos" },
  { mes: 11, dia: 1, nombre: "Todos los Santos" },
  { mes: 12, dia: 8, nombre: "Inmaculada Concepción" },
  { mes: 12, dia: 25, nombre: "Navidad" }
];

// Feriados móviles por año
export const FERIADOS_MOVILES: Record<number, Array<{ fecha: string; nombre: string }>> = {
  2025: [
    { fecha: "2025-04-17", nombre: "Jueves Santo" },
    { fecha: "2025-04-18", nombre: "Viernes Santo" }
  ],
  2026: [
    { fecha: "2026-04-02", nombre: "Jueves Santo" },
    { fecha: "2026-04-03", nombre: "Viernes Santo" }
  ]
};

// Clases por programa
export const PROGRAMA_CLASES: Record<string, number> = {
  "1mes": 8,
  "full": 24 // 3 meses
};

// Precios base por programa
export const PRECIOS_BASE: Record<string, number> = {
  "1mes": 330,
  "full": 869
};

// Nombres de programas
export const NOMBRES_PROGRAMA: Record<string, string> = {
  "1mes": "Programa 1 Mes",
  "full": "Programa 3 Meses FULL"
};

// Códigos promocionales
export interface CodigoPromocional {
  tipo: 'descuento_dinero' | 'clases_extra' | 'mes_gratis' | 'polo_gratis';
  valor: number;
  descripcion: string;
  programasAplicables: string[];
  activo: boolean;
}

export const CODIGOS_PROMOCIONALES: Record<string, CodigoPromocional> = {
  "AMAS-DESC100-2025": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "Descuento de S/ 100",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "AMAS-DESC150-2025": {
    tipo: "descuento_dinero",
    valor: 150,
    descripcion: "Descuento de S/ 150",
    programasAplicables: ["full"],
    activo: true
  },
  "AMAS-4CLASES-2025": {
    tipo: "clases_extra",
    valor: 4,
    descripcion: "+4 clases gratis",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "AMAS-MESGRATIS-2025": {
    tipo: "mes_gratis",
    valor: 8,
    descripcion: "+1 mes gratis (8 clases)",
    programasAplicables: ["full"],
    activo: true
  },
  "AMAS-POLO-2025": {
    tipo: "polo_gratis",
    valor: 1,
    descripcion: "+1 polo oficial gratis",
    programasAplicables: ["1mes", "full"],
    activo: true
  }
};

// ========== INTERFACES ==========

export interface HorariosInfo {
  horarioSemana: string;
  horarioSabado: string;
  diasSemana: string;
  categoria: string;
}

export interface CodigoAplicado {
  valido: boolean;
  tipo?: 'descuento_dinero' | 'clases_extra' | 'mes_gratis' | 'polo_gratis';
  valor?: number;
  descripcion?: string;
  codigo?: string;
  mensaje?: string;
}

// ========== FUNCIONES AUXILIARES ==========

// Calcular horarios según edad
export function calcularHorarios(fechaNacimiento: string): HorariosInfo {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edadMeses = Math.floor((hoy.getTime() - nacimiento.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const edadAnios = Math.floor(edadMeses / 12);

  let horarioSemana = "";
  let horarioSabado = "";
  let diasSemana = "Lunes a Viernes";
  let categoria = "";

  if (edadMeses >= 11 && edadMeses <= 15) {
    horarioSemana = "3:00 PM";
    horarioSabado = "9:00 AM";
  } else if (edadMeses >= 16 && edadMeses <= 20) {
    horarioSemana = "3:30 PM";
    horarioSabado = "9:30 AM";
  } else if (edadMeses >= 21 && edadMeses <= 26) {
    horarioSemana = "4:00 PM";
    horarioSabado = "10:00 AM";
  } else if (edadMeses >= 27 && edadMeses <= 32) {
    horarioSemana = "4:30 PM";
    horarioSabado = "10:30 AM";
  } else if (edadMeses >= 33 && edadMeses <= 38) {
    horarioSemana = "5:00 PM";
    horarioSabado = "11:00 AM";
  } else if (edadMeses >= 39 && edadMeses <= 48) {
    horarioSemana = "5:30 PM";
    horarioSabado = "11:30 AM";
  } else if (edadMeses >= 49 && edadMeses <= 71) {
    horarioSemana = "6:00 PM";
    horarioSabado = "12:00 PM";
  } else if (edadAnios >= 6 && edadAnios <= 11) {
    horarioSemana = "6:30 PM";
    horarioSabado = "12:30 PM";
    diasSemana = "Lunes, Miércoles y Viernes";
    categoria = "Juniors";
  } else if (edadAnios >= 12 && edadAnios <= 17) {
    horarioSemana = "6:30 PM";
    horarioSabado = "1:30 PM";
    diasSemana = "Martes y Jueves";
    categoria = "Adolescentes";
  } else {
    horarioSemana = "Por definir";
    horarioSabado = "Por definir";
    diasSemana = "Consultar en academia";
  }

  return {
    horarioSemana,
    horarioSabado,
    diasSemana,
    categoria
  };
}

// Verificar si una fecha es feriado
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

// Verificar si es cierre vacacional de AMAS
export function esCierreVacacionalAMAS(fecha: Date): boolean {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  if (mes === 12 && dia >= 20) return true;
  if (mes === 1 && dia <= 3) return true;

  return false;
}

// Obtener fechas disponibles para inicio (5 días hábiles)
export function obtenerFechasDisponiblesInicio(): Date[] {
  const hoy = new Date();
  const fechasDisponibles: Date[] = [];
  let diasHabilesContados = 0;
  const fechaIteracion = new Date(hoy);
  fechaIteracion.setDate(fechaIteracion.getDate() + 1);

  while (diasHabilesContados < 5) {
    if (fechaIteracion.getDay() === 0) {
      fechaIteracion.setDate(fechaIteracion.getDate() + 1);
      continue;
    }

    if (esFeriado(fechaIteracion)) {
      fechaIteracion.setDate(fechaIteracion.getDate() + 1);
      continue;
    }

    if (esCierreVacacionalAMAS(fechaIteracion)) {
      fechaIteracion.setDate(fechaIteracion.getDate() + 1);
      continue;
    }

    fechasDisponibles.push(new Date(fechaIteracion));
    diasHabilesContados++;
    fechaIteracion.setDate(fechaIteracion.getDate() + 1);
  }

  return fechasDisponibles;
}

// Obtener nombre del día
export function obtenerNombreDia(fecha: Date): string {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return dias[fecha.getDay()];
}

// Calcular fecha de fin
export function calcularFechaFin(fechaInicio: Date, programa: string, diasTentativos: string[], clasesExtra: number = 0): {
  fechaFin: Date;
  clasesTotales: number;
  semanasAproximadas: number;
} {
  let clasesTotales = PROGRAMA_CLASES[programa] + clasesExtra;

  const fechaActual = new Date(fechaInicio);
  let clasesContadas = 1; // La primera clase cuenta

  while (clasesContadas < clasesTotales) {
    fechaActual.setDate(fechaActual.getDate() + 1);

    if (fechaActual.getDay() === 0) continue;

    if (esFeriado(fechaActual)) continue;

    if (esCierreVacacionalAMAS(fechaActual)) continue;

    const nombreDia = obtenerNombreDia(fechaActual);
    if (diasTentativos.includes(nombreDia)) {
      clasesContadas++;
    }
  }

  return {
    fechaFin: fechaActual,
    clasesTotales,
    semanasAproximadas: Math.ceil((fechaActual.getTime() - fechaInicio.getTime()) / (7 * 24 * 60 * 60 * 1000))
  };
}

// Validar código promocional
export function validarCodigoPromocional(codigo: string, programaActual: string): CodigoAplicado {
  const codigoUpper = codigo.toUpperCase().trim();
  const promo = CODIGOS_PROMOCIONALES[codigoUpper];

  if (!promo) {
    return { valido: false, mensaje: "❌ Código no válido" };
  }

  if (!promo.activo) {
    return { valido: false, mensaje: "❌ Código inactivo" };
  }

  if (!promo.programasAplicables.includes(programaActual)) {
    return {
      valido: false,
      mensaje: "❌ Este código no aplica para el programa seleccionado"
    };
  }

  return {
    valido: true,
    tipo: promo.tipo,
    valor: promo.valor,
    descripcion: promo.descripcion,
    codigo: codigoUpper
  };
}

// Obtener clases extra de un código promo
export function obtenerClasesExtraDePromo(codigo: string): number {
  const promo = CODIGOS_PROMOCIONALES[codigo];
  if (!promo) return 0;

  if (promo.tipo === "clases_extra") return promo.valor;
  if (promo.tipo === "mes_gratis") return 8;
  return 0;
}
