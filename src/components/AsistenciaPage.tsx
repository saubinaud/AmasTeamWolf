import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { API_BASE } from '../config/api';

interface AsistenciaPageProps {
  onNavigate: (page: string) => void;
}

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
    clases_totales?: number;
    clases_usadas?: number;
    clases_restantes?: number;
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
      const response = await fetch(`${API_BASE}/asistencia`, {
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
        <div className="text-center max-w-sm md:max-w-md">
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
        <div className="text-center max-w-sm md:max-w-md">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Asistencia Registrada</h2>
          <div className="space-y-3 mb-8">
            <p className="text-white text-lg">{resultado.alumno}</p>
            {resultado.programa && (
              <p className="text-white/60 text-sm">{resultado.programa}</p>
            )}
            <div className="flex items-center justify-center gap-2 text-[#FCA929]">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{resultado.hora} — Turno {turno}</span>
            </div>

            {/* Conteo de clases */}
            {resultado.clases_totales != null && resultado.clases_totales > 0 && (
              <div className={`mt-4 rounded-xl p-4 text-center ${
                resultado.clases_restantes != null && resultado.clases_restantes <= 3
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-zinc-800/60 border border-white/10'
              }`}>
                <div className="text-3xl font-bold text-white mb-1">
                  {resultado.clases_restantes}
                  <span className="text-base font-normal text-white/50"> / {resultado.clases_totales}</span>
                </div>
                <p className={`text-xs ${
                  resultado.clases_restantes != null && resultado.clases_restantes <= 3
                    ? 'text-amber-400'
                    : 'text-white/50'
                }`}>
                  {resultado.clases_restantes === 0
                    ? 'Completaste todas tus clases'
                    : resultado.clases_restantes === 1
                      ? 'Te queda 1 clase'
                      : `Te quedan ${resultado.clases_restantes} clases`}
                </p>
                {resultado.clases_restantes != null && resultado.clases_restantes <= 3 && (
                  <button
                    onClick={() => onNavigate('renovacion')}
                    className="mt-3 text-[#FCA929] hover:text-[#FA7B21] text-xs underline underline-offset-2 transition-colors"
                  >
                    {resultado.clases_restantes === 0 ? 'Renueva tu programa aquí' : 'Renueva antes de que se acaben'}
                  </button>
                )}
              </div>
            )}
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

      <div className="relative w-full max-w-sm md:max-w-md">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl">
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
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{resultado.error}</p>
                </div>
                {resultado.clases_totales != null && resultado.clases_totales > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-500/20 text-center space-y-2">
                    <span className="text-white/60 text-xs">
                      Clases: {resultado.clases_usadas}/{resultado.clases_totales} usadas
                      {resultado.clases_restantes != null && resultado.clases_restantes > 0
                        ? ` — quedan ${resultado.clases_restantes}`
                        : ' — programa completado'}
                    </span>
                    {resultado.clases_restantes === 0 && (
                      <button
                        type="button"
                        onClick={() => onNavigate('renovacion')}
                        className="block w-full mt-2 py-2.5 rounded-lg bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white text-sm font-semibold hover:from-[#F36A15] hover:to-[#FA7B21] transition-all"
                      >
                        Renovar programa
                      </button>
                    )}
                  </div>
                )}
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
