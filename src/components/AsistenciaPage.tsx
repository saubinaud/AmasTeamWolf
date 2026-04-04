import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

interface AsistenciaPageProps {
  onNavigate: (page: string) => void;
}

// API base — en dev usa proxy local, en prod Easypanel
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api/asistencia'
  : 'https://amas-api.s6hx3x.easypanel.host/api/asistencia';

function detectarTurno(): string {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 13) return 'Mañana';
  if (hora >= 13 && hora < 20) return 'Tarde';
  return 'General';
}

function obtenerTokenDeUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

export function AsistenciaPage({ onNavigate }: AsistenciaPageProps) {
  const [dni, setDni] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultado, setResultado] = useState<{
    success: boolean;
    alumno?: string;
    programa?: string;
    hora?: string;
    error?: string;
  } | null>(null);
  const [tokenQr, setTokenQr] = useState<string | null>(null);
  const turno = detectarTurno();

  useEffect(() => {
    setTokenQr(obtenerTokenDeUrl());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dni || dni.length < 7) {
      toast.error('Ingresa un DNI válido');
      return;
    }

    if (!tokenQr) {
      toast.error('QR inválido — escanea el código en la sede');
      return;
    }

    setIsSubmitting(true);
    setResultado(null);

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni_alumno: dni,
          token_qr: tokenQr,
          turno: turno,
        }),
      });

      const data = await response.json();

      // Normalizar: API puede devolver array
      const result = Array.isArray(data) && data.length > 0 ? data[0] : data;

      setResultado(result);

      if (result.success) {
        toast.success('Asistencia registrada');
      } else {
        toast.error(result.error || 'No se pudo registrar');
      }
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      setResultado({ success: false, error: 'Error de conexión. Intenta de nuevo.' });
      toast.error('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setDni('');
    setResultado(null);
  };

  // Sin token QR en la URL
  if (!tokenQr) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center max-w-sm">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">QR no detectado</h2>
          <p className="text-white/60 text-sm mb-6">
            Para registrar asistencia, escanea el código QR que está en la sede.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="text-[#FCA929] hover:text-[#FA7B21] text-sm transition-colors"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  // Resultado exitoso
  if (resultado?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Asistencia Registrada</h2>
          <div className="space-y-2 mb-8">
            <p className="text-white text-lg">{resultado.alumno}</p>
            {resultado.programa && (
              <p className="text-white/60 text-sm">{resultado.programa}</p>
            )}
            <div className="flex items-center justify-center gap-2 text-[#FCA929]">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{resultado.hora} — Turno {turno}</span>
            </div>
          </div>

          <Button
            onClick={handleReset}
            className="bg-zinc-700 hover:bg-zinc-600 text-white"
          >
            Registrar otro alumno
          </Button>
        </div>
      </div>
    );
  }

  // Formulario principal
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-[#FA7B21]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#FCA929]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FA7B21]/30">
              <UserCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Registro de Asistencia
            </h1>
            <p className="text-white/50 text-sm">AMAS Team Wolf</p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-zinc-800/80 rounded-full px-3 py-1 text-xs text-white/60">
              <Clock className="w-3 h-3" />
              Turno {turno}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="dniAlumno" className="text-white mb-2 block">
                DNI del Alumno
              </Label>
              <Input
                id="dniAlumno"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="Ingresa el DNI"
                maxLength={8}
                autoFocus
                autoComplete="off"
                className="bg-zinc-800 border-white/20 text-white text-center text-lg tracking-widest h-14"
              />
            </div>

            {/* Error */}
            {resultado && !resultado.success && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{resultado.error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || dni.length < 7}
              className="w-full h-14 text-lg bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Asistencia'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
