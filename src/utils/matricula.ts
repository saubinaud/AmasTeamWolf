// Fechas y horarios de matrícula/renovación (compartido por FormularioMatricula
// y FormularioRenovacion). Aquí no hay precios ni códigos: eso lo decide el API
// (ver utils/catalogo.ts y POST /api/config/cotizar).
import { esFeriado, esCierreVacacionalAMAS } from '../shared/constants';

export interface HorariosInfo {
  horarioSemana: string;
  horarioSabado: string;
  diasSemana: string;
  categoria: string;
  horarioManana: string;
}

export type Turno = 'manana' | 'tarde';

/** YYYY-MM-DD en hora local (toISOString usa UTC y en Lima de noche da el día siguiente). */
export function aYmd(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

/** Date local a partir de YYYY-MM-DD (new Date('YYYY-MM-DD') lo toma como UTC). */
export function deYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "martes 4 de noviembre" */
export function fechaLarga(ymd: string, conAnio = false): string {
  return deYmd(ymd).toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', ...(conAnio ? { year: 'numeric' } : {}),
  });
}

/** Días de clase posibles según turno y categoría. */
export function diasPermitidos(turno: Turno, categoria: string): string[] {
  if (turno === 'manana') return ['Martes', 'Jueves', 'Sábado'];
  if (categoria === 'Juniors') return ['Lunes', 'Miércoles', 'Viernes'];
  if (categoria === 'Adolescentes') return ['Martes', 'Jueves'];
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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

// Próximas fechas hábiles para iniciar (omite domingos y cierre vacacional).
export function obtenerFechasDisponiblesInicio(cantidad = 5): Date[] {
  const hoy = new Date();
  const fechasDisponibles: Date[] = [];
  let diasHabilesContados = 0;
  const fechaIteracion = new Date(hoy);
  fechaIteracion.setDate(fechaIteracion.getDate() + 1);

  while (diasHabilesContados < cantidad) {
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

// Calcula la fecha de fin contando las clases (las del programa en el catálogo
// más las que regale el código): omite domingos, cierre vacacional, y feriados
// que caen en días de clase.
export function calcularFechaFin(fechaInicio: Date, clasesTotales: number, diasTentativos: string[]): {
  fechaFin: Date;
  clasesTotales: number;
  semanasAproximadas: number;
} {

  const fechaActual = new Date(fechaInicio);
  let clasesContadas = 1; // La primera clase cuenta

  while (clasesContadas < clasesTotales && diasTentativos.length > 0) {
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
