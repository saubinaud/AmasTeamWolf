const { Router } = require('express');
const { pool } = require('../db');
const { generarPDFContrato } = require('../pdfContrato');

const router = Router();

// POST /api/contratos/generar — Generar PDF de contrato firmado
router.post('/generar', async (req, res) => {
  try {
    const { inscripcion_id, firma_base64, datos } = req.body;

    if (!datos) {
      return res.status(400).json({ error: 'Datos son requeridos' });
    }

    const pdfBuffer = await generarPDFContrato(datos, firma_base64 || null);
    const pdfBase64 = pdfBuffer.toString('base64');

    if (inscripcion_id) {
      await pool.query(
        `INSERT INTO contratos (inscripcion_id, archivo_url, firmado, fecha_firma)
         VALUES ($1, $2, TRUE, CURRENT_DATE)
         ON CONFLICT (inscripcion_id) DO UPDATE SET archivo_url = $2, firmado = TRUE, fecha_firma = CURRENT_DATE`,
        [inscripcion_id, `pdf:${pdfBase64.substring(0, 50)}...`]
      );
    }

    res.json({
      success: true,
      pdf_base64: pdfBase64,
      filename: `contrato_${datos.nombreAlumno?.replace(/\s+/g, '_') || 'alumno'}_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (err) {
    console.error('Error generando contrato:', err);
    res.status(500).json({ error: 'Error generando contrato' });
  }
});

module.exports = router;
