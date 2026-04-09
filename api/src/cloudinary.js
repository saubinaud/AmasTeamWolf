// Almacenamiento de contratos PDF: BD (para servir) + disco (backup local)
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

// Directorio local para backup de PDFs
const CONTRATOS_DIR = process.env.CONTRATOS_DIR || '/opt/amas-contratos';

// Asegurar que el directorio existe
try { fs.mkdirSync(CONTRATOS_DIR, { recursive: true }); } catch (_) {}

/**
 * Guarda el PDF en BD + disco y retorna la URL del endpoint.
 * @param {Buffer} pdfBuffer - PDF generado por pdfContrato.js
 * @param {string} nombreArchivo - nombre descriptivo (sin extension)
 * @param {number} inscripcionId - ID de la inscripcion asociada
 * @returns {string|null} URL para ver/descargar el PDF
 */
async function guardarContratoPDF(pdfBuffer, nombreArchivo, inscripcionId) {
  try {
    // 1. Insert primero para obtener el ID
    const baseUrl = process.env.API_PUBLIC_URL || 'https://amas-api.s6hx3x.easypanel.host';

    const result = await pool.query(
      `INSERT INTO contratos (inscripcion_id, archivo_url, firmado, fecha_firma, pdf_data)
       VALUES ($1, $2, TRUE, CURRENT_DATE, $3)
       ON CONFLICT (inscripcion_id)
       DO UPDATE SET archivo_url = $2, firmado = TRUE, fecha_firma = CURRENT_DATE, pdf_data = $3
       RETURNING id`,
      [inscripcionId, 'pending', pdfBuffer]
    );

    const contratoId = result.rows[0].id;
    const url = `${baseUrl}/api/contratos/${contratoId}/pdf`;

    // 2. Actualizar archivo_url con la URL completa clickeable
    await pool.query(
      'UPDATE contratos SET archivo_url = $1 WHERE id = $2',
      [url, contratoId]
    );

    // 3. Guardar en disco (backup local)
    const filename = `${nombreArchivo}.pdf`;
    const filepath = path.join(CONTRATOS_DIR, filename);
    fs.writeFileSync(filepath, pdfBuffer);
    console.log(`Contrato guardado: BD id=${contratoId} + disco ${filepath}`);

    return url;
  } catch (err) {
    console.error('Error guardando contrato PDF:', err.message);
    return null;
  }
}

module.exports = { guardarContratoPDF };
