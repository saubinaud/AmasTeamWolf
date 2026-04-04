const { Router } = require('express');
const { pool, queryOne } = require('../db');
const PDFDocument = require('pdfkit');

const router = Router();

// POST /api/contratos/generar — Generar PDF de contrato firmado
// Body: { inscripcion_id, firma_base64, datos }
router.post('/generar', async (req, res) => {
  try {
    const { inscripcion_id, firma_base64, datos } = req.body;

    if (!firma_base64 || !datos) {
      return res.status(400).json({ error: 'Firma y datos son requeridos' });
    }

    // Generar PDF en memoria
    const pdfBuffer = await generarPDFContrato(datos, firma_base64);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Guardar en tabla contratos si hay inscripcion_id
    if (inscripcion_id) {
      await pool.query(
        `INSERT INTO contratos (inscripcion_id, archivo_url, firmado, fecha_firma)
         VALUES ($1, $2, TRUE, CURRENT_DATE)
         ON CONFLICT (inscripcion_id) DO UPDATE SET archivo_url = $2, firmado = TRUE, fecha_firma = CURRENT_DATE`,
        [inscripcion_id, `data:application/pdf;base64,${pdfBase64.substring(0, 50)}...`]
      );
    }

    // Devolver PDF como base64 para descarga
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

// Generar PDF del contrato
function generarPDFContrato(datos, firmaBase64) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const d = datos;
    const hoy = new Date().toLocaleDateString('es-PE', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // ── ENCABEZADO ──
    doc.fontSize(18).font('Helvetica-Bold')
       .text('AMAS TEAM WOLF', { align: 'center' });
    doc.fontSize(10).font('Helvetica')
       .text('Academia de Artes Marciales', { align: 'center' });
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#FA7B21');
    doc.moveDown(0.5);

    doc.fontSize(14).font('Helvetica-Bold')
       .text('CONTRATO DE INSCRIPCIÓN', { align: 'center' });
    doc.moveDown(1);

    // ── DATOS DEL CONTRATO ──
    doc.fontSize(10).font('Helvetica');

    doc.text(`Lima, ${hoy}`, { align: 'right' });
    doc.moveDown(1);

    // Datos del apoderado
    doc.font('Helvetica-Bold').text('DATOS DEL APODERADO');
    doc.font('Helvetica');
    doc.text(`Nombre: ${d.nombrePadre || '—'}`);
    doc.text(`DNI: ${d.dniPadre || '—'}`);
    doc.text(`Correo: ${d.email || '—'}`);
    doc.text(`Teléfono: ${d.telefono || '—'}`);
    doc.text(`Dirección: ${d.direccion || '—'}`);
    doc.moveDown(0.8);

    // Datos del alumno
    doc.font('Helvetica-Bold').text('DATOS DEL ALUMNO');
    doc.font('Helvetica');
    doc.text(`Nombre: ${d.nombreAlumno || '—'}`);
    doc.text(`DNI: ${d.dniAlumno || '—'}`);
    doc.text(`Fecha de nacimiento: ${d.fechaNacimiento || '—'}`);
    doc.text(`Categoría: ${d.categoriaAlumno || '—'}`);
    doc.moveDown(0.8);

    // Datos del programa
    doc.font('Helvetica-Bold').text('PROGRAMA CONTRATADO');
    doc.font('Helvetica');
    doc.text(`Programa: ${d.programa || '—'}`);
    doc.text(`Fecha inicio: ${d.fechaInicio || '—'}`);
    doc.text(`Fecha fin: ${d.fechaFin || '—'}`);
    doc.text(`Clases totales: ${d.clasesTotales || '—'}`);
    doc.text(`Turno: ${d.turnoSeleccionado || '—'}`);
    doc.text(`Días: ${d.diasTentativos || '—'}`);
    doc.moveDown(0.5);

    doc.text(`Precio del programa: S/ ${d.precioPrograma || '0.00'}`);
    doc.text(`Descuento aplicado: S/ ${d.descuentoDinero || '0.00'}`);
    doc.font('Helvetica-Bold')
       .text(`Total a pagar: S/ ${d.total || d.precioPrograma || '0.00'}`);
    doc.moveDown(1);

    // ── CLÁUSULAS ──
    doc.font('Helvetica-Bold').text('TÉRMINOS Y CONDICIONES');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9);

    const clausulas = [
      'El apoderado se compromete a respetar los horarios establecidos y comunicar cualquier inasistencia con anticipación.',
      'La matrícula incluye el uso de las instalaciones de la academia durante las clases programadas. El uniforme y equipamiento corren por cuenta del apoderado según el programa contratado.',
      'En caso de retiro voluntario, no se realizarán devoluciones del monto pagado. Las clases no utilizadas no son transferibles ni acumulables para otro período.',
      'La academia se reserva el derecho de modificar horarios previa comunicación con al menos 48 horas de anticipación.',
      'El apoderado autoriza el uso de fotografías y videos tomados durante las clases para fines institucionales y promocionales de la academia.',
      'La academia no se responsabiliza por objetos de valor olvidados en las instalaciones.',
      'El apoderado declara que el alumno se encuentra en condiciones de salud aptas para la práctica de artes marciales y asume la responsabilidad de informar cualquier condición médica relevante.',
      'El presente contrato tiene vigencia desde la fecha de inicio hasta la fecha de fin del programa contratado.',
    ];

    clausulas.forEach((c, i) => {
      doc.text(`${i + 1}. ${c}`, { indent: 10 });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);

    // ── DECLARACIÓN ──
    doc.fontSize(10).font('Helvetica');
    doc.text(
      `Yo, ${d.nombrePadre || '_______________'}, identificado(a) con DNI ${d.dniPadre || '________'}, ` +
      `declaro haber leído y aceptado todas las condiciones establecidas en el presente contrato ` +
      `para la inscripción de ${d.nombreAlumno || '_______________'} en el programa ${d.programa || '_______________'} ` +
      `de AMAS Team Wolf.`
    );
    doc.moveDown(1.5);

    // ── FIRMA ──
    doc.font('Helvetica-Bold').text('Firma del apoderado:', { continued: false });
    doc.moveDown(0.5);

    // Insertar imagen de firma
    if (firmaBase64) {
      try {
        // Quitar el prefijo data:image/png;base64, si existe
        const base64Clean = firmaBase64.replace(/^data:image\/\w+;base64,/, '');
        const firmaBuffer = Buffer.from(base64Clean, 'base64');
        doc.image(firmaBuffer, doc.x, doc.y, { width: 200, height: 80 });
        doc.moveDown(5);
      } catch (e) {
        doc.text('[Firma digital adjunta]');
        doc.moveDown(1);
      }
    }

    doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica')
       .text(`${d.nombrePadre || 'Apoderado'}  —  DNI: ${d.dniPadre || '—'}`);
    doc.text(`Fecha: ${hoy}`);

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999')
       .text('Documento generado digitalmente por AMAS Team Wolf', { align: 'center' });
    doc.text(`ID: ${Date.now()}`, { align: 'center' });

    doc.end();
  });
}

module.exports = router;
