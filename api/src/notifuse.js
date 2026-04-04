// Servicio de emails transaccionales via Notifuse
const NOTIFUSE_URL = 'https://emailmarketing-notifuse.s6hx3x.easypanel.host/api/transactional.send';
const NOTIFUSE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMmEyNmQ4MWYtMWI0Ny00NDY4LWIwM2YtZDYzMmQwMTE1MjMwIiwidHlwZSI6ImFwaV9rZXkiLCJlbWFpbCI6Im1haWxAZW1haWxtYXJrZXRpbmctbm90aWZ1c2UuczZoeDN4LmVhc3lwYW5lbC5ob3N0IiwiZXhwIjoyMDc4NTIwNDIwLCJuYmYiOjE3NjMxNjA0MjAsImlhdCI6MTc2MzE2MDQyMH0.Yad0WvVrjgEz7IsvE5aqkCws6KkjFZzxHsXCUsWa1xs';
const WORKSPACE_ID = 'amaswolf';
const { generarPDFContrato } = require('./pdfContrato');

async function enviarNotificacion(templateId, email, firstName, data, attachments) {
  try {
    const body = {
      workspace_id: WORKSPACE_ID,
      notification: {
        id: templateId,
        channels: ['email'],
        contact: { email, first_name: firstName },
        data,
      },
    };

    // Agregar adjuntos si los hay
    if (attachments && attachments.length > 0) {
      body.notification.attachments = attachments;
    }

    const response = await fetch(NOTIFUSE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NOTIFUSE_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Notifuse error (${templateId}):`, response.status, text);
      return false;
    }

    console.log(`Email enviado: ${templateId} → ${email}${attachments ? ' (con adjunto)' : ''}`);
    return true;
  } catch (err) {
    console.error(`Error enviando email (${templateId}):`, err.message);
    return false;
  }
}

// Genera PDF del contrato y lo devuelve como attachment para Notifuse
async function generarAdjuntoContrato(datos) {
  try {
    const pdfBuffer = await generarPDFContrato(datos, null);
    const pdfBase64 = pdfBuffer.toString('base64');
    const nombre = datos.nombreAlumno || 'alumno';
    return [{
      filename: `Contrato_${nombre.replace(/\s+/g, '_')}.pdf`,
      content: pdfBase64,
      contentType: 'application/pdf',
    }];
  } catch (err) {
    console.error('Error generando PDF para adjunto:', err.message);
    return null;
  }
}

// ── Matrícula 3 y 6 meses ──
async function emailMatricula3y6Meses(d) {
  const adjuntos = await generarAdjuntoContrato(d);
  return enviarNotificacion('bienvenida_3_meses_sc', d.email, d.nombrePadre, {
    nombrePadre: d.nombrePadre,
    nombreAlumno: d.nombreAlumno,
    dniAlumno: d.dniAlumno,
    dniPadre: d.dniPadre,
    fechaNacimiento: d.fechaNacimiento,
    programa: d.programa,
    fechaInicio: d.fechaInicio,
    fechaFinal: d.fechaFin,
    direccion: d.direccion,
    correo: d.email,
    tallaUniforme: d.tallaUniforme || '',
    tallaPolo: Array.isArray(d.tallasPolos) ? d.tallasPolos.join(', ') : (d.tallasPolos || ''),
    precioPrograma: String(d.precioPrograma || d.total || ''),
  }, adjuntos);
}

// ── Matrícula 1 mes ──
async function emailMatricula1Mes(d) {
  const adjuntos = await generarAdjuntoContrato(d);
  return enviarNotificacion('bienvenida_1_mes_sc', d.email, d.nombrePadre, {
    nombrePadre: d.nombrePadre,
    nombreAlumno: d.nombreAlumno,
    dniAlumno: d.dniAlumno,
    dniPadre: d.dniPadre,
    fechaNacimiento: d.fechaNacimiento,
    programa: d.programa,
    fechaInicio: d.fechaInicio,
    fechaFinal: d.fechaFin,
    direccion: d.direccion,
    correo: d.email,
    contratoUrl: '',
    tallaUniforme: d.tallaUniforme || '',
    tallaPolo: Array.isArray(d.tallasPolos) ? d.tallasPolos.join(', ') : (d.tallasPolos || ''),
    precioPrograma: String(d.precioPrograma || d.total || ''),
  }, adjuntos);
}

// ── Renovación ──
async function emailRenovacion(d) {
  const adjuntos = await generarAdjuntoContrato(d);
  return enviarNotificacion('renovaciones_automaticas', d.email, d.nombrePadre, {
    nombrePadre: d.nombrePadre,
    nombreAlumno: d.nombreAlumno,
    dniAlumno: d.dniAlumno,
    programa: d.programa,
    fechaInicio: d.fechaInicio,
    fechaFinal: d.fechaFin,
    clasesTotales: String(d.clasesTotales || ''),
    turno: d.turnoSeleccionado || '',
    diasTentativos: d.diasTentativos || '',
    categoria: d.categoriaAlumno || '',
    tallaUniforme: d.tallaUniforme || '',
    tallaPolo: Array.isArray(d.tallasPolos) ? d.tallasPolos.join(', ') : (d.tallasPolos || ''),
    precioPrograma: String(d.precioPrograma || d.total || ''),
  }, adjuntos);
}

// ── Torneo ──
function emailTorneo(d) {
  const modalidadesHtml = (d.modalidades || [])
    .map(m => `<li style="padding:4px 0">${m}</li>`)
    .join('');

  const estadoPago = d.comprobante ? 'Comprobante adjunto' : 'Pendiente';
  const estadoPagoHtml = d.comprobante
    ? '<span style="color:#22c55e;font-weight:bold">Comprobante enviado</span>'
    : '<span style="color:#f59e0b;font-weight:bold">Pendiente de pago</span>';
  const comprobanteHtml = d.comprobante
    ? '<p style="color:#22c55e">Comprobante recibido correctamente</p>'
    : '<p style="color:#f59e0b">Aún no se ha enviado comprobante</p>';

  return enviarNotificacion('confirmacion_torneo', d.email, d.apoderado, {
    nombreAlumno: d.alumno,
    dniAlumno: d.dni,
    nombreApoderado: d.apoderado,
    fechaTorneo: d.fecha_torneo,
    totalPago: String(d.total || 0),
    estadoPago,
    modalidadesHtml: `<ul>${modalidadesHtml}</ul>`,
    estadoPagoHtml,
    comprobanteHtml,
  });
}

module.exports = {
  emailMatricula3y6Meses,
  emailMatricula1Mes,
  emailRenovacion,
  emailTorneo,
  enviarNotificacion,
};
