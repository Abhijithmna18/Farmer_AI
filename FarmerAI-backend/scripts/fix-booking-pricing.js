// scripts/fix-booking-pricing.js
// One-time script to recalculate pricing for bookings with missing or zero totalAmount

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');
const Warehouse = require('../src/models/Warehouse');

async function fixBookingPricing() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmerai');
    console.log('✅ Connected to MongoDB');

    // Find all bookings with zero or missing totalAmount
    const bookings = await Booking.find({
      $or: [
        { 'pricing.totalAmount': { $exists: false } },
        { 'pricing.totalAmount': 0 },
        { 'pricing.totalAmount': null }
      ]
    }).populate('warehouse', 'pricing');

    console.log(`Found ${bookings.length} bookings with missing or zero pricing`);

    let fixed = 0;
    let skipped = 0;

    for (const booking of bookings) {
      try {
        const basePrice = booking.warehouse?.pricing?.basePrice || booking.pricing?.basePrice || 0;
        const duration = booking.bookingDates?.duration || 0;
        const quantity = booking.produce?.quantity || 0;

        if (basePrice > 0 && duration > 0 && quantity > 0) {
          const totalAmount = basePrice * duration * quantity;
          const platformFee = Math.round(totalAmount * 0.05);
          const ownerAmount = totalAmount - platformFee;

          booking.pricing = booking.pricing || {};
          booking.pricing.basePrice = basePrice;
          booking.pricing.totalAmount = totalAmount;
          booking.pricing.platformFee = platformFee;
          booking.pricing.ownerAmount = ownerAmount;
          booking.pricing.currency = booking.pricing.currency || 'INR';

          // Also set payment.amountDue
          booking.payment = booking.payment || {};
          booking.payment.amountDue = (booking.payment.status === 'paid') ? 0 : totalAmount;

          await booking.save();
          console.log(`✅ Fixed booking ${booking.bookingId}: ₹${totalAmount}`);
          fixed++;
        } else {
          console.log(`⚠️  Skipped booking ${booking.bookingId}: missing data (basePrice=${basePrice}, duration=${duration}, quantity=${quantity})`);
          skipped++;
        }
      } catch (err) {
        console.error(`❌ Error fixing booking ${booking.bookingId}:`, err.message);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${bookings.length}`);

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

fixBookingPricing();
