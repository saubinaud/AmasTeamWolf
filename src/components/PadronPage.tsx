import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Trophy, User, ShieldCheck, Lock, Medal, Users2, Sparkles, X, Plus, Send, Check } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../config/api';

// --- Opciones del formulario de inscripción (fieles al Google Form original) ---
const DUENOS_ESCUELA = [
  'Profesor K. Oganes', 'Profesor A. Vasquez', 'Master Candidata R. Moretti',
  'Profesor J. Neyra', 'Master Candidato M. Cabral', 'Profesora J. Won',
];
const CATEGORIAS = [
  'Baby - Little', 'Junior Sámurai (7 - 12 años)', 'Adolescentes (13 - 17 años)', 'Warrior (18+ Adultos)',
];
const RANGOS = [
  'BLANCO', 'NARANJA', 'AMARILLO', 'CAMUFLADO', 'VERDE', 'VIOLETA', 'AZUL', 'MARRÓN',
  'ROJO', 'ROJO/NEGRO', 'I DAN', 'II DAN', 'III DAN', '4to DAN', '5to DAN',
];
const MODALIDADES_FORM: { grupo: string; titulo: string; opciones: string[] }[] = [
  { grupo: 'tradicional', titulo: 'Competencia Tradicional', opciones: ['Defensa Personal', 'Técnicas Form', 'Rompimiento Madera', 'Form', 'Form Weapon', 'Combat Sword', 'Combat Weapons Simple', 'Doble Combat Weapons', 'Sparring'] },
  { grupo: 'team', titulo: 'Team Fighters', opciones: ['Team Combat Weapon', 'Team Doble Combat Weapon', 'Team sparring'] },
  { grupo: 'especial', titulo: 'Especial', opciones: ['Formula Acrobática', 'Formula Acrobática Armas', 'Estilo Libre Acrobatico', 'Estilo Libre Acrobatico Armas'] },
];

interface Modalidad { modalidad: string; grupo: string | null }
interface Competidor {
  id: number;
  nombre_completo: string;
  dni: string | null;
  edad: number | null;
  genero: string | null;
  categoria: string | null;
  rango: string | null;
  academia: string | null;
  dueno_escuela: string | null;
  es_amas: boolean;
  es_juez: boolean;
  torneo_id: number;
  torneo_nombre: string;
  modalidades: Modalidad[];
}
interface Torneo { id: number; nombre: string; total_competidores: number }
interface Config { requiere_clave: boolean; titulo: string; mensaje: string | null }

interface PadronPageProps { onNavigate?: (page: string) => void }

const NARANJA = '#FA7B21';

