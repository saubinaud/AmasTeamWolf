import React, { useState, useCallback, memo, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useUmami } from '../hooks/useUmami';
import { ContratoFirma } from './ContratoFirma';

// ========== CONSTANTES ==========

// Feriados fijos de Perú - Feriados obligatorios no laborables según Decreto Legislativo 713
// Fuente: https://gestion.pe/peru/feriados-2025-en-peru-conoce-los-dias-festivos-y-no-laborales-para-este-ano-noticia/
const FERIADOS_FIJOS_PERU = [
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

// Feriados móviles por año
const FERIADOS_MOVILES: Record<number, Array<{ fecha: string; nombre: string }>> = {
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
const PROGRAMA_CLASES: Record<string, number> = {
  "1mes": 8,
  "full": 24, // 3 meses
  "6meses": 48 // 6 meses (2 veces por semana)
};

// Precios base por programa
const PRECIOS_BASE: Record<string, number> = {
  "1mes": 330,
  "full": 869,
  "6meses": 1699
};

// Nombres de programas
const NOMBRES_PROGRAMA: Record<string, string> = {
  "1mes": "Programa 1 Mes",
  "full": "Programa 3 Meses FULL",
  "6meses": "Programa 6 Meses"
};

// Códigos promocionales
interface CodigoPromocional {
  tipo: 'descuento_dinero' | 'descuento_porcentaje' | 'clases_extra' | 'mes_gratis' | 'polo_gratis' | 'uniforme_gratis';
  valor: number;
  descripcion: string;
  programasAplicables: string[];
  activo: boolean;
}

const CODIGOS_PROMOCIONALES: Record<string, CodigoPromocional> = {
  // ========== DESCUENTOS EN DINERO ==========
  "AMAS-DESC10": {
    tipo: "descuento_dinero",
    valor: 10,
    descripcion: "Descuento de S/ 10",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },
  "AMAS-DESC20": {
    tipo: "descuento_dinero",
    valor: 20,
    descripcion: "Descuento de S/ 20",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },
  "AMAS-DESC50": {
    tipo: "descuento_dinero",
    valor: 50,
    descripcion: "Descuento de S/ 50",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },
  "AMAS-DESC100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "Descuento de S/ 100",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },
  "AMAS-DESC150": {
    tipo: "descuento_dinero",
    valor: 150,
    descripcion: "Descuento de S/ 150",
    programasAplicables: ["full", "6meses"],
    activo: true
  },
  "AMAS-DESC200": {
    tipo: "descuento_dinero",
    valor: 200,
    descripcion: "Descuento de S/ 200",
    programasAplicables: ["full", "6meses"],
    activo: true
  },
  "PRIMAVEZ": {
    tipo: "descuento_dinero",
    valor: 80,
    descripcion: "Descuento de S/ 80 para nuevos alumnos",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },

  // ========== DESCUENTOS PORCENTUALES ==========
  "AMAS10OFF": {
    tipo: "descuento_porcentaje",
    valor: 10,
    descripcion: "10% de descuento",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },
  "AMAS15OFF": {
    tipo: "descuento_porcentaje",
    valor: 15,
    descripcion: "15% de descuento",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },
  "AMAS20OFF": {
    tipo: "descuento_porcentaje",
    valor: 20,
    descripcion: "20% de descuento",
    programasAplicables: ["full", "6meses"],
    activo: true
  },
  "BLACKFRIDAY": {
    tipo: "descuento_porcentaje",
    valor: 25,
    descripcion: "25% de descuento Black Friday",
    programasAplicables: ["1mes", "full", "6meses"],
    activo: true
  },

  // ========== CLASES EXTRA ==========
  "AMAS-4CLASES": {
    tipo: "clases_extra",
    valor: 4,
    descripcion: "+4 clases gratis",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "AMAS-8CLASES": {
    tipo: "clases_extra",
    valor: 8,
    descripcion: "+8 clases gratis",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "AMAS-12CLASES": {
    tipo: "clases_extra",
    valor: 12,
    descripcion: "+12 clases gratis",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== MES GRATIS ==========
  "MESGRATIS": {
    tipo: "mes_gratis",
    valor: 8,
    descripcion: "+1 mes gratis (8 clases)",
    programasAplicables: ["full"],
    activo: true
  },
  "2X1FINAL": {
    tipo: "mes_gratis",
    valor: 16,
    descripcion: "+2 meses gratis (16 clases)",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== POLOS Y UNIFORMES ==========
  "POLO1GRATIS": {
    tipo: "polo_gratis",
    valor: 1,
    descripcion: "+1 polo oficial gratis (S/ 60)",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "POLO2GRATIS": {
    tipo: "polo_gratis",
    valor: 2,
    descripcion: "+2 polos oficiales gratis (S/ 110)",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "UNIFORMEGRATIS": {
    tipo: "uniforme_gratis",
    valor: 220,
    descripcion: "Uniforme completo gratis (S/ 220)",
    programasAplicables: ["1mes"],
    activo: true
  },

  // ========== DESCUENTOS FAMILIARES ==========
  "HERMANOS10": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "100 soles de descuento por 1 hermano",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "HERMANOS15": {
    tipo: "descuento_dinero",
    valor: 150,
    descripcion: "150 soles de descuento por inscribir 2+ hermanos",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "FAMILIAR20": {
    tipo: "descuento_porcentaje",
    valor: 20,
    descripcion: "20% descuento familiar (3+ miembros)",
    programasAplicables: ["1mes", "full"],
    activo: true
  },

  // ========== REFERIDOS ==========
  "AMIGO50": {
    tipo: "descuento_dinero",
    valor: 50,
    descripcion: "S/ 50 descuento por referir a un amigo",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "AMIGO100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "S/ 100 descuento por referir 2+ amigos",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "REFIERE3X": {
    tipo: "descuento_dinero",
    valor: 150,
    descripcion: "S/ 150 descuento por referir 3+ amigos",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== ESPECIALES ==========
  "CUMPLEAÑOS": {
    tipo: "descuento_dinero",
    valor: 80,
    descripcion: "S/ 80 descuento + 1 polo gratis (mes cumpleaños)",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "BIENVENIDA": {
    tipo: "descuento_dinero",
    valor: 60,
    descripcion: "S/ 60 descuento + 2 clases extra",
    programasAplicables: ["1mes"],
    activo: true
  },
  "NAVIDAD": {
    tipo: "descuento_porcentaje",
    valor: 15,
    descripcion: "15% descuento + 4 clases extra (Navidad)",
    programasAplicables: ["1mes", "full"],
    activo: true
  },

  // ========== FIDELIDAD ==========
  "VUELVE100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "S/ 100 descuento para ex-alumnos",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "VUELVE150": {
    tipo: "descuento_dinero",
    valor: 150,
    descripcion: "S/ 150 descuento + 1 polo (ex-alumnos)",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== PROMOCIONES FLASH ==========
  "FLASH24H": {
    tipo: "descuento_porcentaje",
    valor: 20,
    descripcion: "20% descuento válido 24 horas",
    programasAplicables: ["1mes", "full"],
    activo: true
  },
  "EARLYBIRD": {
    tipo: "descuento_dinero",
    valor: 120,
    descripcion: "S/ 120 descuento por inscripción anticipada",
    programasAplicables: ["full"],
    activo: true
  },

  // ========== RENOVACIONES ==========
  "RENUEVA100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "S/ 100 descuento por renovación anticipada",
    programasAplicables: ["1mes", "full"],
    activo: true
  }
};

// ========== INTERFACES ==========

interface HorariosInfo {
  horarioSemana: string;
  horarioSabado: string;
  diasSemana: string;
  categoria: string;
  horarioManana: string; // Nuevo campo para horario de mañana
}

interface CodigoAplicado {
  valido: boolean;
  tipo?: 'descuento_dinero' | 'descuento_porcentaje' | 'clases_extra' | 'mes_gratis' | 'polo_gratis' | 'uniforme_gratis';
  valor?: number;
  descripcion?: string;
  codigo?: string;
  mensaje?: string;
}

interface FormularioMatriculaProps {
  isOpen: boolean;
  onClose: () => void;
  programa: 'full' | '1mes' | '6meses';
  onSuccess: (total: number) => void;
}

// ========== FUNCIONES AUXILIARES ==========

// Calcular horarios según edad
function calcularHorarios(fechaNacimiento: string): HorariosInfo {
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
    horarioManana = "9:00 AM"; // Mañana: martes, jueves y sábado
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

  return {
    horarioSemana,
    horarioSabado,
    horarioManana,
    diasSemana,
    categoria
  };
}

// Verificar si una fecha es feriado
function esFeriado(fecha: Date): boolean {
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
function esCierreVacacionalAMAS(fecha: Date): boolean {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  if (mes === 12 && dia >= 20) return true;
  if (mes === 1 && dia <= 4) return true;  // Cerrado hasta el 4, abren el 5

  return false;
}

// Obtener fechas disponibles para inicio (5 días hábiles)
function obtenerFechasDisponiblesInicio(): Date[] {
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

// Obtener nombre del día
function obtenerNombreDia(fecha: Date): string {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return dias[fecha.getDay()];
}

// Calcular fecha de fin
function calcularFechaFin(fechaInicio: Date, programa: string, diasTentativos: string[], clasesExtra: number = 0): {
  fechaFin: Date;
  clasesTotales: number;
  semanasAproximadas: number;
} {
  let clasesTotales = PROGRAMA_CLASES[programa] + clasesExtra;

  const fechaActual = new Date(fechaInicio);
  let clasesContadas = 1; // La primera clase cuenta

  while (clasesContadas < clasesTotales) {
    fechaActual.setDate(fechaActual.getDate() + 1);

    if (fechaActual.getDay() === 0) continue;  // Domingo

    if (esCierreVacacionalAMAS(fechaActual)) {
      continue;
    }

    const nombreDia = obtenerNombreDia(fechaActual);
    if (diasTentativos.includes(nombreDia)) {
      // Solo omitir feriados que caen en días de clase
      if (esFeriado(fechaActual)) {
        continue;
      }
      clasesContadas++;
    }
  }

  const resultado = {
    fechaFin: fechaActual,
    clasesTotales,
    semanasAproximadas: Math.ceil((fechaActual.getTime() - fechaInicio.getTime()) / (7 * 24 * 60 * 60 * 1000))
  };

  return resultado;
}

// Validar código promocional
function validarCodigoPromocional(codigo: string, programaActual: string): CodigoAplicado {
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
function obtenerClasesExtraDePromo(codigo: string): number {
  const promo = CODIGOS_PROMOCIONALES[codigo];
  if (!promo) return 0;

  if (promo.tipo === "clases_extra") return promo.valor;
  if (promo.tipo === "mes_gratis") return promo.valor;
  return 0;
}

const INITIAL_FORM_STATE = {
  nombreAlumno: '',
  dniAlumno: '',
  fechaNacimiento: '',
  tallaUniforme: '',
  nombrePadre: '',
  dniPadre: '',
  telefono: '',
  direccion: '',
  email: '',
  fechaInicio: '',
  fechaFin: ''
};

export const FormularioMatricula = memo(function FormularioMatricula({ isOpen, onClose, programa, onSuccess }: FormularioMatriculaProps) {
  // Umami analytics
  const { trackFormSubmit } = useUmami();

  // Estados existentes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [polosOption, setPolosOption] = useState<'0' | '1' | '2' | '3'>('0');
  const [includeUniform, setIncludeUniform] = useState(false);
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);
  // File upload state removed as requested
  // const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  // const [fileBase64, setFileBase64] = useState<string>('');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Estados nuevos para funcionalidades adicionales
  const [horariosInfo, setHorariosInfo] = useState<HorariosInfo | null>(null);
  const [categoriaAlumno, setCategoriaAlumno] = useState<string>('');
  const [diasTentativos, setDiasTentativos] = useState<string[]>([]);
  const [codigoPromocional, setCodigoPromocional] = useState<string>('');
  const [codigoAplicado, setCodigoAplicado] = useState<CodigoAplicado | null>(null);
  const [contratoExpanded, setContratoExpanded] = useState(false);
  const [fechaFinCalculada, setFechaFinCalculada] = useState<string>('');
  const [detallesFechaFin, setDetallesFechaFin] = useState<{
    clasesTotales: number;
    semanasAproximadas: number;
  } | null>(null);
  const [fechasDisponibles, setFechasDisponibles] = useState<Date[]>([]);
  const [mostrarOtraFecha, setMostrarOtraFecha] = useState(false);
  const [opcionFechaSeleccionada, setOpcionFechaSeleccionada] = useState<'fechas' | 'no-especificado' | 'otra'>('fechas');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<'manana' | 'tarde'>('tarde');

  // Recalcular fechas disponibles cuando cambia la fecha de nacimiento o el turno
  useEffect(() => {
    if (isOpen && formData.fechaNacimiento) {
      const todasLasFechas = obtenerFechasDisponiblesInicio();
      const horarios = calcularHorarios(formData.fechaNacimiento);

      // Filtrar fechas según el turno seleccionado
      let diasPermitidos: string[] = [];

      if (turnoSeleccionado === 'manana') {
        // Mañana: siempre martes, jueves y sábado
        diasPermitidos = ['Martes', 'Jueves', 'Sábado'];
      } else {
        // Tarde: según categoría
        if (horarios.categoria === 'Juniors') {
          diasPermitidos = ['Lunes', 'Miércoles', 'Viernes'];
        } else if (horarios.categoria === 'Adolescentes') {
          diasPermitidos = ['Martes', 'Jueves'];
        } else {
          // Para bebés y niños pequeños, todos los días excepto domingo
          diasPermitidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        }
      }

      const fechasFiltradas = todasLasFechas.filter(fecha => {
        const nombreDia = obtenerNombreDia(fecha);
        return diasPermitidos.includes(nombreDia);
      });

      setFechasDisponibles(fechasFiltradas.slice(0, 5));
    } else if (isOpen) {
      // Si no hay fecha de nacimiento, mostrar todas las fechas
      const fechas = obtenerFechasDisponiblesInicio();
      setFechasDisponibles(fechas);
    }
  }, [isOpen, formData.fechaNacimiento, turnoSeleccionado]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all form state
      setFormData(INITIAL_FORM_STATE);
      setPolosOption('0');
      setIncludeUniform(false);
      setTallasPolos([]);
      setTallasPolos([]);
      // setUploadedFile(null); // Removed
      // setFileBase64(''); // Removed
      setIsSubmitting(false);
      setHorariosInfo(null);
      setCategoriaAlumno('');
      setDiasTentativos([]);
      setCodigoPromocional('');
      setCodigoAplicado(null);
      setContratoExpanded(false);
      setFechaFinCalculada('');
      setDetallesFechaFin(null);
      setFechasDisponibles([]);
      setMostrarOtraFecha(false);
      setOpcionFechaSeleccionada('fechas');
      setTurnoSeleccionado('tarde');
    }
  }, [isOpen]);

  // Cálculos de precio
  const precioBase = PRECIOS_BASE[programa];
  const preciosPolos = { '0': 0, '1': 60, '2': 110, '3': 150 };
  let precioUniforme = programa === '1mes' && includeUniform ? 220 : 0;
  let precioPolosAjustado = preciosPolos[polosOption];

  // Calcular descuento de código promocional
  let descuentoDinero = 0;
  let descuentoPorcentaje = 0;

  if (codigoAplicado?.valido && codigoAplicado.valor) {
    if (codigoAplicado.tipo === 'descuento_dinero') {
      descuentoDinero = codigoAplicado.valor;
    } else if (codigoAplicado.tipo === 'descuento_porcentaje') {
      descuentoPorcentaje = codigoAplicado.valor;
    } else if (codigoAplicado.tipo === 'polo_gratis') {
      // Reducir precio de polos según cantidad de polos gratis
      const valorDescuentoPolo = codigoAplicado.valor === 1 ? 60 : 110;
      precioPolosAjustado = Math.max(0, preciosPolos[polosOption] - valorDescuentoPolo);
    } else if (codigoAplicado.tipo === 'uniforme_gratis') {
      precioUniforme = 0;
    }
  }

  // Calcular subtotal antes de descuento porcentual
  const subtotal = precioBase + precioPolosAjustado + precioUniforme - descuentoDinero;

  // Aplicar descuento porcentual
  const descuentoPorcentualMonto = descuentoPorcentaje > 0 ? Math.round(subtotal * (descuentoPorcentaje / 100)) : 0;

  const total = Math.max(0, subtotal - descuentoPorcentualMonto);

  const needsUniformSize = programa === 'full' || programa === '6meses' || (programa === '1mes' && includeUniform);
  const needsPoloSize = polosOption !== '0';

  const handlePolosChange = useCallback((value: '0' | '1' | '2' | '3') => {
    setPolosOption(value);
    const numPolos = parseInt(value);
    setTallasPolos(new Array(numPolos).fill(''));
  }, []);

  const handleTallaPoloChange = useCallback((index: number, talla: string) => {
    setTallasPolos(prev => {
      const newTallas = [...prev];
      newTallas[index] = talla;
      return newTallas;
    });
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);




  // ========== NUEVOS HANDLERS ==========

  // Handler para cuando cambia la fecha de nacimiento
  const handleFechaNacimientoChange = useCallback((fecha: string) => {
    handleInputChange('fechaNacimiento', fecha);
    if (fecha) {
      const horarios = calcularHorarios(fecha);
      setHorariosInfo(horarios);
      setCategoriaAlumno(horarios.categoria);
    } else {
      setHorariosInfo(null);
      setCategoriaAlumno('');
    }
  }, []);

  // Handler para días tentativos
  const handleDiaTentativoChange = useCallback((dia: string, checked: boolean) => {
    setDiasTentativos(prev => {
      if (checked) {
        return [...prev, dia];
      } else {
        return prev.filter(d => d !== dia);
      }
    });
  }, []);

  // Handler para aplicar código promocional
  const handleAplicarCodigo = useCallback(() => {
    if (!codigoPromocional.trim()) {
      toast.error('Ingrese un código promocional');
      return;
    }

    const validacion = validarCodigoPromocional(codigoPromocional, programa);

    if (!validacion.valido) {
      toast.error(validacion.mensaje || 'Código no válido');
      setCodigoAplicado(null);
      return;
    }

    setCodigoAplicado(validacion);
    toast.success(`✅ Código "${validacion.codigo}" aplicado exitosamente`);
  }, [codigoPromocional, programa]);

  // Handler para quitar código promocional
  const handleQuitarCodigo = useCallback(() => {
    setCodigoPromocional('');
    setCodigoAplicado(null);
    toast.info('Código promocional removido');
  }, []);

  // Limpiar días tentativos cuando cambia el turno
  useEffect(() => {
    if (turnoSeleccionado && diasTentativos.length > 0) {
      // Filtrar días tentativos para mantener solo los válidos según el turno
      const diasValidos = turnoSeleccionado === 'manana'
        ? ['Martes', 'Jueves', 'Sábado']
        : categoriaAlumno === 'Juniors'
          ? ['Lunes', 'Miércoles', 'Viernes']
          : categoriaAlumno === 'Adolescentes'
            ? ['Martes', 'Jueves']
            : ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      const diasFiltrados = diasTentativos.filter(dia => diasValidos.includes(dia));
      if (diasFiltrados.length !== diasTentativos.length) {
        setDiasTentativos(diasFiltrados);
      }
    }
  }, [turnoSeleccionado]);

  // Effect para calcular fecha de fin automáticamente
  useEffect(() => {
    if (!formData.fechaInicio || formData.fechaInicio === 'no-especificado' || diasTentativos.length < 1) {
      setFechaFinCalculada('');
      setDetallesFechaFin(null);
      return;
    }

    const clasesExtra = codigoAplicado?.codigo ? obtenerClasesExtraDePromo(codigoAplicado.codigo) : 0;
    const resultado = calcularFechaFin(new Date(formData.fechaInicio), programa, diasTentativos, clasesExtra);

    setFechaFinCalculada(resultado.fechaFin.toISOString().split('T')[0]);
    setDetallesFechaFin({
      clasesTotales: resultado.clasesTotales,
      semanasAproximadas: resultado.semanasAproximadas
    });
  }, [formData.fechaInicio, diasTentativos, codigoAplicado, programa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombreAlumno || !formData.dniAlumno || !formData.nombrePadre || !formData.dniPadre || !formData.telefono || !formData.email || !formData.fechaInicio) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar fecha de nacimiento
    if (!formData.fechaNacimiento) {
      toast.error('Por favor ingrese la fecha de nacimiento del alumno');
      return;
    }

    // Validar días tentativos (mínimo 2) solo si la fecha no es "no-especificado"
    if (formData.fechaInicio !== 'no-especificado' && diasTentativos.length < 1) {
      toast.error('Debes seleccionar al menos 1 día de asistencia por semana');
      return;
    }

    // Validar que la fecha de fin se haya calculado solo si la fecha no es "no-especificado"
    if (formData.fechaInicio !== 'no-especificado' && !fechaFinCalculada) {
      toast.error('La fecha de fin no se ha calculado correctamente. Por favor verifica los datos');
      return;
    }

    if (needsUniformSize && !formData.tallaUniforme) {
      toast.error('Por favor seleccione la talla de uniforme');
      return;
    }

    if (needsPoloSize && tallasPolos.some(talla => !talla)) {
      toast.error('Por favor seleccione todas las tallas de los polos');
      return;
    }

    if (!firmaBase64) {
      toast.error('Por favor firma el contrato antes de enviar');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        // Información del programa
        programa: programa === 'full' ? '3 Meses Full' : programa === '6meses' ? '6 Meses' : '1 Mes',
        clasesTotales: formData.fechaInicio === 'no-especificado' ? PROGRAMA_CLASES[programa] : (detallesFechaFin?.clasesTotales || PROGRAMA_CLASES[programa]),

        // Datos del alumno
        nombreAlumno: formData.nombreAlumno,
        dniAlumno: formData.dniAlumno,
        fechaNacimiento: formData.fechaNacimiento,
        categoriaAlumno: categoriaAlumno || 'No especificada',

        // Horarios y turnos
        turnoSeleccionado: turnoSeleccionado === 'manana' ? 'Mañana' : 'Tarde',
        horariosDisponibles: horariosInfo ? {
          horarioSemana: turnoSeleccionado === 'manana' ? horariosInfo.horarioManana : horariosInfo.horarioSemana,
          horarioSabado: horariosInfo.horarioSabado,
          horarioManana: horariosInfo.horarioManana,
          horarioTarde: horariosInfo.horarioSemana,
          diasSemana: turnoSeleccionado === 'manana' ? 'Martes, Jueves y Sábado' : horariosInfo.diasSemana
        } : null,

        // Uniformes y tallas
        tallaUniforme: needsUniformSize ? formData.tallaUniforme : 'No aplica',
        tallasPolos: needsPoloSize ? tallasPolos : [],

        // Datos del padre/tutor
        nombrePadre: formData.nombrePadre,
        dniPadre: formData.dniPadre,
        telefono: formData.telefono,
        direccion: formData.direccion,
        email: formData.email,

        // Adicionales
        polos: polosOption === '0' ? 'No' : `${polosOption} polo(s)`,
        precioPolos: preciosPolos[polosOption],
        uniformeAdicional: programa === '1mes' ? (includeUniform ? 'Sí' : 'No') : 'Incluido',
        precioUniforme: precioUniforme,

        // Fechas y asistencia
        fechaInicio: formData.fechaInicio,
        diasTentativos: formData.fechaInicio === 'no-especificado' ? 'Aún no especificado' : diasTentativos.join(', '),
        fechaFin: formData.fechaInicio === 'no-especificado' ? 'Por calcular' : fechaFinCalculada,
        semanasAproximadas: formData.fechaInicio === 'no-especificado' ? 0 : (detallesFechaFin?.semanasAproximadas || 0),

        // Códigos promocionales y descuentos
        codigoPromocional: codigoAplicado?.codigo || 'No aplicado',
        tipoDescuento: codigoAplicado?.tipo || 'ninguno',
        descuentoDinero: descuentoDinero,
        descuentoPorcentaje: descuentoPorcentaje,
        descuentoPorcentualMonto: descuentoPorcentualMonto,

        // Precios
        precioPrograma: precioBase,
        subtotal: subtotal,
        total: total,

        // Contrato
        contratoFirmado: firmaBase64 || null,

        fechaRegistro: new Date().toISOString()
      };

      const { API_BASE } = await import('../config/api');

      const response = await fetch(`${API_BASE}/matricula`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (response.ok || response.status === 200) {
        toast.success('¡Datos enviados correctamente! Redirigiendo...');

        // Track enrollment with Umami
        trackFormSubmit(`Formulario Matrícula ${NOMBRES_PROGRAMA[programa]}`, total);

        setTimeout(() => {
          window.location.href = 'https://amasteamwolf.com';
        }, 1500);

        // Reset form
        setFormData({
          nombreAlumno: '',
          dniAlumno: '',
          fechaNacimiento: '',
          tallaUniforme: '',
          nombrePadre: '',
          dniPadre: '',
          telefono: '',
          direccion: '',
          email: '',
          fechaInicio: '',
          fechaFin: ''
        });
        setPolosOption('0');
        setTallasPolos([]);
        setIncludeUniform(false);

      } else {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error completo:', error);
      toast.error('Hubo un error al enviar los datos. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tallasOptions = ['2', '4', '6', '8', '10', '12', '14', 'S', 'M', 'L', 'XL'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="bg-zinc-900 border-2 border-[#FA7B21]/30 w-full max-w-[calc(100%-2rem)] sm:max-w-[95vw] md:max-w-3xl lg:max-w-4xl p-0 m-4 sm:m-6"
        style={{
          maxHeight: 'calc(100vh - 4rem)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header Sticky */}
        <div className="flex items-start justify-between sticky top-0 bg-zinc-900 z-20 pb-3 sm:pb-4 border-b border-white/10 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex-1 pr-4 sm:pr-8">
            <DialogTitle className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
              Formulario de Matrícula
            </DialogTitle>
            <DialogDescription className="text-white/70 text-xs sm:text-sm">
              Programa: <span className="text-[#FA7B21] font-semibold">
                {programa === 'full' ? '3 Meses Full (S/ 869)' : programa === '6meses' ? '6 Meses (S/ 1699)' : '1 Mes (S/ 330)'}
              </span>
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              className="text-white/60 hover:text-white transition-colors flex-shrink-0 p-2 hover:bg-white/5 rounded-lg"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </DialogClose>
        </div>

        {/* Form Content */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-7 pb-6 sm:pb-8">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-7">
            {/* Datos del Alumno */}
            <div>
              <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
                Datos del Alumno
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <Label htmlFor="nombreAlumno" className="text-white mb-2">
                    Nombre completo *
                  </Label>
                  <Input
                    id="nombreAlumno"
                    value={formData.nombreAlumno}
                    onChange={(e) => handleInputChange('nombreAlumno', e.target.value)}
                    className="bg-zinc-800 border-white/20 text-white focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor="dniAlumno" className="text-white mb-2">
                    DNI *
                  </Label>
                  <Input
                    id="dniAlumno"
                    value={formData.dniAlumno}
                    onChange={(e) => handleInputChange('dniAlumno', e.target.value)}
                    className="bg-zinc-800 border-white/20 text-white focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                    maxLength={8}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fechaNacimiento" className="text-white mb-2">
                    Fecha de nacimiento *
                  </Label>
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleFechaNacimientoChange(e.target.value)}
                    className="bg-zinc-800 border-white/20 text-white focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                    required
                  />

                  {/* Mostrar horarios disponibles después de ingresar fecha de nacimiento */}
                  {horariosInfo && horariosInfo.horarioSemana && (
                    <div className="mt-4 space-y-4">
                      {/* Selector de Turno - Solo si hay horarios definidos */}
                      <div className="p-4 bg-zinc-800/50 border border-[#FA7B21]/30 rounded-lg">
                        <p className="text-white font-semibold mb-3 text-sm sm:text-base">
                          🌅 Selecciona tu turno preferido
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setTurnoSeleccionado('manana')}
                            className={`p-4 rounded-lg border-2 transition-all active:scale-95 ${turnoSeleccionado === 'manana'
                              ? 'border-[#FA7B21] bg-[#FA7B21]/20'
                              : 'border-white/20 hover:border-[#FA7B21]/50 bg-zinc-800/50'
                              }`}
                          >
                            <div className="text-center">
                              <div className="text-3xl mb-2">🌄</div>
                              <div className={`font-semibold ${turnoSeleccionado === 'manana' ? 'text-[#FA7B21]' : 'text-white'}`}>
                                Mañana
                              </div>
                              <div className="text-white/60 text-sm mt-1">
                                {horariosInfo.horarioManana}
                              </div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTurnoSeleccionado('tarde')}
                            className={`p-4 rounded-lg border-2 transition-all active:scale-95 ${turnoSeleccionado === 'tarde'
                              ? 'border-[#FA7B21] bg-[#FA7B21]/20'
                              : 'border-white/20 hover:border-[#FA7B21]/50 bg-zinc-800/50'
                              }`}
                          >
                            <div className="text-center">
                              <div className="text-3xl mb-2">🌆</div>
                              <div className={`font-semibold ${turnoSeleccionado === 'tarde' ? 'text-[#FA7B21]' : 'text-white'}`}>
                                Tarde
                              </div>
                              <div className="text-white/60 text-sm mt-1">
                                {horariosInfo.horarioSemana}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Información de horarios */}
                      <div className="p-4 bg-zinc-800/50 border border-[#FA7B21]/30 rounded-lg">
                        <p className="text-white font-semibold mb-3 text-sm sm:text-base">
                          📍 Horarios disponibles{horariosInfo.categoria ? ` - Categoría ${horariosInfo.categoria}` : ''}
                        </p>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <p className="text-white/80">
                            <strong className="text-white">Turno seleccionado:</strong> {turnoSeleccionado === 'manana' ? `Mañana (${horariosInfo.horarioManana})` : `Tarde (${horariosInfo.horarioSemana})`}
                          </p>
                          <p className="text-white/80">
                            <strong className="text-white">Días disponibles:</strong> {turnoSeleccionado === 'manana' ? 'Martes, Jueves y Sábado' : horariosInfo.diasSemana}
                          </p>
                          <p className="text-white/80">
                            <strong className="text-white">Sábados:</strong> {horariosInfo.horarioSabado}
                          </p>
                          <p className="text-white/60 text-xs mt-3">
                            ℹ️ Podrás asistir cualquier día dentro de estos horarios según tu disponibilidad.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Datos del Padre */}
            <div>
              <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
                Datos del Padre de Familia
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <Label htmlFor="nombrePadre" className="text-white mb-2">
                    Nombre completo *
                  </Label>
                  <Input
                    id="nombrePadre"
                    value={formData.nombrePadre}
                    onChange={(e) => handleInputChange('nombrePadre', e.target.value)}
                    className="bg-zinc-800 border-white/20 text-white focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor="dniPadre" className="text-white mb-2">
                    DNI *
                  </Label>
                  <Input
                    id="dniPadre"
                    value={formData.dniPadre}
                    onChange={(e) => handleInputChange('dniPadre', e.target.value)}
                    className="bg-zinc-800 border-white/20 text-white focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                    maxLength={8}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefono" className="text-white mb-2">
                    WhatsApp / Celular *
                  </Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="999 999 999"
                    className="bg-zinc-800 border-white/20 text-white focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white mb-2">
                    Correo electrónico *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-zinc-800 border-white/20 text-white focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="direccion" className="text-white mb-2">
                    Dirección
                  </Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    className="bg-zinc-800 border-white/20 text-white focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                    autoComplete="street-address"
                  />
                </div>
              </div>
            </div>

            {/* Uniforme adicional para programa 1 mes */}
            {programa === '1mes' && (
              <div>
                <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
                  Uniforme (Adicional)
                </h3>
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 p-4 rounded-lg border-2 border-white/10 hover:border-[#FA7B21]/30 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeUniform}
                      onChange={(e) => setIncludeUniform(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-white/20 bg-zinc-800 text-[#FA7B21] focus:ring-[#FA7B21] focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <div className="text-white text-base mb-1">
                        Añadir Uniforme Completo - S/ 220
                      </div>
                      <p className="text-sm text-white/60">
                        El uniforme no está incluido en el programa de 1 mes
                      </p>
                    </div>
                  </label>

                  {includeUniform && (
                    <div>
                      <Label htmlFor="tallaUniforme" className="text-white mb-2">
                        Talla de uniforme *
                      </Label>
                      <select
                        id="tallaUniforme"
                        value={formData.tallaUniforme}
                        onChange={(e) => handleInputChange('tallaUniforme', e.target.value)}
                        className="w-full bg-zinc-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FA7B21] focus:border-transparent"
                        required={includeUniform}
                      >
                        <option value="">Seleccione talla</option>
                        {tallasOptions.map(talla => (
                          <option key={talla} value={talla}>Talla {talla}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Talla de uniforme para programas 3 meses y 6 meses */}
            {(programa === 'full' || programa === '6meses') && (
              <div>
                <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
                  Talla de Uniforme
                </h3>
                <div>
                  <Label htmlFor="tallaUniforme" className="text-white mb-2">
                    Talla de uniforme (incluido) *
                  </Label>
                  <select
                    id="tallaUniforme"
                    value={formData.tallaUniforme}
                    onChange={(e) => handleInputChange('tallaUniforme', e.target.value)}
                    className="w-full bg-zinc-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FA7B21] focus:border-transparent"
                    required
                  >
                    <option value="">Seleccione talla</option>
                    {tallasOptions.map(talla => (
                      <option key={talla} value={talla}>Talla {talla}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Polos Adicionales */}
            <div>
              <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
                Adicionales (Opcional)
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-3 block">
                    ¿Desea añadir polos?
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: '0', label: 'Ninguno', price: '' },
                      { value: '1', label: '1', price: 'S/ 60' },
                      { value: '2', label: '2', price: 'S/ 110' },
                      { value: '3', label: '3', price: 'S/ 150' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${polosOption === option.value ? 'border-[#FA7B21] bg-[#FA7B21]/10' : 'border-white/20 hover:border-white/30'
                          }`}
                      >
                        <input
                          type="radio"
                          name="polos"
                          value={option.value}
                          checked={polosOption === option.value}
                          onChange={(e) => handlePolosChange(e.target.value as '0' | '1' | '2' | '3')}
                          className="w-4 h-4 text-[#FA7B21] focus:ring-[#FA7B21] focus:ring-offset-0 bg-zinc-800 border-white/20"
                        />
                        <div className="text-white text-sm sm:text-base flex-1">
                          {option.label === 'Ninguno' ? option.label : `${option.label} × ${option.price}`}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {needsPoloSize && (
                  <div className="space-y-3">
                    <Label className="text-white">Tallas de polos *</Label>
                    {Array.from({ length: parseInt(polosOption) }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Label className="text-white/70 min-w-[100px]">
                          Polo {index + 1}:
                        </Label>
                        <select
                          value={tallasPolos[index] || ''}
                          onChange={(e) => handleTallaPoloChange(index, e.target.value)}
                          className="flex-1 bg-zinc-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FA7B21] focus:border-transparent"
                          required
                        >
                          <option value="">Seleccionar talla</option>
                          {tallasOptions.map(talla => (
                            <option key={talla} value={talla}>Talla {talla}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fecha de Inicio, Días Tentativos y Fecha de Fin */}
            <div>
              <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
                Fechas del Programa
              </h3>

              {/* Fecha de Inicio - Selector Visual */}
              <div className="mb-6">
                <Label className="text-white mb-3 block text-base font-semibold">
                  1. Selecciona tu fecha de inicio *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fechasDisponibles.map((fecha, index) => {
                    const fechaStr = fecha.toISOString().split('T')[0];
                    const estaSeleccionada = formData.fechaInicio === fechaStr && opcionFechaSeleccionada === 'fechas';
                    const nombreDia = obtenerNombreDia(fecha);
                    const diaNumero = fecha.getDate();
                    const mes = fecha.toLocaleDateString('es-PE', { month: 'long' });

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          handleInputChange('fechaInicio', fechaStr);
                          setOpcionFechaSeleccionada('fechas');
                          setMostrarOtraFecha(false);
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left active:scale-95 ${estaSeleccionada
                          ? 'border-[#FA7B21] bg-[#FA7B21]/20'
                          : 'border-white/20 hover:border-white/40 bg-zinc-800/50 hover:bg-zinc-800'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${estaSeleccionada ? 'bg-[#FA7B21] text-white' : 'bg-zinc-700 text-white/80'
                            }`}>
                            {diaNumero}
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${estaSeleccionada ? 'text-[#FA7B21]' : 'text-white'}`}>
                              {nombreDia}
                            </p>
                            <p className="text-white/60 text-sm capitalize">{mes}</p>
                          </div>
                          {estaSeleccionada && (
                            <div className="text-[#FA7B21] text-xl">✓</div>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Opción: Aún no especificado */}
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('fechaInicio', 'no-especificado');
                      setOpcionFechaSeleccionada('no-especificado');
                      setMostrarOtraFecha(false);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left active:scale-95 ${opcionFechaSeleccionada === 'no-especificado'
                      ? 'border-[#FA7B21] bg-[#FA7B21]/20'
                      : 'border-white/20 hover:border-white/40 bg-zinc-800/50 hover:bg-zinc-800'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${opcionFechaSeleccionada === 'no-especificado' ? 'bg-[#FA7B21] text-white' : 'bg-zinc-700 text-white/80'
                        }`}>
                        ⏰
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${opcionFechaSeleccionada === 'no-especificado' ? 'text-[#FA7B21]' : 'text-white'}`}>
                          Aún no especificado
                        </p>
                        <p className="text-white/60 text-sm">Lo decidiré después</p>
                      </div>
                      {opcionFechaSeleccionada === 'no-especificado' && (
                        <div className="text-[#FA7B21] text-xl">✓</div>
                      )}
                    </div>
                  </button>

                  {/* Opción: Otra fecha */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpcionFechaSeleccionada('otra');
                      setMostrarOtraFecha(true);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left active:scale-95 ${opcionFechaSeleccionada === 'otra'
                      ? 'border-[#FA7B21] bg-[#FA7B21]/20'
                      : 'border-white/20 hover:border-white/40 bg-zinc-800/50 hover:bg-zinc-800'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${opcionFechaSeleccionada === 'otra' ? 'bg-[#FA7B21] text-white' : 'bg-zinc-700 text-white/80'
                        }`}>
                        📅
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${opcionFechaSeleccionada === 'otra' ? 'text-[#FA7B21]' : 'text-white'}`}>
                          Otra fecha
                        </p>
                        <p className="text-white/60 text-sm">Elegir fecha personalizada</p>
                      </div>
                      {opcionFechaSeleccionada === 'otra' && (
                        <div className="text-[#FA7B21] text-xl">✓</div>
                      )}
                    </div>
                  </button>
                </div>

                {/* Input de fecha personalizada */}
                {mostrarOtraFecha && opcionFechaSeleccionada === 'otra' && (
                  <div className="mt-4 p-4 bg-zinc-800/50 border border-[#FA7B21]/30 rounded-lg">
                    <Label className="text-white mb-2 block text-sm">Selecciona tu fecha personalizada:</Label>
                    <Input
                      type="date"
                      value={formData.fechaInicio !== 'no-especificado' ? formData.fechaInicio : ''}
                      onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-zinc-800 border-white/20 text-white focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                    />
                    <p className="text-white/50 text-xs mt-2">
                      💡 Asegúrate de elegir una fecha válida según tu edad y disponibilidad
                    </p>
                  </div>
                )}

                {!formData.fechaInicio && formData.fechaNacimiento && opcionFechaSeleccionada === 'fechas' && (
                  <p className="text-white/50 text-xs mt-3">
                    👆 Selecciona una opción para continuar
                  </p>
                )}
              </div>

              {/* Horarios Disponibles según Edad */}
              {formData.fechaInicio && formData.fechaInicio !== 'no-especificado' && horariosInfo && (
                <div className="mb-6 p-5 bg-gradient-to-br from-[#FA7B21]/10 to-[#FA7B21]/5 border-2 border-[#FA7B21]/30 rounded-xl">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">🕐</div>
                    <div className="flex-1">
                      <h4 className="text-[#FA7B21] font-bold text-lg mb-1">
                        Horarios Disponibles {horariosInfo.categoria && `- ${horariosInfo.categoria}`}
                      </h4>
                      <p className="text-white/70 text-sm">
                        Según tu edad y turno seleccionado
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-white/60 text-xs mb-1">Turno seleccionado</p>
                      <p className="text-white font-semibold text-lg">
                        {turnoSeleccionado === 'manana' ? `🌄 Mañana (${horariosInfo.horarioManana})` : `🌆 Tarde (${horariosInfo.horarioSemana})`}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-white/60 text-xs mb-1">Sábados</p>
                      <p className="text-white font-semibold text-lg">{horariosInfo.horarioSabado}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-white/60 text-xs mb-1">Días disponibles</p>
                      <p className="text-white font-semibold">{horariosInfo.diasSemana}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Días Tentativos de Asistencia */}
              {formData.fechaInicio && formData.fechaInicio !== 'no-especificado' && formData.fechaNacimiento && (
                <div className="mb-6">
                  <Label className="text-white mb-2 block text-base font-semibold">
                    2. Días Tentativos de Clases *
                  </Label>
                  <p className="text-white/60 text-sm mb-4">
                    (Solo para cálculo de fecha fin - Selecciona al menos 1 día)
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dia) => {
                      let isDisabled = false;

                      // Filtrar según turno seleccionado
                      if (turnoSeleccionado === 'manana') {
                        // Mañana: solo martes, jueves y sábado
                        isDisabled = !['Martes', 'Jueves', 'Sábado'].includes(dia);
                      } else {
                        // Tarde: según categoría
                        if (categoriaAlumno === 'Juniors') {
                          isDisabled = !['Lunes', 'Miércoles', 'Viernes'].includes(dia);
                        } else if (categoriaAlumno === 'Adolescentes') {
                          isDisabled = !['Martes', 'Jueves'].includes(dia);
                        }
                        // Para bebés y niños pequeños, todos los días están habilitados excepto domingo
                      }

                      return (
                        <label
                          key={dia}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${isDisabled
                            ? 'border-white/10 opacity-40 cursor-not-allowed bg-zinc-800/30'
                            : diasTentativos.includes(dia)
                              ? 'border-[#FA7B21] bg-[#FA7B21]/20'
                              : 'border-white/20 hover:border-[#FA7B21]/50 cursor-pointer bg-zinc-800/50'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={diasTentativos.includes(dia)}
                            onChange={(e) => handleDiaTentativoChange(dia, e.target.checked)}
                            disabled={isDisabled}
                            className="w-5 h-5 rounded border-white/20 bg-zinc-800 text-[#FA7B21] focus:ring-[#FA7B21] focus:ring-offset-0 disabled:opacity-50"
                          />
                          <span className={`text-sm font-medium ${diasTentativos.includes(dia) ? 'text-[#FA7B21]' : 'text-white'}`}>{dia}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-200 text-xs">
                      ⚠️ Importante: Estos días son solo para calcular tu fecha de fin estimada.
                      Durante el programa, puedes venir cualquier día disponible de tu categoría según tu disponibilidad.
                    </p>
                  </div>
                </div>
              )}

              {/* Fecha de Fin (Calculada Automáticamente) */}
              {diasTentativos.length >= 1 && fechaFinCalculada && (
                <div className="mb-6 p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/40 rounded-xl">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">📅</div>
                    <div className="flex-1">
                      <Label className="text-green-400 font-bold text-lg mb-1 block">
                        3. Fecha de Fin del Programa
                      </Label>
                      <p className="text-white/70 text-sm">
                        Calculada automáticamente según tus días tentativos
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-6 mb-4">
                    <p className="text-white/60 text-xs mb-2">Finalizarás aproximadamente el:</p>
                    <p className="text-white font-bold text-2xl">
                      {new Date(fechaFinCalculada).toLocaleDateString('es-PE', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Detalles de Fecha de Fin */}
                  {detallesFechaFin && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/60 text-xs mb-1">Clases totales</p>
                          <p className="text-white font-semibold text-lg">{detallesFechaFin.clasesTotales} clases</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs mb-1">Duración aproximada</p>
                          <p className="text-white font-semibold text-lg">{detallesFechaFin.semanasAproximadas} semanas</p>
                        </div>
                      </div>
                      <p className="text-green-300 text-xs mt-3">
                        ✓ Esta fecha considera feriados, cierres y tus días tentativos seleccionados
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Mensaje si faltan días tentativos */}
              {formData.fechaInicio && formData.fechaInicio !== 'no-especificado' && formData.fechaNacimiento && diasTentativos.length < 2 && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    ⏳ Selecciona al menos 2 días tentativos arriba para calcular tu fecha de fin
                  </p>
                </div>
              )}

              <div className="bg-[#FA7B21]/10 border border-[#FA7B21]/30 rounded-lg p-4">
                <p className="text-white/80 text-sm">
                  ℹ️ Todos los datos serán enviados por correo
                </p>
              </div>
            </div>

            {/* Código Promocional */}
            <div>
              <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
                Código Promocional (Opcional)
              </h3>
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Ingresa tu código"
                  value={codigoPromocional}
                  onChange={(e) => setCodigoPromocional(e.target.value.toUpperCase())}
                  className="flex-1 bg-zinc-800 border-white/20 text-white uppercase focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30"
                />
                <Button
                  type="button"
                  onClick={handleAplicarCodigo}
                  className="bg-[#FA7B21] hover:bg-[#F36A15] text-white px-6 active:scale-95"
                >
                  Aplicar
                </Button>
              </div>

              {/* Mensaje de código aplicado */}
              {codigoAplicado?.valido && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-green-400 font-semibold mb-2">
                        ✅ Código "{codigoAplicado.codigo}" aplicado
                      </p>
                      <p className="text-green-300 text-sm mb-1">
                        🎁 {codigoAplicado.descripcion}
                      </p>
                      {(codigoAplicado.tipo === 'clases_extra' || codigoAplicado.tipo === 'mes_gratis') && (
                        <p className="text-green-200 text-xs mt-2">
                          Se recalculará tu fecha de fin con las clases adicionales.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleQuitarCodigo}
                      className="text-green-300 hover:text-green-100 transition-colors ml-4"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>



            {/* Resumen de Inscripción */}
            <div className="bg-gradient-to-br from-[#FA7B21]/20 to-[#FCA929]/10 border-2 border-[#FA7B21]/30 rounded-lg p-6">
              <h3 className="text-white text-xl font-bold mb-4">📋 Resumen de tu Inscripción</h3>

              {/* Información del Programa */}
              <div className="mb-4 space-y-2 text-sm">
                <p className="text-white">
                  <strong>Programa:</strong> {NOMBRES_PROGRAMA[programa]}
                </p>
                <p className="text-white">
                  <strong>Clases incluidas:</strong> {PROGRAMA_CLASES[programa]}
                  {detallesFechaFin && detallesFechaFin.clasesTotales > PROGRAMA_CLASES[programa] && (
                    <span className="text-green-400"> + {detallesFechaFin.clasesTotales - PROGRAMA_CLASES[programa]} bonus = {detallesFechaFin.clasesTotales} total</span>
                  )}
                </p>
                {diasTentativos.length >= 2 && formData.fechaInicio !== 'no-especificado' && (
                  <p className="text-white">
                    <strong>Días tentativos:</strong> {diasTentativos.join(', ')}
                  </p>
                )}
                {formData.fechaInicio && (
                  <p className="text-white">
                    <strong>Inicio:</strong> {formData.fechaInicio === 'no-especificado' ? 'Aún no especificado' : new Date(formData.fechaInicio).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                {fechaFinCalculada && (
                  <p className="text-white">
                    <strong>Fin estimado:</strong> {new Date(fechaFinCalculada).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Bonus de Código Promocional */}
              {codigoAplicado?.valido && (codigoAplicado.tipo === 'clases_extra' || codigoAplicado.tipo === 'mes_gratis' || codigoAplicado.tipo === 'polo_gratis' || codigoAplicado.tipo === 'uniforme_gratis') && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 font-semibold text-sm mb-2">🎁 Promoción aplicada:</p>
                  <p className="text-green-300 text-xs">✓ {codigoAplicado.descripcion}</p>
                </div>
              )}

              {/* Desglose de Precios */}
              <div className="space-y-2 py-4 border-t border-white/10">
                <div className="flex justify-between text-white/80 text-sm">
                  <span>{NOMBRES_PROGRAMA[programa]}</span>
                  <span>S/ {precioBase}</span>
                </div>
                {programa === '1mes' && includeUniform && (
                  <div className="flex justify-between text-white/80 text-sm">
                    <span>Uniforme adicional {codigoAplicado?.tipo === 'uniforme_gratis' && '(GRATIS 🎁)'}</span>
                    <span className={codigoAplicado?.tipo === 'uniforme_gratis' ? 'line-through text-white/50' : ''}>
                      S/ {programa === '1mes' && includeUniform ? 220 : 0}
                    </span>
                  </div>
                )}
                {polosOption !== '0' && (
                  <div className="flex justify-between text-white/80 text-sm">
                    <span>Polos ({polosOption}) {codigoAplicado?.tipo === 'polo_gratis' && '(Descuento aplicado 🎁)'}</span>
                    <span>S/ {precioPolosAjustado}</span>
                  </div>
                )}
                {descuentoDinero > 0 && (
                  <div className="flex justify-between text-green-400 text-sm font-semibold">
                    <span>Descuento código promo</span>
                    <span>- S/ {descuentoDinero}</span>
                  </div>
                )}
                {descuentoPorcentaje > 0 && (
                  <div className="flex justify-between text-green-400 text-sm font-semibold">
                    <span>Descuento {descuentoPorcentaje}%</span>
                    <span>- S/ {descuentoPorcentualMonto}</span>
                  </div>
                )}
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-center pt-4 border-t-2 border-white/20">
                <span className="text-white text-lg font-bold">TOTAL A PAGAR:</span>
                <span className="text-[#FCA929] text-3xl font-bold">S/ {total}</span>
              </div>
            </div>

            {/* Contrato y Firma */}
            <div className="bg-zinc-800/40 rounded-2xl p-4 sm:p-5 border border-white/10">
              <ContratoFirma
                datos={{
                  nombrePadre: formData.nombrePadre,
                  dniPadre: formData.dniPadre,
                  email: formData.email,
                  telefono: formData.telefono,
                  direccion: formData.direccion,
                  nombreAlumno: formData.nombreAlumno,
                  dniAlumno: formData.dniAlumno,
                  fechaNacimiento: formData.fechaNacimiento,
                  categoriaAlumno: categoriaAlumno,
                  programa: programa === 'full' ? '3 Meses Full' : programa === '6meses' ? '6 Meses' : '1 Mes',
                  fechaInicio: formData.fechaInicio,
                  fechaFin: fechaFinCalculada || '',
                  clasesTotales: detallesFechaFin?.clasesTotales,
                  turnoSeleccionado: turnoSeleccionado === 'manana' ? 'Mañana' : 'Tarde',
                  diasTentativos: diasTentativos.join(', '),
                  precioPrograma: precioBase,
                  descuentoDinero: descuentoDinero,
                  total: total,
                }}
                onFirmaCompleta={(firma) => setFirmaBase64(firma)}
              />
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-zinc-900 border-t border-white/10">
              <Button
                type="submit"
                disabled={isSubmitting || !firmaBase64}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-5 sm:py-6 text-sm sm:text-base md:text-lg shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Enviando datos...
                  </>
                ) : (
                  'Enviar datos'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
});
