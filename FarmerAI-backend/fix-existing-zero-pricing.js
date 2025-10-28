const mongoose = require('mongoose');
const { WarehouseBooking } = require('./src/models/WarehouseBooking.js');
const Warehouse = require('./src/models/Warehouse.js');

async function fixExistingZeroPricingBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/farmerai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Finding bookings with zero pricing...\n');

    // Find all bookings with zero or missing pricing
    const zeroPricingBookings = await WarehouseBooking.find({
      $or: [
        { 'pricing.totalAmount': 0 },
        { 'pricing.totalAmount': { $exists: false } },
        { 'pricing.totalAmount': null },
        { 'pricing.totalAmount': { $lt: 1 } }
      ]
    }).populate('warehouse', 'name pricing basePrice').populate('farmer', 'firstName lastName email');

    console.log(`Found ${zeroPricingBookings.length} bookings with zero pricing:\n`);

    if (zeroPricingBookings.length === 0) {
      console.log('🎉 No bookings with zero pricing found!');
      return;
    }

    let fixedCount = 0;
    let failedCount = 0;

    for (const booking of zeroPricingBookings) {
      console.log(`\n📋 Processing Booking: ${booking._id}`);
      console.log(`   Farmer: ${booking.farmer?.firstName} ${booking.farmer?.lastName}`);
      console.log(`   Warehouse: ${booking.warehouse?.name || 'Unknown'}`);
      console.log(`   Current Price: ₹${booking.pricing?.totalAmount || 0}`);
      console.log(`   Duration: ${booking.bookingDates?.duration || 'Unknown'} days`);
      console.log(`   Quantity: ${booking.produce?.quantity || 0}`);
      console.log(`   Warehouse Base Price: ₹${booking.warehouse?.pricing?.basePrice || 0}`);

      try {
        // Get fresh warehouse data
        const warehouse = await Warehouse.findById(booking.warehouse?._id);
        if (!warehouse) {
          console.log(`   ❌ Warehouse not found for booking ${booking._id}`);
          failedCount++;
          continue;
        }

        // Validate warehouse pricing
        const pricingValidation = warehouse.validatePricing();
        if (!pricingValidation.isValid) {
          console.log(`   ❌ Warehouse has invalid pricing: ${pricingValidation.errors.join(', ')}`);
          failedCount++;
          continue;
        }

        // Calculate correct pricing
        const startDate = new Date(booking.bookingDates.startDate);
        const endDate = new Date(booking.bookingDates.endDate);
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const quantity = booking.produce?.quantity || 0;
        const basePrice = warehouse.pricing.basePrice;

        if (duration <= 0 || quantity <= 0 || basePrice <= 0) {
          console.log(`   ❌ Cannot calculate pricing - invalid data:`);
          console.log(`      Duration: ${duration} days`);
          console.log(`      Quantity: ${quantity}`);
          console.log(`      Base Price: ₹${basePrice}`);
          failedCount++;
          continue;
        }

        // Calculate new pricing
        const totalAmount = basePrice * duration * quantity;
        const platformFee = Math.round(totalAmount * 0.05);
        const ownerAmount = totalAmount - platformFee;

        console.log(`   📊 New Pricing Calculation:`);
        console.log(`      Base Price: ₹${basePrice}`);
        console.log(`      Duration: ${duration} days`);
        console.log(`      Quantity: ${quantity}`);
        console.log(`      Total Amount: ₹${totalAmount}`);
        console.log(`      Platform Fee: ₹${platformFee}`);
        console.log(`      Owner Amount: ₹${ownerAmount}`);

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

        console.log(`   ✅ Successfully updated booking pricing to ₹${totalAmount}`);
        fixedCount++;

      } catch (error) {
        console.log(`   ❌ Failed to fix booking: ${error.message}`);
        failedCount++;
      }
    }

    console.log(`\n🎉 Fix Complete!`);
    console.log(`   ✅ Fixed: ${fixedCount} bookings`);
    console.log(`   ❌ Failed: ${failedCount} bookings`);

    // Verify the fixes
    console.log(`\n🔍 Verifying fixes...`);
    const remainingZeroPricing = await WarehouseBooking.find({
      $or: [
        { 'pricing.totalAmount': 0 },
        { 'pricing.totalAmount': { $exists: false } },
        { 'pricing.totalAmount': null },
        { 'pricing.totalAmount': { $lt: 1 } }
      ]
    });

    console.log(`   Remaining zero pricing bookings: ${remainingZeroPricing.length}`);

    if (remainingZeroPricing.length === 0) {
      console.log(`   🎉 All zero pricing issues have been resolved!`);
    } else {
      console.log(`   ⚠️  ${remainingZeroPricing.length} bookings still have zero pricing`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixExistingZeroPricingBookings();
