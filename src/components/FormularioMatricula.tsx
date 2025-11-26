import { useState, useCallback, memo, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { X, Loader2, Upload, File, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';

// ========== CONSTANTES ==========

// Feriados fijos de Perú
const FERIADOS_FIJOS_PERU = [
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
  "full": 24 // 3 meses
};

// Precios base por programa
const PRECIOS_BASE: Record<string, number> = {
  "1mes": 330,
  "full": 869
};

// Nombres de programas
const NOMBRES_PROGRAMA: Record<string, string> = {
  "1mes": "Programa 1 Mes",
  "full": "Programa 3 Meses FULL"
};

// Códigos promocionales
interface CodigoPromocional {
  tipo: 'descuento_dinero' | 'clases_extra' | 'mes_gratis' | 'polo_gratis';
  valor: number;
  descripcion: string;
  programasAplicables: string[];
  activo: boolean;
}

const CODIGOS_PROMOCIONALES: Record<string, CodigoPromocional> = {
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

interface HorariosInfo {
  horarioSemana: string;
  horarioSabado: string;
  diasSemana: string;
  categoria: string;
}

interface CodigoAplicado {
  valido: boolean;
  tipo?: 'descuento_dinero' | 'clases_extra' | 'mes_gratis' | 'polo_gratis';
  valor?: number;
  descripcion?: string;
  codigo?: string;
  mensaje?: string;
}

interface FormularioMatriculaProps {
  isOpen: boolean;
  onClose: () => void;
  programa: 'full' | '1mes';
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
  if (mes === 1 && dia <= 3) return true;

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
  if (promo.tipo === "mes_gratis") return 8;
  return 0;
}

const INITIAL_FORM_STATE = {
  nombreAlumno: '',
  dniAlumno: '',
  fechaNacimiento: '',
  tallaUniforme: '',
  nombrePadre: '',
  dniPadre: '',
  direccion: '',
  email: '',
  fechaInicio: '',
  fechaFin: ''
};

export const FormularioMatricula = memo(function FormularioMatricula({ isOpen, onClose, programa, onSuccess }: FormularioMatriculaProps) {
  // Estados existentes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [polosOption, setPolosOption] = useState<'0' | '1' | '2' | '3'>('0');
  const [includeUniform, setIncludeUniform] = useState(false);
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
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

  // Recalcular fechas disponibles cuando cambia la fecha de nacimiento
  useEffect(() => {
    if (isOpen && formData.fechaNacimiento) {
      const todasLasFechas = obtenerFechasDisponiblesInicio();
      const horarios = calcularHorarios(formData.fechaNacimiento);

      // Filtrar fechas según categoría del alumno
      let diasPermitidos: string[] = [];
      if (horarios.categoria === 'Juniors') {
        diasPermitidos = ['Lunes', 'Miércoles', 'Viernes', 'Sábado'];
      } else if (horarios.categoria === 'Adolescentes') {
        diasPermitidos = ['Martes', 'Jueves', 'Sábado'];
      } else {
        // Para bebés y niños pequeños, todos los días excepto domingo
        diasPermitidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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
  }, [isOpen, formData.fechaNacimiento]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all form state
      setFormData(INITIAL_FORM_STATE);
      setPolosOption('0');
      setIncludeUniform(false);
      setTallasPolos([]);
      setUploadedFile(null);
      setFileBase64('');
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
    }
  }, [isOpen]);

  // Cálculos de precio
  const precioBase = PRECIOS_BASE[programa];
  const preciosPolos = { '0': 0, '1': 60, '2': 110, '3': 150 };
  const precioUniforme = programa === '1mes' && includeUniform ? 220 : 0;

  // Calcular descuento de código promocional
  let descuentoDinero = 0;
  if (codigoAplicado?.valido && codigoAplicado.tipo === 'descuento_dinero' && codigoAplicado.valor) {
    descuentoDinero = codigoAplicado.valor;
  }

  const total = precioBase + preciosPolos[polosOption] + precioUniforme - descuentoDinero;

  const needsUniformSize = programa === 'full' || (programa === '1mes' && includeUniform);
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

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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

  // Effect para calcular fecha de fin automáticamente
  useEffect(() => {
    if (!formData.fechaInicio || diasTentativos.length < 2) {
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
    if (!formData.nombreAlumno || !formData.dniAlumno || !formData.nombrePadre || !formData.dniPadre || !formData.email || !formData.fechaInicio) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar fecha de nacimiento
    if (!formData.fechaNacimiento) {
      toast.error('Por favor ingrese la fecha de nacimiento del alumno');
      return;
    }

    // Validar días tentativos (mínimo 2)
    if (diasTentativos.length < 2) {
      toast.error('Debes seleccionar al menos 2 días de asistencia por semana');
      return;
    }

    // Validar que la fecha de fin se haya calculado
    if (!fechaFinCalculada) {
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

    if (!uploadedFile) {
      const confirm = window.confirm('No ha subido el contrato firmado. ¿Desea continuar de todas formas?');
      if (!confirm) return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        programa: programa === 'full' ? '3 Meses Full' : '1 Mes',
        nombreAlumno: formData.nombreAlumno,
        dniAlumno: formData.dniAlumno,
        fechaNacimiento: formData.fechaNacimiento,
        categoriaAlumno: categoriaAlumno || 'No especificada',
        horariosDisponibles: horariosInfo ? {
          horarioSemana: horariosInfo.horarioSemana,
          horarioSabado: horariosInfo.horarioSabado,
          diasSemana: horariosInfo.diasSemana
        } : null,
        tallaUniforme: needsUniformSize ? formData.tallaUniforme : 'No aplica',
        tallasPolos: needsPoloSize ? tallasPolos : [],
        nombrePadre: formData.nombrePadre,
        dniPadre: formData.dniPadre,
        direccion: formData.direccion,
        email: formData.email,
        polos: polosOption === '0' ? 'No' : `${polosOption} polo(s)`,
        precioPolos: preciosPolos[polosOption],
        uniformeAdicional: programa === '1mes' ? (includeUniform ? 'Sí' : 'No') : 'Incluido',
        precioUniforme: precioUniforme,
        fechaInicio: formData.fechaInicio,
        diasTentativos: diasTentativos.join(', '),
        fechaFin: fechaFinCalculada,
        clasesTotales: detallesFechaFin?.clasesTotales || PROGRAMA_CLASES[programa],
        semanasAproximadas: detallesFechaFin?.semanasAproximadas || 0,
        codigoPromocional: codigoAplicado?.codigo || 'No aplicado',
        descuentoAplicado: descuentoDinero,
        precioPrograma: precioBase,
        total: total,
        contratoFirmado: uploadedFile ? {
          nombre: uploadedFile.name,
          tipo: uploadedFile.type,
          tamaño: uploadedFile.size,
          base64: fileBase64
        } : null,
        fechaRegistro: new Date().toISOString()
      };

      const webhookUrl = programa === 'full' 
        ? 'https://pallium-n8n.s6hx3x.easypanel.host/webhook/programa3meses'
        : 'https://pallium-n8n.s6hx3x.easypanel.host/webhook/mensual';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (response.ok || response.status === 200) {
        toast.success('¡Datos enviados correctamente! La fecha de vencimiento se enviará por correo.');
        onSuccess(total);
        onClose();
        
        // Reset form
        setFormData({
          nombreAlumno: '',
          dniAlumno: '',
          fechaNacimiento: '',
          tallaUniforme: '',
          nombrePadre: '',
          dniPadre: '',
          direccion: '',
          email: '',
          fechaInicio: '',
          fechaFin: ''
        });
        setPolosOption('0');
        setTallasPolos([]);
        setIncludeUniform(false);
        setUploadedFile(null);
        setFileBase64('');
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
        className="bg-zinc-900 border-2 border-[#FA7B21]/30 w-full max-w-[calc(100%-2rem)] sm:max-w-[95vw] md:max-w-4xl p-0 m-4 sm:m-6"
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
                {programa === 'full' ? '3 Meses Full (S/ 869)' : '1 Mes (S/ 330)'}
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
        <div className="px-4 sm:px-6 py-4 sm:py-6 pb-6 sm:pb-8">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Datos del Alumno */}
          <div>
            <h3 className="text-white text-lg mb-4 border-b border-white/10 pb-2">
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
              <div>
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

                {/* Mostrar horarios disponibles después de ingresar fecha de nacimiento */}
                {horariosInfo && (
                  <div className="mt-4 p-4 bg-zinc-800/50 border border-[#FA7B21]/30 rounded-lg">
                    <p className="text-white font-semibold mb-3 text-sm sm:text-base">
                      📍 Horarios disponibles{horariosInfo.categoria ? ` - Categoría ${horariosInfo.categoria}` : ''}
                    </p>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p className="text-white/80">
                        <strong className="text-white">Lunes a Viernes:</strong> {horariosInfo.horarioSemana}
                      </p>
                      <p className="text-white/80">
                        <strong className="text-white">Días disponibles:</strong> {horariosInfo.diasSemana}
                      </p>
                      <p className="text-white/80">
                        <strong className="text-white">Sábados:</strong> {horariosInfo.horarioSabado}
                      </p>
                      <p className="text-white/60 text-xs mt-3">
                        ℹ️ Podrás asistir cualquier día dentro de estos horarios según tu disponibilidad.
                      </p>
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

          {/* Talla de uniforme para programa 3 meses */}
          {programa === 'full' && (
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
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        polosOption === option.value ? 'border-[#FA7B21] bg-[#FA7B21]/10' : 'border-white/20 hover:border-white/30'
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
                  const estaSeleccionada = formData.fechaInicio === fechaStr;
                  const nombreDia = obtenerNombreDia(fecha);
                  const diaNumero = fecha.getDate();
                  const mes = fecha.toLocaleDateString('es-PE', { month: 'long' });

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleInputChange('fechaInicio', fechaStr)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        estaSeleccionada
                          ? 'border-[#FA7B21] bg-[#FA7B21]/20'
                          : 'border-white/20 hover:border-white/40 bg-zinc-800/50 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          estaSeleccionada ? 'bg-[#FA7B21] text-white' : 'bg-zinc-700 text-white/80'
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
              </div>
              {!formData.fechaInicio && formData.fechaNacimiento && (
                <p className="text-white/50 text-xs mt-3">
                  👆 Selecciona una fecha para continuar
                </p>
              )}
            </div>

            {/* Horarios Disponibles según Edad */}
            {formData.fechaInicio && horariosInfo && (
              <div className="mb-6 p-5 bg-gradient-to-br from-[#FA7B21]/10 to-[#FA7B21]/5 border-2 border-[#FA7B21]/30 rounded-xl">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-3xl">🕐</div>
                  <div className="flex-1">
                    <h4 className="text-[#FA7B21] font-bold text-lg mb-1">
                      Horarios Disponibles {horariosInfo.categoria && `- ${horariosInfo.categoria}`}
                    </h4>
                    <p className="text-white/70 text-sm">
                      Según tu edad, estos son tus horarios de clase
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-white/60 text-xs mb-1">Lunes a Viernes</p>
                    <p className="text-white font-semibold text-lg">{horariosInfo.horarioSemana}</p>
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
            {formData.fechaInicio && formData.fechaNacimiento && (
              <div className="mb-6">
                <Label className="text-white mb-2 block text-base font-semibold">
                  2. Días Tentativos de Clases *
                </Label>
                <p className="text-white/60 text-sm mb-4">
                  (Solo para cálculo de fecha fin - Selecciona al menos 2 días)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dia) => {
                    let isDisabled = false;
                    if (categoriaAlumno === 'Juniors') {
                      isDisabled = !['Lunes', 'Miércoles', 'Viernes', 'Sábado'].includes(dia);
                    } else if (categoriaAlumno === 'Adolescentes') {
                      isDisabled = !['Martes', 'Jueves', 'Sábado'].includes(dia);
                    }

                    return (
                      <label
                        key={dia}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          isDisabled
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
            {diasTentativos.length >= 2 && fechaFinCalculada && (
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
            {formData.fechaInicio && formData.fechaNacimiento && diasTentativos.length < 2 && (
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
                className="flex-1 bg-zinc-800 border-white/20 text-white uppercase"
              />
              <Button
                type="button"
                onClick={handleAplicarCodigo}
                className="bg-[#FA7B21] hover:bg-[#F36A15] text-white px-6"
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

          {/* File Upload Section - Collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setContratoExpanded(!contratoExpanded)}
              className="w-full flex items-center justify-between p-4 bg-zinc-800/30 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
            >
              <h3 className="text-white text-lg">
                Contrato Firmado (Opcional)
              </h3>
              {contratoExpanded ? (
                <ChevronDown className="w-5 h-5 text-white/60" />
              ) : (
                <ChevronRight className="w-5 h-5 text-white/60" />
              )}
            </button>

            {contratoExpanded && (
              <div className="mt-4 p-4 bg-zinc-800/20 border border-white/10 rounded-lg">
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
                      style={{
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <p className="mt-4 text-white/50 text-xs p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  ℹ️ No es necesario subirlo ahora. Recibirás un email para firmarlo digitalmente después del pago.
                </p>
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
              {diasTentativos.length >= 2 && (
                <p className="text-white">
                  <strong>Días tentativos:</strong> {diasTentativos.join(', ')}
                </p>
              )}
              {formData.fechaInicio && (
                <p className="text-white">
                  <strong>Inicio:</strong> {new Date(formData.fechaInicio).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {fechaFinCalculada && (
                <p className="text-white">
                  <strong>Fin estimado:</strong> {new Date(fechaFinCalculada).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Bonus de Código Promocional */}
            {codigoAplicado?.valido && (codigoAplicado.tipo === 'clases_extra' || codigoAplicado.tipo === 'mes_gratis' || codigoAplicado.tipo === 'polo_gratis') && (
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
                  <span>Uniforme adicional</span>
                  <span>S/ {precioUniforme}</span>
                </div>
              )}
              {polosOption !== '0' && (
                <div className="flex justify-between text-white/80 text-sm">
                  <span>Polos ({polosOption})</span>
                  <span>S/ {preciosPolos[polosOption]}</span>
                </div>
              )}
              {descuentoDinero > 0 && (
                <div className="flex justify-between text-green-400 text-sm font-semibold">
                  <span>Descuento código promo</span>
                  <span>- S/ {descuentoDinero}</span>
                </div>
              )}
            </div>

            {/* Total Final */}
            <div className="flex justify-between items-center pt-4 border-t-2 border-white/20">
              <span className="text-white text-lg font-bold">TOTAL A PAGAR:</span>
              <span className="text-[#FCA929] text-3xl font-bold">S/ {total}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-zinc-900 border-t border-white/10">
            <Button
              type="submit"
              disabled={isSubmitting}
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