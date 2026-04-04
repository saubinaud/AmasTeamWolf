const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// POST /api/implementos — Registrar pedido de implementos
router.post('/', async (req, res) => {
  try {
    const d = req.body;

    // Guardar pedido en tabla pagos (como pago de implementos)
    // o en leads como registro de pedido
    await pool.query(
      `INSERT INTO leads (nombre_apoderado, correo, estado, plataforma, campana, campana_id)
       VALUES ($1, $2, 'Pedido Implementos', 'Web', $3, $4)`,
      [
        d.email || 'sin-email',
        d.email || '',
        d.metodoPago || 'No especificado',
        JSON.stringify({
          productos: d.productos,
          total: d.total,
          estado: d.estado,
          fecha: d.fechaPedido,
        }),
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error en pedido de implementos:', err);
    res.status(500).json({ success: false, error: 'Error registrando pedido' });
  }
});

module.exports = router;
