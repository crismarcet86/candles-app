const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

const loginRules = [
  body('username').notEmpty().trim().withMessage('Usuario requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];

const registerRules = [
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('username').notEmpty().trim().withMessage('Usuario requerido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
];

router.post('/login',           loginRules,    validate, ctrl.login);
router.post('/register',        registerRules, validate, ctrl.register);
router.get('/me',               requireAuth,             ctrl.me);
router.post('/change-password', requireAuth,             ctrl.changePassword);

module.exports = router;
