// Pest Detection Controller
const MLService = require('../services/ml-service');
const PestDetection = require('../models/PestDetection');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/pest-detection/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pest-' + uniqueSuffix + path.extname(file.originalname));
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
      cb(new Error('Only image files are allowed for pest detection'));
    }
  }
});

// Upload middleware
const uploadImage = upload.single('image');

// Detect pest from uploaded image
const detectPest = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { farmId, location } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required for pest detection'
      });
    }

    const imagePath = req.file.path;
    
    // Call ML service for pest detection
    const mlResult = await MLService.detectPest(imagePath, farmId, location);
    
    if (!mlResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Pest detection failed',
        error: mlResult.error
      });
    }

    const { pestType, confidence, severity, treatment, prevention } = mlResult.data;

    // Save detection result to database
    const pestDetection = new PestDetection({
      userId,
      farmId,
      imageUrl: req.file.path,
      pestType,
      confidence,
      severity: severity || 'Unknown',
      treatment,
      prevention,
      location: location ? JSON.parse(location) : null,
      affectedArea: mlResult.data.affectedArea || 'Unknown',
      damageLevel: mlResult.data.damageLevel || 'Unknown'
    });

    await pestDetection.save();

    // Log the operation
    await MLService.logMLOperation(
      'pest_detection',
      'pest-detection',
      userId,
      { imagePath, farmId, location },
      mlResult.data
    );

    res.json({
      success: true,
      data: {
        pestType,
        confidence,
        severity: pestDetection.severity,
        treatment,
        prevention,
        affectedArea: pestDetection.affectedArea,
        damageLevel: pestDetection.damageLevel,
        detectionId: pestDetection._id,
        timestamp: pestDetection.createdAt
      }
    });

  } catch (error) {
    console.error('Pest detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during pest detection',
      error: error.message
    });
  }
};

// Get pest detection history for user
const getPestHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 10, pestType, farmId } = req.query;
    
    const query = { userId };
    if (pestType) {
      query.pestType = new RegExp(pestType, 'i');
    }
    if (farmId) {
      query.farmId = farmId;
    }

    const detections = await PestDetection.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('farmId', 'name location')
      .select('-__v');

    const total = await PestDetection.countDocuments(query);

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
    console.error('Get pest history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pest detection history',
      error: error.message
    });
  }
};

// Get specific pest detection by ID
const getPestDetection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const detection = await PestDetection.findOne({
      _id: id,
      userId
    }).populate('farmId', 'name location');

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Pest detection not found'
      });
    }

    res.json({
      success: true,
      data: detection
    });

  } catch (error) {
    console.error('Get pest detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pest detection',
      error: error.message
    });
  }
};

// Get treatment recommendations for specific pest
const getTreatmentRecommendations = async (req, res) => {
  try {
    const { pestType } = req.params;
    
    const treatments = {
      'aphids': {
        organic: ['Neem oil spray', 'Insecticidal soap', 'Ladybugs release'],
        chemical: ['Imidacloprid', 'Acephate'],
        cultural: ['Remove affected leaves', 'Improve air circulation', 'Use yellow sticky traps']
      },
      'whiteflies': {
        organic: ['Yellow sticky traps', 'Neem oil', 'Beneficial insects'],
        chemical: ['Pyrethroids', 'Systemic insecticides'],
        cultural: ['Remove weeds', 'Proper spacing', 'Regular monitoring']
      },
      'caterpillars': {
        organic: ['Bacillus thuringiensis (Bt)', 'Hand picking', 'Row covers'],
        chemical: ['Spinosad', 'Chlorantraniliprole'],
        cultural: ['Crop rotation', 'Remove plant debris', 'Use pheromone traps']
      },
      'mites': {
        organic: ['Water spray', 'Predatory mites', 'Neem oil'],
        chemical: ['Miticide sprays', 'Sulfur'],
        cultural: ['Increase humidity', 'Remove affected leaves', 'Proper irrigation']
      },
      'thrips': {
        organic: ['Blue sticky traps', 'Neem oil', 'Beneficial nematodes'],
        chemical: ['Spinosad', 'Pyrethroids'],
        cultural: ['Remove weeds', 'Proper spacing', 'Regular monitoring']
      }
    };

    const treatment = treatments[pestType.toLowerCase()] || {
      organic: ['Consult local agricultural extension'],
      chemical: ['Consult local agricultural extension'],
      cultural: ['Consult local agricultural extension']
    };

    res.json({
      success: true,
      data: {
        pestType,
        treatments: treatment,
        prevention: [
          'Regular field monitoring',
          'Proper plant spacing',
          'Good air circulation',
          'Crop rotation',
          'Remove plant debris',
          'Use beneficial insects'
        ],
        monitoring: [
          'Check undersides of leaves',
          'Look for feeding damage',
          'Use sticky traps',
          'Monitor plant health',
          'Check for eggs and larvae'
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

// Get pest statistics for user
const getPestStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { period = '30', farmId } = req.query; // days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const matchQuery = {
      userId: userId,
      createdAt: { $gte: startDate }
    };

    if (farmId) {
      matchQuery.farmId = farmId;
    }

    const stats = await PestDetection.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$pestType',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          severityCounts: { $push: '$severity' },
          damageLevels: { $push: '$damageLevel' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalDetections = await PestDetection.countDocuments(matchQuery);

    // Get severity distribution
    const severityStats = await PestDetection.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats,
        totalDetections,
        severityStats,
        period: `${period} days`
      }
    });

  } catch (error) {
    console.error('Get pest stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pest statistics',
      error: error.message
    });
  }
};

module.exports = {
  detectPest,
  getPestHistory,
  getPestDetection,
  getTreatmentRecommendations,
  getPestStats,
  uploadImage
};
