const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// GET /api/space/referidos — Lista de referidos con info de referidor y referido
router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      SELECT r.id, r.bono, r.canjeado, r.created_at,
             a1.id AS referidor_id, a1.nombre_alumno AS referidor_nombre, a1.codigo_referido, a1.saldo_bonos,
             a2.id AS referido_id, a2.nombre_alumno AS referido_nombre
      FROM referidos r
      JOIN alumnos a1 ON a1.id = r.referidor_id
      JOIN alumnos a2 ON a2.id = r.referido_id
      ORDER BY r.created_at DESC
      LIMIT 200
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error listando referidos:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/referidos/stats — KPIs de referidos
router.get('/stats', async (req, res) => {
  try {
    const [total, bonoPendiente, bonoCobrado, topReferidores] = await Promise.all([
      queryOne('SELECT COUNT(*) AS total FROM referidos'),
      queryOne("SELECT COALESCE(SUM(bono), 0) AS total FROM referidos WHERE canjeado = false"),
      queryOne("SELECT COALESCE(SUM(bono), 0) AS total FROM referidos WHERE canjeado = true"),
      query(`
        SELECT a.id, a.nombre_alumno, a.codigo_referido, a.saldo_bonos,
               COUNT(r.id) AS total_referidos
        FROM alumnos a
        JOIN referidos r ON r.referidor_id = a.id
        GROUP BY a.id, a.nombre_alumno, a.codigo_referido, a.saldo_bonos
        ORDER BY total_referidos DESC
        LIMIT 10
      `),
    ]);

    return res.json({
      success: true,
      stats: {
        total: parseInt(total.total),
        bonoPendiente: parseFloat(bonoPendiente.total),
        bonoCobrado: parseFloat(bonoCobrado.total),
      },
      topReferidores,
    });
  } catch (err) {
    console.error('Error stats referidos:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/referidos/por-alumno/:id — Referidos de un alumno específico
router.get('/por-alumno/:id', async (req, res) => {
  try {
    const alumno = await queryOne(
      'SELECT id, nombre_alumno, codigo_referido, saldo_bonos FROM alumnos WHERE id = $1',
      [req.params.id]
    );
    if (!alumno) return res.status(404).json({ success: false, error: 'Alumno no encontrado' });

    const referidos = await query(`
      SELECT r.id, r.bono, r.canjeado, r.created_at, a.nombre_alumno AS referido_nombre
      FROM referidos r
      JOIN alumnos a ON a.id = r.referido_id
      WHERE r.referidor_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    return res.json({ success: true, alumno, referidos });
  } catch (err) {
    console.error('Error referidos por alumno:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/space/referidos — Registrar referido manualmente
router.post('/', async (req, res) => {
  try {
    const { referidor_id, referido_id, bono } = req.body;
    if (!referidor_id || !referido_id) {
      return res.status(400).json({ success: false, error: 'referidor_id y referido_id son requeridos' });
    }

    const montoBonus = parseFloat(bono) || 60;

    // Verificar que no exista ya
    const existe = await queryOne(
      'SELECT id FROM referidos WHERE referido_id = $1',
      [referido_id]
    );
    if (existe) {
      return res.status(400).json({ success: false, error: 'Este alumno ya fue registrado como referido' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insertar referido
      await client.query(
        'INSERT INTO referidos (referidor_id, referido_id, bono, canjeado) VALUES ($1, $2, $3, false)',
        [referidor_id, referido_id, montoBonus]
      );

      // Acumular bono al referidor
      await client.query(
        'UPDATE alumnos SET saldo_bonos = COALESCE(saldo_bonos, 0) + $1 WHERE id = $2',
        [montoBonus, referidor_id]
      );

      await client.query('COMMIT');

      const updated = await queryOne('SELECT saldo_bonos FROM alumnos WHERE id = $1', [referidor_id]);
      return res.json({ success: true, saldo_bonos: parseFloat(updated.saldo_bonos) });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error registrando referido:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/space/referidos/canjear — Descontar bono de un alumno
router.post('/canjear', async (req, res) => {
  try {
    const { alumno_id, monto } = req.body;
    if (!alumno_id || !monto) {
      return res.status(400).json({ success: false, error: 'alumno_id y monto son requeridos' });
    }

    const alumno = await queryOne('SELECT id, saldo_bonos FROM alumnos WHERE id = $1', [alumno_id]);
    if (!alumno) return res.status(404).json({ success: false, error: 'Alumno no encontrado' });

    const saldo = parseFloat(alumno.saldo_bonos) || 0;
    const montoDescuento = Math.min(parseFloat(monto), saldo);

    if (montoDescuento <= 0) {
      return res.status(400).json({ success: false, error: 'No tiene saldo de bonos disponible' });
    }

    await pool.query(
      'UPDATE alumnos SET saldo_bonos = COALESCE(saldo_bonos, 0) - $1 WHERE id = $2',
      [montoDescuento, alumno_id]
    );

    // Marcar referidos como canjeados hasta cubrir el monto
    await pool.query(`
      UPDATE referidos SET canjeado = true
      WHERE id IN (
        SELECT id FROM referidos
        WHERE referidor_id = $1 AND canjeado = false
        ORDER BY created_at ASC
        LIMIT $2
      )
    `, [alumno_id, Math.ceil(montoDescuento / 60)]);

    const updated = await queryOne('SELECT saldo_bonos FROM alumnos WHERE id = $1', [alumno_id]);
    return res.json({ success: true, descontado: montoDescuento, saldo_restante: parseFloat(updated.saldo_bonos) });
  } catch (err) {
    console.error('Error canjeando bono:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
