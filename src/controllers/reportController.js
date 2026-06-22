const Report = require('../models/Report');
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
    const [summary, orders, lowStock, topClients] = await Promise.all([
      Report.getSummary(),
      Report.getOrdersByPeriod({ from, to }),
      Report.getLowStock(),
      Report.getTopClients(),
    ]);
    const pdf = await generateReportPDF({ summary, orders, lowStock, topClients, from, to });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte.pdf"');
    res.send(pdf);
  } catch (err) { next(err); }
};
