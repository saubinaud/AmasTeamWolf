const { Router } = require('express');
const { query, queryOne } = require('../db');
const bcrypt = require('bcrypt');

const router = Router();

// ─── USUARIOS ────────────────────────────────────────────────

// Páginas Space válidas (para validar permisos)
const PAGINAS_VALIDAS = [
  'dashboard', 'alumnos', 'inscripciones', 'inscribir', 'renovar',
  'graduaciones', 'asistencia', 'tomar-asistencia', 'asistencia-historica',
  'leads', 'compras', 'profesores', 'clases-prueba', 'mensajes', 'config',
];

function normalizarPermisos(raw) {
  if (raw === null || raw === undefined) return null; // null = admin con acceso total
  if (!Array.isArray(raw)) return null;
  const filtrado = raw.filter((p) => PAGINAS_VALIDAS.includes(p));
  return filtrado.length > 0 ? filtrado : [];
}

// GET /usuarios — list all (exclude password_hash)
router.get('/usuarios', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, nombre, email, rol, activo, permisos, ultimo_login, created_at
       FROM space_usuarios
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /usuarios error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
  }
});

// POST /usuarios — create user
router.post('/usuarios', async (req, res) => {
  try {
    const { nombre, email, password, rol, permisos } = req.body;
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos: nombre, email, password, rol' });
    }
    if (!['admin', 'profesor'].includes(rol)) {
      return res.status(400).json({ success: false, error: 'Rol inválido. Debe ser admin o profesor' });
    }

    const existing = await queryOne('SELECT id FROM space_usuarios WHERE email = $1', [email]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Ya existe un usuario con ese email' });
    }

    // Admin por defecto: permisos NULL (acceso total)
    // Profesor: usa lo que envíe el admin, o [] (sin acceso) si no envía nada
    const permisosNormalizados = rol === 'admin' ? null : normalizarPermisos(permisos) ?? [];

    const password_hash = await bcrypt.hash(password, 10);
    const row = await queryOne(
      `INSERT INTO space_usuarios (nombre, email, password_hash, rol, permisos)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, rol, activo, permisos, created_at`,
      [nombre, email, password_hash, rol, permisosNormalizados ? JSON.stringify(permisosNormalizados) : null]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error('POST /usuarios error:', err);
    res.status(500).json({ success: false, error: 'Error al crear usuario' });
  }
});

// PUT /usuarios/:id — update (not password)
router.put('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, activo, permisos } = req.body;

    const existing = await queryOne('SELECT id FROM space_usuarios WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (rol && !['admin', 'profesor'].includes(rol)) {
      return res.status(400).json({ success: false, error: 'Rol inválido. Debe ser admin o profesor' });
    }

    if (email) {
      const dup = await queryOne('SELECT id FROM space_usuarios WHERE email = $1 AND id != $2', [email, id]);
      if (dup) {
        return res.status(409).json({ success: false, error: 'Ya existe otro usuario con ese email' });
      }
    }

    // Permisos: si vienen, normalizar. Si rol resulta admin, forzar NULL.
    let permisosUpdate;
    const rolFinal = rol || existing.rol;
    if (permisos !== undefined) {
      if (rolFinal === 'admin') {
        permisosUpdate = null; // admin siempre tiene acceso total
      } else {
        const normalizados = normalizarPermisos(permisos);
        permisosUpdate = normalizados ? JSON.stringify(normalizados) : null;
      }
    }

    const row = await queryOne(
      `UPDATE space_usuarios
       SET nombre  = COALESCE($1, nombre),
           email   = COALESCE($2, email),
           rol     = COALESCE($3, rol),
           activo  = COALESCE($4, activo),
           permisos = ${permisosUpdate === undefined ? 'permisos' : '$6'}
       WHERE id = $5
       RETURNING id, nombre, email, rol, activo, permisos, ultimo_login, created_at`,
      permisosUpdate === undefined
        ? [nombre || null, email || null, rol || null, activo !== undefined ? activo : null, id]
        : [nombre || null, email || null, rol || null, activo !== undefined ? activo : null, id, permisosUpdate]
    );
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('PUT /usuarios/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
  }
});

// PUT /usuarios/:id/password — change password only
router.put('/usuarios/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Se requiere el campo password' });
    }

    const existing = await queryOne('SELECT id FROM space_usuarios WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await query('UPDATE space_usuarios SET password_hash = $1 WHERE id = $2', [password_hash, id]);

    res.json({ success: true, data: { message: 'Contraseña actualizada' } });
  } catch (err) {
    console.error('PUT /usuarios/:id/password error:', err);
    res.status(500).json({ success: false, error: 'Error al cambiar contraseña' });
  }
});

// DELETE /usuarios/:id — soft delete
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(
      `UPDATE space_usuarios SET activo = false WHERE id = $1 RETURNING id, nombre, email`,
      [id]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('DELETE /usuarios/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al desactivar usuario' });
  }
});

// ─── SEDES ───────────────────────────────────────────────────

// GET /sedes — list all
router.get('/sedes', async (req, res) => {
  try {
    const rows = await query('SELECT id, nombre, direccion, activa, created_at FROM sedes ORDER BY nombre');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /sedes error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener sedes' });
  }
});

// POST /sedes — create
router.post('/sedes', async (req, res) => {
  try {
    const { nombre, direccion } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El campo nombre es requerido' });
    }
    const row = await queryOne(
      `INSERT INTO sedes (nombre, direccion)
       VALUES ($1, $2)
       RETURNING id, nombre, direccion, activa, created_at`,
      [nombre, direccion || null]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error('POST /sedes error:', err);
    res.status(500).json({ success: false, error: 'Error al crear sede' });
  }
});

