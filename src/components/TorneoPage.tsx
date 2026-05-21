import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import {
    Trophy,
    Heart,
    Flame,
    ChevronDown,
    Loader2,
    Search,
    Check,
    CheckCircle2,
    Send,
    Sparkles,
    Calendar,
    Clock,
    MapPin,
    Swords,
    Lightbulb,
    Shield,
    Zap,
    Target,
    Axe,
    Hammer,
    Wand2,
    AlertTriangle,
    type LucideIcon
} from 'lucide-react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { API_BASE } from '../config/api';

// ============================================================
// ICON MAPPING — modalidad.icono string -> lucide component
// ============================================================
const ICON_MAP: Record<string, LucideIcon> = { Zap, Swords, Target, Shield, Hammer, Wand2, Axe };

function getIconForModalidad(icono?: string): LucideIcon {
    if (icono && ICON_MAP[icono]) return ICON_MAP[icono];
    return Zap;
}

// ============================================================
// PRICE CALCULATION (client-side, from spec)
// ============================================================
interface PrecioEscala { desde: number; hasta: number; precio: number; }
interface DescuentoPrograma { programa: string; label: string; porcentaje: number; }

function calcularPrecioFromEscalas(cantidad: number, escalas: PrecioEscala[]): number {
    if (cantidad <= 0) return 0;
    for (const e of escalas) {
        if (cantidad >= e.desde && cantidad <= e.hasta) return e.precio;
    }
    return escalas[escalas.length - 1]?.precio || 0;
}

function resolverDescuentoCliente(programaActivo: string | null, descuentos: DescuentoPrograma[]): DescuentoPrograma | null {
    if (!programaActivo) return null;
    const prog = programaActivo.toLowerCase();
    for (const d of descuentos) {
        if (prog.includes(d.programa)) return d;
    }
    return null;
}

// ============================================================
// TYPES
// ============================================================
interface Modalidad {
    id: string;
    nombre: string;
    icono?: string;
    implementos_requeridos?: string[];
}

interface TorneoData {
    torneo: {
        id: string;
        nombre: string;
        fecha: string;
        hora?: string;
        lugar: string;
        descripcion?: string;
        precio_entrada?: number;
    };
    modalidades: Modalidad[];
    precios_modalidades: PrecioEscala[];
    descuentos_programa: DescuentoPrograma[];
}

interface AlumnoData {
    nombre: string;
    dni: string;
}

interface ConsultaResult {
    alumno: AlumnoData;
    implementos: string[];
    programa_activo: string | null;
    programas_activos: string[];
    es_leadership: boolean;
    es_fighter: boolean;
}

// ============================================================
// UI COMPONENTS
// ============================================================
const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <label className={`block text-white text-sm md:text-base font-bold mb-2 tracking-wide ${className}`}>
        {children}
    </label>
);

const Input = ({ className = "", ...props }: any) => (
    <input
        className={`w-full bg-white/10 border-2 border-white/30 rounded-2xl px-5 py-4 text-white placeholder:text-white/50 focus:outline-none focus:border-[#FA7B21] focus:ring-4 focus:ring-[#FA7B21]/30 focus:bg-white/20 transition-all duration-200 text-base font-medium ${className}`}
        {...props}
    />
);

// ============================================================
// PROPS
// ============================================================
interface TorneoPageProps {
    onNavigate: (page: string, sectionId?: string) => void;
    onOpenMatricula: () => void;
    onCartClick: () => void;
    cartItemsCount: number;
}

// ============================================================
// FAQ DATA
// ============================================================
const FAQ_ITEMS = [
    {
        q: '¿Quiénes pueden participar?',
        a: 'Todos los alumnos registrados en AMAS Team Wolf pueden inscribirse en el torneo.'
    },
    {
        q: '¿Puedo inscribirme en varias modalidades?',
        a: 'Sí, puedes elegir tantas modalidades como desees. El precio es por paquete: 1 modalidad S/100, 2 por S/150, 3 por S/200, y 4 o más por S/250.'
    },
    {
        q: '¿Qué implementos necesito?',
        a: 'Depende de la modalidad. Al seleccionar cada una, te indicaremos si necesitas algún implemento adicional como arma o uniforme.'
    },
    {
        q: '¿Hay costo de entrada para el público?',
        a: 'Sí, la entrada al evento cuesta S/25 por persona (de 12 a 60 años), pagada directamente en puerta.'
    },
    {
        q: '¿Hay descuentos por programa?',
        a: 'Sí. Los alumnos en programas especiales (Leadership Wolf, Fighter Wolf) reciben descuentos automáticos según la configuración del torneo.'
    },
];

// ============================================================
// COMPONENT
// ============================================================
export function TorneoPage({
    onNavigate,
    onOpenMatricula,
    onCartClick,
    cartItemsCount
}: TorneoPageProps) {
    const topRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    // Step 1: Torneo data from API
    const [torneoData, setTorneoData] = useState<TorneoData | null>(null);
    const [loadingTorneo, setLoadingTorneo] = useState(true);
    const [torneoError, setTorneoError] = useState('');

    // Step 2: DNI lookup
    const [dni, setDni] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [consultaResult, setConsultaResult] = useState<ConsultaResult | null>(null);
    const [dniStatus, setDniStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
    const [dniError, setDniError] = useState('');

    // Step 3: Modalidades selection
    const [selectedModalidades, setSelectedModalidades] = useState<string[]>([]);

    // Submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successData, setSuccessData] = useState<{ precio_total: number; descuento: number; implementos_faltantes: string[] } | null>(null);

    // FAQ accordion
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // ---- Step 1: Fetch active torneo ----
    useEffect(() => {
        window.scrollTo(0, 0);
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/torneo/activo`);
                if (!res.ok) {
                    setTorneoError('No hay torneos programados por el momento.');
                    return;
                }
                const data = await res.json();
                if (!data?.torneo) {
                    setTorneoError('No hay torneos programados por el momento.');
                    return;
                }
                setTorneoData(data);
            } catch {
                setTorneoError('No hay torneos programados por el momento.');
            } finally {
                setLoadingTorneo(false);
            }
        })();
    }, []);

    // ---- Derived pricing (from torneo config) ----
    const escalas = torneoData?.precios_modalidades || [{ desde: 1, hasta: 1, precio: 80 }, { desde: 2, hasta: 2, precio: 150 }, { desde: 3, hasta: 99, precio: 200 }];
    const descuentosConfig = torneoData?.descuentos_programa || [];
    const subtotal = calcularPrecioFromEscalas(selectedModalidades.length, escalas);
    const descuentoMatch = resolverDescuentoCliente(consultaResult?.programa_activo ?? null, descuentosConfig);
    const descuento = descuentoMatch ? Math.round(subtotal * (descuentoMatch.porcentaje / 100)) : 0;
    const descuentoLabel = descuentoMatch?.label || '';
    const total = subtotal - descuento;

    const isFormValid =
        dniStatus === 'found' &&
        selectedModalidades.length > 0;

    // ---- DNI lookup ----
    const lookupDni = async (dniValue: string) => {
        if (dniValue.length !== 8) return;
        setIsLookingUp(true);
        setDniError('');
        setDniStatus('idle');
        setConsultaResult(null);
        setSelectedModalidades([]);
        try {
            const res = await fetch(`${API_BASE}/torneo/consultar?dni=${dniValue}`);
            if (!res.ok) {
                setDniStatus('not_found');
                setDniError('Este DNI no está registrado en AMAS Team Wolf. Verifica los datos.');
                return;
            }
            const data = await res.json();
            if (!data?.alumno) {
                setDniStatus('not_found');
                setDniError('Este DNI no está registrado en AMAS Team Wolf. Verifica los datos.');
                return;
            }
            setDniStatus('found');
            setConsultaResult(data);
        } catch {
            setDniStatus('not_found');
            setDniError('Error al consultar. Intenta nuevamente.');
        } finally {
            setIsLookingUp(false);
        }
    };

    // ---- Handlers ----
    const handleDniChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 8);
        setDni(cleaned);
        if (cleaned.length < 8) {
            setDniStatus('idle');
            setDniError('');
            setConsultaResult(null);
            setSelectedModalidades([]);
        }
        if (cleaned.length === 8) {
            lookupDni(cleaned);
        }
    };

    const toggleModalidad = (nombre: string) => {
        setSelectedModalidades(prev =>
            prev.includes(nombre) ? prev.filter(x => x !== nombre) : [...prev, nombre]
        );
    };

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleSubmit = async () => {
        if (!isFormValid || !consultaResult) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/torneo/inscribir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dni_alumno: dni.trim(),
                    modalidades: selectedModalidades,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.error || errData?.message || 'Error del servidor');
            }

            const result = await res.json();
            setSuccessData(result);
            setIsSuccess(true);
            toast.success('Inscripcion exitosa!', { position: 'top-center' });
            topRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || 'Ocurrio un error. Intenta nuevamente.', {
                position: 'top-center',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ================================================================
    // RENDER — LOADING
    // ================================================================
    if (loadingTorneo) {
        return (
            <div ref={topRef} className="min-h-screen flex flex-col bg-zinc-950 text-white overflow-x-hidden">
                <Toaster position="top-center" richColors />
                <div className="relative z-20">
                    <HeaderMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} currentPage="torneo" />
                </div>
                <main className="flex-1 flex items-center justify-center px-4 py-32">
                    <div className="text-center animate-fade-in-up">
                        <Loader2 className="w-10 h-10 text-[#FA7B21] animate-spin mx-auto mb-4" />
                        <p className="text-white/60">Cargando torneo...</p>
                    </div>
                </main>
                <div className="relative z-20 mt-16">
                    <FooterMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} />
                </div>
            </div>
        );
    }

    // ================================================================
    // RENDER — NO ACTIVE TORNEO
    // ================================================================
    if (torneoError || !torneoData) {
        return (
            <div ref={topRef} className="min-h-screen flex flex-col bg-zinc-950 text-white overflow-x-hidden">
                <Toaster position="top-center" richColors />
                <div className="relative z-20">
                    <HeaderMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} currentPage="torneo" />
                </div>
                <main className="flex-1 flex items-center justify-center px-4 py-32">
                    <div className="text-center animate-fade-in-up max-w-md">
                        <div className="w-20 h-20 mx-auto mb-6 bg-zinc-900 border-2 border-white/10 rounded-full flex items-center justify-center">
                            <Trophy className="w-10 h-10 text-white/30" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">No hay torneos programados</h2>
                        <p className="text-white/50 mb-8">Cuando se programe un nuevo torneo, lo veras aqui. Mantente atento a nuestras redes.</p>
                        <button
                            onClick={() => onNavigate('home')}
                            className="px-8 py-4 bg-gradient-to-r from-[#FA7B21] to-[#ff8800] text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                </main>
                <div className="relative z-20 mt-16">
                    <FooterMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} />
                </div>
            </div>
        );
    }

    const { torneo, modalidades } = torneoData;

    // ================================================================
    // RENDER — SUCCESS
    // ================================================================
    if (isSuccess) {
        return (
            <div ref={topRef} className="min-h-screen flex flex-col bg-zinc-950 text-white overflow-x-hidden">
                <Toaster position="top-center" richColors />
                <div className="relative z-20">
                    <HeaderMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} currentPage="torneo" />
                </div>
                <main className="flex-1 flex items-center justify-center px-4 py-32">
                    <div className="animate-fade-in-up relative max-w-lg w-full">
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#FA7B21]/30 to-[#ff8800]/30 rounded-3xl blur-3xl" />
                        <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-4 border-[#FA7B21] rounded-3xl p-8 md:p-12 text-center shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FA7B21]/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#ff8800]/20 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <div className="mb-8 flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] to-[#ff8800] rounded-full blur-2xl opacity-50 animate-pulse" />
                                        <div className="relative w-28 h-28 md:w-36 md:h-36 bg-gradient-to-br from-[#FA7B21] to-[#ff8800] rounded-full flex items-center justify-center shadow-2xl">
                                            <svg className="w-14 h-14 md:w-20 md:h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-4xl md:text-6xl font-black text-[#FA7B21] mb-4">
                                    Inscrito!
                                </h3>
                                <p className="text-white/90 mb-3 text-lg md:text-xl leading-relaxed">
                                    <span className="font-bold text-white">{consultaResult?.alumno?.nombre}</span> esta registrado en el torneo.
                                </p>

                                {/* Summary from API response */}
                                {successData && (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/50">Precio total:</span>
                                            <span className="text-white font-bold">S/ {successData.precio_total}</span>
                                        </div>
                                        {successData.descuento > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-green-400/70">Descuento aplicado:</span>
                                                <span className="text-green-400 font-bold">- S/ {successData.descuento}</span>
                                            </div>
                                        )}
                                        {successData.implementos_faltantes && successData.implementos_faltantes.length > 0 && (
                                            <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                                                <p className="text-amber-400 text-xs font-bold mb-1 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Implementos faltantes:
                                                </p>
                                                <p className="text-amber-300/80 text-xs">
                                                    {successData.implementos_faltantes.join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <p className="text-white/70 text-base md:text-lg mb-8">
                                    Recibiras confirmacion por los canales de la academia.
                                </p>
                                <button
                                    onClick={() => onNavigate('home')}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-[#FA7B21] to-[#ff8800] text-white text-base md:text-lg font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-xl"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-[#ff8800] to-[#FCA929] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="relative z-10">Volver al Inicio</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <div className="relative z-20 mt-16">
                    <FooterMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} />
                </div>
            </div>
        );
    }

    // ================================================================
    // RENDER — MAIN PAGE
    // ================================================================
    return (
        <div ref={topRef} className="min-h-screen relative flex flex-col font-sans selection:bg-[#FA7B21] selection:text-white bg-zinc-950 text-white overflow-x-hidden">
            <Toaster position="top-center" richColors />

            {/* HEADER */}
            <div className="relative z-20">
                <HeaderMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} currentPage="torneo" />
            </div>

            {/* ========== HERO ========== */}
            <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-28 md:pt-32 pb-12 px-4">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-950" />
                    <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(circle at 30% 40%, rgba(250, 123, 33, 0.25) 0%, transparent 60%)' }} />
                    <div className="absolute inset-0 opacity-15" style={{ background: 'radial-gradient(circle at 70% 60%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)' }} />
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute top-20 left-10 w-2 h-2 bg-[#FA7B21] rounded-full animate-ping" style={{ animationDelay: '0s' }} />
                    <div className="absolute top-40 right-20 w-2 h-2 bg-[#ff8800] rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                    <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-[#FCA929] rounded-full animate-ping" style={{ animationDelay: '2s' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in-up">
                    {/* Badge */}
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FA7B21] to-[#ff8800] px-6 py-3 rounded-full shadow-2xl border-2 border-white/20">
                            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" />
                            <span className="text-white font-black text-sm md:text-lg uppercase tracking-wider">
                                Torneo Abierto
                            </span>
                        </div>
                    </div>

                    {/* Title from API */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                        {torneo.nombre || (
                            <>
                                Tu hijo tiene algo
                                <br />
                                <span className="text-[#FA7B21]">que demostrar.</span>
                            </>
                        )}
                    </h1>

                    {/* Description from API */}
                    {torneo.descripcion && (
                        <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                            {torneo.descripcion}
                        </p>
                    )}

                    {/* Torneo data badges from API */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                        {[
                            { Icon: Calendar, label: 'Fecha', value: (() => {
                                try {
                                    const d = new Date(torneo.fecha);
                                    const fechaStr = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' });
                                    return torneo.hora ? `${fechaStr} a las ${torneo.hora}` : fechaStr;
                                } catch { return torneo.fecha; }
                            })() },
                            ...(torneo.hora ? [{ Icon: Clock, label: 'Hora', value: torneo.hora }] : []),
                            { Icon: MapPin, label: 'Lugar', value: torneo.lugar },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 bg-zinc-950/85 px-5 py-3 rounded-2xl border-2 border-[#FA7B21]/30 shadow-xl"
                            >
                                <item.Icon className="w-5 h-5 text-[#FA7B21] flex-shrink-0" />
                                <div className="text-left">
                                    <p className="text-white/50 text-xs uppercase tracking-wider">{item.label}</p>
                                    <p className="text-white font-bold text-sm md:text-base">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-4">
                        <button
                            onClick={scrollToForm}
                            className="group relative w-full max-w-md mx-auto overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-95 block"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] via-[#ff8800] to-[#FCA929] animate-gradient-xy" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            <span className="relative flex items-center justify-center gap-3 px-10 py-5 md:py-6 text-white text-lg md:text-2xl font-black uppercase tracking-wider">
                                Inscribir a mi hijo
                                <ChevronDown className="w-6 h-6 animate-bounce" />
                            </span>
                        </button>
                    </div>

                    {/* Scroll indicator */}
                    <div className="mt-14">
                        <div className="w-6 h-10 border-2 border-white/30 rounded-full mx-auto flex justify-center">
                            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== POR QUE PARTICIPAR ========== */}
            <section className="relative py-16 md:py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                            Por que <span className="text-[#FA7B21]">participar</span>?
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
                            Un torneo transforma a tu hijo mas de lo que imaginas
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                        {[
                            {
                                Icon: Trophy,
                                title: 'Superan sus propios limites',
                                desc: 'Un torneo les da la oportunidad de brillar y crecer.',
                            },
                            {
                                Icon: Flame,
                                title: 'Ganan confianza real',
                                desc: 'Descubren que son capaces de mas de lo que creen.',
                            },
                            {
                                Icon: Heart,
                                title: 'Crean recuerdos unicos',
                                desc: 'Un momento que tu hijo recordara siempre.',
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="group relative animate-fade-in-up"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FA7B21]/20 rounded-2xl px-6 py-5 md:px-8 md:py-6 hover:border-[#FA7B21]/50 transition-all duration-500 flex items-center gap-5">
                                    <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-[#FA7B21] to-[#ff8800] rounded-xl flex items-center justify-center shadow-lg shadow-[#FA7B21]/20 group-hover:scale-110 transition-transform duration-300">
                                        <item.Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base md:text-lg font-bold text-white mb-1">{item.title}</h3>
                                        <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== COMO FUNCIONA ========== */}
            <section className="relative py-16 md:py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                            Como <span className="text-[#FA7B21]">funciona</span>?
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl">
                            3 pasos simples para inscribir a tu hijo
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {[
                            { step: 1, text: 'Ingresa el DNI del alumno para verificar sus datos', Icon: Search },
                            { step: 2, text: 'Elige las modalidades en las que participara', Icon: CheckCircle2 },
                            { step: 3, text: 'Confirma la inscripcion y listo', Icon: Send },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FA7B21]/20 rounded-3xl p-6 text-center hover:border-[#FA7B21]/50 transition-all duration-300 animate-fade-in-up"
                                style={{ animationDelay: `${i * 120}ms` }}
                            >
                                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-[#FA7B21] to-[#ff8800] rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#FA7B21]/20">
                                    {item.step}
                                </div>
                                <div className="flex justify-center mb-3">
                                    <item.Icon className="w-6 h-6 text-[#FCA929]" />
                                </div>
                                <p className="text-white/70 text-sm leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Nota sobre entrada */}
                    <div className="max-w-3xl mx-auto mt-12 animate-fade-in-up">
                        <div className="flex items-start gap-3 bg-gradient-to-r from-[#FA7B21]/10 to-[#ff8800]/10 border border-[#FA7B21]/30 rounded-2xl px-6 py-4">
                            <Lightbulb className="w-5 h-5 text-[#FCA929] flex-shrink-0 mt-0.5" />
                            <p className="text-white/60 text-sm leading-relaxed">
                                Entrada al evento: <span className="text-white font-semibold">S/25</span> (personas de 12 a 60 anos, pago en puerta)
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== FORMULARIO ========== */}
            <main ref={formRef} id="formulario-torneo" className="relative z-10 px-4 md:px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
                <div className="max-w-2xl mx-auto">
                    <div className="relative animate-fade-in-up">
                        {/* Glow effect */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#FA7B21]/20 to-[#ff8800]/20 rounded-3xl blur-3xl" />

                        <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FA7B21]/50 rounded-3xl p-6 md:p-8 lg:p-10 shadow-2xl overflow-hidden">
                            {/* Decorative top bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FA7B21] via-[#ff8800] to-[#FCA929]" />
                            <div className="absolute top-10 right-10 w-32 h-32 bg-[#FA7B21]/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#ff8800]/10 rounded-full blur-3xl" />

                            <div className="relative z-10">
                                {/* Form title */}
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                                        Registro al Torneo
                                    </h2>
                                    <p className="text-white/60 text-sm md:text-base">
                                        Ingresa el DNI del alumno para comenzar
                                    </p>
                                </div>

                                <div className="space-y-6 md:space-y-8">

                                    {/* ===== STEP 2: DNI INPUT ===== */}
                                    <div className="space-y-2">
                                        <Label>DNI del Alumno *</Label>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Ingresa los 8 digitos del DNI"
                                                maxLength={8}
                                                value={dni}
                                                onChange={(e: any) => handleDniChange(e.target.value)}
                                                className={`${dniStatus === 'not_found' ? 'border-red-500 ring-4 ring-red-500/30' : ''} ${dniStatus === 'found' ? 'border-green-500 ring-4 ring-green-500/30' : ''}`}
                                            />
                                            {isLookingUp && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="w-5 h-5 text-[#FA7B21] animate-spin" />
                                                </div>
                                            )}
                                            {dniStatus === 'found' && !isLookingUp && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Check className="w-5 h-5 text-green-500" />
                                                </div>
                                            )}
                                        </div>
                                        {dni.length > 0 && dni.length < 8 && (
                                            <p className="text-white/40 text-sm ml-2">
                                                {8 - dni.length} digitos restantes
                                            </p>
                                        )}
                                        {isLookingUp && (
                                            <div className="flex items-center gap-2 text-white/60 text-sm ml-2">
                                                <Search className="w-4 h-4" />
                                                Buscando alumno...
                                            </div>
                                        )}
                                        {dniError && (
                                            <p className="text-red-400 text-sm ml-2 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> {dniError}
                                            </p>
                                        )}
                                    </div>

                                    {/* ===== STEP 2b: Alumno info (after DNI found) ===== */}
                                    {dniStatus === 'found' && consultaResult && (
                                        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
                                            {/* Alumno card */}
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-white font-bold text-lg">{consultaResult.alumno.nombre}</h4>
                                                    {consultaResult.programas_activos && consultaResult.programas_activos.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {consultaResult.programas_activos.map(prog => (
                                                                <span key={prog} className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold">
                                                                    {prog}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Implementos que tiene */}
                                                {consultaResult.implementos.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {consultaResult.implementos.map(imp => (
                                                            <span key={imp} className="inline-flex items-center gap-1 bg-[#FA7B21]/15 text-[#FCA929] border border-[#FA7B21]/30 px-3 py-1 rounded-full text-xs font-medium">
                                                                <Check className="w-3 h-3" /> {imp}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* ===== STEP 3: Modalidades ===== */}
                                            <div className="space-y-3">
                                                <Label>Modalidades de Participacion *</Label>
                                                <p className="text-white/50 text-xs md:text-sm">Selecciona las modalidades en las que participara</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {modalidades.map((mod) => {
                                                        const selected = selectedModalidades.includes(mod.nombre);
                                                        const IconComponent = getIconForModalidad(mod.icono);

                                                        // Check missing implementos
                                                        const missingImplementos = (mod.implementos_requeridos || []).filter(
                                                            req => !consultaResult.implementos.map(i => i.toLowerCase()).includes(req.toLowerCase())
                                                        );

                                                        return (
                                                            <button
                                                                key={mod.id}
                                                                type="button"
                                                                onClick={() => toggleModalidad(mod.nombre)}
                                                                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 ${selected
                                                                    ? 'bg-[#FA7B21]/20 border-[#FA7B21] text-white shadow-lg shadow-[#FA7B21]/20'
                                                                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${selected
                                                                        ? 'bg-gradient-to-br from-[#FA7B21] to-[#ff8800]'
                                                                        : 'bg-white/10'
                                                                        }`}>
                                                                        <IconComponent className={`w-5 h-5 ${selected ? 'text-white' : 'text-white/50'}`} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="text-sm md:text-base font-medium leading-snug block">{mod.nombre}</span>
                                                                        {mod.implementos_requeridos && mod.implementos_requeridos.length > 0 && (
                                                                            <span className="text-white/40 text-xs block mt-0.5">
                                                                                Requiere: {mod.implementos_requeridos.join(', ')}
                                                                            </span>
                                                                        )}
                                                                        {missingImplementos.length > 0 && (
                                                                            <span className="text-amber-400 text-xs block mt-1 flex items-center gap-1">
                                                                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                                                                Necesitas {missingImplementos.join(', ')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${selected
                                                                        ? 'bg-gradient-to-br from-[#FA7B21] to-[#ff8800] border-[#FA7B21] shadow-md shadow-[#FA7B21]/30'
                                                                        : 'border-white/30'
                                                                        }`}>
                                                                        {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* ===== STEP 4: Price summary ===== */}
                                            {selectedModalidades.length > 0 && (
                                                <div className="relative animate-fade-in-up">
                                                    <div className="absolute -inset-1 bg-gradient-to-r from-[#FA7B21] to-[#ff8800] rounded-2xl blur opacity-20" />
                                                    <div className="relative bg-gradient-to-r from-[#FA7B21]/15 to-[#ff8800]/15 border-2 border-[#FA7B21]/40 rounded-2xl p-5 md:p-6">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Shield className="w-5 h-5 text-[#FA7B21]" />
                                                            <p className="text-white font-bold text-sm md:text-base">Resumen de inscripcion</p>
                                                        </div>
                                                        <ul className="space-y-2 mb-4">
                                                            {selectedModalidades.map(modId => {
                                                                const mod = modalidades.find(m => m.id === modId);
                                                                if (!mod) return null;
                                                                const MIcon = getIconForModalidad(mod.icono);
                                                                return (
                                                                    <li key={modId} className="text-white/80 text-sm flex items-center gap-2">
                                                                        <MIcon className="w-4 h-4 text-[#FCA929] flex-shrink-0" />
                                                                        {mod.nombre}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                        <div className="border-t border-white/10 pt-4 space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-white/50 text-sm">{selectedModalidades.length} modalidad{selectedModalidades.length > 1 ? 'es' : ''}</span>
                                                                <span className="text-white/50 text-sm">S/ {subtotal}</span>
                                                            </div>
                                                            {descuento > 0 && (
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-green-400 text-sm">Descuento {descuentoLabel} ({descuentoMatch?.porcentaje}%)</span>
                                                                    <span className="text-green-400 text-sm">- S/ {descuento}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-between pt-2">
                                                                <span className="text-white font-bold">Total</span>
                                                                <p className={`text-2xl md:text-3xl font-black ${descuento > 0 ? 'text-green-400' : 'text-[#FA7B21]'}`}>
                                                                    S/ {total}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ===== STEP 5: Submit ===== */}
                                            <div className="mt-14 md:mt-16">
                                                <button
                                                    type="button"
                                                    disabled={!isFormValid || isSubmitting}
                                                    onClick={handleSubmit}
                                                    className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mb-2 shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50"
                                                >
                                                    <div className={`absolute inset-0 ${isFormValid && !isSubmitting ? 'bg-gradient-to-r from-[#FA7B21] via-[#ff8800] to-[#FCA929] animate-gradient-xy' : 'bg-zinc-800'}`} />
                                                    {isFormValid && !isSubmitting && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                                    )}
                                                    <span className="relative flex items-center justify-center gap-3 px-8 py-5 md:py-6 text-white text-lg md:text-2xl font-black uppercase tracking-wider">
                                                        {isSubmitting ? (
                                                            <>
                                                                <Loader2 className="w-7 h-7 animate-spin" />
                                                                Inscribiendo...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="w-7 h-7 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" />
                                                                Confirmar Inscripcion
                                                            </>
                                                        )}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ========== FAQ ========== */}
            <section className="relative py-16 md:py-24 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12 animate-fade-in-up">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                            Preguntas <span className="text-[#FA7B21]">frecuentes</span>
                        </h2>
                    </div>

                    <div className="space-y-3 animate-fade-in-up">
                        {FAQ_ITEMS.map((item, i) => (
                            <div
                                key={i}
                                className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FA7B21]/20 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FA7B21]/40"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                                >
                                    <span className="text-white font-bold text-sm md:text-base pr-4">{item.q}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-[#FA7B21] flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <p className="px-6 pb-5 text-white/60 text-sm leading-relaxed">
                                        {item.a}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <div className="relative z-20 mt-16">
                <FooterMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} />
            </div>

            <style>{`
                @keyframes gradient-xy {
                  0%, 100% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                }
                .animate-gradient-xy {
                  background-size: 200% 200%;
                  animation: gradient-xy 3s ease infinite;
                }
            `}</style>
        </div>
    );
}

export default TorneoPage;
