const WorkshopTutorial = require('../models/WorkshopTutorial');
const { deleteFile, getFileUrl } = require('../middlewares/imageUpload.middleware');
const path = require('path');

// Get all workshop tutorials
const getWorkshopTutorials = async (req, res) => {
  try {
    const { category, difficulty, isActive, isFeatured, page = 1, limit = 12 } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    
    const skip = (page - 1) * limit;
    
    const tutorials = await WorkshopTutorial.find(query)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await WorkshopTutorial.countDocuments(query);
    
    res.json({
      success: true,
      data: tutorials,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching workshop tutorials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workshop tutorials'
    });
  }
};

// Get single workshop tutorial
const getWorkshopTutorial = async (req, res) => {
  try {
    const tutorial = await WorkshopTutorial.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Workshop tutorial not found'
      });
    }
    
    // Increment view count
    tutorial.viewCount += 1;
    await tutorial.save();
    
    // Add YouTube thumbnail and video ID
    const videoId = tutorial.getYouTubeVideoId();
    const thumbnail = tutorial.getYouTubeThumbnail();
    
    const tutorialData = tutorial.toObject();
    tutorialData.youtubeVideoId = videoId;
    tutorialData.youtubeThumbnail = thumbnail;
    
    res.json({
      success: true,
      data: tutorialData
    });
  } catch (error) {
    console.error('Error fetching workshop tutorial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workshop tutorial'
    });
  }
};

// Create workshop tutorial
const createWorkshopTutorial = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      videoLink, 
      category, 
      difficulty, 
      duration, 
      tags,
      instructorName,
      instructorBio,
      instructorAvatar,
      isFeatured,
      displayOrder
    } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }
    
    const imageUrl = getFileUrl(req, req.file.filename, 'workshop-tutorials');
    
    const tutorial = new WorkshopTutorial({
      title,
      description,
      image: {
        url: imageUrl,
        alt: title,
        filename: req.file.filename
      },
      videoLink,
      category,
      difficulty: difficulty || 'beginner',
      duration: duration ? parseInt(duration) : null,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      instructor: {
        name: instructorName,
        bio: instructorBio,
        avatar: instructorAvatar
      },
      isFeatured: isFeatured === 'true',
      displayOrder: displayOrder || 0,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    });
    
    await tutorial.save();
    
    res.status(201).json({
      success: true,
      message: 'Workshop tutorial created successfully',
      data: tutorial
    });
  } catch (error) {
    console.error('Error creating workshop tutorial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workshop tutorial'
    });
  }
};

// Update workshop tutorial
const updateWorkshopTutorial = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      videoLink, 
      category, 
      difficulty, 
      duration, 
      tags,
      instructorName,
      instructorBio,
      instructorAvatar,
      isActive,
      isFeatured,
      displayOrder
    } = req.body;
    
    const tutorial = await WorkshopTutorial.findById(req.params.id);
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Workshop tutorial not found'
      });
    }
    
    // Handle image update
    let imageData = tutorial.image;
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '../../uploads/workshop-tutorials', tutorial.image.filename);
      deleteFile(oldImagePath);
      
      // Set new image
      const imageUrl = getFileUrl(req, req.file.filename, 'workshop-tutorials');
      imageData = {
        url: imageUrl,
        alt: title || tutorial.title,
        filename: req.file.filename
      };
    }
    
    const updateData = {
      title: title || tutorial.title,
      description: description || tutorial.description,
      videoLink: videoLink || tutorial.videoLink,
      category: category || tutorial.category,
      difficulty: difficulty || tutorial.difficulty,
      duration: duration ? parseInt(duration) : tutorial.duration,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : tutorial.tags,
      instructor: {
        name: instructorName || tutorial.instructor.name,
        bio: instructorBio || tutorial.instructor.bio,
        avatar: instructorAvatar || tutorial.instructor.avatar
      },
      isActive: isActive !== undefined ? isActive === 'true' : tutorial.isActive,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' : tutorial.isFeatured,
      displayOrder: displayOrder !== undefined ? displayOrder : tutorial.displayOrder,
      image: imageData,
      lastModifiedBy: req.user.id
    };
    
    const updatedTutorial = await WorkshopTutorial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email');
    
    res.json({
      success: true,
      message: 'Workshop tutorial updated successfully',
      data: updatedTutorial
    });
  } catch (error) {
    console.error('Error updating workshop tutorial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workshop tutorial'
    });
  }
};

// Delete workshop tutorial
const deleteWorkshopTutorial = async (req, res) => {
  try {
    const tutorial = await WorkshopTutorial.findById(req.params.id);
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Workshop tutorial not found'
      });
    }
    
    // Delete associated image file
    const imagePath = path.join(__dirname, '../../uploads/workshop-tutorials', tutorial.image.filename);
    deleteFile(imagePath);
    
    await WorkshopTutorial.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Workshop tutorial deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workshop tutorial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workshop tutorial'
    });
  }
};

// Rate workshop tutorial
const rateWorkshopTutorial = async (req, res) => {
  try {
    const { rating } = req.body;
    const tutorialId = req.params.id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const tutorial = await WorkshopTutorial.findById(tutorialId);
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Workshop tutorial not found'
      });
    }
    
    // Update rating
    const currentAverage = tutorial.rating.average;
    const currentCount = tutorial.rating.count;
    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + rating) / newCount;
    
    tutorial.rating.average = Math.round(newAverage * 10) / 10; // Round to 1 decimal
    tutorial.rating.count = newCount;
    
    await tutorial.save();
    
    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        average: tutorial.rating.average,
        count: tutorial.rating.count
      }
    });
  } catch (error) {
    console.error('Error rating workshop tutorial:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating'
    });
  }
};

// Reorder workshop tutorials
const reorderWorkshopTutorials = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, displayOrder }
    
    const updatePromises = items.map(item => 
      WorkshopTutorial.findByIdAndUpdate(item.id, { displayOrder: item.displayOrder })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Workshop tutorials reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering workshop tutorials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder workshop tutorials'
    });
  }
};

module.exports = {
  getWorkshopTutorials,
  getWorkshopTutorial,
  createWorkshopTutorial,
  updateWorkshopTutorial,
  deleteWorkshopTutorial,
  rateWorkshopTutorial,
  reorderWorkshopTutorials
};


