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
       .text('CONTRATO DE INSCRIPCIÓN Y PRESTACIÓN DE SERVICIOS', { align: 'center' });
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
    doc.font('Helvetica-Bold').fontSize(10).text('TÉRMINOS Y CONDICIONES');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9);

    const clausulas = [
      'OBJETO DEL CONTRATO. AMAS Team Wolf se compromete a brindar al menor alumno los servicios de enseñanza de Taekwondo conforme al programa seleccionado, según el calendario y horario acordados al momento de la inscripción.',

      'VIGENCIA. El presente contrato tiene vigencia desde la fecha de inicio hasta la fecha de fin del programa contratado, según los datos indicados en la sección "Programa Contratado" del presente documento.',

      'PAGO. El monto total del programa deberá abonarse de forma completa antes del inicio de clases mediante los medios de pago habilitados por AMAS Team Wolf (transferencia bancaria, Yape, Plin u otro medio autorizado). No se iniciará ningún programa sin confirmación del pago.',

      'POLÍTICA DE NO CANCELACIONES Y NO REEMBOLSOS. El apoderado declara conocer y aceptar expresamente que: (a) una vez realizado el pago e iniciado el período de clases, no se aceptarán cancelaciones del contrato por ningún motivo; (b) AMAS Team Wolf no realizará devoluciones totales ni parciales del monto abonado; (c) el abandono voluntario del programa no dará lugar a compensación económica ni crédito para períodos futuros; (d) la inasistencia del alumno por motivos personales no genera derecho a clases de recuperación ni a descuento en el precio del programa.',

      'EXCEPCIONES Y CONGELAMIENTOS. AMAS Team Wolf podrá, a su exclusivo criterio y previa solicitud documentada del apoderado, ofrecer congelamiento temporal del programa por razones de salud debidamente acreditadas con certificado médico, o traslado de crédito a un período futuro en casos de fuerza mayor debidamente justificado. Estas excepciones no son automáticas y quedan sujetas a aprobación de la dirección de AMAS Team Wolf.',

      'HORARIOS Y COMUNICACIONES. La academia se reserva el derecho de modificar horarios previa comunicación con al menos 48 horas de anticipación. El apoderado se compromete a respetar los turnos establecidos y comunicar cualquier inasistencia con anticipación.',

      'ESTADO DE SALUD. El apoderado declara que el alumno se encuentra en condiciones de salud aptas para la práctica de artes marciales y asume la responsabilidad de informar a la academia cualquier condición médica, lesión o limitación física relevante antes del inicio de las clases o en el momento en que se presente.',

      'AUTORIZACIÓN DE IMAGEN. El apoderado autoriza a AMAS Team Wolf a utilizar fotografías y videos del menor tomados durante actividades académicas, competencias o eventos, con fines de comunicación institucional y material promocional, sin que ello genere derecho a compensación económica alguna.',

      'RESPONSABILIDAD. La academia no se responsabiliza por objetos de valor olvidados en las instalaciones. El apoderado asume plena responsabilidad sobre los efectos personales del alumno durante y fuera de las clases.',

      'CONFIDENCIALIDAD. El apoderado se compromete a no divulgar la metodología, materiales didácticos ni información interna de AMAS Team Wolf obtenida en el marco de la relación contractual.',

      'LEY APLICABLE. Para todo lo no previsto en el presente contrato, las partes se someten a la legislación civil peruana y a la competencia de los tribunales de la ciudad de Lima.',
    ];

    clausulas.forEach((c, i) => {
      doc.text(`${i + 1}. ${c}`, { indent: 10, align: 'justify' });
      doc.moveDown(0.4);
    });

    doc.moveDown(1);

    // ── DECLARACIÓN ──
    doc.fontSize(10).font('Helvetica');
    doc.text(
      `Yo, ${d.nombrePadre || '_______________'}, identificado(a) con DNI ${d.dniPadre || '________'}, ` +
      `declaro haber leído, comprendido y aceptado todas las condiciones establecidas en el presente contrato, ` +
      `incluyendo expresamente la Cláusula 4 sobre la política de no cancelaciones y no reembolsos, ` +
      `para la inscripción de ${d.nombreAlumno || '_______________'} en el programa ${d.programa || '_______________'} ` +
      `de AMAS Team Wolf.`,
      { align: 'justify' }
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