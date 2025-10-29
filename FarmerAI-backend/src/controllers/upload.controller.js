// Simple image upload controller for events
const path = require('path');
const fs = require('fs');

// Upload single image for events
exports.uploadEventImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Get the file path from multer
    const filePath = req.file.path;
    const fileName = req.file.filename;

    // Construct the URL for the uploaded image
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/events/${fileName}`;

    console.log('Event image uploaded:', {
      originalName: req.file.originalname,
      fileName: fileName,
      filePath: filePath,
      imageUrl: imageUrl
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: imageUrl,
      fileName: fileName,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

// Delete uploaded image
exports.deleteEventImage = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'File name is required'
      });
    }

    const filePath = path.join(__dirname, '../../uploads/events', fileName);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Event image deleted:', fileName);
      
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

