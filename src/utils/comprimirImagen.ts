// Compresor de imágenes del navegador para lo que sube la web pública (hoy: el
// comprobante del torneo). Es el mismo criterio que Space (amas-space
// src/services/imagenes.ts): se lee derecha según el EXIF, se reduce y se vuelve
// a codificar en canvas, así se pierden EXIF y GPS y la foto del celular viaja
// liviana. Convierte también lo que el servidor no sabe leer (HEIC de iPhone:
// Safari lo decodifica). El API reprocesa siempre (amas-api services/imagenes.js).

export type PresetImagen = 'comprobante';

const PRESETS: Record<PresetImagen, { lado: number; formato: 'image/jpeg'; calidad: number }> = {
  // El API guarda el comprobante en JPEG de 1600 px: se sube un poco más grande
  comprobante: { lado: 1800, formato: 'image/jpeg', calidad: 0.85 },
};

/** Lo más grande que se intenta leer (un celular se queda sin memoria antes). */
export const MAX_BYTES_ENTRADA = 30 * 1024 * 1024;

async function leer(archivo: Blob): Promise<{ fuente: CanvasImageSource; ancho: number; alto: number; cerrar: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
      return { fuente: bmp, ancho: bmp.width, alto: bmp.height, cerrar: () => bmp.close() };
    } catch { /* se intenta con <img> */ }
  }
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.src = url;
  try { await img.decode(); } catch (e) { URL.revokeObjectURL(url); throw e; }
  return { fuente: img, ancho: img.naturalWidth, alto: img.naturalHeight, cerrar: () => URL.revokeObjectURL(url) };
}

/**
 * Comprime la imagen. Si el navegador no la sabe leer, lanza un error con un
 * mensaje para la persona (mejor que mandar algo que el servidor rechazará).
 */
export async function comprimirImagen(archivo: File | Blob, preset: PresetImagen): Promise<Blob> {
  if (archivo.size > MAX_BYTES_ENTRADA) throw new Error('La imagen pesa más de 30 MB');
  if (archivo.type && !archivo.type.startsWith('image/')) throw new Error('Elige una imagen (foto o captura de pantalla)');
  const p = PRESETS[preset];
  let img;
  try { img = await leer(archivo); } catch { throw new Error('No pudimos abrir esa imagen. Prueba con una captura de pantalla o una foto en JPG.'); }
  try {
    const escala = Math.min(1, p.lado / Math.max(img.ancho, img.alto));
    const w = Math.max(1, Math.round(img.ancho * escala));
    const h = Math.max(1, Math.round(img.alto * escala));
    const lienzo = document.createElement('canvas');
    lienzo.width = w;
    lienzo.height = h;
    const ctx = lienzo.getContext('2d');
    if (!ctx) throw new Error('No pudimos preparar la imagen');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.fuente, 0, 0, img.ancho, img.alto, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, p.formato, p.calidad));
    if (!blob) throw new Error('No pudimos preparar la imagen');
    return blob;
  } finally {
    img.cerrar();
  }
}

/** Blob → data URL (para mandarlo en JSON). */
export function aDataUrl(b: Blob): Promise<string> {
  return new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => mal(r.error);
    r.readAsDataURL(b);
  });
}
