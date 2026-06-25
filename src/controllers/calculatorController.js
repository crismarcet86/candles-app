const { generateListPDF } = require('../utils/pdfList');
const Settings = require('../models/Settings');
const { badRequest } = require('../utils/response');

exports.getPdf = async (req, res, next) => {
  try {
    const { moldName, waxGrams, quantity, sellPrice, includesColor, laborCost, laborHours, lines } = req.body;

    if (!lines || !Array.isArray(lines)) return badRequest(res, 'Datos inválidos');

    const settings = await Settings.get();
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;

    const date = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Totales
    const ingredientCost   = lines.reduce((s, l) => s + (Number(l.subtotal) || 0), 0);
    const laborTotal       = (Number(laborCost) || 0) * (Number(laborHours) || 1);
    const colorCost        = includesColor ? 0.10 : 0;
    const totalCostPerCandle = ingredientCost + laborTotal + colorCost;
    const qty              = Number(quantity) || 1;
    const totalCost        = totalCostPerCandle * qty;
    const sell             = Number(sellPrice) || 0;
    const profit           = sell - totalCostPerCandle;
    const margin           = totalCostPerCandle ? (profit / totalCostPerCandle) * 100 : 0;
    const totalRevenue     = sell * qty;
    const totalProfit      = totalRevenue - totalCost;

    // Filas de ingredientes
    const ingredientRows = lines
      .filter(l => l.ingredient_id && Number(l.subtotal) > 0)
      .map(l => [
        l.ingredient_name || '—',
        l.is_unit ? `${l.grams} u` : `${l.grams} g`,
        l.is_unit
          ? `S/ ${Number(l.unit_cost).toFixed(4)}/u`
          : `S/ ${Number(l.unit_cost).toFixed(4)}/g`,
        `S/ ${Number(l.subtotal).toFixed(2)}`
      ]);

    // Filas adicionales de costo
    if (laborTotal > 0) {
      const hoursLabel = Number(laborHours) !== 1 ? ` (${laborHours}h × S/${Number(laborCost).toFixed(2)})` : '';
      ingredientRows.push(['Mano de obra' + hoursLabel, '', '', `S/ ${laborTotal.toFixed(2)}`]);
    }
    if (colorCost > 0) {
      ingredientRows.push(['Color', '', '', `S/ ${colorCost.toFixed(2)}`]);
    }

    // Filas de resumen
    const summaryRows = [
      ['', '', '', ''],
      ['Costo por vela', '', '', `S/ ${totalCostPerCandle.toFixed(2)}`],
    ];
    if (qty > 1) summaryRows.push([`Costo total (${qty} velas)`, '', '', `S/ ${totalCost.toFixed(2)}`]);
    if (sell > 0) {
      summaryRows.push(
        [`Precio de venta`, '', '', `S/ ${sell.toFixed(2)}`],
        [`Ganancia por vela`, '', '', `S/ ${profit.toFixed(2)}`],
        [`Margen`, '', '', `${margin.toFixed(1)}%`],
      );
      if (qty > 1) {
        summaryRows.push(
          [`Ingreso total`, '', '', `S/ ${totalRevenue.toFixed(2)}`],
          [`Ganancia total`, '', '', `S/ ${totalProfit.toFixed(2)}`],
        );
      }
    }

    const subtitle = `Molde: ${moldName || '—'} (${waxGrams || 0}g cera) | Cantidad: ${qty} vela(s) | ${date}`;

    const pdf = await generateListPDF({
      title: 'Calculadora de Costos',
      subtitle, businessName, logoPath,
      headers: ['PRODUCTO / CONCEPTO', 'CANTIDAD', 'COSTO UNIT.', 'SUBTOTAL'],
      widths:  [220,                        100,        100,           75],
      aligns:  ['left',                    'right',   'right',      'right'],
      rows:    [...ingredientRows, ...summaryRows]
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="calculo-vela.pdf"');
    res.send(pdf);
  } catch (err) { next(err); }
};
