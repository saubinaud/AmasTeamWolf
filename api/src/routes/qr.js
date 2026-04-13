const { Router } = require('express');
const { query, queryOne, pool } = require('../db');
const crypto = require('crypto');

const router = Router();

// POST /api/qr/generar — Generar sesión QR para una sede
// Body: { sede_id, horario_id?, duracion_horas?, hora_clase?, programa? }
router.post('/generar', async (req, res) => {
  try {
    const { sede_id, horario_id, duracion_horas = 2, hora_clase, programa } = req.body;

    if (!sede_id) {
      return res.status(400).json({ error: 'sede_id requerido' });
    }

    const token = crypto.randomUUID();
    const ahora = new Date();
    const cierre = new Date(ahora.getTime() + duracion_horas * 60 * 60 * 1000);

    // Intentar INSERT con hora_clase y programa (columnas nuevas)
    let sesion;
    try {
      const result = await pool.query(
        `INSERT INTO qr_sesiones (sede_id, horario_id, token, fecha, hora_apertura, hora_cierre, activa, hora_clase, programa)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, true, $6, $7)
         RETURNING id, token, fecha, hora_apertura, hora_cierre, hora_clase, programa`,
        [sede_id, horario_id || null, token, ahora.toISOString(), cierre.toISOString(), hora_clase || null, programa || null]
      );
      sesion = result.rows[0];
    } catch (colErr) {
      // Fallback si las columnas hora_clase/programa no existen aún
      const result = await pool.query(
        `INSERT INTO qr_sesiones (sede_id, horario_id, token, fecha, hora_apertura, hora_cierre, activa)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, true)
         RETURNING id, token, fecha, hora_apertura, hora_cierre`,
        [sede_id, horario_id || null, token, ahora.toISOString(), cierre.toISOString()]
      );
      sesion = result.rows[0];
    }

    res.json({
      success: true,
      token: sesion.token,
      url: `https://amasteamwolf.com/asistencia?token=${sesion.token}`,
      valido_hasta: sesion.hora_cierre,
      hora_clase: hora_clase || null,
      programa: programa || null,
    });
  } catch (err) {
    console.error('Error generando QR:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/qr/generar-diario — Generar sesión QR única para todo el día
// Body: { sede_id }
router.post('/generar-diario', async (req, res) => {
  try {
    const { sede_id } = req.body;

    if (!sede_id) {
      return res.status(400).json({ error: 'sede_id requerido' });
    }

    const token = crypto.randomUUID();
    const ahora = new Date();
    const cierre = new Date(ahora.getTime() + 12 * 60 * 60 * 1000); // 12 horas

    let sesion;
    try {
      const result = await pool.query(
        `INSERT INTO qr_sesiones (sede_id, horario_id, token, fecha, hora_apertura, hora_cierre, activa, hora_clase, programa)
         VALUES ($1, NULL, $2, CURRENT_DATE, $3, $4, true, $5, $6)
         RETURNING id, token, fecha, hora_apertura, hora_cierre, hora_clase, programa`,
        [sede_id, token, ahora.toISOString(), cierre.toISOString(), '00:00', 'diario']
      );
      sesion = result.rows[0];
    } catch (colErr) {
      // Fallback si las columnas hora_clase/programa no existen aún
      const result = await pool.query(
        `INSERT INTO qr_sesiones (sede_id, horario_id, token, fecha, hora_apertura, hora_cierre, activa)
         VALUES ($1, NULL, $2, CURRENT_DATE, $3, $4, true)
         RETURNING id, token, fecha, hora_apertura, hora_cierre`,
        [sede_id, token, ahora.toISOString(), cierre.toISOString()]
      );
      sesion = result.rows[0];
    }

    res.json({
      success: true,
      token: sesion.token,
      url: `https://amasteamwolf.com/asistencia?token=${sesion.token}`,
      valido_hasta: sesion.hora_cierre,
      hora_clase: '00:00',
      programa: 'diario',
    });
  } catch (err) {
    console.error('Error generando QR diario:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/qr/validar/:token — Verificar si un QR es válido
router.get('/validar/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const sesion = await queryOne(`
      SELECT qs.*, s.nombre AS sede_nombre
      FROM qr_sesiones qs
      JOIN sedes s ON s.id = qs.sede_id
      WHERE qs.token = $1
    `, [token]);

    if (!sesion) {
      return res.json({ valido: false, error: 'Token no encontrado' });
    }

    const ahora = new Date();
    const cierre = new Date(sesion.hora_cierre);

    if (!sesion.activa || ahora > cierre) {
      return res.json({ valido: false, error: 'QR expirado', sede: sesion.sede_nombre });
    }

    res.json({
      valido: true,
      sede: sesion.sede_nombre,
      valido_hasta: sesion.hora_cierre,
    });
  } catch (err) {
    console.error('Error validando QR:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/qr/activas — Listar sesiones QR activas
router.get('/activas', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT qs.id, qs.token, qs.fecha, qs.hora_apertura, qs.hora_cierre,
             s.nombre AS sede_nombre
      FROM qr_sesiones qs
      JOIN sedes s ON s.id = qs.sede_id
      WHERE qs.activa = true AND qs.fecha = CURRENT_DATE
      ORDER BY qs.hora_apertura DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error listando QR activas:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
