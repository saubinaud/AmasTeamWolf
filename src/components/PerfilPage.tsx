import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  XCircle,
  Home,
  Calendar,
  CreditCard,
  MessageCircle,
  Mail,
  Award,
  Shield,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from './ui/utils';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { PerfilDesktop } from './PerfilDesktop';
import { AccountLinkingStep } from './AccountLinkingStep';

interface PerfilPageProps {
  onNavigate: (page: string) => void;
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

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export function PerfilPage({ onNavigate }: PerfilPageProps) {
  const { user, logout, refreshUserData, isAuthenticated } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'calendar' | 'plan' | 'messages'>('home');
  const isMobile = useIsMobile();

  // Calendar
  const [calendarCenterDate, setCalendarCenterDate] = useState(new Date());
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Freeze
  const [freezeDate, setFreezeDate] = useState<Date | undefined>(undefined);
  const [freezeDays, setFreezeDays] = useState(7);
  const [isFreezing, setIsFreezing] = useState(false);
  const [isFreezeDialogOpen, setIsFreezeDialogOpen] = useState(false);

  // Touch handling for calendar swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // AuthGuard handles redirecting unauthenticated users
  // This component only renders when user is authenticated

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    toast.success('Actualizado');
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left - go forward
        setCalendarCenterDate(prev => addDays(prev, isMobile ? 3 : 7));
      } else {
        // Swipe right - go back
        setCalendarCenterDate(prev => subDays(prev, isMobile ? 3 : 7));
      }
    }
  };

  // --- CALCULATIONS ---
  const diasRestantes = useMemo(() => {
    if (!user?.matricula?.fechaFin) return 0;
    const hoy = new Date();
    const fin = new Date(user.matricula.fechaFin);
    return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }, [user?.matricula?.fechaFin]);

  const diasVencido = diasRestantes < 0 ? Math.abs(diasRestantes) : 0;
  const estaVencido = diasRestantes < 0;
  const estaPorVencer = diasRestantes >= 0 && diasRestantes <= 7;
  const bloqueadoPorVencimiento = diasVencido > 30;

  const getIniciales = (nombre: string) => nombre?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  const isPagado = user?.pagos?.estadoPago?.toLowerCase().includes('pagado');

  const getMaxFreezeDays = () => {
    const prog = user?.matricula?.programa?.toLowerCase() || '';
    if (prog.includes('3 meses') || prog.includes('trimestral')) return 15;
    if (prog.includes('6 meses') || prog.includes('semestral')) return 30;
    if (prog.includes('anual') || prog.includes('12 meses') || prog.includes('año')) return 45;
    return 0;
  };

  const maxDiasCongelar = getMaxFreezeDays();
  const puedeCongelar = maxDiasCongelar > 0;

  const handleFreezeConfirm = async () => {
    if (!freezeDate) {
      toast.error('Selecciona una fecha');
      return;
    }
    setIsFreezing(true);
    setTimeout(() => {
      setIsFreezing(false);
      setIsFreezeDialogOpen(false);
      toast.success('Congelamiento solicitado');
    }, 1500);
  };

  // Calendar days - more on desktop, fewer on mobile
  const calendarDays = useMemo(() => {
    const days = [];
    const range = isMobile ? 2 : 3;
    for (let i = -range; i <= range; i++) {
      days.push(addDays(calendarCenterDate, i));
    }
    return days;
  }, [calendarCenterDate, isMobile]);

  const getAttendanceForDay = (day: Date) => {
    return user?.asistencias?.find(a => isSameDay(new Date(a.fecha), day));
  };

  const totalAsistencias = user?.asistencias?.filter(a => a.estado === 'asistio').length || 0;

  const progress = useMemo(() => {
    if (!user?.matricula?.fechaInicio || !user?.matricula?.fechaFin) return 0;
    const start = new Date(user.matricula.fechaInicio).getTime();
    const end = new Date(user.matricula.fechaFin).getTime();
    const now = Date.now();
    return Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100);
  }, [user?.matricula?.fechaInicio, user?.matricula?.fechaFin]);

  // Check if user has linked profile data
  const hasLinkedProfile = user && user.estudiante && user.estudiante.nombre;

  // If authenticated but no linked profile, show linking step
  if (!hasLinkedProfile) {
    return (
      <AccountLinkingStep
        onComplete={async () => {
          await refreshUserData();
        }}
        onLogout={handleLogout}
      />
    );
  }

  // Blocked
  if (bloqueadoPorVencimiento) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center"
          >
            <XCircle className="w-10 h-10 text-red-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Membresía Vencida</h1>
          <p className="text-zinc-500 mb-8 text-sm">Tu plan venció hace más de 30 días.</p>
          <Button
            onClick={() => onNavigate('planes')}
            className="w-full h-14 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-5 h-5 mr-2" /> Renovar Ahora
          </Button>
          <button onClick={handleLogout} className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Cerrar sesión
          </button>
        </motion.div>
      </div>
    );
  }

  // Desktop version - render separate component
  if (!isMobile) {
    return (
      <PerfilDesktop
        user={user}
        onNavigate={onNavigate}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  // Section content renderer (MOBILE)
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Progress Card */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 rounded-3xl p-6 border border-white/5 backdrop-blur-sm">
              <div className={cn("flex gap-6", isMobile ? "flex-col items-center" : "items-center")}>
                {/* Progress Ring */}
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-28 h-28 -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="none" className="text-zinc-800/50" />
                    <motion.circle
                      cx="56" cy="56" r="48"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 302" }}
                      animate={{ strokeDasharray: `${progress * 3.02} 302` }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FA7B21" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      className={cn("font-bold", estaVencido ? "text-red-400" : "text-white")}
                      style={{ fontSize: isMobile ? '1.75rem' : '2rem' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {Math.abs(diasRestantes)}
                    </motion.span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{estaVencido ? 'Vencido' : 'Días'}</span>
                  </div>
                </div>

                <div className={cn("flex-1 space-y-4", isMobile && "text-center w-full")}>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Progreso del ciclo</p>
                    <p className="text-2xl font-bold">{Math.round(progress)}%</p>
                  </div>
                  <div className={cn("grid grid-cols-2 gap-4", isMobile && "text-left")}>
                    <div className="bg-black/30 rounded-xl p-3">
                      <p className="text-[9px] text-zinc-600 uppercase">Inicio</p>
                      <p className="text-sm text-zinc-300">{formatDate(user.matricula?.fechaInicio)}</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3">
                      <p className="text-[9px] text-zinc-600 uppercase">Fin</p>
                      <p className="text-sm text-zinc-300">{formatDate(user.matricula?.fechaFin)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection('calendar')}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-left transition-colors hover:bg-emerald-500/15"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400/80">Asistencias</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">{totalAsistencias}</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection('plan')}
                className="bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-2xl p-5 text-left transition-colors hover:bg-[#FA7B21]/15"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-[#FA7B21]" />
                  <span className="text-xs text-[#FA7B21]/80">{user.estudiante?.categoria}</span>
                </div>
                <p className="text-sm font-semibold text-orange-300 truncate">{user.matricula?.programa}</p>
              </motion.button>
            </div>

            {/* Info Cards */}
            <div className="space-y-4">
              <h3 className="text-xs text-zinc-500 font-medium uppercase tracking-wider px-1">Información</h3>

              <motion.div
                className="bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {[
                  { icon: User, label: 'Alumno', value: user.estudiante?.nombre, extra: `DNI: ${user.estudiante?.dni}` },
                  { icon: Shield, label: 'Edad', value: `${user.estudiante?.edad} años`, tallas: true },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-4 flex items-center gap-4 transition-colors hover:bg-white/[0.02]",
                    i > 0 && "border-t border-white/5"
                  )}>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-medium truncate">{item.value}</p>
                    </div>
                    {item.extra && <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-1 rounded-lg">{item.extra}</span>}
                    {item.tallas && (
                      <div className="flex gap-2">
                        <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded">U: {user.estudiante?.tallaUniforme}</span>
                        <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded">P: {user.estudiante?.tallaPolo}</span>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>

              <motion.div
                className="bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {[
                  { icon: User, label: 'Apoderado', value: user.familia?.nombreFamilia },
                  { icon: Phone, label: 'Teléfono', value: user.familia?.telefono },
                  { icon: Mail, label: 'Email', value: user.familia?.email },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-4 flex items-center gap-4 transition-colors hover:bg-white/[0.02]",
                    i > 0 && "border-t border-white/5"
                  )}>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-medium truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-medium text-base"
                onClick={() => window.open('https://wa.me/51989717412', '_blank')}
              >
                <Phone className="w-5 h-5 mr-2" /> Soporte WhatsApp
              </Button>
            </motion.div>
          </motion.div>
        );

      case 'calendar':
        return (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCalendarCenterDate(subDays(calendarCenterDate, isMobile ? 3 : 7))}
                className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              <div className="text-center">
                <motion.p
                  key={calendarCenterDate.toISOString()}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-semibold capitalize"
                >
                  {format(calendarCenterDate, 'MMMM', { locale: es })}
                </motion.p>
                <p className="text-sm text-zinc-500">{format(calendarCenterDate, 'yyyy')}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCalendarCenterDate(addDays(calendarCenterDate, isMobile ? 3 : 7))}
                className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Day Strip with swipe */}
            <div
              ref={calendarContainerRef}
              className="overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <motion.div
                className="flex justify-center gap-2"
                key={calendarCenterDate.toISOString()}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                {calendarDays.map((day, index) => {
                  const attendance = getAttendanceForDay(day);
                  const hasAttendance = attendance?.estado === 'asistio';
                  const isCurrentDay = isToday(day);
                  const isCenterDay = isSameDay(day, calendarCenterDate);

                  return (
                    <motion.button
                      key={day.toISOString()}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCalendarCenterDate(day)}
                      className={cn(
                        "flex-shrink-0 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300",
                        isMobile ? "w-16 min-w-16" : "w-20 min-w-20",
                        isCenterDay && "bg-gradient-to-b from-[#FA7B21] to-orange-600 shadow-lg shadow-[#FA7B21]/20",
                        !isCenterDay && isCurrentDay && "bg-white/10 ring-1 ring-[#FA7B21]/30",
                        !isCenterDay && !isCurrentDay && "bg-zinc-900/50 hover:bg-zinc-800/50"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] uppercase font-medium tracking-wide",
                        isCenterDay ? "text-white/80" : "text-zinc-500"
                      )}>
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <span className={cn(
                        "text-2xl font-bold",
                        isCenterDay ? "text-white" : isCurrentDay ? "text-[#FA7B21]" : "text-zinc-300"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        hasAttendance ? (isCenterDay ? "bg-white" : "bg-emerald-400") : "bg-transparent"
                      )} />
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {/* Selected Day Detail */}
            <motion.div
              className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5"
              key={calendarCenterDate.toDateString()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <p className="text-sm text-zinc-400 capitalize">{format(calendarCenterDate, 'EEEE', { locale: es })}</p>
                <p className="text-4xl font-bold mt-2">{format(calendarCenterDate, 'd MMMM', { locale: es })}</p>
              </div>

              {(() => {
                const attendance = getAttendanceForDay(calendarCenterDate);
                if (attendance?.estado === 'asistio') {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-4 py-5 px-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      <span className="text-emerald-300 font-semibold text-lg">¡Asistencia registrada!</span>
                    </motion.div>
                  );
                }
                return (
                  <div className="flex items-center justify-center gap-3 py-5 px-6 bg-zinc-800/50 rounded-2xl border border-white/5">
                    <Clock className="w-6 h-6 text-zinc-500" />
                    <span className="text-zinc-400">Sin registro de asistencia</span>
                  </div>
                );
              })()}
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 rounded-2xl p-5 border border-white/5">
                <p className="text-xs text-zinc-500 mb-2">Total asistencias</p>
                <p className="text-3xl font-bold text-emerald-400">{totalAsistencias}</p>
              </div>
              <div className="bg-zinc-900/40 rounded-2xl p-5 border border-white/5">
                <p className="text-xs text-zinc-500 mb-2">Este mes</p>
                <p className="text-3xl font-bold text-zinc-300">
                  {user.asistencias?.filter(a => {
                    const d = new Date(a.fecha);
                    return d.getMonth() === calendarCenterDate.getMonth() &&
                      d.getFullYear() === calendarCenterDate.getFullYear() &&
                      a.estado === 'asistio';
                  }).length || 0}
                </p>
              </div>
            </div>

            {/* Jump to Today */}
            {!isToday(calendarCenterDate) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setCalendarCenterDate(new Date())}
                className="w-full py-4 text-sm text-[#FA7B21] hover:text-orange-300 transition-colors font-medium"
              >
                ← Volver a hoy
              </motion.button>
            )}
          </motion.div>
        );

      case 'plan':
        return (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Plan Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 p-6 border border-white/5">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#FA7B21]/10 rounded-full blur-3xl -mr-16 -mt-16" />

              <div className="flex justify-between items-start mb-6 relative">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Tu Plan</p>
                  <h3 className="text-2xl font-bold">{user.matricula?.programa}</h3>
                </div>
                <Badge className={cn(
                  "px-3 py-1.5 text-[10px] font-semibold border-0 uppercase tracking-wider",
                  isPagado ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                )}>
                  {user.pagos?.estadoPago}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-[9px] text-zinc-500 uppercase mb-1">Inicio</p>
                  <p className="text-base font-medium">{formatDate(user.matricula?.fechaInicio)}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-[9px] text-zinc-500 uppercase mb-1">Fin</p>
                  <p className="text-base font-medium">{formatDate(user.matricula?.fechaFin)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-5 border-t border-white/10">
                <p className="text-zinc-400">Costo total</p>
                <p className="text-3xl font-bold">S/ {user.pagos?.precioPrograma}</p>
              </div>
            </div>

            {/* Freeze */}
            {puedeCongelar && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Snowflake className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-blue-100">Congelar Plan</h3>
                    <p className="text-sm text-blue-300/60">Máximo {maxDiasCongelar} días disponibles</p>
                  </div>
                </div>

                <Dialog open={isFreezeDialogOpen} onOpenChange={setIsFreezeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-blue-600/80 hover:bg-blue-500 h-12 rounded-xl text-base font-medium">
                      Solicitar Congelamiento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-sm rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Congelar Plan</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Máximo {maxDiasCongelar} días.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div>
                        <label className="text-xs text-zinc-500 mb-2 block">Fecha de inicio</label>
                        <input
                          type="date"
                          className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FA7B21]/50"
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setFreezeDate(new Date(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-2 block">Días a congelar</label>
                        <input
                          type="number"
                          value={freezeDays}
                          onChange={(e) => setFreezeDays(Math.min(maxDiasCongelar, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FA7B21]/50"
                          min={1}
                          max={maxDiasCongelar}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleFreezeConfirm}
                        disabled={!freezeDate || isFreezing}
                        className="w-full bg-[#FA7B21] hover:bg-[#F36A15] h-12 rounded-xl"
                      >
                        {isFreezing ? 'Procesando...' : 'Confirmar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={() => onNavigate('planes')}
                variant="outline"
                className="w-full h-14 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl font-medium text-base"
              >
                <Zap className="w-5 h-5 mr-2 text-[#FA7B21]" /> Ver Todos los Planes
              </Button>
            </motion.div>
          </motion.div>
        );

      case 'messages':
        return (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6"
          >
            {user.mensaje?.contenido ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 rounded-2xl overflow-hidden border border-white/5"
              >
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#FA7B21]/5">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-[#FA7B21]" />
                    <span className="font-semibold">Mensaje del Equipo</span>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(user.mensaje.fecha)}</span>
                </div>
                <div className="p-5">
                  <p className="text-base text-zinc-300 leading-relaxed">{user.mensaje.contenido}</p>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="w-20 h-20 mx-auto mb-5 rounded-full bg-zinc-900/50 flex items-center justify-center"
                >
                  <MessageCircle className="w-9 h-9 text-zinc-700" />
                </motion.div>
                <h3 className="text-zinc-400 font-medium text-lg mb-2">Sin mensajes</h3>
                <p className="text-sm text-zinc-600">Las comunicaciones aparecerán aquí</p>
              </div>
            )}

            {user.notificaciones && user.notificaciones.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs text-zinc-500 font-medium uppercase tracking-wider px-1">Notificaciones</h3>
                {user.notificaciones.map((notif, i) => (
                  <motion.div
                    key={notif.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "bg-zinc-900/40 border rounded-xl p-4",
                      !notif.leido ? "border-l-2 border-l-[#FA7B21] border-white/5" : "border-white/5"
                    )}
                  >
                    <p className="text-sm text-zinc-300">{notif.mensaje}</p>
                    <p className="text-[10px] text-zinc-600 mt-2">{formatDate(notif.fecha)}</p>
                  </motion.div>
                ))}
              </div>
            )}

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/5 hover:bg-white/10 h-14 rounded-2xl text-base"
                onClick={() => window.open('https://wa.me/51989717412', '_blank')}
              >
                <Phone className="w-5 h-5 mr-2" /> Contactar Soporte
              </Button>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#FA7B21]/[0.03] rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "relative z-10 mx-auto pb-28",
          isMobile ? "max-w-md px-5" : "max-w-2xl px-8"
        )}
      >
        {/* Expiration Banner */}
        <AnimatePresence>
          {(estaVencido || estaPorVencer) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "mt-4 p-4 rounded-2xl flex items-center gap-3",
                estaVencido ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/10 border border-amber-500/20"
              )}
            >
              <AlertTriangle className={cn("w-5 h-5 flex-shrink-0", estaVencido ? "text-red-400" : "text-amber-400")} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", estaVencido ? "text-red-300" : "text-amber-300")}>
                  {estaVencido ? `Vencido hace ${diasVencido} días` : `${diasRestantes} días restantes`}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onNavigate('planes')}
                className={cn("h-9 px-4 text-xs rounded-xl font-medium", estaVencido ? "bg-red-500 hover:bg-red-400" : "bg-amber-500 hover:bg-amber-400 text-black")}
              >
                Renovar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FA7B21] to-orange-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-[#FA7B21]/20">
                  {getIniciales(user.estudiante?.nombre || '')}
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-black",
                  isPagado ? "bg-emerald-500" : "bg-amber-500"
                )} />
              </motion.div>
              <div>
                <h1 className={cn("font-semibold leading-tight", isMobile ? "text-lg" : "text-xl")}>{user.estudiante?.nombre}</h1>
                <p className="text-sm text-zinc-500">{user.matricula?.programa}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-black/90 backdrop-blur-xl border-t border-white/5">
          <div className={cn("mx-auto", isMobile ? "max-w-md px-4" : "max-w-2xl px-8")}>
            <div className="flex items-center justify-around py-2">
              {[
                { id: 'home', icon: Home, label: 'Inicio' },
                { id: 'calendar', icon: Calendar, label: 'Asistencias' },
                { id: 'plan', icon: CreditCard, label: 'Plan' },
                { id: 'messages', icon: MessageCircle, label: 'Mensajes' },
              ].map(item => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveSection(item.id as any)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 py-2 px-5 rounded-xl transition-colors",
                    activeSection === item.id ? "text-[#FA7B21]" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FA7B21]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
