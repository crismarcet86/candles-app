const router  = require('express').Router();
const ctrl    = require('../controllers/settingsController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  }
});

// Public — used by login page to show logo without auth
router.get('/',         ctrl.getSettings);

// Protected
router.put('/',         requireAuth, requireAdmin, ctrl.updateSettings);
router.post('/logo',    requireAuth, requireAdmin, upload.single('logo'), ctrl.uploadLogo);

module.exports = router;
