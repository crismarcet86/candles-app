const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');

const rules = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('category_id').isInt({ min: 1 }).withMessage('Categoría inválida'),
  body('unit_id').isInt({ min: 1 }).withMessage('Unidad inválida'),
  body('price').isFloat({ min: 0 }).withMessage('Precio inválido'),
  body('stock').isFloat({ min: 0 }).withMessage('Stock inválido'),
];

router.get('/',       ctrl.getAll);
router.get('/pdf',    requireAuth, ctrl.getPdf);
router.get('/:id',    ctrl.getById);
router.post('/',      rules, validate, ctrl.create);
router.put('/:id',    rules, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
