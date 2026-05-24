import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Lock, MapPin, Timer, Undo2 } from 'lucide-react';
import { API_BASE } from '../config/api';

// ── Types ──

interface MarcadorPageProps {
  onNavigate?: (page: string) => void;
}

interface Torneo { id: number; nombre: string; fecha: string; estado: string; }
interface Juez { id: number; nombre: string; }
interface Pista { id: number; numero: number; nombre?: string; juez_nombre?: string; combate_actual?: string; }
interface TipoPuntaje { id: string; nombre: string; valor: number; color: string; }
interface TorneoConfig { duracion_round_seg: number; max_rounds: number; tipos_puntaje: TipoPuntaje[]; }
interface Combate {
  id: number; pista_id: number; orden: number;
  alumno1_id: number; alumno1_nombre: string;
  alumno2_id: number | null; alumno2_nombre: string | null;
  puntaje_alumno1: number; puntaje_alumno2: number;
  estado: string; modalidad?: string; round_actual?: number;
}
interface LogEntry { id: number; alumno_id: number; tipo: string; valor: number; round: number; tiempo: string; alumno_nombre?: string; }

// ── Constants ──

const PIN_MARCADOR = '2026';
const AUTH_KEY = 'amas_marcador_auth';
const DEFAULT_CONFIG: TorneoConfig = {
  duracion_round_seg: 90,
  max_rounds: 3,
  tipos_puntaje: [
    { id: 'punto', nombre: 'Punto', valor: 1, color: '#22c55e' },
    { id: 'patada', nombre: 'Patada', valor: 2, color: '#3b82f6' },
    { id: 'cabeza', nombre: 'Cabeza', valor: 3, color: '#a855f7' },
    { id: 'falta', nombre: 'Falta', valor: -1, color: '#ef4444' },
  ],
};

// ── Component ──

