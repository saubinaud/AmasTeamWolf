import { useState, useMemo, useRef } from 'react';
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
    Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, subDays, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from './ui/utils';
import { motion, AnimatePresence } from 'motion/react';

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

export function PerfilDesktop({ user, onNavigate, onLogout, onRefresh, isRefreshing }: PerfilDesktopProps) {
    const [activeSection, setActiveSection] = useState<'home' | 'calendar' | 'plan' | 'messages'>('home');
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date());

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
    const estaPorVencer = diasRestantes >= 0 && diasRestantes <= 7;
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

    // Calendar
    const calendarDays = useMemo(() => {
        const start = startOfMonth(calendarMonth);
        const end = endOfMonth(calendarMonth);
        return eachDayOfInterval({ start, end });
    }, [calendarMonth]);

    const getAttendance = (day: Date) => user?.asistencias?.find((a: any) => isSameDay(new Date(a.fecha), day));

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

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex">

            {/* Sidebar */}
            <aside className="w-72 bg-zinc-900/50 border-r border-white/5 flex flex-col">
                {/* Logo/Brand */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FA7B21] to-orange-600 flex items-center justify-center font-bold text-lg">
                            W
                        </div>
                        <div>
                            <h1 className="font-bold text-sm">Wolf Academy</h1>
                            <p className="text-[10px] text-zinc-500">Portal del Alumno</p>
                        </div>
                    </div>
                </div>

                {/* User Card */}
                <div className="p-4 m-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FA7B21] to-orange-600 flex items-center justify-center font-bold text-lg">
                            {getIniciales(user.estudiante?.nombre || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{user.estudiante?.nombre}</p>
                            <p className="text-xs text-zinc-500">{user.estudiante?.categoria}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Estado</span>
                        <Badge className={cn(
                            "text-[10px] border-0",
                            isPagado ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        )}>{user.pagos?.estadoPago}</Badge>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2">
                    <div className="space-y-1">
                        {navItems.map(item => (
                            <motion.button
                                key={item.id}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveSection(item.id as any)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                    activeSection === item.id
                                        ? "bg-[#FA7B21]/10 text-[#FA7B21]"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                                {activeSection === item.id && (
                                    <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FA7B21]" />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    <button
                        onClick={onRefresh}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        Actualizar datos
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Top Banner */}
                {(estaVencido || estaPorVencer) && (
                    <div className={cn(
                        "px-6 py-3 flex items-center justify-between",
                        estaVencido ? "bg-red-500/10 border-b border-red-500/20" : "bg-amber-500/10 border-b border-amber-500/20"
                    )}>
                        <div className="flex items-center gap-3">
                            <AlertTriangle className={cn("w-5 h-5", estaVencido ? "text-red-400" : "text-amber-400")} />
                            <span className={cn("text-sm", estaVencido ? "text-red-300" : "text-amber-300")}>
                                {estaVencido ? `Membresía vencida hace ${diasVencido} días` : `${diasRestantes} días para renovar`}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => onNavigate('planes')}
                            className={cn("h-8", estaVencido ? "bg-red-500 hover:bg-red-400" : "bg-amber-500 hover:bg-amber-400 text-black")}
                        >
                            Renovar
                        </Button>
                    </div>
                )}

                <div className="p-8 max-w-5xl mx-auto">
                    <AnimatePresence mode="wait">
                        {/* HOME */}
                        {activeSection === 'home' && (
                            <motion.div
                                key="home"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                {/* Header */}
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Bienvenido, {user.estudiante?.nombre?.split(' ')[0]}</h1>
                                    <p className="text-zinc-500">Aquí está el resumen de tu cuenta</p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#FA7B21]/10 flex items-center justify-center">
                                                <Clock className="w-5 h-5 text-[#FA7B21]" />
                                            </div>
                                            <span className="text-sm text-zinc-400">Días Restantes</span>
                                        </div>
                                        <p className={cn("text-3xl font-bold", estaVencido && "text-red-400")}>{Math.abs(diasRestantes)}</p>
                                    </div>

                                    <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <span className="text-sm text-zinc-400">Asistencias</span>
                                        </div>
                                        <p className="text-3xl font-bold text-emerald-400">{totalAsistencias}</p>
                                    </div>

                                    <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                <Award className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <span className="text-sm text-zinc-400">Categoría</span>
                                        </div>
                                        <p className="text-xl font-bold">{user.estudiante?.categoria}</p>
                                    </div>

                                    <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                                <Zap className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <span className="text-sm text-zinc-400">Progreso</span>
                                        </div>
                                        <p className="text-3xl font-bold">{Math.round(progress)}%</p>
                                    </div>
                                </div>

                                {/* Two Column */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Student Info */}
                                    <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                            <h2 className="font-semibold">Datos del Alumno</h2>
                                            <User className="w-4 h-4 text-zinc-500" />
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {[
                                                { label: 'Nombre', value: user.estudiante?.nombre },
                                                { label: 'DNI', value: user.estudiante?.dni },
                                                { label: 'Edad', value: `${user.estudiante?.edad} años` },
                                                { label: 'Tallas', value: `Uniforme: ${user.estudiante?.tallaUniforme} | Polo: ${user.estudiante?.tallaPolo}` },
                                            ].map((item, i) => (
                                                <div key={i} className="px-5 py-3 flex justify-between">
                                                    <span className="text-sm text-zinc-500">{item.label}</span>
                                                    <span className="text-sm">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Parent Info */}
                                    <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                            <h2 className="font-semibold">Datos del Apoderado</h2>
                                            <User className="w-4 h-4 text-zinc-500" />
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {[
                                                { label: 'Nombre', value: user.familia?.nombreFamilia },
                                                { label: 'Teléfono', value: user.familia?.telefono },
                                                { label: 'Email', value: user.familia?.email },
                                            ].map((item, i) => (
                                                <div key={i} className="px-5 py-3 flex justify-between">
                                                    <span className="text-sm text-zinc-500">{item.label}</span>
                                                    <span className="text-sm truncate ml-4">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-4">
                                            <Button
                                                variant="outline"
                                                className="w-full border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400"
                                                onClick={() => window.open('https://wa.me/51989717412', '_blank')}
                                            >
                                                <Phone className="w-4 h-4 mr-2" /> WhatsApp
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* CALENDAR */}
                        {activeSection === 'calendar' && (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Asistencias</h1>
                                    <p className="text-zinc-500">Historial de tus clases</p>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {/* Calendar */}
                                    <div className="col-span-2 bg-zinc-900/50 rounded-2xl border border-white/5 p-6">
                                        {/* Month Nav */}
                                        <div className="flex items-center justify-between mb-6">
                                            <button onClick={() => setCalendarMonth(m => subDays(m, 30))} className="p-2 hover:bg-white/5 rounded-lg">
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <h2 className="text-xl font-semibold capitalize">{format(calendarMonth, 'MMMM yyyy', { locale: es })}</h2>
                                            <button onClick={() => setCalendarMonth(m => addDays(m, 30))} className="p-2 hover:bg-white/5 rounded-lg">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Weekdays */}
                                        <div className="grid grid-cols-7 mb-2">
                                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                                                <div key={d} className="text-center text-xs text-zinc-500 py-2">{d}</div>
                                            ))}
                                        </div>

                                        {/* Days Grid */}
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: (calendarDays[0]?.getDay() || 7) - 1 }).map((_, i) => (
                                                <div key={`e-${i}`} />
                                            ))}
                                            {calendarDays.map(day => {
                                                const att = getAttendance(day);
                                                const hasAtt = att?.estado === 'asistio';
                                                return (
                                                    <motion.button
                                                        key={day.toISOString()}
                                                        whileHover={{ scale: 1.1 }}
                                                        onClick={() => setSelectedDay(day)}
                                                        className={cn(
                                                            "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all",
                                                            isSameDay(day, selectedDay) && "ring-2 ring-[#FA7B21]",
                                                            hasAtt && "bg-emerald-500/20 text-emerald-400",
                                                            isToday(day) && !hasAtt && "bg-white/5",
                                                            !hasAtt && !isToday(day) && "hover:bg-white/5"
                                                        )}
                                                    >
                                                        {format(day, 'd')}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Day Detail */}
                                    <div className="space-y-4">
                                        <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6">
                                            <p className="text-sm text-zinc-500 capitalize">{format(selectedDay, 'EEEE', { locale: es })}</p>
                                            <p className="text-3xl font-bold mt-1">{format(selectedDay, 'd MMMM', { locale: es })}</p>
                                            <div className={cn(
                                                "mt-6 py-4 rounded-xl text-center",
                                                getAttendance(selectedDay)?.estado === 'asistio' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                                            )}>
                                                {getAttendance(selectedDay)?.estado === 'asistio' ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        <span>Asistió</span>
                                                    </div>
                                                ) : 'Sin registro'}
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6">
                                            <h3 className="text-sm text-zinc-500 mb-4">Resumen</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-400">Total</span>
                                                    <span className="font-bold text-emerald-400">{totalAsistencias}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-400">Este mes</span>
                                                    <span className="font-bold">{user?.asistencias?.filter((a: any) => {
                                                        const d = new Date(a.fecha);
                                                        return d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear() && a.estado === 'asistio';
                                                    }).length || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PLAN */}
                        {activeSection === 'plan' && (
                            <motion.div
                                key="plan"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Tu Plan</h1>
                                    <p className="text-zinc-500">Información de tu membresía</p>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FA7B21]/10 rounded-full blur-3xl -mr-20 -mt-20" />

                                        <div className="flex justify-between items-start mb-8 relative">
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Plan Actual</p>
                                                <h2 className="text-3xl font-bold">{user.matricula?.programa}</h2>
                                            </div>
                                            <Badge className={cn("px-4 py-2", isPagado ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                                                {user.pagos?.estadoPago}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-3 gap-6 mb-8">
                                            <div className="bg-black/30 rounded-xl p-4">
                                                <p className="text-[10px] text-zinc-500 uppercase mb-1">Inicio</p>
                                                <p className="font-medium">{formatDate(user.matricula?.fechaInicio)}</p>
                                            </div>
                                            <div className="bg-black/30 rounded-xl p-4">
                                                <p className="text-[10px] text-zinc-500 uppercase mb-1">Fin</p>
                                                <p className="font-medium">{formatDate(user.matricula?.fechaFin)}</p>
                                            </div>
                                            <div className="bg-black/30 rounded-xl p-4">
                                                <p className="text-[10px] text-zinc-500 uppercase mb-1">Días</p>
                                                <p className={cn("font-medium", estaVencido && "text-red-400")}>{Math.abs(diasRestantes)}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-6 border-t border-white/10">
                                            <span className="text-zinc-400">Costo total</span>
                                            <span className="text-4xl font-bold">S/ {user.pagos?.precioPrograma}</span>
                                        </div>
                                    </div>

                                    {/* Freeze Card */}
                                    {maxDiasCongelar > 0 && (
                                        <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                    <Snowflake className="w-6 h-6 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-blue-100">Congelar</h3>
                                                    <p className="text-xs text-blue-300/60">Máx. {maxDiasCongelar} días</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-blue-200/60 mb-6">Pausa tu plan por viaje o salud.</p>

                                            <Dialog open={isFreezeDialogOpen} onOpenChange={setIsFreezeDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button className="w-full bg-blue-600 hover:bg-blue-500">Solicitar</Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                                                    <DialogHeader>
                                                        <DialogTitle>Congelar Plan</DialogTitle>
                                                        <DialogDescription className="text-zinc-400">Máximo {maxDiasCongelar} días.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4 space-y-4">
                                                        <div>
                                                            <label className="text-xs text-zinc-500 mb-2 block">Fecha de inicio</label>
                                                            <input
                                                                type="date"
                                                                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                                min={new Date().toISOString().split('T')[0]}
                                                                onChange={(e) => setFreezeDate(new Date(e.target.value))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-zinc-500 mb-2 block">Días</label>
                                                            <input
                                                                type="number"
                                                                value={freezeDays}
                                                                onChange={(e) => setFreezeDays(Math.min(maxDiasCongelar, Math.max(1, parseInt(e.target.value) || 1)))}
                                                                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                                                                min={1}
                                                                max={maxDiasCongelar}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button onClick={handleFreezeConfirm} disabled={!freezeDate || isFreezing} className="w-full bg-[#FA7B21] hover:bg-[#F36A15]">
                                                            {isFreezing ? 'Procesando...' : 'Confirmar'}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}
                                </div>

                                <Button onClick={() => onNavigate('planes')} variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                                    <Zap className="w-4 h-4 mr-2 text-[#FA7B21]" /> Ver todos los planes
                                </Button>
                            </motion.div>
                        )}

                        {/* MESSAGES */}
                        {activeSection === 'messages' && (
                            <motion.div
                                key="messages"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Mensajes</h1>
                                    <p className="text-zinc-500">Comunicaciones del equipo</p>
                                </div>

                                {user.mensaje?.contenido ? (
                                    <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden max-w-2xl">
                                        <div className="px-6 py-4 border-b border-white/5 bg-[#FA7B21]/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <MessageCircle className="w-5 h-5 text-[#FA7B21]" />
                                                <span className="font-semibold">Mensaje del Equipo</span>
                                            </div>
                                            <span className="text-xs text-zinc-500">{formatDate(user.mensaje.fecha)}</span>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-zinc-300 leading-relaxed">{user.mensaje.contenido}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 max-w-md mx-auto">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-900/50 flex items-center justify-center">
                                            <MessageCircle className="w-10 h-10 text-zinc-700" />
                                        </div>
                                        <h3 className="text-xl text-zinc-400 font-medium mb-2">Sin mensajes</h3>
                                        <p className="text-zinc-600">Las comunicaciones del equipo aparecerán aquí</p>
                                    </div>
                                )}

                                <Button variant="outline" className="border-white/10 bg-white/5" onClick={() => window.open('https://wa.me/51989717412', '_blank')}>
                                    <Phone className="w-4 h-4 mr-2" /> Contactar Soporte
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
