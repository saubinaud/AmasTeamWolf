const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// GET /api/space/leads/stats — Quick counts by estado + total + new this week
router.get('/stats', async (_req, res) => {
  try {
    const [nuevo, contactado, interesado, matriculado, descartado, total, thisWeek] = await Promise.all([
      queryOne("SELECT COUNT(*) AS total FROM leads WHERE estado = 'Nuevo'"),
      queryOne("SELECT COUNT(*) AS total FROM leads WHERE estado = 'Contactado'"),
      queryOne("SELECT COUNT(*) AS total FROM leads WHERE estado = 'Interesado'"),
      queryOne("SELECT COUNT(*) AS total FROM leads WHERE estado = 'Matriculado'"),
      queryOne("SELECT COUNT(*) AS total FROM leads WHERE estado = 'Descartado'"),
      queryOne('SELECT COUNT(*) AS total FROM leads'),
      queryOne("SELECT COUNT(*) AS total FROM leads WHERE created_at >= date_trunc('week', CURRENT_DATE)"),
    ]);

    return res.json({
      success: true,
      data: {
        nuevo: parseInt(nuevo.total, 10),
        contactado: parseInt(contactado.total, 10),
        interesado: parseInt(interesado.total, 10),
        matriculado: parseInt(matriculado.total, 10),
        descartado: parseInt(descartado.total, 10),
        total: parseInt(total.total, 10),
        nuevos_esta_semana: parseInt(thisWeek.total, 10),
      },
    });
  } catch (err) {
    console.error('Error obteniendo stats de leads:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'LEAD_STATS_ERROR' });
  }
});

// GET /api/space/leads/embudo — Funnel stats: counts, conversion rate, avg time to convert
router.get('/embudo', async (_req, res) => {
  try {
    const funnel = await query(
      `SELECT estado, COUNT(*) AS cantidad
       FROM leads
       GROUP BY estado
       ORDER BY cantidad DESC`
    );

    const totalRow = await queryOne('SELECT COUNT(*) AS total FROM leads');
    const matriculadoRow = await queryOne("SELECT COUNT(*) AS total FROM leads WHERE estado = 'Matriculado'");

    const totalLeads = parseInt(totalRow.total, 10);
    const totalMatriculados = parseInt(matriculadoRow.total, 10);
    const conversionRate = totalLeads > 0
      ? parseFloat(((totalMatriculados / totalLeads) * 100).toFixed(2))
      : 0;

    // Average days from creation to becoming Matriculado
    const avgTime = await queryOne(
      `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400), 1) AS dias
       FROM leads
       WHERE estado = 'Matriculado' AND updated_at IS NOT NULL`
    );

    return res.json({
      success: true,
      data: {
        embudo: funnel.map(r => ({ estado: r.estado, cantidad: parseInt(r.cantidad, 10) })),
        total: totalLeads,
        matriculados: totalMatriculados,
        tasa_conversion: conversionRate,
        dias_promedio_conversion: avgTime && avgTime.dias ? parseFloat(avgTime.dias) : null,
      },
    });
  } catch (err) {
    console.error('Error obteniendo embudo de leads:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'LEAD_EMBUDO_ERROR' });
  }
});

// GET /api/space/leads/exportar — CSV export, optional ?estado= filter
router.get('/exportar', async (req, res) => {
  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (req.query.estado) {
      conditions.push(`estado = $${paramIndex++}`);
      params.push(req.query.estado);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query(
      `SELECT id, nombre_apoderado, nombre_alumno, correo, telefono,
              estado, plataforma, campana, created_at
       FROM leads ${where}
       ORDER BY created_at DESC`,
      params
    );

    const header = 'ID,Nombre Apoderado,Nombre Alumno,Correo,Telefono,Estado,Plataforma,Campana,Fecha Creacion';
    const csvRows = rows.map(r =>
      [
        r.id,
        `"${(r.nombre_apoderado || '').replace(/"/g, '""')}"`,
        `"${(r.nombre_alumno || '').replace(/"/g, '""')}"`,
        `"${(r.correo || '').replace(/"/g, '""')}"`,
        `"${(r.telefono || '').replace(/"/g, '""')}"`,
        `"${(r.estado || '').replace(/"/g, '""')}"`,
        `"${(r.plataforma || '').replace(/"/g, '""')}"`,
        `"${(r.campana || '').replace(/"/g, '""')}"`,
        r.created_at ? new Date(r.created_at).toISOString() : '',
      ].join(',')
    );

    const csv = [header, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    return res.send(csv);
  } catch (err) {
    console.error('Error exportando leads:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'LEAD_EXPORT_ERROR' });
  }
});

// GET /api/space/leads — Paginated list with filters
router.get('/', async (req, res) => {
  try {
    const { search, estado, plataforma, campana } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (estado) {
      conditions.push(`estado = $${paramIndex++}`);
      params.push(estado);
    }
    if (plataforma) {
      conditions.push(`plataforma ILIKE $${paramIndex++}`);
      params.push(plataforma);
    }
    if (campana) {
      conditions.push(`campana ILIKE $${paramIndex++}`);
      params.push(campana);
    }
    if (search) {
      conditions.push(`(nombre_apoderado ILIKE $${paramIndex} OR nombre_alumno ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await queryOne(
      `SELECT COUNT(*) AS total FROM leads ${where}`,
      params
    );
    const total = parseInt(countResult.total, 10);
    const totalPages = Math.ceil(total / limit);

    const rows = await query(
      `SELECT id, nombre_apoderado, nombre_alumno, correo, telefono,
              estado, plataforma, campana, observaciones, created_at
       FROM leads
       ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: rows,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    console.error('Error listando leads:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'LEAD_LIST_ERROR' });
  }
});

// PUT /api/space/leads/:id — Update lead (restricted fields)
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = ['estado', 'observaciones', 'telefono', 'correo'];

    const updates = [];
    const params = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar', code: 'LEAD_NO_FIELDS' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const row = await queryOne(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Lead no encontrado', code: 'LEAD_NOT_FOUND' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error actualizando lead:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'LEAD_UPDATE_ERROR' });
  }
});

// DELETE /api/space/leads/:id — Delete lead permanently
router.delete('/:id', async (req, res) => {
  try {
    const row = await queryOne(
      'DELETE FROM leads WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Lead no encontrado', code: 'LEAD_NOT_FOUND' });
    }

    return res.json({ success: true, data: { id: row.id } });
  } catch (err) {
    console.error('Error eliminando lead:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'LEAD_DELETE_ERROR' });
  }
});

module.exports = router;
