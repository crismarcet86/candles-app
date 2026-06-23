const PDFDocument = require('pdfkit');
const { drawPdfHeader } = require('./pdfHeader');

function generateListPDF({ title, subtitle, headers, widths, aligns, rows, businessName, logoPath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', b => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = 495;
    const brown = '#8B5E3C';
    const gray = '#6b7280';
    const lightGray = '#f3f4f6';

    // Header
    drawPdfHeader(doc, { businessName, logoPath });
    doc.fillColor(gray).fontSize(12).font('Helvetica')
       .text(title.toUpperCase(), 50, doc.y + 4, { align: 'center', width: W });
    if (subtitle) {
      doc.fillColor(gray).fontSize(9)
         .text(subtitle, 50, doc.y + 2, { align: 'center', width: W });
    }
    doc.moveDown(0.6);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(brown).lineWidth(1.5).stroke();
    doc.moveDown(0.8);

    const rowH = 14, padX = 4;
    const xs = [];
    let cx = 50;
    for (const w of widths) { xs.push(cx); cx += w; }

    // Header row
    const headerY = doc.y;
    doc.fillColor(lightGray).rect(50, headerY, W, rowH + 4).fill();
    doc.fillColor(gray).fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, xs[i] + padX, headerY + 3, { width: widths[i] - padX * 2, align: aligns[i] });
    });
    doc.y = headerY + rowH + 4;

    // Data rows
    doc.font('Helvetica').fontSize(8).fillColor('#374151');
    rows.forEach((row, ri) => {
      if (doc.y + rowH + 6 > 780) { doc.addPage(); doc.y = 50; }
      const rowY = doc.y;
      if (ri % 2 === 1) {
        doc.fillColor('#fafafa').rect(50, rowY, W, rowH + 2).fill();
      }
      doc.fillColor('#374151');
      row.forEach((cell, i) => {
        doc.text(String(cell ?? '—'), xs[i] + padX, rowY + 2,
          { width: widths[i] - padX * 2, align: aligns[i], lineBreak: false });
      });
      doc.y = rowY + rowH + 2;
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(0.4).stroke();
    });

    if (rows.length === 0) {
      doc.fillColor(gray).fontSize(9).text('Sin registros.', 50, doc.y + 4);
    }

    const genDate = new Date().toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.fillColor(gray).fontSize(8)
       .text(`Generado el ${genDate}`, 50, 750, { align: 'center', width: W });
    doc.end();
  });
}

module.exports = { generateListPDF };
