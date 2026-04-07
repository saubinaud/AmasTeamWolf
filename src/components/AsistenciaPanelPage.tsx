import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, QrCode, Users, Clock, Shield, LogOut, RefreshCw, CheckCircle, UserCheck, KeyRound, ArrowLeft, X, Download, Maximize2, Minimize2, AlertTriangle, BarChart3, Timer } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { API_BASE } from '../config/api';

interface AsistenciaPanelPageProps {
  onNavigate: (page: string) => void;
}

const PIN_PROFESORA = '2026';

interface Asistencia {
  nombre_alumno: string;
  hora: string;
  turno: string;
  programa?: string;
}

interface SesionQR {
  token: string;
  url: string;
  valido_hasta: string;
  hora_clase: string;
  programa: string;
}

interface ClaseHorario {
  hora: string;
  programa: string;
}

interface AlertaPocasClases {
  alumno: string;
  clases_restantes: number;
  programa?: string;
}

interface ResumenClase {
  hora_clase: string;
  programa: string;
  token: string;
  presentes: number;
}

interface DashboardData {
  mes: string;
  totales: { total_asistencias: number; alumnos_unicos: number; dias_con_clase: number };
  porPrograma: { programa: string; total: number }[];
  porDiaSemana: { dia: number; total: number }[];
  topAlumnos: { nombre_alumno: string; total: number }[];
}

// ── HORARIOS POR DÍA ──
const HORARIOS: Record<number, ClaseHorario[]> = {
  1: [
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Junior Wolf' },
  ],
  2: [
    { hora: '15:00', programa: 'Súper Baby Wolf' },
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Adolescentes Wolf' },
  ],
  3: [
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Junior Wolf' },
  ],
  4: [
    { hora: '15:00', programa: 'Súper Baby Wolf' },
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Adolescentes Wolf' },
  ],
  5: [
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Junior Wolf' },
  ],
  6: [
    { hora: '09:30', programa: 'Súper Baby Wolf' },
    { hora: '10:00', programa: 'Baby Wolf' },
    { hora: '11:00', programa: 'Baby Wolf' },
    { hora: '11:30', programa: 'Little Wolf' },
    { hora: '12:00', programa: 'Little Wolf' },
    { hora: '12:30', programa: 'Junior Wolf' },
    { hora: '13:30', programa: 'Adolescentes Wolf' },
  ],
};

const NOMBRES_DIA: Record<number, string> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};
const NOMBRES_DIA_CORTO: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

