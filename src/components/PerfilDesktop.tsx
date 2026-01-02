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

export function PerfilDesktop({ user, onNavigate, onLogout, onRefresh, isRefreshing }: PerfilDesktopProps) {
    const [activeSection, setActiveSection] = useState<'home' | 'calendar' | 'plan' | 'messages'>('home');
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    // Freeze
    const [freezeDate, setFreezeDate] = useState<Date | undefined>(undefined);
    const [freezeDays, setFreezeDays] = useState(7);
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
                    // Assuming the webhook returns { date: "YYYY-MM-DD" } or similar
                    // Adjust based on actual response. Indexing safety.
                    if (data && data.fecha) {
                        setGraduacionDate(data.fecha);
                    } else if (Array.isArray(data) && data.length > 0 && data[0].fecha) {
                        setGraduacionDate(data[0].fecha);
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

    const handleFreezeConfirm = () => {
        if (!freezeDate) return toast.error('Selecciona una fecha');
        setIsFreezing(true);
        setTimeout(() => {
            setIsFreezing(false);
            setIsFreezeDialogOpen(false);
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
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-lg relative">
                                                    <span className="absolute inset-0 rounded-full border border-black/10"></span>
                                                    <div className="w-8 h-1 bg-black/20 transform -rotate-45"></div>
                                                </div>
                                                <div>
                                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Cinturón Actual</p>
                                                    <p className="text-xl font-bold text-white">Blanco</p>
                                                </div>
                                            </div>

                                            <div className="flex-1 px-8 flex flex-col items-center">
                                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                                                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-[#FCA929] w-3/4 rounded-full"></div>
                                                </div>
                                                <p className="text-white/40 text-xs mt-2">En progreso para siguiente nivel</p>
                                            </div>

                                            <div className="flex items-center gap-4 text-right">
                                                <div>
                                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Siguiente Nivel</p>
                                                    <p className="text-xl font-bold text-[#FCA929]">Amarillo</p>
                                                </div>
                                                <div className="w-16 h-16 bg-[#FCA929] rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-lg shadow-[#FCA929]/20 relative">
                                                    <span className="absolute inset-0 rounded-full border border-black/10"></span>
                                                    <div className="w-8 h-1 bg-white/40 transform -rotate-45"></div>
                                                </div>
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
                                    <div className="grid grid-cols-6 gap-3">
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
                                                <DialogContent className="bg-zinc-900 border-white/10 max-w-lg">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-white flex items-center gap-2">
                                                            <Snowflake className="w-5 h-5 text-cyan-400" />
                                                            Congelar Programa
                                                        </DialogTitle>
                                                        <DialogDescription className="text-white/60">
                                                            Pausa tu programa temporalmente. Los domingos y feriados no se cuentan.
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="py-4 space-y-5">
                                                        {/* Days Available Banner */}
                                                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-white/60 text-sm">Días disponibles</p>
                                                                <p className="text-2xl font-bold text-cyan-400">{maxDiasCongelar} días</p>
                                                            </div>
                                                            <Snowflake className="w-10 h-10 text-cyan-400/30" />
                                                        </div>

                                                        {/* Start Date Selector */}
                                                        <div className="space-y-2">
                                                            <label className="text-white text-sm font-medium">¿Desde cuándo deseas congelar?</label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setFreezeDate(new Date())}
                                                                    className={cn(
                                                                        "border-white/10 text-sm py-6",
                                                                        freezeDate && isToday(freezeDate)
                                                                            ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                                                                            : "bg-white/5 text-white/60 hover:bg-white/10"
                                                                    )}
                                                                >
                                                                    <div className="text-center">
                                                                        <p className="font-medium">Hoy</p>
                                                                        <p className="text-xs opacity-60">{format(new Date(), 'd MMM', { locale: es })}</p>
                                                                    </div>
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setFreezeDate(addDays(new Date(), 1))}
                                                                    className={cn(
                                                                        "border-white/10 text-sm py-6",
                                                                        freezeDate && isSameDay(freezeDate, addDays(new Date(), 1))
                                                                            ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                                                                            : "bg-white/5 text-white/60 hover:bg-white/10"
                                                                    )}
                                                                >
                                                                    <div className="text-center">
                                                                        <p className="font-medium">Mañana</p>
                                                                        <p className="text-xs opacity-60">{format(addDays(new Date(), 1), 'd MMM', { locale: es })}</p>
                                                                    </div>
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setFreezeDate(addDays(new Date(), 7))}
                                                                    className={cn(
                                                                        "border-white/10 text-sm py-6",
                                                                        freezeDate && isSameDay(freezeDate, addDays(new Date(), 7))
                                                                            ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                                                                            : "bg-white/5 text-white/60 hover:bg-white/10"
                                                                    )}
                                                                >
                                                                    <div className="text-center">
                                                                        <p className="font-medium">En 1 semana</p>
                                                                        <p className="text-xs opacity-60">{format(addDays(new Date(), 7), 'd MMM', { locale: es })}</p>
                                                                    </div>
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Days Selector */}
                                                        <div className="space-y-2">
                                                            <label className="text-white text-sm font-medium">¿Cuántos días deseas congelar?</label>
                                                            <div className="flex items-center gap-4">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => setFreezeDays(Math.max(1, freezeDays - 1))}
                                                                    disabled={freezeDays <= 1}
                                                                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white h-10 w-10"
                                                                >
                                                                    <ChevronLeft className="w-5 h-5" />
                                                                </Button>
                                                                <div className="flex-1 text-center">
                                                                    <span className="text-3xl font-bold text-cyan-400">{freezeDays}</span>
                                                                    <span className="text-white/60 ml-2">días</span>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => setFreezeDays(Math.min(maxDiasCongelar, freezeDays + 1))}
                                                                    disabled={freezeDays >= maxDiasCongelar}
                                                                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white h-10 w-10"
                                                                >
                                                                    <ChevronRight className="w-5 h-5" />
                                                                </Button>
                                                            </div>
                                                            {/* Quick select buttons */}
                                                            <div className="flex gap-2 justify-center">
                                                                {[7, 14, maxDiasCongelar].filter((d, i, arr) => d <= maxDiasCongelar && arr.indexOf(d) === i).map(days => (
                                                                    <Button
                                                                        key={days}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setFreezeDays(days)}
                                                                        className={cn(
                                                                            "border-white/10 text-xs",
                                                                            freezeDays === days ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "bg-white/5 text-white/60 hover:bg-white/10"
                                                                        )}
                                                                    >
                                                                        {days === maxDiasCongelar ? 'Máx' : `${days}d`}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Summary Card */}
                                                        {freezeDate && (
                                                            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-white/60 text-sm">Inicio de congelamiento:</span>
                                                                    <span className="text-white font-medium">{format(freezeDate, "EEEE d 'de' MMMM", { locale: es })}</span>
                                                                </div>
                                                                <div className="h-px bg-white/10" />
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-white/60 text-sm">Retomarías clases:</span>
                                                                    <span className="text-emerald-400 font-medium">
                                                                        {format(addDays(freezeDate, freezeDays), "EEEE d 'de' MMMM", { locale: es })}
                                                                    </span>
                                                                </div>
                                                                <div className="h-px bg-white/10" />
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-white/60 text-sm">Días que usarás:</span>
                                                                    <span className="text-cyan-400 font-semibold">{freezeDays} de {maxDiasCongelar}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-white/60 text-sm">Te quedarán:</span>
                                                                    <span className={cn(
                                                                        "font-semibold",
                                                                        (maxDiasCongelar - freezeDays) > 0 ? "text-emerald-400" : "text-amber-400"
                                                                    )}>
                                                                        {maxDiasCongelar - freezeDays} días
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Info Note */}
                                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
                                                            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                            <p className="text-blue-400/80 text-xs">
                                                                Los domingos y feriados no se cuentan como días de congelamiento.
                                                            </p>
                                                        </div>

                                                        {/* Warning if using all days */}
                                                        {freezeDays === maxDiasCongelar && (
                                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                                                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                                                <p className="text-amber-400/80 text-xs">
                                                                    Estás usando todos tus días de congelamiento disponibles.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <DialogFooter className="flex gap-3">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setIsFreezeDialogOpen(false)}
                                                            className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button
                                                            onClick={handleFreezeConfirm}
                                                            disabled={isFreezing || !freezeDate}
                                                            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50"
                                                        >
                                                            {isFreezing ? 'Procesando...' : `Confirmar ${freezeDays} días`}
                                                        </Button>
                                                    </DialogFooter>
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
                </div >
            </div >
        </div >
    );
}
