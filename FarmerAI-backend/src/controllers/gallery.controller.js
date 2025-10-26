const Gallery = require('../models/Gallery');
const { deleteFile, getFileUrl } = require('../middlewares/imageUpload.middleware');
const path = require('path');

// Get all gallery items
const getGalleryItems = async (req, res) => {
  try {
    const { category, isActive, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const skip = (page - 1) * limit;
    
    const items = await Gallery.find(query)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Gallery.countDocuments(query);
    
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
    console.error('Error fetching gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery items'
    });
  }
};

// Get single gallery item
const getGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery item'
    });
  }
};

// Create gallery item
const createGalleryItem = async (req, res) => {
  try {
    const { title, description, category, tags, displayOrder } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }
    
    const imageUrl = getFileUrl(req, req.file.filename, 'gallery');
    
    const galleryItem = new Gallery({
      title,
      description,
      image: {
        url: imageUrl,
        alt: title,
        filename: req.file.filename
      },
      category: category || 'other',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      displayOrder: displayOrder || 0,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    });
    
    await galleryItem.save();
    
    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: galleryItem
    });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gallery item'
    });
  }
};

// Update gallery item
const updateGalleryItem = async (req, res) => {
  try {
    const { title, description, category, tags, displayOrder, isActive } = req.body;
    
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }
    
    // Handle image update
    let imageData = galleryItem.image;
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '../../uploads/gallery', galleryItem.image.filename);
      deleteFile(oldImagePath);
      
      // Set new image
      const imageUrl = getFileUrl(req, req.file.filename, 'gallery');
      imageData = {
        url: imageUrl,
        alt: title || galleryItem.title,
        filename: req.file.filename
      };
    }
    
    const updateData = {
      title: title || galleryItem.title,
      description: description || galleryItem.description,
      category: category || galleryItem.category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : galleryItem.tags,
      displayOrder: displayOrder !== undefined ? displayOrder : galleryItem.displayOrder,
      isActive: isActive !== undefined ? isActive : galleryItem.isActive,
      image: imageData,
      lastModifiedBy: req.user.id
    };
    
    const updatedItem = await Gallery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email');
    
    res.json({
      success: true,
      message: 'Gallery item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gallery item'
    });
  }
};

// Delete gallery item
const deleteGalleryItem = async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }
    
    // Delete associated image file
    const imagePath = path.join(__dirname, '../../uploads/gallery', galleryItem.image.filename);
    deleteFile(imagePath);
    
    await Gallery.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gallery item'
    });
  }
};

// Reorder gallery items
const reorderGalleryItems = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, displayOrder }
    
    const updatePromises = items.map(item => 
      Gallery.findByIdAndUpdate(item.id, { displayOrder: item.displayOrder })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Gallery items reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder gallery items'
    });
  }
};

module.exports = {
  getGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  reorderGalleryItems
};


