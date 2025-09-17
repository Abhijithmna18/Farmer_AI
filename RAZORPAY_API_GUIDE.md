# Razorpay API Integration Guide

## 🚀 Complete Razorpay Integration for FarmerAI

This guide shows you exactly how to integrate Razorpay into your API and frontend.

## 📋 Prerequisites

1. **Razorpay Account**: Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. **Test Credentials**: Get your test API keys
3. **Environment Variables**: Set up your `.env` file

## ⚙️ Environment Setup

Add these to your `FarmerAI-backend/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

Add this to your `farmerai-frontend/.env` file:

```env
# Razorpay Frontend Key
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
```

## 🔧 Backend API Endpoints

### 1. Create Order
```http
POST /api/razorpay/create-order
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "bookingId": "BK123456789",
  "amount": 1000,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_123456789",
    "amount": 100000,
    "currency": "INR",
    "key": "rzp_test_your_key_id",
    "bookingId": "BK123456789"
  }
}
```

### 2. Verify Payment
```http
POST /api/razorpay/verify-payment
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "bookingId": "BK123456789",
  "paymentId": "pay_123456789",
  "signature": "razorpay_signature",
  "orderId": "order_123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "bookingId": "BK123456789",
    "paymentId": "pay_123456789",
    "status": "paid"
  }
}
```

### 3. Process Refund
```http
POST /api/razorpay/refund
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "paymentId": "pay_123456789",
  "amount": 500,
  "reason": "Booking cancelled"
}
```

### 4. Get Payment Status
```http
GET /api/razorpay/payment-status/pay_123456789
Authorization: Bearer <your_jwt_token>
```

### 5. Webhook Endpoint
```http
POST /api/razorpay/webhook
X-Razorpay-Signature: webhook_signature
Content-Type: application/json

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_123456789",
        "amount": 100000,
        "status": "captured"
      }
    }
  }
}
```

## 🎨 Frontend Integration

### 1. Using the Razorpay Service

```javascript
import razorpayService from '../services/razorpay.service';

// Process payment
const handlePayment = async () => {
  try {
    await razorpayService.processPayment(
      'BK123456789', // booking ID
      1000, // amount in rupees
      // Success callback
      (response) => {
        console.log('Payment successful:', response);
        // Handle success
      },
      // Error callback
      (error) => {
        console.error('Payment failed:', error);
        // Handle error
      }
    );
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 2. Using the RazorpayPayment Component

```jsx
import RazorpayPayment from '../components/RazorpayPayment';

const BookingPage = () => {
  const handlePaymentSuccess = (response) => {
    console.log('Payment successful:', response);
    // Redirect or show success message
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    // Show error message
  };

  return (
    <RazorpayPayment
      bookingId="BK123456789"
      amount={1000}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
      onClose={() => console.log('Payment cancelled')}
    />
  );
};
```

## 🧪 Testing the Integration

### 1. Test Order Creation
```bash
curl -X POST http://localhost:5000/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookingId": "BK123456789",
    "amount": 1000,
    "currency": "INR"
  }'
```

### 2. Test Payment Verification
```bash
curl -X POST http://localhost:5000/api/razorpay/verify-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookingId": "BK123456789",
    "paymentId": "pay_test123",
    "signature": "test_signature",
    "orderId": "order_test123"
  }'
```

## 🔐 Security Best Practices

### 1. Always Verify Signatures
```javascript
// Backend verification
const isValidPayment = verifyPayment(orderId, paymentId, signature);
if (!isValidPayment) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

### 2. Use Environment Variables
```javascript
// Never hardcode credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

### 3. Validate Webhook Signatures
```javascript
// Always verify webhook signatures
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');
```

## 📊 Database Schema

### Payment Collection
```javascript
{
  _id: ObjectId,
  paymentId: String, // Your internal payment ID
  booking: ObjectId, // Reference to booking
  farmer: ObjectId, // Reference to farmer
  warehouseOwner: ObjectId, // Reference to warehouse owner
  amount: {
    total: Number,
    baseAmount: Number,
    platformFee: Number,
    ownerAmount: Number,
    currency: String
  },
  razorpay: {
    orderId: String,
    paymentId: String,
    signature: String,
    status: String,
    captured: Boolean
  },
  status: String, // 'pending', 'completed', 'refunded'
  refund: {
    razorpayRefundId: String,
    amount: Number,
    status: String,
    reason: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🚨 Error Handling

### Common Errors and Solutions

1. **"key_id or oauthToken is mandatory"**
   - Solution: Set `RAZORPAY_KEY_ID` in your `.env` file

2. **"Invalid signature"**
   - Solution: Check your `RAZORPAY_KEY_SECRET` and signature verification

3. **"Order not found"**
   - Solution: Ensure order ID exists and is correct

4. **"Payment already captured"**
   - Solution: Check if payment is already processed

## 🔄 Complete Payment Flow

1. **User clicks "Pay Now"**
2. **Frontend calls `/api/razorpay/create-order`**
3. **Backend creates Razorpay order**
4. **Frontend opens Razorpay checkout**
5. **User completes payment**
6. **Frontend calls `/api/razorpay/verify-payment`**
7. **Backend verifies payment signature**
8. **Backend updates booking status**
9. **Success/Error callback executed**

## 📱 Mobile Integration

For mobile apps, use the same API endpoints with:
- React Native Razorpay SDK
- Flutter Razorpay plugin
- Native mobile SDKs

## 🎯 Production Checklist

- [ ] Set production Razorpay credentials
- [ ] Configure webhook URL
- [ ] Test all payment flows
- [ ] Set up error monitoring
- [ ] Configure refund policies
- [ ] Test webhook handling
- [ ] Set up payment analytics

## 📞 Support

- **Razorpay Documentation**: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- **API Reference**: [https://razorpay.com/docs/api/](https://razorpay.com/docs/api/)
- **Test Cards**: [https://razorpay.com/docs/payment-gateway/test-cards/](https://razorpay.com/docs/payment-gateway/test-cards/)

---

**Your Razorpay integration is now ready! 🎉**










