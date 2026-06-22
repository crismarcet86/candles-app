const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { requireAuth } = require('../middlewares/auth');

router.use(requireAuth);

router.get('/summary',     ctrl.getSummary);
router.get('/orders',      ctrl.getOrders);
router.get('/low-stock',   ctrl.getLowStock);
router.get('/top-clients', ctrl.getTopClients);
router.get('/pdf',         ctrl.getPdf);

module.exports = router;
