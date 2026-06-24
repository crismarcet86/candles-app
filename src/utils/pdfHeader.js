const path = require('path');
const fs   = require('fs');

/**
 * Dibuja el encabezado del negocio (logo + nombre) en el documento PDF.
 * Deja doc.y posicionado después del encabezado para que el caller continúe.
 *
 * @param {PDFDocument} doc
 * @param {Object} opts
 * @param {string} [opts.businessName]
 * @param {string|null} [opts.logoPath]  - filename dentro de public/uploads/
 */
function drawPdfHeader(doc, { businessName = 'Mi Negocio', logoPath = null } = {}) {
  const W       = 495;
  const brown   = '#8B5E3C';
  const START_Y = 36;

  const logoFile = logoPath
    ? path.join(__dirname, '../../public/uploads', logoPath)
    : null;
  const hasLogo = !!(logoFile && fs.existsSync(logoFile));

  if (hasLogo) {
    // Imagen a ancho completo respetando proporciones (máx 70 px de alto)
    // fit mantiene aspect ratio dentro del bounding box indicado
    doc.image(logoFile, 50, START_Y, { fit: [W, 70], align: 'center' });
    const imgBottom = START_Y + 70 + 6;
    // Título debajo de la imagen, sin comprimir
    doc.fillColor(brown).fontSize(16).font('Helvetica-Bold')
       .text(businessName, 50, imgBottom, { width: W, align: 'center' });
    doc.y += 4;
  } else {
    doc.fillColor(brown).fontSize(20).font('Helvetica-Bold')
       .text(businessName, 50, START_Y + 5, { align: 'center', width: W });
    doc.y += 2;
  }
}

module.exports = { drawPdfHeader };
