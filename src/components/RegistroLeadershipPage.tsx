// Inscripción pública a Leadership Wolf (/registro-leadership).
// Precio, implementos incluidos y códigos salen del API: los implementos que el
// alumno ya tiene se mandan como ids (ya_tiene) y el servidor descuenta su precio.
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE } from '../config/api';
import { useCatalogoPublico, useCotizacion } from '../hooks/useCatalogoPublico';
import { cx } from './matricula/tokens';
import { CabeceraJMA, Portada, Seccion, Campo, Casilla, Exito, irA } from './matricula/piezas';
import { CampoCodigo, ResumenCotizacion, BarraTotal, EspacioBarra } from './matricula/Resumen';
import { programaPorCodigo, soles, type ItemCatalogo, type PedidoCotizacion } from '../utils/catalogo';

interface RegistroLeadershipPageProps {
  onNavigateHome: () => void;
  onSuccess: (total: number) => void;
}

const DATOS = { nombrePadre: '', nombreAlumno: '', dniAlumno: '', correo: '' };

export function RegistroLeadershipPage({ onNavigateHome, onSuccess }: RegistroLeadershipPageProps) {
  const { items, estado } = useCatalogoPublico();
  const respaldo = estado === 'respaldo';
  const [d, setD] = useState(DATOS);
  const [yaTiene, setYaTiene] = useState<number[]>([]);
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState<number | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const programa = useMemo(() => programaPorCodigo(items, 'leadership'), [items]);
  const implementos = useMemo<ItemCatalogo[]>(
    () => (programa?.incluye ?? []).map((id) => items.find((i) => i.id === id)).filter((i): i is ItemCatalogo => !!i),
    [programa, items],
  );

  const pedido = useMemo<PedidoCotizacion | null>(() => {
    if (!programa || respaldo) return null;
    return { lineas: [{ item_id: programa.id }], codigo: codigo || undefined, ya_tiene: yaTiene };
  }, [programa, respaldo, codigo, yaTiene]);
  const { cotizacion, alDia, cargando, error } = useCotizacion(pedido);

  const cambiar = (campo: keyof typeof DATOS, valor: string) => setD((x) => ({ ...x, [campo]: valor }));
  const alternar = (id: number, v: boolean) => setYaTiene((prev) => (v ? [...prev, id] : prev.filter((x) => x !== id)));

  const enviar = async () => {
    if (!d.nombrePadre.trim() || !d.nombreAlumno.trim() || d.dniAlumno.length < 6 || !/\S+@\S+\.\S+/.test(d.correo)) {
      toast.error('Completa los datos: nombres, DNI del alumno y correo');
      irA('sec-datos');
      return;
    }
    if (!programa || !cotizacion || !alDia) { toast.error('Espera a que se calcule el total'); return; }
    if (!cotizacion.ok) { toast.error(cotizacion.errores[0] ?? 'No se pudo calcular el total'); return; }

    const linea = cotizacion.lineas[0];
    const nombres = (lista: ItemCatalogo[]) => lista.map((i) => i.nombre);
    const payload = {
      nombre_padre: d.nombrePadre.trim(),
      nombre_alumno: d.nombreAlumno.trim(),
      dni_alumno: d.dniAlumno,
      correo: d.correo.trim(),
      programa: programa.nombre,
      programa_codigo: programa.codigo,
      ya_tiene: yaTiene,
      precio_base: linea?.precio_unitario ?? programa.precio,
      descuento_por_implementos: cotizacion.descuento_manual,
      codigo_promocional: cotizacion.promocion.aplicada ? cotizacion.promocion.codigo : 'No aplicado',
      descuento_codigo: cotizacion.descuento_promocion,
      total_a_pagar: cotizacion.total,
      implementos_incluidos: nombres(implementos.filter((i) => !yaTiene.includes(i.id))),
      implementos_que_ya_tiene: nombres(implementos.filter((i) => yaTiene.includes(i.id))),
      fecha_inscripcion: new Date().toISOString(),
    };

    setEnviando(true);
    try {
      const r = await fetch(`${API_BASE}/leadership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.success === false) throw new Error(j.error || `Error ${r.status}`);
      setRegistrado(cotizacion.total);
      window.scrollTo(0, 0);
      onSuccess(cotizacion.total);
    } catch (e) {
      toast.error(`No se pudo enviar: ${(e as Error).message}. Inténtalo de nuevo.`);
    } finally {
      setEnviando(false);
    }
  };

  if (registrado != null) {
    return (
      <div className={cx.pagina}>
        <CabeceraJMA onVolver={onNavigateHome} />
        <Exito
          titulo="¡Inscripción a Leadership registrada!"
          texto="Para confirmar el cupo, realiza el pago. Te escribiremos para coordinar la entrega de los implementos."
          total={registrado}
          onPagar={() => onSuccess(registrado)}
          onInicio={onNavigateHome}
        />
      </div>
    );
  }

  return (
    <div className={cx.pagina}>
      <CabeceraJMA onVolver={onNavigateHome} />
      <main className={cx.contenedor}>
        <Portada
          etiqueta="Programa adicional"
          titulo="Leadership Wolf"
          bajada="Se suma al programa que el alumno ya lleva. Marca los implementos que ya tiene y no los pagas."
          precio={programa?.precio}
          notaPrecio="con todos los implementos"
          respaldo={respaldo}
        />
        {!programa && estado === 'ok' && <p className={cx.avisoAmbar}>Leadership no está disponible por ahora. Escríbenos por WhatsApp.</p>}

        <div className="space-y-4">
          <Seccion id="sec-datos" titulo="Datos">
            <Campo id="nombreAlumno" label="Nombre del alumno" value={d.nombreAlumno} onValor={(v) => cambiar('nombreAlumno', v)} />
            <Campo
              id="dniAlumno"
              label="DNI del alumno"
              inputMode="numeric"
              placeholder="Número de documento"
              value={d.dniAlumno}
              onValor={(v) => cambiar('dniAlumno', v.replace(/\D/g, '').slice(0, 12))}
              ayuda="El mismo DNI con el que ya está inscrito."
            />
            <Campo id="nombrePadre" label="Nombre de la madre, padre o apoderado" autoComplete="name" value={d.nombrePadre} onValor={(v) => cambiar('nombrePadre', v)} />
            <Campo id="correo" label="Correo" type="email" inputMode="email" autoComplete="email" value={d.correo} onValor={(v) => cambiar('correo', v)} />
          </Seccion>

          {implementos.length > 0 && (
            <Seccion id="sec-implementos" titulo="¿Qué implementos ya tiene?" descripcion="Lo que marques se descuenta del total.">
              <div className="space-y-2">
                {implementos.map((i) => (
                  <Casilla key={i.id} marcada={yaTiene.includes(i.id)} onCambio={(v) => alternar(i.id, v)} titulo={i.nombre} derecha={soles(i.precio)} />
                ))}
              </div>
            </Seccion>
          )}

          <Seccion id="sec-resumen" titulo="Resumen">
            <ResumenCotizacion
              cotizacion={cotizacion}
              alDia={alDia}
              error={error}
              respaldo={respaldo}
              etiquetaDescuentoManual={`Implementos que ya tiene (${yaTiene.length})`}
            />
            {!respaldo && <CampoCodigo aplicado={codigo} onAplicar={setCodigo} onQuitar={() => setCodigo('')} cotizacion={cotizacion} alDia={alDia} />}
            <p className={`${cx.textoApagado} text-[13px]`}>Al inscribirte aceptas los términos y condiciones del programa Leadership Wolf.</p>
          </Seccion>
        </div>
        <EspacioBarra />
      </main>

      <BarraTotal
        total={cotizacion?.total ?? null}
        calculando={cargando}
        enviando={enviando}
        onEnviar={enviar}
        texto="Inscribirme"
        deshabilitado={respaldo || !programa}
      />
    </div>
  );
}
