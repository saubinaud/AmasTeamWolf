// Texto del contrato: viene del API (GET /api/contratos/texto), el mismo que
// imprime el PDF. Aquí no se escribe ninguna cláusula.
import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../config/api';

export interface Clausula {
  numero: number;
  titulo: string;
  texto: string;
  variantes?: { autoriza: string; no_autoriza: string };
}

export interface TextoContrato {
  version: string;
  clausulas: Clausula[];
  clausula_imagen: number;
  resumen: { clausula: number; texto: string }[];
}

let enCache: TextoContrato | null = null;

/** Cláusulas con la variante de imagen elegida. */
export function clausulasCon(t: TextoContrato, autorizaImagen: boolean): Clausula[] {
  return t.clausulas.map((c) => (c.variantes ? { ...c, texto: autorizaImagen ? c.variantes.autoriza : c.variantes.no_autoriza } : c));
}

export function useTextoContrato() {
  const [texto, setTexto] = useState<TextoContrato | null>(enCache);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (enCache) return;
    let vigente = true;
    setError(null);
    fetch(`${API_BASE}/contratos/texto`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then((j: { data: TextoContrato }) => { enCache = j.data; if (vigente) setTexto(j.data); })
      .catch((e: Error) => { if (vigente) setError(e.message); });
    return () => { vigente = false; };
  }, [intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  return { texto, error, reintentar };
}
