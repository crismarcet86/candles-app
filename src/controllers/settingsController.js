const Settings = require('../models/Settings');
const { success, badRequest } = require('../utils/response');
const path = require('path');
const fs   = require('fs');

const buildLogoUrl = (req, logo_path) => {
  if (!logo_path) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${logo_path}`;
};

const formatSettings = (req, row) => {
  if (!row) return null;
  return { ...row, logo_url: buildLogoUrl(req, row.logo_path) };
};

exports.getSettings = async (req, res, next) => {
  try {
    const row = await Settings.get();
    success(res, formatSettings(req, row) || { id: 1, name: 'Mi Negocio', ruc: null, phone: null, observations: null, logo_path: null, logo_url: null });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { name, ruc, phone, observations } = req.body;
    if (!name?.trim()) return badRequest(res, 'El nombre es requerido');
    const row = await Settings.upsert({ name: name.trim(), ruc, phone, observations });
    success(res, formatSettings(req, row));
  } catch (err) { next(err); }
};

exports.uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return badRequest(res, 'No se recibió ningún archivo');
    const row = await Settings.updateLogo(req.file.filename);
    success(res, formatSettings(req, row));
  } catch (err) { next(err); }
};
