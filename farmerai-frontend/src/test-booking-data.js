import apiClient from './services/apiClient';

// Function to fetch and display booking data for debugging
export const debugBookingData = async () => {
  try {
    console.log('Fetching booking data for debugging...');
    const response = await apiClient.get('/warehouse-bookings/my-bookings');
    
    console.log('Full API Response:', response);
    
    if (response.data.success) {
      const bookings = response.data.data;
      console.log(`Found ${bookings.length} bookings`);
      
      bookings.forEach((booking, index) => {
        console.log(`\n--- Booking ${index + 1} ---`);
        console.log('Booking ID:', booking._id);
        console.log('Status:', booking.status);
        console.log('Payment Status:', booking.payment?.status);
        console.log('Payment Amount Due:', booking.payment?.amountDue);
        console.log('Pricing Total Amount:', booking.pricing?.totalAmount);
        console.log('Warehouse Name:', booking.warehouse?.name);
        console.log('Produce Type:', booking.produce?.type);
        console.log('Quantity:', booking.produce?.quantity);
      });
    } else {
      console.error('API returned error:', response.data.message);
    }
  } catch (error) {
    console.error('Error fetching booking data:', error);
    console.error('Error response:', error.response?.data);
  }
};

// Run the debug function
debugBookingData();