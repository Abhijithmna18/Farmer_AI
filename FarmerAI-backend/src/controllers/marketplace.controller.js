const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

// Get all products with filtering and pagination
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      organic,
      location,
      radius = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      farmerId
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (organic === 'true') {
      filter.organic = true;
    }

    if (farmerId) {
      filter.farmer = farmerId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Location-based filtering
    if (location) {
      const [latitude, longitude] = location.split(',').map(coord => parseFloat(coord));
      filter['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(filter)
      .populate('farmer', 'name photoURL farmerProfile.rating farmerProfile.verificationStatus')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    // Add freshness and availability info
    const productsWithInfo = products.map(product => {
      const productObj = product.toObject();
      productObj.isFresh = product.isFresh;
      productObj.daysSinceHarvest = product.daysSinceHarvest;
      productObj.freshnessDiscount = product.freshnessDiscount;
      productObj.isAvailable = product.isAvailable();
      return productObj;
    });

    res.json({
      success: true,
      data: {
        products: productsWithInfo,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total,
          hasNext: skip + products.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('farmer', 'name photoURL farmerProfile.rating farmerProfile.verificationStatus farmerProfile.farmName')
      .populate('growthCalendarId', 'cropName variety plantingDate');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    const productObj = product.toObject();
    productObj.isFresh = product.isFresh;
    productObj.daysSinceHarvest = product.daysSinceHarvest;
    productObj.freshnessDiscount = product.freshnessDiscount;
    productObj.isAvailable = product.isAvailable();

    res.json({
      success: true,
      data: productObj
    });

  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Create new product (farmer only)
exports.createProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.isFarmer) {
      return res.status(403).json({
        success: false,
        message: 'Only farmers can create products'
      });
    }

    const productData = {
      ...req.body,
      farmer: userId
    };

    // Validate required fields
    const requiredFields = ['name', 'category', 'description', 'price', 'unit', 'stock', 'harvestDate', 'expiryDate'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    // Validate dates
    if (new Date(productData.harvestDate) > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Harvest date cannot be in the future'
      });
    }

    if (new Date(productData.expiryDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be in the future'
      });
    }

    const product = new Product(productData);
    await product.save();

    // Populate farmer info for response
    await product.populate('farmer', 'name photoURL farmerProfile.rating');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Update product (farmer only)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.farmer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products'
      });
    }

    // Don't allow updating certain fields if product has orders
    const hasOrders = await Order.exists({ 
      'items.product': id, 
      status: { $nin: ['cancelled', 'refunded'] } 
    });

    if (hasOrders) {
      const restrictedFields = ['name', 'category', 'harvestDate', 'expiryDate'];
      for (const field of restrictedFields) {
        if (req.body[field] !== undefined) {
          return res.status(400).json({
            success: false,
            message: `Cannot update ${field} for products with existing orders`
          });
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('farmer', 'name photoURL farmerProfile.rating');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product (farmer only)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.farmer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products'
      });
    }

    // Check if product has pending orders
    const hasPendingOrders = await Order.exists({ 
      'items.product': id, 
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] } 
    });

    if (hasPendingOrders) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with pending orders'
      });
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Get farmer's products
exports.getFarmerProducts = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const filter = { farmer: farmerId };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching farmer products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farmer products',
      error: error.message
    });
  }
};

// Get product categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const categoryStats = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        categories,
        stats: categoryStats
      }
    });

  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({ 
      status: 'active', 
      isFeatured: true 
    })
      .populate('farmer', 'name photoURL farmerProfile.rating farmerProfile.verificationStatus')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const productsWithInfo = products.map(product => {
      const productObj = product.toObject();
      productObj.isFresh = product.isFresh;
      productObj.daysSinceHarvest = product.daysSinceHarvest;
      productObj.isAvailable = product.isAvailable();
      return productObj;
    });

    res.json({
      success: true,
      data: productsWithInfo
    });

  } catch (error) {
    logger.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      error: error.message
    });
  }
};

// Get nearby farmers
exports.getNearbyFarmers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const farmers = await User.findFarmersNearby(
      { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      parseFloat(radius)
    ).select('name photoURL farmerProfile.farmName farmerProfile.rating farmerProfile.verificationStatus');

    res.json({
      success: true,
      data: farmers
    });

  } catch (error) {
    logger.error('Error fetching nearby farmers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby farmers',
      error: error.message
    });
  }
};

// Get marketplace statistics
exports.getMarketplaceStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalFarmers: { $addToSet: '$farmer' },
          averagePrice: { $avg: '$price' },
          totalCategories: { $addToSet: '$category' },
          organicProducts: {
            $sum: { $cond: [{ $eq: ['$organic', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          totalProducts: 1,
          totalFarmers: { $size: '$totalFarmers' },
          averagePrice: { $round: ['$averagePrice', 2] },
          totalCategories: { $size: '$totalCategories' },
          organicProducts: 1
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        general: stats[0] || {
          totalProducts: 0,
          totalFarmers: 0,
          averagePrice: 0,
          totalCategories: 0,
          organicProducts: 0
        },
        categories: categoryStats
      }
    });

  } catch (error) {
    logger.error('Error fetching marketplace stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketplace statistics',
      error: error.message
    });
  }
};
