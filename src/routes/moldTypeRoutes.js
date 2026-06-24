const router  = require('express').Router();
const ctrl    = require('../controllers/moldTypeController');
const { requireAuth } = require('../middlewares/auth');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `mold-type-${req.params.id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});

router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getById);
router.post('/',             requireAuth, ctrl.create);
router.put('/:id',           requireAuth, ctrl.update);
router.delete('/:id',        requireAuth, ctrl.remove);
router.post('/:id/image',    requireAuth, upload.single('image'), ctrl.uploadImage);

module.exports = router;
