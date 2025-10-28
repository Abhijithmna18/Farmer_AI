// Manual fix script for zero pricing
// Run this in your browser console while on the My Bookings page

async function fixZeroPricing() {
  try {
    // Get the booking ID from the current page
    const bookingId = prompt('Enter the booking ID to fix pricing:');
    if (!bookingId) return;
    
    console.log('🔧 Fixing pricing for booking:', bookingId);
    
    // Call the reconcile endpoint
    const response = await fetch(`/api/warehouse-bookings/${bookingId}/reconcile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Pricing fixed successfully!');
      console.log('New pricing:', result.data.pricing);
      
      // Refresh the page to see updated pricing
      window.location.reload();
    } else {
      console.error('❌ Failed to fix pricing:', result.message);
    }
  } catch (error) {
    console.error('❌ Error fixing pricing:', error);
  }
}

// Auto-detect and fix all bookings with zero pricing
async function fixAllZeroPricing() {
  try {
    console.log('🔍 Checking for bookings with zero pricing...');
    
    // Get all bookings
    const response = await fetch('/api/warehouse-bookings/my-bookings', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      const bookings = result.data || [];
      const zeroPricingBookings = bookings.filter(b => 
        !b.pricing?.totalAmount || b.pricing.totalAmount === 0
      );
      
      console.log(`Found ${zeroPricingBookings.length} bookings with zero pricing`);
      
      if (zeroPricingBookings.length === 0) {
        console.log('✅ No bookings with zero pricing found');
        return;
      }
      
      // Fix each booking
      for (const booking of zeroPricingBookings) {
        console.log(`🔧 Fixing booking ${booking._id}...`);
        
        const fixResponse = await fetch(`/api/warehouse-bookings/${booking._id}/reconcile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        const fixResult = await fixResponse.json();
        
        if (fixResult.success) {
          console.log(`✅ Fixed booking ${booking._id}: ₹${fixResult.data.pricing.totalAmount}`);
        } else {
          console.error(`❌ Failed to fix booking ${booking._id}:`, fixResult.message);
        }
      }
      
      console.log('🔄 Refreshing page to show updated pricing...');
      setTimeout(() => window.location.reload(), 1000);
    }
  } catch (error) {
    console.error('❌ Error checking bookings:', error);
  }
}

// Make functions available globally
window.fixZeroPricing = fixZeroPricing;
window.fixAllZeroPricing = fixAllZeroPricing;

console.log('🔧 Zero pricing fix functions loaded!');
console.log('Run fixZeroPricing() to fix a specific booking');
console.log('Run fixAllZeroPricing() to fix all bookings with zero pricing');
