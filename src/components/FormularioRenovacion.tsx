import { useState, useCallback, memo, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { Loader2, Upload, File, Trash2, ChevronDown, ChevronRight, Check, Sparkles, Award, Calendar, Gift, Heart, Trophy, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

// ========== CONSTANTES ==========

// Feriados fijos de Perú
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
  "full": 24,
  "6meses": 48,
  "12meses_sin": 96,
  "12meses_con": 96
};

// Precios base por programa
const PRECIOS_BASE: Record<string, number> = {
  "1mes": 330,
  "full": 869,
  "6meses": 1699,
  "12meses_sin": 2999,
  "12meses_con": 3699
};

// Nombres de programas
const NOMBRES_PROGRAMA: Record<string, string> = {
  "1mes": "1 Mes",
  "full": "3 Meses Full (2 veces x semana)",
  "6meses": "6 Meses Full (2 veces x semana)",
  "12meses_sin": "12 Meses Full (Sin Implementos)",
  "12meses_con": "WOLF ELITE 365"
};

// Información de planes
const PLANES_INFO = {
  full: {
    duracion: "3 MESES",
    subtitulo: "2 VECES X SEMANA",
    precio: 869,
    beneficios: [
      "3 meses de clase 2 veces x semana",
      "Clases recuperables",
      "1 Congelamiento del programa por inasistencia o viaje",
      "Cartilla de deberes programa completo (Seguimiento del progreso)",
      "1 Graduación",
      "1 Nuevo cinturón con ceremonia",
      "2 Certificados del nuevo rango"
    ],
    icon: "🥋",
    color: "from-blue-500 to-cyan-500"
  },
  "6meses": {
    duracion: "6 MESES",
    subtitulo: "2 VECES X SEMANA",
    precio: 1699,
    beneficios: [
      "6 meses de clase 2 veces x semana",
      "Clases recuperables",
      "1 Congelamiento del programa por inasistencia o viaje",
      "Cartilla de deberes programa completo (Seguimiento del progreso)",
      "2 Graduaciones",
      "2 Nuevos cinturones con ceremonia",
      "2 Certificados del nuevo rango",
      "+ 15 días de membresía adicionales",
      "Implemento incluido: Bo Staff ⚔️ (Valor S/180)"
    ],
    icon: "⚡",
    color: "from-orange-500 to-red-500",
    popular: true
  },
  "12meses_sin": {
    duracion: "12 MESES",
    subtitulo: "",
    precio: 2999,
    beneficios: [
      "12 meses de clase 2 veces x semana",
      "Clases recuperables",
      "1 Congelamiento del programa por inasistencia o viaje",
      "Cartilla de deberes programa completo (Seguimiento del progreso)",
      "4 Graduaciones",
      "4 Nuevos cinturones con ceremonia",
      "4 Certificados del nuevo rango",
      "+ 15 días de membresía adicionales"
    ],
    icon: "💎",
    color: "from-emerald-500 to-teal-500"
  },
  "12meses_con": {
    duracion: "WOLF ELITE 365",
    subtitulo: "PROGRAMA ELITE",
    precio: 3699,
    beneficios: [], // Se manejará visualmente en columnas separadas
    icon: "👑",
    color: "from-[#FA7B21] via-[#FCA929] to-[#FA7B21]",
    destacado: "PROGRAMA ELITE"
  }
};

// Códigos promocionales
interface CodigoPromocional {
  tipo: 'descuento_dinero' | 'descuento_porcentaje' | 'clases_extra' | 'mes_gratis' | 'polo_gratis' | 'desbloquear_1mes';
  valor: number;
  descripcion: string;
  programasAplicables: string[];
  activo: boolean;
}

const CODIGOS_PROMOCIONALES: Record<string, CodigoPromocional> = {
  // Código especial para desbloquear 1 mes
  "RENOVAR1MES": {
    tipo: "desbloquear_1mes",
    valor: 0,
    descripcion: "Desbloquea el programa de 1 mes",
    programasAplicables: ["1mes"],
    activo: true
  },

  // Descuentos en dinero
  "AMAS-DESC50": {
    tipo: "descuento_dinero",
    valor: 50,
    descripcion: "Descuento de S/ 50",
    programasAplicables: ["1mes", "full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },
  "AMAS-DESC100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "Descuento de S/ 100",
    programasAplicables: ["1mes", "full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },
  "RENUEVA100": {
    tipo: "descuento_dinero",
    valor: 100,
    descripcion: "S/ 100 descuento por renovación anticipada",
    programasAplicables: ["full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },

  // Descuentos porcentuales
  "AMAS10OFF": {
    tipo: "descuento_porcentaje",
    valor: 10,
    descripcion: "10% de descuento",
    programasAplicables: ["1mes", "full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },
  "AMAS15OFF": {
    tipo: "descuento_porcentaje",
    valor: 15,
    descripcion: "15% de descuento",
    programasAplicables: ["full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  },

  // Polos gratis
  "POLO1GRATIS": {
    tipo: "polo_gratis",
    valor: 1,
    descripcion: "+1 polo oficial gratis (S/ 60)",
    programasAplicables: ["1mes", "full", "6meses", "12meses_sin", "12meses_con"],
    activo: true
  }
};

// ========== INTERFACES ==========

interface HorariosInfo {
  horarioSemana: string;
  horarioSabado: string;
  diasSemana: string;
  categoria: string;
  horarioManana: string;
}

interface CodigoAplicado {
  valido: boolean;
  tipo?: 'descuento_dinero' | 'descuento_porcentaje' | 'clases_extra' | 'mes_gratis' | 'polo_gratis' | 'desbloquear_1mes';
  valor?: number;
  descripcion?: string;
  codigo?: string;
  mensaje?: string;
}

interface FormularioRenovacionProps {
  onClose?: () => void;
  onSuccess: (total: number) => void;
}

// ========== FUNCIONES AUXILIARES ==========

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

function esCierreVacacionalAMAS(fecha: Date): boolean {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  if (mes === 12 && dia >= 20) return true;
  if (mes === 1 && dia <= 4) return true;

  return false;
}

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

function obtenerNombreDia(fecha: Date): string {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return dias[fecha.getDay()];
}

function calcularFechaFin(fechaInicio: Date, programa: string, diasTentativos: string[], clasesExtra: number = 0): {
  fechaFin: Date;
  clasesTotales: number;
  semanasAproximadas: number;
} {
  let clasesTotales = PROGRAMA_CLASES[programa] + clasesExtra;

  const fechaActual = new Date(fechaInicio);
  let clasesContadas = 1;

  while (clasesContadas < clasesTotales) {
    fechaActual.setDate(fechaActual.getDate() + 1);

    if (fechaActual.getDay() === 0) continue;
    if (esCierreVacacionalAMAS(fechaActual)) continue;

    const nombreDia = obtenerNombreDia(fechaActual);
    if (diasTentativos.includes(nombreDia)) {
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
  nombrePadre: '',
  dniPadre: '',
  direccion: '',
  email: '',
  fechaInicio: '',
  fechaFin: ''
};

export const FormularioRenovacion = memo(function FormularioRenovacion({ onSuccess, onClose }: FormularioRenovacionProps) {
  // Estados
  const [planSeleccionado, setPlanSeleccionado] = useState<'full' | '6meses' | '12meses_sin' | '12meses_con' | '1mes' | null>(null);
  const [mostrar1Mes, setMostrar1Mes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [polosOption, setPolosOption] = useState<'0' | '1' | '2' | '3'>('0');
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

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
  const [codigoExpanded, setCodigoExpanded] = useState(false);

  // Ref para scroll al formulario
  const formularioRef = useRef<HTMLDivElement>(null);

  // Verificar si hay código de desbloqueo de 1 mes
  useEffect(() => {
    if (codigoAplicado?.tipo === 'desbloquear_1mes' && codigoAplicado.valido) {
      setMostrar1Mes(true);
    }
  }, [codigoAplicado]);

  // Recalcular fechas disponibles
  useEffect(() => {
    if (formData.fechaNacimiento && planSeleccionado) {
      const todasLasFechas = obtenerFechasDisponiblesInicio();
      const horarios = calcularHorarios(formData.fechaNacimiento);

      let diasPermitidos: string[] = [];

      if (turnoSeleccionado === 'manana') {
        diasPermitidos = ['Martes', 'Jueves', 'Sábado'];
      } else {
        if (horarios.categoria === 'Juniors') {
          diasPermitidos = ['Lunes', 'Miércoles', 'Viernes'];
        } else if (horarios.categoria === 'Adolescentes') {
          diasPermitidos = ['Martes', 'Jueves'];
        } else {
          diasPermitidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        }
      }

      const fechasFiltradas = todasLasFechas.filter(fecha => {
        const nombreDia = obtenerNombreDia(fecha);
        return diasPermitidos.includes(nombreDia);
      });

      setFechasDisponibles(fechasFiltradas.slice(0, 5));
    } else if (planSeleccionado) {
      const fechas = obtenerFechasDisponiblesInicio();
      setFechasDisponibles(fechas);
    }
  }, [formData.fechaNacimiento, turnoSeleccionado, planSeleccionado]);

  // Cálculos de precio
  const precioBase = planSeleccionado ? PRECIOS_BASE[planSeleccionado] : 0;
  const preciosPolos = { '0': 0, '1': 60, '2': 110, '3': 150 };
  let precioPolosAjustado = preciosPolos[polosOption];

  let descuentoDinero = 0;
  let descuentoPorcentaje = 0;

  if (codigoAplicado?.valido && codigoAplicado.valor && codigoAplicado.tipo !== 'desbloquear_1mes') {
    if (codigoAplicado.tipo === 'descuento_dinero') {
      descuentoDinero = codigoAplicado.valor;
    } else if (codigoAplicado.tipo === 'descuento_porcentaje') {
      descuentoPorcentaje = codigoAplicado.valor;
    } else if (codigoAplicado.tipo === 'polo_gratis') {
      const valorDescuentoPolo = codigoAplicado.valor === 1 ? 60 : 110;
      precioPolosAjustado = Math.max(0, preciosPolos[polosOption] - valorDescuentoPolo);
    }
  }

  const subtotal = precioBase + precioPolosAjustado - descuentoDinero;
  const descuentoPorcentualMonto = descuentoPorcentaje > 0 ? Math.round(subtotal * (descuentoPorcentaje / 100)) : 0;
  const total = Math.max(0, subtotal - descuentoPorcentualMonto);

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

  const handleFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de archivo no válido. Use PDF, imagen o documento Word.');
      return;
    }

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setFileBase64(base64String);
      toast.success('Archivo cargado correctamente');
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setFileBase64('');
  }, []);

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

  const handleDiaTentativoChange = useCallback((dia: string, checked: boolean) => {
    setDiasTentativos(prev => {
      if (checked) {
        return [...prev, dia];
      } else {
        return prev.filter(d => d !== dia);
      }
    });
  }, []);

  const handleAplicarCodigo = useCallback(() => {
    if (!codigoPromocional.trim()) {
      toast.error('Ingrese un código promocional');
      return;
    }

    const validacion = validarCodigoPromocional(codigoPromocional, planSeleccionado || '1mes');

    if (!validacion.valido) {
      toast.error(validacion.mensaje || 'Código no válido');
      setCodigoAplicado(null);
      return;
    }

    setCodigoAplicado(validacion);

    if (validacion.tipo === 'desbloquear_1mes') {
      toast.success('✅ Programa de 1 mes desbloqueado');
    } else {
      toast.success(`✅ Código "${validacion.codigo}" aplicado exitosamente`);
    }
  }, [codigoPromocional, planSeleccionado]);

  const handleQuitarCodigo = useCallback(() => {
    setCodigoPromocional('');
    setCodigoAplicado(null);
    setMostrar1Mes(false);
    toast.info('Código promocional removido');
  }, []);

  const handleSelectPlan = useCallback((plan: 'full' | '6meses' | '12meses_sin' | '12meses_con' | '1mes') => {
    setPlanSeleccionado(plan);
    // Scroll al inicio del formulario
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, []);

  // Limpiar días tentativos cuando cambia el turno
  useEffect(() => {
    if (turnoSeleccionado && diasTentativos.length > 0) {
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
  }, [turnoSeleccionado, categoriaAlumno, diasTentativos]);

  // Effect para calcular fecha de fin
  useEffect(() => {
    if (!formData.fechaInicio || formData.fechaInicio === 'no-especificado' || diasTentativos.length < 1 || !planSeleccionado) {
      setFechaFinCalculada('');
      setDetallesFechaFin(null);
      return;
    }

    const clasesExtra = codigoAplicado?.codigo ? obtenerClasesExtraDePromo(codigoAplicado.codigo) : 0;
    const resultado = calcularFechaFin(new Date(formData.fechaInicio), planSeleccionado, diasTentativos, clasesExtra);

    setFechaFinCalculada(resultado.fechaFin.toISOString().split('T')[0]);
    setDetallesFechaFin({
      clasesTotales: resultado.clasesTotales,
      semanasAproximadas: resultado.semanasAproximadas
    });
  }, [formData.fechaInicio, diasTentativos, codigoAplicado, planSeleccionado]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!planSeleccionado) {
      toast.error('Por favor seleccione un plan');
      return;
    }

    // Validaciones básicas
    if (!formData.nombreAlumno || !formData.dniAlumno || !formData.nombrePadre || !formData.dniPadre || !formData.email || !formData.fechaInicio) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!formData.fechaNacimiento) {
      toast.error('Por favor ingrese la fecha de nacimiento del alumno');
      return;
    }

    if (formData.fechaInicio !== 'no-especificado' && diasTentativos.length < 1) {
      toast.error('Debes seleccionar al menos 1 día de asistencia por semana');
      return;
    }

    if (formData.fechaInicio !== 'no-especificado' && !fechaFinCalculada) {
      toast.error('La fecha de fin no se ha calculado correctamente. Por favor verifica los datos');
      return;
    }

    if (needsPoloSize && tallasPolos.some(talla => !talla)) {
      toast.error('Por favor seleccione todas las tallas de los polos');
      return;
    }

    if (!uploadedFile) {
      const confirm = window.confirm('No ha subido el contrato firmado. ¿Desea continuar de todas formas?');
      if (!confirm) return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        tipoFormulario: 'Renovación',
        programa: NOMBRES_PROGRAMA[planSeleccionado],
        clasesTotales: formData.fechaInicio === 'no-especificado' ? PROGRAMA_CLASES[planSeleccionado] : (detallesFechaFin?.clasesTotales || PROGRAMA_CLASES[planSeleccionado]),

        nombreAlumno: formData.nombreAlumno,
        dniAlumno: formData.dniAlumno,
        fechaNacimiento: formData.fechaNacimiento,
        categoriaAlumno: categoriaAlumno || 'No especificada',

        turnoSeleccionado: turnoSeleccionado === 'manana' ? 'Mañana' : 'Tarde',
        horariosDisponibles: horariosInfo ? {
          horarioSemana: turnoSeleccionado === 'manana' ? horariosInfo.horarioManana : horariosInfo.horarioSemana,
          horarioSabado: horariosInfo.horarioSabado,
          horarioManana: horariosInfo.horarioManana,
          horarioTarde: horariosInfo.horarioSemana,
          diasSemana: turnoSeleccionado === 'manana' ? 'Martes, Jueves y Sábado' : horariosInfo.diasSemana
        } : null,

        tallasPolos: needsPoloSize ? tallasPolos : [],

        nombrePadre: formData.nombrePadre,
        dniPadre: formData.dniPadre,
        direccion: formData.direccion,
        email: formData.email,

        polos: polosOption === '0' ? 'No' : `${polosOption} polo(s)`,
        precioPolos: preciosPolos[polosOption],

        fechaInicio: formData.fechaInicio,
        diasTentativos: formData.fechaInicio === 'no-especificado' ? 'Aún no especificado' : diasTentativos.join(', '),
        fechaFin: formData.fechaInicio === 'no-especificado' ? 'Por calcular' : fechaFinCalculada,
        semanasAproximadas: formData.fechaInicio === 'no-especificado' ? 0 : (detallesFechaFin?.semanasAproximadas || 0),

        codigoPromocional: codigoAplicado?.codigo || 'No aplicado',
        tipoDescuento: codigoAplicado?.tipo || 'ninguno',
        descuentoDinero: descuentoDinero,
        descuentoPorcentaje: descuentoPorcentaje,
        descuentoPorcentualMonto: descuentoPorcentualMonto,

        precioPrograma: precioBase,
        subtotal: subtotal,
        total: total,

        contratoFirmado: uploadedFile ? {
          nombre: uploadedFile.name,
          tipo: uploadedFile.type,
          tamaño: uploadedFile.size,
          base64: fileBase64
        } : null,

        fechaRegistro: new Date().toISOString()
      };

      const webhookUrl = 'https://pallium-n8n.s6hx3x.easypanel.host/webhook/renovaciones';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (response.ok || response.status === 200) {
        toast.success('¡Renovación registrada correctamente! Los detalles se enviarán por correo.');
        onSuccess(total);
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

  // Si no hay plan seleccionado, mostrar hero y cards de planes
  if (!planSeleccionado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 pt-24 sm:pt-28">
        {/* Hero Section Impactante */}
        <div className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-20">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#FA7B21]/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#FCA929]/15 rounded-full blur-3xl"></div>
          </div>

          <div className="relative container mx-auto px-4 lg:px-6 py-12 lg:py-20">
            {/* Hero content - Una columna centrada */}
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge superior */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FA7B21]/20 to-[#FCA929]/20 border border-[#FA7B21]/30 rounded-full px-6 py-2 mb-6">
                <Heart className="w-4 h-4 text-[#FCA929]" />
                <span className="text-white/90 text-sm font-medium">El legado de su hijo continúa</span>
              </div>

              {/* Título principal */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1]">
                <span className="bg-gradient-to-r from-[#FA7B21] via-[#FCA929] to-[#FA7B21] bg-clip-text text-transparent">
                  No Detenga la Transformación
                </span>
                <br />
                <span className="text-white drop-shadow-2xl">de Su Hijo</span>
              </h1>

              {/* Descripción */}
              <p className="text-white/90 text-xl sm:text-2xl lg:text-3xl mb-12 leading-relaxed font-light max-w-3xl mx-auto">
                Cada clase acerca más a su hijo a la mejor versión de sí mismo.
                <span className="text-[#FCA929] font-bold"> Renueve hoy</span> y continúe el camino del guerrero.
              </p>

              {/* Stats emocionales - en fila */}
              <div className="flex flex-wrap justify-center gap-6 lg:gap-12 mb-12">
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
                  <Trophy className="w-8 h-8 text-[#FCA929]" />
                  <div className="text-left">
                    <p className="text-white font-bold text-2xl">+300</p>
                    <p className="text-white/60 text-xs">Alumnos Renovados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
                  <Award className="w-8 h-8 text-[#FCA929]" />
                  <div className="text-left">
                    <p className="text-white font-bold text-2xl">10+</p>
                    <p className="text-white/60 text-xs">Años Formando</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
                  <Sparkles className="w-8 h-8 text-[#FCA929]" />
                  <div className="text-left">
                    <p className="text-white font-bold text-2xl">100%</p>
                    <p className="text-white/60 text-xs">Compromiso</p>
                  </div>
                </div>
              </div>

              {/* Elementos visuales decorativos */}
              <div className="relative mx-auto max-w-2xl">
                {/* Patrón de grid */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid grid-cols-8 gap-4 h-full">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-lg animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Círculos decorativos flotantes */}
                <div className="relative h-40 sm:h-48">
                  <div className="absolute top-0 left-1/4 w-20 h-20 bg-[#FA7B21]/30 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s' }}></div>
                  <div className="absolute top-10 right-1/4 w-16 h-16 bg-[#FCA929]/40 rounded-full blur-xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
                  <div className="absolute bottom-0 left-1/2 w-24 h-24 bg-[#FA7B21]/20 rounded-full blur-2xl animate-pulse"></div>
                </div>
              </div>

              {/* CTA visual */}
              <div className="mt-8">
                <div className="inline-flex items-center gap-3 text-white/70 text-sm animate-bounce">
                  <ChevronDown className="w-5 h-5 text-[#FCA929]" />
                  <span>Elige tu plan y renueva ahora</span>
                  <ChevronDown className="w-5 h-5 text-[#FCA929]" />
                </div>
              </div>

            </div>

            {/* Cards de planes con mejor separación */}
            <div className="max-w-7xl mx-auto mt-24 lg:mt-32">
              <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
                Elija el Plan de Renovación
              </h2>
              <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
                Seleccione el plan que mejor se adapte a los objetivos de su hijo y continúe el camino del guerrero
              </p>

              {/* Grid Inferior - 3 Columnas Ordenadas (Ahora Arriba) */}
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16">
                {/* 1. Plan 6 meses - Popular (Ahora Primero) */}
                <div
                  onClick={() => handleSelectPlan('6meses')}
                  className="relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border-2 border-[#FA7B21] rounded-2xl p-6 sm:p-8 hover:border-[#FCA929] transition-all cursor-pointer group hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-[#FA7B21]/30"
                >
                  {/* Badge Popular */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                    MÁS POPULAR
                  </div>

                  <div className="text-center mb-6 mt-4">
                    <div className="text-5xl mb-4">{PLANES_INFO["6meses"].icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-1">{PLANES_INFO["6meses"].duracion}</h3>
                    <p className="text-white/60 text-xs font-semibold tracking-wider mb-2">{PLANES_INFO["6meses"].subtitulo}</p>
                    <div className="flex items-baseline justify-center gap-2 mb-4">
                      <span className="text-4xl font-bold bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">
                        S/ {PLANES_INFO["6meses"].precio}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {PLANES_INFO["6meses"].beneficios.map((beneficio, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80 text-sm">{beneficio}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-4 text-base font-bold shadow-lg mt-auto">
                    Renovar
                  </Button>
                </div>

                {/* 2. Plan 3 meses (Ahora Segundo) */}
                <div
                  onClick={() => handleSelectPlan('full')}
                  className="relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-6 sm:p-8 hover:border-blue-500/70 transition-all cursor-pointer group hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
                >
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-4">{PLANES_INFO.full.icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-1">{PLANES_INFO.full.duracion}</h3>
                    <p className="text-white/60 text-xs font-semibold tracking-wider mb-2">{PLANES_INFO.full.subtitulo}</p>
                    <div className="flex items-baseline justify-center gap-2 mb-4">
                      <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        S/ {PLANES_INFO.full.precio}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {PLANES_INFO.full.beneficios.map((beneficio, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80 text-sm">{beneficio}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 text-base font-bold shadow-lg mt-auto">
                    Renovar
                  </Button>
                </div>

                {/* 3. Plan 12 meses - Sin Implementos (Ahora Tercero) */}
                <div
                  onClick={() => handleSelectPlan('12meses_sin')}
                  className="relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-8 hover:border-emerald-500 transition-all cursor-pointer group hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30"
                >
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-4">{PLANES_INFO["12meses_sin"].icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-1">{PLANES_INFO["12meses_sin"].duracion}</h3>
                    <p className="text-white/60 text-xs font-semibold tracking-wider mb-2 min-h-[1rem]">{PLANES_INFO["12meses_sin"].subtitulo}</p>
                    <div className="flex items-baseline justify-center gap-2 mb-4">
                      <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        S/ {PLANES_INFO["12meses_sin"].precio}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {PLANES_INFO["12meses_sin"].beneficios.map((beneficio, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80 text-sm">{beneficio}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-4 text-base font-bold shadow-lg mt-auto">
                    Renovar
                  </Button>
                </div>
              </div>

              {/* WOLF ELITE 365 - Destacado Arriba */}
              <div className="max-w-4xl mx-auto mb-16 relative">
                {/* Badge Superior */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
                </div>

                <div
                  onClick={() => handleSelectPlan('12meses_con')}
                  className="relative overflow-hidden bg-gradient-to-b from-zinc-900 to-black backdrop-blur-xl border-2 border-[#FA7B21] rounded-3xl p-8 sm:p-12 hover:border-[#FCA929] transition-all cursor-pointer group hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#FA7B21]/40"
                >
                  {/* Background effects */}
                  <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FA7B21]/20 rounded-full blur-3xl group-hover:bg-[#FA7B21]/30 transition-all duration-500"></div>
                  <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#FCA929]/10 rounded-full blur-3xl"></div>

                  <div className="relative z-10">
                    <div className="text-center mb-10">
                      <h3 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight font-bold">
                        WOLF ELITE
                        <span className="text-[#FA7B21]"> 365</span>
                      </h3>
                      <p className="text-lg text-white/80 max-w-2xl mx-auto font-light mb-6">
                        Un año completo de formación + todos los implementos + acceso de por vida al programa Leadership
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-16 mb-12">
                      {/* Columna 1 */}
                      <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                          <div className="bg-[#FA7B21]/20 p-2 rounded-lg">
                            <Trophy className="w-6 h-6 text-[#FA7B21]" />
                          </div>
                          <h4 className="text-xl font-bold text-white">Formación y Grados</h4>
                        </div>
                        <ul className="space-y-4">
                          {[
                            "96 clases al año (2x semana)",
                            "Clases recuperables",
                            "1 Congelamiento incluido",
                            "4 Graduaciones",
                            "4 Cinturones con ceremonia",
                            "4 Certificados oficiales",
                            "Cartilla de seguimiento"
                          ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FA7B21]"></div>
                              <span className="text-white/90">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Columna 2 */}
                      <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                          <div className="bg-[#FCA929]/20 p-2 rounded-lg">
                            <Gift className="w-6 h-6 text-[#FCA929]" />
                          </div>
                          <h4 className="text-xl font-bold text-white">Kit Leadership Wolf</h4>
                        </div>
                        <ul className="space-y-4">
                          {[
                            { name: "Guantes AMAS", price: "S/ 250" },
                            { name: "Zapatos AMAS", price: "S/ 250" },
                            { name: "Bo Staff", price: "S/ 180" },
                            { name: "Combat Weapon", price: "S/ 220" },
                            { name: "Nunchaku", price: "S/ 350" },
                            { name: "Parche Leadership", price: "" },
                            { name: "Acceso indefinido Leadership", price: "" }
                          ].map((item, i) => (
                            <li key={i} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-400" />
                                <span className="text-white/90">{item.name}</span>
                              </div>
                              {item.price && <span className="text-[#FCA929] text-sm font-semibold">{item.price}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Pricing Box */}
                    <div className="max-w-2xl mx-auto bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-3xl p-8 border border-white/10 text-center mb-6 relative overflow-hidden group-hover:border-[#FA7B21]/50 transition-colors shadow-2xl">
                      <div className="text-white/50 text-xl mb-2 line-through decoration-red-500/50">Valor real: S/ 4,298</div>
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-4xl sm:text-5xl font-black text-[#FCA929] font-bold tracking-tight">S/ 3,699</span>
                      </div>
                      <div className="inline-block bg-[#FA7B21]/20 text-[#FCA929] px-4 py-1 rounded-full text-sm font-bold animate-pulse">
                        Ahorra S/ 599 — Precio de lanzamiento
                      </div>
                      <p className="text-white/40 text-xs mt-4 italic">* Válido para alumnos con mínimo 3 meses de entrenamiento</p>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-4 sm:py-6 text-base sm:text-lg md:text-xl font-bold shadow-xl shadow-orange-500/20 rounded-xl group-hover:scale-[1.02] transition-transform h-auto whitespace-normal px-4 leading-tight">
                      <span className="mr-2 text-2xl">🐺</span>
                      <span>Quiero ser parte del programa Elite</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Plan 1 mes - Solo visible con código */}
              {mostrar1Mes && (
                <div className="mt-8 max-w-lg mx-auto">
                  <div className="relative bg-gradient-to-b from-green-500/10 to-green-500/5 backdrop-blur-sm border-2 border-green-500/50 rounded-2xl p-6 sm:p-8">
                    {/* Badge Código Desbloqueado */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                      🔓 CÓDIGO DESBLOQUEADO
                    </div>

                    <div className="text-center mb-6 mt-4">
                      <div className="text-5xl mb-4">⚡</div>
                      <h3 className="text-2xl font-bold text-white mb-2">1 MES</h3>
                      <div className="flex items-baseline justify-center gap-2 mb-4">
                        <span className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          S/ 330
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80 text-sm">1 mes de clase 2 veces por semana</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80 text-sm">Clases recuperables</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80 text-sm">Flexibilidad de horarios</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSelectPlan('1mes')}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-6 text-lg font-bold shadow-lg"
                    >
                      Renovar con este Plan
                    </Button>
                  </div>
                </div>
              )}

              {/* Código Promocional - Desplegable discreto */}
              <div className="mt-12 max-w-2xl mx-auto">
                <button
                  onClick={() => setCodigoExpanded(!codigoExpanded)}
                  className="w-full flex items-center justify-center gap-2 text-white/60 hover:text-white/90 transition-colors py-3 text-sm group"
                >
                  <Gift className="w-4 h-4 text-[#FCA929] group-hover:scale-110 transition-transform" />
                  <span>¿Tienes un código exclusivo?</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${codigoExpanded ? 'rotate-180' : ''}`} />
                </button>

                {codigoExpanded && (
                  <div className="mt-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        placeholder="Ingresa tu código aquí"
                        value={codigoPromocional}
                        onChange={(e) => setCodigoPromocional(e.target.value.toUpperCase())}
                        className="flex-1 bg-zinc-800 border-white/20 text-white placeholder:text-white/40 uppercase"
                      />
                      <Button
                        type="button"
                        onClick={handleAplicarCodigo}
                        disabled={!codigoPromocional.trim()}
                        className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Aplicar
                      </Button>
                    </div>

                    {codigoAplicado?.valido && (
                      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg animate-in fade-in duration-500">
                        <p className="text-green-400 font-semibold text-sm flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          {codigoAplicado.tipo === 'desbloquear_1mes'
                            ? '¡Código válido! Plan de 1 mes desbloqueado ✨'
                            : `${codigoAplicado.descripcion}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario completo cuando ya hay un plan seleccionado
  return (
    <div ref={formularioRef} className="min-h-screen bg-zinc-950 pt-24 sm:pt-28">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header con plan seleccionado */}
        <div className="bg-gradient-to-r from-[#FA7B21]/20 to-[#FCA929]/20 border border-[#FA7B21]/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/70 text-sm mb-1">Plan seleccionado:</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {NOMBRES_PROGRAMA[planSeleccionado]} - S/ {PRECIOS_BASE[planSeleccionado]}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setPlanSeleccionado(null);
                  setFormData(INITIAL_FORM_STATE);
                }}
                variant="ghost"
                className="text-white hover:text-[#FA7B21] hover:bg-white/5 transition-colors"
              >
                ← Volver a Planes
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  Salir
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del Alumno */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4 border-b border-white/10 pb-2">
              Datos del Alumno
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreAlumno" className="text-white mb-2">
                  Nombre completo *
                </Label>
                <Input
                  id="nombreAlumno"
                  value={formData.nombreAlumno}
                  onChange={(e) => handleInputChange('nombreAlumno', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
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
                  className="bg-zinc-800 border-white/20 text-white"
                  maxLength={8}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="fechaNacimiento" className="text-white mb-2">
                  Fecha de nacimiento *
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleFechaNacimientoChange(e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
                  required
                />

                {/* Mostrar horarios disponibles */}
                {horariosInfo && horariosInfo.horarioSemana && (
                  <div className="mt-4 space-y-4">
                    {/* Selector de Turno */}
                    <div className="p-4 bg-zinc-800/50 border border-[#FA7B21]/30 rounded-lg">
                      <p className="text-white font-semibold mb-3 text-sm">
                        🌅 Selecciona tu turno preferido
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setTurnoSeleccionado('manana')}
                          className={`p-3 rounded-lg border-2 transition-all ${turnoSeleccionado === 'manana'
                            ? 'border-[#FA7B21] bg-[#FA7B21]/20'
                            : 'border-white/20 hover:border-[#FA7B21]/50 bg-zinc-800/50'
                            }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">🌄</div>
                            <div className={`font-semibold text-sm ${turnoSeleccionado === 'manana' ? 'text-[#FA7B21]' : 'text-white'}`}>
                              Mañana
                            </div>
                            <div className="text-white/60 text-xs mt-1">
                              {horariosInfo.horarioManana}
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTurnoSeleccionado('tarde')}
                          className={`p-3 rounded-lg border-2 transition-all ${turnoSeleccionado === 'tarde'
                            ? 'border-[#FA7B21] bg-[#FA7B21]/20'
                            : 'border-white/20 hover:border-[#FA7B21]/50 bg-zinc-800/50'
                            }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">🌆</div>
                            <div className={`font-semibold text-sm ${turnoSeleccionado === 'tarde' ? 'text-[#FA7B21]' : 'text-white'}`}>
                              Tarde
                            </div>
                            <div className="text-white/60 text-xs mt-1">
                              {horariosInfo.horarioSemana}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Información de horarios */}
                    <div className="p-4 bg-zinc-800/50 border border-[#FA7B21]/30 rounded-lg">
                      <p className="text-white font-semibold mb-3 text-sm">
                        📍 Horarios disponibles{horariosInfo.categoria ? ` - Categoría ${horariosInfo.categoria}` : ''}
                      </p>
                      <div className="space-y-2 text-xs">
                        <p className="text-white/80">
                          <strong className="text-white">Turno seleccionado:</strong> {turnoSeleccionado === 'manana' ? `Mañana (${horariosInfo.horarioManana})` : `Tarde (${horariosInfo.horarioSemana})`}
                        </p>
                        <p className="text-white/80">
                          <strong className="text-white">Días disponibles:</strong> {turnoSeleccionado === 'manana' ? 'Martes, Jueves y Sábado' : horariosInfo.diasSemana}
                        </p>
                        <p className="text-white/80">
                          <strong className="text-white">Sábados:</strong> {horariosInfo.horarioSabado}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Datos del Padre */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4 border-b border-white/10 pb-2">
              Datos del Padre de Familia
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombrePadre" className="text-white mb-2">
                  Nombre completo *
                </Label>
                <Input
                  id="nombrePadre"
                  value={formData.nombrePadre}
                  onChange={(e) => handleInputChange('nombrePadre', e.target.value)}
                  className="bg-zinc-800 border-white/20 text-white"
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
                  className="bg-zinc-800 border-white/20 text-white"
                  maxLength={8}
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
                  className="bg-zinc-800 border-white/20 text-white"
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
                  className="bg-zinc-800 border-white/20 text-white"
                  autoComplete="street-address"
                />
              </div>
            </div>
          </div>

          {/* Polos Adicionales */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4 border-b border-white/10 pb-2">
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
                      <div className="text-white text-sm flex-1">
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

          {/* Fechas del Programa */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4 border-b border-white/10 pb-2">
              Fechas del Programa
            </h3>

            {/* Fecha de Inicio */}
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
                      className={`p-4 rounded-lg border-2 transition-all text-left ${estaSeleccionada
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
                  className={`p-4 rounded-lg border-2 transition-all text-left ${opcionFechaSeleccionada === 'no-especificado'
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
                  className={`p-4 rounded-lg border-2 transition-all text-left ${opcionFechaSeleccionada === 'otra'
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
                    className="bg-zinc-800 border-white/20 text-white"
                  />
                </div>
              )}
            </div>

            {/* Días Tentativos */}
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

                    if (turnoSeleccionado === 'manana') {
                      isDisabled = !['Martes', 'Jueves', 'Sábado'].includes(dia);
                    } else {
                      if (categoriaAlumno === 'Juniors') {
                        isDisabled = !['Lunes', 'Miércoles', 'Viernes'].includes(dia);
                      } else if (categoriaAlumno === 'Adolescentes') {
                        isDisabled = !['Martes', 'Jueves'].includes(dia);
                      }
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

            {/* Fecha de Fin (Calculada) */}
            {diasTentativos.length >= 1 && fechaFinCalculada && (
              <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/40 rounded-xl">
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
          </div>

          {/* Código Promocional */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4 border-b border-white/10 pb-2">
              Código Promocional (Opcional)
            </h3>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Ingresa tu código"
                value={codigoPromocional}
                onChange={(e) => setCodigoPromocional(e.target.value.toUpperCase())}
                className="flex-1 bg-zinc-800 border-white/20 text-white uppercase"
              />
              <Button
                type="button"
                onClick={handleAplicarCodigo}
                className="bg-[#FA7B21] hover:bg-[#F36A15] text-white"
              >
                Aplicar
              </Button>
            </div>

            {codigoAplicado?.valido && codigoAplicado.tipo !== 'desbloquear_1mes' && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-green-400 font-semibold mb-2">
                      ✅ Código "{codigoAplicado.codigo}" aplicado
                    </p>
                    <p className="text-green-300 text-sm">
                      🎁 {codigoAplicado.descripcion}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuitarCodigo}
                    className="text-green-300 hover:text-green-100 transition-colors ml-4"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contrato Firmado */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <button
              type="button"
              onClick={() => setContratoExpanded(!contratoExpanded)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="text-white text-lg font-semibold">
                Contrato Firmado (Opcional)
              </h3>
              {contratoExpanded ? (
                <ChevronDown className="w-5 h-5 text-white/60" />
              ) : (
                <ChevronRight className="w-5 h-5 text-white/60" />
              )}
            </button>

            {contratoExpanded && (
              <div className="mt-4">
                <p className="text-white/60 text-sm mb-4">
                  Si ya tienes el contrato firmado físicamente, puedes subirlo aquí:
                </p>

                {!uploadedFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-[#FA7B21]/50 transition-colors bg-zinc-800/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-white/40" />
                      <p className="mb-2 text-sm text-white/60">
                        <span className="font-semibold">Click para subir</span> o arrastra aquí
                      </p>
                      <p className="text-xs text-white/40">PDF, JPG, PNG (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-[#FA7B21]/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-8 h-8 text-[#FCA929]" />
                      <div>
                        <p className="text-white text-sm">{uploadedFile.name}</p>
                        <p className="text-white/40 text-xs">
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-white/60 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="bg-gradient-to-br from-[#FA7B21]/20 to-[#FCA929]/10 border-2 border-[#FA7B21]/30 rounded-xl p-6">
            <h3 className="text-white text-xl font-bold mb-4">📋 Resumen de tu Renovación</h3>

            <div className="space-y-2 py-4 border-t border-white/10">
              <div className="flex justify-between text-white/80 text-sm">
                <span>{NOMBRES_PROGRAMA[planSeleccionado]}</span>
                <span>S/ {precioBase}</span>
              </div>
              {polosOption !== '0' && (
                <div className="flex justify-between text-white/80 text-sm">
                  <span>Polos ({polosOption})</span>
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

            <div className="flex justify-between items-center pt-4 border-t-2 border-white/20">
              <span className="text-white text-lg font-bold">TOTAL A PAGAR:</span>
              <span className="text-[#FCA929] text-3xl font-bold">S/ {total}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-6 text-lg shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando datos...
              </>
            ) : (
              'Confirmar Renovación'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
});
