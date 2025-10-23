// Test script to verify booking pricing fix
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/db');

// Connect to database
connectDB().then(async () => {
  console.log('Connected to database');
  
  // Test the fix by checking a sample booking
  const Booking = require('./src/models/Booking');
  
  try {
    // Find a sample booking
    const booking = await Booking.findOne({ status: 'approved' }).populate('warehouse');
    
    if (booking) {
      console.log('Sample booking found:');
      console.log('- Booking ID:', booking.bookingId);
      console.log('- Status:', booking.status);
      console.log('- Payment status:', booking.payment?.status);
      console.log('- Total amount:', booking.pricing?.totalAmount);
      console.log('- Warehouse name:', booking.warehouse?.name);
      
      // Verify that pricing data is preserved
      if (booking.pricing?.totalAmount > 0) {
        console.log('✅ Pricing data is correctly preserved');
      } else {
        console.log('❌ Pricing data issue detected');
      }
    } else {
      console.log('No approved bookings found for testing');
    }
    
    // Test WarehouseBooking as well
    const { WarehouseBooking } = require('./src/models/WarehouseBooking');
    const warehouseBooking = await WarehouseBooking.findOne({ status: 'confirmed' }).populate('warehouse');
    
    if (warehouseBooking) {
      console.log('\nSample warehouse booking found:');
      console.log('- Booking ID:', warehouseBooking._id);
      console.log('- Status:', warehouseBooking.status);
      console.log('- Payment status:', warehouseBooking.payment?.status);
      console.log('- Total amount:', warehouseBooking.pricing?.totalAmount);
      console.log('- Warehouse name:', warehouseBooking.warehouse?.name);
      
      // Verify that pricing data is preserved
      if (warehouseBooking.pricing?.totalAmount > 0) {
        console.log('✅ Warehouse booking pricing data is correctly preserved');
      } else {
        console.log('❌ Warehouse booking pricing data issue detected');
      }
    } else {
      console.log('No confirmed warehouse bookings found for testing');
    }
    
    console.log('\n✅ Booking pricing fix verification completed');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}).catch(err => {
  console.error('Database connection failed:', err);
});