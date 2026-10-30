// Datos de contacto públicos de la academia. Una sola fuente para la web:
// antes el WhatsApp estaba escrito en seis archivos (y el pie de página
// llamaba a otro número que el que mostraba).
export const WHATSAPP = '51989717412';
export const TELEFONO = `+${WHATSAPP}`;
export const TELEFONO_VISIBLE = '+51 989 717 412';
export const CORREO = 'amasteamwolf@gmail.com';
export const DIRECCION = 'Av. Angamos Este 2741';
export const DISTRITO = 'San Borja';

/** Enlace de WhatsApp, con mensaje opcional (ya codificado o en texto plano). */
export const enlaceWhatsApp = (texto?: string, yaCodificado = false) =>
  `https://wa.me/${WHATSAPP}${texto ? `?text=${yaCodificado ? texto : encodeURIComponent(texto)}` : ''}`;
