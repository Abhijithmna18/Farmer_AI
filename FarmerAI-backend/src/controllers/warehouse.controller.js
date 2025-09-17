// src/controllers/warehouse.controller.js
const Warehouse = require('../models/Warehouse');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { createOrder } = require('../config/razorpay');
const { sendNewBookingNotification } = require('../services/email.service');
const logger = require('../utils/logger');

// Get all warehouses with filters
const getWarehouses = async (req, res) => {
  try {
    // Validate and sanitize query parameters
    const {
      page = 1,
      limit = 10,
      search,
      storageTypes,
      minPrice,
      maxPrice,
      latitude,
      longitude,
      maxDistance = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    
    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'name', 'pricing.basePrice', 'rating.average', 'location.city'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const query = {
      status: 'active',
      'verification.status': 'verified'
    };

    // Search by name or description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { 'location.city': { $regex: searchRegex } },
        { 'location.state': { $regex: searchRegex } }
      ];
    }

    // Filter by storage types
    if (storageTypes) {
      const types = Array.isArray(storageTypes) ? storageTypes : storageTypes.split(',');
      const validTypes = types.filter(type => 
        ['cold_storage', 'dry_storage', 'grain_storage', 'refrigerated', 'frozen', 'ambient', 'controlled_atmosphere'].includes(type)
      );
      if (validTypes.length > 0) {
        query.storageTypes = { $in: validTypes };
      }
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        query['pricing.basePrice'].$gte = parseFloat(minPrice);
      }
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        query['pricing.basePrice'].$lte = parseFloat(maxPrice);
      }
    }

    // Location-based search (optional - only if valid coordinates provided)
    if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const distance = Math.min(parseInt(maxDistance) || 50, 200); // Max 200km
      
      // Validate coordinate ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: distance * 1000 // Convert km to meters
          }
        };
        logger.info(`Location-based search enabled: lat=${lat}, lng=${lng}, distance=${distance}km`);
      } else {
        logger.warn(`Invalid coordinates provided: lat=${lat}, lng=${lng}`);
      }
    } else {
      logger.info('No location coordinates provided - returning all warehouses');
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortField] = sortDirection;

    logger.info(`Fetching warehouses with query:`, { 
      page: pageNum, 
      limit: limitNum, 
      search: search?.trim(), 
      sortBy: sortField,
      sortOrder: sortDirection 
    });

    // Execute query with error handling
    let warehouses = [];
    let total = 0;

    try {
      warehouses = await Warehouse.find(query)
        .populate('owner', 'firstName lastName email phone warehouseOwnerProfile')
        .sort(sortOptions)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean()
        .exec();

      total = await Warehouse.countDocuments(query).exec();
    } catch (dbError) {
      logger.error('Database query error:', {
        error: dbError.message,
        query: query,
        stack: dbError.stack
      });

      // Fallback: try a simpler query without location if location search failed
      if (query['location.coordinates']) {
        logger.info('Retrying without location-based search...');
        const fallbackQuery = { ...query };
        delete fallbackQuery['location.coordinates'];
        
        try {
          warehouses = await Warehouse.find(fallbackQuery)
            .populate('owner', 'firstName lastName email phone warehouseOwnerProfile')
            .sort(sortOptions)
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .lean()
            .exec();

          total = await Warehouse.countDocuments(fallbackQuery).exec();
          logger.info('Fallback query successful - returned warehouses without location filter');
        } catch (fallbackError) {
          logger.error('Fallback query also failed:', fallbackError.message);
          throw fallbackError;
        }
      } else {
        throw dbError;
      }
    }

    logger.info(`Found ${warehouses.length} warehouses out of ${total} total`);

    res.json({
      success: true,
      data: warehouses,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    // Final safety net: never crash, always return a paginated response
    logger.error('Error fetching warehouses:', {
      error: error?.message,
      stack: error?.stack,
      query: req?.query
    });

    try {
      const pageNum = Math.max(1, parseInt(req.query?.page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(req.query?.limit) || 10));
      const fallbackQuery = { status: 'active', 'verification.status': 'verified' };
      const sortOptions = { createdAt: -1 };

      const warehouses = await Warehouse.find(fallbackQuery)
        .populate('owner', 'firstName lastName email phone warehouseOwnerProfile')
        .sort(sortOptions)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean()
        .exec();

      const total = await Warehouse.countDocuments(fallbackQuery).exec();

      return res.json({
        success: true,
        data: warehouses,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        },
        warning: 'Returned fallback results due to an internal error. Filters may not have been applied.'
      });
    } catch (fallbackErr) {
      logger.error('Fallback fetch also failed:', {
        error: fallbackErr?.message,
        stack: fallbackErr?.stack
      });

      // Handle specific MongoDB errors
      if (error.name === 'CastError' || fallbackErr.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          error: 'One or more query parameters have invalid values'
        });
      }
      
      if (error.name === 'ValidationError' || fallbackErr.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.message || fallbackErr.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch warehouses',
        error: process.env.NODE_ENV === 'development' ? (error.message || fallbackErr.message) : 'Internal server error'
      });
    }
  }
};

