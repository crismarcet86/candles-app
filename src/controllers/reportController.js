const Report = require('../models/Report');
const Settings = require('../models/Settings');
const { success } = require('../utils/response');
const { generateReportPDF } = require('../utils/pdfReport');

exports.getSummary = async (req, res, next) => {
  try {
    const data = await Report.getSummary();
    success(res, data);
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await Report.getOrdersByPeriod({ from, to });
    success(res, data);
  } catch (err) { next(err); }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const data = await Report.getLowStock();
    success(res, data);
  } catch (err) { next(err); }
};

exports.getTopClients = async (req, res, next) => {
  try {
    const data = await Report.getTopClients();
    success(res, data);
  } catch (err) { next(err); }
};

exports.getPdf = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const [summary, orders, lowStock, topClients, settings] = await Promise.all([
      Report.getSummary(),
      Report.getOrdersByPeriod({ from, to }),
      Report.getLowStock(),
      Report.getTopClients(),
      Settings.get(),
    ]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;
    const pdf = await generateReportPDF({ summary, orders, lowStock, topClients, from, to, businessName, logoPath });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte.pdf"');
    res.send(pdf);
  } catch (err) { next(err); }
};
