const mongoose = require('mongoose');
const User = require('./src/models/User');
const Warehouse = require('./src/models/Warehouse');
const Booking = require('./src/models/Booking');
const Payment = require('./src/models/Payment');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmerai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test database queries
async function testDatabaseQueries() {
  try {
    await connectDB();
    
    console.log('🔍 Testing database queries for admin dashboard...\n');
    
    // Test User count
    const totalUsers = await User.countDocuments();
    console.log('👥 Total Users:', totalUsers);
    
    // Test Warehouse count and pending approvals
    const totalWarehouses = await Warehouse.countDocuments();
    const pendingApprovals = await Warehouse.countDocuments({ 
      'verification.status': 'pending' 
    });
    console.log('🏪 Total Warehouses:', totalWarehouses);
    console.log('⏳ Pending Approvals:', pendingApprovals);
    
    // Test Booking counts
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const activeBookings = await Booking.countDocuments({ 
      status: { $in: ['approved', 'awaiting-approval', 'pending'] } 
    });
    console.log('📦 Total Bookings:', totalBookings);
    console.log('✅ Completed Bookings:', completedBookings);
    console.log('🔄 Active Bookings:', activeBookings);
    
    // Test Revenue calculation
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount.total' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    console.log('💰 Total Revenue:', totalRevenue);
    
    // Test Payment stats using the model method
    console.log('\n📊 Testing Payment.getStats()...');
    const paymentStats = await Payment.getStats();
    console.log('Payment Stats:', paymentStats);
    
    // Test Booking stats using the model method
    console.log('\n📊 Testing Booking.getStats()...');
    const bookingStats = await Booking.getStats();
    console.log('Booking Stats:', bookingStats);
    
    // Test sample data
    console.log('\n📋 Sample Data:');
    
    // Sample users
    const sampleUsers = await User.find().limit(3).select('name email role roles');
    console.log('Sample Users:', sampleUsers);
    
    // Sample warehouses
    const sampleWarehouses = await Warehouse.find().limit(3).select('name verification.status');
    console.log('Sample Warehouses:', sampleWarehouses);
    
    // Sample bookings
    const sampleBookings = await Booking.find().limit(3).select('status pricing.totalAmount');
    console.log('Sample Bookings:', sampleBookings);
    
    // Sample payments
    const samplePayments = await Payment.find().limit(3).select('status amount.total');
    console.log('Sample Payments:', samplePayments);
    
    console.log('\n✅ Database queries completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing database queries:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testDatabaseQueries();
