const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { requireAuth } = require('../middlewares/auth');

router.get('/',              ctrl.getAll);
router.get('/pdf',           requireAuth, ctrl.getPdf);
router.get('/:id',           ctrl.getById);
router.patch('/:id/status',  ctrl.updateStatus);

module.exports = router;
