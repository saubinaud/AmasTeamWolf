import { useState, useEffect, useMemo, useCallback } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { ChevronDown, Award, Clock, User, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface GraduacionPageProps {
  onNavigate: (page: string) => void;
}

interface GraduadoRaw {
  row_number?: number;
  NOMBRE?: string;
  nombre?: string;
  Nombre?: string;
  APELLIDO?: string;
  apellido?: string;
  Apellido?: string;
  RANGO?: string;
  rango?: string;
  Rango?: string;
  HORARIO?: string;
  horario?: string;
  Horario?: string;
  TURNO?: string;
  turno?: string;
  Turno?: string;
  FECHA?: string;
  fecha?: string;
  Fecha?: string;
  [key: string]: any;
}

interface Graduado {
  row_number: number;
  NOMBRE: string;
  APELLIDO: string;
  RANGO: string;
  HORARIO: string;
  TURNO: string;
  FECHA: string;
}

// Utilidades de normalización
const normalizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  return text.trim();
};

const capitalizeWords = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const normalizeTurno = (turno: string | undefined | null): string => {
  if (!turno) return 'Sin especificar';
  
  const turnoLower = turno.toLowerCase().trim();
  
  if (turnoLower.includes('primer')) return 'Primer Turno';
  if (turnoLower.includes('segundo')) return 'Segundo Turno';
  if (turnoLower.includes('tercer')) return 'Tercer Turno';
  if (turnoLower.includes('cuarto')) return 'Cuarto Turno';
  
  // Si no coincide con ningún patrón, capitalizar la primera letra de cada palabra
  return capitalizeWords(turno);
};

const getFieldValue = (obj: GraduadoRaw, ...possibleKeys: string[]): string => {
  for (const key of possibleKeys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return String(obj[key]);
    }
  }
  return '';
};

const normalizeGraduado = (raw: GraduadoRaw): Graduado => {
  const nombre = getFieldValue(raw, 'NOMBRE', 'nombre', 'Nombre');
  const apellido = getFieldValue(raw, 'APELLIDO', 'apellido', 'Apellido');
  const rango = getFieldValue(raw, 'RANGO', 'rango', 'Rango');
  const horario = getFieldValue(raw, 'HORARIO', 'horario', 'Horario');
  const turno = getFieldValue(raw, 'TURNO', 'turno', 'Turno');
  const fecha = getFieldValue(raw, 'FECHA', 'fecha', 'Fecha');
  
  return {
    row_number: raw.row_number || 0,
    NOMBRE: capitalizeWords(normalizeText(nombre)),
    APELLIDO: capitalizeWords(normalizeText(apellido)),
    RANGO: normalizeText(rango),
    HORARIO: normalizeText(horario),
    TURNO: normalizeTurno(turno),
    FECHA: normalizeText(fecha)
  };
};

// Detectar si es móvil
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

