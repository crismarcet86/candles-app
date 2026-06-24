const { generateListPDF } = require('../utils/pdfList');
const Settings = require('../models/Settings');
const { badRequest } = require('../utils/response');

exports.getPdf = async (req, res, next) => {
  try {
    const { moldName, waxGrams, quantity, sellPrice, lines } = req.body;

    if (!lines || !Array.isArray(lines)) return badRequest(res, 'Datos inválidos');

    const [settings] = await Promise.all([Settings.get()]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;

    const date = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Calcular totales
    const totalCostPerCandle = lines.reduce((s, l) => s + (Number(l.subtotal) || 0), 0);
    const totalCost           = totalCostPerCandle * (quantity || 1);
    const profit              = (sellPrice || 0) - totalCostPerCandle;
    const margin              = totalCostPerCandle ? (profit / totalCostPerCandle) * 100 : 0;
    const totalRevenue        = (sellPrice || 0) * (quantity || 1);
    const totalProfit         = totalRevenue - totalCost;

    // Filas de ingredientes
    const ingredientRows = lines
      .filter(l => l.ingredient_id && l.subtotal > 0)
      .map(l => [
        l.ingredient_name || '—',
        l.is_unit ? `${l.grams} u` : `${l.grams} g`,
        l.is_unit
          ? `S/ ${Number(l.unit_cost).toFixed(4)}/u`
          : `S/ ${Number(l.unit_cost).toFixed(4)}/g`,
        `S/ ${Number(l.subtotal).toFixed(2)}`
      ]);

    // Filas de resumen
    const summaryRows = [
      ['Costo por vela', '', '', `S/ ${totalCostPerCandle.toFixed(2)}`],
    ];
    if (quantity > 1) summaryRows.push(['Costo total (' + quantity + ' velas)', '', '', `S/ ${totalCost.toFixed(2)}`]);
    if (sellPrice > 0) {
      summaryRows.push(
        ['Precio de venta', '', '', `S/ ${Number(sellPrice).toFixed(2)}`],
        ['Ganancia por vela', '', '', `S/ ${profit.toFixed(2)}`],
        ['Margen', '', '', `${margin.toFixed(1)}%`],
      );
      if (quantity > 1) {
        summaryRows.push(
          ['Ingreso total', '', '', `S/ ${totalRevenue.toFixed(2)}`],
          ['Ganancia total', '', '', `S/ ${totalProfit.toFixed(2)}`],
        );
      }
    }

    const subtitle = `Molde: ${moldName || '—'} (${waxGrams || 0}g) | Cantidad: ${quantity || 1} vela(s) | ${date}`;

    const pdf = await generateListPDF({
      title: 'Calculadora de Costos',
      subtitle, businessName, logoPath,
      headers: ['INGREDIENTE', 'CANTIDAD', 'COSTO UNIT.', 'SUBTOTAL'],
      widths:  [220,           100,         100,           75],
      aligns:  ['left',       'right',     'right',      'right'],
      rows:    [...ingredientRows, ['', '', '', ''], ...summaryRows]
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="calculo-vela.pdf"');
    res.send(pdf);
  } catch (err) { next(err); }
};
