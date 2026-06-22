const Client = require('../models/Client');
const { success, created, notFound } = require('../utils/response');

exports.getAll    = async (req, res, next) => { try { success(res, await Client.findAll()); } catch (e) { next(e); } };
exports.getById   = async (req, res, next) => { try { const c = await Client.findById(req.params.id); c ? success(res, c) : notFound(res, 'Cliente no encontrado'); } catch (e) { next(e); } };
exports.create    = async (req, res, next) => { try { created(res, await Client.create(req.body)); } catch (e) { next(e); } };
exports.update    = async (req, res, next) => { try { const c = await Client.findById(req.params.id); if (!c) return notFound(res, 'Cliente no encontrado'); success(res, await Client.update(req.params.id, req.body)); } catch (e) { next(e); } };
exports.remove    = async (req, res, next) => { try { const ok = await Client.delete(req.params.id); ok ? success(res, null, 'Cliente desactivado') : notFound(res, 'Cliente no encontrado'); } catch (e) { next(e); } };
