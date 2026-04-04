const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// POST /api/perfil — Obtener perfil o vincular auth_id
// Body: { auth_id, email } o { action: "link_auth_id", auth_id, email, apoderado_id }
router.post('/', async (req, res) => {
  try {
    const { action, auth_id, email } = req.body;

    if (!auth_id) {
      return res.status(400).json({ error: 'auth_id requerido' });
    }

    // Acción: vincular auth_id a un apoderado existente
    if (action === 'link_auth_id') {
      const { apoderado_id } = req.body;
      if (!apoderado_id) {
        return res.status(400).json({ error: 'apoderado_id requerido' });
      }

      await pool.query(
        `UPDATE alumnos SET auth_id = $1, correo = COALESCE($2, correo) WHERE id = $3`,
        [auth_id, email || null, apoderado_id]
      );

      return res.json({ success: true });
    }

    // Buscar apoderado vinculado a este auth_id
    const perfil = await queryOne(`
      SELECT
        a.id AS alumno_id,
        a.id AS apoderado_id,
        a.nombre_alumno,
        a.dni_alumno,
        a.fecha_nacimiento,
        a.categoria,
        a.nombre_apoderado,
        a.dni_apoderado AS apoderado_dni,
        a.correo AS apoderado_correo,
        a.telefono AS apoderado_telefono,
        a.direccion,
        a.estado,
        a.auth_id,
        i.id AS inscripcion_id,
        i.programa,
        i.fecha_inicio,
        i.fecha_fin,
        i.estado AS estado_inscripcion,
        i.estado_pago,
        i.precio_programa,
        i.precio_pagado,
        i.descuento,
        i.dias_tentativos,
        i.turno,
        t.talla_uniforme,
        t.talla_polo
      FROM alumnos a
      LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'Activo'
      LEFT JOIN tallas t ON t.alumno_id = a.id
      WHERE a.auth_id = $1
      ORDER BY i.fecha_inscripcion DESC
      LIMIT 1
    `, [auth_id]);

    if (!perfil) {
      // Intentar buscar por email
      const perfilByEmail = await queryOne(`
        SELECT
          a.id AS alumno_id,
          a.id AS apoderado_id,
          a.nombre_alumno,
          a.dni_alumno,
          a.fecha_nacimiento,
          a.categoria,
          a.nombre_apoderado,
          a.dni_apoderado AS apoderado_dni,
          a.correo AS apoderado_correo,
          a.telefono AS apoderado_telefono,
          a.direccion,
          a.estado,
          i.programa,
          i.fecha_inicio,
          i.fecha_fin,
          i.estado AS estado_inscripcion,
          i.estado_pago,
          i.precio_programa,
          i.precio_pagado,
          i.descuento,
          i.dias_tentativos,
          t.talla_uniforme,
          t.talla_polo
        FROM alumnos a
        LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'Activo'
        LEFT JOIN tallas t ON t.alumno_id = a.id
        WHERE a.correo = $1
        ORDER BY i.fecha_inscripcion DESC
        LIMIT 1
      `, [email]);

      if (!perfilByEmail) {
        return res.json({ error: 'Perfil no encontrado' });
      }

      return res.json(perfilByEmail);
    }

    // Obtener asistencias recientes
    const asistencias = await query(`
      SELECT fecha, hora, turno, asistio, observaciones
      FROM asistencias
      WHERE alumno_id = $1
      ORDER BY fecha DESC, hora DESC
      LIMIT 20
    `, [perfil.alumno_id]);

    res.json({
      ...perfil,
      apoderado_nombre: perfil.nombre_apoderado,
      alumno_nombre: perfil.nombre_alumno,
      alumno_dni: perfil.dni_alumno,
      asistencias,
      congelaciones: [],
    });
  } catch (err) {
    console.error('Error obteniendo perfil:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
