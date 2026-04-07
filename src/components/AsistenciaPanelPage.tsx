import { useState, useEffect, useCallback } from 'react';
import { Loader2, QrCode, Users, Clock, Shield, LogOut, RefreshCw, CheckCircle, UserCheck, KeyRound, ArrowLeft, X } from 'lucide-react';
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

// ── HORARIOS POR DÍA ──
// Índice: 0=domingo, 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado
const HORARIOS: Record<number, ClaseHorario[]> = {
  1: [ // LUNES
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Junior Wolf' },
  ],
  2: [ // MARTES
    { hora: '15:00', programa: 'Súper Baby Wolf' },
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Adolescentes Wolf' },
  ],
  3: [ // MIÉRCOLES
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Junior Wolf' },
  ],
  4: [ // JUEVES
    { hora: '15:00', programa: 'Súper Baby Wolf' },
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Adolescentes Wolf' },
  ],
  5: [ // VIERNES
    { hora: '15:30', programa: 'Súper Baby Wolf' },
    { hora: '16:00', programa: 'Baby Wolf' },
    { hora: '16:30', programa: 'Baby Wolf' },
    { hora: '17:00', programa: 'Little Wolf' },
    { hora: '17:30', programa: 'Little Wolf' },
    { hora: '18:00', programa: 'Little Wolf' },
    { hora: '18:30', programa: 'Junior Wolf' },
  ],
  6: [ // SÁBADO
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

const COLORES_PROGRAMA: Record<string, string> = {
  'Súper Baby Wolf': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Baby Wolf': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'Little Wolf': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Junior Wolf': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Adolescentes Wolf': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
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
    const inicio = horaAMinutos(clases[i].hora);
    if (ahora < inicio) return i;
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

// Clave única para una clase (hora-programa)
function claseKey(clase: ClaseHorario): string {
  return `${clase.hora}|${clase.programa}`;
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
  const [autoSeleccionada, setAutoSeleccionada] = useState(false);

  // Registro manual DNI
  const [dniManual, setDniManual] = useState('');
  const [registrandoDni, setRegistrandoDni] = useState(false);
  const [resultadoManual, setResultadoManual] = useState<{ success: boolean; alumno?: string; error?: string } | null>(null);

  // Vista: 'clases' = lista de clases, 'detalle' = QR + asistencia de una clase
  const [vista, setVista] = useState<'clases' | 'detalle'>('clases');

  const diaHoy = new Date().getDay();
  const clasesHoy = HORARIOS[diaHoy] || [];
  const sesionActiva = claseActiva ? sesiones[claseKey(claseActiva)] : null;

  // Auto-seleccionar la clase actual/próxima al cargar
  useEffect(() => {
    if (autenticada && clasesHoy.length > 0 && !autoSeleccionada) {
      const idx = detectarClaseActual(clasesHoy);
      setClaseActiva(clasesHoy[idx]);
      setAutoSeleccionada(true);
    }
  }, [autenticada, clasesHoy, autoSeleccionada]);

  // Asistencias globales (todas del día) y por clase (filtradas por token)
  const [asistenciasClase, setAsistenciasClase] = useState<Asistencia[]>([]);

  // Fetch asistencias — si hay sesión activa en la vista detalle, filtra por token
  const fetchAsistencias = useCallback(async () => {
    try {
      // Siempre traer todas las del día (para stats)
      const resp = await fetch(`${API_BASE}/asistencia/hoy`);
      const data = await resp.json();
      if (Array.isArray(data)) {
        setAsistencias(data);
      }
    } catch (_err) {
      // silently fail
    }
  }, []);

  const fetchAsistenciasClase = useCallback(async (token: string) => {
    try {
      const resp = await fetch(`${API_BASE}/asistencia/hoy?token=${token}`);
      const data = await resp.json();
      if (Array.isArray(data)) {
        setAsistenciasClase(data);
      }
    } catch (_err) {
      // silently fail
    }
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

  // Fetch asistencias de la clase al entrar al detalle o al generar QR
  useEffect(() => {
    if (sesionActiva && vista === 'detalle') {
      fetchAsistenciasClase(sesionActiva.token);
    } else {
      setAsistenciasClase([]);
    }
  }, [sesionActiva, vista, fetchAsistenciasClase]);

  // Check session storage for auth
  useEffect(() => {
    if (sessionStorage.getItem('amas_panel_auth') === 'true') {
      setAutenticada(true);
    }
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

  // Generar QR para la clase activa
  const generarQR = async () => {
    if (!claseActiva) return;
    setGenerandoQR(true);
    try {
      const resp = await fetch(`${API_BASE}/qr/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sede_id: 1,
          duracion_horas: 2,
          hora_clase: claseActiva.hora,
          programa: claseActiva.programa,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        const sesion: SesionQR = {
          token: data.token,
          url: data.url,
          valido_hasta: data.valido_hasta,
          hora_clase: claseActiva.hora,
          programa: claseActiva.programa,
        };
        setSesiones(prev => ({ ...prev, [claseKey(claseActiva)]: sesion }));
        toast.success(`QR generado — ${claseActiva.programa} ${formatHora12(claseActiva.hora)}`);
      } else {
        toast.error('Error generando QR');
      }
    } catch (_err) {
      toast.error('Error de conexión');
    } finally {
      setGenerandoQR(false);
    }
  };

  // Seleccionar clase y ir a detalle
  const seleccionarClase = (clase: ClaseHorario) => {
    setClaseActiva(clase);
    setVista('detalle');
    setDniManual('');
    setResultadoManual(null);
  };

  // Volver a la lista de clases
  const volverAClases = () => {
    setVista('clases');
    setDniManual('');
    setResultadoManual(null);
  };

  // Registro manual de asistencia por DNI
  const registrarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesionActiva || !dniManual || dniManual.length < 7) {
      toast.error('Ingresa un DNI válido');
      return;
    }
    setRegistrandoDni(true);
    setResultadoManual(null);
    try {
      const resp = await fetch(`${API_BASE}/asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni_alumno: dniManual,
          token_qr: sesionActiva.token,
          turno: claseActiva?.programa || 'General',
        }),
      });
      const data = await resp.json();
      const result = Array.isArray(data) && data.length > 0 ? data[0] : data;
      setResultadoManual(result);
      if (result.success) {
        toast.success(`Asistencia registrada — ${result.alumno}`);
        setDniManual('');
        fetchAsistencias();
        if (sesionActiva) fetchAsistenciasClase(sesionActiva.token);
      } else {
        toast.error(result.error || 'No se pudo registrar');
      }
    } catch (_err) {
      setResultadoManual({ success: false, error: 'Error de conexión' });
      toast.error('Error de conexión');
    } finally {
      setRegistrandoDni(false);
    }
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
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(false); }}
                placeholder="••••"
                autoFocus
                autoComplete="off"
                className={`bg-zinc-800 border-white/20 text-white text-center text-2xl tracking-[0.5em] h-14 ${pinError ? 'border-red-500 animate-shake' : ''}`}
              />
              <Button
                type="submit"
                disabled={pin.length < 4}
                className="w-full h-12 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold disabled:opacity-40"
              >
                Ingresar
              </Button>
            </form>

            <button
              onClick={() => onNavigate('home')}
              className="block mx-auto mt-4 text-white/40 hover:text-white/60 text-xs transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PANEL PRINCIPAL ──
  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {vista === 'detalle' && (
              <button onClick={volverAClases} className="p-1.5 -ml-1 text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-white font-bold text-sm">
                {vista === 'detalle' && claseActiva
                  ? `${formatHora12(claseActiva.hora)} — ${claseActiva.programa}`
                  : 'Panel de Asistencia'}
              </h1>
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Clock className="w-3 h-3" />
                <span>{NOMBRES_DIA[diaHoy]} — {horaActual()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={fetchAsistencias} className="p-2 text-white/50 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="p-2 text-white/50 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* ═══ VISTA: LISTA DE CLASES ═══ */}
        {vista === 'clases' && (
          <>
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
              <div className="text-center mb-4">
                <p className="text-white font-semibold text-sm">{NOMBRES_DIA[diaHoy]}</p>
                <p className="text-white/50 text-xs">Selecciona una clase</p>
              </div>

              {clasesHoy.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/40 text-sm">No hay clases programadas hoy</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clasesHoy.map((clase, i) => {
                    const key = claseKey(clase);
                    const tieneSesion = !!sesiones[key];
                    const estado = estadoClase(clase.hora);
                    const colorClass = COLORES_PROGRAMA[clase.programa] || 'bg-zinc-700/30 text-white/70 border-white/10';
                    const isPasada = estado === 'pasada';
                    const isAhora = estado === 'actual';
                    const isActiva = claseActiva && claseKey(claseActiva) === key;

                    return (
                      <button
                        key={i}
                        onClick={() => seleccionarClase(clase)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border transition-all text-left ${
                          isPasada && !tieneSesion
                            ? 'bg-zinc-800/30 border-white/5 opacity-40'
                            : `${colorClass} hover:brightness-125`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-mono font-semibold ${isPasada && !tieneSesion ? 'text-white/40' : 'text-white/80'}`}>
                            {formatHora12(clase.hora)}
                          </span>
                          <span className={`text-sm ${isPasada && !tieneSesion ? 'text-white/40' : ''}`}>
                            {clase.programa}
                          </span>
                          {isAhora && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/30 animate-pulse">
                              AHORA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {tieneSesion && (
                            <span className="px-2 py-0.5 bg-[#FA7B21]/20 text-[#FCA929] text-[10px] font-bold rounded-full border border-[#FA7B21]/30">
                              QR ACTIVO
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats generales */}
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
            {/* QR Section */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
              {!sesionActiva ? (
                <div className="text-center">
                  <QrCode className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/60 text-sm mb-1">
                    {claseActiva.programa} — {formatHora12(claseActiva.hora)}
                  </p>
                  <p className="text-white/40 text-xs mb-4">Genera el QR para esta clase</p>
                  <Button
                    onClick={generarQR}
                    disabled={generandoQR}
                    className="w-full h-12 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold"
                  >
                    {generandoQR ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</>
                    ) : (
                      <><QrCode className="w-4 h-4 mr-2" /> Generar QR</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  {/* Badge de la clase */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border ${COLORES_PROGRAMA[sesionActiva.programa] || 'bg-zinc-700/30 text-white/70 border-white/10'}`}>
                    <Clock className="w-3 h-3" />
                    {formatHora12(sesionActiva.hora_clase)} — {sesionActiva.programa}
                  </div>

                  <p className="text-white/50 text-xs mb-3">Los padres escanean este código:</p>

                  <div className="bg-white rounded-xl p-3 inline-block mx-auto mb-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sesionActiva.url)}`}
                      alt="QR de asistencia"
                      className="w-48 h-48"
                    />
                  </div>

                  <p className="text-white/40 text-[10px] break-all mb-3">{sesionActiva.url}</p>
                </div>
              )}
            </div>

            {/* Registro manual por DNI */}
            {sesionActiva && (
              <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-4 h-4 text-[#FCA929]" />
                  <span className="text-white font-semibold text-sm">Registro manual</span>
                  <span className="text-white/40 text-xs">— para padres sin QR</span>
                </div>

                <form onSubmit={registrarManual} className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={dniManual}
                    onChange={(e) => { setDniManual(e.target.value.replace(/\D/g, '')); setResultadoManual(null); }}
                    placeholder="DNI del alumno"
                    maxLength={8}
                    autoComplete="off"
                    className="bg-zinc-800 border-white/20 text-white text-center tracking-wider flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={registrandoDni || dniManual.length < 7}
                    className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold px-4 disabled:opacity-40"
                  >
                    {registrandoDni ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                </form>

                {/* Resultado del registro manual */}
                {resultadoManual && (
                  <div className={`mt-3 flex items-center justify-between p-2.5 rounded-lg text-xs ${
                    resultadoManual.success
                      ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    <span>
                      {resultadoManual.success
                        ? `Registrado: ${resultadoManual.alumno}`
                        : resultadoManual.error}
                    </span>
                    <button onClick={() => setResultadoManual(null)} className="ml-2 opacity-60 hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Lista de asistencias de esta clase */}
            <div className="bg-zinc-900/80 border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FCA929]" />
                  <span className="text-white font-semibold text-sm">
                    {sesionActiva ? `Presentes — ${claseActiva.programa}` : 'Asistencias de hoy'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sesionActiva && asistenciasClase.length > 0 && (
                    <span className="text-[#FCA929] text-xs font-bold">{asistenciasClase.length}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs">En vivo</span>
                  </div>
                </div>
              </div>

              {(sesionActiva ? asistenciasClase : asistencias).length === 0 ? (
                <div className="p-8 text-center">
                  <UserCheck className="w-10 h-10 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">
                    {sesionActiva ? 'Nadie ha marcado asistencia en esta clase' : 'Aún no hay asistencias'}
                  </p>
                  <p className="text-white/30 text-xs mt-1">Aparecerán aquí cuando los padres escaneen el QR</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[40vh] overflow-y-auto">
                  {(sesionActiva ? asistenciasClase : asistencias).map((a, i) => (
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
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-white/60 text-xs">{a.hora}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
