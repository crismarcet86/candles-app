const router = require('express').Router();
const ctrl   = require('../controllers/proformaController');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');

const rules = [
  body('client_id').isInt({ min: 1 }).withMessage('Cliente requerido'),
  body('items').isArray({ min: 1 }).withMessage('Se requiere al menos un ítem'),
  body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Cantidad inválida (debe ser > 0)'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Precio inválido'),
  body('labor_cost').optional().isFloat({ min: 0 }).withMessage('Mano de obra inválida'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Descuento inválido'),
];

router.get('/',               ctrl.getAll);
router.get('/pdf',            requireAuth, ctrl.getListPdf);
router.get('/:id',            ctrl.getById);
router.get('/:id/pdf',        ctrl.getPdf);
router.post('/',              rules, validate, ctrl.create);
router.put('/:id',            rules, validate, ctrl.update);
router.post('/:id/confirm',   ctrl.confirm);
router.post('/:id/cancel',    ctrl.cancel);

module.exports = router;