// Get warehouse by ID
const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format'
      });
    }

    logger.info(`Fetching warehouse with ID: ${id}`);

    const warehouse = await Warehouse.findById(id)
      .populate('owner', 'firstName lastName email phone warehouseOwnerProfile')
      .populate('bookings', 'bookingId status bookingDates produce')
      .lean()
      .exec();

    if (!warehouse) {
      logger.warn(`Warehouse not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    logger.info(`Successfully fetched warehouse: ${warehouse.name}`);

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    logger.error('Error fetching warehouse:', {
      error: error.message,
      stack: error.stack,
      warehouseId: req.params.id
    });

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
        error: 'The provided ID is not a valid ObjectId'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create warehouse (warehouse owner only)
const createWarehouse = async (req, res) => {
  try {
    const userId = req.user.id;

    // Allow both JSON body and multipart form with a field 'warehouseData'
    let payload = req.body || {};
    if (payload.warehouseData && typeof payload.warehouseData === 'string') {
      try {
        payload = JSON.parse(payload.warehouseData);
      } catch (_) {
        // ignore parse error, will fall back to raw body
      }
    }

    // Map frontend form into Warehouse model shape
    const uiToModelStorageTypes = {
      'cold-storage': 'cold_storage',
      'dry-storage': 'dry_storage',
      'refrigerated': 'refrigerated',
      'frozen': 'frozen',
      'general': 'ambient',
      'temperature-control': 'controlled_atmosphere',
      'pest-control': 'grain_storage'
    };
    const allowedFacilities = new Set([
      'security', 'cctv', 'fire_safety', 'loading_dock', 'forklift',
      'temperature_control', 'humidity_control', 'pest_control', 'insurance'
    ]);

    const address = payload.address || {};
    const coordinatesInput = address.coordinates || payload.coordinates || {};
    let lng = undefined;
    let lat = undefined;
    if (Array.isArray(coordinatesInput?.coordinates) && coordinatesInput.coordinates.length === 2) {
      lng = parseFloat(coordinatesInput.coordinates[0]);
      lat = parseFloat(coordinatesInput.coordinates[1]);
    } else {
      lat = parseFloat(coordinatesInput.latitude ?? payload.latitude);
      lng = parseFloat(coordinatesInput.longitude ?? payload.longitude);
    }
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

    const totalCapacity = Number(payload?.capacity?.total);
    const capacityUnit = (payload?.capacity?.unit || 'kg').toLowerCase();

    const pricePerDay = payload.pricePerDay != null && payload.pricePerDay !== '' ? Number(payload.pricePerDay) : null;
    const pricePerTon = payload.pricePerTon != null && payload.pricePerTon !== '' ? Number(payload.pricePerTon) : null;

    const streetOrAddress = address.address || address.street || payload.addressLine || payload.street || payload.locationAddress;
    const mapped = {
      name: payload.name,
      description: payload.description,
      owner: userId,
      location: {
        address: streetOrAddress,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        coordinates: hasValidCoords
          ? { type: 'Point', coordinates: [lng, lat] }
          : undefined
      },
      capacity: {
        total: Number.isFinite(totalCapacity) ? totalCapacity : 0,
        available: Number.isFinite(totalCapacity) ? totalCapacity : 0,
        unit: ['kg', 'tons', 'quintals', 'bags', 'sqft', 'cubic_meters'].includes(capacityUnit)
          ? capacityUnit
          : 'kg'
      },
      storageTypes: (Array.isArray(payload.storageTypes) ? payload.storageTypes : (typeof payload.storageTypes === 'string' ? payload.storageTypes.split(',') : []))
        .map((t) => uiToModelStorageTypes[t?.trim()] || t?.trim())
        .filter((t) => ['cold_storage', 'dry_storage', 'grain_storage', 'refrigerated', 'frozen', 'ambient', 'controlled_atmosphere'].includes(t)),
      facilities: Array.isArray(payload.facilities)
        ? payload.facilities
            .map((f) => {
              if (f === '24x7-security') return 'security';
              if (f === 'cctv-monitoring') return 'cctv';
              if (f === 'fire-safety') return 'fire_safety';
              if (f === 'loading-dock') return 'loading_dock';
              if (f === 'temperature-monitoring') return 'temperature_control';
              if (f === 'humidity-control') return 'humidity_control';
              if (f === 'pest-control') return 'pest_control';
              if (f === 'insurance-coverage') return 'insurance';
              if (f === 'forklift') return 'forklift';
              return null; // drop unsupported values like transportation/packaging/quality-check
            })
            .filter((f) => f && allowedFacilities.has(f))
        : [],
      pricing: {
        basePrice: Number.isFinite(payload?.pricing?.basePrice) ? Number(payload.pricing.basePrice) : (Number.isFinite(pricePerDay) ? pricePerDay : Number.isFinite(pricePerTon) ? pricePerTon : 0),
        pricePerUnit: payload?.pricing?.pricePerUnit || (Number.isFinite(pricePerDay) ? 'per_day' : Number.isFinite(pricePerTon) ? 'per_ton' : 'per_day'),
        currency: (payload?.pricing?.currency) || 'INR',
        seasonalMultiplier: Number.isFinite(payload?.pricing?.seasonalMultiplier) ? Number(payload.pricing.seasonalMultiplier) : 1.0
      },
      images: Array.isArray(payload.images)
        ? payload.images.filter(Boolean).map((url, idx) => ({ url, isPrimary: idx === 0 }))
        : [],
      operatingHours: payload.operatingHours || undefined,
      contact: {
        phone: payload?.contact?.phone || req.user.phone || '',
        email: payload?.contact?.email || req.user.email || ''
      },
      status: 'draft', // default until admin activates
      verification: { status: 'pending' }
    };

    // Basic required fields validation
    if (!mapped.name || !mapped.description || !mapped.location?.address || !mapped.location?.city || !mapped.location?.state || !mapped.location?.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, address, city, state, pincode'
      });
    }

    const warehouse = new Warehouse(mapped);
    await warehouse.save();

    // Populate owner details
    await warehouse.populate('owner', 'firstName lastName email phone warehouseOwnerProfile');

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully. Pending admin verification.',
      data: warehouse
    });
  } catch (error) {
    logger.error('Error creating warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create warehouse',
      error: error.message
    });
  }
};

// Update warehouse (owner only)
const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const warehouse = await Warehouse.findOne({ _id: id, owner: userId });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found or you do not have permission to update it'
      });
    }

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email phone warehouseOwnerProfile');

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: updatedWarehouse
    });
  } catch (error) {
    logger.error('Error updating warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update warehouse',
      error: error.message
    });
  }
};

// Delete warehouse (owner only)
const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const warehouse = await Warehouse.findOne({ _id: id, owner: userId });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found or you do not have permission to delete it'
      });
    }

    // Check if there are any active bookings
    const activeBookings = await Booking.countDocuments({
      warehouse: id,
      status: { $in: ['paid', 'awaiting-approval', 'approved'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete warehouse with active bookings'
      });
    }

    await Warehouse.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete warehouse',
      error: error.message
    });
  }
};

// Check warehouse availability
const checkAvailability = async (req, res) => {
  try {
    const { warehouseId, startDate, endDate, quantity } = req.query;

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    const isAvailable = warehouse.checkAvailability(startDate, endDate, parseInt(quantity));
    const price = warehouse.calculatePrice(startDate, endDate);

    res.json({
      success: true,
      data: {
        available: isAvailable,
        price,
        warehouse: {
          id: warehouse._id,
          name: warehouse.name,
          capacity: warehouse.capacity
        }
      }
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
};

// Book warehouse
const bookWarehouse = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      warehouseId,
      produce,
      storageRequirements,
      bookingDates,
      quantity
    } = req.body;

    // Get warehouse details
    const warehouse = await Warehouse.findById(warehouseId)
      .populate('owner', 'firstName lastName email phone');

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check availability
    const isAvailable = warehouse.checkAvailability(
      bookingDates.startDate,
      bookingDates.endDate,
      quantity
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse not available for the selected dates'
      });
    }

    // Calculate pricing
    const basePrice = warehouse.calculatePrice(bookingDates.startDate, bookingDates.endDate);
    const platformFee = Math.round(basePrice * 0.05); // 5% platform fee
    const totalAmount = basePrice + platformFee;
    const ownerAmount = basePrice;

    // Create Razorpay order
    const order = await createOrder(totalAmount, 'INR', `booking_${Date.now()}`);

    // Create booking
    const booking = new Booking({
      bookingId: Booking.generateBookingId(),
      farmer: userId,
      warehouse: warehouseId,
      warehouseOwner: warehouse.owner._id,
      produce,
      storageRequirements,
      bookingDates: {
        ...bookingDates,
        duration: Math.ceil((new Date(bookingDates.endDate) - new Date(bookingDates.startDate)) / (1000 * 60 * 60 * 24))
      },
      pricing: {
        basePrice,
        totalAmount,
        platformFee,
        ownerAmount,
        currency: 'INR'
      },
      payment: {
        razorpayOrderId: order.id
      }
    });

    await booking.save();

    // Send notification to warehouse owner
    try {
      await sendNewBookingNotification(warehouse.owner.email, {
        bookingId: booking.bookingId,
        farmerName: req.user.firstName + ' ' + req.user.lastName,
        farmerPhone: req.user.phone,
        warehouseName: warehouse.name,
        produceType: produce.type,
        quantity: produce.quantity,
        unit: produce.unit,
        startDate: bookingDates.startDate,
        endDate: bookingDates.endDate,
        totalAmount
      });
    } catch (emailError) {
      logger.error('Failed to send notification email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking,
        razorpayOrder: order
      }
    });
  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Get warehouses by owner
const getOwnerWarehouses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const warehouses = await Warehouse.find({ owner: userId })
      .populate('bookings', 'bookingId status bookingDates produce')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Warehouse.countDocuments({ owner: userId });

    res.json({
      success: true,
      data: warehouses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching owner warehouses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouses',
      error: error.message
    });
  }
};

// Set warehouse status (activate/deactivate/maintenance) - owner only
const setWarehouseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, isAvailable } = req.body || {};

    const allowedStatuses = ['active', 'inactive', 'maintenance'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`
      });
    }

    const warehouse = await Warehouse.findOne({ _id: id, owner: userId });
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found or you do not have permission to update it'
      });
    }

    if (typeof isAvailable === 'boolean') {
      warehouse.isAvailable = isAvailable;
    }
    if (status) {
      warehouse.status = status;
    }

    await warehouse.save();

    await warehouse.populate('owner', 'firstName lastName email phone warehouseOwnerProfile');

    return res.json({
      success: true,
      message: 'Warehouse status updated',
      data: warehouse
    });
  } catch (error) {
    logger.error('Error setting warehouse status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// Get warehouse statistics
const getWarehouseStats = async (req, res) => {
  try {
    const stats = await Warehouse.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching warehouse stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse statistics',
      error: error.message
    });
  }
};

// Health check for warehouses endpoint
const getWarehousesHealth = async (req, res) => {
  try {
    // Test database connection
    const count = await Warehouse.countDocuments();
    
    res.json({
      success: true,
      message: 'Warehouses service is healthy',
      data: {
        databaseConnected: true,
        totalWarehouses: count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Warehouses health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Warehouses service is unhealthy',
      error: error.message
    });
  }
};

module.exports = {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  checkAvailability,
  bookWarehouse,
  getOwnerWarehouses,
  setWarehouseStatus,
  getWarehouseStats,
  getWarehousesHealth
};

