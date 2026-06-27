// Funciones de cálculo de matrícula/renovación (fuente única, compartida por
// FormularioMatricula y FormularioRenovacion). Las constantes de negocio vienen
// de shared/constants — aquí no se hardcodea ninguna.
import {
  esFeriado,
  esCierreVacacionalAMAS,
  PROGRAMA_CLASES,
  CODIGOS_PROMOCIONALES,
  type TipoPromocion,
} from '../shared/constants';

export interface HorariosInfo {
  horarioSemana: string;
  horarioSabado: string;
  diasSemana: string;
  categoria: string;
  horarioManana: string;
}

export interface CodigoAplicado {
  valido: boolean;
  tipo?: TipoPromocion;
  valor?: number;
  descripcion?: string;
  codigo?: string;
  mensaje?: string;
}

// Calcular horarios y categoría según la edad (en meses) del alumno.
export function calcularHorarios(fechaNacimiento: string): HorariosInfo {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edadMeses = Math.floor((hoy.getTime() - nacimiento.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const edadAnios = Math.floor(edadMeses / 12);

  let horarioSemana = "";
  let horarioSabado = "";
  let horarioManana = "";
  let diasSemana = "Lunes a Viernes";
  let categoria = "";

  if (edadMeses >= 11 && edadMeses <= 15) {
    horarioSemana = "3:00 PM";
    horarioSabado = "9:00 AM";
    horarioManana = "9:00 AM";
  } else if (edadMeses >= 16 && edadMeses <= 20) {
    horarioSemana = "3:30 PM";
    horarioSabado = "9:30 AM";
    horarioManana = "9:30 AM";
  } else if (edadMeses >= 21 && edadMeses <= 26) {
    horarioSemana = "4:00 PM";
    horarioSabado = "10:00 AM";
    horarioManana = "10:00 AM";
  } else if (edadMeses >= 27 && edadMeses <= 32) {
    horarioSemana = "4:30 PM";
    horarioSabado = "10:30 AM";
    horarioManana = "10:30 AM";
  } else if (edadMeses >= 33 && edadMeses <= 38) {
    horarioSemana = "5:00 PM";
    horarioSabado = "11:00 AM";
    horarioManana = "11:00 AM";
  } else if (edadMeses >= 39 && edadMeses <= 48) {
    horarioSemana = "5:30 PM";
    horarioSabado = "11:30 AM";
    horarioManana = "11:30 AM";
  } else if (edadMeses >= 49 && edadMeses <= 71) {
    horarioSemana = "6:00 PM";
    horarioSabado = "12:00 PM";
    horarioManana = "12:00 PM";
  } else if (edadAnios >= 6 && edadAnios <= 11) {
    horarioSemana = "6:30 PM";
    horarioSabado = "12:30 PM";
    horarioManana = "12:30 PM";
    diasSemana = "Lunes, Miércoles y Viernes";
    categoria = "Juniors";
  } else if (edadAnios >= 12 && edadAnios <= 17) {
    horarioSemana = "6:30 PM";
    horarioSabado = "1:30 PM";
    horarioManana = "1:30 PM";
    diasSemana = "Martes y Jueves";
    categoria = "Adolescentes";
  }

  return { horarioSemana, horarioSabado, horarioManana, diasSemana, categoria };
}

// Próximas 5 fechas hábiles para iniciar (omite domingos y cierre vacacional).
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

export function obtenerNombreDia(fecha: Date): string {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return dias[fecha.getDay()];
}

// Calcula la fecha de fin contando las clases del programa: omite domingos,
// cierre vacacional, y feriados que caen en días de clase.
export function calcularFechaFin(fechaInicio: Date, programa: string, diasTentativos: string[], clasesExtra: number = 0): {
  fechaFin: Date;
  clasesTotales: number;
  semanasAproximadas: number;
} {
  const clasesTotales = PROGRAMA_CLASES[programa] + clasesExtra;

  const fechaActual = new Date(fechaInicio);
  let clasesContadas = 1; // La primera clase cuenta

  while (clasesContadas < clasesTotales) {
    fechaActual.setDate(fechaActual.getDate() + 1);

    if (fechaActual.getDay() === 0) continue;  // Domingo
    if (esCierreVacacionalAMAS(fechaActual)) continue;

    const nombreDia = obtenerNombreDia(fechaActual);
    if (diasTentativos.includes(nombreDia)) {
      // Solo omitir feriados que caen en días de clase
      if (esFeriado(fechaActual)) continue;
      clasesContadas++;
    }
  }

  return {
    fechaFin: fechaActual,
    clasesTotales,
    semanasAproximadas: Math.ceil((fechaActual.getTime() - fechaInicio.getTime()) / (7 * 24 * 60 * 60 * 1000))
  };
}

// Valida un código promocional contra el programa seleccionado.
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

// Clases extra que otorga un código (clases_extra / mes_gratis).
export function obtenerClasesExtraDePromo(codigo: string): number {
  const promo = CODIGOS_PROMOCIONALES[codigo];
  if (!promo) return 0;

  if (promo.tipo === "clases_extra") return promo.valor;
  if (promo.tipo === "mes_gratis") return promo.valor;
  return 0;
}
