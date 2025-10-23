// Test script to verify payment verification and amount display fixes
import apiClient from './services/apiClient';

const testPaymentVerification = async () => {
  try {
    console.log('🧪 Testing payment verification and amount display fix...');
    
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
        
        // Validation checks for the payment fix
        if (isPaidBooking) {
          // For paid bookings, amountDue should be 0
          if (amountDue !== 0) {
            console.error('❌ FAIL: Paid booking should have amountDue = 0, but got:', amountDue);
            testPassed = false;
          }
          
          // For paid bookings, we should still show the total amount
          if (totalAmount <= 0 && !hasPricingIssue) {
            console.error('❌ FAIL: Paid booking should have valid totalAmount');
            testPassed = false;
          }
          
          console.log('✅ Paid booking validation passed');
        } else {
          // For unpaid bookings
          if (hasPricingIssue) {
            // Unpaid bookings with pricing issues should have amountDue = 0
            if (amountDue !== 0) {
              console.error('❌ FAIL: Unpaid booking with pricing issue should have amountDue = 0, but got:', amountDue);
              testPassed = false;
            }
            console.log('✅ Unpaid booking with pricing issue validation passed');
          } else {
            // Unpaid bookings without pricing issues should have amountDue > 0
            if (amountDue <= 0) {
              console.error('❌ FAIL: Unpaid booking without pricing issue should have amountDue > 0, but got:', amountDue);
              testPassed = false;
            }
            console.log('✅ Unpaid booking without pricing issue validation passed');
          }
        }
      });
      
      if (testPassed) {
        console.log('\n🎉 ALL PAYMENT VERIFICATION TESTS PASSED! Payment logic is working correctly.');
      } else {
        console.log('\n💥 SOME PAYMENT VERIFICATION TESTS FAILED! Please check the issues above.');
      }
      
      // Test a specific booking if we have one
      if (bookings.length > 0) {
        const firstBooking = bookings[0];
        console.log('\n--- Testing specific booking refresh ---');
        console.log('Testing booking ID:', firstBooking._id);
        
        try {
          // Test refresh endpoint
          const refreshResponse = await apiClient.get(`/warehouse-bookings/${firstBooking._id}/reconcile`);
          console.log('✅ Refresh API call successful');
          console.log('Refreshed booking payment status:', refreshResponse.data.data?.payment?.status);
          console.log('Refreshed booking amount due:', refreshResponse.data.data?.payment?.amountDue);
        } catch (refreshError) {
          console.error('❌ Refresh API call failed:', refreshError.message);
        }
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
testPaymentVerification();