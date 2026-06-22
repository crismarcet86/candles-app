const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

const rules = [body('name').notEmpty().withMessage('El nombre es requerido')];

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getById);
router.post('/',      rules, validate, ctrl.create);
router.put('/:id',    rules, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
