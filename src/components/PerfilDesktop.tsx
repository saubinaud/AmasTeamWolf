import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import {
    User,
    LogOut,
    RefreshCw,
    Phone,
    Snowflake,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Zap,
    Home,
    Calendar,
    CreditCard,
    MessageCircle,
    Mail,
    Award,
    Shield,
    Sparkles,
    TrendingUp,
    CalendarCheck,
    Info
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addMonths, subMonths, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from './ui/utils';
import { motion, AnimatePresence } from 'motion/react';
import { HeaderMain } from './HeaderMain';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface PerfilDesktopProps {
    user: any;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    onRefresh: () => Promise<void>;
    isRefreshing: boolean;
}

function formatDate(dateStr: string | Date | undefined | null): string {
    if (!dateStr) return "";
    try {
        const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) return String(dateStr);
        return format(date, "dd MMM yyyy", { locale: es });
    } catch {
        return String(dateStr);
    }
}

// Normalize name to Title Case
function toTitleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
}

const BeltDisplay = ({ color, name }: { color: string, name: string }) => (
    <div className="flex flex-col items-center gap-2">
        <div className="relative w-24 h-12 flex items-center justify-center filter drop-shadow-lg">
            {/* Belt Body */}
            <div
                className="absolute w-full h-8 rounded-sm overflow-hidden"
                style={{ backgroundColor: color }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/20" />
            </div>
            {/* Belt Knot */}
            <div
                className="absolute w-6 h-12 rounded-sm z-10 flex items-center justify-center shadow-xl transform -skew-x-6"
                style={{ backgroundColor: color }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
            </div>
        </div>
        <span className="text-sm font-medium text-white/80 uppercase tracking-widest">{name}</span>
    </div>
);

export function PerfilDesktop({ user, onNavigate, onLogout, onRefresh, isRefreshing }: PerfilDesktopProps) {
    const [activeSection, setActiveSection] = useState<'home' | 'calendar' | 'plan' | 'messages'>('home');
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    // Freeze
    const [freezeRange, setFreezeRange] = useState<DateRange | undefined>();
    const [isFreezing, setIsFreezing] = useState(false);
    const [isFreezeDialogOpen, setIsFreezeDialogOpen] = useState(false);

    // Graduation
    const [graduacionDate, setGraduacionDate] = useState<string | null>(null);

    // Fetch Graduation Date
    useEffect(() => {
        if (activeSection === 'graduacion') {
            fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/graduaci%C3%B3n')
                .then(res => res.json())
                .then(data => {
                    // Try to find a date field in various likely places
                    // logic: check .date, .fecha, .graduationDate in root or first array item
                    const possibleDate = data?.date || data?.fecha || data?.graduationDate ||
                        data?.[0]?.date || data?.[0]?.fecha || data?.[0]?.graduationDate;

                    if (possibleDate) {
                        setGraduacionDate(possibleDate);
                    }
                })
                .catch(err => console.error('Error fetching graduation date:', err));
        }
    }, [activeSection]);

    // Calculations
    const diasRestantes = useMemo(() => {
        if (!user?.matricula?.fechaFin) return 0;
        const fin = new Date(user.matricula.fechaFin);
        return Math.ceil((fin.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }, [user?.matricula?.fechaFin]);

    const estaVencido = diasRestantes < 0;
    const diasVencido = estaVencido ? Math.abs(diasRestantes) : 0;
    const estaPorVencer = diasRestantes >= 0 && diasRestantes <= 15;
    const getIniciales = (nombre: string) => nombre?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    const isPagado = user?.pagos?.estadoPago?.toLowerCase().includes('pagado');
    const totalAsistencias = user?.asistencias?.filter((a: any) => a.estado === 'asistio').length || 0;

    const progress = useMemo(() => {
        if (!user?.matricula?.fechaInicio || !user?.matricula?.fechaFin) return 0;
        const start = new Date(user.matricula.fechaInicio).getTime();
        const end = new Date(user.matricula.fechaFin).getTime();
        return Math.min(Math.max(((Date.now() - start) / (end - start)) * 100, 0), 100);
    }, [user?.matricula?.fechaInicio, user?.matricula?.fechaFin]);

    const getMaxFreezeDays = () => {
        const prog = user?.matricula?.programa?.toLowerCase() || '';
        if (prog.includes('3 meses') || prog.includes('trimestral')) return 15;
        if (prog.includes('6 meses') || prog.includes('semestral')) return 30;
        if (prog.includes('anual') || prog.includes('12 meses')) return 45;
        return 0;
    };
    const maxDiasCongelar = getMaxFreezeDays();

    // Calendar with 6-day week grid (Mon-Sat only)
    const calendarGrid = useMemo(() => {
        const monthStart = startOfMonth(calendarMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
        const days: Date[] = [];

        // Generate 6 weeks worth of Mon-Sat days (36 days total)
        for (let week = 0; week < 6; week++) {
            for (let dayOfWeek = 0; dayOfWeek < 6; dayOfWeek++) { // Mon-Sat only (0-5)
                const currentDay = addDays(startDate, (week * 7) + dayOfWeek);
                days.push(currentDay);
            }
        }
        return days;
    }, [calendarMonth]);

    const getAttendance = (day: Date) => user?.asistencias?.find((a: any) => isSameDay(new Date(a.fecha), day));
    const isCurrentMonth = (day: Date) => day.getMonth() === calendarMonth.getMonth();

    const effectiveFreezeDays = useMemo(() => {
        if (!freezeRange?.from || !freezeRange?.to) return 0;
        return eachDayOfInterval({ start: freezeRange.from, end: freezeRange.to })
            .filter(d => getDay(d) !== 0).length; // Exclude Sundays
    }, [freezeRange]);

    const handleFreezeConfirm = () => {
        if (!freezeRange?.from || !freezeRange?.to) return toast.error('Selecciona un rango de fechas');
        if (effectiveFreezeDays > maxDiasCongelar) return toast.error(`No puedes exceder ${maxDiasCongelar} días`);

        setIsFreezing(true);
        setTimeout(() => {
            setIsFreezing(false);
            setIsFreezeDialogOpen(false);
            setFreezeRange(undefined);
            toast.success('Congelamiento solicitado');
        }, 1500);
    };

    const navItems = [
        { id: 'home', icon: Home, label: 'Inicio' },
        { id: 'calendar', icon: Calendar, label: 'Asistencias' },
        { id: 'plan', icon: CreditCard, label: 'Plan' },
        { id: 'graduacion', icon: Award, label: 'Graduación' },
        { id: 'messages', icon: MessageCircle, label: 'Mensajes' },
    ];

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <HeaderMain
                onNavigate={onNavigate}
                onOpenMatricula={() => onNavigate('planes')}
                onCartClick={() => { }}
                cartItemsCount={0}
            />

            {/* Background - Simple orange glow at bottom */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[#0f0f0f]" />
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 120% 60% at 50% 100%, rgba(250, 123, 33, 0.15) 0%, rgba(252, 169, 41, 0.08) 30%, transparent 70%)'
                    }}
                />
            </div>

            {/* Main Content */}
            <div className="relative z-10 pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-8">

                    {/* Welcome Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                {/* Avatar */}
                                <motion.div
                                    className="relative"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center shadow-2xl shadow-[#FA7B21]/30">
                                        <span className="text-3xl font-bold text-white">
                                            {getIniciales(user?.estudiante?.nombre || 'Usuario')}
                                        </span>
                                    </div>
                                    {isPagado && (
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </motion.div>

                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1
                                            className="text-4xl font-bold"
                                            style={{
                                                background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 50%, #FDCB6E 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text'
                                            }}
                                        >
                                            {toTitleCase(user?.estudiante?.nombre || 'Estudiante')}
                                        </h1>
                                        <Badge className="bg-[#FA7B21]/20 text-[#FCA929] border-[#FA7B21]/30">
                                            {user?.estudiante?.categoria || 'Estudiante'}
                                        </Badge>
                                    </div>
                                    <p className="text-white/60 text-lg">
                                        {user?.matricula?.programa || 'Sin programa activo'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={onRefresh}
                                    variant="outline"
                                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                    disabled={isRefreshing}
                                >
                                    <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                                    Actualizar
                                </Button>
                                <Button
                                    onClick={onLogout}
                                    variant="outline"
                                    className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Cerrar sesión
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Warning Banner */}
                    {(estaVencido || estaPorVencer) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "mb-8 p-4 rounded-2xl flex items-center justify-between",
                                estaVencido
                                    ? "bg-red-500/10 border border-red-500/30"
                                    : "bg-amber-500/10 border border-amber-500/30"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <AlertTriangle className={cn("w-6 h-6", estaVencido ? "text-red-400" : "text-amber-400")} />
                                <div>
                                    <p className={cn("font-semibold", estaVencido ? "text-red-300" : "text-amber-300")}>
                                        {estaVencido ? `Programa vencido hace ${diasVencido} días` : `Solo quedan ${diasRestantes} días`}
                                    </p>
                                    <p className="text-white/60 text-sm">Renueva ahora para continuar entrenando</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => onNavigate('renovacion')}
                                className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white shadow-lg shadow-[#FA7B21]/30"
                            >
                                Renovar ahora
                            </Button>
                        </motion.div>
                    )}

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 mb-8 p-1.5 bg-zinc-900/50 rounded-2xl border border-white/5 w-fit">
                        {navItems.map((item) => (
                            <motion.button
                                key={item.id}
                                onClick={() => setActiveSection(item.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                                    activeSection === item.id
                                        ? "bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white shadow-lg shadow-[#FA7B21]/30"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Content Grid */}
                    <AnimatePresence mode="wait">
                        {activeSection === 'home' && (
                            <motion.div
                                key="home"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-3 gap-6"
                            >
                                {/* Stats Cards */}
                                <motion.div
                                    className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6"
                                    whileHover={{ scale: 1.02, borderColor: 'rgba(250, 123, 33, 0.3)' }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#FA7B21]/20 flex items-center justify-center">
                                            <CalendarCheck className="w-6 h-6 text-[#FCA929]" />
                                        </div>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-none">Activo</Badge>
                                    </div>
                                    <p className="text-white/60 text-sm mb-1">Asistencias</p>
                                    <p className="text-4xl font-bold text-white">{totalAsistencias}</p>
                                    <p className="text-white/40 text-xs mt-2">clases asistidas</p>
                                </motion.div>

                                <motion.div
                                    className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6"
                                    whileHover={{ scale: 1.02, borderColor: 'rgba(250, 123, 33, 0.3)' }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#FA7B21]/20 flex items-center justify-center">
                                            <Clock className="w-6 h-6 text-[#FCA929]" />
                                        </div>
                                        <Badge className={cn(
                                            "border-none",
                                            estaVencido ? "bg-red-500/20 text-red-400" :
                                                estaPorVencer ? "bg-amber-500/20 text-amber-400" :
                                                    "bg-[#FA7B21]/20 text-[#FCA929]"
                                        )}>
                                            {estaVencido ? 'Vencido' : estaPorVencer ? 'Por vencer' : 'Vigente'}
                                        </Badge>
                                    </div>
                                    <p className="text-white/60 text-sm mb-1">Días restantes</p>
                                    <p className={cn(
                                        "text-4xl font-bold",
                                        estaVencido ? "text-red-400" : estaPorVencer ? "text-amber-400" : "text-white"
                                    )}>
                                        {estaVencido ? diasVencido : diasRestantes}
                                    </p>
                                    <p className="text-white/40 text-xs mt-2">
                                        hasta {formatDate(user?.matricula?.fechaFin)}
                                    </p>
                                </motion.div>

                                <motion.div
                                    className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6"
                                    whileHover={{ scale: 1.02, borderColor: 'rgba(250, 123, 33, 0.3)' }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#FA7B21]/20 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-[#FCA929]" />
                                        </div>
                                        <Badge className="bg-[#FA7B21]/20 text-[#FCA929] border-none">
                                            {Math.round(progress)}%
                                        </Badge>
                                    </div>
                                    <p className="text-white/60 text-sm mb-1">Progreso</p>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden mt-4">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                    <p className="text-white/40 text-xs mt-2">del programa completado</p>
                                </motion.div>

                                {/* Info Section */}
                                <motion.div
                                    className="col-span-2 bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8"
                                    whileHover={{ borderColor: 'rgba(250, 123, 33, 0.2)' }}
                                >
                                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                        <User className="w-5 h-5 text-[#FCA929]" />
                                        Información del Estudiante
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-white/40 text-sm">Nombre completo</p>
                                                <p className="text-white text-lg">{toTitleCase(user?.estudiante?.nombre || '-')}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/40 text-sm">DNI</p>
                                                <p className="text-white text-lg">{user?.estudiante?.dni || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/40 text-sm">Edad</p>
                                                <p className="text-white text-lg">{user?.estudiante?.edad ? `${user.estudiante.edad} años` : '-'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-white/40 text-sm">Fecha de Inicio</p>
                                                <p className="text-white text-lg">{formatDate(user?.matricula?.fechaInicio) || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/40 text-sm">Horario</p>
                                                <p className="text-white text-lg">{user?.clases?.[0]?.horario || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/40 text-sm">Talla Uniforme</p>
                                                <p className="text-white text-lg">{user?.estudiante?.tallaUniforme || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Contact Card */}
                                <motion.div
                                    className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6"
                                    whileHover={{ scale: 1.02, borderColor: 'rgba(250, 123, 33, 0.3)' }}
                                >
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Phone className="w-5 h-5 text-[#FCA929]" />
                                        Contacto
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                            <Mail className="w-4 h-4 text-[#FCA929]" />
                                            <span className="text-white/80 text-sm truncate">
                                                {user?.familia?.email || '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                            <Phone className="w-4 h-4 text-[#FCA929]" />
                                            <span className="text-white/80 text-sm">
                                                {user?.familia?.telefono || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}



                        {activeSection === 'graduacion' && (
                            <motion.div
                                key="graduacion"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8">
                                    <h3 className="text-2xl font-semibold text-white flex items-center gap-3 mb-6">
                                        <Award className="w-6 h-6 text-[#FCA929]" />
                                        Tu Progreso
                                    </h3>

                                    {/* Next Graduation Card */}
                                    <div className="bg-gradient-to-br from-[#FA7B21]/10 to-[#FCA929]/5 border border-[#FA7B21]/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FA7B21]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-white/60 text-sm uppercase tracking-wider font-medium mb-1">Próxima Graduación</h4>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-bold text-white">
                                                        {graduacionDate ? format(new Date(graduacionDate), "d 'de' MMMM", { locale: es }) : 'Cargando...'}
                                                    </span>
                                                    <span className="text-white/40 text-sm">
                                                        {graduacionDate ? format(new Date(graduacionDate), "yyyy") : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-14 h-14 bg-[#FA7B21]/20 rounded-xl flex items-center justify-center border border-[#FA7B21]/30">
                                                <CalendarCheck className="w-7 h-7 text-[#FCA929]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Belt Progress Mock */}
                                    <div className="space-y-6 mt-12">
                                        <div className="flex items-center justify-between px-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <p className="text-white/40 text-xs uppercase tracking-wider">Cinturón Actual</p>
                                                <BeltDisplay color="#ffffff" name="Blanco" />
                                            </div>

                                            <div className="flex-1 px-8 flex flex-col items-center -mt-6">
                                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                                                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-[#FCA929] w-3/4 rounded-full shadow-[0_0_15px_rgba(252,169,41,0.5)]"></div>
                                                </div>
                                                <p className="text-white/40 text-xs mt-3 font-medium">En camino al siguiente nivel</p>
                                            </div>

                                            <div className="flex flex-col items-center gap-3">
                                                <p className="text-white/40 text-xs uppercase tracking-wider">Siguiente Nivel</p>
                                                <BeltDisplay color="#FCA929" name="Amarillo" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'calendar' && (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Google Calendar Style Header */}
                                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                                                <Calendar className="w-6 h-6 text-[#FCA929]" />
                                                Calendario de Asistencias
                                            </h3>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCalendarMonth(new Date())}
                                                className="border-[#FA7B21]/30 bg-[#FA7B21]/10 hover:bg-[#FA7B21]/20 text-[#FCA929]"
                                            >
                                                Hoy
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 w-10"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </Button>
                                            <span className="text-xl font-medium text-white min-w-[180px] text-center capitalize">
                                                {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 w-10"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Week Headers - Google Style */}
                                    <div className="grid grid-cols-6 gap-3 mb-4">
                                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                                            <div key={day} className="text-center text-white/50 text-sm font-medium py-3 border-b border-white/5">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar Grid - Full Month, Monday to Saturday */}
                                    <div className="grid grid-cols-6 gap-3 w-full">
                                        {calendarGrid.map((day, idx) => {
                                            const attendance = getAttendance(day);
                                            const inCurrentMonth = isCurrentMonth(day);
                                            const today = isToday(day);

                                            return (
                                                <motion.div
                                                    key={idx}
                                                    whileHover={{ scale: 1.02 }}
                                                    className={cn(
                                                        "min-h-[80px] rounded-xl p-3 flex flex-col transition-all cursor-pointer relative",
                                                        !inCurrentMonth && "opacity-40",
                                                        today && "ring-2 ring-[#FCA929] bg-[#FA7B21]/10",
                                                        attendance?.estado === 'asistio' && "bg-emerald-500/15 border border-emerald-500/30",
                                                        attendance?.estado === 'tardanza' && "bg-amber-500/15 border border-amber-500/30",
                                                        !attendance && inCurrentMonth && !today && "bg-white/[0.02] hover:bg-white/[0.05] border border-white/5"
                                                    )}
                                                >
                                                    {/* Date number */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={cn(
                                                            "text-lg font-semibold",
                                                            today ? "text-[#FCA929]" : "text-white/80",
                                                            attendance?.estado === 'asistio' && "text-emerald-400",
                                                            attendance?.estado === 'tardanza' && "text-amber-400"
                                                        )}>
                                                            {format(day, 'd')}
                                                        </span>
                                                        {today && (
                                                            <span className="text-[10px] uppercase tracking-wider text-[#FCA929] font-medium bg-[#FA7B21]/20 px-2 py-0.5 rounded">
                                                                Hoy
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Attendance indicator */}
                                                    {attendance && (
                                                        <div className="flex-1 flex items-end">
                                                            <div className={cn(
                                                                "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg",
                                                                attendance.estado === 'asistio' && "bg-emerald-500/20 text-emerald-400",
                                                                attendance.estado === 'tardanza' && "bg-amber-500/20 text-amber-400"
                                                            )}>
                                                                {attendance.estado === 'asistio' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                                {attendance.estado === 'tardanza' && <AlertTriangle className="w-3.5 h-3.5" />}
                                                                <span className="capitalize">{attendance.estado === 'asistio' ? 'Asistió' : 'Tardanza'}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Stats Row - Horizontal */}
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Total Asistencias */}
                                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white/50 text-sm">Asistencias</p>
                                            <p className="text-2xl font-bold text-emerald-400">{totalAsistencias}</p>
                                        </div>
                                    </div>

                                    {/* Tardanzas */}
                                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                            <AlertTriangle className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-white/50 text-sm">Tardanzas</p>
                                            <p className="text-2xl font-bold text-amber-400">
                                                {user?.asistencias?.filter((a: any) => a.estado === 'tardanza').length || 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5">
                                        <p className="text-white/50 text-sm mb-3">Leyenda</p>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-emerald-500/50 border border-emerald-500"></div>
                                                <span className="text-white/70 text-sm">Asistencia</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded bg-amber-500/50 border border-amber-500"></div>
                                                <span className="text-white/70 text-sm">Tardanza</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded ring-2 ring-[#FCA929]"></div>
                                                <span className="text-white/70 text-sm">Hoy</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'plan' && (
                            <motion.div
                                key="plan"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-2 gap-6"
                            >
                                {/* Plan Details */}
                                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8">
                                    <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                                        <CreditCard className="w-6 h-6 text-[#FCA929]" />
                                        Mi Plan
                                    </h3>

                                    <div className="p-6 bg-gradient-to-br from-[#FA7B21]/20 to-[#FCA929]/10 border border-[#FA7B21]/30 rounded-2xl mb-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-2xl font-bold text-white">
                                                {user?.matricula?.programa || 'Sin programa'}
                                            </span>
                                            <Badge className={cn(
                                                "text-sm px-4 py-1",
                                                isPagado ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                                            )}>
                                                {isPagado ? 'Pagado' : 'Pendiente'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold" style={{
                                                background: 'linear-gradient(135deg, #FA7B21, #FCA929)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent'
                                            }}>
                                                S/ {user?.pagos?.precioAPagar || 0}
                                            </span>
                                            {user?.pagos?.descuento > 0 && (
                                                <span className="text-white/40 line-through">
                                                    S/ {user?.pagos?.precioPrograma}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                                            <span className="text-white/60">Fecha inicio</span>
                                            <span className="text-white font-medium">{formatDate(user?.matricula?.fechaInicio)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                                            <span className="text-white/60">Fecha fin</span>
                                            <span className="text-white font-medium">{formatDate(user?.matricula?.fechaFin)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                                            <span className="text-white/60">Días restantes</span>
                                            <span className={cn(
                                                "font-medium",
                                                estaVencido ? "text-red-400" : estaPorVencer ? "text-amber-400" : "text-emerald-400"
                                            )}>
                                                {estaVencido ? `Vencido hace ${diasVencido} días` : `${diasRestantes} días`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                                            <span className="text-white/60">Estado</span>
                                            <span className={cn(
                                                "font-medium",
                                                estaVencido ? "text-red-400" : "text-emerald-400"
                                            )}>
                                                {estaVencido ? 'Vencido' : 'Activo'}
                                            </span>
                                        </div>
                                        {user?.pagos?.descuento > 0 && (
                                            <div className="flex justify-between items-center py-3">
                                                <span className="text-white/60">Descuento aplicado</span>
                                                <span className="text-[#FCA929] font-medium">{user.pagos.descuento}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right column: Freeze + conditional Renewal */}
                                <div className="space-y-6">
                                    {/* Freeze Card */}
                                    {maxDiasCongelar > 0 && (
                                        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-3xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Snowflake className="w-6 h-6 text-cyan-400" />
                                                <h4 className="text-lg font-semibold text-white">Congelar Programa</h4>
                                            </div>
                                            <p className="text-white/60 text-sm mb-4">
                                                Tienes <span className="text-cyan-400 font-semibold">{maxDiasCongelar} días</span> disponibles para congelar
                                            </p>
                                            <Dialog open={isFreezeDialogOpen} onOpenChange={setIsFreezeDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                                                        <Snowflake className="w-4 h-4 mr-2" />
                                                        Solicitar Congelamiento
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-zinc-900 border-white/10 max-w-4xl p-0 overflow-hidden gap-0 flex">
                                                    {/* Left: Calendar Picker */}
                                                    <div className="p-6 border-r border-white/5 bg-black/20 flex-1">
                                                        <div className="mb-6">
                                                            <DialogTitle className="text-white flex items-center gap-2 mb-2">
                                                                <Snowflake className="w-5 h-5 text-cyan-400" />
                                                                Selecciona las fechas
                                                            </DialogTitle>
                                                            <DialogDescription className="text-white/60">
                                                                Elige el día de inicio y el día de fin del congelamiento.
                                                            </DialogDescription>
                                                        </div>

                                                        <div className="flex justify-center bg-zinc-900 rounded-2xl p-4 border border-white/5">
                                                            <style>{`
                                                                .rdp { --rdp-accent-color: #FA7B21; --rdp-background-color: rgba(250, 123, 33, 0.2); margin: 0; }
                                                                .rdp-day_selected:not([disabled]) { font-weight: bold; border: 2px solid #FA7B21; }
                                                                .rdp-day_selected:hover:not([disabled]) { border-color: #FA7B21; color: white; }
                                                                .rdp-day { color: #e4e4e7; }
                                                                .rdp-day:hover:not([disabled]) { background-color: rgba(255,255,255,0.1); }
                                                            `}</style>
                                                            <DayPicker
                                                                mode="range"
                                                                selected={freezeRange}
                                                                onSelect={setFreezeRange}
                                                                disabled={{ before: new Date() }}
                                                                numberOfMonths={1}
                                                                locale={es}
                                                                className="text-white"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Right: Summary & Legend */}
                                                    <div className="w-[320px] bg-zinc-900/50 p-6 flex flex-col justify-between">
                                                        <div className="space-y-6">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Resumen</h4>

                                                                {/* Days Balance */}
                                                                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-6">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-cyan-200 text-sm">Días disponibles</span>
                                                                        <span className="text-cyan-400 font-bold">{maxDiasCongelar}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-white/60 text-sm">Usarás</span>
                                                                        <span className={cn(
                                                                            "font-bold",
                                                                            effectiveFreezeDays > maxDiasCongelar ? "text-red-400" : "text-white"
                                                                        )}>
                                                                            {effectiveFreezeDays} días
                                                                        </span>
                                                                    </div>
                                                                    {effectiveFreezeDays > maxDiasCongelar && (
                                                                        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded">
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            Excedes el límite permitido
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Dates Summary */}
                                                                <div className="space-y-4">
                                                                    <div className="flex justify-between items-center group">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                                                                                <Calendar className="w-4 h-4 text-cyan-400" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs text-white/40 uppercase">Inicio</p>
                                                                                <p className="text-sm font-medium text-white">
                                                                                    {freezeRange?.from ? format(freezeRange.from, "d 'de' MMM", { locale: es }) : '-'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="w-px h-4 bg-white/10 ml-4"></div>

                                                                    <div className="flex justify-between items-center group">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                                                                                <Calendar className="w-4 h-4 text-cyan-400" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs text-white/40 uppercase">Fin</p>
                                                                                <p className="text-sm font-medium text-white">
                                                                                    {freezeRange?.to ? format(freezeRange.to, "d 'de' MMM", { locale: es }) : '-'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="w-px h-4 bg-white/10 ml-4"></div>

                                                                    <div className="flex justify-between items-center group">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                                                <Zap className="w-4 h-4 text-emerald-400" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs text-emerald-400/60 uppercase">Retomas</p>
                                                                                <p className="text-sm font-medium text-emerald-400">
                                                                                    {freezeRange?.to ? format(addDays(freezeRange.to, 1), "EEEE d", { locale: es }) : '-'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-white/5 rounded-lg p-3 text-xs text-white/50 flex gap-2">
                                                                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                                <p>Los domingos no se descuentan de tu saldo de congelamiento.</p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-auto pt-6 border-t border-white/5">
                                                            <div className="flex gap-3">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setIsFreezeDialogOpen(false)}
                                                                    className="flex-1 border-white/10 hover:bg-white/5 text-white"
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    onClick={handleFreezeConfirm}
                                                                    disabled={!freezeRange?.from || !freezeRange?.to || effectiveFreezeDays > maxDiasCongelar || isFreezing}
                                                                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {isFreezing ? (
                                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                                    ) : 'Confirmar'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}

                                    {/* Renewal CTA - Only when 15 days or less remaining */}
                                    {(estaPorVencer || estaVencido) && (
                                        <div className="bg-gradient-to-br from-[#FA7B21]/20 via-[#431C28]/30 to-[#FCA929]/10 backdrop-blur-sm border border-[#FA7B21]/30 rounded-3xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-xl flex items-center justify-center shadow-lg shadow-[#FA7B21]/30">
                                                    <Sparkles className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-semibold text-white">¡Hora de renovar!</h4>
                                                    <p className="text-white/60 text-sm">
                                                        {estaVencido ? 'Tu programa ha vencido' : `Solo quedan ${diasRestantes} días`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => onNavigate('renovacion')}
                                                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-4 shadow-lg shadow-[#FA7B21]/30"
                                            >
                                                Renovar Programa
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'messages' && (
                            <motion.div
                                key="messages"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-3xl"
                            >
                                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8">
                                    <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                                        <MessageCircle className="w-6 h-6 text-[#FCA929]" />
                                        Mensajes
                                    </h3>

                                    {user?.mensaje?.contenido ? (
                                        <div className="bg-gradient-to-br from-[#FA7B21]/10 to-transparent border border-[#FA7B21]/20 rounded-2xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-[#FA7B21]/20 rounded-full flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-[#FCA929]" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">AMAS Team Wolf</p>
                                                    <p className="text-white/40 text-sm">{formatDate(user.mensaje.fecha)}</p>
                                                </div>
                                            </div>
                                            <p className="text-white/80 leading-relaxed">{user.mensaje.contenido}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Mail className="w-10 h-10 text-white/20" />
                                            </div>
                                            <p className="text-white/40 text-lg">No tienes mensajes nuevos</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
