// Datos de la clase de prueba que usan varias secciones de /clase-prueba.
import { useCatalogoPublico } from '../../hooks/useCatalogoPublico';
import { soles } from '../../utils/catalogo';

/** Código del ítem en Space ▸ Catálogo. Si existe, su precio sale en la página. */
export const CODIGO_CLASE_PRUEBA = 'clase-prueba';

// Foto real de la academia, recortada para que no salga el letrero de la marca anterior
export const FOTO_CLASE = (ancho: number) =>
  `https://res.cloudinary.com/dkoocok3j/image/upload/c_crop,w_0.71,h_0.66,x_0,y_0.24,g_north_west/w_${ancho},q_auto,f_auto/v1763125698/Requested_Photos_and_Videos_8660_vy633p.jpg`;

/**
 * Costo de la clase de prueba según el catálogo. Sin ítem en el catálogo no se
 * escribe ningún precio: se confirma por WhatsApp.
 */
export function useCostoClasePrueba() {
  const { items, estado } = useCatalogoPublico();
  const item = items.find((i) => i.codigo === CODIGO_CLASE_PRUEBA) ?? null;
  const texto = item
    ? item.precio > 0 ? soles(item.precio) : 'Gratis'
    : null;
  return { texto, nota: item?.web?.nota_precio ?? null, cargando: estado === 'cargando' };
}
