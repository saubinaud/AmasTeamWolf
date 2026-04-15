import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, QrCode, Users, Clock, Shield, LogOut, RefreshCw,
  CheckCircle, KeyRound, Search, RotateCcw, Timer, X,
  AlertTriangle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { API_BASE } from '../config/api';

// ── Types ──

interface AsistenciaPanelPageProps {
  onNavigate: (page: string) => void;
  skipAuth?: boolean;
  embedMode?: boolean;
}

interface Asistencia {
  nombre_alumno: string;
  hora: string;
  turno: string;
  programa?: string;
}

interface SesionDiaria {
  token: string;
  url: string;
  valido_hasta: string;
}

interface AlumnoBusqueda {
  id: number;
  nombre_alumno: string;
  dni_alumno: string;
  categoria?: string;
}

interface HorarioHoy {
  hora_inicio: string;
  hora_fin?: string;
  nombre_clase: string;
  edad_min_meses?: number;
  edad_max_meses?: number;
}

// ── Constants ──

const PIN_PROFESORA = '2026';

const NOMBRES_DIA: Record<number, string> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

// ── Helpers ──

function horaActual(): string {
  return new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima',
  });
}

function formatHora12(hora24: string): string {
  if (!hora24) return '--';
  const [h, m] = hora24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return hora24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function tiempoRestante(validoHasta: string): string {
  const diff = new Date(validoHasta).getTime() - Date.now();
  if (diff <= 0) return 'Expirado';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  return hrs > 0 ? `${hrs}h ${m}m` : `${m}min`;
}

function edadLabel(minMeses?: number, maxMeses?: number): string {
  if (minMeses == null && maxMeses == null) return '';
  const fmt = (m: number) => m >= 12 ? `${Math.floor(m / 12)} años` : `${m} meses`;
  if (minMeses != null && maxMeses != null) return `${fmt(minMeses)} — ${fmt(maxMeses)}`;
  if (minMeses != null) return `desde ${fmt(minMeses)}`;
  return `hasta ${fmt(maxMeses!)}`;
}

// ── Component ──

export function AsistenciaPanelPage({ onNavigate, skipAuth = false, embedMode = false }: AsistenciaPanelPageProps) {
  // Auth
  const [autenticada, setAutenticada] = useState(skipAuth);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Daily QR
  const [sesionDiaria, setSesionDiaria] = useState<SesionDiaria | null>(null);
  const [generandoDiario, setGenerandoDiario] = useState(false);
  const [reiniciandoDiario, setReiniciandoDiario] = useState(false);

  // Search by name
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<AlumnoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [registrandoPorNombre, setRegistrandoPorNombre] = useState(false);

  // DNI manual
  const [dniManual, setDniManual] = useState('');
  const [registrandoDni, setRegistrandoDni] = useState(false);
  const [resultadoManual, setResultadoManual] = useState<{
    success: boolean; alumno?: string; error?: string;
  } | null>(null);

  // Today's schedule
  const [horariosHoy, setHorariosHoy] = useState<HorarioHoy[]>([]);

  // Today's attendances
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);

  // Alerts
  const [alertas, setAlertas] = useState<{ alumno: string; clases_restantes: number }[]>([]);

  // Countdown refresh
  const [, setTick] = useState(0);

  const diaHoy = new Date().getDay();

  // ── Auth persistence ──
  useEffect(() => {
    if (skipAuth) { setAutenticada(true); return; }
    if (sessionStorage.getItem('amas_panel_auth') === 'true') setAutenticada(true);
  }, [skipAuth]);

  // ── Countdown every 30s ──
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // ── Fetch daily QR on mount ──
  useEffect(() => {
    if (!autenticada) return;
    const fetchDiarioActivo = async () => {
      try {
        const r = await fetch(`${API_BASE}/qr/diario-activo`);
        if (!r.ok) return;
        const d = await r.json();
        if (d?.success && d.activo) {
          setSesionDiaria({ token: d.token, url: d.url, valido_hasta: d.valido_hasta });
        }
      } catch { /* ignore */ }
    };
    fetchDiarioActivo();
  }, [autenticada]);

  // ── Fetch today's attendances + poll every 15s ──
  const fetchAsistencias = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/asistencia/hoy`);
      if (!r.ok) return;
      const d = await r.json();
      if (Array.isArray(d)) setAsistencias(d);
    } catch { /* retry */ }
  }, []);

  useEffect(() => {
    if (!autenticada) return;
    fetchAsistencias();
    const id = setInterval(fetchAsistencias, 15000);
    return () => clearInterval(id);
  }, [autenticada, fetchAsistencias]);

  // ── Fetch today's schedule from DB ──
  useEffect(() => {
    if (!autenticada) return;
    const fetchHorarios = async () => {
      try {
        const r = await fetch(`${API_BASE}/asistencia/horarios-hoy`);
        if (!r.ok) return;
        const d = await r.json();
        if (d?.success && Array.isArray(d.data)) setHorariosHoy(d.data);
      } catch { /* ignore */ }
    };
    fetchHorarios();
  }, [autenticada]);

  // ── Search alumnos by name/DNI (debounced) ──
  useEffect(() => {
    if (busquedaNombre.length < 2) { setResultadosBusqueda([]); return; }
    const timeout = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`${API_BASE}/space/alumnos?search=${encodeURIComponent(busquedaNombre)}&limit=8`);
        if (!r.ok) return;
        const d = await r.json();
        const list = Array.isArray(d) ? d : d?.data ?? [];
        setResultadosBusqueda(list);
      } catch { /* ignore */ }
      finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [busquedaNombre]);

  // ── Handlers ──

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
    setSesionDiaria(null);
  };

  const generarQRDiario = async () => {
    setGenerandoDiario(true);
    try {
      const r = await fetch(`${API_BASE}/qr/generar-diario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sede_id: 1 }),
      });
      if (!r.ok) { toast.error('Error generando QR diario'); return; }
      const d = await r.json();
      if (d?.success) {
        setSesionDiaria({ token: d.token, url: d.url, valido_hasta: d.valido_hasta });
        toast.success('QR del día generado — válido 12 horas');
      } else {
        toast.error('Error generando QR diario');
      }
    } catch { toast.error('Error de conexión'); }
    finally { setGenerandoDiario(false); }
  };

  const reiniciarQRDiario = async () => {
    setReiniciandoDiario(true);
    try {
      const r = await fetch(`${API_BASE}/qr/reiniciar-diario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!r.ok) { toast.error('Error reiniciando QR'); return; }
      const d = await r.json();
      if (d?.success) {
        setSesionDiaria(null);
        toast.success('QR diario reiniciado');
      }
    } catch { toast.error('Error de conexión'); }
    finally { setReiniciandoDiario(false); }
  };

  const registrarPorNombre = async (alumno: AlumnoBusqueda) => {
    setRegistrandoPorNombre(true);
    try {
      const r = await fetch(`${API_BASE}/asistencia/por-nombre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumno_id: alumno.id,
          token: sesionDiaria?.token || undefined,
        }),
      });
      if (!r.ok) { toast.error('Error registrando asistencia'); return; }
      const data = await r.json();
      const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
      if (result?.success) {
        toast.success(`${result.alumno ?? alumno.nombre_alumno} — ${result.clase_detectada ?? 'Registrado'}`);
        setBusquedaNombre('');
        setResultadosBusqueda([]);
        fetchAsistencias();
      } else {
        toast.error(result?.error || 'No se pudo registrar');
      }
    } catch { toast.error('Error de conexión'); }
    finally { setRegistrandoPorNombre(false); }
  };

  const registrarManualDni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dniManual || dniManual.length < 7) { toast.error('Ingresa un DNI válido'); return; }
    if (!sesionDiaria) { toast.error('Genera el QR del día primero'); return; }
    setRegistrandoDni(true);
    setResultadoManual(null);
    try {
      const r = await fetch(`${API_BASE}/asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni_alumno: dniManual, token_qr: sesionDiaria.token }),
      });
      if (!r.ok) { toast.error('Error registrando asistencia'); setRegistrandoDni(false); return; }
      const data = await r.json();
      const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
      setResultadoManual(result);
      if (result?.success) {
        toast.success(`Asistencia registrada — ${result.alumno}`);
        setDniManual('');
        fetchAsistencias();
        if (result.clases_restantes != null && result.clases_restantes <= 3) {
          setAlertas(prev => [
            ...prev.filter(a => a.alumno !== result.alumno),
            { alumno: result.alumno, clases_restantes: result.clases_restantes },
          ]);
          toast.warning(`${result.alumno} — ¡Solo le quedan ${result.clases_restantes} clases!`, { duration: 8000 });
        }
      } else {
        toast.error(result?.error || 'No se pudo registrar');
      }
    } catch {
      setResultadoManual({ success: false, error: 'Error de conexión' });
      toast.error('Error de conexión');
    } finally {
      setRegistrandoDni(false);
    }
  };

  // ── PIN SCREEN ──
  if (!autenticada) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex items-center justify-center px-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-[#FA7B21]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Panel Profesora</h1>
              <p className="text-white/50 text-xs mt-1">Ingresa tu PIN de acceso</p>
            </div>
            <form onSubmit={handlePin} className="space-y-4">
              <Input
                type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(false); }}
                placeholder="••••" autoFocus autoComplete="off"
                style={{ fontSize: '16px' }}
                className={`bg-zinc-800 border-zinc-700 text-white text-center text-2xl tracking-[0.5em] h-14 ${pinError ? 'border-red-500 animate-shake' : ''}`}
              />
              <Button type="submit" disabled={pin.length < 4}
                className="w-full h-12 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold disabled:opacity-40">
                Ingresar
              </Button>
            </form>
            <button onClick={() => onNavigate('home')}
              className="block mx-auto mt-4 text-white/40 hover:text-white/60 text-xs transition-colors">
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN PANEL ──
  return (
    <div className={`${embedMode ? 'min-h-[80dvh]' : 'h-dvh'} flex flex-col bg-zinc-950 ${embedMode ? 'rounded-2xl -m-4 md:-m-5 lg:-m-6' : ''}`}>
      {/* ── Header ── */}
      <div className="shrink-0 bg-zinc-950 border-b border-zinc-800 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-white font-bold text-sm">Panel de Asistencia</h1>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Clock className="w-3 h-3" />
              <span>{NOMBRES_DIA[diaHoy]} — {horaActual()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#FCA929] text-xs font-bold mr-1">{asistencias.length} hoy</span>
            <button onClick={fetchAsistencias} aria-label="Actualizar"
              className="p-2 text-white/50 hover:text-white active:scale-95 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            {!embedMode && (
              <button onClick={handleLogout} aria-label="Cerrar sesión"
                className="p-2 text-white/50 hover:text-red-400 active:scale-95 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

          {/* ── Alerts ── */}
          {alertas.length > 0 && (
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-amber-300 text-xs">
                      <strong>{a.alumno}</strong> — {a.clases_restantes === 0
                        ? 'Completó todas sus clases'
                        : `Solo ${a.clases_restantes} clase${a.clases_restantes > 1 ? 's' : ''} restante${a.clases_restantes > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <button onClick={() => setAlertas(prev => prev.filter((_, j) => j !== i))} aria-label="Cerrar alerta"
                    className="text-amber-400/60 hover:text-amber-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ═══ SECTION 1: Daily QR ═══ */}
          <div className="bg-gradient-to-br from-[#FA7B21]/20 to-[#FCA929]/10 border border-[#FA7B21]/30 rounded-2xl p-5">
            {!sesionDiaria ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <QrCode className="w-5 h-5 text-[#FCA929]" />
                  <span className="text-white font-bold text-sm">QR Inteligente del Día</span>
                </div>
                <p className="text-white/50 text-xs mb-4">
                  Un solo QR para todas las clases. Detecta automáticamente la clase de cada alumno.
                </p>
                <Button onClick={generarQRDiario} disabled={generandoDiario}
                  className="w-full h-14 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-bold text-base shadow-lg shadow-[#FA7B21]/20">
                  {generandoDiario
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generando...</>
                    : <><QrCode className="w-5 h-5 mr-2" /> Generar QR del Día</>}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <QrCode className="w-4 h-4 text-[#FCA929]" />
                  <span className="text-white font-bold text-sm">QR del Día Activo</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Timer className="w-3 h-3 text-white/40" />
                  <span className={`text-xs font-mono ${tiempoRestante(sesionDiaria.valido_hasta) === 'Expirado' ? 'text-red-400' : 'text-white/50'}`}>
                    Expira en {tiempoRestante(sesionDiaria.valido_hasta)}
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 inline-block mx-auto mb-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(sesionDiaria.url)}`}
                    alt="QR del día" className="w-52 h-52"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <p className="text-white/40 text-[10px] break-all mb-2">{sesionDiaria.url}</p>
                <p className="text-white/50 text-xs mb-3">
                  Auto-detecta la clase de cada alumno al escanear
                </p>
                <Button onClick={reiniciarQRDiario} disabled={reiniciandoDiario}
                  className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white/70 hover:text-white text-xs border border-zinc-700">
                  {reiniciandoDiario
                    ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Reiniciando...</>
                    : <><RotateCcw className="w-3 h-3 mr-1.5" /> Reiniciar QR del Día</>}
                </Button>
              </div>
            )}
          </div>

          {/* ═══ SECTION 2: Search by name ═══ */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-[#FCA929]" />
              <span className="text-white font-semibold text-sm">Registrar por nombre</span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <Input
                type="text"
                value={busquedaNombre}
                onChange={(e) => setBusquedaNombre(e.target.value)}
                placeholder="Buscar por nombre o DNI..."
                autoComplete="off"
                style={{ fontSize: '16px' }}
                className="bg-zinc-800 border-zinc-700 text-white pl-10 text-sm"
              />
              {buscando && (
                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />
              )}
            </div>
            {resultadosBusqueda.length > 0 && (
              <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden divide-y divide-zinc-700/50 max-h-60 overflow-y-auto">
                {resultadosBusqueda.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => registrarPorNombre(a)}
                    disabled={registrandoPorNombre}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors disabled:opacity-40"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{a.nombre_alumno}</p>
                      <p className="text-white/40 text-xs">{a.dni_alumno}{a.categoria ? ` — ${a.categoria}` : ''}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-[#FCA929] shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
            {busquedaNombre.length >= 2 && resultadosBusqueda.length === 0 && !buscando && (
              <p className="text-white/40 text-xs mt-2 text-center">No se encontraron alumnos</p>
            )}

            {/* DNI manual input */}
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-white/40" />
                <span className="text-white/60 text-xs">O registrar por DNI</span>
              </div>
              <form onSubmit={registrarManualDni} className="flex gap-2">
                <Input
                  type="text" inputMode="numeric" pattern="[0-9]*" value={dniManual}
                  onChange={(e) => { setDniManual(e.target.value.replace(/\D/g, '')); setResultadoManual(null); }}
                  placeholder="DNI del alumno" maxLength={8} autoComplete="off"
                  style={{ fontSize: '16px' }}
                  className="bg-zinc-800 border-zinc-700 text-white text-center tracking-wider flex-1"
                />
                <Button type="submit" disabled={registrandoDni || dniManual.length < 7}
                  className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold px-4 disabled:opacity-40">
                  {registrandoDni ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                </Button>
              </form>
              {resultadoManual && (
                <div className={`mt-2 flex items-center justify-between p-2.5 rounded-lg text-xs ${
                  resultadoManual.success
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  <span>{resultadoManual.success ? resultadoManual.alumno : resultadoManual.error}</span>
                  <button onClick={() => setResultadoManual(null)} aria-label="Cerrar resultado" className="ml-2 opacity-60 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ═══ SECTION 3: Today's schedule (read-only) ═══ */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#FCA929]" />
              <span className="text-white font-semibold text-sm">Horario de hoy</span>
              <span className="text-white/40 text-xs ml-auto">{NOMBRES_DIA[diaHoy]}</span>
            </div>
            {horariosHoy.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No hay clases programadas hoy</p>
            ) : (
              <div className="space-y-1.5">
                {horariosHoy.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/50">
                    <span className="text-white/60 text-xs font-mono w-20 shrink-0">
                      {formatHora12(h.hora_inicio)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm truncate">{h.nombre_clase}</p>
                      {(h.edad_min_meses != null || h.edad_max_meses != null) && (
                        <p className="text-white/40 text-[10px]">{edadLabel(h.edad_min_meses, h.edad_max_meses)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ SECTION 4: Today's attendances ═══ */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FCA929]" />
                <span className="text-white font-semibold text-sm">Presentes hoy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#FCA929] text-xs font-bold">{asistencias.length}</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs">En vivo</span>
              </div>
            </div>
            {asistencias.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">Nadie ha marcado asistencia hoy</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50 overflow-y-auto max-h-[50vh]">
                {asistencias.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{a.nombre_alumno}</p>
                        <p className="text-white/40 text-xs truncate">{a.turno || a.programa || ''}</p>
                      </div>
                    </div>
                    <p className="text-white/60 text-xs shrink-0 ml-2">{a.hora}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
