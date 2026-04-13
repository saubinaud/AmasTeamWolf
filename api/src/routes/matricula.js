const { Router } = require('express');
const { pool } = require('../db');
const { emailMatricula3y6Meses, emailMatricula1Mes } = require('../notifuse');
const { generarPDFContrato } = require('../pdfContrato');
const { guardarContratoPDF } = require('../cloudinary');

const router = Router();

// Valores aceptados por inscripciones.estado_pago
const ESTADOS_PAGO_VALIDOS = ['Pendiente', 'Parcial', 'Pagado'];
// Valores aceptados por inscripciones.tipo_cliente
const TIPOS_CLIENTE_VALIDOS = ['Nuevo/Primer registro', 'Renovación', 'Walk-in', 'Promocional', 'Transferido'];

// POST /api/matricula — Registrar nueva matrícula
// Acepta overrides de admin: estadoPago, metodoPago, tipoCliente, observaciones,
// skipContrato, skipEmail. Si estadoPago != 'Pendiente' inserta fila en pagos.
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const d = req.body;
    await client.query('BEGIN');

    // ── Normalización de overrides admin (backwards compatible) ────────────
    const estadoPago = ESTADOS_PAGO_VALIDOS.includes(d.estadoPago) ? d.estadoPago : 'Pendiente';
    const tipoCliente = TIPOS_CLIENTE_VALIDOS.includes(d.tipoCliente) ? d.tipoCliente : 'Nuevo/Primer registro';
    const metodoPago = d.metodoPago ?? null;
    const observacionesAdmin = d.observaciones ?? null;
    const skipContrato = d.skipContrato === true;
    const skipEmail = d.skipEmail === true;
    const origen = d.origen ?? 'web';

    const precioPrograma = Number(d.precioPrograma) || 0;
    const precioPagado = Number(d.total ?? d.precioPagado) || 0;
    const descuento = Number(d.descuentoDinero ?? d.descuento) || 0;

    // 1. Buscar o crear alumno (normalizar DNI para mejor match)
    const dniNorm = String(d.dniAlumno || '').replace(/[\s\-\.]/g, '').trim();
    let alumno = await client.query(
      `SELECT id FROM alumnos WHERE REPLACE(REPLACE(REPLACE(dni_alumno, ' ', ''), '-', ''), '.', '') = $1`,
      [dniNorm]
    ).then(r => r.rows[0]);

    if (!alumno) {
      const tipoDoc = ['DNI', 'CE', 'Pasaporte'].includes(d.tipoDocumento) ? d.tipoDocumento : 'DNI';
      const result = await client.query(
        `INSERT INTO alumnos (nombre_alumno, dni_alumno, tipo_documento, fecha_nacimiento, categoria,
         nombre_apoderado, dni_apoderado, correo, telefono, direccion, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Activo')
         RETURNING id`,
        [d.nombreAlumno, dniNorm, tipoDoc, d.fechaNacimiento || null, d.categoriaAlumno,
         d.nombrePadre, d.dniPadre, d.email, d.telefono, d.direccion]
      );
      alumno = result.rows[0];
    } else {
      const tipoDocUpdate = ['DNI', 'CE', 'Pasaporte'].includes(d.tipoDocumento) ? d.tipoDocumento : undefined;
      await client.query(
        `UPDATE alumnos SET nombre_apoderado=$1, dni_apoderado=$2, correo=$3,
         telefono=$4, direccion=$5, categoria=$6,
         ${tipoDocUpdate ? 'tipo_documento=$8,' : ''}
         estado='Activo', updated_at=NOW()
         WHERE id=$7`,
        tipoDocUpdate
          ? [d.nombrePadre, d.dniPadre, d.email, d.telefono, d.direccion, d.categoriaAlumno, alumno.id, tipoDocUpdate]
          : [d.nombrePadre, d.dniPadre, d.email, d.telefono, d.direccion, d.categoriaAlumno, alumno.id]
      );
    }

    // 2. Crear inscripción
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

    // 3. Registrar tallas
    if (d.tallaUniforme || d.tallasPolos) {
      const poloPrimario = Array.isArray(d.tallasPolos) ? d.tallasPolos[0] : d.tallasPolos;
      await client.query(
        `INSERT INTO tallas (alumno_id, talla_uniforme, talla_polo, fecha_registro)
         VALUES ($1,$2,$3,CURRENT_DATE)`,
        [alumno.id, d.tallaUniforme || null, poloPrimario || null]
      );
    }

    // 4. Si el admin marcó Pagado/Parcial, registrar pago automático
    if (estadoPago === 'Pagado' || estadoPago === 'Parcial') {
      const montoPago = estadoPago === 'Pagado' ? precioPagado : (Number(d.montoParcial) || precioPagado);
      if (montoPago > 0) {
        await client.query(
          `INSERT INTO pagos (inscripcion_id, monto, fecha, tipo, metodo_pago, observaciones)
           VALUES ($1, $2, CURRENT_DATE, 'Inscripción', $3, $4)`,
          [inscripcionId, montoPago, metodoPago, observacionesAdmin]
        );
      }
    }

    await client.query('COMMIT');

    // 5. Guardar contrato firmado (si viene y no se saltea)
    let contratoUrl = '';
    if (d.contratoFirmado && !skipContrato) {
      try {
        const pdfBuffer = await generarPDFContrato(d, d.contratoFirmado);
        const nombreArchivo = `contrato_${(d.nombreAlumno || 'alumno').replace(/\s+/g, '_')}_${inscripcionId}`;
        const url = await guardarContratoPDF(pdfBuffer, nombreArchivo, inscripcionId);
        contratoUrl = url || '';
      } catch (pdfErr) {
        console.error('Error guardando contrato (no bloquea inscripción):', pdfErr.message);
      }
    }

    // 6. Email de bienvenida (salvo que admin pida saltarlo)
    if (d.email && !skipEmail) {
      const esMensual = (d.programa || '').toLowerCase().includes('1 mes') ||
                        (d.programa || '').toLowerCase().includes('mensual');
      const emailFn = esMensual ? emailMatricula1Mes : emailMatricula3y6Meses;
      emailFn(d, contratoUrl).catch(err => console.error('Error enviando email matrícula:', err));
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
    console.error('Error en matrícula:', err);
    res.status(500).json({ success: false, error: 'Error registrando matrícula' });
  } finally {
    client.release();
  }
});

module.exports = router;
