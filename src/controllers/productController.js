const Product = require('../models/Product');
const { success, created, notFound } = require('../utils/response');

exports.getAll    = async (req, res, next) => { try { success(res, await Product.findAll()); } catch (e) { next(e); } };
exports.getById   = async (req, res, next) => { try { const p = await Product.findById(req.params.id); p ? success(res, p) : notFound(res, 'Producto no encontrado'); } catch (e) { next(e); } };
exports.create    = async (req, res, next) => { try { created(res, await Product.create(req.body)); } catch (e) { next(e); } };
exports.update    = async (req, res, next) => { try { const p = await Product.findById(req.params.id); if (!p) return notFound(res, 'Producto no encontrado'); success(res, await Product.update(req.params.id, req.body)); } catch (e) { next(e); } };
exports.remove    = async (req, res, next) => { try { const ok = await Product.delete(req.params.id); ok ? success(res, null, 'Producto desactivado') : notFound(res, 'Producto no encontrado'); } catch (e) { next(e); } };
