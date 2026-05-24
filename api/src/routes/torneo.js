const { Router } = require('express');
const { query, queryOne, pool } = require('../db');
const { AlumnoService, InscripcionService } = require('../services');

const router = Router();

// ── Price calculation from JSONB precios_modalidades ──
const DEFAULT_PRECIOS = [
  { desde: 1, hasta: 1, precio: 80 },
  { desde: 2, hasta: 2, precio: 150 },
  { desde: 3, hasta: 99, precio: 200 },
];

const DEFAULT_DESCUENTOS = [
  { programa: 'leadership', label: 'Leadership Wolf', porcentaje: 20 },
  { programa: 'fighter', label: 'Fighter Wolf', porcentaje: 30 },
];

function calcularPrecio(cantidadModalidades, torneo = null) {
  if (cantidadModalidades <= 0) return 0;
  const escalas = torneo?.precios_modalidades || DEFAULT_PRECIOS;
  for (const escala of escalas) {
    if (cantidadModalidades >= escala.desde && cantidadModalidades <= escala.hasta) {
      return parseFloat(escala.precio);
    }
  }
  // Fallback: last scale
  return parseFloat(escalas[escalas.length - 1]?.precio || 200);
}

function resolverDescuento(torneo, programaAlumno) {
  if (!programaAlumno) return null;
  const descuentos = torneo?.descuentos_programa || DEFAULT_DESCUENTOS;
  const prog = programaAlumno.toLowerCase();
  for (const d of descuentos) {
    if (prog.includes(d.programa)) {
      return d;
    }
  }
  return null;
}