export function MarcadorPage({ onNavigate }: MarcadorPageProps) {
  // Auth
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === 'true');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Selection flow
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [selectedTorneo, setSelectedTorneo] = useState<Torneo | null>(null);
  const [jueces, setJueces] = useState<Juez[]>([]);
  const [selectedJuez, setSelectedJuez] = useState<Juez | null>(null);
  const [pistas, setPistas] = useState<Pista[]>([]);
  const [selectedPista, setSelectedPista] = useState<Pista | null>(null);

  // Scoring
  const [config, setConfig] = useState<TorneoConfig>(DEFAULT_CONFIG);
  const [combates, setCombates] = useState<Combate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [roundActual, setRoundActual] = useState(1);

  // Timer
  const [timerSeg, setTimerSeg] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFlash, setTimerFlash] = useState(false);

  const [loading, setLoading] = useState(false);

  // ── Timer Logic ──

  useEffect(() => {
    if (!timerRunning || timerSeg <= 0) return;
    const interval = setInterval(() => {
      setTimerSeg(prev => {
        if (prev <= 1) {
          setTimerRunning(false);
          setTimerFlash(true);
          try { navigator.vibrate?.(500); } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeg]);

  useEffect(() => {
    if (!timerFlash) return;
    const t = setTimeout(() => setTimerFlash(false), 3000);
    return () => clearTimeout(t);
  }, [timerFlash]);

  const timerDisplay = `${Math.floor(timerSeg / 60).toString().padStart(2, '0')}:${(timerSeg % 60).toString().padStart(2, '0')}`;

  // ── Data Fetching ──

  const loadTorneos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/torneo/activos`);
      const data = await res.json();
      setTorneos(data.torneos || data || []);
    } catch { setTorneos([]); }
    finally { setLoading(false); }
  }, []);

  const loadJueces = useCallback(async (torneoId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/torneo/${torneoId}/jueces`);
      const data = await res.json();
      setJueces(data.jueces || data || []);
    } catch { setJueces([]); }
    finally { setLoading(false); }
  }, []);

  const loadPistas = useCallback(async (torneoId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/torneo/pistas/${torneoId}`);
      const data = await res.json();
      setPistas(data.pistas || []);
      setCombates(data.combates || []);
    } catch { setPistas([]); setCombates([]); }
    finally { setLoading(false); }
  }, []);

  const loadConfig = useCallback(async (torneoId: number) => {
    try {
      const res = await fetch(`${API_BASE}/torneo/${torneoId}/config`);
      const data = await res.json();
      if (data && data.duracion_round_seg) {
        setConfig(data);
        setTimerSeg(data.duracion_round_seg);
      } else {
        setTimerSeg(DEFAULT_CONFIG.duracion_round_seg);
      }
    } catch { setTimerSeg(DEFAULT_CONFIG.duracion_round_seg); }
  }, []);

  const loadLog = useCallback(async (combateId: number) => {
    try {
      const res = await fetch(`${API_BASE}/torneo/combates/${combateId}/log`);
      const data = await res.json();
      setLog(data.log || data || []);
    } catch { setLog([]); }
  }, []);

  const reloadScores = useCallback(async (combateId: number) => {
    try {
      const res = await fetch(`${API_BASE}/torneo/combates/${combateId}/log`);
      const data = await res.json();
      const entries: LogEntry[] = data.log || data || [];
      setLog(entries);
      // Recalculate from combates state
    } catch {}
  }, []);

  // Load torneos on auth
  useEffect(() => { if (authed && !selectedTorneo) loadTorneos(); }, [authed, selectedTorneo, loadTorneos]);

  // Load jueces when torneo selected
  useEffect(() => { if (selectedTorneo) loadJueces(selectedTorneo.id); }, [selectedTorneo, loadJueces]);

  // Load pistas when juez selected
  useEffect(() => {
    if (selectedTorneo && selectedJuez) {
      loadPistas(selectedTorneo.id);
      loadConfig(selectedTorneo.id);
    }
  }, [selectedTorneo, selectedJuez, loadPistas, loadConfig]);

  // Current combate
  const pistaCombates = combates.filter(c => selectedPista && c.pista_id === selectedPista.id).sort((a, b) => a.orden - b.orden);
  const combate = pistaCombates[currentIndex] || null;

  // Load log when combate changes
  useEffect(() => {
    if (combate) {
      setScores({ p1: combate.puntaje_alumno1, p2: combate.puntaje_alumno2 });
      loadLog(combate.id);
      setRoundActual(combate.round_actual || 1);
    }
  }, [combate?.id, loadLog]);

  // ── Actions ──

  const handlePin = () => {
    if (pin === PIN_MARCADOR) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthed(true);
      setPinError(false);
    } else { setPinError(true); setPin(''); }
  };

  const registerPunto = async (alumnoId: number, tipo: string, valor: number) => {
    if (!combate) return;
    try {
      const res = await fetch(`${API_BASE}/torneo/combates/${combate.id}/punto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumno_id: alumnoId, tipo, valor, round: roundActual, juez_id: selectedJuez?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setScores({ p1: data.totals.puntaje_alumno1, p2: data.totals.puntaje_alumno2 });
        setLog(prev => [data.data, ...prev]);
      }
    } catch {}
  };

  const undoLastPunto = async (alumnoId: number) => {
    const lastEntry = log.find(l => l.alumno_id === alumnoId);
    if (!lastEntry) return;
    try {
      await fetch(`${API_BASE}/torneo/puntaje-log/${lastEntry.id}`, { method: 'DELETE' });
      setLog(prev => prev.filter(l => l.id !== lastEntry.id));
      if (combate) reloadScores(combate.id);
    } catch {}
  };

  const nextRound = () => {
    const newRound = roundActual + 1;
    if (newRound > config.max_rounds) return;
    setRoundActual(newRound);
    setTimerSeg(config.duracion_round_seg);
    setTimerRunning(false);
    setTimerFlash(false);
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
    } catch {}
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
            type="password" inputMode="numeric" maxLength={4}
            placeholder="PIN de 4 dígitos" value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && handlePin()}
            className="w-full text-center text-3xl tracking-[0.5em] py-4 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-white/30 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-amber-500/50"
          />
          {pinError && <p className="text-rose-400 text-sm text-center">PIN incorrecto</p>}
          <button onClick={handlePin} disabled={pin.length !== 4}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors">
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  // ── Screen 1b: Tournament Selection ──

  if (!selectedTorneo) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4">
        <h1 className="text-xl font-bold text-[#FCA929] mb-1">Seleccionar Torneo</h1>
        <p className="text-white/60 text-sm mb-6">Elige un torneo activo</p>
        {loading && <p className="text-white/40 text-center">Cargando...</p>}
        {!loading && torneos.length === 0 && <p className="text-white/40 text-center mt-12">No hay torneos activos</p>}
        <div className="space-y-3">
          {torneos.map(t => (
            <button key={t.id} onClick={() => setSelectedTorneo(t)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-4 text-left hover:border-[#FCA929]/40 transition-colors">
              <p className="text-white font-semibold">{t.nombre}</p>
              <p className="text-white/40 text-sm mt-1">{t.fecha}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Screen 1c: Judge Selection ──

  if (!selectedJuez) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4">
        <button onClick={() => setSelectedTorneo(null)} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Torneos
        </button>
        <h1 className="text-xl font-bold text-[#FCA929] mb-1">Seleccionar Juez</h1>
        <p className="text-white/60 text-sm mb-6">{selectedTorneo.nombre}</p>
        {loading && <p className="text-white/40 text-center">Cargando...</p>}
        {!loading && jueces.length === 0 && (
          <p className="text-white/40 text-center mt-12">No hay jueces registrados. Configura jueces desde Space.</p>
        )}
        <div className="space-y-3">
          {jueces.map(j => (
            <button key={j.id} onClick={() => setSelectedJuez(j)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-4 text-left hover:border-[#FCA929]/40 transition-colors">
              <p className="text-white font-semibold">{j.nombre}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Screen 2: Pista Selection ──

  if (!selectedPista) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4">
        <button onClick={() => setSelectedJuez(null)} className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Jueces
        </button>
        <h1 className="text-xl font-bold text-[#FCA929] mb-1">Seleccionar Pista</h1>
        <p className="text-white/60 text-sm mb-6">Juez: {selectedJuez.nombre}</p>
        {loading && <p className="text-white/40 text-center">Cargando...</p>}
        <div className="grid grid-cols-2 gap-3">
          {pistas.map(p => {
            const pistaCmbs = combates.filter(c => c.pista_id === p.id);
            const enCurso = pistaCmbs.find(c => c.estado === 'en_curso');
            return (
              <button key={p.id} onClick={() => { setSelectedPista(p); setCurrentIndex(0); }}
                className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 text-left hover:border-[#FCA929]/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#FCA929]" />
                  <span className="text-white font-bold">Pista {p.numero}</span>
                </div>
                {p.juez_nombre && <p className="text-xs text-white/50 mb-1">Juez: {p.juez_nombre}</p>}
                {enCurso ? (
                  <p className="text-xs text-emerald-400 truncate">{enCurso.alumno1_nombre} vs {enCurso.alumno2_nombre || 'Por definir'}</p>
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

  // ── Screen 3: Scoring Interface ──

  const blueDisabled = !combate?.alumno2_id;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedPista(null)} className="flex items-center gap-1 text-white/60 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Pistas
          </button>
          <span className="text-white font-bold text-[#FCA929]">PISTA {selectedPista.numero}</span>
          <span className="text-white/40 text-xs">{combate ? `Combate ${currentIndex + 1} de ${pistaCombates.length}` : ''}</span>
        </div>
        {combate && (
          <div className="text-center mt-1">
            <span className="text-white/50 text-xs">
              {combate.modalidad && `${combate.modalidad} · `}Round {roundActual}/{config.max_rounds} · Juez: {selectedJuez.nombre}
            </span>
          </div>
        )}
      </div>

      {!combate ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40">No hay combates programados en esta pista</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
          {/* Timer */}
          <div className="text-center py-2">
            <div className={`text-5xl font-mono font-bold transition-colors ${timerFlash ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
              <Timer className="w-5 h-5 inline-block mr-2 opacity-50" />
              {timerDisplay}
            </div>
            <div className="flex justify-center gap-3 mt-3">
              <button onClick={() => { setTimerRunning(true); setTimerFlash(false); if (timerSeg === 0) setTimerSeg(config.duracion_round_seg); }}
                disabled={timerRunning || combate.estado !== 'en_curso'}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white text-sm font-medium flex items-center gap-1 transition-colors">
                <Play className="w-4 h-4" /> Iniciar
              </button>
              <button onClick={() => setTimerRunning(false)} disabled={!timerRunning}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-sm font-medium flex items-center gap-1 transition-colors">
                <Pause className="w-4 h-4" /> Pausa
              </button>
              <button onClick={() => { setTimerSeg(config.duracion_round_seg); setTimerRunning(false); setTimerFlash(false); }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium flex items-center gap-1 transition-colors">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* RED */}
            <div className="bg-gradient-to-b from-rose-950/50 to-rose-900/30 border border-white/10 rounded-2xl flex flex-col items-center p-3 gap-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Rojo</span>
              <p className="text-white text-sm font-medium text-center truncate w-full">{combate.alumno1_nombre}</p>
              <span className="text-5xl font-bold text-rose-400">{scores.p1}</span>
              <div className="w-full space-y-1.5 mt-2">
                {config.tipos_puntaje.map(tipo => (
                  <button key={tipo.id} onClick={() => registerPunto(combate.alumno1_id, tipo.id, tipo.valor)}
                    disabled={combate.estado !== 'en_curso'}
                    className="w-full min-h-[48px] rounded-xl text-white font-medium text-sm flex items-center justify-between px-3 disabled:opacity-30 transition-colors hover:brightness-110"
                    style={{ backgroundColor: `${tipo.color}30`, borderLeft: `3px solid ${tipo.color}` }}>
                    <span>{tipo.nombre}</span>
                    <span className="font-bold">{tipo.valor > 0 ? '+' : ''}{tipo.valor}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => undoLastPunto(combate.alumno1_id)} disabled={!log.some(l => l.alumno_id === combate.alumno1_id)}
                className="mt-1 flex items-center gap-1 text-xs text-white/40 hover:text-white/70 disabled:opacity-20 transition-colors">
                <Undo2 className="w-3 h-3" /> Deshacer
              </button>
            </div>

            {/* BLUE */}
            <div className="bg-gradient-to-b from-sky-950/50 to-sky-900/30 border border-white/10 rounded-2xl flex flex-col items-center p-3 gap-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Azul</span>
              <p className="text-white text-sm font-medium text-center truncate w-full">{combate.alumno2_nombre || 'Por definir'}</p>
              <span className="text-5xl font-bold text-sky-400">{scores.p2}</span>
              <div className="w-full space-y-1.5 mt-2">
                {config.tipos_puntaje.map(tipo => (
                  <button key={tipo.id} onClick={() => combate.alumno2_id && registerPunto(combate.alumno2_id, tipo.id, tipo.valor)}
                    disabled={combate.estado !== 'en_curso' || blueDisabled}
                    className="w-full min-h-[48px] rounded-xl text-white font-medium text-sm flex items-center justify-between px-3 disabled:opacity-30 transition-colors hover:brightness-110"
                    style={{ backgroundColor: `${tipo.color}30`, borderLeft: `3px solid ${tipo.color}` }}>
                    <span>{tipo.nombre}</span>
                    <span className="font-bold">{tipo.valor > 0 ? '+' : ''}{tipo.valor}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => combate.alumno2_id && undoLastPunto(combate.alumno2_id)}
                disabled={blueDisabled || !log.some(l => l.alumno_id === combate.alumno2_id)}
                className="mt-1 flex items-center gap-1 text-xs text-white/40 hover:text-white/70 disabled:opacity-20 transition-colors">
                <Undo2 className="w-3 h-3" /> Deshacer
              </button>
            </div>
          </div>

          {/* Score History */}
          {log.length > 0 && (
            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3 max-h-32 overflow-y-auto">
              <p className="text-xs text-white/40 font-semibold uppercase mb-2">Historial</p>
              <div className="space-y-1">
                {log.slice(0, 10).map(entry => (
                  <div key={entry.id} className="flex items-center gap-2 text-xs text-white/70">
                    <span className="text-white/30">R{entry.round}</span>
                    <span className="text-white/30">{entry.tiempo || '--:--'}</span>
                    <span className="font-medium">{entry.alumno_nombre || `#${entry.alumno_id}`}</span>
                    <span className={entry.valor > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {entry.valor > 0 ? '+' : ''}{entry.valor}
                    </span>
                    <span className="text-white/40">{entry.tipo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {combate.estado === 'pendiente' && (
              <button onClick={() => changeEstado('en_curso')}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                <Play className="w-4 h-4" /> Iniciar Combate
              </button>
            )}
            {combate.estado === 'en_curso' && roundActual < config.max_rounds && (
              <button onClick={nextRound}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1 transition-colors">
                Sig. Round
              </button>
            )}
            {combate.estado === 'en_curso' && (
              <button onClick={() => { changeEstado('finalizado'); setTimerRunning(false); }}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1 transition-colors">
                Finalizar
              </button>
            )}
            {currentIndex > 0 && (
              <button onClick={() => setCurrentIndex(i => i - 1)}
                className="py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {currentIndex < pistaCombates.length - 1 && (
              <button onClick={() => setCurrentIndex(i => i + 1)}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1 transition-colors">
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
