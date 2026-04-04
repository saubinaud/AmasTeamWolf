// Servicio de emails transaccionales via Notifuse
const NOTIFUSE_URL = 'https://emailmarketing-notifuse.s6hx3x.easypanel.host/api/transactional.send';
const NOTIFUSE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMmEyNmQ4MWYtMWI0Ny00NDY4LWIwM2YtZDYzMmQwMTE1MjMwIiwidHlwZSI6ImFwaV9rZXkiLCJlbWFpbCI6Im1haWxAZW1haWxtYXJrZXRpbmctbm90aWZ1c2UuczZoeDN4LmVhc3lwYW5lbC5ob3N0IiwiZXhwIjoyMDc4NTIwNDIwLCJuYmYiOjE3NjMxNjA0MjAsImlhdCI6MTc2MzE2MDQyMH0.Yad0WvVrjgEz7IsvE5aqkCws6KkjFZzxHsXCUsWa1xs';
const WORKSPACE_ID = 'amaswolf';

async function enviarNotificacion(templateId, email, firstName, data) {
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

    console.log(`Email enviado: ${templateId} → ${email}`);
    return true;
  } catch (err) {
    console.error(`Error enviando email (${templateId}):`, err.message);
    return false;
  }
}

// ── Matrícula 3 y 6 meses ──
async function emailMatricula3y6Meses(d, contratoUrl) {
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
    contratoUrl: contratoUrl || '',
    tallaUniforme: d.tallaUniforme || '',
    tallaPolo: Array.isArray(d.tallasPolos) ? d.tallasPolos.join(', ') : (d.tallasPolos || ''),
    precioPrograma: String(d.precioPrograma || d.total || ''),
  });
}

// ── Matrícula 1 mes ──
async function emailMatricula1Mes(d, contratoUrl) {
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
    contratoUrl: contratoUrl || '',
    tallaUniforme: d.tallaUniforme || '',
    tallaPolo: Array.isArray(d.tallasPolos) ? d.tallasPolos.join(', ') : (d.tallasPolos || ''),
    precioPrograma: String(d.precioPrograma || d.total || ''),
  });
}

// ── Renovación ──
async function emailRenovacion(d, contratoUrl) {
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
    contratoUrl: contratoUrl || '',
    tallaUniforme: d.tallaUniforme || '',
    tallaPolo: Array.isArray(d.tallasPolos) ? d.tallasPolos.join(', ') : (d.tallasPolos || ''),
    precioPrograma: String(d.precioPrograma || d.total || ''),
  });
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
