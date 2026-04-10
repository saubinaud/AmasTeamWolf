const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// GET /api/space/compras/stats
router.get('/stats', async (_req, res) => {
  try {
    const [totalRow, ventasMesRow, porCategoria, topTipos] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS total FROM implementos`),
      queryOne(`
        SELECT COALESCE(SUM(precio), 0) AS total
        FROM implementos
        WHERE origen = 'compra'
          AND created_at >= date_trunc('month', CURRENT_DATE)
      `),
      query(`
        SELECT categoria, COUNT(*) AS total
        FROM implementos
        GROUP BY categoria
        ORDER BY total DESC
      `),
      query(`
        SELECT tipo, COUNT(*) AS total
        FROM implementos
        GROUP BY tipo
        ORDER BY total DESC
        LIMIT 5
      `),
    ]);

    return res.json({
      success: true,
      data: {
        total_compras: parseInt(totalRow.total) || 0,
        total_ventas_mes: parseFloat(ventasMesRow.total) || 0,
        por_categoria: porCategoria.map(r => ({
          categoria: r.categoria,
          total: parseInt(r.total) || 0,
        })),
        top_tipos: topTipos.map(r => ({
          tipo: r.tipo,
          total: parseInt(r.total) || 0,
        })),
      },
    });
  } catch (err) {
    console.error('Error stats compras:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/compras — Lista paginada con filtros
router.get('/', async (req, res) => {
  try {
    const { search, categoria, alumno_id } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (categoria) {
      conditions.push(`i.categoria = $${idx++}`);
      params.push(categoria);
    }
    if (alumno_id) {
      conditions.push(`i.alumno_id = $${idx++}`);
      params.push(alumno_id);
    }
    if (search) {
      conditions.push(`(a.nombre_alumno ILIKE $${idx} OR a.dni_alumno ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult, rows] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) AS total
         FROM implementos i
         LEFT JOIN alumnos a ON a.id = i.alumno_id
         ${where}`,
        params
      ),
      query(
        `SELECT
          i.id,
          i.alumno_id,
          i.categoria,
          i.tipo,
          i.talla,
          i.fecha_adquisicion,
          i.precio,
          i.origen,
          i.metodo_pago,
          i.observaciones,
          i.created_by,
          i.created_at,
          a.nombre_alumno,
          a.dni_alumno
         FROM implementos i
         LEFT JOIN alumnos a ON a.id = i.alumno_id
         ${where}
         ORDER BY i.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.total) || 0;

    return res.json({
      success: true,
      data: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Error listando compras:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/compras/por-alumno/:alumnoId — Implementos agrupados por categoría
router.get('/por-alumno/:alumnoId', async (req, res) => {
  try {
    const { alumnoId } = req.params;

    const rows = await query(
      `SELECT
        id, alumno_id, categoria, tipo, talla, fecha_adquisicion,
        precio, origen, metodo_pago, observaciones, created_by, created_at
       FROM implementos
       WHERE alumno_id = $1
       ORDER BY categoria ASC, created_at DESC`,
      [alumnoId]
    );

    const grupos = {};
    let totalGastado = 0;

    for (const r of rows) {
      if (!grupos[r.categoria]) grupos[r.categoria] = [];
      grupos[r.categoria].push(r);
      const precio = parseFloat(r.precio);
      if (!isNaN(precio)) totalGastado += precio;
    }

    return res.json({
      success: true,
      data: {
        alumno_id: alumnoId,
        total_implementos: rows.length,
        total_gastado: totalGastado,
        por_categoria: grupos,
      },
    });
  } catch (err) {
    console.error('Error obteniendo implementos por alumno:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/compras/armas-alumno/:alumnoId — Solo las armas (usado en graduación)
router.get('/armas-alumno/:alumnoId', async (req, res) => {
  try {
    const { alumnoId } = req.params;

    const rows = await query(
      `SELECT
        id, alumno_id, categoria, tipo, talla, fecha_adquisicion,
        precio, origen, metodo_pago, observaciones, created_by, created_at
       FROM implementos
       WHERE alumno_id = $1 AND categoria = 'arma'
       ORDER BY created_at DESC`,
      [alumnoId]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error obteniendo armas del alumno:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/space/compras — Registrar nueva compra
router.post('/', async (req, res) => {
  try {
    const {
      alumno_id,
      categoria,
      tipo,
      talla,
      precio,
      origen,
      metodo_pago,
      observaciones,
      fecha_adquisicion,
    } = req.body;

    if (!alumno_id || !categoria || !tipo) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: alumno_id, categoria, tipo',
      });
    }

    const createdBy = req.spaceUser?.id || null;

    const row = await queryOne(
      `INSERT INTO implementos (
        alumno_id, categoria, tipo, talla, fecha_adquisicion,
        precio, origen, metodo_pago, observaciones, created_by, created_at
      ) VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, COALESCE($7, 'compra'), $8, $9, $10, NOW())
      RETURNING *`,
      [
        alumno_id,
        categoria,
        tipo,
        talla || null,
        fecha_adquisicion || null,
        precio != null ? precio : null,
        origen || null,
        metodo_pago || null,
        observaciones || null,
        createdBy,
      ]
    );

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error creando compra:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// PUT /api/space/compras/:id — Editar compra
router.put('/:id', async (req, res) => {
  try {
    const fieldMap = {
      categoria: 'categoria',
      tipo: 'tipo',
      talla: 'talla',
      precio: 'precio',
      origen: 'origen',
      metodo_pago: 'metodo_pago',
      observaciones: 'observaciones',
      fecha_adquisicion: 'fecha_adquisicion',
    };

    const updates = [];
    const params = [];
    let idx = 1;

    for (const [bodyField, dbField] of Object.entries(fieldMap)) {
      if (req.body[bodyField] !== undefined) {
        updates.push(`${dbField} = $${idx++}`);
        params.push(req.body[bodyField]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    params.push(req.params.id);

    const row = await queryOne(
      `UPDATE implementos SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Compra no encontrada' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error actualizando compra:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// DELETE /api/space/compras/:id
router.delete('/:id', async (req, res) => {
  try {
    const row = await queryOne(
      'DELETE FROM implementos WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Compra no encontrada' });
    }

    return res.json({ success: true, data: { id: row.id } });
  } catch (err) {
    console.error('Error eliminando compra:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
