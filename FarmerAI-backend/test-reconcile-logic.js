const mongoose = require('mongoose');
const WarehouseBooking = require('./src/models/WarehouseBooking.js');
const Warehouse = require('./src/models/Warehouse.js');

async function testReconcileEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/farmerai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find bookings with zero pricing
    const zeroPricingBookings = await WarehouseBooking.find({
      $or: [
        { 'pricing.totalAmount': 0 },
        { 'pricing.totalAmount': { $exists: false } },
        { 'pricing.totalAmount': null }
      ]
    }).populate('warehouse', 'name pricing');

    console.log(`\n🔍 Found ${zeroPricingBookings.length} bookings with zero pricing:`);
    
    for (const booking of zeroPricingBookings) {
      console.log(`\n📋 Booking ID: ${booking._id}`);
      console.log(`   Warehouse: ${booking.warehouse?.name || 'Unknown'}`);
      console.log(`   Current Pricing: ₹${booking.pricing?.totalAmount || 0}`);
      console.log(`   Duration: ${booking.bookingDates?.duration || 'Unknown'} days`);
      console.log(`   Quantity: ${booking.produce?.quantity || 0}`);
      console.log(`   Warehouse Base Price: ₹${booking.warehouse?.pricing?.basePrice || 0}`);
      
      // Calculate what the pricing should be
      const basePrice = booking.warehouse?.pricing?.basePrice || 0;
      const duration = booking.bookingDates?.duration || 0;
      const quantity = booking.produce?.quantity || 0;
      
      if (basePrice > 0 && duration > 0 && quantity > 0) {
        const expectedTotal = basePrice * duration * quantity;
        const expectedPlatformFee = Math.round(expectedTotal * 0.05);
        const expectedOwnerAmount = expectedTotal - expectedPlatformFee;
        
        console.log(`   📊 Expected Calculation:`);
        console.log(`      Base Amount: ₹${basePrice} × ${duration} days × ${quantity} = ₹${expectedTotal}`);
        console.log(`      Platform Fee (5%): ₹${expectedPlatformFee}`);
        console.log(`      Owner Amount: ₹${expectedOwnerAmount}`);
        console.log(`      Total Amount: ₹${expectedTotal}`);
      } else {
        console.log(`   ⚠️  Cannot calculate - missing data:`);
        console.log(`      Base Price: ${basePrice > 0 ? '✅' : '❌'}`);
        console.log(`      Duration: ${duration > 0 ? '✅' : '❌'}`);
        console.log(`      Quantity: ${quantity > 0 ? '✅' : '❌'}`);
      }
    }

    // Test the reconcile logic manually
    if (zeroPricingBookings.length > 0) {
      const testBooking = zeroPricingBookings[0];
      console.log(`\n🧪 Testing reconcile logic on booking: ${testBooking._id}`);
      
      // Simulate the reconcile logic
      const start = new Date(testBooking.bookingDates.startDate);
      const end = new Date(testBooking.bookingDates.endDate);
      const computedDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      console.log(`   📅 Date Calculation:`);
      console.log(`      Start: ${start.toISOString()}`);
      console.log(`      End: ${end.toISOString()}`);
      console.log(`      Computed Duration: ${computedDuration} days`);
      
      const basePrice = testBooking.warehouse?.pricing?.basePrice || 0;
      const duration = computedDuration;
      const quantity = testBooking.produce?.quantity || 0;
      
      if (basePrice > 0 && duration > 0 && quantity > 0) {
        const totalAmount = basePrice * duration * quantity;
        const platformFee = Math.round(totalAmount * 0.05);
        const ownerAmount = totalAmount - platformFee;
        
        console.log(`   💰 Pricing Calculation:`);
        console.log(`      Base Price: ₹${basePrice}`);
        console.log(`      Duration: ${duration} days`);
        console.log(`      Quantity: ${quantity}`);
        console.log(`      Total Amount: ₹${totalAmount}`);
        console.log(`      Platform Fee: ₹${platformFee}`);
        console.log(`      Owner Amount: ₹${ownerAmount}`);
        
        // Update the booking
        testBooking.pricing = testBooking.pricing || {};
        testBooking.pricing.basePrice = basePrice;
        testBooking.pricing.totalAmount = totalAmount;
        testBooking.pricing.platformFee = platformFee;
        testBooking.pricing.ownerAmount = ownerAmount;
        testBooking.pricing.currency = 'INR';
        
        // Update payment amount due
        testBooking.payment = testBooking.payment || {};
        testBooking.payment.amountDue = totalAmount;
        
        await testBooking.save();
        console.log(`   ✅ Updated booking pricing to ₹${totalAmount}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testReconcileEndpoint();
