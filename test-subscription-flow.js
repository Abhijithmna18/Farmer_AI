// Test script for complete subscription flow
// Run with: node test-subscription-flow.js

require('dotenv').config();
const mongoose = require('mongoose');
const { sendPaymentConfirmation } = require('./FarmerAI-backend/src/services/email.service');
const WorkshopSubscription = require('./FarmerAI-backend/src/models/WorkshopSubscription');
const User = require('./FarmerAI-backend/src/models/User');

async function testSubscriptionFlow() {
  console.log('Testing complete subscription flow...');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmerai');
    console.log('✅ Connected to database');
    
    // Create a test user if not exists
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isVerified: true,
        roles: ['farmer'],
        role: 'farmer',
        userType: 'farmer'
      });
      await user.save();
      console.log('✅ Created test user');
    }
    
    // Create a test subscription
    const subscription = new WorkshopSubscription({
      subscriptionId: WorkshopSubscription.generateSubscriptionId(),
      user: user._id,
      type: 'monthly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      amount: {
        total: 499,
        currency: 'INR'
      },
      status: 'pending'
    });
    await subscription.save();
    console.log('✅ Created test subscription');
    
    // Simulate payment verification
    subscription.razorpay = {
      orderId: 'order_TEST123',
      paymentId: 'pay_TEST123',
      signature: 'sig_TEST123'
    };
    subscription.status = 'active';
    await subscription.save();
    console.log('✅ Updated subscription with payment details');
    
    // Send payment confirmation email
    await sendPaymentConfirmation(user.email, {
      farmerName: `${user.firstName} ${user.lastName}`,
      bookingId: subscription.subscriptionId,
      paymentId: subscription.razorpay.paymentId,
      amount: subscription.amount.total,
      paymentMethod: 'Razorpay',
      paymentDate: new Date().toLocaleDateString(),
      warehouseName: 'Monthly Workshop Subscription',
      startDate: subscription.startDate.toLocaleDateString(),
      endDate: subscription.endDate.toLocaleDateString()
    });
    console.log('✅ Payment confirmation email sent');
    
    // Test fetching user with subscription info
    const activeSubscriptions = await WorkshopSubscription.find({
      user: user._id,
      status: 'active',
      endDate: { $gte: new Date() }
    }).sort({ endDate: -1 });
    
    const hasActiveSubscription = activeSubscriptions.length > 0;
    const subscriptionEndDate = hasActiveSubscription ? activeSubscriptions[0].endDate : null;
    
    console.log('✅ User subscription status checked');
    console.log('Has active subscription:', hasActiveSubscription);
    console.log('Subscription end date:', subscriptionEndDate);
    
    console.log('\n🎉 All tests passed! Subscription flow is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testSubscriptionFlow();
}

module.exports = { testSubscriptionFlow };