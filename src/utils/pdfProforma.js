const PDFDocument = require('pdfkit');

/**
 * Genera el PDF de una proforma y lo retorna como Buffer.
 * @param {Object} proforma  - Objeto proforma con items y client_name
 * @param {string} businessName - Nombre del negocio (del header)
 */
function generateProformaPDF(proforma, businessName = 'Velas Artesanales') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', b => buffers.push(b));
    doc.on('end',  () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = 495; // ancho útil (595 - 2*50)
    const brown = '#8B5E3C';
    const darkBrown = '#6B4423';
    const gray = '#6b7280';
    const lightGray = '#f3f4f6';

    // ── ENCABEZADO ──────────────────────────────────────────────
    doc.fillColor(brown)
       .fontSize(22).font('Helvetica-Bold')
       .text(businessName, 50, 50, { align: 'center', width: W });

    doc.fillColor(darkBrown)
       .fontSize(11).font('Helvetica')
       .text('PROFORMA', 50, doc.y + 2, { align: 'center', width: W });

    doc.moveDown(1);

    // ── DATOS DE LA PROFORMA ────────────────────────────────────
    const infoY = doc.y;
    const fecha = new Date(proforma.created_at).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    doc.fillColor('#1a1a2e').fontSize(9).font('Helvetica');
    doc.text(`N°: ${String(proforma.id).padStart(4, '0')}`, 50,  infoY);
    doc.text(`Fecha: ${fecha}`,                               50,  infoY + 13);
    doc.text(`Cliente: ${proforma.client_name}`,              50,  infoY + 26);

    if (proforma.notes) {
      doc.text(`Notas: ${proforma.notes}`, 50, infoY + 39);
    }

    doc.moveDown(2.5);

    // ── LÍNEA SEPARADORA ────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(brown).lineWidth(1.5).stroke();
    doc.moveDown(0.6);

    // ── CABECERA DE TABLA ────────────────────────────────────────
    const col = { desc: 50, qty: 330, price: 390, sub: 460 };
    const rowH = 13;
    const headerY = doc.y;

    doc.fillColor(lightGray)
       .rect(50, headerY - 4, W, rowH + 4).fill();

    doc.fillColor(gray).fontSize(8).font('Helvetica-Bold');
    doc.text('DESCRIPCIÓN',        col.desc,  headerY, { width: 270 });
    doc.text('CANT.',              col.qty,   headerY, { width: 50,  align: 'right' });
    doc.text('P. UNIT.',           col.price, headerY, { width: 60,  align: 'right' });
    doc.text('SUBTOTAL',           col.sub,   headerY, { width: 80,  align: 'right' });

    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

    // ── ÍTEMS ────────────────────────────────────────────────────
    doc.fillColor('#374151').fontSize(9).font('Helvetica');

    for (const item of proforma.items) {
      const label = item.description || item.product_name || '—';
      const itemY = doc.y + 4;

      // Descripción puede ser larga — medir altura
      const descHeight = doc.heightOfString(label, { width: 270 });
      const rowHeight  = Math.max(rowH, descHeight) + 6;

      doc.text(label,
        col.desc, itemY,
        { width: 270, lineBreak: true }
      );

      // Alinear las otras columnas al centro de la fila
      const midY = itemY + (rowHeight - 10) / 2;
      doc.text(Number(item.quantity).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 3 }),
        col.qty, midY, { width: 50, align: 'right' });
      doc.text(`S/ ${Number(item.unit_price).toFixed(2)}`,
        col.price, midY, { width: 60, align: 'right' });
      doc.text(`S/ ${Number(item.subtotal).toFixed(2)}`,
        col.sub, midY, { width: 80, align: 'right' });

      doc.y = itemY + rowHeight;
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#f3f4f6').lineWidth(0.5).stroke();
    }

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(brown).lineWidth(1).stroke();
    doc.moveDown(0.6);

    // ── TOTALES ──────────────────────────────────────────────────
    const totLabelX = 360;
    const totValX   = 460;
    const totW      = 85;

    const drawTotalRow = (label, value, bold = false, color = '#374151') => {
      const y = doc.y;
      doc.fillColor(gray).fontSize(9).font('Helvetica').text(label, totLabelX, y, { width: 90, align: 'right' });
      doc.fillColor(color).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(value, totValX, y, { width: totW, align: 'right' });
      doc.moveDown(0.35);
    };

    drawTotalRow('Subtotal:', `S/ ${Number(proforma.subtotal).toFixed(2)}`);

    if (Number(proforma.labor_cost) > 0) {
      drawTotalRow('Mano de obra:', `S/ ${Number(proforma.labor_cost).toFixed(2)}`);
    }
    if (Number(proforma.discount) > 0) {
      drawTotalRow('Descuento:', `- S/ ${Number(proforma.discount).toFixed(2)}`, false, '#dc2626');
    }

    // Separador antes del total
    doc.moveTo(totLabelX, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    drawTotalRow('TOTAL:', `S/ ${Number(proforma.total).toFixed(2)}`, true, brown);

    // ── PIE DE PÁGINA ────────────────────────────────────────────
    doc.fillColor(gray).fontSize(8).font('Helvetica')
       .text(
         `Documento generado el ${new Date().toLocaleDateString('es-PE')}`,
         50, 750, { align: 'center', width: W }
       );

    doc.end();
  });
}

module.exports = { generateProformaPDF };
