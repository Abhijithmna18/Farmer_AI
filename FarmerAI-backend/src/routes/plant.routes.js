// src/routes/plant.routes.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const controller = require('../controllers/plant.controller');

// Configure multer storage to local uploads folder
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.mimetype);
    if (!ok) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        success: false, 
        message: 'Image file is too large. Please select an image smaller than 10MB.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Unexpected field name. Please use "plantImage" or "image" for the file field.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: `Upload error: ${err.message}` 
    });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ 
      success: false, 
      message: 'Only image files are allowed. Please select a JPEG, PNG, or WebP file.' 
    });
  }
  next(err);
};

const router = express.Router();

// Serve uploaded files statically
router.use('/uploads', express.static(uploadsDir));

// Upload + Identify (expects field name 'plantImage')
router.post('/upload', upload.single('plantImage'), handleMulterError, controller.uploadAndIdentify);

// Alias: Identify (accepts field name 'image' to be compatible with other clients)
router.post('/identify', upload.single('image'), handleMulterError, controller.uploadAndIdentify);

// Classify via Hugging Face (returns labels + scores)
router.post('/classify', upload.single('plantImage'), handleMulterError, controller.classifyWithHF);

// Fetch enriched details by name (no persistence)
router.get('/details', controller.detailsByName);

// CRUD
router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;