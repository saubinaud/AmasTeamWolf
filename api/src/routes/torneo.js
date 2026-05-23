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

module.exports = router;
