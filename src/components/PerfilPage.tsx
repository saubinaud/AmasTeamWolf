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
  ExternalLink,
  Pencil,
  Save,
  X,
  MapPin,
  Gift,
  Copy,
  Users,
  Package,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from './ui/utils';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { PerfilDesktop } from './PerfilDesktop';
import { AccountLinkingStep } from './AccountLinkingStep';
import { HeaderMain } from './HeaderMain';
import { DayPicker, DateRange } from 'react-day-picker';
import { eachDayOfInterval, getDay } from 'date-fns';

// Helper functions for Freeze Logic
function esFeriado(fecha: Date): boolean {
  const feriados = [
    "2025-01-01", "2025-04-17", "2025-04-18", "2025-05-01", "2025-06-29",
    "2025-07-28", "2025-07-29", "2025-08-06", "2025-08-30", "2025-10-08",
    "2025-11-01", "2025-12-08", "2025-12-25",
    "2026-01-01", "2026-04-02", "2026-04-03" // Semana Santa 2026 estimada
  ];
  return feriados.includes(format(fecha, 'yyyy-MM-dd'));
}

function esCierreVacacionalAMAS(fecha: Date): boolean {
  const mes = fecha.getMonth() + 1; // 1-12
  const dia = fecha.getDate();
  // Del 20 de Dic al 4 de Enero
  return (mes === 12 && dia >= 20) || (mes === 1 && dia <= 4);
}

