import { useState, useEffect, useCallback } from 'react';
import { Loader2, QrCode, Users, Clock, Shield, LogOut, RefreshCw, CheckCircle, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { API_BASE } from '../config/api';

interface AsistenciaPanelPageProps {
  onNavigate: (page: string) => void;
}

const PIN_PROFESORA = '2835';

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
}

function detectarTurno(): string {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 13) return 'Mañana';
  if (hora >= 13 && hora < 20) return 'Tarde';
  return 'General';
}

function horaActual(): string {
  return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function AsistenciaPanelPage({ onNavigate }: AsistenciaPanelPageProps) {
  const [autenticada, setAutenticada] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Panel state
  const [sesionQR, setSesionQR] = useState<SesionQR | null>(null);
  const [generandoQR, setGenerandoQR] = useState(false);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [cargando, setCargando] = useState(false);
  const turno = detectarTurno();

  // Polling de asistencias cada 5 segundos
  const fetchAsistencias = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/asistencia/hoy`);
      const data = await resp.json();
      if (Array.isArray(data)) {
        setAsistencias(data);
      }
    } catch (err) {
      // silently fail, retry on next poll
    }
  }, []);

  useEffect(() => {
    if (!autenticada) return;
    fetchAsistencias();
    const interval = setInterval(fetchAsistencias, 5000);
    return () => clearInterval(interval);
  }, [autenticada, fetchAsistencias]);

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
    setSesionQR(null);
  };

  const generarQR = async () => {
    setGenerandoQR(true);
    try {
      const resp = await fetch(`${API_BASE}/qr/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sede_id: 1, duracion_horas: 4 }),
      });
      const data = await resp.json();
      if (data.success) {
        setSesionQR(data);
        toast.success('QR generado para este turno');
      } else {
        toast.error('Error generando QR');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setGenerandoQR(false);
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
  const qrUrl = sesionQR ? sesionQR.url : null;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-white font-bold text-sm">Panel de Asistencia</h1>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Clock className="w-3 h-3" />
              <span>{horaActual()} — Turno {turno}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

        {/* QR Section */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5">
          {!sesionQR ? (
            <div className="text-center">
              <QrCode className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60 text-sm mb-4">Genera un código QR para que los padres registren asistencia</p>
              <Button
                onClick={generarQR}
                disabled={generandoQR}
                className="w-full h-12 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold"
              >
                {generandoQR ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</>
                ) : (
                  <><QrCode className="w-4 h-4 mr-2" /> Generar QR del Turno</>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white/50 text-xs mb-3">Los padres escanean este código:</p>

              {/* QR Code via API de Google Charts */}
              <div className="bg-white rounded-xl p-3 inline-block mx-auto mb-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl!)}`}
                  alt="QR de asistencia"
                  className="w-48 h-48"
                />
              </div>

              <p className="text-white/40 text-[10px] break-all mb-3">{qrUrl}</p>

              <Button
                onClick={generarQR}
                variant="outline"
                className="w-full border-white/20 text-white/70 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="w-3 h-3 mr-2" /> Generar nuevo QR
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{asistencias.length}</div>
            <div className="text-white/50 text-xs">Presentes hoy</div>
          </div>
          <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#FCA929]">{turno}</div>
            <div className="text-white/50 text-xs">Turno actual</div>
          </div>
        </div>

        {/* Live attendance list */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FCA929]" />
              <span className="text-white font-semibold text-sm">Asistencias de hoy</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs">En vivo</span>
            </div>
          </div>

          {asistencias.length === 0 ? (
            <div className="p-8 text-center">
              <UserCheck className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">Aún no hay asistencias registradas</p>
              <p className="text-white/30 text-xs mt-1">Aparecerán aquí cuando los padres escaneen el QR</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[50vh] overflow-y-auto">
              {asistencias.map((a, i) => (
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
                    <p className="text-white/30 text-[10px]">{a.turno}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
