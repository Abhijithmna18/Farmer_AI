// Quick fix for the specific booking showing ₹0.00
// This script will find and fix the GreenField Cold Storage booking

const mongoose = require('mongoose');
const { WarehouseBooking } = require('./src/models/WarehouseBooking.js');
const Warehouse = require('./src/models/Warehouse.js');

async function fixSpecificBooking() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/farmerai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Looking for GreenField Cold Storage booking with zero pricing...\n');

    // Find the specific booking
    const booking = await WarehouseBooking.findOne({
      'warehouse.name': { $regex: /GreenField/i },
      $or: [
        { 'pricing.totalAmount': 0 },
        { 'pricing.totalAmount': { $exists: false } },
        { 'pricing.totalAmount': null }
      ]
    }).populate('warehouse', 'name pricing basePrice').populate('farmer', 'firstName lastName email');

    if (!booking) {
      console.log('❌ No GreenField booking with zero pricing found');
      
      // Let's check all bookings with zero pricing
      const zeroBookings = await WarehouseBooking.find({
        $or: [
          { 'pricing.totalAmount': 0 },
          { 'pricing.totalAmount': { $exists: false } },
          { 'pricing.totalAmount': null }
        ]
      }).populate('warehouse', 'name pricing basePrice');
      
      console.log(`\nFound ${zeroBookings.length} bookings with zero pricing:`);
      zeroBookings.forEach(b => {
        console.log(`- ${b.warehouse?.name || 'Unknown'}: ₹${b.pricing?.totalAmount || 0}`);
      });
      
      return;
    }

    console.log(`📋 Found booking: ${booking._id}`);
    console.log(`   Warehouse: ${booking.warehouse?.name}`);
    console.log(`   Current Price: ₹${booking.pricing?.totalAmount || 0}`);
    console.log(`   Duration: ${booking.bookingDates?.duration || 'Unknown'} days`);
    console.log(`   Quantity: ${booking.produce?.quantity || 0}`);
    console.log(`   Warehouse Base Price: ₹${booking.warehouse?.pricing?.basePrice || 0}`);

    // Get fresh warehouse data
    const warehouse = await Warehouse.findById(booking.warehouse?._id);
    if (!warehouse) {
      console.log('❌ Warehouse not found');
      return;
    }

    // Calculate correct pricing
    const startDate = new Date(booking.bookingDates.startDate);
    const endDate = new Date(booking.bookingDates.endDate);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const quantity = booking.produce?.quantity || 0;
    const basePrice = warehouse.pricing.basePrice;

    console.log(`\n📊 Calculating correct pricing:`);
    console.log(`   Start Date: ${startDate.toISOString()}`);
    console.log(`   End Date: ${endDate.toISOString()}`);
    console.log(`   Duration: ${duration} days`);
    console.log(`   Quantity: ${quantity}`);
    console.log(`   Base Price: ₹${basePrice}`);

    if (duration <= 0 || quantity <= 0 || basePrice <= 0) {
      console.log('❌ Cannot calculate pricing - invalid data');
      return;
    }

    // Calculate new pricing
    const totalAmount = basePrice * duration * quantity;
    const platformFee = Math.round(totalAmount * 0.05);
    const ownerAmount = totalAmount - platformFee;

    console.log(`\n💰 New Pricing:`);
    console.log(`   Total Amount: ₹${totalAmount}`);
    console.log(`   Platform Fee: ₹${platformFee}`);
    console.log(`   Owner Amount: ₹${ownerAmount}`);

    // Update the booking
    booking.pricing = {
      basePrice: basePrice,
      totalAmount: totalAmount,
      platformFee: platformFee,
      ownerAmount: ownerAmount,
      currency: 'INR'
    };

    // Update payment amount due
    booking.payment = booking.payment || {};
    booking.payment.amountDue = totalAmount;

    // Update duration if it was incorrect
    if (booking.bookingDates.duration !== duration) {
      booking.bookingDates.duration = duration;
    }

    await booking.save();

    console.log(`\n✅ Successfully updated booking pricing to ₹${totalAmount}`);
    console.log(`   Payment Due: ₹${totalAmount}`);
    console.log(`   Duration: ${duration} days`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixSpecificBooking();
