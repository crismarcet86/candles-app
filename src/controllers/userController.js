const User = require('../models/User');
const Settings = require('../models/Settings');
const { success, created, notFound, badRequest } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

// Solo accesible por admin (el middleware requireAdmin lo verifica)

exports.getAll = async (req, res, next) => {
  try { success(res, await User.findAll()); } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    u ? success(res, u) : notFound(res, 'Usuario no encontrado');
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const existing = await User.findByUsername(req.body.username);
    if (existing) return badRequest(res, 'El usuario ya está registrado');
    const user = await User.create(req.body);
    created(res, user, 'Usuario creado');
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return notFound(res, 'Usuario no encontrado');
    success(res, await User.update(req.params.id, req.body), 'Usuario actualizado');
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await User.delete(req.params.id);
    ok ? success(res, null, 'Usuario desactivado') : notFound(res, 'Usuario no encontrado');
  } catch (e) { next(e); }
};

exports.getPdf = async (req, res, next) => {
  try {
    const [users, settings] = await Promise.all([User.findAll(), Settings.get()]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = users.map(u => [
      u.name,
      u.username,
      u.role,
      u.is_active === 1 ? 'Activo' : 'Inactivo',
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Usuarios',
      subtitle, businessName, logoPath,
      headers: ['NOMBRE', 'USERNAME', 'ROL', 'ESTADO'],
      widths:  [160, 200, 75, 60],
      aligns:  ['left', 'left', 'left', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="usuarios.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};
