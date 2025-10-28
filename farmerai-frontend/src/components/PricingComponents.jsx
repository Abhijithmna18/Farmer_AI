import React, { useState } from 'react';
import { handleZeroPricing, fixBookingPricing } from './pricingUtils';

// React component for handling zero pricing display
export const PricingDisplay = ({ booking, onFixPricing, showBreakdown = false }) => {
  const pricing = handleZeroPricing.formatPricing(booking?.pricing);
  
  if (pricing.needsFix) {
    return (
      <div className="pricing-error">
        <div className="text-red-600 font-semibold">
          {pricing.display}
        </div>
        <button
          onClick={() => onFixPricing?.(booking)}
          className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          {handleZeroPricing.getFixButtonText(booking)}
        </button>
      </div>
    );
  }
  
  return (
    <div className="pricing-display">
      <div className="text-green-600 font-semibold text-lg">
        {pricing.display}
      </div>
      {showBreakdown && (
        <div className="text-sm text-gray-600 mt-1">
          <div>Base: ₹{pricing.breakdown.basePrice}</div>
          <div>Platform Fee: ₹{pricing.breakdown.platformFee}</div>
          <div>Owner: ₹{pricing.breakdown.ownerAmount}</div>
        </div>
      )}
    </div>
  );
};

// Hook for managing pricing fixes
export const usePricingFix = () => {
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState(null);
  
  const fixPricing = async (bookingId, token) => {
    setFixing(true);
    setError(null);
    
    try {
      const result = await fixBookingPricing(bookingId, token);
      
      if (result.success) {
        return result.data;
      } else {
        setError(result.message);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setFixing(false);
    }
  };
  
  return {
    fixPricing,
    fixing,
    error
  };
};