function isDiaHabil(fecha: Date): boolean {
  return getDay(fecha) !== 0 && !esFeriado(fecha) && !esCierreVacacionalAMAS(fecha);
}

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
  const [activeSection, setActiveSection] = useState<'home' | 'calendar' | 'plan' | 'messages' | 'graduacion'>('home');
  const isMobile = useIsMobile();

  // Calendar
  const [calendarCenterDate, setCalendarCenterDate] = useState(new Date());
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Freeze
  // Freeze
  const [freezeRange, setFreezeRange] = useState<DateRange | undefined>(undefined);
  const [isFreezing, setIsFreezing] = useState(false);
  const [isFreezeDialogOpen, setIsFreezeDialogOpen] = useState(false);

  // Apoderado edit
  const [isEditingApoderado, setIsEditingApoderado] = useState(false);
  const [apoderadoForm, setApoderadoForm] = useState({
    nombre_apoderado: '',
    dni_apoderado: '',
    correo: '',
    telefono: '',
    direccion: '',
  });
  const [isSavingApoderado, setIsSavingApoderado] = useState(false);

  // Belt color mapping for visual display
  const BELT_COLORS: Record<string, string> = {
    'Blanco': '#FFFFFF',
    'Blanco-Amarillo': '#FFFFCC',
    'Amarillo': '#FFD700',
    'Amarillo Camuflado': '#B8A028',
    'Naranja': '#FF8C00',
    'Naranja Camuflado': '#CC7000',
    'Verde': '#228B22',
    'Verde Camuflado': '#1A6B1A',
    'Azul': '#1E90FF',
    'Azul Camuflado': '#1560B0',
    'Rojo': '#DC143C',
    'Rojo Camuflado': '#A0102E',
    'Negro': '#1A1A1A',
  };

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

  const startEditApoderado = () => {
    setApoderadoForm({
      nombre_apoderado: user?.familia?.nombreFamilia || '',
      dni_apoderado: user?.familia?.dniFamilia || '',
      correo: user?.familia?.email || '',
      telefono: user?.familia?.telefono || '',
      direccion: user?.familia?.direccion || '',
    });
    setIsEditingApoderado(true);
  };

  const cancelEditApoderado = () => {
    setIsEditingApoderado(false);
  };

  const saveApoderado = async () => {
    setIsSavingApoderado(true);
    try {
      const token = localStorage.getItem('amasToken');
      const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? '/api/auth/perfil'
        : 'https://amas-api.s6hx3x.easypanel.host/api/auth/perfil';
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(apoderadoForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Datos actualizados');
        setIsEditingApoderado(false);
        await refreshUserData();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setIsSavingApoderado(false);
    }
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
    if (!freezeRange?.from || !freezeRange?.to) {
      toast.error('Selecciona un rango de fechas');
      return;
    }
    setIsFreezing(true);
    try {
      const token = localStorage.getItem('amasToken');
      const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? '/api/auth/congelar'
        : 'https://amas-api.s6hx3x.easypanel.host/api/auth/congelar';
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fecha_inicio: format(freezeRange.from, 'yyyy-MM-dd'),
          fecha_fin: format(freezeRange.to, 'yyyy-MM-dd'),
          dias: effectiveFreezeDays,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Congelamiento registrado');
        setIsFreezeDialogOpen(false);
        await refreshUserData();
      } else {
        toast.error(data.error || 'Error al congelar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setIsFreezing(false);
    }
  };

  const effectiveFreezeDays = useMemo(() => {
    if (!freezeRange?.from || !freezeRange?.to) return 0;
    return eachDayOfInterval({ start: freezeRange.from, end: freezeRange.to })
      .filter(d => isDiaHabil(d)).length;
  }, [freezeRange]);

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

  const totalAsistencias = user?.matricula?.clasesAsistidas || user?.asistencias?.filter(a => a.estado === 'asistio').length || 0;

  // Progreso basado en clases asistidas vs totales (no días)
  const progress = useMemo(() => {
    const total = user?.matricula?.clasesTotales || 0;
    if (total === 0) return 0;
    const asistidas = user?.matricula?.clasesAsistidas || 0;
    return Math.min(Math.round((asistidas / total) * 100), 100);
  }, [user?.matricula?.clasesTotales, user?.matricula?.clasesAsistidas]);

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
                      {user?.matricula?.clasesRestantes ?? Math.abs(diasRestantes)}
                    </motion.span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                      {estaVencido ? 'Vencido' : 'Clases'}
                    </span>
                  </div>
                </div>

                <div className={cn("flex-1 space-y-4", isMobile && "text-center w-full")}>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">{totalAsistencias} de {user?.matricula?.clasesTotales || '—'} clases</p>
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

            {/* Program Eligibility Badges (F9) */}
            {(user.elegibleLeadership || user.elegibleFighter) && (
              <div className="space-y-3">
                {user.elegibleLeadership && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-300">Leadership Wolf</p>
                      <p className="text-xs text-amber-400/70">Ya puedes inscribirte al programa Leadership Wolf</p>
                    </div>
                  </motion.div>
                )}
                {user.elegibleFighter && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
                    className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-300">Fighter Wolf</p>
                      <p className="text-xs text-red-400/70">Ya puedes acceder al programa Fighter Wolf</p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection('calendar')}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-left transition-colors hover:bg-emerald-500/15"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400/80">Asistencias</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{user.matricula?.clasesAsistidas || totalAsistencias}</p>
                <p className="text-[10px] text-zinc-500">de {user.matricula?.clasesTotales || '—'}</p>
              </motion.button>

              <motion.div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 text-left">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] text-sky-400/80">Restantes</span>
                </div>
                <p className="text-2xl font-bold text-sky-400">{user.matricula?.clasesRestantes ?? '—'}</p>
                <p className="text-[10px] text-zinc-500">clases</p>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection('plan')}
                className="bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-2xl p-4 text-left transition-colors hover:bg-[#FA7B21]/15"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Award className="w-3.5 h-3.5 text-[#FA7B21]" />
                  <span className="text-[10px] text-[#FA7B21]/80">Plan</span>
                </div>
                <p className="text-xs font-semibold text-orange-300 truncate">{user.matricula?.programa}</p>
                <p className="text-[10px] text-zinc-500">{user.matricula?.clasesTotales} clases</p>
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
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                  <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Mi informacion</h4>
                  {!isEditingApoderado ? (
                    <button onClick={startEditApoderado} className="flex items-center gap-1 text-[#FA7B21] text-xs font-medium hover:text-[#FCA929] transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={cancelEditApoderado} className="flex items-center gap-1 text-zinc-400 text-xs font-medium hover:text-zinc-300 transition-colors">
                        <X className="w-3.5 h-3.5" /> Cancelar
                      </button>
                      <button onClick={saveApoderado} disabled={isSavingApoderado} className="flex items-center gap-1 text-emerald-400 text-xs font-medium hover:text-emerald-300 transition-colors disabled:opacity-50">
                        <Save className="w-3.5 h-3.5" /> {isSavingApoderado ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>
                {isEditingApoderado ? (
                  <div className="p-4 space-y-3">
                    {[
                      { icon: User, label: 'Nombre', key: 'nombre_apoderado' as const },
                      { icon: Shield, label: 'DNI Apoderado', key: 'dni_apoderado' as const },
                      { icon: Mail, label: 'Correo', key: 'correo' as const },
                      { icon: Phone, label: 'Telefono', key: 'telefono' as const },
                      { icon: MapPin, label: 'Direccion', key: 'direccion' as const },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">{item.label}</label>
                          <input
                            type={item.key === 'correo' ? 'email' : 'text'}
                            value={apoderadoForm[item.key]}
                            onChange={(e) => setApoderadoForm(prev => ({ ...prev, [item.key]: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FA7B21]/50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {[
                      { icon: User, label: 'Apoderado', value: user.familia?.nombreFamilia },
                      { icon: Shield, label: 'DNI', value: user.familia?.dniFamilia },
                      { icon: Mail, label: 'Email', value: user.familia?.email },
                      { icon: Phone, label: 'Telefono', value: user.familia?.telefono },
                      { icon: MapPin, label: 'Direccion', value: user.familia?.direccion },
                    ].map((item, i) => (
                      <div key={i} className={cn(
                        "p-4 flex items-center gap-4 transition-colors hover:bg-white/[0.02]",
                        "border-t border-white/5"
                      )}>
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</p>
                          <p className="text-sm font-medium truncate">{item.value || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </motion.div>

              {/* Referido Card */}
              {user?.codigoReferido && (
                <motion.div
                  className="bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                >
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FA7B21]/15 flex items-center justify-center">
                        <Gift className="w-4 h-4 text-[#FA7B21]" />
                      </div>
                      <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Tu codigo de referido</h4>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-bold text-white tracking-widest bg-white/5 px-4 py-2 rounded-xl flex-1 text-center select-all">
                        {user.codigoReferido}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.codigoReferido || '');
                          toast.success('Codigo copiado');
                        }}
                        className="w-10 h-10 rounded-xl bg-[#FA7B21]/15 flex items-center justify-center hover:bg-[#FA7B21]/25 transition-colors"
                      >
                        <Copy className="w-4 h-4 text-[#FA7B21]" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400">Comparte este codigo y gana S/60 por cada amigo que se inscriba</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Bonos acumulados</span>
                      <span className="text-sm font-bold text-emerald-400">S/ {user.saldoBonos || 0}</span>
                    </div>
                    {user.referidos && user.referidos.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Amigos referidos</span>
                        </div>
                        <div className="space-y-1.5">
                          {user.referidos.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-white/[0.02] rounded-lg px-3 py-2">
                              <span className="text-zinc-300">{r.nombre}</span>
                              <span className="text-zinc-600">{r.fecha ? formatDate(r.fecha) : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Progreso de clases */}
              <motion.div
                className="bg-zinc-900/40 rounded-2xl border border-white/5 p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Progreso de clases</h4>
                  <span className="text-sm font-bold text-[#FA7B21]">{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(to right, #FA7B21, #FCA929)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  {user?.matricula?.clasesAsistidas || 0} de {user?.matricula?.clasesTotales || 0} clases asistidas
                </p>
              </motion.div>
            </div>

            {/* Mis Implementos */}
            {user?.implementos && user.implementos.length > 0 && (
              <motion.div
                className="bg-zinc-900/40 rounded-2xl border border-white/5 p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <Package className="w-4 h-4 text-violet-400" />
                  </div>
                  <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Mis implementos</h4>
                </div>
                <div className="space-y-2">
                  {user.implementos.map((imp) => (
                    <div key={imp.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-zinc-300 truncate">{imp.tipo || '—'}</span>
                        {imp.talla && <span className="text-[10px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0">T: {imp.talla}</span>}
                      </div>
                      <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                        {imp.fechaAdquisicion
                          ? new Date(imp.fechaAdquisicion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', timeZone: 'America/Lima' })
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

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

            {/* Historial de pagos (F4) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-zinc-900/40 rounded-2xl border border-white/5 p-5"
            >
              <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Historial de pagos</h4>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-300">
                    Pagado: <span className="font-semibold text-white">S/ {user.pagos?.totalPagado ?? user.pagos?.precioAPagar ?? 0}</span> de S/ {user.pagos?.precioPrograma ?? 0}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {user.pagos?.precioPrograma ? Math.min(100, Math.round(((user.pagos?.totalPagado ?? user.pagos?.precioAPagar ?? 0) / (user.pagos?.precioPrograma || 1)) * 100)) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${user.pagos?.precioPrograma ? Math.min(100, Math.round(((user.pagos?.totalPagado ?? user.pagos?.precioAPagar ?? 0) / (user.pagos?.precioPrograma || 1)) * 100)) : 0}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
              {user.pagos?.historial && user.pagos.historial.length > 0 ? (
                <div className="space-y-3">
                  {user.pagos.historial.map((pago, i) => (
                    <motion.div key={pago.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="flex items-start gap-3">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">S/ {pago.monto}</span>
                          <span className="text-[10px] text-zinc-500">
                            {pago.fecha ? new Date(pago.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Lima' }) : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded">{pago.metodo_pago || pago.tipo}</span>
                          {pago.observaciones && <span className="text-[10px] text-zinc-600 truncate">{pago.observaciones}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-zinc-500">Sin pagos registrados</p>
                </div>
              )}
            </motion.div>

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
                  <DialogContent className="bg-[#09090b] border-white/10 text-white sm:max-w-md w-[95%] rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex-1 overflow-y-auto">
                      {/* Calendar Section */}
                      <div className="p-6 bg-black/20 border-b border-white/5">
                        <div className="mb-4">
                          <DialogTitle className="text-white flex items-center gap-2 mb-2">
                            <Snowflake className="w-5 h-5 text-cyan-400" />
                            Selecciona las fechas
                          </DialogTitle>
                          <DialogDescription className="text-white/60 text-xs">
                            Elige inicio y fin. Tienes <span className="text-cyan-300 font-medium">{maxDiasCongelar} días</span>.
                          </DialogDescription>
                        </div>
                        <div className="flex justify-center bg-zinc-900 rounded-2xl p-2 border border-white/5">
                          <style>{`
                                        .rdp { --rdp-accent-color: #FA7B21; --rdp-background-color: rgba(250, 123, 33, 0.2); margin: 0; }
                                        .rdp-day_selected:not([disabled]) { font-weight: bold; border: 2px solid #FA7B21; }
                                        .rdp-day_selected:hover:not([disabled]) { border-color: #FA7B21; color: white; }
                                        .rdp-day { color: #e4e4e7; font-size: 0.85rem; width: 36px; height: 36px; }
                                        .rdp-caption_label { font-size: 0.9rem; }
                                        .rdp-head_cell { font-size: 0.75rem; }
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

                      {/* Summary Section (Stacked) */}
                      <div className="p-6 bg-zinc-900/80">
                        {/* Days Balance */}
                        <div className="bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-4 mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-cyan-200/70 text-xs font-medium">Disponible</span>
                            <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-2 py-0 text-[10px]">
                              {maxDiasCongelar} días
                            </Badge>
                          </div>
                          <div className="flex items-end justify-between">
                            <span className="text-white/60 text-xs">A consumir</span>
                            <div>
                              <span className={cn(
                                "text-2xl font-bold",
                                effectiveFreezeDays > maxDiasCongelar ? "text-red-400" : "text-white"
                              )}>
                                {effectiveFreezeDays}
                              </span>
                              <span className="text-xs text-white/40 ml-1">días</span>
                            </div>
                          </div>
                          {effectiveFreezeDays > maxDiasCongelar && (
                            <div className="mt-3 flex items-center gap-2 text-red-300 text-[10px] bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              Excedes el límite
                            </div>
                          )}
                        </div>

                        {/* Confirm Button */}
                        <Button
                          onClick={handleFreezeConfirm}
                          disabled={!freezeRange?.from || !freezeRange?.to || isFreezing || effectiveFreezeDays > maxDiasCongelar}
                          className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                          {isFreezing ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          {isFreezing ? 'Procesando...' : 'Confirmar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}

            {/* Congelaciones historial */}
            {user?.congelaciones && user.congelaciones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-zinc-900/40 rounded-2xl border border-white/5 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider flex items-center gap-2">
                    <Snowflake className="w-3.5 h-3.5 text-blue-400" />
                    Congelamientos usados
                  </h4>
                  <span className="text-sm font-semibold text-blue-300">{user.congelaciones.length}</span>
                </div>
                <div className="space-y-2">
                  {user.congelaciones.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-blue-950/20 border border-blue-500/10 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-blue-200">
                          {c.fechaInicio
                            ? new Date(c.fechaInicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', timeZone: 'America/Lima' })
                            : '—'}
                          {' → '}
                          {c.fechaFin
                            ? new Date(c.fechaFin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', timeZone: 'America/Lima' })
                            : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-blue-300/70">{c.dias || '—'} dias</span>
                        <Badge className={cn(
                          "text-[9px] border-0 px-1.5 py-0.5",
                          c.estado === 'activo' ? "bg-blue-500/20 text-blue-300" : "bg-zinc-700/50 text-zinc-500"
                        )}>
                          {c.estado === 'activo' ? 'Activo' : 'Finalizado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Renovar programa CTA */}
            {(user?.matricula?.estado === 'Activo' || user?.matricula?.estado === 'activa' || estaPorVencer || estaVencido) && (
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  onClick={() => onNavigate('renovacion')}
                  className="w-full h-14 bg-gradient-to-r from-[#FA7B21] to-orange-500 hover:from-[#FCA929] hover:to-orange-400 text-white rounded-2xl font-semibold text-base shadow-lg shadow-[#FA7B21]/20"
                >
                  <RefreshCw className="w-5 h-5 mr-2" /> Renovar Programa
                </Button>
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

      case 'graduacion':
        return (
          <motion.div
            key="graduacion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Proxima Graduacion Card */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FCA929]" />
                Tu proxima graduacion
              </h3>

              {user?.proximaGraduacion ? (
                <div className="space-y-5">
                  {/* Belt transition visual */}
                  <div className="flex items-center justify-center gap-4 py-4">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-14 h-14 rounded-full border-4 flex items-center justify-center"
                        style={{ borderColor: BELT_COLORS[user.proximaGraduacion.cinturonDesde] ?? '#555', backgroundColor: `${BELT_COLORS[user.proximaGraduacion.cinturonDesde] ?? '#555'}20` }}
                      >
                        <Shield className="w-6 h-6" style={{ color: BELT_COLORS[user.proximaGraduacion.cinturonDesde] ?? '#555' }} />
                      </div>
                      <span className="text-xs text-zinc-400 text-center max-w-[80px] leading-tight">{user.proximaGraduacion.cinturonDesde || '—'}</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[#FCA929] flex-shrink-0" />
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-14 h-14 rounded-full border-4 flex items-center justify-center"
                        style={{ borderColor: BELT_COLORS[user.proximaGraduacion.cinturonHasta] ?? '#FCA929', backgroundColor: `${BELT_COLORS[user.proximaGraduacion.cinturonHasta] ?? '#FCA929'}20` }}
                      >
                        <Award className="w-6 h-6" style={{ color: BELT_COLORS[user.proximaGraduacion.cinturonHasta] ?? '#FCA929' }} />
                      </div>
                      <span className="text-xs text-[#FCA929] font-medium text-center max-w-[80px] leading-tight">{user.proximaGraduacion.cinturonHasta || '—'}</span>
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="text-center">
                    <p className="text-white/60 uppercase tracking-widest text-[10px] mb-1">Fecha del examen</p>
                    <p className="text-2xl font-bold text-white">
                      {user.proximaGraduacion.fecha
                        ? new Date(user.proximaGraduacion.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' })
                        : '—'}
                    </p>
                    {user.proximaGraduacion.fecha && (
                      <p className="text-[#FCA929] font-medium capitalize text-sm mt-0.5">
                        {new Date(user.proximaGraduacion.fecha).toLocaleDateString('es-PE', { weekday: 'long', timeZone: 'America/Lima' })}
                      </p>
                    )}
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {user.proximaGraduacion.horario && (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-zinc-500 text-[10px] uppercase mb-1">Horario</p>
                        <div className="flex items-center justify-center gap-1.5 text-white font-semibold text-sm">
                          <Clock className="w-3.5 h-3.5 text-[#FCA929]" />
                          {user.proximaGraduacion.horario}
                        </div>
                      </div>
                    )}
                    {user.proximaGraduacion.turno && (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-zinc-500 text-[10px] uppercase mb-1">Turno</p>
                        <div className="text-white font-semibold flex items-center justify-center gap-1.5 text-sm">
                          <Zap className="w-3.5 h-3.5 text-[#FCA929]" />
                          {user.proximaGraduacion.turno}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Calendar className="w-10 h-10 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 text-sm">No tienes graduaciones programadas</p>
                  <p className="text-zinc-600 text-xs mt-1">Se mostrara aqui cuando tu profesora te programe</p>
                </div>
              )}
            </div>

            {/* Mi Cinturon + Historial Timeline */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FCA929]" />
                Mi Cinturon
              </h3>

              {/* Cinturon actual */}
              <div className="text-center mb-6">
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4 mb-3"
                  style={{
                    borderColor: BELT_COLORS[user?.estudiante?.cinturonActual ?? 'Blanco'] ?? '#555',
                    backgroundColor: `${BELT_COLORS[user?.estudiante?.cinturonActual ?? 'Blanco'] ?? '#555'}15`,
                  }}
                >
                  <Award className="w-10 h-10" style={{ color: BELT_COLORS[user?.estudiante?.cinturonActual ?? 'Blanco'] ?? '#FA7B21' }} />
                </div>
                <p className="text-2xl font-bold text-white">{user?.estudiante?.cinturonActual ?? 'Blanco'}</p>
                <p className="text-xs text-zinc-500 mt-1">Cinturon Actual</p>
              </div>

              {/* Historial Timeline */}
              {user?.historialCinturones && user.historialCinturones.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Camino recorrido</p>
                  <div className="relative pl-6">
                    {/* Vertical line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-white/20 via-[#FA7B21]/40 to-[#FA7B21]" />
                    <div className="space-y-3">
                      {user.historialCinturones.map((c, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="relative flex items-center gap-3"
                        >
                          {/* Dot on timeline */}
                          <div
                            className="absolute -left-6 w-3.5 h-3.5 rounded-full border-2 border-black"
                            style={{ backgroundColor: BELT_COLORS[c.cinturon] ?? '#888' }}
                          />
                          <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: BELT_COLORS[c.cinturon] ?? '#888' }}
                              />
                              <p className="text-sm font-medium text-white">{c.cinturon}</p>
                            </div>
                            <span className="text-xs text-zinc-500">{c.fecha ? formatDate(c.fecha) : '—'}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-zinc-500 text-sm">Tu primer cinturon se registrara en tu proxima graduacion</p>
                </div>
              )}
            </div>

            {/* Torneos */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#FCA929]" />
                Torneos
              </h3>
              {user?.torneos && user.torneos.length > 0 ? (
                <div className="space-y-3">
                  {user.torneos.map((t) => {
                    const tipoBadge: Record<string, string> = {
                      regional: 'bg-sky-500/15 text-sky-400',
                      nacional: 'bg-amber-500/15 text-amber-400',
                      interescuelas: 'bg-emerald-500/15 text-emerald-400',
                      panamericano: 'bg-violet-500/15 text-violet-400',
                      mundial: 'bg-red-500/15 text-red-400',
                    };
                    const pagoBadge: Record<string, string> = {
                      Pendiente: 'bg-amber-500/15 text-amber-400',
                      Pagado: 'bg-emerald-500/15 text-emerald-400',
                      Parcial: 'bg-[#FA7B21]/15 text-[#FA7B21]',
                    };
                    return (
                      <div key={t.id} className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm">{t.torneoNombre || '—'}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${tipoBadge[t.tipo] ?? 'bg-zinc-800 text-zinc-400'}`}>
                                {t.tipo || '—'}
                              </span>
                              {t.fecha && <span className="text-zinc-500 text-xs">{formatDate(t.fecha)}</span>}
                              {t.lugar && <span className="text-zinc-600 text-xs">{t.lugar}</span>}
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase shrink-0 ${pagoBadge[t.estadoPago] ?? 'bg-zinc-800 text-zinc-400'}`}>
                            {t.estadoPago || '—'}
                          </span>
                        </div>
                        {t.modalidad && (
                          <p className="text-zinc-400 text-xs mt-2">Modalidad: {t.modalidad}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">No has sido seleccionado para torneos activos</p>
              )}
            </div>
          </motion.div>
        );
      case 'messages':
        const unreadCount = user.mensajes?.filter(m => !m.leido).length || 0;
        const handleMarkRead = async (msgId: number) => {
          try {
            const token = localStorage.getItem('amasToken');
            if (!token) return;
            const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
              ? `/api/auth/mensajes/${msgId}/leido`
              : `https://amas-api.s6hx3x.easypanel.host/api/auth/mensajes/${msgId}/leido`;
            await fetch(apiUrl, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            await refreshUserData();
          } catch { /* silently fail */ }
        };

        return (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-4"
          >
            {unreadCount > 0 && (
              <div className="bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-[#FA7B21]" />
                <span className="text-[#FA7B21] text-sm font-medium">{unreadCount} mensaje{unreadCount > 1 ? 's' : ''} sin leer</span>
              </div>
            )}

            {user.mensajes && user.mensajes.length > 0 ? (
              <div className="space-y-3">
                {user.mensajes.map((msg, i) => (
                  <motion.button
                    key={msg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => !msg.leido && handleMarkRead(msg.id)}
                    className={cn(
                      "w-full text-left bg-zinc-900/80 rounded-2xl overflow-hidden border transition-all",
                      !msg.leido ? "border-l-4 border-l-[#FA7B21] border-zinc-800" : "border-zinc-800/50"
                    )}
                  >
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {msg.tipo === 'difusion' && <MessageCircle className="w-4 h-4 text-[#FA7B21]" />}
                          {msg.tipo === 'programa' && <Award className="w-4 h-4 text-sky-400" />}
                          {msg.tipo === 'individual' && <Mail className="w-4 h-4 text-emerald-400" />}
                          <span className={cn("text-sm font-semibold", !msg.leido ? "text-white" : "text-zinc-400")}>
                            {msg.asunto}
                          </span>
                        </div>
                        {!msg.leido && <div className="w-2 h-2 rounded-full bg-[#FA7B21]" />}
                      </div>
                      <p className={cn("text-sm leading-relaxed", !msg.leido ? "text-zinc-300" : "text-zinc-500")}>
                        {msg.contenido.length > 120 ? msg.contenido.slice(0, 120) + '...' : msg.contenido}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-2">{formatDate(msg.fecha)}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
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

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                variant="outline"
                className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 h-14 rounded-2xl text-base"
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

      {/* Header for navigation */}
      <HeaderMain
        onNavigate={onNavigate}
        onOpenMatricula={() => onNavigate('planes')}
        onCartClick={() => { }}
        cartItemsCount={0}
        currentPage="perfil"
      />

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
        style={{ paddingTop: isMobile ? '65px' : '100px' }}
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
                { id: 'graduacion', icon: Award, label: 'Graduación' },
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
