// Test script to check the current booking data and see why it's showing ₹0.00
const mongoose = require('mongoose');
const { WarehouseBooking } = require('./src/models/WarehouseBooking.js');

async function checkBookingData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmerai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all bookings
    const bookings = await WarehouseBooking.find({})
      .populate('warehouse', 'name pricing basePrice')
      .populate('farmer', 'firstName lastName email')
      .limit(5);

    console.log(`\n🔍 Found ${bookings.length} bookings:\n`);

    bookings.forEach((booking, index) => {
      console.log(`📋 Booking ${index + 1}: ${booking._id}`);
      console.log(`   Warehouse: ${booking.warehouse?.name || 'Unknown'}`);
      console.log(`   Pricing Object:`, JSON.stringify(booking.pricing, null, 2));
      console.log(`   Payment Object:`, JSON.stringify(booking.payment, null, 2));
      console.log(`   Booking Dates:`, JSON.stringify(booking.bookingDates, null, 2));
      console.log(`   Produce:`, JSON.stringify(booking.produce, null, 2));
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkBookingData();