// Etiqueta + color por grupo de modalidad
const GRUPOS: Record<string, { label: string; icon: typeof Medal; color: string }> = {
  tradicional: { label: 'Tradicional', icon: Medal, color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  team: { label: 'Team Fighters', icon: Users2, color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  especial: { label: 'Especial', icon: Sparkles, color: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' },
  modalidad: { label: 'Modalidades', icon: Medal, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
};

function agrupar(mods: Modalidad[]): [string, Modalidad[]][] {
  const orden = ['tradicional', 'team', 'especial', 'modalidad'];
  const map = new Map<string, Modalidad[]>();
  for (const m of mods) {
    const g = m.grupo || 'modalidad';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(m);
  }
  return [...map.entries()].sort((a, b) => orden.indexOf(a[0]) - orden.indexOf(b[0]));
}

export function PadronPage(_props: PadronPageProps) {
  const [config, setConfig] = useState<Config | null>(null);
  const [acceso, setAcceso] = useState(false);
  const [claveInput, setClaveInput] = useState('');
  const [validando, setValidando] = useState(false);

  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [torneoId, setTorneoId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<Competidor[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carga config inicial
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/padron/config`);
        const json = await res.json();
        if (json.success) {
          setConfig(json.data);
          if (!json.data.requiere_clave) setAcceso(true);
        } else {
          setConfig({ requiere_clave: false, titulo: 'Consulta de competidores', mensaje: null });
          setAcceso(true);
        }
      } catch {
        setConfig({ requiere_clave: false, titulo: 'Consulta de competidores', mensaje: null });
        setAcceso(true);
      }
    })();
  }, []);

  // Carga torneos una vez con acceso
  useEffect(() => {
    if (!acceso) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/padron/torneos`);
        const json = await res.json();
        if (json.success) setTorneos(json.data);
      } catch { /* silencioso */ }
    })();
  }, [acceso]);

  const validarClave = useCallback(async () => {
    if (!claveInput.trim()) return;
    setValidando(true);
    try {
      const res = await fetch(`${API_BASE}/padron/acceso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: claveInput.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data.acceso) {
        setAcceso(true);
      } else {
        toast.error('Clave incorrecta');
      }
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setValidando(false);
    }
  }, [claveInput]);

  const buscar = useCallback(async (texto: string, torneo: number | null) => {
    if (texto.trim().length < 2) {
      setResultados([]);
      setBuscado(false);
      return;
    }
    setBuscando(true);
    try {
      const params = new URLSearchParams({ q: texto.trim() });
      if (torneo) params.set('torneo_id', String(torneo));
      const res = await fetch(`${API_BASE}/padron/buscar?${params.toString()}`);
      const json = await res.json();
      if (json.success) setResultados(json.data);
      else toast.error(json.error || 'No se pudo buscar');
      setBuscado(true);
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setBuscando(false);
    }
  }, []);

  // Búsqueda con debounce al escribir
  useEffect(() => {
    if (!acceso) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => buscar(q, torneoId), 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [q, torneoId, acceso, buscar]);

  // ---- Pantalla de clave ----
  if (config && config.requiere_clave && !acceso) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
            <Lock className="h-7 w-7" style={{ color: NARANJA }} />
          </div>
          <h1 className="text-xl font-bold">{config.titulo}</h1>
          <p className="mt-2 text-sm text-zinc-400">Acceso restringido a jueces y planilleros. Ingresa la clave.</p>
          <input
            type="password"
            value={claveInput}
            onChange={(e) => setClaveInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && validarClave()}
            placeholder="Clave de acceso"
            className="mt-6 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center text-white outline-none focus:border-zinc-600"
            autoFocus
          />
          <button
            onClick={validarClave}
            disabled={validando || !claveInput.trim()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-black transition disabled:opacity-50"
            style={{ backgroundColor: NARANJA }}
          >
            {validando ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Ingresar'}
          </button>
        </div>
      </div>
    );
  }

  // ---- Portal de consulta ----
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Encabezado */}
      <div className="border-b border-zinc-900 bg-gradient-to-b from-zinc-900/60 to-transparent">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Trophy className="h-6 w-6" style={{ color: NARANJA }} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{config?.titulo || 'Consulta de competidores'}</h1>
              <p className="text-xs text-zinc-500">Padrón de torneos · AMAS Team Wolf</p>
            </div>
          </div>
          {config?.mensaje && <p className="mt-3 text-sm text-zinc-400">{config.mensaje}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Filtro por torneo */}
        {torneos.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setTorneoId(null)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                torneoId === null ? 'border-transparent text-black' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
              style={torneoId === null ? { backgroundColor: NARANJA } : undefined}
            >
              Todos
            </button>
            {torneos.map((t) => (
              <button
                key={t.id}
                onClick={() => setTorneoId(t.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  torneoId === t.id ? 'border-transparent text-black' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
                style={torneoId === t.id ? { backgroundColor: NARANJA } : undefined}
              >
                {t.nombre} <span className="opacity-60">({t.total_competidores})</span>
              </button>
            ))}
          </div>
        )}

        {/* Buscador */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o DNI…"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-4 pl-12 pr-11 text-white outline-none focus:border-zinc-600"
            autoFocus
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Resultados */}
        <div className="mt-5 space-y-3">
          {buscando && (
            <div className="flex items-center justify-center py-10 text-zinc-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Buscando…
            </div>
          )}

          {!buscando && q.trim().length < 2 && (
            <p className="py-10 text-center text-sm text-zinc-600">Escribe al menos 2 letras del nombre o el DNI.</p>
          )}

          {!buscando && buscado && resultados.length === 0 && q.trim().length >= 2 && (
            <p className="py-10 text-center text-sm text-zinc-500">Sin resultados para «{q.trim()}».</p>
          )}

          {!buscando && resultados.map((c) => (
            <CompetidorCard key={c.id} c={c} />
          ))}
        </div>
      </div>

      {/* Botón flotante: inscribir nuevo competidor */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full text-black shadow-lg shadow-black/40 transition active:scale-95 sm:h-16 sm:w-16"
        style={{ backgroundColor: NARANJA }}
        aria-label="Inscribir nuevo competidor"
        title="Inscribir nuevo competidor"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {showForm && (
        <InscribirModal
          torneos={torneos}
          torneoPreseleccionado={torneoId}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            if (q.trim().length >= 2) buscar(q, torneoId);
          }}
        />
      )}
    </div>
  );
}

function InscribirModal({ torneos, torneoPreseleccionado, onClose, onSuccess }: {
  torneos: Torneo[];
  torneoPreseleccionado: number | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [torneoId, setTorneoId] = useState<number | ''>(torneoPreseleccionado ?? (torneos.length === 1 ? torneos[0].id : ''));
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState<'M' | 'F' | ''>('');
  const [esJuez, setEsJuez] = useState<boolean | null>(null);
  const [categoria, setCategoria] = useState('');
  const [rango, setRango] = useState('');
  const [duenoEscuela, setDuenoEscuela] = useState('');
  const [duenoOtro, setDuenoOtro] = useState('');
  const [mods, setMods] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);

  const toggleMod = (grupo: string, opcion: string) => {
    const key = `${grupo}::${opcion}`;
    setMods((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const enviar = useCallback(async () => {
    // Validación en cliente (igual que campos obligatorios del form)
    if (!torneoId) return toast.error('Selecciona un torneo');
    if (nombre.trim().length < 3) return toast.error('Ingresa nombres y apellidos');
    if (!genero) return toast.error('Selecciona el género');
    if (esJuez === null) return toast.error('Indica si es juez');
    if (!categoria) return toast.error('Selecciona la categoría');
    if (!rango) return toast.error('Selecciona el rango');
    const dueno = duenoEscuela === '__otro__' ? duenoOtro.trim() : duenoEscuela;
    if (!dueno) return toast.error('Indica el dueño de escuela');

    const modalidades = Object.entries(mods)
      .filter(([, v]) => v)
      .map(([k]) => { const [grupo, modalidad] = k.split('::'); return { grupo, modalidad }; });
    if (modalidades.length === 0) return toast.error('Selecciona al menos una modalidad');

    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/padron/inscribir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torneo_id: torneoId, nombre_completo: nombre.trim(), edad: edad.trim(),
          genero, es_juez: esJuez, categoria, rango,
          dueno_escuela: duenoEscuela === '__otro__' ? dueno : duenoEscuela,
          academia: duenoEscuela === '__otro__' ? dueno : '',
          modalidades,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`¡${json.data.nombre_completo} inscrito!`);
        onSuccess();
      } else {
        toast.error(json.error || 'No se pudo inscribir');
      }
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }, [torneoId, nombre, edad, genero, esJuez, categoria, rango, duenoEscuela, duenoOtro, mods, onSuccess]);

  const selectCls = 'w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-600';
  const inputCls = 'w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-600';
  const labelCls = 'mb-1.5 block text-sm font-semibold text-white';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-950 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: NARANJA }}>
              <Plus className="h-5 w-5 text-black" strokeWidth={2.5} />
            </div>
            <h2 className="font-bold text-white">Inscribir competidor</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Torneo */}
          <div>
            <label className={labelCls}>Torneo <span style={{ color: NARANJA }}>*</span></label>
            <select className={selectCls} value={torneoId} onChange={(e) => setTorneoId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Elegir…</option>
              {torneos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>

          {/* Dueño de escuela */}
          <div>
            <label className={labelCls}>Dueño de Escuela <span style={{ color: NARANJA }}>*</span></label>
            <select className={selectCls} value={duenoEscuela} onChange={(e) => setDuenoEscuela(e.target.value)}>
              <option value="">Elegir…</option>
              {DUENOS_ESCUELA.map((d) => <option key={d} value={d}>{d}</option>)}
              <option value="__otro__">Otra escuela / academia…</option>
            </select>
            {duenoEscuela === '__otro__' && (
              <input className={`${inputCls} mt-2`} value={duenoOtro} onChange={(e) => setDuenoOtro(e.target.value)} placeholder="Nombre de la escuela / academia" />
            )}
          </div>

          {/* Nombres */}
          <div>
            <label className={labelCls}>Nombres y apellidos <span style={{ color: NARANJA }}>*</span></label>
            <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Juan Pérez García" />
          </div>

          {/* Edad + Género */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Edad</label>
              <input className={inputCls} value={edad} onChange={(e) => setEdad(e.target.value)} inputMode="numeric" placeholder="Ej. 12" />
            </div>
            <div>
              <label className={labelCls}>Género <span style={{ color: NARANJA }}>*</span></label>
              <div className="flex gap-2">
                {(['M', 'F'] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setGenero(g)}
                    className={`flex-1 rounded-xl border py-3 text-sm font-medium transition ${genero === g ? 'border-transparent text-black' : 'border-zinc-800 text-zinc-400'}`}
                    style={genero === g ? { backgroundColor: NARANJA } : undefined}>{g}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Juez */}
          <div>
            <label className={labelCls}>¿Es juez? <span style={{ color: NARANJA }}>*</span></label>
            <div className="flex gap-2">
              {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map((o) => (
                <button key={o.l} type="button" onClick={() => setEsJuez(o.v)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-medium transition ${esJuez === o.v ? 'border-transparent text-black' : 'border-zinc-800 text-zinc-400'}`}
                  style={esJuez === o.v ? { backgroundColor: NARANJA } : undefined}>{o.l}</button>
              ))}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className={labelCls}>Categoría <span style={{ color: NARANJA }}>*</span></label>
            <select className={selectCls} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Elegir…</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Rango */}
          <div>
            <label className={labelCls}>Rango <span style={{ color: NARANJA }}>*</span></label>
            <select className={selectCls} value={rango} onChange={(e) => setRango(e.target.value)}>
              <option value="">Elegir…</option>
              {RANGOS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Modalidades por grupo */}
          {MODALIDADES_FORM.map(({ grupo, titulo, opciones }) => (
            <div key={grupo}>
              <label className={labelCls}>{titulo}{grupo === 'tradicional' && <span style={{ color: NARANJA }}> *</span>}</label>
              <div className="space-y-1.5">
                {opciones.map((op) => {
                  const key = `${grupo}::${op}`;
                  const on = !!mods[key];
                  return (
                    <button key={op} type="button" onClick={() => toggleMod(grupo, op)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${on ? 'border-orange-500/40 bg-orange-500/10 text-white' : 'border-zinc-800 text-zinc-300'}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-transparent' : 'border-zinc-600'}`} style={on ? { backgroundColor: NARANJA } : undefined}>
                        {on && <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />}
                      </span>
                      {op}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-zinc-900 bg-zinc-950/95 p-4 backdrop-blur">
          <button onClick={enviar} disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-black transition active:scale-[0.99] disabled:opacity-50"
            style={{ backgroundColor: NARANJA }}>
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4.5 w-4.5" /> Inscribir competidor</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompetidorCard({ c }: { c: Competidor }) {
  const grupos = agrupar(c.modalidades);
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
            <User className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{c.nombre_completo}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {c.academia || c.dueno_escuela || 'Sin academia'} · {c.torneo_nombre}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {c.es_amas && (
            <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-300">AMAS</span>
          )}
          {c.es_juez && (
            <span className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
              <ShieldCheck className="h-3 w-3" /> Juez
            </span>
          )}
        </div>
      </div>

      {/* Datos */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
        {c.rango && <span><span className="text-zinc-600">Rango:</span> {c.rango}</span>}
        {c.categoria && <span><span className="text-zinc-600">Categoría:</span> {c.categoria}</span>}
        {c.edad != null && <span><span className="text-zinc-600">Edad:</span> {c.edad}</span>}
        {c.genero && <span><span className="text-zinc-600">Género:</span> {c.genero}</span>}
        {c.dni && <span><span className="text-zinc-600">DNI:</span> {c.dni}</span>}
      </div>

      {/* Modalidades agrupadas */}
      {grupos.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          {grupos.map(([g, mods]) => {
            const meta = GRUPOS[g] || GRUPOS.modalidad;
            const Icon = meta.icon;
            return (
              <div key={g}>
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  <Icon className="h-3.5 w-3.5" /> {meta.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mods.map((m, i) => (
                    <span key={i} className={`rounded-lg border px-2 py-1 text-xs ${meta.color}`}>{m.modalidad}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
