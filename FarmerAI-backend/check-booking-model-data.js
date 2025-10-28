// Check the Booking model data (not WarehouseBooking)
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking.js');

async function checkBookingModelData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmerai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all bookings in the Booking model
    const bookings = await Booking.find({})
      .populate('warehouse', 'name pricing basePrice')
      .populate('farmer', 'firstName lastName email')
      .limit(5);

    console.log(`\n🔍 Found ${bookings.length} bookings in Booking model:\n`);

    bookings.forEach((booking, index) => {
      console.log(`📋 Booking ${index + 1}: ${booking._id}`);
      console.log(`   Warehouse: ${booking.warehouse?.name || 'Unknown'}`);
      console.log(`   Pricing Object:`, JSON.stringify(booking.pricing, null, 2));
      console.log(`   Payment Object:`, JSON.stringify(booking.payment, null, 2));
      console.log(`   Booking Dates:`, JSON.stringify(booking.bookingDates, null, 2));
      console.log(`   Produce:`, JSON.stringify(booking.produce, null, 2));
      console.log('   ---');
    });

    // Check for zero pricing specifically
    const zeroPricingBookings = await Booking.find({
      $or: [
        { 'pricing.totalAmount': 0 },
        { 'pricing.totalAmount': { $exists: false } },
        { 'pricing.totalAmount': null }
      ]
    }).populate('warehouse', 'name pricing basePrice');

    console.log(`\n🔍 Found ${zeroPricingBookings.length} bookings with zero pricing:`);
    zeroPricingBookings.forEach((booking, index) => {
      console.log(`📋 Zero Pricing Booking ${index + 1}: ${booking._id}`);
      console.log(`   Warehouse: ${booking.warehouse?.name || 'Unknown'}`);
      console.log(`   Current Price: ₹${booking.pricing?.totalAmount || 0}`);
      console.log(`   Duration: ${booking.bookingDates?.duration || 'Unknown'} days`);
      console.log(`   Quantity: ${booking.produce?.quantity || 0}`);
      console.log(`   Warehouse Base Price: ₹${booking.warehouse?.pricing?.basePrice || 0}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkBookingModelData();
