// Test script to create a mock booking with zero pricing for testing
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking.js');
const Warehouse = require('./src/models/Warehouse.js');
const User = require('./src/models/User.js');

async function createTestBookingWithZeroPricing() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmerai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create a test user if it doesn't exist
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'farmer'
      });
      await testUser.save();
      console.log('✅ Created test user');
    }

    // Create a test warehouse if it doesn't exist
    let testWarehouse = await Warehouse.findOne({ name: 'GreenField Cold Storage' });
    if (!testWarehouse) {
      testWarehouse = new Warehouse({
        name: 'GreenField Cold Storage',
        description: 'Test warehouse for zero pricing testing',
        owner: testUser._id,
        location: {
          address: 'NH-66, Near Agricultural Market',
          city: 'Kottayam',
          state: 'Kerala',
          pincode: '686001',
          coordinates: { type: 'Point', coordinates: [76.5, 9.5] }
        },
        capacity: { total: 1000, available: 1000, unit: 'kg' },
        storageTypes: ['cold_storage'],
        pricing: {
          basePrice: 50, // Valid base price
          pricePerUnit: 'per_kg',
          currency: 'INR'
        },
        contact: {
          email: 'greenfield@example.com',
          phone: '+91-9876543210'
        },
        terms: { minimumBookingDuration: 1 },
        status: 'active',
        isAvailable: true
      });
      await testWarehouse.save();
      console.log('✅ Created test warehouse');
    }

    // Create a test booking with zero pricing
    const testBooking = new Booking({
      bookingId: 'TEST-' + Date.now(),
      farmer: testUser._id,
      warehouse: testWarehouse._id,
      warehouseOwner: testWarehouse.owner,
      produce: {
        type: 'Rice',
        quantity: 100,
        unit: 'kg',
        quality: 'good'
      },
      storageRequirements: {
        temperature: { min: 0, max: 5 },
        humidity: { min: 60, max: 70 },
        storageType: 'cold_storage'
      },
      bookingDates: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-08'),
        duration: 7
      },
      pricing: {
        basePrice: 50,
        totalAmount: 0, // ZERO PRICING - This is the issue!
        platformFee: 0,
        ownerAmount: 0,
        currency: 'INR'
      },
      payment: {
        status: 'pending',
        amountDue: 0
      },
      status: 'pending'
    });

    await testBooking.save();
    console.log('✅ Created test booking with zero pricing:', testBooking._id);
    console.log('   Warehouse:', testWarehouse.name);
    console.log('   Total Amount: ₹', testBooking.pricing.totalAmount);
    console.log('   Duration:', testBooking.bookingDates.duration, 'days');
    console.log('   Quantity:', testBooking.produce.quantity, testBooking.produce.unit);

    // Calculate what the correct pricing should be
    const correctTotal = testWarehouse.pricing.basePrice * testBooking.bookingDates.duration * testBooking.produce.quantity;
    console.log('\n📊 Correct pricing should be:');
    console.log(`   Base Price: ₹${testWarehouse.pricing.basePrice}`);
    console.log(`   Duration: ${testBooking.bookingDates.duration} days`);
    console.log(`   Quantity: ${testBooking.produce.quantity} kg`);
    console.log(`   Total: ₹${correctTotal}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTestBookingWithZeroPricing();
