import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import {
    Trophy,
    Heart,
    Flame,
    ChevronDown,
    Loader2,
    Search,
    Upload,
    X,
    Check,
    CreditCard,
    Smartphone,
    ClipboardList,
    ImageIcon,
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
    type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';

// Base URL — in dev Vite proxies /api/n8n → N8N host (avoids CORS).
const N8N_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api/n8n'
    : 'https://pallium-n8n.s6hx3x.easypanel.host';

// ============================================================
// CONSTANTES EDITABLES — Actualizar aquí para cada torneo
// ============================================================
const TORNEO_CONFIG = {
    // Datos del torneo
    fecha: '28 de Febrero y 1 de Marzo, 2026',
    hora: '10:00 AM',
    lugar: 'Coliseo Eduardo Dibós, San Borja, Lima',

    // Datos de pago — Transferencias bancarias
    bancos: [
        { nombre: 'INTERBANK', moneda: 'Soles', cuenta: '8983331662706' },
        { nombre: 'BCP', moneda: 'Soles', cuenta: '19204159709025' },
        { nombre: 'BBVA', moneda: 'Soles', cuenta: '0011-0814-0220041447' }
    ],

    // Datos de pago — Yape
    yapeNumero: '982 287 822',
    yapeNombre: 'Profesora Jimena Won',

    // Costo de entrada
    costoEntrada: 25,

    // Webhook
    webhookUrl: `${N8N_BASE}/webhook/torneo`,
    consultarAlumnoUrl: `${N8N_BASE}/webhook/consultar-formulario`,
};

// ============================================================
// MODALIDADES Y PRECIOS
// ============================================================
const MODALIDADES: { name: string; Icon: LucideIcon }[] = [
    { name: 'Fórmula', Icon: Zap },
    { name: 'Fórmula con armas', Icon: Swords },
    { name: 'Presentación Combat Weapons', Icon: Target },
    { name: 'Combat Weapons Simple', Icon: Shield },
    { name: 'Rompimiento de madera', Icon: Hammer },
    { name: 'Fórmula creativa', Icon: Wand2 },
    { name: 'Fórmula creativa con armas', Icon: Axe },
];

function calcularPrecio(cantidad: number): number {
    if (cantidad <= 0) return 0;
    if (cantidad === 1) return 100;
    if (cantidad === 2) return 150;
    if (cantidad === 3) return 200;
    return 250; // 4 o más
}

// ============================================================
// COMPONENTES UI — Mismos estilos que RegistroShowroomPage
// ============================================================
const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <label className={`block text-white text-sm md:text-base font-bold mb-2 tracking-wide ${className}`}>
        {children}
    </label>
);

