const router  = require('express').Router();
const ctrl    = require('../controllers/settingsController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const makeStorage = (basename) => multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${basename}${ext}`);
  }
});

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Solo se permiten imágenes'));
};

const uploadLogo       = multer({ storage: makeStorage('logo'),        limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: imageFilter });
const uploadReportLogo = multer({ storage: makeStorage('report-logo'), limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: imageFilter });

// Public — used by login page to show logo without auth
router.get('/',              ctrl.getSettings);

// Protected
router.put('/',              requireAuth, requireAdmin, ctrl.updateSettings);
router.post('/logo',         requireAuth, requireAdmin, uploadLogo.single('logo'),             ctrl.uploadLogo);
router.post('/report-logo',  requireAuth, requireAdmin, uploadReportLogo.single('report_logo'), ctrl.uploadReportLogo);

module.exports = router;
