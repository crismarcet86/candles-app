const Unit = require('../models/Unit');
const { success, created, notFound } = require('../utils/response');

exports.getAll  = async (req, res, next) => { try { success(res, await Unit.findAll()); } catch (e) { next(e); } };
exports.getById = async (req, res, next) => { try { const u = await Unit.findById(req.params.id); u ? success(res, u) : notFound(res, 'Unidad no encontrada'); } catch (e) { next(e); } };
exports.create  = async (req, res, next) => { try { created(res, await Unit.create(req.body)); } catch (e) { next(e); } };
exports.update  = async (req, res, next) => { try { const u = await Unit.findById(req.params.id); if (!u) return notFound(res, 'Unidad no encontrada'); success(res, await Unit.update(req.params.id, req.body)); } catch (e) { next(e); } };
exports.remove  = async (req, res, next) => { try { const ok = await Unit.delete(req.params.id); ok ? success(res, null, 'Unidad eliminada') : notFound(res, 'Unidad no encontrada'); } catch (e) { next(e); } };
