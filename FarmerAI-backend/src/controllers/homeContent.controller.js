const HomeContent = require('../models/HomeContent');
const { deleteFile, getFileUrl } = require('../middlewares/imageUpload.middleware');
const path = require('path');

// Get all home content items
const getHomeContentItems = async (req, res) => {
  try {
    const { section, isActive, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (section) query.section = section;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const skip = (page - 1) * limit;
    
    const items = await HomeContent.find(query)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ section: 1, displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await HomeContent.countDocuments(query);
    
    res.json({
      success: true,
      data: items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching home content items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content items'
    });
  }
};

// Get home content by section
const getHomeContentBySection = async (req, res) => {
  try {
    const { section } = req.params;
    const { isActive = true } = req.query;
    
    const items = await HomeContent.find({ 
      section, 
      isActive: isActive === 'true' 
    })
      .sort({ displayOrder: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching home content by section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content'
    });
  }
};

// Get single home content item
const getHomeContentItem = async (req, res) => {
  try {
    const item = await HomeContent.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Home content item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching home content item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content item'
    });
  }
};

// Create home content item
const createHomeContentItem = async (req, res) => {
  try {
    const { 
      section, 
      title, 
      subtitle, 
      description, 
      link, 
      linkText, 
      displayOrder,
      stats,
      testimonials
    } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }
    
    const imageUrl = getFileUrl(req, req.file.filename, 'home-content');
    
    const homeContentItem = new HomeContent({
      section,
      title,
      subtitle,
      description,
      image: {
        url: imageUrl,
        alt: title,
        filename: req.file.filename
      },
      link,
      linkText,
      displayOrder: displayOrder || 0,
      stats: stats ? JSON.parse(stats) : [],
      testimonials: testimonials ? JSON.parse(testimonials) : [],
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    });
    
    await homeContentItem.save();
    
    res.status(201).json({
      success: true,
      message: 'Home content item created successfully',
      data: homeContentItem
    });
  } catch (error) {
    console.error('Error creating home content item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create home content item'
    });
  }
};

// Update home content item
const updateHomeContentItem = async (req, res) => {
  try {
    const { 
      section, 
      title, 
      subtitle, 
      description, 
      link, 
      linkText, 
      displayOrder,
      isActive,
      stats,
      testimonials
    } = req.body;
    
    const homeContentItem = await HomeContent.findById(req.params.id);
    if (!homeContentItem) {
      return res.status(404).json({
        success: false,
        message: 'Home content item not found'
      });
    }
    
    // Handle image update
    let imageData = homeContentItem.image;
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '../../uploads/home-content', homeContentItem.image.filename);
      deleteFile(oldImagePath);
      
      // Set new image
      const imageUrl = getFileUrl(req, req.file.filename, 'home-content');
      imageData = {
        url: imageUrl,
        alt: title || homeContentItem.title,
        filename: req.file.filename
      };
    }
    
    const updateData = {
      section: section || homeContentItem.section,
      title: title || homeContentItem.title,
      subtitle: subtitle || homeContentItem.subtitle,
      description: description || homeContentItem.description,
      link: link || homeContentItem.link,
      linkText: linkText || homeContentItem.linkText,
      displayOrder: displayOrder !== undefined ? displayOrder : homeContentItem.displayOrder,
      isActive: isActive !== undefined ? isActive : homeContentItem.isActive,
      stats: stats ? JSON.parse(stats) : homeContentItem.stats,
      testimonials: testimonials ? JSON.parse(testimonials) : homeContentItem.testimonials,
      image: imageData,
      lastModifiedBy: req.user.id
    };
    
    const updatedItem = await HomeContent.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email');
    
    res.json({
      success: true,
      message: 'Home content item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating home content item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update home content item'
    });
  }
};

// Delete home content item
const deleteHomeContentItem = async (req, res) => {
  try {
    const homeContentItem = await HomeContent.findById(req.params.id);
    if (!homeContentItem) {
      return res.status(404).json({
        success: false,
        message: 'Home content item not found'
      });
    }
    
    // Delete associated image file
    const imagePath = path.join(__dirname, '../../uploads/home-content', homeContentItem.image.filename);
    deleteFile(imagePath);
    
    await HomeContent.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Home content item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting home content item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete home content item'
    });
  }
};

// Reorder home content items
const reorderHomeContentItems = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, displayOrder }
    
    const updatePromises = items.map(item => 
      HomeContent.findByIdAndUpdate(item.id, { displayOrder: item.displayOrder })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Home content items reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering home content items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder home content items'
    });
  }
};

module.exports = {
  getHomeContentItems,
  getHomeContentBySection,
  getHomeContentItem,
  createHomeContentItem,
  updateHomeContentItem,
  deleteHomeContentItem,
  reorderHomeContentItems
};

