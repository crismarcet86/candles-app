const { generateListPDF } = require('../utils/pdfList');
const Settings = require('../models/Settings');
const { badRequest } = require('../utils/response');

// Formatea una cantidad según su unidad: g ≥ 1000 → "2 kg 500 g", ml ≥ 1000 → "1 L 250 ml", u → "N u"
const round2 = n => Math.round(n * 100) / 100;
function formatQty(value, unit) {
  const v = round2(Number(value) || 0);
  if (unit === 'u') return `${v} u`;
  const [big, small] = unit === 'ml' ? ['L', 'ml'] : ['kg', 'g'];
  if (v >= 1000) {
    const whole = Math.floor(v / 1000);
    const rest = round2(v - whole * 1000);
    return rest > 0 ? `${whole} ${big} ${rest} ${small}` : `${whole} ${big}`;
  }
  return `${v} ${small}`;
}
const lineUnit = l => l.is_unit ? 'u' : ((l.isFragrance || String(l.unit_abbr).toLowerCase() === 'ml') ? 'ml' : 'g');

exports.getPdf = async (req, res, next) => {
  try {
    const { moldName, waxGrams, moldQuantity, quantity, sellPrice, includesColor, colorCost, laborCost, laborHours, lines, extras } = req.body;

    if (!lines || !Array.isArray(lines)) return badRequest(res, 'Datos inválidos');

    const settings = await Settings.get();
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;

    const date = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Totales
    const ingredientCost   = lines.reduce((s, l) => s + (Number(l.subtotal) || 0), 0);
    const laborTotal       = (Number(laborCost) || 0) * (Number(laborHours) || 1);
    const colorAmount      = includesColor ? (Number(colorCost) || 0) : 0;
    const extraList        = (Array.isArray(extras) ? extras : []).filter(e => e.name?.trim() && Number(e.cost) > 0);
    const extrasTotal      = extraList.reduce((s, e) => s + Number(e.cost), 0);
    const totalCostPerCandle = ingredientCost + laborTotal + colorAmount + extrasTotal;
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
        `${l.grams} ${lineUnit(l)}`,
        `$${Number(l.unit_cost).toFixed(4)}/${lineUnit(l)}`,
        `$${Number(l.subtotal).toFixed(2)}`
      ]);

    // Filas adicionales de costo
    if (laborTotal > 0) {
      const hoursLabel = Number(laborHours) !== 1 ? ` (${laborHours}h × $${Number(laborCost).toFixed(2)})` : '';
      ingredientRows.push(['Mano de obra' + hoursLabel, '', '', `$${laborTotal.toFixed(2)}`]);
    }
    if (colorAmount > 0) {
      ingredientRows.push(['Color', '', '', `$${colorAmount.toFixed(2)}`]);
    }
    extraList.forEach(e => ingredientRows.push([e.name.trim(), '', '', `$${Number(e.cost).toFixed(2)}`]));

    // Filas de resumen
    const summaryRows = [
      ['', '', '', ''],
      ['Costo por vela', '', '', `$${totalCostPerCandle.toFixed(2)}`],
    ];
    if (qty > 1) summaryRows.push([`Costo total (${qty} velas)`, '', '', `$${totalCost.toFixed(2)}`]);
    if (sell > 0) {
      summaryRows.push(
        [`Precio de venta`, '', '', `$${sell.toFixed(2)}`],
        [`Ganancia por vela`, '', '', `$${profit.toFixed(2)}`],
        [`Margen`, '', '', `${margin.toFixed(1)}%`],
      );
      if (qty > 1) {
        summaryRows.push(
          [`Ingreso total`, '', '', `$${totalRevenue.toFixed(2)}`],
          [`Ganancia total`, '', '', `$${totalProfit.toFixed(2)}`],
        );
      }
    }

    const subtitle = `Molde: ${moldName || '—'} (${waxGrams || 0}g cera) | Cantidad: ${qty} vela(s) | ${date}`;

    // Hoja 2: materiales por 1 vela, por N moldes y por el total de velas
    const molds = Math.max(Math.floor(Number(moldQuantity)) || 1, 1);
    const usedLines = lines.filter(l => l.ingredient_id && Number(l.subtotal) > 0);
    const materialRows = usedLines.map(l => {
      const unit = lineUnit(l);
      const perCandle = Number(l.grams) || 0;
      return [
        l.ingredient_name || '—',
        formatQty(perCandle, unit),
        formatQty(perCandle * molds, unit),
        formatQty(perCandle * qty, unit),
        `$${((Number(l.subtotal) || 0) * qty).toFixed(2)}`,
      ];
    });
    extraList.forEach(e => materialRows.push([
      e.name.trim(), '1 u', `${molds} u`, `${qty} u`, `$${(Number(e.cost) * qty).toFixed(2)}`,
    ]));
    const materialsCost = usedLines.reduce((s, l) => s + (Number(l.subtotal) || 0), 0) * qty + extrasTotal * qty;
    materialRows.push(['', '', '', '', ''], ['Costo de materiales', '', '', '', `$${materialsCost.toFixed(2)}`]);

    const pdf = await generateListPDF({
      title: 'Calculadora de Costos',
      subtitle, businessName, logoPath,
      headers: ['PRODUCTO / CONCEPTO', 'CANTIDAD', 'COSTO UNIT.', 'SUBTOTAL'],
      widths:  [220,                        100,        100,           75],
      aligns:  ['left',                    'right',   'right',      'right'],
      rows:    [...ingredientRows, ...summaryRows],
      extraPages: [{
        title: 'Materiales a usar',
        subtitle: `Molde: ${moldName || '—'} | ${molds} molde(s) | Total para ${qty} vela(s)`,
        headers: ['PRODUCTO', '1 VELA', `${molds} MOLDE(S)`, `${qty} VELAS`, 'COSTO TOTAL'],
        widths:  [155, 85, 85, 85, 85],
        aligns:  ['left', 'right', 'right', 'right', 'right'],
        rows:    materialRows,
      }],
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="calculo-vela.pdf"');
    res.send(pdf);
  } catch (err) { next(err); }
};
