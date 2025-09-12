const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../utils/logger');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.getOrCreateCart(userId);
    await cart.populate('items.product', 'name price unit images stock status organic category');

    // Validate cart items
    const validationResults = await cart.validateCart();

    const summary = await cart.getSummary();

    res.json({
      success: true,
      data: {
        cart: cart,
        summary: summary,
        validation: validationResults
      }
    });

  } catch (error) {
    logger.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, notes = '' } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const cart = await Cart.getOrCreateCart(userId);
    await cart.addItem(productId, quantity, notes);

    await cart.populate('items.product', 'name price unit images stock status organic category');

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });

  } catch (error) {
    logger.error('Error adding to cart:', error);
    
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const cart = await Cart.getOrCreateCart(userId);
    await cart.updateItemQuantity(productId, quantity);

    await cart.populate('items.product', 'name price unit images stock status organic category');

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart
    });

  } catch (error) {
    logger.error('Error updating cart item:', error);
    
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.getOrCreateCart(userId);
    await cart.removeItem(productId);

    await cart.populate('items.product', 'name price unit images stock status organic category');

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart
    });

  } catch (error) {
    logger.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.getOrCreateCart(userId);
    await cart.clearCart();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });

  } catch (error) {
    logger.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// Save item for later
exports.saveForLater = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.getOrCreateCart(userId);
    await cart.saveForLater(productId);

    await cart.populate('items.product', 'name price unit images stock status organic category');
    await cart.populate('savedItems.product', 'name price unit images stock status organic category');

    res.json({
      success: true,
      message: 'Item saved for later successfully',
      data: cart
    });

  } catch (error) {
    logger.error('Error saving for later:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save item for later',
      error: error.message
    });
  }
};

// Move item from saved to cart
exports.moveToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    const cart = await Cart.getOrCreateCart(userId);
    await cart.moveToCart(productId, quantity);

    await cart.populate('items.product', 'name price unit images stock status organic category');
    await cart.populate('savedItems.product', 'name price unit images stock status organic category');

    res.json({
      success: true,
      message: 'Item moved to cart successfully',
      data: cart
    });

  } catch (error) {
    logger.error('Error moving to cart:', error);
    
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to move item to cart',
      error: error.message
    });
  }
};

// Get cart summary
exports.getCartSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.getOrCreateCart(userId);
    const summary = await cart.getSummary();

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Error getting cart summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart summary',
      error: error.message
    });
  }
};

// Validate cart
exports.validateCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.getOrCreateCart(userId);
    const validationResults = await cart.validateCart();

    res.json({
      success: true,
      data: validationResults
    });

  } catch (error) {
    logger.error('Error validating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate cart',
      error: error.message
    });
  }
};

// Get saved items (wishlist)
exports.getSavedItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.getOrCreateCart(userId);
    await cart.populate('savedItems.product', 'name price unit images stock status organic category');

    res.json({
      success: true,
      data: cart.savedItems
    });

  } catch (error) {
    logger.error('Error fetching saved items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved items',
      error: error.message
    });
  }
};

// Remove saved item
exports.removeSavedItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.getOrCreateCart(userId);
    cart.savedItems = cart.savedItems.filter(item => item.product.toString() !== productId);
    await cart.save();

    res.json({
      success: true,
      message: 'Saved item removed successfully',
      data: cart.savedItems
    });

  } catch (error) {
    logger.error('Error removing saved item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove saved item',
      error: error.message
    });
  }
};
