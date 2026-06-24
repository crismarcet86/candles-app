const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

const rules = [
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('username').notEmpty().trim().withMessage('Usuario requerido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
];

// Todas las rutas de usuarios requieren estar autenticado y ser admin
router.use(requireAuth, requireAdmin);

router.get('/',       ctrl.getAll);
router.get('/pdf',    ctrl.getPdf);
router.get('/:id',    ctrl.getById);
router.post('/',      rules, validate, ctrl.create);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