// PUT /sedes/:id — update
router.put('/sedes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, activa } = req.body;

    const row = await queryOne(
      `UPDATE sedes
       SET nombre    = COALESCE($1, nombre),
           direccion = COALESCE($2, direccion),
           activa    = COALESCE($3, activa)
       WHERE id = $4
       RETURNING id, nombre, direccion, activa, created_at`,
      [nombre || null, direccion || null, activa !== undefined ? activa : null, id]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('PUT /sedes/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar sede' });
  }
});

// DELETE /sedes/:id — soft delete
router.delete('/sedes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(
      `UPDATE sedes SET activa = false WHERE id = $1 RETURNING id, nombre`,
      [id]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('DELETE /sedes/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al desactivar sede' });
  }
});

// ─── HORARIOS ────────────────────────────────────────────────

// GET /horarios — list all (optional ?sede_id filter), JOIN sedes
router.get('/horarios', async (req, res) => {
  try {
    const { sede_id } = req.query;
    let sql = `
      SELECT h.id, h.sede_id, s.nombre AS sede_nombre,
             h.dia_semana, h.hora_inicio, h.hora_fin,
             h.nombre_clase, h.capacidad, h.instructor,
             h.activo, h.created_at
      FROM horarios h
      JOIN sedes s ON s.id = h.sede_id
    `;
    const params = [];

    if (sede_id) {
      sql += ' WHERE h.sede_id = $1';
      params.push(sede_id);
    }

    sql += ' ORDER BY h.sede_id, h.dia_semana, h.hora_inicio';

    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /horarios error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener horarios' });
  }
});

// GET /horarios/por-sede/:sedeId — grouped by dia_semana
router.get('/horarios/por-sede/:sedeId', async (req, res) => {
  try {
    const { sedeId } = req.params;
    const rows = await query(
      `SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fin,
              h.nombre_clase, h.capacidad, h.instructor, h.activo
       FROM horarios h
       WHERE h.sede_id = $1
       ORDER BY h.dia_semana, h.hora_inicio`,
      [sedeId]
    );

    const diasNombre = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const grouped = {};
    for (const row of rows) {
      const key = diasNombre[row.dia_semana] || `Día ${row.dia_semana}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }

    res.json({ success: true, data: grouped });
  } catch (err) {
    console.error('GET /horarios/por-sede/:sedeId error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener horarios por sede' });
  }
});

// POST /horarios — create
router.post('/horarios', async (req, res) => {
  try {
    const { sede_id, dia_semana, hora_inicio, hora_fin, nombre_clase, capacidad, instructor } = req.body;

    if (!sede_id || dia_semana === undefined || !hora_inicio || !hora_fin || !nombre_clase) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: sede_id, dia_semana, hora_inicio, hora_fin, nombre_clase'
      });
    }

    if (dia_semana < 0 || dia_semana > 6) {
      return res.status(400).json({ success: false, error: 'dia_semana debe estar entre 0 y 6' });
    }

    const sede = await queryOne('SELECT id FROM sedes WHERE id = $1', [sede_id]);
    if (!sede) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada' });
    }

    const row = await queryOne(
      `INSERT INTO horarios (sede_id, dia_semana, hora_inicio, hora_fin, nombre_clase, capacidad, instructor)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, sede_id, dia_semana, hora_inicio, hora_fin, nombre_clase, capacidad, instructor, activo, created_at`,
      [sede_id, dia_semana, hora_inicio, hora_fin, nombre_clase, capacidad || null, instructor || null]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error('POST /horarios error:', err);
    res.status(500).json({ success: false, error: 'Error al crear horario' });
  }
});

// PUT /horarios/:id — update
router.put('/horarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sede_id, dia_semana, hora_inicio, hora_fin, nombre_clase, capacidad, instructor, activo } = req.body;

    if (dia_semana !== undefined && (dia_semana < 0 || dia_semana > 6)) {
      return res.status(400).json({ success: false, error: 'dia_semana debe estar entre 0 y 6' });
    }

    if (sede_id) {
      const sede = await queryOne('SELECT id FROM sedes WHERE id = $1', [sede_id]);
      if (!sede) {
        return res.status(404).json({ success: false, error: 'Sede no encontrada' });
      }
    }

    const row = await queryOne(
      `UPDATE horarios
       SET sede_id      = COALESCE($1, sede_id),
           dia_semana   = COALESCE($2, dia_semana),
           hora_inicio  = COALESCE($3, hora_inicio),
           hora_fin     = COALESCE($4, hora_fin),
           nombre_clase = COALESCE($5, nombre_clase),
           capacidad    = COALESCE($6, capacidad),
           instructor   = COALESCE($7, instructor),
           activo       = COALESCE($8, activo)
       WHERE id = $9
       RETURNING id, sede_id, dia_semana, hora_inicio, hora_fin, nombre_clase, capacidad, instructor, activo, created_at`,
      [
        sede_id || null,
        dia_semana !== undefined ? dia_semana : null,
        hora_inicio || null,
        hora_fin || null,
        nombre_clase || null,
        capacidad !== undefined ? capacidad : null,
        instructor || null,
        activo !== undefined ? activo : null,
        id
      ]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Horario no encontrado' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('PUT /horarios/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar horario' });
  }
});

// DELETE /horarios/:id — soft delete
router.delete('/horarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(
      `UPDATE horarios SET activo = false WHERE id = $1 RETURNING id, nombre_clase`,
      [id]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Horario no encontrado' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('DELETE /horarios/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al desactivar horario' });
  }
});

module.exports = router;
