const router = require('express').Router();
const ctrl = require('../controllers/orderController');

router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getById);
router.patch('/:id/status',  ctrl.updateStatus);

module.exports = router;
