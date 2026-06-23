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
  const W         = 495;
  const brown     = '#8B5E3C';
  const LOGO_SIZE = 42;
  const START_Y   = 44;

  const logoFile = logoPath
    ? path.join(__dirname, '../../public/uploads', logoPath)
    : null;
  const hasLogo = !!(logoFile && fs.existsSync(logoFile));

  if (hasLogo) {
    // Logo a la izquierda, nombre centrado en el resto del ancho
    doc.image(logoFile, 50, START_Y, { width: LOGO_SIZE, height: LOGO_SIZE });
    doc.fillColor(brown).fontSize(18).font('Helvetica-Bold')
       .text(businessName, 98, START_Y + (LOGO_SIZE / 2) - 9, { width: W - 48, align: 'center' });
    // Asegurar que doc.y quede por debajo del logo
    if (doc.y < START_Y + LOGO_SIZE + 4) {
      doc.y = START_Y + LOGO_SIZE + 4;
    }
  } else {
    doc.fillColor(brown).fontSize(20).font('Helvetica-Bold')
       .text(businessName, 50, START_Y + 5, { align: 'center', width: W });
    doc.y += 2;
  }
}

module.exports = { drawPdfHeader };
