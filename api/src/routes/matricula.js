const { Router } = require('express');
const { pool, queryOne } = require('../db');
const { emailMatricula3y6Meses, emailMatricula1Mes } = require('../notifuse');
const { generarPDFContrato } = require('../pdfContrato');

const router = Router();

// POST /api/matricula — Registrar nueva matrícula (3 meses, 6 meses, mensual)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const d = req.body;
    await client.query('BEGIN');

    // 1. Buscar o crear alumno
    let alumno = await client.query(
      'SELECT id FROM alumnos WHERE dni_alumno = $1',
      [d.dniAlumno]
    ).then(r => r.rows[0]);

    if (!alumno) {
      const result = await client.query(
        `INSERT INTO alumnos (nombre_alumno, dni_alumno, fecha_nacimiento, categoria,
         nombre_apoderado, dni_apoderado, correo, telefono, direccion, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Activo')
         RETURNING id`,
        [d.nombreAlumno, d.dniAlumno, d.fechaNacimiento || null, d.categoriaAlumno,
         d.nombrePadre, d.dniPadre, d.email, d.telefono, d.direccion]
      );
      alumno = result.rows[0];
    } else {
      await client.query(
        `UPDATE alumnos SET nombre_apoderado=$1, dni_apoderado=$2, correo=$3,
         telefono=$4, direccion=$5, categoria=$6, estado='Activo'
         WHERE id=$7`,
        [d.nombrePadre, d.dniPadre, d.email, d.telefono, d.direccion,
         d.categoriaAlumno, alumno.id]
      );
    }

    // 2. Crear inscripción
    const inscResult = await client.query(
      `INSERT INTO inscripciones (alumno_id, programa, fecha_inscripcion, fecha_inicio, fecha_fin,
       clases_totales, turno, dias_tentativos, precio_programa, precio_pagado,
       descuento, codigo_promocional, tipo_cliente, estado, estado_pago)
       VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Nuevo/Primer registro','Activo','Pendiente')
       RETURNING id`,
      [alumno.id, d.programa, d.fechaInicio || null, d.fechaFin || null,
       d.clasesTotales || 0, d.turnoSeleccionado, d.diasTentativos,
       d.precioPrograma || 0, d.total || 0, d.descuentoDinero || 0,
       d.codigoPromocional || null]
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

    // 4. Guardar contrato firmado
    if (d.contratoFirmado) {
      try {
        const pdfBuffer = await generarPDFContrato(d, d.contratoFirmado);
        const pdfBase64 = pdfBuffer.toString('base64');
        await client.query(
          `INSERT INTO contratos (inscripcion_id, archivo_url, firmado, fecha_firma)
           VALUES ($1, $2, TRUE, CURRENT_DATE)`,
          [inscripcionId, pdfBase64]
        );
        console.log(`Contrato guardado: inscripcion_id=${inscripcionId}`);
      } catch (pdfErr) {
        console.error('Error guardando contrato (no bloquea inscripción):', pdfErr.message);
      }
    }

    await client.query('COMMIT');

    // 5. Enviar email de bienvenida con PDF adjunto (no bloquea la respuesta)
    const esMensual = (d.programa || '').toLowerCase().includes('1 mes') ||
                      (d.programa || '').toLowerCase().includes('mensual');

    if (d.email) {
      const emailFn = esMensual ? emailMatricula1Mes : emailMatricula3y6Meses;
      emailFn(d).catch(err => console.error('Error enviando email matrícula:', err));
    }

    res.json({
      success: true,
      alumno_id: alumno.id,
      inscripcion_id: inscripcionId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en matrícula:', err);
    res.status(500).json({ success: false, error: 'Error registrando matrícula' });
  } finally {
    client.release();
  }
});

module.exports = router;
