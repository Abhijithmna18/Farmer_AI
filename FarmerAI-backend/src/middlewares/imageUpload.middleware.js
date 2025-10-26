const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory structure
const createUploadDirs = () => {
  // Skip directory creation in serverless environments
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log('Skipping upload directory creation in serverless environment');
    return;
  }

  const dirs = [
    'uploads/content-images',
    'uploads/gallery',
    'uploads/blogs',
    'uploads/home-content',
    'uploads/workshop-tutorials',
    'uploads/events'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

// Initialize directories
createUploadDirs();

// Storage configuration for different content types
const getStorageConfig = (subfolder = 'content-images') => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../../uploads', subfolder);
      // Skip directory creation in serverless environments
      if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      cb(null, `${timestamp}_${base}_${randomSuffix}${ext}`);
    }
  });
};

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// Multer configurations for different content types
const galleryUpload = multer({
  storage: getStorageConfig('gallery'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: imageFilter
});

const blogUpload = multer({
  storage: getStorageConfig('blogs'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: imageFilter
});

const homeContentUpload = multer({
  storage: getStorageConfig('home-content'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: imageFilter
});

const workshopTutorialUpload = multer({
  storage: getStorageConfig('workshop-tutorials'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: imageFilter
});

const workshopUpload = multer({
  storage: getStorageConfig('workshops'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: imageFilter
});

const eventUpload = multer({
  storage: getStorageConfig('events'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Allow multiple images for events
  },
  fileFilter: imageFilter
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        success: false, 
        message: 'Image file is too large. Please select an image smaller than 10MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Too many files uploaded. Please check the file limit.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Unexpected field name. Please use the correct field name for file upload.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: `Upload error: ${err.message}` 
    });
  }
  if (err.message === 'Only image files (JPEG, PNG, GIF, WebP) are allowed') {
    return res.status(400).json({ 
      success: false, 
      message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed.' 
    });
  }
  next(err);
};

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
};

// Helper function to get file URL
const getFileUrl = (req, filename, subfolder = 'content-images') => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${subfolder}/${filename}`;
};

module.exports = {
  galleryUpload,
  blogUpload,
  homeContentUpload,
  workshopTutorialUpload,
  workshopUpload,
  eventUpload,
  handleMulterError,
  deleteFile,
  getFileUrl,
  createUploadDirs
};
