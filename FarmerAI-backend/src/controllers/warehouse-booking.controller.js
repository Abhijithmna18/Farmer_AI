// src/controllers/warehouse-booking.controller.js
const Booking = require('../models/Booking');
const Warehouse = require('../models/Warehouse');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { createOrder, verifyPayment: verifyRazorpayPayment } = require('../config/razorpay');
const { 
  sendBookingConfirmation, 
  sendPaymentConfirmation,
  sendBookingConfirmationToAdmin,
  sendBookingConfirmationToOwner
} = require('../services/email.service');
const { generateInvoice } = require('../services/invoice.service');
const logger = require('../utils/logger');
const path = require('path');

// Create a new warehouse booking
const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      warehouseId,
      produce,
      storageRequirements,
      bookingDates,
      notes
    } = req.body;

    // Validate required fields
    if (!warehouseId || !produce || !storageRequirements || !bookingDates) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: warehouseId, produce, storageRequirements, bookingDates'
      });
    }

    // Validate produce data
    if (!produce.type || !produce.quantity || !produce.unit) {
      return res.status(400).json({
        success: false,
        message: 'Produce must include type, quantity, and unit'
      });
    }

    // Validate quantity is a positive number
    const quantity = parseFloat(produce.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    // Validate unit is valid
    const validUnits = ['kg', 'tons', 'quintals', 'bags', 'sqft', 'cubic_meters'];
    if (!validUnits.includes(produce.unit)) {
      return res.status(400).json({
        success: false,
        message: `Invalid unit. Must be one of: ${validUnits.join(', ')}`
      });
    }

    // Get warehouse details
    const warehouse = await Warehouse.findById(warehouseId)
      .populate('owner', 'firstName lastName email phone warehouseOwnerProfile');

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if warehouse is active and available
    if (warehouse.status !== 'active' || !warehouse.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse is not available for booking'
      });
    }

    // Check if user has enough capacity
    if (warehouse.capacity.available < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient capacity. Available: ${warehouse.capacity.available} ${warehouse.capacity.unit}, Requested: ${quantity} ${produce.unit}`
      });
    }

    // Validate warehouse pricing data
    const pricingValidation = warehouse.validatePricing();
    if (!pricingValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid warehouse pricing: ${pricingValidation.errors.join(', ')}`
      });
    }

    // Calculate and validate duration
    const startDate = new Date(bookingDates.startDate);
    const endDate = new Date(bookingDates.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please provide valid start and end dates.'
      });
    }
    
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date.'
      });
    }
    
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be at least 1 day.'
      });
    }

    // Validate minimum booking duration
    if (duration < warehouse.terms.minimumBookingDuration) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking duration is ${warehouse.terms.minimumBookingDuration} days`
      });
    }

    // Quantity already validated above

    // Calculate pricing using warehouse validation method
    let totalAmount, basePrice, platformFee, ownerAmount;
    try {
      const priceCalculation = warehouse.calculatePrice(
        bookingDates.startDate, 
        bookingDates.endDate, 
        quantity
      );
      
      totalAmount = priceCalculation.totalAmount;
      basePrice = priceCalculation.basePrice;
      platformFee = Math.round(totalAmount * 0.05); // 5% platform fee
      ownerAmount = totalAmount - platformFee;
      
      if (totalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Calculated total amount must be greater than 0. Please check warehouse pricing.'
        });
      }
    } catch (priceError) {
      return res.status(400).json({
        success: false,
        message: `Pricing calculation failed: ${priceError.message}`
      });
    }

    // Create booking
    const booking = new Booking({
      bookingId: Booking.generateBookingId(),
      farmer: userId,
      warehouse: warehouseId,
      warehouseOwner: warehouse.owner._id,
      produce: {
        type: produce.type,
        quantity: quantity, // Use validated quantity
        unit: produce.unit,
        quality: produce.quality || 'good',
        description: produce.description || '',
        expectedHarvestDate: produce.expectedHarvestDate
      },
      storageRequirements: {
        temperature: storageRequirements.temperature || {},
        humidity: storageRequirements.humidity || {},
        storageType: storageRequirements.storageType,
        specialHandling: storageRequirements.specialHandling || ''
      },
      bookingDates: {
        startDate: startDate,
        endDate: endDate,
        duration: duration
      },
      pricing: {
        basePrice: basePrice,
        totalAmount: totalAmount,
        platformFee: platformFee,
        ownerAmount: ownerAmount,
        currency: warehouse.pricing.currency || 'INR'
      },
      status: 'pending',
      notes: notes || '',
      payment: {
        status: 'pending',
        amount: totalAmount,
        currency: warehouse.pricing.currency || 'INR'
      }
    });

    await booking.save();

    // Create Razorpay order
    let razorpayOrder = null;
    try {
      razorpayOrder = await createOrder(
        totalAmount,
        'INR',
        `booking_${booking._id}`
      );

      // Create payment record
      const payment = new Payment({
        booking: booking._id,
        farmer: userId,
        warehouseOwner: warehouse.owner._id,
        amount: {
          total: totalAmount,
          platformFee: platformFee,
          ownerAmount: ownerAmount,
          currency: 'INR'
        },
        razorpay: {
          orderId: razorpayOrder.id,
          status: 'created'
        },
        status: 'pending'
      });

      await payment.save();

      // Update booking with payment info
      booking.payment.razorpayOrderId = razorpayOrder.id;
      booking.payment.paymentId = payment._id;
      await booking.save();

    } catch (paymentError) {
      logger.error('Error creating Razorpay order:', paymentError);
      // Continue without payment for now, user can pay later
    }

    // Populate booking for response and emails
    await booking.populate([
      { path: 'farmer', select: 'firstName lastName email phone' },
      { path: 'warehouse', select: 'name location capacity pricing' },
      { path: 'warehouseOwner', select: 'firstName lastName email phone' }
    ]);

    // Send confirmation email to farmer
    try {
      const farmerEmail = booking.farmer?.email;
      if (farmerEmail) {
        await sendBookingConfirmation(farmerEmail, {
          bookingId: booking.bookingId || String(booking._id),
          farmerName: `${booking.farmer.firstName || ''} ${booking.farmer.lastName || ''}`.trim() || 'Farmer',
          warehouseName: booking.warehouse?.name || 'Warehouse',
          warehouseLocation: `${booking.warehouse?.location?.city || ''}, ${booking.warehouse?.location?.state || ''}`,
          storageType: booking.storageRequirements?.storageType || 'general',
          produceType: booking.produce?.type,
          quantity: booking.produce?.quantity,
          unit: booking.produce?.unit,
          startDate: booking.bookingDates?.startDate ? new Date(booking.bookingDates.startDate).toLocaleDateString() : '',
          endDate: booking.bookingDates?.endDate ? new Date(booking.bookingDates.endDate).toLocaleDateString() : '',
          totalAmount: booking.pricing?.totalAmount
        });
      }
    } catch (emailError) {
      logger.error('Error sending booking confirmation email:', emailError);
    }

    // Notify admin to review booking (optional)
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendBookingConfirmationToAdmin(adminEmail, {
          bookingId: booking.bookingId || String(booking._id),
          farmerName: `${booking.farmer.firstName || ''} ${booking.farmer.lastName || ''}`.trim(),
          warehouseName: booking.warehouse.name,
          ownerName: `${booking.warehouseOwner.firstName || ''} ${booking.warehouseOwner.lastName || ''}`.trim(),
          warehouseLocation: `${booking.warehouse.location?.city || ''}, ${booking.warehouse.location?.state || ''}`,
          produceType: booking.produce.type,
          quantity: booking.produce.quantity,
          unit: booking.produce.unit,
          startDate: new Date(booking.bookingDates.startDate).toLocaleDateString(),
          endDate: new Date(booking.bookingDates.endDate).toLocaleDateString(),
          totalAmount: booking.pricing.totalAmount,
          paymentStatus: booking.payment.status
        });
      }
    } catch (emailError) {
      logger.error('Error sending notification to admin:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: booking,
        razorpayOrder: razorpayOrder,
        paymentUrl: razorpayOrder ? `/payment/${booking._id}` : null
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

// Reconcile booking values from source-of-truth on demand
const reconcileBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(id)
      .populate('farmer', 'firstName lastName email')
      .populate('warehouse', 'name location pricing')
      .populate('warehouseOwner', 'firstName lastName email');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    // permission: farmer, owner, or admin
    const canView = booking.farmer._id.toString() === userId
      || booking.warehouseOwner._id.toString() === userId
      || (req.user?.role === 'admin' || (Array.isArray(req.user?.roles) && req.user.roles.includes('admin')));
    if (!canView) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Recompute duration
    const start = new Date(booking.bookingDates.startDate);
    const end = new Date(booking.bookingDates.endDate);
    const computedDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (Number.isFinite(computedDuration) && computedDuration > 0 && booking.bookingDates.duration !== computedDuration) {
      booking.bookingDates.duration = computedDuration;
    }

    // Recompute pricing if missing or zero
    if (!booking.pricing?.totalAmount || booking.pricing.totalAmount === 0) {
      const basePrice = booking.warehouse?.pricing?.basePrice || booking.pricing?.basePrice || 0;
      const duration = booking.bookingDates?.duration || computedDuration || 0;
      const quantity = booking.produce?.quantity || 0;
      
      if (basePrice > 0 && duration > 0 && quantity > 0) {
        const totalAmount = basePrice * duration * quantity;
        const platformFee = Math.round(totalAmount * 0.05);
        const ownerAmount = totalAmount - platformFee;
        
        booking.pricing = booking.pricing || {};
        booking.pricing.basePrice = basePrice;
        booking.pricing.totalAmount = totalAmount;
        booking.pricing.platformFee = platformFee;
        booking.pricing.ownerAmount = ownerAmount;
        booking.pricing.currency = booking.pricing.currency || 'INR';
      }
    }

    // Recompute payment due (lightweight rule)
    let amountDue = null;
    const total = booking?.pricing?.totalAmount;
    if (typeof total === 'number') {
      amountDue = (booking.payment?.status === 'paid') ? 0 : total;
    }
    booking.payment = booking.payment || {};
    if (amountDue !== null) booking.payment.amountDue = amountDue;

    await booking.save();

    const fresh = await Booking.findById(id)
      .populate('farmer', 'firstName lastName email')
      .populate('warehouse', 'name location pricing')
      .populate('warehouseOwner', 'firstName lastName email');

    return res.json({ success: true, data: fresh });
  } catch (error) {
    logger.error('Error reconciling booking:', error);
    return res.status(500).json({ success: false, message: 'Failed to reconcile booking', error: error.message });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { farmer: userId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('warehouse', 'name location capacity pricing images')
      .populate('warehouseOwner', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Ensure payment.amountDue is set for each booking
    const enrichedBookings = bookings.map(booking => {
      if (!booking.payment) booking.payment = {};
      
      // Calculate amountDue if not already set or is null/undefined
      if (booking.payment.amountDue == null) {
        const total = booking.pricing?.totalAmount;
        if (typeof total === 'number' && !isNaN(total)) {
          // If booking is paid, amount due is 0, otherwise it's the total amount
          booking.payment.amountDue = (booking.payment.status === 'paid') ? 0 : total;
        } else {
          // Fallback to 0 if no valid total amount
          booking.payment.amountDue = 0;
        }
      }
      
      return booking;
    });

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: enrichedBookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(id)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouse', 'name location capacity pricing images facilities')
      .populate('warehouseOwner', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has permission to view this booking
    const canView = booking.farmer._id.toString() === userId || 
                   booking.warehouseOwner._id.toString() === userId ||
                   req.user.role === 'admin';

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this booking'
      });
    }

    // Ensure payment.amountDue is set
    if (!booking.payment) booking.payment = {};
    if (booking.payment.amountDue == null) {
      const total = booking.pricing?.totalAmount;
      if (typeof total === 'number' && !isNaN(total)) {
        // If booking is paid, amount due is 0, otherwise it's the total amount
        booking.payment.amountDue = (booking.payment.status === 'paid') ? 0 : total;
      } else {
        // Fallback to 0 if no valid total amount
        booking.payment.amountDue = 0;
      }
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    // Handle both field naming conventions
    const { bookingId, paymentId, signature, orderId, razorpay_payment_id, razorpay_signature, razorpay_order_id } = req.body;
    
    // Use the new field names if provided, otherwise fall back to old names
    const actualBookingId = bookingId;
    const actualPaymentId = razorpay_payment_id || paymentId;
    const actualSignature = razorpay_signature || signature;
    const actualOrderId = razorpay_order_id || orderId;
    
    const userId = req.user.id;

    logger.info(`=== PAYMENT VERIFICATION START ===`);
    logger.info(`Verifying payment for booking ${actualBookingId}`);
    logger.info(`Payment details:`, { 
      bookingId: actualBookingId, 
      paymentId: actualPaymentId ? 'present' : 'missing', 
      signature: actualSignature ? 'present' : 'missing',
      orderId: actualOrderId ? 'present' : 'missing',
      paymentIdLength: actualPaymentId?.length,
      signatureLength: actualSignature?.length,
      orderIdLength: actualOrderId?.length
    });
    logger.info(`User ID: ${userId}`);

    // Validate required fields
    if (!actualBookingId) {
      logger.error('❌ Missing bookingId in request');
      return res.status(400).json({
        success: false,
        message: 'Missing required field: bookingId is required'
      });
    }
    
    if (!actualPaymentId) {
      logger.error('❌ Missing paymentId in request');
      return res.status(400).json({
        success: false,
        message: 'Missing required field: paymentId is required'
      });
    }
    
    if (!actualSignature) {
      logger.error('❌ Missing signature in request');
      return res.status(400).json({
        success: false,
        message: 'Missing required field: signature is required'
      });
    }

    // Find booking
    logger.info(`Looking up booking with ID: ${actualBookingId}`);
    const booking = await Booking.findById(actualBookingId)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouse', 'name location capacity pricing')
      .populate('warehouseOwner', 'firstName lastName email phone');

    if (!booking) {
      logger.error(`❌ Booking not found: ${actualBookingId}`);
      return res.status(404).json({
        success: false,
        message: `Booking not found with ID: ${actualBookingId}`
      });
    }

    logger.info(`✅ Booking found:`, { 
      id: booking._id, 
      status: booking.status, 
      paymentStatus: booking.payment?.status,
      farmerId: booking.farmer?._id,
      userId: userId
    });

    // Check if user owns this booking
    if (booking.farmer._id.toString() !== userId) {
      logger.error(`❌ User ${userId} does not own booking ${actualBookingId}`);
      logger.error(`Expected farmer ID: ${booking.farmer._id}, Actual user ID: ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to verify payment for this booking'
      });
    }

    // Get orderId from request or booking
    const razorpayOrderId = actualOrderId || booking.payment?.razorpayOrderId;
    
    if (!razorpayOrderId) {
      logger.error(`❌ No razorpayOrderId found for booking ${actualBookingId}`);
      return res.status(400).json({
        success: false,
        message: 'No Razorpay order ID found. Please provide orderId in the request or ensure booking has a valid order ID.'
      });
    }

    logger.info(`Verifying signature with orderId: ${razorpayOrderId}`);

    // Verify payment signature
    let isValid = false;
    try {
      isValid = verifyRazorpayPayment(razorpayOrderId, actualPaymentId, actualSignature);
      logger.info(`Signature verification result: ${isValid}`);
    } catch (verifyError) {
      logger.error('Error during payment verification:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'Payment verification failed due to server error',
        error: verifyError.message
      });
    }

    if (!isValid) {
      logger.error('❌ Payment signature verification failed');
      logger.error(`Expected signature calculation: orderId=${razorpayOrderId} + | + paymentId=${actualPaymentId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. The payment could not be verified.'
      });
    }

    logger.info('✅ Payment signature verified successfully');

    // Update booking status: awaiting admin approval
    booking.status = 'awaiting-approval';
    booking.payment.status = 'paid';
    booking.payment.razorpayPaymentId = actualPaymentId;
    booking.payment.paidAt = new Date();
    
    // Ensure amountDue is set to 0 for paid bookings
    booking.payment.amountDue = 0;
    
    await booking.save();

    // Update payment record
    const payment = await Payment.findOne({ booking: actualBookingId });
    if (payment) {
      payment.razorpay.paymentId = actualPaymentId;
      payment.razorpay.status = 'paid';
      payment.status = 'completed';
      await payment.save();
    }

    // Generate invoice
    let invoiceUrl = null;
    try {
      const invoicePath = await generateInvoice(booking);
      // Convert file path to URL-accessible path
      const fileName = path.basename(invoicePath);
      invoiceUrl = `/invoices/${fileName}`;
      logger.info(`Invoice generated successfully: ${invoiceUrl}`);
      
      // Save invoice URL to booking
      booking.invoiceUrl = invoiceUrl;
      await booking.save();
    } catch (invoiceError) {
      logger.error('Error generating invoice:', invoiceError);
    }

    // Send payment confirmation email to farmer
    try {
      const farmerEmail = booking.farmer?.email;
      if (farmerEmail) {
        await sendPaymentConfirmation(farmerEmail, {
          bookingId: booking.bookingId || String(booking._id),
          farmerName: `${booking.farmer.firstName || ''} ${booking.farmer.lastName || ''}`.trim(),
          paymentId: actualPaymentId,
          amount: booking.pricing.totalAmount,
          paymentMethod: 'Razorpay',
          paymentDate: new Date().toLocaleString('en-IN'),
          warehouseName: booking.warehouse.name,
          startDate: new Date(booking.bookingDates.startDate).toLocaleDateString(),
          endDate: new Date(booking.bookingDates.endDate).toLocaleDateString()
        });
      }
    } catch (emailError) {
      logger.error('Error sending payment confirmation email to farmer:', emailError);
    }

    // Send booking confirmation to warehouse owner
    try {
      const ownerEmail = booking.warehouseOwner?.email;
      if (ownerEmail) {
        await sendBookingConfirmationToOwner(ownerEmail, {
          bookingId: booking.bookingId || String(booking._id),
          ownerName: `${booking.warehouseOwner.firstName || ''} ${booking.warehouseOwner.lastName || ''}`.trim(),
          farmerName: `${booking.farmer.firstName || ''} ${booking.farmer.lastName || ''}`.trim(),
          farmerEmail: booking.farmer?.email,
          farmerPhone: booking.farmer?.phone || 'N/A',
          warehouseName: booking.warehouse.name,
          produceType: booking.produce.type,
          quantity: booking.produce.quantity,
          unit: booking.produce.unit,
          startDate: new Date(booking.bookingDates.startDate).toLocaleDateString(),
          endDate: new Date(booking.bookingDates.endDate).toLocaleDateString(),
          totalAmount: booking.pricing.totalAmount,
          paymentStatus: booking.payment.status,
          notes: booking.notes || ''
        });
      }
    } catch (emailError) {
      logger.error('Error sending booking confirmation to owner:', emailError);
    }

    // Notify admin with revenue analysis
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendBookingConfirmationToAdmin(adminEmail, {
          bookingId: booking.bookingId || String(booking._id),
          farmerName: `${booking.farmer.firstName || ''} ${booking.farmer.lastName || ''}`.trim(),
          warehouseName: booking.warehouse.name,
          ownerName: `${booking.warehouseOwner.firstName || ''} ${booking.warehouseOwner.lastName || ''}`.trim(),
          warehouseLocation: `${booking.warehouse.location?.city || ''}, ${booking.warehouse.location?.state || ''}`,
          produceType: booking.produce.type,
          quantity: booking.produce.quantity,
          unit: booking.produce.unit,
          startDate: new Date(booking.bookingDates.startDate).toLocaleDateString(),
          endDate: new Date(booking.bookingDates.endDate).toLocaleDateString(),
          totalAmount: booking.pricing.totalAmount,
          platformFee: booking.pricing.platformFee,
          ownerAmount: booking.pricing.ownerAmount,
          paymentStatus: booking.payment.status,
          invoiceUrl: invoiceUrl
        });
      }
    } catch (emailError) {
      logger.error('Error notifying admin about paid booking:', emailError);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        ...booking.toObject(),
        invoiceUrl: invoiceUrl
      }
    });

  } catch (error) {
    logger.error('=== PAYMENT VERIFICATION CRITICAL ERROR ===');
    logger.error('Error verifying payment:', error);
    logger.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.farmer._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (['cancelled', 'completed', 'rejected'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    await booking.save();

    // TODO: Process refund if payment was made

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    logger.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

// Get warehouse availability
const getWarehouseAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, quantity } = req.query;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if dates are provided
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Check for conflicting bookings
    const conflictingBookings = await Booking.find({
      warehouse: id,
      status: { $in: ['pending', 'awaiting-approval', 'approved', 'active'] },
      $or: [
        {
          'bookingDates.startDate': { $lte: end },
          'bookingDates.endDate': { $gte: start }
        }
      ]
    });

    // Calculate available capacity
    let totalBookedCapacity = 0;
    conflictingBookings.forEach(booking => {
      totalBookedCapacity += booking.produce.quantity;
    });

    const availableCapacity = warehouse.capacity.available - totalBookedCapacity;
    const isAvailable = availableCapacity >= quantity;

    // Calculate price
    const basePrice = warehouse.pricing.basePrice;
    const totalPrice = basePrice * duration * quantity;

    res.json({
      success: true,
      data: {
        isAvailable,
        availableCapacity,
        totalCapacity: warehouse.capacity.available,
        duration,
        price: {
          basePrice,
          totalPrice,
          currency: warehouse.pricing.currency || 'INR'
        },
        conflictingBookings: conflictingBookings.length
      }
    });

  } catch (error) {
    logger.error('Error checking warehouse availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  verifyPayment,
  cancelBooking,
  getWarehouseAvailability,
  reconcileBooking
};


