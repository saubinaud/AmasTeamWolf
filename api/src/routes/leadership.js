const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// POST /api/leadership — Inscripción al programa Leadership Wolf
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const d = req.body;

    if (!d.nombre_alumno || typeof d.nombre_alumno !== 'string') {
      client.release();
      return res.status(400).json({ success: false, error: 'nombre_alumno es requerido' });
    }
    if (!d.nombre_padre || typeof d.nombre_padre !== 'string') {
      client.release();
      return res.status(400).json({ success: false, error: 'nombre_padre es requerido' });
    }

    await client.query('BEGIN');

    // 1. Buscar o crear alumno
    let alumno = await client.query(
      'SELECT id FROM alumnos WHERE nombre_alumno ILIKE $1 AND nombre_apoderado ILIKE $2',
      [d.nombre_alumno, d.nombre_padre]
    ).then(r => r.rows[0]);

    if (!alumno) {
      // Crear alumno básico (sin DNI porque este form no lo pide)
      const result = await client.query(
        `INSERT INTO alumnos (nombre_alumno, nombre_apoderado, correo, estado)
         VALUES ($1, $2, $3, 'Activo')
         RETURNING id`,
        [d.nombre_alumno, d.nombre_padre, d.correo]
      );
      alumno = result.rows[0];
    }

    // 2. Crear inscripción Leadership
    await client.query(
      `INSERT INTO inscripciones (alumno_id, programa, fecha_inscripcion, precio_programa,
       precio_pagado, descuento, tipo_cliente, estado, estado_pago)
       VALUES ($1, 'Leadership Wolf', CURRENT_DATE, $2, $3, $4, 'Nuevo/Primer registro', 'Activo', 'Pendiente')`,
      [alumno.id, d.precio_base || 1299, d.total_a_pagar || 0, d.descuento_por_implementos || 0]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en inscripción Leadership:', err);
    res.status(500).json({ success: false, error: 'Error registrando inscripción' });
  } finally {
    client.release();
  }
});

module.exports = router;
