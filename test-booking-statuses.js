const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');

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

// Test booking statuses and counts
async function testBookingStatuses() {
  try {
    await connectDB();
    
    console.log('🔍 Testing booking statuses and counts...\n');
    
    // Get all booking statuses
    const allBookings = await Booking.find({}).select('status bookingId createdAt');
    console.log('📊 Total bookings in database:', allBookings.length);
    
    // Group by status
    const statusCounts = {};
    allBookings.forEach(booking => {
      statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
    });
    
    console.log('\n📋 Booking status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Test individual status counts using countDocuments
    console.log('\n🔢 Individual status counts:');
    const pendingCount = await Booking.countDocuments({ status: 'pending' });
    const completedCount = await Booking.countDocuments({ status: 'completed' });
    const approvedCount = await Booking.countDocuments({ status: 'approved' });
    const awaitingApprovalCount = await Booking.countDocuments({ status: 'awaiting-approval' });
    const paidCount = await Booking.countDocuments({ status: 'paid' });
    const cancelledCount = await Booking.countDocuments({ status: 'cancelled' });
    const rejectedCount = await Booking.countDocuments({ status: 'rejected' });
    
    console.log(`  pending: ${pendingCount}`);
    console.log(`  completed: ${completedCount}`);
    console.log(`  approved: ${approvedCount}`);
    console.log(`  awaiting-approval: ${awaitingApprovalCount}`);
    console.log(`  paid: ${paidCount}`);
    console.log(`  cancelled: ${cancelledCount}`);
    console.log(`  rejected: ${rejectedCount}`);
    
    // Test the Booking.getStats() method
    console.log('\n📊 Testing Booking.getStats() method:');
    const bookingStats = await Booking.getStats();
    console.log('Booking Stats:', bookingStats);
    
    // Test what the admin dashboard is currently calculating
    console.log('\n🎯 Admin Dashboard Current Logic:');
    const activeBookings = await Booking.countDocuments({ 
      status: { $in: ['approved', 'awaiting-approval', 'pending'] } 
    });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    
    console.log(`  Active Bookings (approved + awaiting-approval + pending): ${activeBookings}`);
    console.log(`  Completed Bookings: ${completedBookings}`);
    
    // Show sample bookings with their statuses
    console.log('\n📝 Sample bookings with statuses:');
    const sampleBookings = await Booking.find({}).select('status bookingId createdAt').limit(10);
    sampleBookings.forEach(booking => {
      console.log(`  ${booking.bookingId}: ${booking.status} (${booking.createdAt.toISOString().split('T')[0]})`);
    });
    
    console.log('\n✅ Booking status analysis completed!');
    
  } catch (error) {
    console.error('❌ Error testing booking statuses:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testBookingStatuses();
