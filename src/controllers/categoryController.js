const Category = require('../models/Category');
const { success, created, notFound } = require('../utils/response');

exports.getAll    = async (req, res, next) => { try { success(res, await Category.findAll()); } catch (e) { next(e); } };
exports.getById   = async (req, res, next) => { try { const c = await Category.findById(req.params.id); c ? success(res, c) : notFound(res, 'Categoría no encontrada'); } catch (e) { next(e); } };
exports.create    = async (req, res, next) => { try { created(res, await Category.create(req.body)); } catch (e) { next(e); } };
exports.update    = async (req, res, next) => { try { const c = await Category.findById(req.params.id); if (!c) return notFound(res, 'Categoría no encontrada'); success(res, await Category.update(req.params.id, req.body)); } catch (e) { next(e); } };
exports.remove    = async (req, res, next) => { try { const ok = await Category.delete(req.params.id); ok ? success(res, null, 'Categoría desactivada') : notFound(res, 'Categoría no encontrada'); } catch (e) { next(e); } };
