const { Router } = require('express');
const { pool } = require('../db');
const { emailRenovacion } = require('../notifuse');

const router = Router();

// POST /api/renovacion — Registrar renovación de programa
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const d = req.body;
    await client.query('BEGIN');

    // 1. Buscar alumno por DNI
    const alumno = await client.query(
      'SELECT id FROM alumnos WHERE dni_alumno = $1',
      [d.dniAlumno]
    ).then(r => r.rows[0]);

    if (!alumno) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    }

    // 2. Marcar inscripción anterior como Vencido
    await client.query(
      `UPDATE inscripciones SET estado = 'Vencido'
       WHERE alumno_id = $1 AND estado = 'Activo'`,
      [alumno.id]
    );

    // 3. Crear nueva inscripción
    await client.query(
      `INSERT INTO inscripciones (alumno_id, programa, fecha_inscripcion, fecha_inicio, fecha_fin,
       clases_totales, turno, dias_tentativos, precio_programa, precio_pagado,
       descuento, codigo_promocional, tipo_cliente, estado, estado_pago)
       VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Renovación','Activo','Pendiente')`,
      [alumno.id, d.programa, d.fechaInicio || null, d.fechaFin || null,
       d.clasesTotales || 0, d.turnoSeleccionado, d.diasTentativos,
       d.precioPrograma || 0, d.total || 0, d.descuentoDinero || 0,
       d.codigoPromocional || null]
    );

    // 4. Actualizar tallas si vienen
    if (d.tallasPolos) {
      const poloPrimario = Array.isArray(d.tallasPolos) ? d.tallasPolos[0] : d.tallasPolos;
      await client.query(
        `INSERT INTO tallas (alumno_id, talla_polo, fecha_registro)
         VALUES ($1, $2, CURRENT_DATE)`,
        [alumno.id, poloPrimario]
      );
    }

    await client.query('COMMIT');

    // 5. Enviar email de renovación (no bloquea la respuesta)
    if (d.email) {
      emailRenovacion(d).catch(err => console.error('Error enviando email renovación:', err));
    }

    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
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
