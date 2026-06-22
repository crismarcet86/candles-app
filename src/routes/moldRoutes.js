const router = require('express').Router();
const ctrl   = require('../controllers/moldController');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');

const rules = [
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('wax_grams').isFloat({ min: 0.001 }).withMessage('Gramos de cera requeridos (> 0)'),
];

router.get('/',       ctrl.getAll);
router.get('/pdf',    requireAuth, ctrl.getPdf);
router.get('/:id',    ctrl.getById);
router.post('/',      rules, validate, ctrl.create);
router.put('/:id',    rules, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
