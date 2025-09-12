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

const router = express.Router();

// Serve uploaded files statically
router.use('/uploads', express.static(uploadsDir));

// Upload + Identify (expects field name 'plantImage')
router.post('/upload', upload.single('plantImage'), controller.uploadAndIdentify);

// Classify via Hugging Face (returns labels + scores)
router.post('/classify', upload.single('plantImage'), controller.classifyWithHF);

// CRUD
router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;