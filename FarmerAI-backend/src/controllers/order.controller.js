const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

// Create order from cart
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      items, 
      shippingAddress, 
      deliveryMethod = 'home_delivery',
      deliveryDate,
      deliveryTimeSlot,
      specialInstructions = '',
      paymentMethod = 'cod'
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Validate and process order items
    const orderItems = [];
    let subtotal = 0;
    let farmerId = null;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      if (!product.isAvailable()) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is not available`
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`
        });
      }

      // Set farmer ID (all items should be from same farmer for single order)
      if (!farmerId) {
        farmerId = product.farmer;
      } else if (farmerId.toString() !== product.farmer.toString()) {
        return res.status(400).json({
          success: false,
          message: 'All items in an order must be from the same farmer'
        });
      }

      const unitPrice = product.calculatePrice(item.quantity);
      const totalPrice = unitPrice * item.quantity;

      orderItems.push({
        product: product._id,
        productSnapshot: {
          name: product.name,
          price: unitPrice,
          unit: product.unit,
          image: product.images[0]?.url,
          farmerName: (await User.findById(product.farmer)).name
        },
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      });

      subtotal += totalPrice;
    }

    // Calculate delivery fee (simplified logic)
    const deliveryFee = deliveryMethod === 'home_delivery' ? 50 : 0;
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const totalAmount = subtotal + deliveryFee + tax;

    // Create order
    const orderData = {
      buyer: userId,
      farmer: farmerId,
      items: orderItems,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      tax: tax,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      shippingAddress: shippingAddress,
      deliveryMethod: deliveryMethod,
      deliveryDate: deliveryDate,
      deliveryTimeSlot: deliveryTimeSlot,
      specialInstructions: specialInstructions
    };

    const order = new Order(orderData);
    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear cart if order was created from cart
    if (req.body.clearCart) {
      const cart = await Cart.getOrCreateCart(userId);
      await cart.clearCart();
    }

    // Populate order data for response
    await order.populate([
      { path: 'buyer', select: 'name email phone' },
      { path: 'farmer', select: 'name email phone farmerProfile.farmName' },
      { path: 'items.product', select: 'name images category' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, userType = 'buyer' } = req.query;

    const filter = {};
    if (userType === 'buyer') {
      filter.buyer = userId;
    } else if (userType === 'farmer') {
      filter.farmer = userId;
    } else {
      filter.$or = [{ buyer: userId }, { farmer: userId }];
    }

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(filter)
      .populate([
        { path: 'buyer', select: 'name email phone' },
        { path: 'farmer', select: 'name email phone farmerProfile.farmName' },
        { path: 'items.product', select: 'name images category' }
      ])
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get single order
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(id)
      .populate([
        { path: 'buyer', select: 'name email phone' },
        { path: 'farmer', select: 'name email phone farmerProfile.farmName farmerProfile.bankDetails' },
        { path: 'items.product', select: 'name images category' }
      ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    if (order.buyer._id.toString() !== userId && order.farmer._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions
    const isBuyer = order.buyer.toString() === userId;
    const isFarmer = order.farmer.toString() === userId;

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    // Check who can perform this action
    if (status === 'cancelled' && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'Only buyers can cancel orders'
      });
    }

    if (['confirmed', 'processing', 'shipped'].includes(status) && !isFarmer) {
      return res.status(403).json({
        success: false,
        message: 'Only farmers can update order status to ' + status
      });
    }

    // Update order status
    await order.updateStatus(status, userId);

    // Add system message
    await order.addMessage(userId, `Order status changed to ${status}`, true);

    // If cancelled, restore product stock
    if (status === 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    logger.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.buyer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only buyers can cancel orders'
      });
    }

    if (!order.canBeCancelled) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    await order.updateStatus('cancelled', userId);
    order.cancellationReason = reason;
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    // Add system message
    await order.addMessage(userId, `Order cancelled. Reason: ${reason}`, true);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    logger.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// Add message to order
exports.addOrderMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    if (order.buyer.toString() !== userId && order.farmer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await order.addMessage(userId, message.trim());

    res.json({
      success: true,
      message: 'Message added successfully',
      data: order.messages
    });

  } catch (error) {
    logger.error('Error adding order message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error.message
    });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    const stats = await Order.getOrderStats(userId, 'buyer');
    const farmerStats = await Order.getOrderStats(userId, 'farmer');

    res.json({
      success: true,
      data: {
        buyer: stats,
        farmer: farmerStats
      }
    });

  } catch (error) {
    logger.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};

// Get orders by date range
exports.getOrdersByDateRange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, userType = 'buyer' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const orders = await Order.findByDateRange(
      new Date(startDate),
      new Date(endDate),
      userId,
      userType
    ).populate([
      { path: 'buyer', select: 'name email' },
      { path: 'farmer', select: 'name email farmerProfile.farmName' }
    ]);

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    logger.error('Error fetching orders by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};
