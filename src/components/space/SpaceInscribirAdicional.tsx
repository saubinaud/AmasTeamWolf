import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2, CheckCircle2, ArrowRight, X, Search, User, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx } from './tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  token: string;
  onGoToInscritos?: () => void;
}

type ProgramaAdicional = 'leadership' | 'fighters';
type EstadoPago = 'Pendiente' | 'Parcial' | 'Pagado';
type MetodoPago = 'efectivo' | 'yape' | 'transferencia' | 'tarjeta' | 'otro';

interface AlumnoBusqueda {
  id: number;
  nombre_alumno?: string;
  nombre?: string;
  dni_alumno?: string;
  dni?: string;
  fecha_nacimiento?: string;
  nombre_apoderado?: string;
  dni_apoderado?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROGRAMAS: Record<ProgramaAdicional, { label: string; precio: number; descripcion: string }> = {
  leadership: { label: 'Leadership Wolf', precio: 1299, descripcion: 'Programa de liderazgo con armas y implementos' },
  fighters: { label: 'Fighters Wolf', precio: 999, descripcion: 'Programa de combate con implementos' },
};

const IMPLEMENTOS = [
  { key: 'guantes', emoji: '🥊', label: 'Guantes', precio: 250, categoria: 'protector' },
  { key: 'zapatos', emoji: '👟', label: 'Zapatos', precio: 250, categoria: 'protector' },
  { key: 'bostaff', emoji: '⚔️', label: 'Bo Staff', precio: 180, categoria: 'arma' },
  { key: 'combat', emoji: '⚔️', label: 'Combat Weapon', precio: 220, categoria: 'arma' },
  { key: 'nunchaku', emoji: '⚔️', label: 'Nunchaku', precio: 350, categoria: 'arma' },
  { key: 'parche', emoji: '🏅', label: 'Parche', precio: 15, categoria: 'accesorio' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceInscribirAdicional({ token, onGoToInscritos }: Props) {
  // Program
  const [programa, setPrograma] = useState<ProgramaAdicional>('leadership');

  // Student search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlumnoBusqueda[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Form
  const [alumnoId, setAlumnoId] = useState<number | null>(null);
  const [nombreAlumno, setNombreAlumno] = useState('');
  const [dniAlumno, setDniAlumno] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [nombrePadre, setNombrePadre] = useState('');
  const [dniPadre, setDniPadre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');

  // Implementos ya tiene
  const [yaTeiene, setYaTiene] = useState<Set<string>>(new Set());

  // Admin
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('Pendiente');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [montoParcial, setMontoParcial] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [descuentoManual, setDescuentoManual] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ nombre: string; programa: string; total: number } | null>(null);

  // -----------------------------------------------------------------------
  // Search
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setShowResults(false); return; }
    if (alumnoId && nombreAlumno === searchQuery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${API_BASE}/space/alumnos?search=${encodeURIComponent(searchQuery)}&limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        setSearchResults(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
        setShowResults(true);
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, token, alumnoId, nombreAlumno]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSelectAlumno = useCallback((a: AlumnoBusqueda) => {
    const nombre = a.nombre_alumno ?? a.nombre ?? '';
    setAlumnoId(a.id);
    setNombreAlumno(nombre);
    setDniAlumno(a.dni_alumno ?? a.dni ?? '');
    setFechaNacimiento(a.fecha_nacimiento ? a.fecha_nacimiento.slice(0, 10) : '');
    setNombrePadre(a.nombre_apoderado ?? '');
    setDniPadre(a.dni_apoderado ?? '');
    setTelefono(a.telefono ?? '');
    setCorreo(a.correo ?? '');
    setSearchQuery(nombre);
    setShowResults(false);
  }, []);

  // -----------------------------------------------------------------------
  // Pricing
  // -----------------------------------------------------------------------

  const precioBase = PROGRAMAS[programa].precio;
  const descuentoImpl = useMemo(() => {
    return IMPLEMENTOS.filter(i => yaTeiene.has(i.key)).reduce((sum, i) => sum + i.precio, 0);
  }, [yaTeiene]);
  const descManual = Number(descuentoManual) || 0;
  const total = Math.max(0, precioBase - descuentoImpl - descManual);

  const implementosADar = useMemo(() => {
    return IMPLEMENTOS.filter(i => !yaTeiene.has(i.key));
  }, [yaTeiene]);

  // -----------------------------------------------------------------------
  // Toggle implemento
  // -----------------------------------------------------------------------

  const toggleImpl = useCallback((key: string) => {
    setYaTiene(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  const resetAll = useCallback(() => {
    setAlumnoId(null);
    setNombreAlumno('');
    setDniAlumno('');
    setFechaNacimiento('');
    setNombrePadre('');
    setDniPadre('');
    setTelefono('');
    setCorreo('');
    setSearchQuery('');
    setYaTiene(new Set());
    setEstadoPago('Pendiente');
    setMetodoPago('efectivo');
    setMontoParcial('');
    setObservaciones('');
    setDescuentoManual('');
  }, []);

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!nombreAlumno || !correo) {
      toast.error('Nombre del alumno y correo son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        programa: PROGRAMAS[programa].label,
        clasesTotales: 0,
        nombreAlumno,
        dniAlumno,
        tipoDocumento: 'DNI',
        fechaNacimiento,
        categoriaAlumno: programa === 'leadership' ? 'Leadership' : 'Fighters',
        turnoSeleccionado: null,
        horariosDisponibles: null,
        tallaUniforme: 'No aplica',
        tallasPolos: [],
        nombrePadre,
        tipoDocumentoPadre: 'DNI',
        dniPadre,
        telefono,
        direccion: '',
        email: correo,
        polos: 'No',
        precioPolos: 0,
        uniformeAdicional: 'No',
        precioUniforme: 0,
        fechaInicio: new Date().toISOString().slice(0, 10),
        diasTentativos: 'No aplica',
        fechaFin: null,
        semanasAproximadas: 0,
        codigoPromocional: 'No aplicado',
        tipoDescuento: 'ninguno',
        descuentoDinero: descuentoImpl + descManual,
        descuentoPorcentaje: 0,
        descuentoPorcentualMonto: 0,
        precioPrograma: precioBase,
        subtotal: total,
        total,
        contratoFirmado: null,
        fechaRegistro: new Date().toISOString(),
        origen: 'space',
        frecuenciaSemanal: 0,
        estadoPago,
        metodoPago: estadoPago !== 'Pendiente' ? metodoPago : null,
        montoParcial: estadoPago === 'Parcial' ? Number(montoParcial) || 0 : undefined,
        tipoCliente: 'Nuevo/Primer registro',
        observaciones: observaciones.trim() || null,
        skipContrato: true,
        skipEmail: true,
        // Leadership-specific
        implementosYaTiene: Array.from(yaTeiene),
        implementosADar: implementosADar.map(i => ({ tipo: i.label, categoria: i.categoria, precio: i.precio })),
      };

      const res = await fetch(`${API_BASE}/matricula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success(`${PROGRAMAS[programa].label} registrado`);
      setLastCreated({ nombre: nombreAlumno, programa: PROGRAMAS[programa].label, total });
      resetAll();
    } catch {
      toast.error('Error al registrar');
    } finally {
      setIsSubmitting(false);
    }
  }, [programa, nombreAlumno, dniAlumno, fechaNacimiento, nombrePadre, dniPadre, telefono, correo, precioBase, descuentoImpl, descManual, total, yaTeiene, implementosADar, estadoPago, metodoPago, montoParcial, observaciones, resetAll]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Success */}
      {lastCreated && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="text-emerald-700 text-sm font-semibold">{lastCreated.programa}: {lastCreated.nombre}</p>
            <p className="text-emerald-600 text-xs">Total S/ {lastCreated.total}</p>
          </div>
          {onGoToInscritos && (
            <button onClick={onGoToInscritos} className="flex items-center gap-1 text-emerald-600 text-xs font-medium hover:text-emerald-700">
              Ver inscritos <ArrowRight size={12} />
            </button>
          )}
          <button onClick={() => setLastCreated(null)} className={cx.btnIcon}><X size={14} /></button>
        </div>
      )}

      {/* 1. Programa */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-stone-900 text-sm font-semibold mb-3">1. Programa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['leadership', 'fighters'] as ProgramaAdicional[]).map(k => {
            const p = PROGRAMAS[k];
            const active = programa === k;
            return (
              <button
                key={k}
                onClick={() => setPrograma(k)}
                className={active
                  ? 'p-4 rounded-xl border-2 border-[var(--accent)] bg-orange-50 text-left'
                  : 'p-4 rounded-xl border-2 border-stone-200 bg-white hover:border-orange-200 text-left transition-colors'
                }
              >
                <div className={active ? 'text-[var(--accent)] text-sm font-semibold' : 'text-stone-900 text-sm font-semibold'}>
                  {p.label}
                </div>
                <div className="text-stone-400 text-xs mt-0.5">{p.descripcion}</div>
                <div className={`text-lg font-bold mt-2 ${active ? 'text-[var(--accent)]' : 'text-stone-900'}`}>
                  S/ {p.precio}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Buscar alumno */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-stone-900 text-sm font-semibold mb-4">2. Alumno</h3>
        <div className="relative" ref={resultsRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (!e.target.value) { setAlumnoId(null); setNombreAlumno(''); }
            }}
            placeholder="Buscar alumno existente o llenar manualmente..."
            className={cx.input + ' pl-9'}
          />
          {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" />}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl max-h-48 overflow-y-auto shadow-lg">
              {searchResults.map(a => (
                <button key={a.id} onClick={() => handleSelectAlumno(a)}
                  className="w-full text-left px-3.5 py-2.5 text-sm text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-2">
                  <User size={14} className="text-stone-400 shrink-0" />
                  <span>{a.nombre_alumno ?? a.nombre}</span>
                  {(a.dni_alumno ?? a.dni) && <span className="text-stone-400 text-xs ml-auto">{a.dni_alumno ?? a.dni}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={cx.label}>Nombre alumno *</label>
            <input type="text" value={nombreAlumno} onChange={e => setNombreAlumno(e.target.value)} className={cx.input} />
          </div>
          <div>
            <label className={cx.label}>DNI alumno</label>
            <input type="text" value={dniAlumno} onChange={e => setDniAlumno(e.target.value)} className={cx.input} />
          </div>
          <div>
            <label className={cx.label}>Nombre apoderado</label>
            <input type="text" value={nombrePadre} onChange={e => setNombrePadre(e.target.value)} className={cx.input} />
          </div>
          <div>
            <label className={cx.label}>Correo *</label>
            <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} className={cx.input} />
          </div>
          <div>
            <label className={cx.label}>Teléfono</label>
            <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className={cx.input} />
          </div>
          <div>
            <label className={cx.label}>Fecha nacimiento</label>
            <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} className={cx.input} />
          </div>
        </div>
      </section>

      {/* 3. Implementos que ya tiene */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-stone-900 text-sm font-semibold mb-1">3. Implementos que ya tiene</h3>
        <p className="text-stone-400 text-xs mb-4">Marca los que el alumno ya posee. Se descontarán del precio.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {IMPLEMENTOS.map(impl => {
            const owned = yaTeiene.has(impl.key);
            return (
              <button
                key={impl.key}
                onClick={() => toggleImpl(impl.key)}
                className={owned
                  ? 'flex items-center gap-2 p-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 text-left transition-colors'
                  : 'flex items-center gap-2 p-3 rounded-xl border-2 border-stone-200 bg-white hover:border-stone-300 text-left transition-colors'
                }
              >
                <span className="text-lg">{impl.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${owned ? 'text-emerald-700' : 'text-stone-700'}`}>{impl.label}</p>
                  <p className={`text-[10px] ${owned ? 'text-emerald-500' : 'text-stone-400'}`}>S/ {impl.precio}</p>
                </div>
                {owned && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Implementos a entregar */}
      {implementosADar.length > 0 && (
        <section className={cx.card + ' p-5'}>
          <h3 className="text-stone-900 text-sm font-semibold mb-3">4. Implementos a entregar</h3>
          <div className="flex flex-wrap gap-2">
            {implementosADar.map(impl => (
              <div key={impl.key} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200">
                <span>{impl.emoji}</span>
                <span className="text-stone-700 text-xs font-medium">{impl.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Resumen */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-stone-900 text-sm font-semibold mb-4">5. Resumen</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-stone-500">
            <span>{PROGRAMAS[programa].label}</span>
            <span className="text-stone-900">S/ {precioBase}</span>
          </div>
          {descuentoImpl > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Descuento implementos ({yaTeiene.size})</span>
              <span>- S/ {descuentoImpl}</span>
            </div>
          )}
          {descManual > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Descuento manual</span>
              <span>- S/ {descManual}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-stone-200">
            <span className="text-stone-900 font-bold text-base">TOTAL</span>
            <span className="text-[var(--accent)] text-2xl font-bold">S/ {total}</span>
          </div>
        </div>
      </section>

      {/* Admin overrides */}
      <section className={cx.card + ' overflow-hidden'}>
        <button onClick={() => setAdminOpen(!adminOpen)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <Shield size={14} className="text-[var(--accent)]" />
            </div>
            <div className="text-left">
              <h3 className="text-stone-900 text-sm font-semibold">Ajustes de administrador</h3>
              <p className="text-stone-400 text-xs">Estado de pago, descuento manual, observaciones</p>
            </div>
          </div>
          {adminOpen ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
        </button>

        {adminOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-stone-200">
            <div className="pt-4">
              <label className={cx.label}>Estado de pago</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Pendiente', 'Parcial', 'Pagado'] as EstadoPago[]).map(ep => (
                  <button key={ep} onClick={() => setEstadoPago(ep)}
                    className={estadoPago === ep
                      ? 'px-3 py-2.5 rounded-xl border-2 border-[var(--accent)] bg-orange-50 text-[var(--accent)] text-xs font-semibold'
                      : 'px-3 py-2.5 rounded-xl border-2 border-stone-200 bg-white text-stone-500 text-xs font-semibold hover:border-orange-200 transition-colors'
                    }
                  >{ep}</button>
                ))}
              </div>
            </div>

            {(estadoPago === 'Pagado' || estadoPago === 'Parcial') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cx.label}>Método de pago</label>
                  <select value={metodoPago} onChange={e => setMetodoPago(e.target.value as MetodoPago)} className={cx.select}>
                    <option value="efectivo">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                {estadoPago === 'Parcial' && (
                  <div>
                    <label className={cx.label}>Monto parcial</label>
                    <input type="number" min="0" value={montoParcial} onChange={e => setMontoParcial(e.target.value)} placeholder="S/ 0" className={cx.input} />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className={cx.label}>Descuento manual S/</label>
              <input type="number" min="0" value={descuentoManual} onChange={e => setDescuentoManual(e.target.value)} placeholder="0" className={cx.input} />
            </div>

            <div>
              <label className={cx.label}>Observaciones</label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2}
                placeholder="Notas internas..." className={cx.input + ' resize-none'} />
            </div>
          </div>
        )}
      </section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <button onClick={resetAll} className={cx.btnSecondary}>Limpiar</button>
        <button onClick={handleSubmit} disabled={isSubmitting}
          className={cx.btnPrimary + ' flex items-center gap-2'}>
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Registrar {PROGRAMAS[programa].label}
        </button>
      </div>
    </div>
  );
}
