# Razorpay Payment Verification Troubleshooting Guide

## 🔴 Common Errors

### Error 1: Razorpay API 500 Error
```
POST https://api.razorpay.com/v1/standard_checkout/payments/validate/account 500 (Internal Server Error)
```

**Causes:**
1. **Invalid Razorpay Key ID** - The key in frontend doesn't match your account
2. **Test vs Live Mode Mismatch** - Using test key with live environment or vice versa
3. **Account Not Activated** - Razorpay account needs KYC/activation

**Solutions:**
- Verify `VITE_RAZORPAY_KEY_ID` in frontend `.env` matches your Razorpay dashboard
- Ensure you're using **test keys** (start with `rzp_test_`) during development
- Check Razorpay dashboard for account status

---

### Error 2: Backend 400 Bad Request
```
POST http://localhost:5000/api/warehouse-bookings/verify-payment 400 (Bad Request)
```

**Causes:**
1. **Missing Required Fields** - `bookingId`, `paymentId`, or `signature` not sent
2. **Invalid Signature** - Payment signature doesn't match expected value
3. **Missing Order ID** - Booking has no `razorpayOrderId` stored
4. **Razorpay Credentials Missing** - Backend env variables not configured

---

## 🔍 Step-by-Step Diagnosis

### Step 1: Check Environment Variables

#### Frontend (`.env`)
```bash
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
```

#### Backend (`.env`)
```bash
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
```

**Verification:**
```bash
# In backend directory
node -e "console.log('Key ID:', process.env.RAZORPAY_KEY_ID); console.log('Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing')"
```

---

### Step 2: Check Frontend Request Payload

Add this logging in your frontend before calling `verifyPayment`:

```javascript
// In Payment.jsx or wherever you handle Razorpay response
handler: async function (response) {
  console.log('🔵 Razorpay Response:', {
    payment_id: response.razorpay_payment_id,
    order_id: response.razorpay_order_id,
    signature: response.razorpay_signature,
    bookingId: booking._id
  });
  
  try {
    await verifyPayment(
      booking._id, 
      response.razorpay_payment_id, 
      response.razorpay_signature,
      response.razorpay_order_id
    );
  } catch (error) {
    console.error('❌ Verification Error:', error.response?.data || error.message);
  }
}
```

---

### Step 3: Check Backend Logs

The controller now logs detailed information:

```
✅ Expected logs on success:
INFO: Verifying payment for booking 507f1f77bcf86cd799439011
INFO: Payment details: { bookingId: '...', paymentId: 'present', signature: 'present', orderId: 'present' }
INFO: Booking found: { id: '...', status: 'pending', paymentStatus: 'unpaid' }
INFO: Verifying signature with orderId: order_abc123
INFO: Payment verification params: { orderId: 'order_abc123', paymentIdLength: 18, signatureLength: 64 }
INFO: Payment signature verified successfully

❌ Expected logs on failure:
ERROR: Missing required fields for payment verification
ERROR: Booking not found: ...
ERROR: User does not own booking
ERROR: No razorpayOrderId found for booking
ERROR: Error during payment verification: Razorpay credentials not configured
ERROR: Payment signature verification failed
```

---

### Step 4: Verify Signature Manually

Create a test script to verify the signature calculation:

```javascript
// test-signature.js
const crypto = require('crypto');

const orderId = 'order_abc123';  // From Razorpay
const paymentId = 'pay_xyz789';  // From Razorpay
const signature = 'your_received_signature';  // From Razorpay
const secret = 'YOUR_RAZORPAY_KEY_SECRET';  // From .env

const body = orderId + '|' + paymentId;
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

console.log('Order ID:', orderId);
console.log('Payment ID:', paymentId);
console.log('Body:', body);
console.log('Expected Signature:', expectedSignature);
console.log('Received Signature:', signature);
console.log('Match:', expectedSignature === signature);
```

Run: `node test-signature.js`

---

## 🛠️ Common Fixes

### Fix 1: Missing Razorpay Credentials

**Symptom:** Backend returns 500 with "Razorpay credentials not configured"

**Solution:**
1. Go to Razorpay Dashboard: https://dashboard.razorpay.com/
2. Navigate to **Settings** → **API Keys**
3. Copy **Key Id** and **Key Secret** (Test Mode)
4. Add to backend `.env`:
   ```bash
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
   ```
5. Add Key ID to frontend `.env`:
   ```bash
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   ```
6. Restart both servers

---

### Fix 2: Signature Mismatch

**Symptom:** Backend returns 400 with "Invalid payment signature"

**Possible Causes:**
- **Different keys** in frontend vs backend
- **Wrong secret** being used for signature verification
- **Corrupted data** during transmission

**Solution:**
```javascript
// Verify the exact data being sent:
console.log('Frontend sending:', {
  bookingId: booking._id,
  paymentId: response.razorpay_payment_id,
  signature: response.razorpay_signature,
  orderId: response.razorpay_order_id
});

// Backend should receive:
// All fields present and matching Razorpay's response format
```

---

### Fix 3: Order ID Missing

**Symptom:** Backend returns 400 with "No Razorpay order ID found"

**Solution:** Ensure your frontend passes the order ID:
```javascript
await verifyPayment(
  bookingId, 
  response.razorpay_payment_id, 
  response.razorpay_signature,
  response.razorpay_order_id  // ✅ Make sure this is passed
);
```

---

### Fix 4: CORS Issues

**Symptom:** Network errors, CORS errors in console

**Solution:** Check your backend CORS configuration:
```javascript
// In server.js or app.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

---

## 🧪 Testing Checklist

### Before Testing:
- [ ] Razorpay account is in **Test Mode**
- [ ] Test API keys are configured in both frontend and backend `.env`
- [ ] Both servers are running
- [ ] You're logged in as a farmer
- [ ] A warehouse exists and is available for booking

### Test Flow:
1. **Create Booking**
   - Go to warehouse detail page
   - Fill out booking form
   - Click "Proceed to Payment"
   - ✅ Booking should be created with status "pending"

2. **Make Payment**
   - Razorpay checkout modal should open
   - Use test card: `4111 1111 1111 1111`
   - Any future expiry date
   - Any CVV
   - Click "Pay"
   - ✅ Payment should succeed

3. **Verify Payment**
   - Backend should receive verification request
   - Check server logs for verification details
   - ✅ Booking status should change to "awaiting-approval"
   - ✅ Payment status should be "paid"

---

## 🔧 Debugging Tools

### 1. Enable Verbose Logging

Add to your backend:
```javascript
// Before verifyPayment endpoint
app.use('/api/warehouse-bookings/verify-payment', (req, res, next) => {
  console.log('📥 Verify Payment Request:');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('User:', req.user?.id);
  next();
});
```

### 2. Frontend Network Inspector

Open browser DevTools → Network tab:
- Filter by "verify-payment"
- Check Request Payload
- Check Response body
- Look for exact error message

### 3. Razorpay Dashboard Logs

Go to **Razorpay Dashboard** → **Transactions** → **Payments**
- Find your test payment
- Check payment status
- Verify order ID matches

---

## 📋 Required Data Flow

### Step 1: Create Order (Backend)
```javascript
POST /api/razorpay/create-order
Request: { bookingId, amount, currency }
Response: { orderId: "order_abc123", amount: 50000, currency: "INR" }
```

### Step 2: Open Razorpay Checkout (Frontend)
```javascript
const options = {
  key: 'rzp_test_xxxxx',
  amount: 50000,
  order_id: 'order_abc123',
  handler: function(response) {
    // Response contains:
    // - razorpay_payment_id
    // - razorpay_order_id  
    // - razorpay_signature
  }
};
```

### Step 3: Verify Payment (Backend)
```javascript
POST /api/warehouse-bookings/verify-payment
Request: {
  bookingId: "507f...",
  paymentId: "pay_abc123",      // OR razorpay_payment_id
  signature: "a1b2c3...",        // OR razorpay_signature
  orderId: "order_abc123"        // OR razorpay_order_id
}

Backend Verification:
1. Find booking by bookingId
2. Get orderId (from request or booking)
3. Calculate: expectedSig = HMAC-SHA256(orderId + '|' + paymentId, secret)
4. Compare: expectedSig === signature
5. If valid: Update booking status to "awaiting-approval"
```

---

## ✅ Success Indicators

When everything works correctly:

1. **Frontend Console:**
   ```
   ✅ Payment successful! Booking confirmed.
   ```

2. **Backend Logs:**
   ```
   INFO: Payment signature verified successfully
   ```

3. **Database:**
   - Booking status: `awaiting-approval`
   - Payment status: `paid`
   - razorpayPaymentId: Present
   - paidAt: Current timestamp

4. **Razorpay Dashboard:**
   - Payment marked as "Captured"
   - Amount matches booking total

---

## 🆘 Still Not Working?

If you've tried everything above and it's still failing:

1. **Check exact error message** in backend logs
2. **Verify Razorpay account** is activated for test mode
3. **Test with Razorpay's test data** to rule out account issues
4. **Check for middleware** that might be modifying the request
5. **Verify authentication** - user must be logged in
6. **Check booking ownership** - user must own the booking

### Get More Help:
- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com
- Check server logs with `DEBUG=* npm start`

---

## 📞 Quick Reference

### Test Card Details:
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
```

### Required Environment Variables:
```bash
# Backend .env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Frontend .env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Endpoint Format:
```
POST http://localhost:5000/api/warehouse-bookings/verify-payment
Content-Type: application/json
Authorization: Bearer {your_jwt_token}

{
  "bookingId": "507f1f77bcf86cd799439011",
  "paymentId": "pay_abc123def456",
  "signature": "a1b2c3d4e5f6...",
  "orderId": "order_xyz789"
}
```

---

Good luck! 🚀
