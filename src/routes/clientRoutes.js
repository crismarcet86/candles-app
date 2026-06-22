const router = require('express').Router();
const ctrl = require('../controllers/clientController');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');

const rules = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('cedula').optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 }).withMessage('La cédula no puede exceder 20 caracteres'),
  body('email').optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Ingresa un correo válido')
];

router.get('/',       ctrl.getAll);
router.get('/pdf',    requireAuth, ctrl.getPdf);
router.get('/:id',    ctrl.getById);
router.post('/',      rules, validate, ctrl.create);
router.put('/:id',    rules, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
