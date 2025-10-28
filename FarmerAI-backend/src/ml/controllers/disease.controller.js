// Disease Detection Controller
const MLService = require('../services/ml-service');
const DiseaseDetection = require('../models/DiseaseDetection');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/disease-detection/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'disease-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for disease detection'));
    }
  }
});

// Upload middleware
const uploadImage = upload.single('image');

// Detect plant disease from uploaded image
const detectDisease = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required for disease detection'
      });
    }

    const imagePath = req.file.path;
    
    // Call ML service for disease detection
    const mlResult = await MLService.detectDisease(imagePath, userId);
    
    if (!mlResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Disease detection failed',
        error: mlResult.error
      });
    }

    const { diseaseType, confidence, treatment, prevention } = mlResult.data;

    // Save detection result to database
    const diseaseDetection = new DiseaseDetection({
      userId,
      imageUrl: req.file.path,
      diseaseType,
      confidence,
      treatment,
      prevention,
      severity: mlResult.data.severity || 'Unknown',
      affectedArea: mlResult.data.affectedArea || 'Unknown'
    });

    await diseaseDetection.save();

    // Log the operation
    await MLService.logMLOperation(
      'disease_detection',
      'disease-detection',
      userId,
      { imagePath, userId },
      mlResult.data
    );

    res.json({
      success: true,
      data: {
        diseaseType,
        confidence,
        treatment,
        prevention,
        severity: mlResult.data.severity || 'Unknown',
        affectedArea: mlResult.data.affectedArea || 'Unknown',
        detectionId: diseaseDetection._id,
        timestamp: diseaseDetection.createdAt
      }
    });

  } catch (error) {
    console.error('Disease detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during disease detection',
      error: error.message
    });
  }
};

// Get disease detection history for user
const getDiseaseHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 10, diseaseType } = req.query;
    
    const query = { userId };
    if (diseaseType) {
      query.diseaseType = new RegExp(diseaseType, 'i');
    }

    const detections = await DiseaseDetection.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await DiseaseDetection.countDocuments(query);

    res.json({
      success: true,
      data: {
        detections,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get disease history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disease detection history',
      error: error.message
    });
  }
};

// Get specific disease detection by ID
const getDiseaseDetection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const detection = await DiseaseDetection.findOne({
      _id: id,
      userId
    });

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Disease detection not found'
      });
    }

    res.json({
      success: true,
      data: detection
    });

  } catch (error) {
    console.error('Get disease detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disease detection',
      error: error.message
    });
  }
};

// Get treatment recommendations for specific disease
const getTreatmentRecommendations = async (req, res) => {
  try {
    const { diseaseType } = req.params;
    
    // This could be enhanced with a treatment database
    const treatments = {
      'leaf_spot': {
        organic: ['Neem oil spray', 'Copper fungicide', 'Proper spacing'],
        chemical: ['Chlorothalonil', 'Mancozeb'],
        cultural: ['Remove affected leaves', 'Improve air circulation']
      },
      'powdery_mildew': {
        organic: ['Baking soda solution', 'Milk spray'],
        chemical: ['Sulfur fungicide', 'Potassium bicarbonate'],
        cultural: ['Reduce humidity', 'Prune affected areas']
      },
      'rust': {
        organic: ['Copper fungicide', 'Sulfur spray'],
        chemical: ['Tebuconazole', 'Propiconazole'],
        cultural: ['Remove infected plants', 'Improve drainage']
      }
    };

    const treatment = treatments[diseaseType.toLowerCase()] || {
      organic: ['Consult local agricultural extension'],
      chemical: ['Consult local agricultural extension'],
      cultural: ['Consult local agricultural extension']
    };

    res.json({
      success: true,
      data: {
        diseaseType,
        treatments: treatment,
        prevention: [
          'Regular monitoring',
          'Proper plant spacing',
          'Good air circulation',
          'Avoid overhead watering',
          'Crop rotation'
        ]
      }
    });

  } catch (error) {
    console.error('Get treatment recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch treatment recommendations',
      error: error.message
    });
  }
};

// Get disease statistics for user
const getDiseaseStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { period = '30' } = req.query; // days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await DiseaseDetection.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$diseaseType',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          severity: { $push: '$severity' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalDetections = await DiseaseDetection.countDocuments({
      userId,
      createdAt: { $gte: startDate }
    });

    res.json({
      success: true,
      data: {
        stats,
        totalDetections,
        period: `${period} days`
      }
    });

  } catch (error) {
    console.error('Get disease stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disease statistics',
      error: error.message
    });
  }
};

module.exports = {
  detectDisease,
  getDiseaseHistory,
  getDiseaseDetection,
  getTreatmentRecommendations,
  getDiseaseStats,
  uploadImage
};
