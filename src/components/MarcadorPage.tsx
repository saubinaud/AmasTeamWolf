import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Minus, Play, CheckCircle, ChevronRight, MapPin, Lock } from 'lucide-react';
import { API_BASE } from '../config/api';

// ── Types ──

interface MarcadorPageProps {
  onNavigate?: (page: string) => void;
}

interface Pista {
  id: number;
  numero: number;
  nombre?: string;
}

interface Combate {
  id: number;
  pista_id: number;
  orden: number;
  alumno1_nombre: string;
  alumno2_nombre: string;
  puntaje_alumno1: number;
  puntaje_alumno2: number;
  estado: string;
  modalidad?: string;
}

// ── Constants ──

const PIN_MARCADOR = '2026';
const AUTH_KEY = 'amas_marcador_auth';

// ── Component ──

export function MarcadorPage({ onNavigate }: MarcadorPageProps) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [torneoId, setTorneoId] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('torneo');
    return t ? parseInt(t, 10) : null;
  });
  const [torneoInput, setTorneoInput] = useState('');

  const [pistas, setPistas] = useState<Pista[]>([]);
  const [combates, setCombates] = useState<Combate[]>([]);
  const [selectedPista, setSelectedPista] = useState<Pista | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── PIN Auth ──

  const handlePin = () => {
    if (pin === PIN_MARCADOR) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthed(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  // ── Load pistas & combates ──

  const loadPistas = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/torneo/pistas/${id}`);
      if (!res.ok) throw new Error('No encontrado');
      const data = await res.json();
      setPistas(data.pistas || []);
      setCombates(data.combates || []);
    } catch {
      setPistas([]);
      setCombates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && torneoId) loadPistas(torneoId);
  }, [authed, torneoId, loadPistas]);

  // ── Scoring ──

  const pistaCombates = combates.filter(c => selectedPista && c.pista_id === selectedPista.id)
    .sort((a, b) => a.orden - b.orden);
  const combate = pistaCombates[currentIndex] || null;

  const updateScore = async (field: 'puntaje_alumno1' | 'puntaje_alumno2', delta: number) => {
    if (!combate) return;
    const newValue = Math.max(0, combate[field] + delta);
    setCombates(prev => prev.map(c => c.id === combate.id ? { ...c, [field]: newValue } : c));
    try {
      await fetch(`${API_BASE}/torneo/combates/${combate.id}/puntaje`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue }),
      });
    } catch { /* silent */ }
  };

  const changeEstado = async (newEstado: string) => {
    if (!combate) return;
    try {
      await fetch(`${API_BASE}/torneo/combates/${combate.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      });
      setCombates(prev => prev.map(c => c.id === combate.id ? { ...c, estado: newEstado } : c));
    } catch { /* silent */ }
  };

  // ── Screen 1: PIN ──

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AMAS</h1>
          <p className="text-white/60 mt-1">Marcador de Torneo</p>
        </div>
        <div className="w-full max-w-xs space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="PIN de 4 dígitos"
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && handlePin()}
            className="w-full text-center text-3xl tracking-[0.5em] py-4 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-white/30 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-amber-500/50"
          />
          {pinError && <p className="text-rose-400 text-sm text-center">PIN incorrecto</p>}
          <button
            onClick={handlePin}
            disabled={pin.length !== 4}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  // ── Screen 2: Tournament ID ──

  if (!torneoId || pistas.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Seleccionar Torneo</h1>
          <p className="text-white/60 mt-1">Ingresa el número del torneo</p>
        </div>
        <div className="w-full max-w-xs space-y-4">
          <input
            type="number"
            inputMode="numeric"
            placeholder="ID del torneo"
            value={torneoInput}
            onChange={e => setTorneoInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && torneoInput) setTorneoId(parseInt(torneoInput, 10));
            }}
            className="w-full text-center text-2xl py-4 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-white/40 placeholder:text-base focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={() => torneoInput && setTorneoId(parseInt(torneoInput, 10))}
            disabled={!torneoInput}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            Cargar Torneo
          </button>
          {loading && <p className="text-white/40 text-center text-sm">Cargando...</p>}
          {torneoId && !loading && pistas.length === 0 && (
            <p className="text-rose-400 text-sm text-center">No hay pistas configuradas para este torneo</p>
          )}
        </div>
      </div>
    );
  }

  // ── Screen 3: Pista Selection ──

  if (!selectedPista) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4">
        <div className="mb-6">
          <button
            onClick={() => { setTorneoId(null); setTorneoInput(''); }}
            className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Cambiar torneo
          </button>
          <h1 className="text-xl font-bold text-white">Selecciona una Pista</h1>
          <p className="text-white/60 text-sm mt-1">Torneo #{torneoId}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {pistas.map(p => {
            const pistaCmbs = combates.filter(c => c.pista_id === p.id);
            const enCurso = pistaCmbs.find(c => c.estado === 'en_curso');
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedPista(p); setCurrentIndex(0); }}
                className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-left hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span className="text-white font-bold">Pista {p.numero}</span>
                </div>
                {enCurso ? (
                  <p className="text-xs text-emerald-400 truncate">
                    {enCurso.alumno1_nombre} vs {enCurso.alumno2_nombre}
                  </p>
                ) : (
                  <p className="text-xs text-white/40">{pistaCmbs.length} combates</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Screen 4: Scoring Interface ──

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <button
          onClick={() => setSelectedPista(null)}
          className="flex items-center gap-1 text-white/60 hover:text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <span className="text-white font-bold">PISTA {selectedPista.numero}</span>
        <span className="text-white/40 text-xs">
          {combate ? `${currentIndex + 1}/${pistaCombates.length}` : ''}
        </span>
      </div>

      {!combate ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40">No hay combates en esta pista</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Modalidad + Estado */}
          <div className="text-center">
            {combate.modalidad && (
              <span className="text-white/60 text-sm">{combate.modalidad}</span>
            )}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              combate.estado === 'en_curso' ? 'bg-emerald-500/20 text-emerald-400' :
              combate.estado === 'finalizado' ? 'bg-white/10 text-white/40' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {combate.estado === 'en_curso' ? 'En curso' :
               combate.estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
            </span>
          </div>

          {/* Score cards */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            {/* RED */}
            <div className="bg-gradient-to-b from-rose-950/40 to-rose-900/20 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 gap-3">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Rojo</span>
              <p className="text-white text-sm font-medium text-center truncate w-full">
                {combate.alumno1_nombre}
              </p>
              <span className="text-5xl font-bold text-rose-400">{combate.puntaje_alumno1}</span>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => updateScore('puntaje_alumno1', 1)}
                  disabled={combate.estado !== 'en_curso'}
                  className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white text-2xl transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
                <button
                  onClick={() => updateScore('puntaje_alumno1', -1)}
                  disabled={combate.estado !== 'en_curso'}
                  className="w-14 h-14 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white/60 text-xl transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* BLUE */}
            <div className="bg-gradient-to-b from-sky-950/40 to-sky-900/20 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 gap-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Azul</span>
              <p className="text-white text-sm font-medium text-center truncate w-full">
                {combate.alumno2_nombre}
              </p>
              <span className="text-5xl font-bold text-sky-400">{combate.puntaje_alumno2}</span>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => updateScore('puntaje_alumno2', 1)}
                  disabled={combate.estado !== 'en_curso'}
                  className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-white text-2xl transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
                <button
                  onClick={() => updateScore('puntaje_alumno2', -1)}
                  disabled={combate.estado !== 'en_curso'}
                  className="w-14 h-14 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white/60 text-xl transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {combate.estado === 'pendiente' && (
              <button
                onClick={() => changeEstado('en_curso')}
                className="flex-1 py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" /> Iniciar
              </button>
            )}
            {combate.estado === 'en_curso' && (
              <button
                onClick={() => changeEstado('finalizado')}
                className="flex-1 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle className="w-5 h-5" /> Finalizar
              </button>
            )}
            {currentIndex < pistaCombates.length - 1 && (
              <button
                onClick={() => setCurrentIndex(i => i + 1)}
                className="py-4 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-2 transition-colors"
              >
                Sig. <ChevronRight className="w-5 h-5" />
              </button>
            )}
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex(i => i - 1)}
                className="py-4 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 font-medium flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Ant.
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
