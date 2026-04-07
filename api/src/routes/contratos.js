const { Router } = require('express');
const { pool, queryOne } = require('../db');
const { generarPDFContrato } = require('../pdfContrato');

const router = Router();

// GET /api/contratos/:id/pdf — Servir PDF del contrato (ver en navegador)
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const contrato = await queryOne(
      'SELECT pdf_data, archivo_url FROM contratos WHERE id = $1',
      [id]
    );

    if (!contrato || !contrato.pdf_data) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const filename = (contrato.archivo_url || 'contrato').replace(/[^a-zA-Z0-9_-]/g, '_');

    // Content-Disposition: inline → se visualiza en el navegador
    // El usuario puede descargar desde el visor PDF del navegador
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);
    res.setHeader('Content-Length', contrato.pdf_data.length);
    res.send(contrato.pdf_data);
  } catch (err) {
    console.error('Error sirviendo contrato PDF:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/contratos/:id/descargar — Forzar descarga del PDF
router.get('/:id/descargar', async (req, res) => {
  try {
    const { id } = req.params;
    const contrato = await queryOne(
      'SELECT pdf_data, archivo_url FROM contratos WHERE id = $1',
      [id]
    );

    if (!contrato || !contrato.pdf_data) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const filename = (contrato.archivo_url || 'contrato').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.setHeader('Content-Length', contrato.pdf_data.length);
    res.send(contrato.pdf_data);
  } catch (err) {
    console.error('Error descargando contrato:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/contratos/generar — Generar PDF de contrato firmado (endpoint directo)
router.post('/generar', async (req, res) => {
  try {
    const { inscripcion_id, firma_base64, datos } = req.body;

    if (!datos) {
      return res.status(400).json({ error: 'Datos son requeridos' });
    }

    const pdfBuffer = await generarPDFContrato(datos, firma_base64 || null);

    if (inscripcion_id) {
      await pool.query(
        `INSERT INTO contratos (inscripcion_id, archivo_url, firmado, fecha_firma, pdf_data)
         VALUES ($1, $2, TRUE, CURRENT_DATE, $3)
         ON CONFLICT (inscripcion_id) DO UPDATE SET archivo_url = $2, firmado = TRUE, fecha_firma = CURRENT_DATE, pdf_data = $3`,
        [inscripcion_id, datos.nombreAlumno || 'contrato', pdfBuffer]
      );
    }

    res.json({
      success: true,
      pdf_base64: pdfBuffer.toString('base64'),
      filename: `contrato_${(datos.nombreAlumno || 'alumno').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (err) {
    console.error('Error generando contrato:', err);
    res.status(500).json({ error: 'Error generando contrato' });
  }
});

module.exports = router;
