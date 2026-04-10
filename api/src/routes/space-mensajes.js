const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// Auto-create tables if not exist
pool.query(`
  CREATE TABLE IF NOT EXISTS mensajes (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('difusion', 'programa', 'individual')),
    asunto VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    programa_destino VARCHAR(100),
    alumno_destino_id INTEGER REFERENCES alumnos(id),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS mensajes_leidos (
    id SERIAL PRIMARY KEY,
    mensaje_id INTEGER NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    leido_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mensaje_id, alumno_id)
  );
  CREATE INDEX IF NOT EXISTS idx_mensajes_tipo ON mensajes(tipo);
  CREATE INDEX IF NOT EXISTS idx_mensajes_leidos_msg ON mensajes_leidos(mensaje_id);
  CREATE INDEX IF NOT EXISTS idx_mensajes_leidos_alumno ON mensajes_leidos(alumno_id);
`).catch(err => console.error('Error creating mensajes tables:', err.message));

// GET /stats — counts: total, by tipo, total reads
router.get('/stats', async (_req, res) => {
  try {
    const row = await queryOne(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE tipo = 'difusion') AS difusion,
        COUNT(*) FILTER (WHERE tipo = 'programa') AS programa,
        COUNT(*) FILTER (WHERE tipo = 'individual') AS individual
      FROM mensajes
    `);
    const leidos = await queryOne(`SELECT COUNT(*) AS total FROM mensajes_leidos`);
    return res.json({
      success: true,
      data: {
        total: parseInt(row.total),
        difusion: parseInt(row.difusion),
        programa: parseInt(row.programa),
        individual: parseInt(row.individual),
        total_leidos: parseInt(leidos.total),
      },
    });
  } catch (err) {
    console.error('Error stats mensajes:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /programas — distinct active programs for dropdown
router.get('/programas', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT DISTINCT programa
      FROM inscripciones
      WHERE estado = 'Activo'
      ORDER BY programa
    `);
    return res.json({
      success: true,
      data: rows.map(r => r.programa),
    });
  } catch (err) {
    console.error('Error listing programas:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET / — paginated list of sent messages with recipient/read counts
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const countResult = await queryOne(`SELECT COUNT(*) AS total FROM mensajes`);
    const total = parseInt(countResult.total);

    const rows = await query(`
      SELECT
        m.*,
        COALESCE(lr.leidos, 0) AS leidos,
        CASE
          WHEN m.tipo = 'difusion' THEN (
            SELECT COUNT(*) FROM alumnos WHERE LOWER(estado) = 'activo'
          )
          WHEN m.tipo = 'programa' THEN (
            SELECT COUNT(DISTINCT i.alumno_id)
            FROM inscripciones i
            JOIN alumnos a ON a.id = i.alumno_id
            WHERE i.programa = m.programa_destino
              AND i.estado = 'Activo'
              AND LOWER(a.estado) = 'activo'
          )
          WHEN m.tipo = 'individual' THEN 1
          ELSE 0
        END AS destinatarios
      FROM mensajes m
      LEFT JOIN (
        SELECT mensaje_id, COUNT(*) AS leidos
        FROM mensajes_leidos
        GROUP BY mensaje_id
      ) lr ON lr.mensaje_id = m.id
      ORDER BY m.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return res.json({
      success: true,
      data: {
        mensajes: rows.map(r => ({
          ...r,
          leidos: parseInt(r.leidos),
          destinatarios: parseInt(r.destinatarios),
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Error listing mensajes:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST / — send message
router.post('/', async (req, res) => {
  try {
    const { tipo, asunto, contenido, programa_destino, alumno_destino_id } = req.body;

    const tiposValidos = ['difusion', 'programa', 'individual'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`,
      });
    }
    if (!asunto || !asunto.trim()) {
      return res.status(400).json({ success: false, error: 'El asunto es obligatorio' });
    }
    if (!contenido || !contenido.trim()) {
      return res.status(400).json({ success: false, error: 'El contenido es obligatorio' });
    }
    if (tipo === 'programa' && !programa_destino) {
      return res.status(400).json({ success: false, error: 'Debe indicar el programa destino' });
    }
    if (tipo === 'individual' && !alumno_destino_id) {
      return res.status(400).json({ success: false, error: 'Debe indicar el alumno destino' });
    }

    const created_by = req.spaceUser ? req.spaceUser.id : null;

    const row = await queryOne(`
      INSERT INTO mensajes (tipo, asunto, contenido, programa_destino, alumno_destino_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [tipo, asunto.trim(), contenido.trim(), programa_destino || null, alumno_destino_id || null, created_by]);

    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error('Error creating mensaje:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /:id — message detail with read receipts
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const mensaje = await queryOne(`SELECT * FROM mensajes WHERE id = $1`, [id]);
    if (!mensaje) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }

    const leidos = await query(`
      SELECT
        ml.leido_at,
        a.id AS alumno_id,
        a.nombre_alumno,
        a.dni_alumno
      FROM mensajes_leidos ml
      JOIN alumnos a ON a.id = ml.alumno_id
      WHERE ml.mensaje_id = $1
      ORDER BY ml.leido_at DESC
    `, [id]);

    return res.json({
      success: true,
      data: {
        ...mensaje,
        leidos,
      },
    });
  } catch (err) {
    console.error('Error getting mensaje:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// DELETE /:id — hard delete (CASCADE removes reads)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const mensaje = await queryOne(`DELETE FROM mensajes WHERE id = $1 RETURNING id`, [id]);
    if (!mensaje) {
      return res.status(404).json({ success: false, error: 'Mensaje no encontrado' });
    }

    return res.json({ success: true, data: { deleted: mensaje.id } });
  } catch (err) {
    console.error('Error deleting mensaje:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
