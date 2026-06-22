const router = require('express').Router();
const ctrl   = require('../controllers/calculatorController');
const { requireAuth } = require('../middlewares/auth');

router.post('/pdf', requireAuth, ctrl.getPdf);

module.exports = router;
