// Quick test to verify Razorpay credentials
require('dotenv').config();
const Razorpay = require('razorpay');

console.log('Testing Razorpay Credentials...');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('RAZORPAY_KEY_ID:', keyId ? `${keyId.substring(0, 15)}...` : 'NOT SET');
console.log('RAZORPAY_KEY_SECRET:', keySecret ? 'SET (hidden)' : 'NOT SET');

if (!keyId || !keySecret) {
  console.error('ERROR: Razorpay credentials not found in .env file');
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret
});

async function testOrder() {
  try {
    console.log('\nCreating test order...');
    const order = await razorpay.orders.create({
      amount: 10000, // 100 rupees in paise
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      payment_capture: 1
    });
    
    console.log('SUCCESS! Order created:');
    console.log('Order ID:', order.id);
    console.log('Amount:', order.amount, 'paise (Rs', order.amount / 100, ')');
    console.log('Currency:', order.currency);
    console.log('\nRazorpay credentials are working correctly!');
  } catch (error) {
    console.error('ERROR creating order:');
    console.error('Message:', error.error?.description || error.message);
    console.error('Code:', error.error?.code || error.statusCode);
    console.error('\nFull error:', error);
  }
}

testOrder();
