import { useState, useEffect, useCallback, useRef } from 'react';
import { Gift, Search, Users, Plus, Loader2, DollarSign, Check } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { Modal } from './Modal';
import { formatFecha } from './dateUtils';

interface SpaceReferidosProps {
  token: string;
}

interface Referido {
  id: number;
  bono: number;
  canjeado: boolean;
  created_at: string;
  referidor_id: number;
  referidor_nombre: string;
  codigo_referido: string;
  saldo_bonos: number;
  referido_id: number;
  referido_nombre: string;
}

interface TopReferidor {
  id: number;
  nombre_alumno: string;
  codigo_referido: string;
  saldo_bonos: number;
  total_referidos: number;
}

interface AlumnoBusqueda {
  id: number;
  nombre: string;
  dni: string;
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export function SpaceReferidos({ token }: SpaceReferidosProps) {
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [stats, setStats] = useState({ total: 0, bonoPendiente: 0, bonoCobrado: 0 });
  const [topReferidores, setTopReferidores] = useState<TopReferidor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal registrar referido
  const [modalOpen, setModalOpen] = useState(false);
  const [referidorQuery, setReferidorQuery] = useState('');
  const [referidorResults, setReferidorResults] = useState<AlumnoBusqueda[]>([]);
  const [referidorSelected, setReferidorSelected] = useState<AlumnoBusqueda | null>(null);
  const [referidoQuery, setReferidoQuery] = useState('');
  const [referidoResults, setReferidoResults] = useState<AlumnoBusqueda[]>([]);
  const [referidoSelected, setReferidoSelected] = useState<AlumnoBusqueda | null>(null);
  const [bono, setBono] = useState('60');
  const [saving, setSaving] = useState(false);

  // Modal canjear
  const [canjearModal, setCanjearModal] = useState(false);
  const [canjearQuery, setCanjearQuery] = useState('');
  const [canjearResults, setCanjearResults] = useState<AlumnoBusqueda[]>([]);
  const [canjearSelected, setCanjearSelected] = useState<{ id: number; nombre: string; saldo: number } | null>(null);
  const [canjearMonto, setCanjearMonto] = useState('');
  const [canjeando, setCanjeando] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [refRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/space/referidos`, { headers: authHeaders(token) }).then(r => r.json()),
        fetch(`${API_BASE}/space/referidos/stats`, { headers: authHeaders(token) }).then(r => r.json()),
      ]);
      if (refRes.success) setReferidos(refRes.data || []);
      if (statsRes.success) {
        setStats(statsRes.stats);
        setTopReferidores(statsRes.topReferidores || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Search helper
  const searchAlumno = (q: string, setter: (r: AlumnoBusqueda[]) => void) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setter([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/space/graduaciones/alumnos/buscar?q=${encodeURIComponent(q)}`, { headers: authHeaders(token) });
        const data = await res.json();
        setter(Array.isArray(data.data) ? data.data : []);
      } catch { setter([]); }
    }, 300);
  };

  // Register referido
  const handleRegister = async () => {
    if (!referidorSelected || !referidoSelected) {
      toast.error('Selecciona referidor y referido');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/space/referidos`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ referidor_id: referidorSelected.id, referido_id: referidoSelected.id, bono: parseFloat(bono) || 60 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Referido registrado — Bono S/${bono} acumulado`);
        setModalOpen(false);
        setReferidorSelected(null);
        setReferidoSelected(null);
        setReferidorQuery('');
        setReferidoQuery('');
        fetchAll();
      } else {
        toast.error(data.error || 'Error al registrar');
      }
    } catch { toast.error('Error de conexion'); }
    finally { setSaving(false); }
  };

  // Canjear bono
  const handleCanjear = async () => {
    if (!canjearSelected || !canjearMonto) { toast.error('Selecciona alumno y monto'); return; }
    setCanjeando(true);
    try {
      const res = await fetch(`${API_BASE}/space/referidos/canjear`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ alumno_id: canjearSelected.id, monto: parseFloat(canjearMonto) }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Descontado S/${data.descontado} — Saldo restante: S/${data.saldo_restante}`);
        setCanjearModal(false);
        setCanjearSelected(null);
        setCanjearMonto('');
        fetchAll();
      } else {
        toast.error(data.error || 'Error al canjear');
      }
    } catch { toast.error('Error de conexion'); }
    finally { setCanjeando(false); }
  };

  // Search for canjear (needs saldo)
  const searchCanjear = (q: string) => {
    setCanjearQuery(q);
    if (q.length < 2) { setCanjearResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/space/graduaciones/alumnos/buscar?q=${encodeURIComponent(q)}`, { headers: authHeaders(token) });
        const data = await res.json();
        setCanjearResults(Array.isArray(data.data) ? data.data : []);
      } catch { setCanjearResults([]); }
    }, 300);
  };

  const selectCanjear = async (a: AlumnoBusqueda) => {
    const res = await fetch(`${API_BASE}/space/referidos/por-alumno/${a.id}`, { headers: authHeaders(token) });
    const data = await res.json();
    setCanjearSelected({ id: a.id, nombre: a.nombre, saldo: parseFloat(data.alumno?.saldo_bonos) || 0 });
    setCanjearQuery(a.nombre);
    setCanjearResults([]);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-stone-900 text-xl font-bold">Referidos</h1>
          <p className="text-stone-400 text-xs mt-1">Programa de recomendaciones — S/60 por referido inscrito</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCanjearModal(true)} className={cx.btnSecondary + ' flex items-center gap-2'}>
            <DollarSign size={16} /> Canjear bono
          </button>
          <button onClick={() => setModalOpen(true)} className={cx.btnPrimary + ' flex items-center gap-2'}>
            <Plus size={16} /> Registrar referido
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className={cx.card + ' p-4'}>
          <p className="text-stone-400 text-xs">Total referidos</p>
          <p className="text-stone-900 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className={cx.card + ' p-4'}>
          <p className="text-stone-400 text-xs">Bonos por cobrar</p>
          <p className="text-amber-600 text-2xl font-bold">S/ {stats.bonoPendiente}</p>
        </div>
        <div className={cx.card + ' p-4'}>
          <p className="text-stone-400 text-xs">Bonos cobrados</p>
          <p className="text-emerald-600 text-2xl font-bold">S/ {stats.bonoCobrado}</p>
        </div>
      </div>

      {/* Top referidores */}
      {topReferidores.length > 0 && (
        <div className={cx.card + ' p-4'}>
          <h3 className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-3">Top Referidores</h3>
          <div className="space-y-2">
            {topReferidores.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <Gift size={14} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-stone-900 text-sm font-medium">{r.nombre_alumno}</p>
                    <p className="text-stone-400 text-xs">{r.codigo_referido} — {r.total_referidos} referido{Number(r.total_referidos) !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <span className="text-emerald-600 text-sm font-bold">S/ {r.saldo_bonos}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de referidos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
        </div>
      ) : referidos.length === 0 ? (
        <div className={cx.card + ' py-16 text-center'}>
          <Users size={40} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500 mb-1">Sin referidos registrados</p>
          <p className="text-stone-400 text-sm">Cuando un alumno refiera a otro, registralo aqui</p>
        </div>
      ) : (
        <div className={cx.card + ' overflow-hidden'}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className={cx.th}>Referidor</th>
                <th className={cx.th}>Referido</th>
                <th className={cx.th + ' hidden sm:table-cell'}>Bono</th>
                <th className={cx.th + ' hidden sm:table-cell'}>Estado</th>
                <th className={cx.th + ' hidden md:table-cell'}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {referidos.map(r => (
                <tr key={r.id} className={cx.tr}>
                  <td className={cx.td + ' text-stone-900 font-medium'}>
                    <div>{r.referidor_nombre}</div>
                    <span className="text-stone-400 text-[10px]">{r.codigo_referido}</span>
                  </td>
                  <td className={cx.td + ' text-stone-600'}>{r.referido_nombre}</td>
                  <td className={cx.td + ' hidden sm:table-cell text-stone-600'}>S/ {r.bono}</td>
                  <td className={cx.td + ' hidden sm:table-cell'}>
                    <span className={cx.badge(r.canjeado ? badgeColors.green : badgeColors.yellow)}>
                      {r.canjeado ? 'Cobrado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className={cx.td + ' hidden md:table-cell text-stone-500'}>{formatFecha(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Registrar Referido */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar referido" size="lg"
        footer={<>
          <button onClick={() => setModalOpen(false)} className={cx.btnSecondary}>Cancelar</button>
          <button onClick={handleRegister} disabled={saving || !referidorSelected || !referidoSelected} className={cx.btnPrimary + ' flex items-center gap-2'}>
            {saving && <Loader2 size={15} className="animate-spin" />} Registrar
          </button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Quien refirio (padre/alumno que recomendo)</label>
            <input type="text" value={referidorQuery} onChange={e => { setReferidorQuery(e.target.value); searchAlumno(e.target.value, setReferidorResults); }} className={cx.input} placeholder="Buscar alumno referidor..." />
            {referidorResults.length > 0 && !referidorSelected && (
              <div className="mt-1 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-lg max-h-40 overflow-y-auto">
                {referidorResults.map(a => (
                  <button key={a.id} onClick={() => { setReferidorSelected(a); setReferidorQuery(a.nombre); setReferidorResults([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-0">
                    {a.nombre} <span className="text-stone-400 text-xs">— {a.dni}</span>
                  </button>
                ))}
              </div>
            )}
            {referidorSelected && <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1"><Check size={12} /> {referidorSelected.nombre}</p>}
          </div>

          <div>
            <label className={cx.label}>Quien fue referido (alumno nuevo que se inscribio)</label>
            <input type="text" value={referidoQuery} onChange={e => { setReferidoQuery(e.target.value); searchAlumno(e.target.value, setReferidoResults); }} className={cx.input} placeholder="Buscar alumno referido..." />
            {referidoResults.length > 0 && !referidoSelected && (
              <div className="mt-1 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-lg max-h-40 overflow-y-auto">
                {referidoResults.map(a => (
                  <button key={a.id} onClick={() => { setReferidoSelected(a); setReferidoQuery(a.nombre); setReferidoResults([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-0">
                    {a.nombre} <span className="text-stone-400 text-xs">— {a.dni}</span>
                  </button>
                ))}
              </div>
            )}
            {referidoSelected && <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1"><Check size={12} /> {referidoSelected.nombre}</p>}
          </div>

          <div>
            <label className={cx.label}>Bono (S/)</label>
            <input type="number" value={bono} onChange={e => setBono(e.target.value)} className={cx.input} min={0} step="10" />
          </div>
        </div>
      </Modal>

      {/* Modal Canjear Bono */}
      <Modal open={canjearModal} onClose={() => setCanjearModal(false)} title="Canjear bono de referido"
        footer={<>
          <button onClick={() => setCanjearModal(false)} className={cx.btnSecondary}>Cancelar</button>
          <button onClick={handleCanjear} disabled={canjeando || !canjearSelected || !canjearMonto} className={cx.btnPrimary + ' flex items-center gap-2'}>
            {canjeando && <Loader2 size={15} className="animate-spin" />} Descontar
          </button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Alumno (quien tiene el bono acumulado)</label>
            <input type="text" value={canjearQuery} onChange={e => searchCanjear(e.target.value)} className={cx.input} placeholder="Buscar alumno..." />
            {canjearResults.length > 0 && !canjearSelected && (
              <div className="mt-1 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-lg max-h-40 overflow-y-auto">
                {canjearResults.map(a => (
                  <button key={a.id} onClick={() => selectCanjear(a)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-0">
                    {a.nombre} <span className="text-stone-400 text-xs">— {a.dni}</span>
                  </button>
                ))}
              </div>
            )}
            {canjearSelected && (
              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-emerald-700 text-sm font-medium">{canjearSelected.nombre}</p>
                <p className="text-emerald-600 text-xs">Saldo disponible: <strong>S/ {canjearSelected.saldo}</strong></p>
              </div>
            )}
          </div>

          <div>
            <label className={cx.label}>Monto a descontar (S/)</label>
            <input type="number" value={canjearMonto} onChange={e => setCanjearMonto(e.target.value)} className={cx.input}
              min={0} max={canjearSelected?.saldo || 0} step="10" placeholder="Ej: 60" />
            {canjearSelected && parseFloat(canjearMonto) > canjearSelected.saldo && (
              <p className="text-red-500 text-xs mt-1">El monto excede el saldo disponible</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
