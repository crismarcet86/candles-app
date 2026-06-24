const router  = require('express').Router();
const ctrl    = require('../controllers/productController');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const multer  = require('multer');
const path    = require('path');

const rules = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('category_id').isInt({ min: 1 }).withMessage('Categoría inválida'),
  body('unit_id').isInt({ min: 1 }).withMessage('Unidad inválida'),
  body('price').isFloat({ min: 0 }).withMessage('Precio inválido'),
  body('stock').isFloat({ min: 0 }).withMessage('Stock inválido'),
];

const imageStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../public/uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${req.params.id}${ext}`);
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
router.get('/stock/pdf',  requireAuth, ctrl.getStockPdf);
router.get('/:id',        ctrl.getById);
router.post('/',          rules, validate, ctrl.create);
router.put('/:id',        rules, validate, ctrl.update);
router.delete('/:id',     ctrl.remove);
router.post('/:id/image', requireAuth, upload.single('image'), ctrl.uploadImage);
router.patch('/:id/stock', requireAuth,
  body('quantity').isFloat({ min: 0.001 }).withMessage('Cantidad debe ser mayor a 0'),
  validate, ctrl.addStock
);
router.patch('/:id/writeoff', requireAuth,
  body('quantity').isFloat({ min: 0.001 }).withMessage('Cantidad debe ser mayor a 0'),
  validate, ctrl.writeOffStock
);
router.post('/inventory-count', requireAuth,
  body('items').isArray({ min: 1 }).withMessage('Se requieren ítems'),
  validate, ctrl.inventoryCount
);

module.exports = router;
