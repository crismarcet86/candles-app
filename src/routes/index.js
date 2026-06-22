const router = require('express').Router();

router.use('/categories', require('./categoryRoutes'));
router.use('/units',      require('./unitRoutes'));
router.use('/products',   require('./productRoutes'));
router.use('/clients',    require('./clientRoutes'));
router.use('/proformas',  require('./proformaRoutes'));
router.use('/orders',     require('./orderRoutes'));
router.use('/auth',     require('./authRoutes'));
router.use('/users',    require('./userRoutes'));
router.use('/molds',    require('./moldRoutes'));
router.use('/reports',  require('./reportRoutes'));
router.use('/settings',   require('./settingsRoutes'));
router.use('/calculator', require('./calculatorRoutes'));

module.exports = router;
