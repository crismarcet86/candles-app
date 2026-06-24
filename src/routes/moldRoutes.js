const router  = require('express').Router();
const ctrl    = require('../controllers/moldController');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const multer  = require('multer');
const path    = require('path');

const rules = [
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('wax_grams').isFloat({ min: 0.001 }).withMessage('Gramos de cera requeridos (> 0)'),
];

const imageStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../public/uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `mold-${req.params.id}${ext}`);
  },
});
const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

router.get('/',           ctrl.getAll);
router.get('/pdf',        requireAuth, ctrl.getPdf);
router.get('/:id',        ctrl.getById);
router.post('/',          rules, validate, ctrl.create);
router.put('/:id',        rules, validate, ctrl.update);
router.delete('/:id',     ctrl.remove);
router.post('/:id/image', requireAuth, upload.single('image'), ctrl.uploadImage);

module.exports = router;
