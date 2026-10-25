// Catálogo público y cotización del servidor para los formularios de
// matrícula, renovación y Leadership. El front arma el pedido y pinta lo que
// devuelve POST /api/config/cotizar; nunca suma precios por su cuenta.
import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config/api';
import { catalogoRespaldo, type Cotizacion, type ItemCatalogo, type PedidoCotizacion } from '../utils/catalogo';

type EstadoCatalogo = 'cargando' | 'ok' | 'respaldo';

// Una sola petición por visita, compartida entre componentes
let pendiente: Promise<ItemCatalogo[]> | null = null;

function pedirCatalogo(): Promise<ItemCatalogo[]> {
  if (!pendiente) {
    pendiente = fetch(`${API_BASE}/config/catalogo`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { data: ItemCatalogo[] }) => {
        if (!Array.isArray(j.data) || j.data.length === 0) throw new Error('catálogo vacío');
        return j.data;
      })
      .catch((e) => {
        pendiente = null; // que la próxima visita lo intente de nuevo
        throw e;
      });
  }
  return pendiente;
}

/**
 * Catálogo del API. Si falla, `estado = 'respaldo'` y los ítems son los
 * precios históricos de shared/constants/programas.ts (solo referenciales).
 */
export function useCatalogoPublico() {
  const [items, setItems] = useState<ItemCatalogo[]>([]);
  const [estado, setEstado] = useState<EstadoCatalogo>('cargando');

  useEffect(() => {
    let vigente = true;
    pedirCatalogo()
      .then((data) => { if (vigente) { setItems(data); setEstado('ok'); } })
      .catch(() => { if (vigente) { setItems(catalogoRespaldo()); setEstado('respaldo'); } });
    return () => { vigente = false; };
  }, []);

  return { items, estado };
}

// Reintentos tras un error: cubren el minuto del limitador del API
const ESPERAS = [3000, 6000, 12000, 20000, 30000];

/**
 * Cotiza con un retardo corto. `pedido = null` no cotiza.
 * `alDia` es falso mientras la cotización mostrada no corresponde al pedido
 * actual: no se debe enviar con números viejos.
 */
export function useCotizacion(pedido: PedidoCotizacion | null) {
  const clave = useMemo(() => (pedido ? JSON.stringify(pedido) : ''), [pedido]);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [cotizadaPara, setCotizadaPara] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => { setIntento(0); setError(null); }, [clave]);

  useEffect(() => {
    if (!clave) return;
    let vigente = true;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API_BASE}/config/cotizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: clave,
        });
        if (!r.ok) throw new Error(`Error ${r.status}`);
        const j = (await r.json()) as { data: Cotizacion };
        if (!vigente) return;
        setCotizacion(j.data);
        setCotizadaPara(clave);
        setError(null);
      } catch (e) {
        if (!vigente) return;
        setError((e as Error).message);
        if (intento < ESPERAS.length) setIntento((n) => n + 1); // p. ej. 429 del limitador (ventana de 1 min)
      }
    }, intento === 0 ? 250 : ESPERAS[intento - 1]);
    return () => { vigente = false; clearTimeout(t); };
  }, [clave, intento]);

  const alDia = !!clave && cotizadaPara === clave && !!cotizacion;
  return {
    cotizacion: clave ? cotizacion : null,
    alDia,
    cargando: !!clave && !alDia && !error,
    error,
  };
}
