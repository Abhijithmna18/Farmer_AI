const mongoose = require('mongoose');

// Cart item schema
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Shopping cart schema
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    
    items: [cartItemSchema],
    
    // Cart metadata
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Cart expires after 30 days of inactivity
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    },
    
    // Saved for later items (wishlist functionality)
    savedItems: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      savedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Cart preferences
    preferences: {
      autoRemoveExpired: {
        type: Boolean,
        default: true
      },
      notifyOnPriceChange: {
        type: Boolean,
        default: true
      },
      notifyOnStockChange: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Virtual for cart item count
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for cart total (calculated dynamically)
cartSchema.virtual('total').get(async function() {
  let total = 0;
  
  for (const item of this.items) {
    const product = await mongoose.model('Product').findById(item.product);
    if (product && product.isAvailable()) {
      const price = product.calculatePrice(item.quantity);
      total += price * item.quantity;
    }
  }
  
  return total;
});

// Virtual for checking if cart has items
cartSchema.virtual('hasItems').get(function() {
  return this.items && this.items.length > 0;
});

// Pre-save middleware to update lastUpdated timestamp
cartSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  next();
});

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = new this({ user: userId });
    await cart.save();
  }
  
  return cart;
};

// Instance method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1, notes = '') {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (!product.isAvailable()) {
    throw new Error('Product is not available');
  }
  
  if (quantity > product.stock) {
    throw new Error('Insufficient stock');
  }
  
  // Check if item already exists in cart
  const existingItem = this.items.find(item => item.product.toString() === productId);
  
  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    
    if (newQuantity > product.stock) {
      throw new Error('Insufficient stock for requested quantity');
    }
    
    existingItem.quantity = newQuantity;
    if (notes) {
      existingItem.notes = notes;
    }
  } else {
    this.items.push({
      product: productId,
      quantity,
      notes
    });
  }
  
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (quantity <= 0) {
    return this.removeItem(productId);
  }
  
  if (quantity > product.stock) {
    throw new Error('Insufficient stock');
  }
  
  const item = this.items.find(item => item.product.toString() === productId);
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  item.quantity = quantity;
  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId);
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Instance method to move item to saved items
cartSchema.methods.saveForLater = function(productId) {
  const item = this.items.find(item => item.product.toString() === productId);
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  // Remove from cart items
  this.items = this.items.filter(item => item.product.toString() !== productId);
  
  // Add to saved items if not already there
  const alreadySaved = this.savedItems.some(saved => saved.product.toString() === productId);
  if (!alreadySaved) {
    this.savedItems.push({ product: productId });
  }
  
  return this.save();
};

// Instance method to move item from saved to cart
cartSchema.methods.moveToCart = async function(productId, quantity = 1) {
  const savedItem = this.savedItems.find(item => item.product.toString() === productId);
  
  if (!savedItem) {
    throw new Error('Item not found in saved items');
  }
  
  // Remove from saved items
  this.savedItems = this.savedItems.filter(item => item.product.toString() !== productId);
  
  // Add to cart
  await this.addItem(productId, quantity);
  
  return this.save();
};

// Instance method to validate cart items
cartSchema.methods.validateCart = async function() {
  const Product = mongoose.model('Product');
  const validationResults = {
    valid: true,
    errors: [],
    warnings: [],
    updatedItems: []
  };
  
  for (let i = this.items.length - 1; i >= 0; i--) {
    const item = this.items[i];
    const product = await Product.findById(item.product);
    
    if (!product) {
      validationResults.errors.push(`Product ${item.product} no longer exists`);
      this.items.splice(i, 1);
      validationResults.valid = false;
      continue;
    }
    
    if (!product.isAvailable()) {
      validationResults.errors.push(`Product "${product.name}" is no longer available`);
      this.items.splice(i, 1);
      validationResults.valid = false;
      continue;
    }
    
    if (item.quantity > product.stock) {
      if (product.stock === 0) {
        validationResults.errors.push(`Product "${product.name}" is out of stock`);
        this.items.splice(i, 1);
        validationResults.valid = false;
      } else {
        validationResults.warnings.push(`Product "${product.name}" quantity reduced from ${item.quantity} to ${product.stock} (available stock)`);
        item.quantity = product.stock;
        validationResults.updatedItems.push(item);
      }
    }
    
    // Check for price changes
    const currentPrice = product.calculatePrice(item.quantity);
    if (currentPrice !== item.unitPrice) {
      validationResults.warnings.push(`Price changed for "${product.name}" from ₹${item.unitPrice} to ₹${currentPrice}`);
      item.unitPrice = currentPrice;
      validationResults.updatedItems.push(item);
    }
  }
  
  if (validationResults.updatedItems.length > 0 || !validationResults.valid) {
    await this.save();
  }
  
  return validationResults;
};

// Instance method to get cart summary
cartSchema.methods.getSummary = async function() {
  const Product = mongoose.model('Product');
  const summary = {
    itemCount: 0,
    totalAmount: 0,
    items: [],
    unavailableItems: [],
    totalSavings: 0
  };
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    
    if (!product || !product.isAvailable()) {
      summary.unavailableItems.push({
        productId: item.product,
        productName: product?.name || 'Unknown Product',
        quantity: item.quantity
      });
      continue;
    }
    
    const unitPrice = product.calculatePrice(item.quantity);
    const totalPrice = unitPrice * item.quantity;
    const originalPrice = product.price * item.quantity;
    const savings = originalPrice - totalPrice;
    
    summary.itemCount += item.quantity;
    summary.totalAmount += totalPrice;
    summary.totalSavings += savings;
    
    summary.items.push({
      productId: item.product,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      image: product.images[0]?.url,
      unit: product.unit
    });
  }
  
  return summary;
};

module.exports = mongoose.model('Cart', cartSchema);
