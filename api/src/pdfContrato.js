const PDFDocument = require('pdfkit');

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

    doc.font('Helvetica-Bold').text('DATOS DEL APODERADO');
    doc.font('Helvetica');
    doc.text(`Nombre: ${d.nombrePadre || '—'}`);
    doc.text(`DNI: ${d.dniPadre || '—'}`);
    doc.text(`Correo: ${d.email || '—'}`);
    doc.text(`Teléfono: ${d.telefono || '—'}`);
    doc.text(`Dirección: ${d.direccion || '—'}`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('DATOS DEL ALUMNO');
    doc.font('Helvetica');
    doc.text(`Nombre: ${d.nombreAlumno || '—'}`);
    doc.text(`DNI: ${d.dniAlumno || '—'}`);
    doc.text(`Fecha de nacimiento: ${d.fechaNacimiento || '—'}`);
    doc.text(`Categoría: ${d.categoriaAlumno || '—'}`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').text('PROGRAMA CONTRATADO');
    doc.font('Helvetica');
    doc.text(`Programa: ${d.programa || '—'}`);
    doc.text(`Fecha inicio: ${d.fechaInicio || '—'}`);
    doc.text(`Fecha fin: ${d.fechaFin || d.fechaFinal || '—'}`);
    doc.text(`Clases totales: ${d.clasesTotales || '—'}`);
    doc.text(`Turno: ${d.turnoSeleccionado || d.turno || '—'}`);
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

    if (firmaBase64) {
      try {
        const base64Clean = firmaBase64.replace(/^data:image\/\w+;base64,/, '');
        const firmaBuffer = Buffer.from(base64Clean, 'base64');
        doc.image(firmaBuffer, doc.x, doc.y, { width: 200, height: 80 });
        doc.moveDown(5);
      } catch (e) {
        doc.text('[Firma digital adjunta]');
        doc.moveDown(1);
      }
    } else {
      doc.moveDown(3);
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

module.exports = { generarPDFContrato };
