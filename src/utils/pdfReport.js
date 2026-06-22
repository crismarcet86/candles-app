const PDFDocument = require('pdfkit');

/**
 * Genera el PDF del reporte general y lo retorna como Buffer.
 * @param {Object} opts
 * @param {Object}   opts.summary    - KPIs del resumen
 * @param {Array}    opts.orders     - Órdenes del período
 * @param {Array}    opts.lowStock   - Productos con stock bajo
 * @param {Array}    opts.topClients - Top clientes por gasto
 * @param {string}   [opts.from]     - Fecha inicio del período (YYYY-MM-DD)
 * @param {string}   [opts.to]       - Fecha fin del período (YYYY-MM-DD)
 */
function generateReportPDF({ summary, orders, lowStock, topClients, from, to }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', b => buffers.push(b));
    doc.on('end',  () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W        = 495; // ancho útil (595 - 2*50)
    const brown    = '#8B5E3C';
    const gray     = '#6b7280';
    const lightGray = '#f3f4f6';

    // ── Helpers ──────────────────────────────────────────────────

    /** Dibuja una línea horizontal en doc.y */
    const hRule = (color = brown, weight = 1.5) => {
      doc.moveTo(50, doc.y).lineTo(545, doc.y)
         .strokeColor(color).lineWidth(weight).stroke();
    };

    /** Encabezado de sección */
    const sectionTitle = (title) => {
      doc.moveDown(1.2);
      doc.fillColor(brown).fontSize(12).font('Helvetica-Bold')
         .text(title, 50, doc.y);
      doc.moveDown(0.3);
      hRule(brown, 1);
      doc.moveDown(0.5);
    };

    /**
     * Tabla genérica.
     * @param {string[]} headers  - Títulos de columna
     * @param {number[]} widths   - Anchos de cada columna
     * @param {string[]} aligns   - Alineación de cada columna ('left'|'right'|'center')
     * @param {string[][]} rows   - Filas de datos (strings)
     */
    const drawTable = (headers, widths, aligns, rows) => {
      const rowH  = 14;
      const padX  = 4;

      // Calcular posiciones X de inicio de cada columna
      const xs = [];
      let cx = 50;
      for (const w of widths) { xs.push(cx); cx += w; }

      // Cabecera
      const headerY = doc.y;
      doc.fillColor(lightGray).rect(50, headerY, W, rowH + 4).fill();
      doc.fillColor(gray).fontSize(8).font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, xs[i] + padX, headerY + 3, { width: widths[i] - padX * 2, align: aligns[i] });
      });
      doc.y = headerY + rowH + 4;

      // Filas
      doc.font('Helvetica').fontSize(8).fillColor('#374151');
      rows.forEach((row, ri) => {
        // Salto de página si hace falta
        if (doc.y + rowH + 6 > 780) {
          doc.addPage();
          doc.y = 50;
        }
        const rowY = doc.y;
        // Fondo alternado muy sutil
        if (ri % 2 === 1) {
          doc.fillColor('#fafafa').rect(50, rowY, W, rowH + 2).fill();
        }
        doc.fillColor('#374151');
        row.forEach((cell, i) => {
          doc.text(String(cell ?? '—'), xs[i] + padX, rowY + 2,
            { width: widths[i] - padX * 2, align: aligns[i], lineBreak: false });
        });
        doc.y = rowY + rowH + 2;
        doc.moveTo(50, doc.y).lineTo(545, doc.y)
           .strokeColor('#e5e7eb').lineWidth(0.4).stroke();
      });
    };

    // ── ENCABEZADO ────────────────────────────────────────────────
    doc.fillColor(brown)
       .fontSize(22).font('Helvetica-Bold')
       .text('Velas Artesanales', 50, 50, { align: 'center', width: W });

    doc.fillColor(gray)
       .fontSize(11).font('Helvetica')
       .text('REPORTE GENERAL', 50, doc.y + 2, { align: 'center', width: W });

    if (from || to) {
      const rangeText = `Período: ${from || '—'}  →  ${to || '—'}`;
      doc.fillColor(gray).fontSize(9).font('Helvetica')
         .text(rangeText, 50, doc.y + 4, { align: 'center', width: W });
    }

    doc.moveDown(0.8);
    hRule(brown, 1.5);
    doc.moveDown(0.8);

    // ── SECCIÓN 1: KPIs ───────────────────────────────────────────
    sectionTitle('Resumen');

    const kpis = [
      { label: 'Órdenes totales',     value: String(summary.total_orders ?? 0) },
      { label: 'Ingresos totales',    value: `S/ ${Number(summary.total_revenue ?? 0).toFixed(2)}` },
      { label: 'Clientes activos',    value: String(summary.active_clients ?? 0) },
      { label: 'Proformas pendientes',value: String(summary.pending_proformas ?? 0) },
      { label: 'Productos con stock bajo', value: String(summary.low_stock_count ?? 0) },
    ];

    const kpiBoxW  = 91;   // 5 cajas en 495px con ~6px de separación
    const kpiBoxH  = 46;
    const kpiGap   = 6;
    let kpiX       = 50;
    const kpiY     = doc.y;

    kpis.forEach(({ label, value }) => {
      // Borde y fondo
      doc.fillColor(lightGray).rect(kpiX, kpiY, kpiBoxW, kpiBoxH).fill();
      doc.strokeColor(brown).lineWidth(0.8).rect(kpiX, kpiY, kpiBoxW, kpiBoxH).stroke();

      // Valor grande
      doc.fillColor(brown).fontSize(16).font('Helvetica-Bold')
         .text(value, kpiX + 4, kpiY + 6, { width: kpiBoxW - 8, align: 'center' });

      // Etiqueta pequeña
      doc.fillColor(gray).fontSize(7).font('Helvetica')
         .text(label, kpiX + 4, kpiY + 28, { width: kpiBoxW - 8, align: 'center', lineBreak: false });

      kpiX += kpiBoxW + kpiGap;
    });

    doc.y = kpiY + kpiBoxH + 4;

    // ── SECCIÓN 2: ÓRDENES ────────────────────────────────────────
    sectionTitle('Órdenes del período');

    if (orders.length === 0) {
      doc.fillColor(gray).fontSize(9).font('Helvetica').text('Sin órdenes en el período.', 50, doc.y);
      doc.moveDown(0.5);
    } else {
      const displayed = orders.slice(0, 50);
      drawTable(
        ['ID', 'CLIENTE', 'ÍTEMS', 'TOTAL', 'FECHA'],
        [40,   200,        50,      80,       125],
        ['left','left',   'right', 'right',  'right'],
        displayed.map(o => [
          String(o.id).padStart(4, '0'),
          o.client_name,
          o.item_count,
          `S/ ${Number(o.total).toFixed(2)}`,
          new Date(o.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        ])
      );
      if (orders.length > 50) {
        doc.moveDown(0.4);
        doc.fillColor(gray).fontSize(8).font('Helvetica')
           .text(`(Mostrando 50 de ${orders.length} órdenes)`, 50, doc.y);
      }
    }

    // ── SECCIÓN 3: STOCK BAJO ─────────────────────────────────────
    sectionTitle('Productos con stock bajo');

    if (lowStock.length === 0) {
      doc.fillColor(gray).fontSize(9).font('Helvetica').text('No hay productos con stock bajo.', 50, doc.y);
      doc.moveDown(0.5);
    } else {
      drawTable(
        ['PRODUCTO',  'CATEGORÍA',  'STOCK',  'MÍN.',   'UNID.'],
        [175,          155,           55,        55,        55],
        ['left',       'left',       'right',  'right',  'center'],
        lowStock.map(p => [
          p.name,
          p.category_name || '—',
          Number(p.stock).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 3 }),
          Number(p.min_stock).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 3 }),
          p.unit_abbr || '—',
        ])
      );
    }

    // ── SECCIÓN 4: TOP CLIENTES ───────────────────────────────────
    sectionTitle('Top clientes');

    if (topClients.length === 0) {
      doc.fillColor(gray).fontSize(9).font('Helvetica').text('Sin datos de clientes.', 50, doc.y);
      doc.moveDown(0.5);
    } else {
      drawTable(
        ['#', 'CLIENTE',  'ÓRDENES',  'TOTAL GASTADO'],
        [25,   285,         80,          105],
        ['left','left',    'right',    'right'],
        topClients.map((c, idx) => [
          idx + 1,
          c.name,
          c.order_count,
          `S/ ${Number(c.total_spent).toFixed(2)}`,
        ])
      );
    }

    // ── PIE DE PÁGINA ─────────────────────────────────────────────
    const genDate = new Date().toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    doc.fillColor(gray).fontSize(8).font('Helvetica')
       .text(`Reporte generado el ${genDate}`, 50, 750, { align: 'center', width: W });

    doc.end();
  });
}

module.exports = { generateReportPDF };
