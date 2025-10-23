// Debug script to check booking data and payment amounts
import apiClient from './services/apiClient';

const debugBookings = async () => {
  try {
    console.log('🔍 Debugging booking data...');
    
    // Fetch bookings
    const response = await apiClient.get('/warehouse-bookings/my-bookings');
    console.log('✅ API Response Status:', response.status);
    
    if (response.data.success) {
      const bookings = response.data.data;
      console.log(`📊 Found ${bookings.length} bookings`);
      
      bookings.forEach((booking, index) => {
        console.log(`\n--- Booking ${index + 1} ---`);
        console.log('ID:', booking._id);
        console.log('Status:', booking.status);
        console.log('Warehouse:', booking.warehouse?.name || 'N/A');
        console.log('Produce:', `${booking.produce?.type || 'N/A'} - ${booking.produce?.quantity || 0} ${booking.produce?.unit || 'units'}`);
        
        // Payment information
        console.log('Payment Status:', booking.payment?.status || 'N/A');
        console.log('Payment Amount Due:', booking.payment?.amountDue);
        console.log('Payment Type:', typeof booking.payment?.amountDue);
        
        // Pricing information
        console.log('Pricing Total Amount:', booking.pricing?.totalAmount);
        console.log('Pricing Type:', typeof booking.pricing?.totalAmount);
        
        // Check for issues
        const hasPricing = booking.pricing?.totalAmount !== undefined && booking.pricing?.totalAmount !== null;
        const hasPaymentDue = booking.payment?.amountDue !== undefined && booking.payment?.amountDue !== null;
        const isPaid = booking.payment?.status === 'paid';
        
        console.log('Has Pricing:', hasPricing);
        console.log('Has Payment Due:', hasPaymentDue);
        console.log('Is Paid:', isPaid);
        
        if (!hasPricing || booking.pricing?.totalAmount === 0) {
          console.log('⚠️  PRICING ISSUE: Total amount is zero or missing');
        }
        
        if (!hasPaymentDue) {
          console.log('⚠️  PAYMENT DUE ISSUE: Amount due is missing');
        }
      });
    } else {
      console.error('❌ API Error:', response.data.message);
    }
  } catch (error) {
    console.error('💥 Debug Error:', error);
    if (error.response) {
      console.error('Response Data:', error.response.data);
      console.error('Response Status:', error.response.status);
    }
  }
};

// Run the debug
debugBookings();