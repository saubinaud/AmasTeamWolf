const { Router } = require('express');
const { pool } = require('../db');
const { emailRenovacion } = require('../notifuse');
const { generarPDFContrato } = require('../pdfContrato');
const { guardarContratoPDF } = require('../cloudinary');

const router = Router();

const ESTADOS_PAGO_VALIDOS = ['Pendiente', 'Parcial', 'Pagado'];
const TIPOS_CLIENTE_VALIDOS = ['Nuevo/Primer registro', 'Renovación', 'Walk-in', 'Promocional', 'Transferido'];

// POST /api/renovacion — Registrar renovación de programa
// Acepta overrides de admin: estadoPago, metodoPago, tipoCliente, observaciones,
// skipContrato, skipEmail. Registra pago automático si Pagado/Parcial.
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const d = req.body;

    if (!d.dniAlumno || typeof d.dniAlumno !== 'string') {
      client.release();
      return res.status(400).json({ success: false, error: 'dniAlumno es requerido' });
    }

    // ── Normalización de overrides admin ────────────────────────────────────
    const estadoPago = ESTADOS_PAGO_VALIDOS.includes(d.estadoPago) ? d.estadoPago : 'Pendiente';
    const tipoCliente = TIPOS_CLIENTE_VALIDOS.includes(d.tipoCliente) ? d.tipoCliente : 'Renovación';
    const metodoPago = d.metodoPago ?? null;
    const observacionesAdmin = d.observaciones ?? null;
    const skipContrato = d.skipContrato === true;
    const skipEmail = d.skipEmail === true;
    const origen = d.origen ?? 'web';

    const precioPrograma = Number(d.precioPrograma) || 0;
    const precioPagado = Number(d.total ?? d.precioPagado) || 0;
    const descuento = Number(d.descuentoDinero ?? d.descuento) || 0;

    await client.query('BEGIN');

    // 1. Buscar alumno por DNI (normalizado)
    const dniNorm = String(d.dniAlumno || '').replace(/[\s\-\.]/g, '').trim();
    const alumno = await client.query(
      `SELECT id FROM alumnos WHERE dni_alumno_norm = $1`,
      [dniNorm]
    ).then(r => r.rows[0]);

    if (!alumno) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    }

    // 2. Marcar inscripción anterior como Vencido
    await client.query(
      `UPDATE inscripciones SET estado = 'Vencido', updated_at = NOW()
       WHERE alumno_id = $1 AND estado = 'Activo'`,
      [alumno.id]
    );

    // 3. Crear nueva inscripción
    const frecuenciaSemanal = [1, 2].includes(Number(d.frecuenciaSemanal)) ? Number(d.frecuenciaSemanal) : 2;
    const inscResult = await client.query(
      `INSERT INTO inscripciones (alumno_id, programa, fecha_inscripcion, fecha_inicio, fecha_fin,
       clases_totales, turno, dias_tentativos, precio_programa, precio_pagado,
       descuento, codigo_promocional, tipo_cliente, estado, estado_pago, frecuencia_semanal)
       VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Activo',$13,$14)
       RETURNING id`,
      [alumno.id, d.programa, d.fechaInicio || null, d.fechaFin || null,
       d.clasesTotales || 0, d.turnoSeleccionado, d.diasTentativos,
       precioPrograma, precioPagado, descuento,
       d.codigoPromocional || null, tipoCliente, estadoPago, frecuenciaSemanal]
    );

    const inscripcionId = inscResult.rows[0].id;

    // 4. Actualizar tallas si vienen
    if (d.tallasPolos) {
      const poloPrimario = Array.isArray(d.tallasPolos) ? d.tallasPolos[0] : d.tallasPolos;
      await client.query(
        `INSERT INTO tallas (alumno_id, talla_polo, fecha_registro)
         VALUES ($1, $2, CURRENT_DATE)`,
        [alumno.id, poloPrimario]
      );
    }

    // 5. Si admin marcó Pagado/Parcial, registrar pago automático
    if (estadoPago === 'Pagado' || estadoPago === 'Parcial') {
      const montoPago = estadoPago === 'Pagado' ? precioPagado : (Number(d.montoParcial) || precioPagado);
      if (montoPago > 0) {
        await client.query(
          `INSERT INTO pagos (inscripcion_id, monto, fecha, tipo, metodo_pago, observaciones)
           VALUES ($1, $2, CURRENT_DATE, 'Renovación', $3, $4)`,
          [inscripcionId, montoPago, metodoPago, observacionesAdmin]
        );
      }
    }

    await client.query('COMMIT');

    // 6. Guardar contrato firmado (salvo skipContrato)
    let contratoUrl = '';
    if (d.contratoFirmado && !skipContrato) {
      try {
        const pdfBuffer = await generarPDFContrato(d, d.contratoFirmado);
        const nombreArchivo = `renovacion_${(d.nombreAlumno || 'alumno').replace(/\s+/g, '_')}_${inscripcionId}`;
        const url = await guardarContratoPDF(pdfBuffer, nombreArchivo, inscripcionId);
        contratoUrl = url || '';
      } catch (pdfErr) {
        console.error('Error guardando contrato renovación:', pdfErr.message);
      }
    }

    // 7. Email de renovación (salvo skipEmail)
    if (d.email && !skipEmail) {
      emailRenovacion(d, contratoUrl).catch(err => console.error('Error enviando email renovación:', err));
    }

    res.json({
      success: true,
      alumno_id: alumno.id,
      inscripcion_id: inscripcionId,
      estado_pago: estadoPago,
      pago_registrado: estadoPago !== 'Pendiente',
      origen,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error en renovación:', err);
    res.status(500).json({ success: false, error: 'Error registrando renovación' });
  } finally {
    client.release();
  }
});

// POST /api/renovacion/navidad — Renovación especial navidad
router.post('/navidad', async (req, res) => {
  try {
    const d = req.body;

    await pool.query(
      `INSERT INTO leads (nombre_apoderado, nombre_alumno, correo, estado, plataforma, campana)
       VALUES ($1, $2, $3, 'Renovación Navidad', $4, $5)`,
      [d.nombre_padre, d.nombre_alumno, d.email || '',
       d.source || 'Web', d.plan || 'no-decido']
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error en renovación navidad:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