// GET /api/torneo/activo — Active tournament with modalidades
router.get('/activo', async (req, res) => {
  try {
    const torneo = await queryOne(`
      SELECT * FROM torneos_config
      WHERE activo = TRUE
      ORDER BY fecha DESC NULLS LAST
      LIMIT 1
    `);

    if (!torneo) {
      return res.json({ torneo: null, modalidades: [], precios_modalidades: DEFAULT_PRECIOS, descuentos_programa: DEFAULT_DESCUENTOS });
    }

    const modalidades = await query(`
      SELECT * FROM torneo_modalidades
      WHERE torneo_id = $1 AND activo = TRUE
      ORDER BY orden ASC, id ASC
    `, [torneo.id]);

    res.json({
      torneo,
      modalidades,
      precios_modalidades: torneo.precios_modalidades || DEFAULT_PRECIOS,
      descuentos_programa: torneo.descuentos_programa || DEFAULT_DESCUENTOS,
    });
  } catch (err) {
    console.error('GET /torneo/activo error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/torneo/consultar?dni=X — Student lookup with implementos + leadership check
router.get('/consultar', async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni || typeof dni !== 'string') {
      return res.status(400).json({ success: false, error: 'dni es requerido' });
    }

    const alumno = await AlumnoService.buscarPorDni(dni);
    if (!alumno) {
      return res.json({ encontrado: false });
    }

    // Get student's implementos categories
    const implementosRows = await query(
      'SELECT DISTINCT categoria FROM implementos WHERE alumno_id = $1',
      [alumno.id]
    );
    const implementos = implementosRows.map(r => r.categoria).filter(Boolean);

    // Check active programs (Leadership, Fighter, etc.)
    const programasRows = await query(`
      SELECT programa FROM inscripciones
      WHERE alumno_id = $1 AND estado = 'Activo'
      ORDER BY fecha_inicio DESC
    `, [alumno.id]);
    const programas_activos = programasRows.map(r => r.programa);
    const programa_activo = programas_activos[0] || null;

    res.json({
      encontrado: true,
      alumno: {
        id: alumno.id,
        nombre: alumno.nombre_alumno,
        dni: alumno.dni_alumno,
        categoria: alumno.categoria,
      },
      implementos,
      programa_activo,
      programas_activos,
      es_leadership: programas_activos.some(p => p?.toLowerCase().includes('leadership')),
      es_fighter: programas_activos.some(p => p?.toLowerCase().includes('fighter')),
    });
  } catch (err) {
    console.error('Error consultando alumno torneo:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/torneo/inscribir — New inscription
router.post('/inscribir', async (req, res) => {
  try {
    const { dni_alumno, modalidades, comprobante_base64 } = req.body;

    if (!dni_alumno || !Array.isArray(modalidades) || modalidades.length === 0) {
      return res.status(400).json({ success: false, error: 'dni_alumno y modalidades[] son requeridos' });
    }

    // Validate alumno
    const alumno = await AlumnoService.buscarPorDni(dni_alumno);
    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    }

    // Validate active torneo
    const torneo = await queryOne(`
      SELECT * FROM torneos_config
      WHERE activo = TRUE
      ORDER BY fecha DESC NULLS LAST
      LIMIT 1
    `);
    if (!torneo) {
      return res.status(404).json({ success: false, error: 'No hay torneo activo' });
    }

    // Validate modalidades exist and are active for this torneo
    const modalidadesDB = await query(`
      SELECT * FROM torneo_modalidades
      WHERE torneo_id = $1 AND activo = TRUE
    `, [torneo.id]);
    const nombresValidos = new Set(modalidadesDB.map(m => m.nombre));
    const idsValidos = new Map(modalidadesDB.map(m => [String(m.id), m.nombre]));

    // Resolve: accept names OR IDs, normalize to names
    const modalidadesResueltas = modalidades.map(m => {
      if (nombresValidos.has(m)) return m;
      if (idsValidos.has(String(m))) return idsValidos.get(String(m));
      return null;
    });
    const invalidas = modalidades.filter((_, i) => !modalidadesResueltas[i]);
    if (invalidas.length > 0) {
      return res.status(400).json({ success: false, error: `Modalidades inválidas: ${invalidas.join(', ')}` });
    }
    // Use resolved names from here
    const modalidadesFinales = modalidadesResueltas.filter(Boolean);

    // Calculate price (use resolved names count)
    let precio_total = calcularPrecio(modalidadesFinales.length, torneo);

    // Check program-based discount (Leadership, Fighter, etc.)
    const programaRow = await queryOne(`
      SELECT programa FROM inscripciones
      WHERE alumno_id = $1 AND estado = 'Activo'
      ORDER BY fecha_inicio DESC LIMIT 1
    `, [alumno.id]);

    const descuentoConfig = resolverDescuento(torneo, programaRow?.programa);

    let descuento = 0;
    let descuento_tipo = null;
    if (descuentoConfig) {
      descuento = Math.round(precio_total * (descuentoConfig.porcentaje / 100));
      descuento_tipo = `${descuentoConfig.programa}_${descuentoConfig.porcentaje}`;
    }

    // Get alumno's implementos categories
    const implementosRows = await query(
      'SELECT DISTINCT categoria FROM implementos WHERE alumno_id = $1',
      [alumno.id]
    );
    const implementosAlumno = new Set(implementosRows.map(r => r.categoria).filter(Boolean));

    // Build a map of modalidad nombre → implementos_requeridos
    const modalidadMap = {};
    for (const m of modalidadesDB) {
      modalidadMap[m.nombre] = m.implementos_requeridos || [];
    }

    // Compute implementos_faltantes across all selected modalidades
    const faltantesSet = new Set();
    for (const nombre of modalidadesFinales) {
      const requeridos = modalidadMap[nombre] || [];
      for (const req of requeridos) {
        if (!implementosAlumno.has(req)) {
          faltantesSet.add(req);
        }
      }
    }
    const implementos_faltantes = [...faltantesSet];

    // Insert selection
    const seleccion = await queryOne(`
      INSERT INTO torneo_selecciones
        (torneo_id, alumno_id, modalidades, precio_total, descuento, descuento_tipo,
         implementos_faltantes, estado, estado_pago)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmado', 'Pendiente')
      RETURNING *
    `, [
      torneo.id,
      alumno.id,
      modalidadesFinales,
      precio_total - descuento,
      descuento,
      descuento_tipo,
      implementos_faltantes,
    ]);

    res.json({
      success: true,
      precio_total: precio_total - descuento,
      descuento,
      implementos_faltantes,
      seleccion_id: seleccion.id,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Este alumno ya está inscrito en este torneo' });
    }
    console.error('Error en inscripción torneo:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /activos — List active tournaments (for marcador selector)
router.get('/activos', async (_req, res) => {
  try {
    const rows = await query("SELECT id, nombre, tipo, fecha, lugar, hora, config FROM torneos_config WHERE activo = true ORDER BY fecha DESC");
    res.json(rows);
  } catch (err) {
    console.error('GET /torneo/activos error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /combates/:combateId/punto — Register a score event
router.post('/combates/:combateId/punto', async (req, res) => {
  try {
    const { combateId } = req.params;
    const { alumno_id, tipo, valor, round, juez_id } = req.body;
    if (!alumno_id || !tipo || valor == null) return res.status(400).json({ error: 'alumno_id, tipo y valor requeridos' });

    const row = await queryOne(
      'INSERT INTO torneo_puntaje_log (combate_id, alumno_id, tipo, valor, round, juez_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [combateId, alumno_id, tipo, valor, round || 1, juez_id || null]
    );

    // Recalculate totals from log
    const totals = await query(
      'SELECT alumno_id, SUM(valor) AS total FROM torneo_puntaje_log WHERE combate_id = $1 GROUP BY alumno_id',
      [combateId]
    );
    // Get combate to know alumno1/alumno2
    const combate = await queryOne('SELECT alumno1_id, alumno2_id FROM torneo_combates WHERE id = $1', [combateId]);
    if (combate) {
      const p1 = totals.find(t => t.alumno_id === combate.alumno1_id)?.total || 0;
      const p2 = totals.find(t => t.alumno_id === combate.alumno2_id)?.total || 0;
      await queryOne('UPDATE torneo_combates SET puntaje_alumno1=$1, puntaje_alumno2=$2 WHERE id=$3', [p1, p2, combateId]);
    }

    res.status(201).json({ success: true, data: row, totals: { puntaje_alumno1: totals.find(t => t.alumno_id === combate?.alumno1_id)?.total || 0, puntaje_alumno2: totals.find(t => t.alumno_id === combate?.alumno2_id)?.total || 0 } });
  } catch (err) {
    console.error('POST /combates/:id/punto error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /puntaje-log/:id — Undo last score
router.delete('/puntaje-log/:id', async (req, res) => {
  try {
    const deleted = await queryOne('DELETE FROM torneo_puntaje_log WHERE id = $1 RETURNING *', [req.params.id]);
    if (!deleted) return res.status(404).json({ error: 'Registro no encontrado' });

    // Recalculate totals
    const totals = await query('SELECT alumno_id, SUM(valor) AS total FROM torneo_puntaje_log WHERE combate_id = $1 GROUP BY alumno_id', [deleted.combate_id]);
    const combate = await queryOne('SELECT alumno1_id, alumno2_id FROM torneo_combates WHERE id = $1', [deleted.combate_id]);
    if (combate) {
      const p1 = totals.find(t => t.alumno_id === combate.alumno1_id)?.total || 0;
      const p2 = totals.find(t => t.alumno_id === combate.alumno2_id)?.total || 0;
      await queryOne('UPDATE torneo_combates SET puntaje_alumno1=$1, puntaje_alumno2=$2 WHERE id=$3', [p1, p2, deleted.combate_id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /puntaje-log/:id error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /combates/:combateId/log — Score history
router.get('/combates/:combateId/log', async (req, res) => {
  try {
    const rows = await query(
      'SELECT l.*, a.nombre_alumno, j.nombre AS juez_nombre FROM torneo_puntaje_log l LEFT JOIN alumnos a ON a.id = l.alumno_id LEFT JOIN torneo_jueces j ON j.id = l.juez_id WHERE l.combate_id = $1 ORDER BY l.created_at DESC',
      [req.params.combateId]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /combates/:id/log error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /:torneoId/config — Public tournament config
router.get('/:torneoId/config', async (req, res) => {
  try {
    const row = await queryOne('SELECT id, nombre, config FROM torneos_config WHERE id = $1', [req.params.torneoId]);
    if (!row) return res.status(404).json({ error: 'Torneo no encontrado' });
    res.json(row);
  } catch (err) {
    console.error('GET /torneo/:id/config error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /:torneoId/jueces — Public judges list
router.get('/:torneoId/jueces', async (req, res) => {
  try {
    const rows = await query('SELECT id, nombre, pista_id FROM torneo_jueces WHERE torneo_id = $1 AND activo = true ORDER BY nombre', [req.params.torneoId]);
    res.json(rows);
  } catch (err) {
    console.error('GET /torneo/:id/jueces error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/torneo/pistas/:torneoId — Public: list pistas with current combate
router.get('/pistas/:torneoId', async (req, res) => {
  try {
    const { torneoId } = req.params;
    const pistas = await query(`
      SELECT p.id, p.numero, p.nombre
      FROM torneo_pistas p
      WHERE p.torneo_id = $1 AND p.activa = true
      ORDER BY p.numero
    `, [torneoId]);

    const combates = await query(`
      SELECT c.id, c.pista_id, c.hora, c.estado,
        c.puntaje_alumno1, c.puntaje_alumno2,
        a1.nombre_alumno AS alumno1_nombre,
        a2.nombre_alumno AS alumno2_nombre,
        m.nombre AS modalidad_nombre
      FROM torneo_combates c
      LEFT JOIN alumnos a1 ON a1.id = c.alumno1_id
      LEFT JOIN alumnos a2 ON a2.id = c.alumno2_id
      LEFT JOIN torneo_modalidades m ON m.id = c.modalidad_id
      WHERE c.torneo_id = $1
      ORDER BY c.hora
    `, [torneoId]);

    res.json({ pistas, combates });
  } catch (err) {
    console.error('GET /torneo/pistas error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /combates/:combateId/puntaje — Public: update match score
router.put('/combates/:combateId/puntaje', async (req, res) => {
  try {
    const { combateId } = req.params;
    const { puntaje_alumno1, puntaje_alumno2 } = req.body;

    if (puntaje_alumno1 == null && puntaje_alumno2 == null) {
      return res.status(400).json({ error: 'Se requiere al menos un puntaje' });
    }

    const sets = [];
    const params = [];
    let idx = 1;

    if (puntaje_alumno1 != null) { sets.push(`puntaje_alumno1 = $${idx++}`); params.push(puntaje_alumno1); }
    if (puntaje_alumno2 != null) { sets.push(`puntaje_alumno2 = $${idx++}`); params.push(puntaje_alumno2); }

    params.push(combateId);

    const result = await queryOne(
      `UPDATE torneo_combates SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!result) return res.status(404).json({ error: 'Combate no encontrado' });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('PUT /combates/puntaje error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /combates/:combateId/estado — Public: change match state
router.put('/combates/:combateId/estado', async (req, res) => {
  try {
    const { combateId } = req.params;
    const { estado, ganador_id } = req.body;

    if (!estado || !['pendiente', 'en_curso', 'finalizado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // If finalizing, auto-determine winner from scores
    let finalGanador = ganador_id || null;
    if (estado === 'finalizado' && !finalGanador) {
      const combate = await queryOne('SELECT alumno1_id, alumno2_id, puntaje_alumno1, puntaje_alumno2 FROM torneo_combates WHERE id = $1', [combateId]);
      if (combate) {
        if (combate.puntaje_alumno1 > combate.puntaje_alumno2) finalGanador = combate.alumno1_id;
        else if (combate.puntaje_alumno2 > combate.puntaje_alumno1) finalGanador = combate.alumno2_id;
        // If tie, ganador stays null
      }
    }

    const result = await queryOne(
      `UPDATE torneo_combates SET estado = $1, ganador_id = $2 WHERE id = $3 RETURNING *`,
      [estado, finalGanador, combateId]
    );

    if (!result) return res.status(404).json({ error: 'Combate no encontrado' });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('PUT /combates/estado error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
