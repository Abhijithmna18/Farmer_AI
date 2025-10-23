// Test script to verify the payment amount fix
import apiClient from './services/apiClient';

const testPaymentFix = async () => {
  try {
    console.log('🧪 Testing payment amount fix...');
    
    // Fetch bookings
    const response = await apiClient.get('/warehouse-bookings/my-bookings');
    console.log('✅ API Response Status:', response.status);
    
    if (response.data.success) {
      const bookings = response.data.data;
      console.log(`📊 Found ${bookings.length} bookings`);
      
      let testPassed = true;
      
      bookings.forEach((booking, index) => {
        console.log(`\n--- Booking ${index + 1} ---`);
        console.log('ID:', booking._id);
        console.log('Status:', booking.status);
        console.log('Payment Status:', booking.payment?.status || 'N/A');
        console.log('Payment Amount Due:', booking.payment?.amountDue);
        console.log('Pricing Total Amount:', booking.pricing?.totalAmount);
        
        // Test the fix
        const totalAmount = booking.pricing?.totalAmount ?? 0;
        const amountDue = booking.payment?.amountDue ?? totalAmount;
        const isPaidBooking = booking.payment?.status === 'paid';
        const hasPricingIssue = !booking.pricing?.totalAmount || booking.pricing.totalAmount === 0;
        
        console.log('Calculated Total Amount:', totalAmount);
        console.log('Calculated Amount Due:', amountDue);
        console.log('Is Paid Booking:', isPaidBooking);
        console.log('Has Pricing Issue:', hasPricingIssue);
        
        // Validation checks
        if (isPaidBooking && amountDue !== 0) {
          console.error('❌ FAIL: Paid booking should have amountDue = 0');
          testPassed = false;
        }
        
        if (!isPaidBooking && hasPricingIssue && amountDue !== 0) {
          console.error('❌ FAIL: Unpaid booking with pricing issue should have amountDue = 0');
          testPassed = false;
        }
        
        if (!isPaidBooking && !hasPricingIssue && amountDue <= 0) {
          console.error('❌ FAIL: Unpaid booking without pricing issue should have amountDue > 0');
          testPassed = false;
        }
        
        console.log('✅ Booking validation completed');
      });
      
      if (testPassed) {
        console.log('\n🎉 ALL TESTS PASSED! Payment amount fix is working correctly.');
      } else {
        console.log('\n💥 SOME TESTS FAILED! Please check the issues above.');
      }
    } else {
      console.error('❌ API Error:', response.data.message);
    }
  } catch (error) {
    console.error('💥 Test Error:', error);
    if (error.response) {
      console.error('Response Data:', error.response.data);
      console.error('Response Status:', error.response.status);
    }
  }
};

// Run the test
testPaymentFix();