const Input = ({ className = "", ...props }: any) => (
    <input
        className={`w-full bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-2xl px-5 py-4 text-white placeholder:text-white/50 focus:outline-none focus:border-[#FF6700] focus:ring-4 focus:ring-[#FF6700]/30 focus:bg-white/20 transition-all text-base font-medium ${className}`}
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

    // PHASE 1: DNI lookup
    const [dni, setDni] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [dniStatus, setDniStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
    const [dniError, setDniError] = useState('');
    const [alumnoData, setAlumnoData] = useState<{ nombre_alumno: string; nombre_apoderado: string; correo: string } | null>(null);

    // PHASE 2: Form state
    const [apoderado, setApoderado] = useState('');
    const [alumno, setAlumno] = useState('');
    const [email, setEmail] = useState('');
    const [emailFromApi, setEmailFromApi] = useState(false);
    const [modalidades, setModalidades] = useState<string[]>([]);

    // Payment panel
    const [showPago, setShowPago] = useState(false);
    const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
    const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);

    // Submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    // ---- Derived state ----
    const total = calcularPrecio(modalidades.length);
    const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const isFormValid =
        dniStatus === 'found' &&
        apoderado.trim().length > 0 &&
        alumno.trim().length > 0 &&
        /^\d{8}$/.test(dni) &&
        validateEmail(email) &&
        modalidades.length > 0;

    const getModalidadIcon = (name: string): LucideIcon => {
        return MODALIDADES.find(m => m.name === name)?.Icon || Zap;
    };

    // ---- DNI lookup ----
    const lookupDni = async (dniValue: string) => {
        if (dniValue.length !== 8) return;
        setIsLookingUp(true);
        setDniError('');
        setDniStatus('idle');
        setAlumnoData(null);
        try {
            const res = await fetch(`${TORNEO_CONFIG.consultarAlumnoUrl}?dni=${dniValue}`);
            const text = await res.text();
            console.log('[DNI lookup] raw response:', text);

            if (!text || text.trim().length === 0) {
                // Empty response → treat as not found
                setDniStatus('not_found');
                setDniError('Este DNI no está registrado en AMAS Team Wolf. Verifica los datos.');
                return;
            }

            const parsed = JSON.parse(text);

            // The logic:
            // 1) If the webhook couldn't find it, it returns: { "encontrado": false }
            // 2) If it did find it, it returns an array: [ { "id": 172, "nombre_alumno": "...", ... } ]

            // Check if it's explicitly "not found" object
            if (!Array.isArray(parsed) && parsed.encontrado === false) {
                setDniStatus('not_found');
                setDniError('Este DNI no está registrado en AMAS Team Wolf. Verifica los datos.');
                return;
            }

            // Otherwise, it should be an array with the student data
            if (Array.isArray(parsed) && parsed.length > 0) {
                const result = parsed[0];
                setDniStatus('found');
                setAlumnoData(result);
                setAlumno(result.nombre_alumno || '');
                setApoderado(result.nombre_apoderado || '');
                const emailResult = result.correo || '';

                if (emailResult) {
                    setEmail(emailResult);
                    setEmailFromApi(true);
                } else {
                    setEmail('');
                    setEmailFromApi(false);
                }
            } else {
                setDniStatus('not_found');
                setDniError('Este DNI no está registrado en AMAS Team Wolf. Verifica los datos.');
            }
        } catch (err) {
            console.error('[DNI lookup] error:', err);
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
        // Reset phase 2 if DNI changes
        if (cleaned.length < 8) {
            setDniStatus('idle');
            setDniError('');
            setAlumnoData(null);
            setAlumno('');
            setApoderado('');
            setEmail('');
            setEmailFromApi(false);
            setModalidades([]);
            setShowPago(false);
        }
        // Auto-lookup when 8 digits
        if (cleaned.length === 8) {
            lookupDni(cleaned);
        }
    };

    const toggleModalidad = (m: string) => {
        setModalidades((prev: string[]) =>
            prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
        );
    };

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleRegistrarClick = () => {
        if (!isFormValid) return;
        setShowPago(true);
        setTimeout(() => {
            document.getElementById('pago-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast.error('Formato no válido. Usa JPG, PNG o PDF.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('El archivo es demasiado grande (máx 10 MB).');
            return;
        }
        setComprobanteFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setComprobantePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setComprobantePreview(null);
        }
    };

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const comprobanteBase64 = comprobanteFile ? await fileToBase64(comprobanteFile) : null;

            const payload = {
                apoderado: apoderado.trim(),
                alumno: alumno.trim(),
                dni: dni.trim(),
                email: email.trim(),
                modalidades,
                total,
                comprobante: comprobanteBase64,
                fecha_registro: new Date().toISOString(),
                fecha_torneo: TORNEO_CONFIG.fecha,
            };

            const res = await fetch(TORNEO_CONFIG.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Error del servidor');

            setIsSuccess(true);
            toast.success('¡Registro exitoso!', { position: 'top-center' });
            topRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            console.error(err);
            toast.error('Ocurrió un error. Intenta nuevamente.', {
                position: 'top-center',
                action: { label: 'Reintentar', onClick: handleConfirm },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ================================================================
    // RENDER — SUCCESS
    // ================================================================
    if (isSuccess) {
        return (
            <div ref={topRef} className="min-h-screen relative flex flex-col font-sans selection:bg-[#FF6700] selection:text-white bg-black text-white overflow-x-hidden">
                <Toaster position="top-center" richColors />
                <div className="relative z-20">
                    <HeaderMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} />
                </div>
                <main className="flex-1 flex items-center justify-center px-4 py-32">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative max-w-lg w-full"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#FF6700]/30 to-[#ff8800]/30 rounded-3xl blur-3xl" />
                        <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-4 border-[#FF6700] rounded-3xl p-8 md:p-12 text-center shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF6700]/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#ff8800]/20 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <div className="mb-8 flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF6700] to-[#ff8800] rounded-full blur-2xl opacity-50 animate-pulse" />
                                        <div className="relative w-28 h-28 md:w-36 md:h-36 bg-gradient-to-br from-[#FF6700] to-[#ff8800] rounded-full flex items-center justify-center shadow-2xl">
                                            <svg className="w-14 h-14 md:w-20 md:h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-4xl md:text-6xl font-black text-[#FF6700] mb-4">
                                    ¡Inscrito!
                                </h3>
                                <p className="text-white/90 mb-3 text-lg md:text-xl leading-relaxed">
                                    <span className="font-bold text-white">{alumno}</span> está registrado en el torneo.
                                </p>
                                <p className="text-white/70 text-base md:text-lg mb-8">
                                    Recibirás confirmación por los canales de la academia.
                                </p>
                                <button
                                    onClick={() => onNavigate('home')}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-[#FF6700] to-[#ff8800] text-white text-base md:text-lg font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-xl"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-[#ff8800] to-[#FCA929] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="relative z-10">Volver al Inicio</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
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
        <div ref={topRef} className="min-h-screen relative flex flex-col font-sans selection:bg-[#FF6700] selection:text-white bg-black text-white overflow-x-hidden">
            <Toaster position="top-center" richColors />

            {/* HEADER */}
            <div className="relative z-20">
                <HeaderMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} />
            </div>

            {/* ========== HERO ========== */}
            <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-28 md:pt-32 pb-12 px-4">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
                    <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(circle at 30% 40%, rgba(250, 123, 33, 0.25) 0%, transparent 60%)' }} />
                    <div className="absolute inset-0 opacity-15" style={{ background: 'radial-gradient(circle at 70% 60%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)' }} />
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute top-20 left-10 w-2 h-2 bg-[#FF6700] rounded-full animate-ping" style={{ animationDelay: '0s' }} />
                    <div className="absolute top-40 right-20 w-2 h-2 bg-[#ff8800] rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                    <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-[#FCA929] rounded-full animate-ping" style={{ animationDelay: '2s' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6"
                    >
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FF6700] to-[#ff8800] px-6 py-3 rounded-full shadow-2xl border-2 border-white/20">
                            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" />
                            <span className="text-white font-black text-sm md:text-lg uppercase tracking-wider">
                                Torneo Abierto
                            </span>
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight"
                    >
                        Tu hijo tiene algo
                        <br />
                        <span className="text-[#FF6700]">
                            que demostrar.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg sm:text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed px-4"
                    >
                        Los torneos no son solo competencia. Son el momento en que todo el entrenamiento cobra sentido.
                    </motion.p>

                    {/* Torneo data badges */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap items-center justify-center gap-4 mb-10"
                    >
                        {[
                            { Icon: Calendar, label: 'Fecha', value: TORNEO_CONFIG.fecha },
                            { Icon: Clock, label: 'Hora', value: TORNEO_CONFIG.hora },
                            { Icon: MapPin, label: 'Lugar', value: TORNEO_CONFIG.lugar },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-5 py-3 rounded-2xl border-2 border-[#FF6700]/30 shadow-xl"
                            >
                                <item.Icon className="w-5 h-5 text-[#FF6700] flex-shrink-0" />
                                <div className="text-left">
                                    <p className="text-white/50 text-xs uppercase tracking-wider">{item.label}</p>
                                    <p className="text-white font-bold text-sm md:text-base">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                        className="mt-4"
                    >
                        <button
                            onClick={scrollToForm}
                            className="group relative w-full max-w-md mx-auto overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-95 block"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FF6700] via-[#ff8800] to-[#FCA929] animate-gradient-xy" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            <span className="relative flex items-center justify-center gap-3 px-10 py-5 md:py-6 text-white text-lg md:text-2xl font-black uppercase tracking-wider">
                                Inscribir a mi hijo
                                <ChevronDown className="w-6 h-6 animate-bounce" />
                            </span>
                        </button>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-14"
                    >
                        <div className="w-6 h-10 border-2 border-white/30 rounded-full mx-auto flex justify-center">
                            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ========== ¿POR QUÉ IR? ========== */}
            <section className="relative py-16 md:py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                            ¿Por qué <span className="text-[#FF6700]">participar</span>?
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
                            Un torneo transforma a tu hijo más de lo que imaginas
                        </p>
                    </motion.div>

                    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                        {[
                            {
                                Icon: Trophy,
                                title: 'Superan sus propios límites',
                                desc: 'Un torneo les da la oportunidad de brillar y crecer.',
                            },
                            {
                                Icon: Flame,
                                title: 'Ganan confianza real',
                                desc: 'Descubren que son capaces de más de lo que creen.',
                            },
                            {
                                Icon: Heart,
                                title: 'Crean recuerdos únicos',
                                desc: 'Un momento que tu hijo recordará siempre.',
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="group relative"
                            >
                                <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FF6700]/20 rounded-2xl px-6 py-5 md:px-8 md:py-6 hover:border-[#FF6700]/50 transition-all duration-500 flex items-center gap-5">
                                    <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-[#FF6700] to-[#ff8800] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6700]/20 group-hover:scale-110 transition-transform duration-300">
                                        <item.Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base md:text-lg font-bold text-white mb-1">{item.title}</h3>
                                        <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== ¿CÓMO FUNCIONA? ========== */}
            <section className="relative py-16 md:py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                            ¿Cómo <span className="text-[#FF6700]">funciona</span>?
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl">
                            4 pasos simples para inscribir a tu hijo
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {[
                            { step: 1, text: 'Completa los datos del alumno', Icon: ClipboardList },
                            { step: 2, text: 'Elige las modalidades en las que participará', Icon: CheckCircle2 },
                            { step: 3, text: 'Realiza el pago por transferencia o Yape', Icon: CreditCard },
                            { step: 4, text: 'Sube tu comprobante y listo', Icon: ImageIcon },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.12 }}
                                className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FF6700]/20 rounded-3xl p-6 text-center hover:border-[#FF6700]/50 transition-all duration-300"
                            >
                                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-[#FF6700] to-[#ff8800] rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#FF6700]/20">
                                    {item.step}
                                </div>
                                <div className="flex justify-center mb-3">
                                    <item.Icon className="w-6 h-6 text-[#FCA929]" />
                                </div>
                                <p className="text-white/70 text-sm leading-relaxed">{item.text}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Nota sobre entrada */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="max-w-3xl mx-auto mt-12"
                    >
                        <div className="flex items-start gap-3 bg-gradient-to-r from-[#FF6700]/10 to-[#ff8800]/10 border border-[#FF6700]/30 rounded-2xl px-6 py-4">
                            <Lightbulb className="w-5 h-5 text-[#FCA929] flex-shrink-0 mt-0.5" />
                            <p className="text-white/60 text-sm leading-relaxed">
                                La entrada al evento tiene un costo de <span className="text-white font-semibold">S/ {TORNEO_CONFIG.costoEntrada}</span> por persona (entre 12 y 60 años), abonado directamente en puerta el día del torneo.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ========== FORMULARIO ========== */}
            <main ref={formRef} id="formulario-torneo" className="relative z-10 px-4 py-16 md:py-24 max-w-7xl mx-auto w-full">
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="relative"
                    >
                        {/* Glow effect */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#FF6700]/20 to-[#ff8800]/20 rounded-3xl blur-3xl" />

                        <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FF6700]/50 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden">
                            {/* Decorative top bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6700] via-[#ff8800] to-[#FCA929]" />
                            {/* Decorative elements */}
                            <div className="absolute top-10 right-10 w-32 h-32 bg-[#FF6700]/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#ff8800]/10 rounded-full blur-3xl" />

                            <div className="relative z-10">
                                {/* Form title */}
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                                        Registro al Torneo
                                    </h2>
                                    <p className="text-white/60 text-sm md:text-base">
                                        Completa los datos para inscribir a tu hijo/a
                                    </p>
                                </div>

                                <div className="space-y-6 md:space-y-8">

                                    {/* ===== FASE 1: Solo DNI ===== */}
                                    <div className="space-y-2">
                                        <Label>DNI del Alumno *</Label>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Ingresa los 8 dígitos del DNI"
                                                maxLength={8}
                                                value={dni}
                                                onChange={(e: any) => handleDniChange(e.target.value)}
                                                className={`${dniStatus === 'not_found' ? 'border-red-500 ring-4 ring-red-500/30' : ''} ${dniStatus === 'found' ? 'border-green-500 ring-4 ring-green-500/30' : ''}`}
                                            />
                                            {isLookingUp && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="w-5 h-5 text-[#FF6700] animate-spin" />
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
                                                {8 - dni.length} dígitos restantes
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
                                                <span>⚠</span> {dniError}
                                            </p>
                                        )}
                                    </div>

                                    {/* ===== FASE 2: Datos pre-llenados + Resto del formulario ===== */}
                                    <AnimatePresence>
                                        {dniStatus === 'found' && alumnoData && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.35 }}
                                                className="space-y-6 md:space-y-8"
                                            >
                                                {/* Nombre del Alumno (read-only) */}
                                                <div className="space-y-2">
                                                    <Label>Nombre del Alumno</Label>
                                                    <Input
                                                        value={alumno}
                                                        readOnly
                                                        className="opacity-70 cursor-not-allowed"
                                                    />
                                                </div>

                                                {/* Nombre del Apoderado (read-only) */}
                                                <div className="space-y-2">
                                                    <Label>Nombre del Apoderado</Label>
                                                    <Input
                                                        value={apoderado}
                                                        readOnly
                                                        className="opacity-70 cursor-not-allowed"
                                                    />
                                                </div>

                                                {/* Email */}
                                                <div className="space-y-2">
                                                    <Label>Correo Electrónico *</Label>
                                                    <Input
                                                        type="email"
                                                        placeholder="correo@ejemplo.com"
                                                        value={email}
                                                        onChange={(e: any) => setEmail(e.target.value)}
                                                        readOnly={emailFromApi}
                                                        className={`${emailFromApi ? 'opacity-70 cursor-not-allowed' : ''} ${email.length > 0 && !validateEmail(email) ? 'border-red-500 ring-4 ring-red-500/30' : ''}`}
                                                    />
                                                    {email.length > 0 && !validateEmail(email) && (
                                                        <p className="text-red-400 text-sm ml-2 flex items-center gap-1">
                                                            <span>⚠</span> Email inválido
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Modalidades */}
                                                <div className="space-y-3">
                                                    <Label>Modalidades de Participación *</Label>
                                                    <p className="text-white/50 text-xs md:text-sm">Selecciona las modalidades en las que participará</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {MODALIDADES.map(({ name: m }) => {
                                                            const selected = modalidades.includes(m);
                                                            return (
                                                                <button
                                                                    key={m}
                                                                    type="button"
                                                                    onClick={() => toggleModalidad(m)}
                                                                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${selected
                                                                        ? 'bg-[#FF6700]/20 border-[#FF6700] text-white shadow-lg shadow-[#FF6700]/20'
                                                                        : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                                                                        }`}
                                                                >
                                                                    <div className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${selected
                                                                        ? 'bg-gradient-to-br from-[#FF6700] to-[#ff8800] border-[#FF6700] shadow-md shadow-[#FF6700]/30'
                                                                        : 'border-white/30'
                                                                        }`}>
                                                                        {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                                                    </div>
                                                                    <span className="text-sm md:text-base font-medium leading-snug">{m}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Resumen de precios */}
                                                <AnimatePresence>
                                                    {modalidades.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="relative"
                                                        >
                                                            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6700] to-[#ff8800] rounded-2xl blur opacity-20" />
                                                            <div className="relative bg-gradient-to-r from-[#FF6700]/15 to-[#ff8800]/15 border-2 border-[#FF6700]/40 rounded-2xl p-5 md:p-6 backdrop-blur-sm">
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <Shield className="w-5 h-5 text-[#FF6700]" />
                                                                    <p className="text-white font-bold text-sm md:text-base">Resumen de inscripción</p>
                                                                </div>
                                                                <ul className="space-y-2 mb-4">
                                                                    {modalidades.map(m => {
                                                                        const MIcon = getModalidadIcon(m);
                                                                        return (
                                                                            <li key={m} className="text-white/80 text-sm flex items-center gap-2">
                                                                                <MIcon className="w-4 h-4 text-[#FCA929] flex-shrink-0" />
                                                                                {m}
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                                                                    <div>
                                                                        <span className="text-white/50 text-sm">{modalidades.length} modalidad{modalidades.length > 1 ? 'es' : ''}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-white/50 text-xs uppercase tracking-wider">Total</p>
                                                                        <p className="text-2xl md:text-3xl font-black text-[#FF6700]">
                                                                            S/ {total}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* BOTÓN SUBMIT */}
                                                <div className="mt-14 md:mt-16">
                                                    <button
                                                        type="button"
                                                        disabled={!isFormValid}
                                                        onClick={handleRegistrarClick}
                                                        className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mb-2"
                                                    >
                                                        {/* Animated gradient background */}
                                                        <div className={`absolute inset-0 ${isFormValid ? 'bg-gradient-to-r from-[#FF6700] via-[#ff8800] to-[#FCA929] animate-gradient-xy' : 'bg-zinc-800'}`} />
                                                        {/* Shine effect */}
                                                        {isFormValid && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                                        )}
                                                        <span className="relative flex items-center justify-center gap-3 px-8 py-5 md:py-6 text-white text-lg md:text-2xl font-black uppercase tracking-wider">
                                                            <Send className="w-7 h-7 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" />
                                                            Registrarse y Pagar
                                                        </span>
                                                    </button>
                                                </div>

                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* ========== SECCIÓN DE PAGO ========== */}
            <AnimatePresence>
                {showPago && (
                    <motion.section
                        id="pago-section"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ duration: 0.5 }}
                        className="relative px-4 pb-16 md:pb-24 max-w-7xl mx-auto w-full"
                    >
                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-[#FF6700]/15 to-[#ff8800]/15 rounded-3xl blur-3xl" />

                                <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FCA929]/50 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FCA929] via-[#FF6700] to-[#FCA929]" />
                                    <div className="absolute top-10 right-10 w-32 h-32 bg-[#FCA929]/10 rounded-full blur-3xl" />
                                    <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#FF6700]/10 rounded-full blur-3xl" />

                                    <div className="relative z-10">
                                        <div className="text-center mb-8">
                                            <h3 className="text-2xl md:text-4xl font-black text-white mb-3">
                                                Elige cómo pagar
                                            </h3>
                                            <p className="text-white/60 text-sm md:text-base">
                                                Realiza tu pago y sube el comprobante
                                            </p>
                                        </div>

                                        {/* Monto */}
                                        <div className="relative mb-8">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6700] to-[#ff8800] rounded-2xl blur opacity-20" />
                                            <div className="relative bg-gradient-to-r from-[#FF6700]/15 to-[#ff8800]/15 border-2 border-[#FF6700]/40 rounded-2xl p-5 text-center backdrop-blur-sm">
                                                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Monto a pagar</p>
                                                <p className="text-4xl font-black text-[#FF6700]">
                                                    S/ {total}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                                            {/* Transferencia */}
                                            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FF6700]/20 rounded-2xl p-5 hover:border-[#FF6700]/50 transition-colors">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-[#FF6700] to-[#ff8800] rounded-xl flex items-center justify-center">
                                                        <CreditCard className="w-4 h-4 text-white" />
                                                    </div>
                                                    <h4 className="font-bold text-white text-sm md:text-base">Transferencia bancaria</h4>
                                                </div>
                                                <div className="flex flex-col gap-4 text-sm mt-4">
                                                    {TORNEO_CONFIG.bancos.map((banco, i) => (
                                                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className={`w-2 h-2 rounded-full ${banco.nombre === 'INTERBANK' ? 'bg-green-500' : banco.nombre === 'BCP' ? 'bg-blue-500' : 'bg-white'}`} />
                                                                <span className="font-bold text-white text-xs md:text-sm">{banco.nombre}</span>
                                                                <span className="text-white/50 text-xs ml-auto">{banco.moneda}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-white/50">Cuenta:</span>
                                                                <span className="text-white font-medium font-mono tracking-wider">{banco.cuenta}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Yape */}
                                            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FF6700]/20 rounded-2xl p-5 hover:border-[#FF6700]/50 transition-colors">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-[#FCA929] to-[#ff8800] rounded-xl flex items-center justify-center">
                                                        <Smartphone className="w-4 h-4 text-white" />
                                                    </div>
                                                    <h4 className="font-bold text-white text-sm md:text-base">Yape</h4>
                                                </div>
                                                <div className="space-y-3 text-sm">
                                                    {[
                                                        { label: 'Número', value: TORNEO_CONFIG.yapeNumero },
                                                        { label: 'Nombre', value: TORNEO_CONFIG.yapeNombre },
                                                    ].map(row => (
                                                        <div key={row.label} className="flex justify-between items-center">
                                                            <span className="text-white/50">{row.label}:</span>
                                                            <span className="text-white font-medium">{row.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Upload comprobante */}
                                        <div className="space-y-3 mb-8">
                                            <Label>Comprobante de Pago <span className="text-white/40 text-xs font-normal ml-1">(Opcional)</span></Label>
                                            <p className="text-white/50 text-xs md:text-sm">
                                                Si ya realizaste el pago, sube aquí tu comprobante. Si no lo has hecho, puedes enviarlo después por WhatsApp a la profesora.
                                            </p>

                                            {!comprobanteFile ? (
                                                <label className="group flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-white/20 hover:border-[#FF6700]/50 rounded-2xl cursor-pointer transition-all hover:bg-white/5">
                                                    <Upload className="w-8 h-8 text-white/30 group-hover:text-[#FF6700] transition-colors mb-2" />
                                                    <p className="text-white/40 text-sm group-hover:text-white/70 transition-colors">
                                                        Haz clic para seleccionar archivo
                                                    </p>
                                                    <p className="text-white/25 text-xs mt-1">JPG, PNG o PDF (máx 10 MB)</p>
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,application/pdf"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            ) : (
                                                <div className="relative bg-white/5 border-2 border-white/20 rounded-2xl p-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setComprobanteFile(null); setComprobantePreview(null); }}
                                                        className="absolute top-3 right-3 w-8 h-8 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center transition-colors"
                                                    >
                                                        <X className="w-4 h-4 text-red-400" />
                                                    </button>

                                                    {comprobantePreview ? (
                                                        <img src={comprobantePreview} alt="Comprobante" className="max-h-60 mx-auto rounded-lg object-contain" />
                                                    ) : (
                                                        <div className="flex items-center gap-3 py-4 px-2">
                                                            <div className="w-12 h-12 bg-[#FF6700]/20 rounded-xl flex items-center justify-center">
                                                                <ImageIcon className="w-6 h-6 text-[#FF6700]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-medium">{comprobanteFile.name}</p>
                                                                <p className="text-white/40 text-xs">{(comprobanteFile.size / 1024).toFixed(0)} KB</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Botón final */}
                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={handleConfirm}
                                            className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            <div className={`absolute inset-0 ${!isSubmitting ? 'bg-gradient-to-r from-[#FF6700] via-[#ff8800] to-[#FCA929] animate-gradient-xy' : 'bg-zinc-800'}`} />
                                            {!isSubmitting && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                            )}
                                            <span className="relative flex items-center justify-center gap-3 px-8 py-5 md:py-6 text-white text-lg md:text-2xl font-black uppercase tracking-wider">
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-7 h-7 animate-spin" />
                                                        Enviando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                                                        Confirmar mi registro
                                                    </>
                                                )}
                                            </span>
                                        </button>

                                        {/* Trust badge */}
                                        <p className="text-center text-white/30 text-xs md:text-sm mt-4">
                                            Tus datos están seguros
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* FOOTER */}
            <div className="relative z-20 mt-16">
                <FooterMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} />
            </div>
        </div>
    );
}

export default TorneoPage;
