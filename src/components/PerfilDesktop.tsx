import { useState, useMemo } from 'react';
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
    CalendarCheck
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

    // Calendar with full week grid
    const calendarGrid = useMemo(() => {
        const monthStart = startOfMonth(calendarMonth);
        const monthEnd = endOfMonth(calendarMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
        const days = [];
        let currentDay = startDate;

        // Generate 6 weeks (42 days) to ensure full grid
        for (let i = 0; i < 42; i++) {
            days.push(currentDay);
            currentDay = addDays(currentDay, 1);
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
                                                <p className="text-white/40 text-sm">Categoría</p>
                                                <p className="text-white text-lg">{user?.estudiante?.categoria || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/40 text-sm">Horario</p>
                                                <p className="text-white text-lg">{user?.clases?.[0]?.horario || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/40 text-sm">Fecha de inscripción</p>
                                                <p className="text-white text-lg">{formatDate(user?.matricula?.fechaInscripcion)}</p>
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

                        {activeSection === 'calendar' && (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-3 gap-6"
                            >
                                {/* Calendar - Full Width Style */}
                                <div className="col-span-2 bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                                            <Calendar className="w-6 h-6 text-[#FCA929]" />
                                            Calendario de Asistencias
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </Button>
                                            <span className="text-xl font-medium text-white min-w-[200px] text-center capitalize">
                                                {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                                                className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Week Headers */}
                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                        {weekDays.map(day => (
                                            <div key={day} className="text-center text-white/40 text-sm font-medium py-2">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 gap-2">
                                        {calendarGrid.map((day, idx) => {
                                            const attendance = getAttendance(day);
                                            const inCurrentMonth = isCurrentMonth(day);
                                            const today = isToday(day);

                                            return (
                                                <motion.div
                                                    key={idx}
                                                    whileHover={{ scale: 1.05 }}
                                                    className={cn(
                                                        "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer",
                                                        !inCurrentMonth && "opacity-30",
                                                        today && "ring-2 ring-[#FCA929]",
                                                        attendance?.estado === 'asistio' && "bg-emerald-500/20 border border-emerald-500/30",
                                                        attendance?.estado === 'falta' && "bg-red-500/20 border border-red-500/30",
                                                        attendance?.estado === 'tardanza' && "bg-amber-500/20 border border-amber-500/30",
                                                        !attendance && inCurrentMonth && "bg-white/5 hover:bg-white/10 border border-transparent"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-lg font-medium",
                                                        today ? "text-[#FCA929]" : "text-white",
                                                        attendance?.estado === 'asistio' && "text-emerald-400",
                                                        attendance?.estado === 'falta' && "text-red-400",
                                                        attendance?.estado === 'tardanza' && "text-amber-400"
                                                    )}>
                                                        {format(day, 'd')}
                                                    </span>
                                                    {attendance && (
                                                        <div className="absolute bottom-2">
                                                            {attendance.estado === 'asistio' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                                            {attendance.estado === 'falta' && <Clock className="w-4 h-4 text-red-400" />}
                                                            {attendance.estado === 'tardanza' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Stats & Legend */}
                                <div className="space-y-6">
                                    {/* Legend */}
                                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6">
                                        <h4 className="text-lg font-semibold text-white mb-4">Leyenda</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded bg-emerald-500/50 border border-emerald-500"></div>
                                                <span className="text-white/70">Asistencia</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded bg-amber-500/50 border border-amber-500"></div>
                                                <span className="text-white/70">Tardanza</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded ring-2 ring-[#FCA929]"></div>
                                                <span className="text-white/70">Hoy</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6">
                                        <h4 className="text-lg font-semibold text-white mb-4">Resumen</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white/60">Asistencias</span>
                                                <span className="text-emerald-400 font-semibold text-lg">{totalAsistencias}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-white/60">Tardanzas</span>
                                                <span className="text-amber-400 font-semibold text-lg">
                                                    {user?.asistencias?.filter((a: any) => a.estado === 'tardanza').length || 0}
                                                </span>
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
                                                Tienes hasta {maxDiasCongelar} días disponibles para congelar tu programa
                                            </p>
                                            <Dialog open={isFreezeDialogOpen} onOpenChange={setIsFreezeDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                                                        <Snowflake className="w-4 h-4 mr-2" />
                                                        Solicitar Congelamiento
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-zinc-900 border-white/10">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-white">Congelar Programa</DialogTitle>
                                                        <DialogDescription className="text-white/60">
                                                            Selecciona cuántos días deseas congelar
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <p className="text-white/60 text-sm text-center">
                                                            Máximo {maxDiasCongelar} días disponibles
                                                        </p>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            onClick={handleFreezeConfirm}
                                                            disabled={isFreezing}
                                                            className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                                        >
                                                            {isFreezing ? 'Procesando...' : 'Confirmar'}
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
                </div>
            </div>
        </div>
    );
}
