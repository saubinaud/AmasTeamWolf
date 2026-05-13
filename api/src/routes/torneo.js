const { Router } = require('express');
const { query, queryOne, pool } = require('../db');
const { AlumnoService, InscripcionService } = require('../services');

const router = Router();

// ── Price calculation (uses DB values, falls back to defaults) ──
function calcularPrecio(cantidadModalidades, torneo = null) {
  if (cantidadModalidades <= 0) return 0;
  const p1 = parseFloat(torneo?.precio_1) || 100;
  const p2 = parseFloat(torneo?.precio_2) || 150;
  const p3 = parseFloat(torneo?.precio_3) || 200;
  const p4 = parseFloat(torneo?.precio_4) || 250;
  if (cantidadModalidades === 1) return p1;
  if (cantidadModalidades === 2) return p2;
  if (cantidadModalidades === 3) return p3;
  return p4; // 4+
}

const DESCUENTO_LEADERSHIP = { aplica_en: 4, porcentaje: 50 };

// GET /api/torneo/activo — Active tournament with modalidades
router.get('/activo', async (req, res) => {
  try {
    const torneo = await queryOne(`
      SELECT * FROM torneos_config
      WHERE activo = TRUE
      ORDER BY fecha DESC NULLS LAST
      LIMIT 1
    `);

    const defaultPrecios = { 1: 100, 2: 150, 3: 200, 4: 250 };

    if (!torneo) {
      return res.json({ torneo: null, modalidades: [], precios: defaultPrecios, descuento_leadership: DESCUENTO_LEADERSHIP });
    }

    const modalidades = await query(`
      SELECT * FROM torneo_modalidades
      WHERE torneo_id = $1 AND activo = TRUE
      ORDER BY orden ASC, id ASC
    `, [torneo.id]);

    const precios = {
      1: parseFloat(torneo.precio_1) || 100,
      2: parseFloat(torneo.precio_2) || 150,
      3: parseFloat(torneo.precio_3) || 200,
      4: parseFloat(torneo.precio_4) || 250,
    };

    res.json({
      torneo,
      modalidades,
      precios,
      descuento_leadership: DESCUENTO_LEADERSHIP,
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

    // Check if Leadership
    const leadershipRow = await queryOne(`
      SELECT programa FROM inscripciones
      WHERE alumno_id = $1
        AND LOWER(programa) LIKE '%leadership%'
        AND estado = 'Activo'
      LIMIT 1
    `, [alumno.id]);
    const es_leadership = !!leadershipRow;

    res.json({
      encontrado: true,
      alumno: {
        id: alumno.id,
        nombre: alumno.nombre_alumno,
        dni: alumno.dni_alumno,
        categoria: alumno.categoria,
      },
      implementos,
      es_leadership,
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

    const invalidas = modalidades.filter(m => !nombresValidos.has(m));
    if (invalidas.length > 0) {
      return res.status(400).json({ success: false, error: `Modalidades inválidas: ${invalidas.join(', ')}` });
    }

    // Calculate price
    let precio_total = calcularPrecio(modalidades.length, torneo);

    // Check Leadership discount
    const leadershipRow = await queryOne(`
      SELECT programa FROM inscripciones
      WHERE alumno_id = $1
        AND LOWER(programa) LIKE '%leadership%'
        AND estado = 'Activo'
      LIMIT 1
    `, [alumno.id]);
    const es_leadership = !!leadershipRow;

    let descuento = 0;
    let descuento_tipo = null;
    if (es_leadership && modalidades.length >= DESCUENTO_LEADERSHIP.aplica_en) {
      descuento = Math.round(precio_total * (DESCUENTO_LEADERSHIP.porcentaje / 100));
      descuento_tipo = 'leadership_50';
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
    for (const nombre of modalidades) {
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
      modalidades,
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

module.exports = router;