// Detectar si el usuario prefiere movimiento reducido
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export function GraduacionPage({ onNavigate }: GraduacionPageProps) {
  const [graduados, setGraduados] = useState<Graduado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    comentario: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Detectar móvil y preferencias de movimiento
  useEffect(() => {
    // Scroll al inicio de la página cuando se monta el componente
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    setIsMobileDevice(isMobile());
    setReduceMotion(prefersReducedMotion());
    
    const handleResize = () => {
      setIsMobileDevice(isMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch graduados on mount
  useEffect(() => {
    fetchGraduados();
  }, []);

  const fetchGraduados = async () => {
    setIsLoading(true);
    try {
      const url = 'https://pallium-n8n.s6hx3x.easypanel.host/webhook/graduaci%C3%B3n';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verificar si el webhook está en modo "workflow started"
      if (data && data.message === "Workflow was started") {
        console.log('El webhook está configurado para iniciar un workflow.');
        setGraduados([]);
        toast.error('El webhook no está configurado para devolver datos.');
        return;
      }
      
      let rawGraduados: GraduadoRaw[] = [];
      
      // Validar y extraer datos
      if (Array.isArray(data)) {
        rawGraduados = data;
      } else if (data && typeof data === 'object') {
        const arrayData = Object.values(data).find(val => Array.isArray(val));
        if (arrayData) {
          rawGraduados = arrayData as GraduadoRaw[];
        }
      }
      
      // Normalizar todos los graduados
      const normalizedGraduados = rawGraduados
        .filter(raw => {
          // Filtrar entradas sin datos válidos
          const hasNombre = getFieldValue(raw, 'NOMBRE', 'nombre', 'Nombre');
          const hasApellido = getFieldValue(raw, 'APELLIDO', 'apellido', 'Apellido');
          return hasNombre && hasApellido;
        })
        .map(normalizeGraduado);
      
      setGraduados(normalizedGraduados);
      
      if (normalizedGraduados.length > 0) {
        console.log('✅ Graduados normalizados:', normalizedGraduados.length);
        toast.success(`${normalizedGraduados.length} graduados cargados correctamente`);
      } else {
        toast.error('No se encontraron datos válidos de graduados.');
      }
      
    } catch (error) {
      console.error('Error fetching graduados:', error);
      setGraduados([]);
      toast.error('Error al conectar con el servidor. Por favor intente más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.apellido || !formData.comentario) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/correcion-graduacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al enviar comentario');
      
      setSubmitSuccess(true);
      setFormData({ nombre: '', apellido: '', comentario: '' });
      toast.success('¡Gracias! Tu comentario ha sido enviado correctamente.');
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Error al enviar el comentario. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  // Agrupar y ordenar graduados - optimizado con useMemo
  const { graduadosPorTurno, turnosOrdenados } = useMemo(() => {
    const porTurno = graduados.reduce((acc, graduado) => {
      const turno = graduado.TURNO || 'Sin especificar';
      if (!acc[turno]) {
        acc[turno] = [];
      }
      acc[turno].push(graduado);
      return acc;
    }, {} as Record<string, Graduado[]>);

    const ordenTurnos = ['Primer Turno', 'Segundo Turno', 'Tercer Turno', 'Cuarto Turno'];
    const ordenados = Object.keys(porTurno).sort((a, b) => {
      const indexA = ordenTurnos.indexOf(a);
      const indexB = ordenTurnos.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    return { graduadosPorTurno: porTurno, turnosOrdenados: ordenados };
  }, [graduados]);

  // Funciones de estilo - optimizadas con useCallback
  const getTurnoGradient = useCallback((turno: string) => {
    if (!turno) return 'from-zinc-400 to-zinc-500';
    
    const turnoLower = turno.toLowerCase();
    
    if (turnoLower.includes('primer')) return 'from-[#FA7B21] to-[#FCA929]';
    if (turnoLower.includes('segundo')) return 'from-[#007BFF] to-[#0056b3]';
    if (turnoLower.includes('tercer')) return 'from-[#28a745] to-[#218838]';
    if (turnoLower.includes('cuarto')) return 'from-[#6c757d] to-[#545b62]';
    
    return 'from-zinc-400 to-zinc-500';
  }, []);

  const scrollToGraduados = useCallback(() => {
    const element = document.getElementById('graduados-section');
    element?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }, [reduceMotion]);

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl border-2 border-white/10 overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
          </div>
        </div>
        <div className="h-10 bg-white/10 rounded-full w-2/3" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Advanced Gradient Background - Optimizado para móviles */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        {!isMobileDevice && (
          <>
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(circle at 20% 50%, rgba(250, 123, 33, 0.15) 0%, transparent 50%)'
              }}
            />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'radial-gradient(circle at 80% 50%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)'
              }}
            />
          </>
        )}
      </div>

      <div className="relative z-10">
        <HeaderMain 
          onNavigate={onNavigate}
          onOpenMatricula={() => {}}
          onCartClick={() => {}}
          cartItemsCount={0}
        />

        {/* Hero Section */}
        <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 overflow-hidden">
          <div className="container mx-auto max-w-6xl text-center">
            {/* Decorative elements - Solo en desktop */}
            {!isMobileDevice && (
              <>
                <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#FA7B21]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#FCA929]/10 rounded-full blur-3xl" />
              </>
            )}
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                <Award className="w-4 h-4 text-[#FCA929]" />
                <span className="text-xs sm:text-sm text-white/80">Ceremonia de Graduación</span>
              </div>
              
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6 px-4"
                style={{
                  background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Graduaciones AMAS Team Wolf 🐺
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-white/70 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                Consulta aquí los resultados actualizados de nuestras ceremonias de graduación. Después de los horarios, encontrarás un formulario para dudas o correcciones y respuestas para preguntas frecuentes.
              </p>
              
              <Button 
                onClick={scrollToGraduados}
                className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:opacity-90 text-white px-6 sm:px-8 py-5 sm:py-6 rounded-xl transition-opacity"
              >
                Ver graduados
                <ChevronDown className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Fecha de Graduación Section */}
        {!isLoading && graduados.length > 0 && graduados[0].FECHA && (
          <section className="py-8 px-4">
            <div className="container mx-auto max-w-4xl">
              <div className="relative bg-gradient-to-br from-[#FA7B21]/10 to-[#FCA929]/10 backdrop-blur-sm rounded-2xl border-2 border-[#FA7B21]/30 p-6 sm:p-8 overflow-hidden group hover:border-[#FA7B21]/50 transition-all duration-300">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FA7B21]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                    <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <p className="text-sm sm:text-base text-[#FCA929] mb-1">
                      Fecha de la Graduación
                    </p>
                    <p className="text-2xl sm:text-3xl text-white">
                      {graduados[0].FECHA}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Graduados Section */}
        <section id="graduados-section" className="py-8 sm:py-16 px-4">
          <div className="container mx-auto max-w-7xl">
            {isLoading ? (
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#FA7B21] animate-spin mb-4" />
                  <p className="text-white/60 text-sm sm:text-base">Cargando graduados...</p>
                </div>
                {/* Skeleton cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
              </div>
            ) : graduados.length === 0 ? (
              <div className="text-center py-20">
                <Award className="w-12 h-12 sm:w-16 sm:h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-sm sm:text-base">No hay graduados para mostrar en este momento.</p>
              </div>
            ) : (
              turnosOrdenados.map(turno => (
                <div key={turno} className="mb-12 sm:mb-16">
                  <h2 className="text-xl sm:text-2xl md:text-3xl text-white mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-[#FCA929] flex-shrink-0" />
                    <span className="break-words">{turno}</span>
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {graduadosPorTurno[turno].map((graduado, index) => {
                      const cardIndex = `${turno}-${index}`;
                      const isExpanded = expandedCard === parseInt(cardIndex.replace(/\D/g, '') + index);
                      
                      return (
                        <div
                          key={cardIndex}
                          className={`relative bg-black/40 ${!isMobileDevice ? 'backdrop-blur-md' : 'backdrop-blur-sm'} rounded-xl sm:rounded-2xl shadow-lg transition-all overflow-hidden group cursor-pointer border-2 border-[#FA7B21]/40 hover:border-[#FA7B21] ${
                            !reduceMotion && !isMobileDevice ? 'hover:shadow-2xl hover:-translate-y-2 duration-500' : 'duration-300'
                          }`}
                          onClick={() => setExpandedCard(isExpanded ? null : parseInt(cardIndex.replace(/\D/g, '') + index))}
                        >
                          {/* Gradient overlay on hover - Solo en desktop */}
                          {!isMobileDevice && (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#FA7B21]/10 to-[#FCA929]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          )}
                          
                          <div className="relative p-4 sm:p-6">
                            {/* Top colored bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r ${getTurnoGradient(graduado.TURNO)}`} />
                            
                            {/* Header */}
                            <div className="mb-4 sm:mb-5">
                              <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center flex-shrink-0">
                                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <h3 className="text-base sm:text-xl text-white truncate">
                                      {graduado.NOMBRE}
                                    </h3>
                                  </div>
                                  <p className="text-sm sm:text-base text-white/90 ml-10 sm:ml-13 truncate">
                                    {graduado.APELLIDO}
                                  </p>
                                </div>
                                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                                  reduceMotion ? 'duration-150' : 'duration-300'
                                } ${
                                  isExpanded 
                                    ? 'bg-gradient-to-br from-[#FA7B21] to-[#FCA929] text-white rotate-180' 
                                    : 'bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white'
                                }`}>
                                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                              </div>
                              
                              {/* Horario */}
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60 ml-10 sm:ml-13">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{graduado.HORARIO}</span>
                              </div>
                            </div>
                            
                            {/* Rango badge - Diseño pastilla mejorado */}
                            <div className={`relative inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] transition-all ${
                              !isMobileDevice ? 'shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 group-hover:scale-[1.02] duration-300' : 'shadow-md duration-200'
                            } max-w-full`}>
                              {!isMobileDevice && (
                                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white relative z-10 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-white relative z-10 truncate">
                                {graduado.RANGO}
                              </span>
                            </div>
                            
                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className={`mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-white/10 space-y-3 sm:space-y-4 ${
                                !reduceMotion ? 'animate-in fade-in slide-in-from-top-4 duration-500' : ''
                              }`}>
                                {/* Turno info */}
                                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#FA7B21]/20 to-[#FCA929]/20 flex items-center justify-center border border-[#FA7B21]/30 flex-shrink-0">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FCA929]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white/50 mb-0.5 sm:mb-1">Turno</p>
                                    <p className="text-sm text-white truncate">{graduado.TURNO}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Comentarios Section */}
        <section className="py-12 sm:py-16 px-4 bg-zinc-900/50">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 sm:mb-4 px-4">
                ¿Tiene alguna corrección o comentario?
              </h2>
              <p className="text-white/60 text-sm sm:text-base px-4">
                Rellene el siguiente formulario y envíenos su observación.
              </p>
            </div>

            <form onSubmit={handleSubmitComment} className={`bg-white/5 ${!isMobileDevice ? 'backdrop-blur-sm' : ''} border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8`}>
              <div className="space-y-4 sm:space-y-6">
                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-white mb-2 text-sm sm:text-base">
                    Nombre del Alumno
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FCA929] transition-colors text-sm sm:text-base"
                    placeholder="Ingrese su nombre"
                    required
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label htmlFor="apellido" className="block text-white mb-2 text-sm sm:text-base">
                    Apellido del Alumno
                  </label>
                  <input
                    id="apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FCA929] transition-colors text-sm sm:text-base"
                    placeholder="Ingrese su apellido"
                    required
                  />
                </div>

                {/* Correo */}
                <div>
                  <label htmlFor="correo" className="block text-white mb-2 text-sm sm:text-base">
                    Correo (opcional)
                  </label>
                  <input
                    id="correo"
                    type="text"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FCA929] transition-colors text-sm sm:text-base"
                    placeholder="Ingresa tu correo"
                    required
                  />
                </div>

                {/* Comentario */}
                <div>
                  <label htmlFor="comentario" className="block text-white mb-2 text-sm sm:text-base">
                    Comentario adicional
                  </label>
                  <textarea
                    id="comentario"
                    value={formData.comentario}
                    onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FCA929] transition-colors min-h-[100px] sm:min-h-[120px] resize-y text-sm sm:text-base"
                    placeholder="Escriba su comentario u observación aquí..."
                    required
                  />
                </div>

                {/* Success Message */}
                {submitSuccess && (
                  <div className="p-3 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-400 text-xs sm:text-sm">
                      ✅ ¡Gracias! Tu comentario ha sido enviado correctamente.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:opacity-90 text-white py-5 sm:py-6 rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar comentario'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Preguntas Frecuentes Section */}
        <section className="py-12 sm:py-16 px-4 bg-black/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-[#FA7B21]/10 border border-[#FA7B21]/30 rounded-full">
                <span className="text-2xl">💬</span>
                <span className="text-xs sm:text-sm text-[#FCA929] uppercase tracking-wider">FAQ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl text-white mb-3 sm:mb-4 px-4">
                Preguntas Frecuentes
              </h2>
              <p className="text-white/60 text-sm sm:text-base px-4">
                Encuentra respuestas a las consultas más comunes sobre las graduaciones
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Pregunta 1 */}
              <div className={`bg-white/5 ${!isMobileDevice ? 'backdrop-blur-sm' : ''} border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:border-[#FA7B21]/30 transition-colors duration-300`}>
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl flex-shrink-0">📋</span>
                  <h3 className="text-base sm:text-lg md:text-xl text-white">
                    ¿Por qué mi hijo/a no aparece en la lista de graduación?
                  </h3>
                </div>
                <div className="ml-8 sm:ml-12 space-y-3 sm:space-y-4 text-sm sm:text-base text-white/80 leading-relaxed">
                  <p>
                    La participación en cada ceremonia de graduación se determina según la <span className="text-[#FCA929]">contabilidad de clases tomadas dentro de su periodo activo</span>, que normalmente va entre <span className="text-[#FCA929]">12 a 14 clases efectivas</span>, o por la <span className="text-[#FCA929]">fecha próxima de vencimiento de su programa</span>.
                  </p>
                  <p>
                    En caso no haya sido convocado en esta oportunidad, no se preocupe 💛
                  </p>
                  <p>
                    Tendremos más fechas de graduación, donde serán incluidos los alumnos conforme cumplan con el requerimiento.
                  </p>
                </div>
              </div>

              {/* Pregunta 2 */}
              <div className={`bg-white/5 ${!isMobileDevice ? 'backdrop-blur-sm' : ''} border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:border-[#FA7B21]/30 transition-colors duration-300`}>
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl flex-shrink-0">🕐</span>
                  <h3 className="text-base sm:text-lg md:text-xl text-white">
                    ¿Con cuánto tiempo de anticipación debo llegar a la graduación?
                  </h3>
                </div>
                <div className="ml-8 sm:ml-12 space-y-3 sm:space-y-4 text-sm sm:text-base text-white/80 leading-relaxed">
                  <p>
                    Se recomienda llegar entre <span className="text-[#FCA929]">30 y 15 minutos antes</span> del horario indicado.
                  </p>
                  <p>
                    Esto permite realizar el registro, preparar a los alumnos y asegurar el orden antes de iniciar la ceremonia.
                  </p>
                </div>
              </div>

              {/* Pregunta 3 */}
              <div className={`bg-white/5 ${!isMobileDevice ? 'backdrop-blur-sm' : ''} border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:border-[#FA7B21]/30 transition-colors duration-300`}>
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl flex-shrink-0">🥋</span>
                  <h3 className="text-base sm:text-lg md:text-xl text-white">
                    ¿Qué deben usar los alumnos para la graduación?
                  </h3>
                </div>
                <div className="ml-8 sm:ml-12 space-y-3 sm:space-y-4 text-sm sm:text-base text-white/80 leading-relaxed">
                  <p>
                    Los alumnos deben asistir con su <span className="text-[#FCA929]">uniforme completo: chaqueta, pantalón y cinturón</span>.
                  </p>
                  <p>
                    Si cuentan con su polo AMAS, pueden usarlo debajo del uniforme.
                  </p>
                </div>
              </div>

              {/* Pregunta 4 */}
              <div className={`bg-white/5 ${!isMobileDevice ? 'backdrop-blur-sm' : ''} border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:border-[#FA7B21]/30 transition-colors duration-300`}>
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl flex-shrink-0">⏰</span>
                  <h3 className="text-base sm:text-lg md:text-xl text-white">
                    ¿Habrá clases el día de la graduación?
                  </h3>
                </div>
                <div className="ml-8 sm:ml-12 space-y-3 sm:space-y-4 text-sm sm:text-base text-white/80 leading-relaxed">
                  <p>
                    <span className="text-[#FCA929]">No.</span> Ese día se realiza únicamente la ceremonia de graduación.
                  </p>
                  <p>
                    Las clases se reprograman dentro del periodo del alumno, sin afectar su avance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FooterMain 
          onNavigate={onNavigate}
          onOpenMatricula={() => {}}
        />
      </div>
    </div>
  );
}