const COLORES_PROGRAMA: Record<string, string> = {
  'Súper Baby Wolf': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Baby Wolf': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'Little Wolf': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Junior Wolf': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Adolescentes Wolf': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};
const COLORES_PROGRAMA_BAR: Record<string, string> = {
  'Súper Baby Wolf': 'bg-pink-400',
  'Baby Wolf': 'bg-sky-400',
  'Little Wolf': 'bg-emerald-400',
  'Junior Wolf': 'bg-amber-400',
  'Adolescentes Wolf': 'bg-violet-400',
};

function horaActual(): string {
  return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function formatHora12(hora24: string): string {
  const [h, m] = hora24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function horaAMinutos(hora24: string): number {
  const [h, m] = hora24.split(':').map(Number);
  return h * 60 + m;
}

function minutosAhora(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function detectarClaseActual(clases: ClaseHorario[]): number {
  const ahora = minutosAhora();
  for (let i = 0; i < clases.length; i++) {
    const inicio = horaAMinutos(clases[i].hora);
    if (ahora >= inicio && ahora < inicio + 25) return i;
  }
  for (let i = 0; i < clases.length; i++) {
    if (ahora < horaAMinutos(clases[i].hora)) return i;
  }
  return clases.length - 1;
}

function estadoClase(hora24: string): 'pasada' | 'actual' | 'proxima' {
  const ahora = minutosAhora();
  const inicio = horaAMinutos(hora24);
  if (ahora >= inicio + 25) return 'pasada';
  if (ahora >= inicio) return 'actual';
  return 'proxima';
}

function claseKey(clase: ClaseHorario): string {
  return `${clase.hora}|${clase.programa}`;
}

// Countdown helper
function tiempoRestante(validoHasta: string): string {
  const cierre = new Date(validoHasta).getTime();
  const ahora = Date.now();
  const diff = cierre - ahora;
  if (diff <= 0) return 'Expirado';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  if (hrs > 0) return `${hrs}h ${m}m`;
  return `${m}min`;
}

export function AsistenciaPanelPage({ onNavigate }: AsistenciaPanelPageProps) {
  const [autenticada, setAutenticada] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Panel state
  const [sesiones, setSesiones] = useState<Record<string, SesionQR>>({});
  const [claseActiva, setClaseActiva] = useState<ClaseHorario | null>(null);
  const [generandoQR, setGenerandoQR] = useState(false);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [asistenciasClase, setAsistenciasClase] = useState<Asistencia[]>([]);
  const [autoSeleccionada, setAutoSeleccionada] = useState(false);

  // Registro manual DNI
  const [dniManual, setDniManual] = useState('');
  const [registrandoDni, setRegistrandoDni] = useState(false);
  const [resultadoManual, setResultadoManual] = useState<{ success: boolean; alumno?: string; error?: string; clases_restantes?: number; clases_totales?: number } | null>(null);

  // Alertas pocas clases
  const [alertas, setAlertas] = useState<AlertaPocasClases[]>([]);

  // Vista: 'clases' | 'detalle' | 'resumen' | 'dashboard' | 'proyector'
  const [vista, setVista] = useState<'clases' | 'detalle' | 'resumen' | 'dashboard' | 'proyector'>('clases');

  // Resumen del día
  const [resumenDia, setResumenDia] = useState<ResumenClase[]>([]);

  // Dashboard
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [mesDashboard, setMesDashboard] = useState(new Date().toISOString().slice(0, 7));

  // Countdown timer
  const [, setTick] = useState(0);

  const diaHoy = new Date().getDay();
  const clasesHoy = HORARIOS[diaHoy] || [];
  const sesionActiva = claseActiva ? sesiones[claseKey(claseActiva)] : null;

  // Timer para countdown del QR (actualiza cada 30s)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-seleccionar la clase actual/próxima
  useEffect(() => {
    if (autenticada && clasesHoy.length > 0 && !autoSeleccionada) {
      const idx = detectarClaseActual(clasesHoy);
      setClaseActiva(clasesHoy[idx]);
      setAutoSeleccionada(true);
    }
  }, [autenticada, clasesHoy, autoSeleccionada]);

  const fetchAsistencias = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/asistencia/hoy`);
      const data = await resp.json();
      if (Array.isArray(data)) setAsistencias(data);
    } catch (_err) { /* retry next poll */ }
  }, []);

  const fetchAsistenciasClase = useCallback(async (token: string) => {
    try {
      const resp = await fetch(`${API_BASE}/asistencia/hoy?token=${token}`);
      const data = await resp.json();
      if (Array.isArray(data)) setAsistenciasClase(data);
    } catch (_err) { /* retry */ }
  }, []);

  useEffect(() => {
    if (!autenticada) return;
    fetchAsistencias();
    const interval = setInterval(() => {
      fetchAsistencias();
      if (sesionActiva) fetchAsistenciasClase(sesionActiva.token);
    }, 5000);
    return () => clearInterval(interval);
  }, [autenticada, fetchAsistencias, fetchAsistenciasClase, sesionActiva]);

  useEffect(() => {
    if (sesionActiva && vista === 'detalle') {
      fetchAsistenciasClase(sesionActiva.token);
    } else {
      setAsistenciasClase([]);
    }
  }, [sesionActiva, vista, fetchAsistenciasClase]);

  useEffect(() => {
    if (sessionStorage.getItem('amas_panel_auth') === 'true') setAutenticada(true);
  }, []);

  const handlePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN_PROFESORA) {
      setAutenticada(true);
      sessionStorage.setItem('amas_panel_auth', 'true');
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
      toast.error('PIN incorrecto');
    }
  };

  const handleLogout = () => {
    setAutenticada(false);
    sessionStorage.removeItem('amas_panel_auth');
    setSesiones({});
    setClaseActiva(null);
    setVista('clases');
  };

  const generarQR = async () => {
    if (!claseActiva) return;
    setGenerandoQR(true);
    try {
      const resp = await fetch(`${API_BASE}/qr/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sede_id: 1, duracion_horas: 2, hora_clase: claseActiva.hora, programa: claseActiva.programa }),
      });
      const data = await resp.json();
      if (data.success) {
        const sesion: SesionQR = { token: data.token, url: data.url, valido_hasta: data.valido_hasta, hora_clase: claseActiva.hora, programa: claseActiva.programa };
        setSesiones(prev => ({ ...prev, [claseKey(claseActiva)]: sesion }));
        toast.success(`QR generado — ${claseActiva.programa} ${formatHora12(claseActiva.hora)}`);
      } else toast.error('Error generando QR');
    } catch (_err) { toast.error('Error de conexión'); }
    finally { setGenerandoQR(false); }
  };

  const seleccionarClase = (clase: ClaseHorario) => {
    setClaseActiva(clase);
    setVista('detalle');
    setDniManual('');
    setResultadoManual(null);
  };

  const volverAClases = () => {
    setVista('clases');
    setDniManual('');
    setResultadoManual(null);
  };

  // Registro manual con alerta de pocas clases
  const registrarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesionActiva || !dniManual || dniManual.length < 7) { toast.error('Ingresa un DNI válido'); return; }
    setRegistrandoDni(true);
    setResultadoManual(null);
    try {
      const resp = await fetch(`${API_BASE}/asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni_alumno: dniManual, token_qr: sesionActiva.token, turno: claseActiva?.programa || 'General' }),
      });
      const data = await resp.json();
      const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
      setResultadoManual(result);
      if (result.success) {
        toast.success(`Asistencia registrada — ${result.alumno}`);
        setDniManual('');
        fetchAsistencias();
        if (sesionActiva) fetchAsistenciasClase(sesionActiva.token);
        // Alerta pocas clases
        if (result.clases_restantes != null && result.clases_restantes <= 3) {
          setAlertas(prev => [...prev.filter(a => a.alumno !== result.alumno), { alumno: result.alumno, clases_restantes: result.clases_restantes, programa: result.programa }]);
          toast.warning(`${result.alumno} — ¡Solo le quedan ${result.clases_restantes} clases!`, { duration: 8000 });
        }
      } else toast.error(result.error || 'No se pudo registrar');
    } catch (_err) { setResultadoManual({ success: false, error: 'Error de conexión' }); toast.error('Error de conexión'); }
    finally { setRegistrandoDni(false); }
  };

  // Fetch resumen del día
  const fetchResumen = async () => {
    try {
      const resp = await fetch(`${API_BASE}/asistencia/resumen-dia`);
      const data = await resp.json();
      if (Array.isArray(data)) setResumenDia(data);
    } catch (_err) { toast.error('Error cargando resumen'); }
  };

  // Fetch dashboard
  const fetchDashboard = async (mes: string) => {
    try {
      const resp = await fetch(`${API_BASE}/asistencia/dashboard?mes=${mes}`);
      const data = await resp.json();
      if (data.totales) setDashboard(data);
    } catch (_err) { toast.error('Error cargando dashboard'); }
  };

  // Exportar CSV
  const exportarCSV = () => {
    const fecha = new Date().toISOString().split('T')[0];
    window.open(`${API_BASE}/asistencia/exportar?fecha=${fecha}`, '_blank');
  };

  // ── PIN SCREEN ──
  if (!autenticada) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-[#FA7B21]/8 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-xs">
          <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Panel Profesora</h1>
              <p className="text-white/50 text-xs mt-1">Ingresa tu PIN de acceso</p>
            </div>
            <form onSubmit={handlePin} className="space-y-4">
              <Input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(false); }}
                placeholder="••••" autoFocus autoComplete="off"
                className={`bg-zinc-800 border-white/20 text-white text-center text-2xl tracking-[0.5em] h-14 ${pinError ? 'border-red-500 animate-shake' : ''}`}
              />
              <Button type="submit" disabled={pin.length < 4}
                className="w-full h-12 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold disabled:opacity-40">
                Ingresar
              </Button>
            </form>
            <button onClick={() => onNavigate('home')} className="block mx-auto mt-4 text-white/40 hover:text-white/60 text-xs transition-colors">
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ MODO PROYECTOR / TABLET ═══
  if (vista === 'proyector' && sesionActiva) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8" onClick={() => setVista('detalle')}>
        <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-lg font-bold mb-6 border ${COLORES_PROGRAMA[sesionActiva.programa] || 'bg-zinc-700/30 text-white/70 border-white/10'}`}>
          <Clock className="w-5 h-5" />
          {formatHora12(sesionActiva.hora_clase)} — {sesionActiva.programa}
        </div>
        <div className="bg-white rounded-3xl p-6 mb-6">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(sesionActiva.url)}`}
            alt="QR de asistencia" className="w-80 h-80"
          />
        </div>
        <p className="text-white/60 text-lg mb-2">Escanea para marcar asistencia</p>
        <div className="flex items-center gap-3 text-white/40 text-sm">
          <Timer className="w-4 h-4" />
          <span>Expira en {tiempoRestante(sesionActiva.valido_hasta)}</span>
        </div>
        <div className="mt-8 flex items-center gap-3">
          <div className="text-5xl font-bold text-[#FCA929]">{asistenciasClase.length}</div>
          <div className="text-white/50 text-sm">presentes</div>
        </div>
        <p className="text-white/30 text-xs mt-8">Toca la pantalla para volver al panel</p>
      </div>
    );
  }

  // ── PANEL PRINCIPAL ──
  return (
    <div className="h-[100dvh] flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header — fixed at top */}
      <header className="flex-shrink-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 safe-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {(vista === 'detalle' || vista === 'resumen' || vista === 'dashboard') && (
              <button onClick={volverAClases} className="p-1.5 -ml-1 text-white/60 hover:text-white active:scale-95 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-white font-bold text-sm">
                {vista === 'detalle' && claseActiva ? `${formatHora12(claseActiva.hora)} — ${claseActiva.programa}`
                  : vista === 'resumen' ? 'Resumen del día'
                  : vista === 'dashboard' ? 'Dashboard mensual'
                  : 'Panel de Asistencia'}
              </h1>
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Clock className="w-3 h-3" />
                <span>{NOMBRES_DIA[diaHoy]} — {horaActual()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={fetchAsistencias} className="p-2 text-white/50 hover:text-white active:scale-95 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="p-2 text-white/50 hover:text-red-400 active:scale-95 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto overscroll-contain scroll-smooth -webkit-overflow-scrolling-touch">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-4 space-y-4">

        {/* Alertas de pocas clases */}
        {alertas.length > 0 && vista !== 'dashboard' && vista !== 'resumen' && (
          <div className="space-y-2">
            {alertas.map((a, i) => (
              <div key={i} className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-amber-300 text-xs">
                    <strong>{a.alumno}</strong> — {a.clases_restantes === 0 ? 'Completó todas sus clases' : `Solo ${a.clases_restantes} clase${a.clases_restantes > 1 ? 's' : ''} restante${a.clases_restantes > 1 ? 's' : ''}`}
                  </span>
                </div>
                <button onClick={() => setAlertas(prev => prev.filter((_, j) => j !== i))} className="text-amber-400/60 hover:text-amber-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ═══ VISTA: LISTA DE CLASES ═══ */}
        {vista === 'clases' && (
          <>
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
              <div className="text-center mb-4">
                <p className="text-white font-semibold text-sm">{NOMBRES_DIA[diaHoy]}</p>
                <p className="text-white/50 text-xs">Selecciona una clase</p>
              </div>
              {clasesHoy.length === 0 ? (
                <div className="text-center py-6"><p className="text-white/40 text-sm">No hay clases programadas hoy</p></div>
              ) : (
                <div className="space-y-2">
                  {clasesHoy.map((clase, i) => {
                    const key = claseKey(clase);
                    const tieneSesion = !!sesiones[key];
                    const estado = estadoClase(clase.hora);
                    const colorClass = COLORES_PROGRAMA[clase.programa] || 'bg-zinc-700/30 text-white/70 border-white/10';
                    const isPasada = estado === 'pasada';
                    const isAhora = estado === 'actual';
                    return (
                      <button key={i} onClick={() => seleccionarClase(clase)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border transition-all text-left ${
                          isPasada && !tieneSesion ? 'bg-zinc-800/30 border-white/5 opacity-40' : `${colorClass} hover:brightness-125 active:scale-[0.98]`
                        }`}>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-mono font-semibold ${isPasada && !tieneSesion ? 'text-white/40' : 'text-white/80'}`}>
                            {formatHora12(clase.hora)}
                          </span>
                          <span className={`text-sm ${isPasada && !tieneSesion ? 'text-white/40' : ''}`}>{clase.programa}</span>
                          {isAhora && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/30 animate-pulse">AHORA</span>
                          )}
                        </div>
                        {tieneSesion && (
                          <span className="px-2 py-0.5 bg-[#FA7B21]/20 text-[#FCA929] text-[10px] font-bold rounded-full border border-[#FA7B21]/30">QR ACTIVO</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats + acciones */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{asistencias.length}</div>
                <div className="text-white/50 text-xs">Presentes hoy</div>
              </div>
              <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#FCA929]">{Object.keys(sesiones).length}</div>
                <div className="text-white/50 text-xs">QR activos</div>
              </div>
            </div>

          </>
        )}

        {/* ═══ VISTA: DETALLE DE CLASE ═══ */}
        {vista === 'detalle' && claseActiva && (
          <>
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
              {!sesionActiva ? (
                <div className="text-center">
                  <QrCode className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/60 text-sm mb-1">{claseActiva.programa} — {formatHora12(claseActiva.hora)}</p>
                  <p className="text-white/40 text-xs mb-4">Genera el QR para esta clase</p>
                  <Button onClick={generarQR} disabled={generandoQR}
                    className="w-full h-12 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold">
                    {generandoQR ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</> : <><QrCode className="w-4 h-4 mr-2" /> Generar QR</>}
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border ${COLORES_PROGRAMA[sesionActiva.programa] || 'bg-zinc-700/30 text-white/70 border-white/10'}`}>
                    <Clock className="w-3 h-3" />
                    {formatHora12(sesionActiva.hora_clase)} — {sesionActiva.programa}
                  </div>

                  {/* Countdown */}
                  <div className="flex items-center justify-center gap-1.5 mb-3">
                    <Timer className="w-3 h-3 text-white/40" />
                    <span className={`text-xs font-mono ${
                      tiempoRestante(sesionActiva.valido_hasta) === 'Expirado' ? 'text-red-400' : 'text-white/40'
                    }`}>{tiempoRestante(sesionActiva.valido_hasta)}</span>
                  </div>

                  <p className="text-white/50 text-xs mb-3">Los padres escanean este código:</p>

                  <div className="bg-white rounded-xl p-3 inline-block mx-auto mb-3">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sesionActiva.url)}`}
                      alt="QR de asistencia" className="w-48 h-48" />
                  </div>

                  <p className="text-white/40 text-[10px] break-all">{sesionActiva.url}</p>
                </div>
              )}
            </div>

            {/* Registro manual */}
            {sesionActiva && (
              <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-4 h-4 text-[#FCA929]" />
                  <span className="text-white font-semibold text-sm">Registro manual</span>
                  <span className="text-white/40 text-xs">— para padres sin QR</span>
                </div>
                <form onSubmit={registrarManual} className="flex gap-2">
                  <Input type="text" inputMode="numeric" pattern="[0-9]*" value={dniManual}
                    onChange={(e) => { setDniManual(e.target.value.replace(/\D/g, '')); setResultadoManual(null); }}
                    placeholder="DNI del alumno" maxLength={8} autoComplete="off"
                    className="bg-zinc-800 border-white/20 text-white text-center tracking-wider flex-1" />
                  <Button type="submit" disabled={registrandoDni || dniManual.length < 7}
                    className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold px-4 disabled:opacity-40">
                    {registrandoDni ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                </form>
                {resultadoManual && (
                  <div className={`mt-3 flex items-center justify-between p-2.5 rounded-lg text-xs ${
                    resultadoManual.success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    <span>
                      {resultadoManual.success
                        ? `${resultadoManual.alumno}${resultadoManual.clases_restantes != null ? ` — ${resultadoManual.clases_restantes} clases restantes` : ''}`
                        : resultadoManual.error}
                    </span>
                    <button onClick={() => setResultadoManual(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            )}

            {/* Asistencias de esta clase */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FCA929]" />
                  <span className="text-white font-semibold text-sm">{sesionActiva ? `Presentes — ${claseActiva.programa}` : 'Asistencias'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {sesionActiva && asistenciasClase.length > 0 && <span className="text-[#FCA929] text-xs font-bold">{asistenciasClase.length}</span>}
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs">En vivo</span>
                </div>
              </div>
              {!sesionActiva ? (
                <div className="p-8 text-center">
                  <UserCheck className="w-10 h-10 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">Genera el QR para ver los presentes de esta clase</p>
                </div>
              ) : asistenciasClase.length === 0 ? (
                <div className="p-8 text-center">
                  <UserCheck className="w-10 h-10 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">Nadie ha marcado asistencia en esta clase</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 overflow-y-auto max-h-[50vh]">
                  {asistenciasClase.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{a.nombre_alumno}</p>
                          {a.programa && <p className="text-white/40 text-xs truncate">{a.programa}</p>}
                        </div>
                      </div>
                      <p className="text-white/60 text-xs flex-shrink-0 ml-2">{a.hora}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ VISTA: RESUMEN DEL DÍA ═══ */}
        {vista === 'resumen' && (
          <>
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
              <div className="text-center mb-4">
                <p className="text-white font-semibold">Resumen — {NOMBRES_DIA[diaHoy]}</p>
                <p className="text-white/50 text-xs">Asistencias por clase</p>
              </div>
              {resumenDia.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">No hay sesiones QR registradas hoy</p>
              ) : (
                <div className="space-y-3">
                  {resumenDia.map((r, i) => {
                    const colorBar = COLORES_PROGRAMA_BAR[r.programa] || 'bg-zinc-500';
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-white/60 text-xs font-mono w-16 flex-shrink-0">{r.hora_clase ? formatHora12(r.hora_clase) : '--'}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-white text-xs">{r.programa || 'Sin programa'}</span>
                            <span className="text-white font-bold text-xs">{r.presentes}</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${colorBar} rounded-full transition-all`} style={{ width: `${Math.min(100, (Number(r.presentes) / 15) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-white/50 text-sm">Total del día</span>
                <span className="text-white font-bold text-lg">{asistencias.length} presentes</span>
              </div>
            </div>
            <button onClick={exportarCSV}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900/80 border border-white/10 rounded-xl p-3 text-white/60 hover:text-white hover:bg-zinc-800/80 transition-colors">
              <Download className="w-4 h-4" /> Descargar CSV del día
            </button>
          </>
        )}

        {/* ═══ VISTA: DASHBOARD MENSUAL ═══ */}
        {vista === 'dashboard' && (
          <>
            {/* Selector de mes */}
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => { const d = new Date(mesDashboard + '-15'); d.setMonth(d.getMonth() - 1); const m = d.toISOString().slice(0, 7); setMesDashboard(m); fetchDashboard(m); }}
                className="p-2 text-white/50 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
              <span className="text-white font-semibold text-sm min-w-[120px] text-center">
                {new Date(mesDashboard + '-15').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => { const d = new Date(mesDashboard + '-15'); d.setMonth(d.getMonth() + 1); const m = d.toISOString().slice(0, 7); setMesDashboard(m); fetchDashboard(m); }}
                className="p-2 text-white/50 hover:text-white" style={{ transform: 'rotate(180deg)' }}><ArrowLeft className="w-4 h-4" /></button>
            </div>

            {!dashboard ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 text-white/30 mx-auto animate-spin" /></div>
            ) : (
              <>
                {/* Totales */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-white">{dashboard.totales.total_asistencias}</div>
                    <div className="text-white/50 text-[10px]">Asistencias</div>
                  </div>
                  <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-[#FCA929]">{dashboard.totales.alumnos_unicos}</div>
                    <div className="text-white/50 text-[10px]">Alumnos</div>
                  </div>
                  <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-emerald-400">{dashboard.totales.dias_con_clase}</div>
                    <div className="text-white/50 text-[10px]">Días</div>
                  </div>
                </div>

                {/* Por programa */}
                <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4">
                  <p className="text-white font-semibold text-sm mb-3">Por programa</p>
                  <div className="space-y-2.5">
                    {dashboard.porPrograma.map((p, i) => {
                      const max = dashboard.porPrograma[0]?.total || 1;
                      const colorBar = COLORES_PROGRAMA_BAR[p.programa] || 'bg-zinc-500';
                      return (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-white/70 text-xs">{p.programa || 'Sin programa'}</span>
                            <span className="text-white font-bold text-xs">{p.total}</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${colorBar} rounded-full`} style={{ width: `${(Number(p.total) / Number(max)) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Por día de semana */}
                <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4">
                  <p className="text-white font-semibold text-sm mb-3">Por día de semana</p>
                  <div className="flex items-end justify-between gap-1 h-24">
                    {[1, 2, 3, 4, 5, 6].map(d => {
                      const entry = dashboard.porDiaSemana.find(e => Number(e.dia) === d);
                      const total = entry ? Number(entry.total) : 0;
                      const max = Math.max(...dashboard.porDiaSemana.map(e => Number(e.total)), 1);
                      const pct = (total / max) * 100;
                      return (
                        <div key={d} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-white text-[10px] font-bold">{total || ''}</span>
                          <div className="w-full bg-zinc-800 rounded-t-sm overflow-hidden" style={{ height: '60px' }}>
                            <div className="w-full bg-[#FCA929] rounded-t-sm mt-auto" style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                          </div>
                          <span className="text-white/40 text-[10px]">{NOMBRES_DIA_CORTO[d]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top alumnos */}
                <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4">
                  <p className="text-white font-semibold text-sm mb-3">Top 10 alumnos</p>
                  <div className="space-y-2">
                    {dashboard.topAlumnos.map((a, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            i < 3 ? 'bg-[#FCA929]/20 text-[#FCA929]' : 'bg-zinc-800 text-white/40'
                          }`}>{i + 1}</span>
                          <span className="text-white text-xs truncate">{a.nombre_alumno}</span>
                        </div>
                        <span className="text-white/60 text-xs font-mono">{a.total} clases</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
        </div>
      </main>

      {/* Footer — fixed at bottom */}
      {vista === 'clases' && (
        <footer className="flex-shrink-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-t border-white/10 px-4 py-2.5 safe-bottom">
          <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
            <button onClick={() => { setVista('resumen'); fetchResumen(); }}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-white/50 hover:text-white active:scale-95 transition-all">
              <Users className="w-5 h-5" />
              <span className="text-[10px]">Resumen</span>
            </button>
            <button onClick={exportarCSV}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-white/50 hover:text-white active:scale-95 transition-all">
              <Download className="w-5 h-5" />
              <span className="text-[10px]">CSV</span>
            </button>
            <button onClick={() => { setVista('dashboard'); fetchDashboard(mesDashboard); }}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-white/50 hover:text-white active:scale-95 transition-all">
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px]">Dashboard</span>
            </button>
            <button onClick={fetchAsistencias}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-white/50 hover:text-white active:scale-95 transition-all">
              <RefreshCw className="w-5 h-5" />
              <span className="text-[10px]">Actualizar</span>
            </button>
          </div>
        </footer>
      )}
      {vista === 'detalle' && sesionActiva && (
        <footer className="flex-shrink-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-t border-white/10 px-4 py-2.5 safe-bottom">
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-1">
            <button onClick={volverAClases}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-white/50 hover:text-white active:scale-95 transition-all">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-[10px]">Clases</span>
            </button>
            <button onClick={() => setVista('proyector')}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[#FCA929] hover:text-white active:scale-95 transition-all">
              <Maximize2 className="w-5 h-5" />
              <span className="text-[10px]">Proyector</span>
            </button>
            <button onClick={fetchAsistencias}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-white/50 hover:text-white active:scale-95 transition-all">
              <RefreshCw className="w-5 h-5" />
              <span className="text-[10px]">Actualizar</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
