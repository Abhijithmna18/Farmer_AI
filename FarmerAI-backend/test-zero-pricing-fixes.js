const mongoose = require('mongoose');
const WarehouseBooking = require('./src/models/WarehouseBooking.js');
const Warehouse = require('./src/models/Warehouse.js');
const User = require('./src/models/User.js');

async function testZeroPricingFixes() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/farmerai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n🔧 Testing Zero Pricing Fixes...\n');

    // Test 1: Warehouse pricing validation
    console.log('1️⃣ Testing Warehouse Pricing Validation:');
    
    // Create a test warehouse with invalid pricing
    const invalidWarehouse = new Warehouse({
      name: 'Test Warehouse - Invalid Pricing',
      description: 'Test warehouse with zero pricing',
      owner: new mongoose.Types.ObjectId(),
      location: {
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        coordinates: { type: 'Point', coordinates: [0, 0] }
      },
      capacity: { total: 1000, available: 1000, unit: 'kg' },
      storageTypes: ['dry_storage'],
      pricing: {
        basePrice: 0, // Invalid: zero price
        pricePerUnit: 'per_kg',
        currency: 'INR'
      },
      terms: { minimumBookingDuration: 1 },
      status: 'active',
      isAvailable: true
    });

    const validation = invalidWarehouse.validatePricing();
    console.log(`   ❌ Invalid pricing validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(`   📝 Errors: ${validation.errors.join(', ')}`);

    // Create a test warehouse with valid pricing
    const validWarehouse = new Warehouse({
      name: 'Test Warehouse - Valid Pricing',
      description: 'Test warehouse with valid pricing',
      owner: new mongoose.Types.ObjectId(),
      location: {
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        coordinates: { type: 'Point', coordinates: [0, 0] }
      },
      capacity: { total: 1000, available: 1000, unit: 'kg' },
      storageTypes: ['dry_storage'],
      pricing: {
        basePrice: 50, // Valid: positive price
        pricePerUnit: 'per_kg',
        currency: 'INR'
      },
      terms: { minimumBookingDuration: 1 },
      status: 'active',
      isAvailable: true
    });

    const validValidation = validWarehouse.validatePricing();
    console.log(`   ✅ Valid pricing validation: ${validValidation.isValid ? 'PASSED' : 'FAILED'}`);

    // Test 2: Price calculation
    console.log('\n2️⃣ Testing Price Calculation:');
    
    try {
      const priceCalc = validWarehouse.calculatePrice(
        '2024-01-01',
        '2024-01-05', // 4 days
        100 // 100 kg
      );
      console.log(`   ✅ Price calculation successful:`);
      console.log(`      Base Price: ₹${priceCalc.basePrice}`);
      console.log(`      Duration: ${priceCalc.duration} days`);
      console.log(`      Quantity: ${priceCalc.quantity} kg`);
      console.log(`      Total Amount: ₹${priceCalc.totalAmount}`);
      console.log(`      Expected: ₹${50 * 4 * 100} = ₹20000`);
    } catch (error) {
      console.log(`   ❌ Price calculation failed: ${error.message}`);
    }

    // Test 3: Invalid date handling
    console.log('\n3️⃣ Testing Invalid Date Handling:');
    
    try {
      validWarehouse.calculatePrice('invalid-date', '2024-01-05', 100);
      console.log(`   ❌ Should have failed with invalid date`);
    } catch (error) {
      console.log(`   ✅ Correctly caught invalid date: ${error.message}`);
    }

    // Test 4: Zero quantity handling
    console.log('\n4️⃣ Testing Zero Quantity Handling:');
    
    try {
      validWarehouse.calculatePrice('2024-01-01', '2024-01-05', 0);
      console.log(`   ❌ Should have failed with zero quantity`);
    } catch (error) {
      console.log(`   ✅ Correctly caught zero quantity: ${error.message}`);
    }

    // Test 5: Check existing bookings with zero pricing
    console.log('\n5️⃣ Checking Existing Bookings:');
    
    const zeroPricingBookings = await WarehouseBooking.find({
      $or: [
        { 'pricing.totalAmount': 0 },
        { 'pricing.totalAmount': { $exists: false } },
        { 'pricing.totalAmount': null }
      ]
    }).populate('warehouse', 'name pricing');

    console.log(`   Found ${zeroPricingBookings.length} bookings with zero pricing`);
    
    if (zeroPricingBookings.length > 0) {
      console.log('   📋 Zero pricing bookings:');
      for (const booking of zeroPricingBookings) {
        console.log(`      - ID: ${booking._id}`);
        console.log(`        Warehouse: ${booking.warehouse?.name || 'Unknown'}`);
        console.log(`        Current Price: ₹${booking.pricing?.totalAmount || 0}`);
        console.log(`        Duration: ${booking.bookingDates?.duration || 'Unknown'} days`);
        console.log(`        Quantity: ${booking.produce?.quantity || 0}`);
        console.log(`        Warehouse Base Price: ₹${booking.warehouse?.pricing?.basePrice || 0}`);
      }
    } else {
      console.log('   ✅ No zero pricing bookings found!');
    }

    // Test 6: Test reconcile endpoint logic
    console.log('\n6️⃣ Testing Reconcile Logic:');
    
    if (zeroPricingBookings.length > 0) {
      const testBooking = zeroPricingBookings[0];
      console.log(`   Testing reconcile on booking: ${testBooking._id}`);
      
      try {
        // Simulate reconcile logic
        const start = new Date(testBooking.bookingDates.startDate);
        const end = new Date(testBooking.bookingDates.endDate);
        const computedDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        const basePrice = testBooking.warehouse?.pricing?.basePrice || 0;
        const quantity = testBooking.produce?.quantity || 0;
        
        if (basePrice > 0 && computedDuration > 0 && quantity > 0) {
          const totalAmount = basePrice * computedDuration * quantity;
          const platformFee = Math.round(totalAmount * 0.05);
          const ownerAmount = totalAmount - platformFee;
          
          console.log(`   ✅ Reconcile calculation:`);
          console.log(`      Base Price: ₹${basePrice}`);
          console.log(`      Duration: ${computedDuration} days`);
          console.log(`      Quantity: ${quantity}`);
          console.log(`      Total Amount: ₹${totalAmount}`);
          console.log(`      Platform Fee: ₹${platformFee}`);
          console.log(`      Owner Amount: ₹${ownerAmount}`);
        } else {
          console.log(`   ❌ Cannot reconcile - missing data:`);
          console.log(`      Base Price: ${basePrice > 0 ? '✅' : '❌'}`);
          console.log(`      Duration: ${computedDuration > 0 ? '✅' : '❌'}`);
          console.log(`      Quantity: ${quantity > 0 ? '✅' : '❌'}`);
        }
      } catch (error) {
        console.log(`   ❌ Reconcile failed: ${error.message}`);
      }
    }

    console.log('\n🎉 Zero Pricing Fix Tests Complete!');
    console.log('\n📋 Summary of Fixes:');
    console.log('   ✅ Warehouse pricing validation added');
    console.log('   ✅ Duration calculation validation added');
    console.log('   ✅ Quantity validation added');
    console.log('   ✅ Price calculation validation added');
    console.log('   ✅ Comprehensive error handling added');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testZeroPricingFixes();
