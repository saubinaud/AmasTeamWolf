// Texto del contrato y de los Términos y Condiciones: viene del API
// (GET /api/contratos/texto; fuente única en amas-api/src/services/contratoTexto.js),
// el mismo que imprime el PDF. Aquí no se escribe ninguna cláusula.
import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../config/api';

export type Bloque =
  | { tipo: 'p'; texto: string; variante?: 'autoriza' | 'no_autoriza' }
  | { tipo: 'lista'; items: { etiqueta?: string; texto: string }[] }
  | { tipo: 'formula'; texto: string }
  | { tipo: 'ejemplo'; titulo: string; filas: { concepto: string; detalle?: string; monto: number; total?: boolean }[]; nota?: string };

export interface Clausula {
  numero: number;
  id: string;
  titulo: string;
  bloques: Bloque[];
}

export interface Terminos {
  titulo: string;
  subtitulo: string;
  actualizado: string;
  secciones: Clausula[];
}

export interface TextoContrato {
  version: string;
  clausulas: Clausula[];
  clausula_imagen: number;
  clausula_devoluciones: number;
  resumen: { clausula: number; ref: string; texto: string }[];
  /** Con {apoderado}, {dni}, {alumno} y {programa} por llenar */
  declaracion: string;
  terminos: Terminos;
}

let enCache: TextoContrato | null = null;

/** Cláusulas con la variante de imagen elegida (los demás bloques no cambian). */
export function clausulasCon(t: TextoContrato, autorizaImagen: boolean): Clausula[] {
  const elegida = autorizaImagen ? 'autoriza' : 'no_autoriza';
  return t.clausulas.map((c) => ({
    ...c,
    bloques: c.bloques.filter((b) => b.tipo !== 'p' || !b.variante || b.variante === elegida),
  }));
}

type Hueco = 'apoderado' | 'dni' | 'alumno' | 'programa';

/** Declaración partida en texto y huecos ({apoderado}, {dni}…), para pintar los datos en negrita. */
export function partesDeclaracion(t: TextoContrato, datos: Record<Hueco, string>) {
  return t.declaracion.split(/(\{(?:apoderado|dni|alumno|programa)\})/).filter(Boolean).map((trozo) => {
    const m = /^\{(apoderado|dni|alumno|programa)\}$/.exec(trozo);
    return m ? { dato: true, texto: datos[m[1] as Hueco] } : { dato: false, texto: trozo };
  });
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
