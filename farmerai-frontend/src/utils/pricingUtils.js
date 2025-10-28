// Frontend utility to handle zero pricing issues
// This can be added to your existing utils or used directly in components

export const handleZeroPricing = {
  // Check if pricing is zero or invalid
  isZeroPricing: (pricing) => {
    if (!pricing) return true;
    const totalAmount = pricing.totalAmount || 0;
    return totalAmount <= 0;
  },

  // Get display text for zero pricing
  getZeroPricingText: (pricing) => {
    if (!pricing) return 'Pricing unavailable';
    const totalAmount = pricing.totalAmount || 0;
    if (totalAmount <= 0) return 'Pricing needs to be calculated';
    return `₹${totalAmount}`;
  },

  // Check if booking needs pricing fix
  needsPricingFix: (booking) => {
    if (!booking) return false;
    const pricing = booking.pricing || {};
    const totalAmount = pricing.totalAmount || 0;
    return totalAmount <= 0;
  },

  // Get fix pricing button text
  getFixButtonText: (booking) => {
    if (!booking) return 'Fix Pricing';
    const pricing = booking.pricing || {};
    const totalAmount = pricing.totalAmount || 0;
    if (totalAmount <= 0) return 'Fix Pricing';
    return 'Recalculate Pricing';
  },

  // Format pricing for display
  formatPricing: (pricing) => {
    if (!pricing) return { display: 'Pricing unavailable', needsFix: true };
    
    const totalAmount = pricing.totalAmount || 0;
    const basePrice = pricing.basePrice || 0;
    const platformFee = pricing.platformFee || 0;
    const ownerAmount = pricing.ownerAmount || 0;
    
    if (totalAmount <= 0) {
      return {
        display: 'Pricing needs to be calculated',
        needsFix: true,
        breakdown: {
          basePrice: 0,
          platformFee: 0,
          ownerAmount: 0,
          totalAmount: 0
        }
      };
    }
    
    return {
      display: `₹${totalAmount}`,
      needsFix: false,
      breakdown: {
        basePrice: basePrice,
        platformFee: platformFee,
        ownerAmount: ownerAmount,
        totalAmount: totalAmount
      }
    };
  }
};

// API call to fix pricing
export const fixBookingPricing = async (bookingId, token) => {
  try {
    const response = await fetch(`/api/warehouse-bookings/${bookingId}/reconcile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Pricing fixed successfully'
      };
    } else {
      return {
        success: false,
        message: result.message || 'Failed to fix pricing'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
};
