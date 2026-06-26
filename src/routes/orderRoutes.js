const router = require('express').Router();
const ctrl       = require('../controllers/orderController');
const returnCtrl = require('../controllers/orderReturnController');
const { requireAuth } = require('../middlewares/auth');

router.get('/',                        ctrl.getAll);
router.get('/pdf',                     requireAuth, ctrl.getPdf);
router.get('/:id',                     ctrl.getById);
router.patch('/:id/status',            ctrl.updateStatus);
router.patch('/:id/delivery-status',   ctrl.updateDeliveryStatus);
router.get('/:id/returns',             returnCtrl.getByOrder);
router.post('/:id/returns',            returnCtrl.create);

module.exports = router;
