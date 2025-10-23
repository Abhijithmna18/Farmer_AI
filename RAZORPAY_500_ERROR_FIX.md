# Razorpay 500 Error Fix

## Problem
The Razorpay order creation endpoint returns a 500 Internal Server Error when trying to create a payment order.

## Error Details
```
POST http://localhost:5000/api/razorpay/create-order
Status: 500 Internal Server Error
```

## Root Causes & Solutions

### 1. **Missing or Invalid Razorpay Credentials**

#### Check Your .env Files

**Backend `.env`** (FarmerAI-backend/.env):
```env
RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
RAZORPAY_KEY_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
```

**Frontend `.env`** (farmerai-frontend/.env):
```env
VITE_RAZORPAY_KEY_ID=rzp_test_RP6aD2gNdAuoRE
```

⚠️ **IMPORTANT**: 
- Use the SAME `KEY_ID` in both files
- Do NOT add `VITE_RAZORPAY_KEY_SECRET` to frontend (security risk!)
- The secret key should ONLY be in the backend

### 2. **Test Your Credentials**

Run this test script to verify your Razorpay credentials work:

```bash
cd FarmerAI-backend
node test-razorpay-credentials.js
```

**Expected Output:**
```
Testing Razorpay Credentials...
RAZORPAY_KEY_ID: rzp_test_RP6aD2...
RAZORPAY_KEY_SECRET: SET (hidden)

Creating test order...
SUCCESS! Order created:
Order ID: order_xxxxxxxxxxxxx
Amount: 10000 paise (Rs 100)
Currency: INR

Razorpay credentials are working correctly!
```

**If you see an error:**
- `BAD_REQUEST_ERROR`: Invalid credentials - check your KEY_ID and KEY_SECRET
- `AUTHENTICATION_ERROR`: Wrong credentials - get new ones from Razorpay dashboard
- `Network error`: Check internet connection

### 3. **Get Razorpay Test Credentials**

If you don't have credentials or they're invalid:

1. **Sign up/Login** to Razorpay: https://dashboard.razorpay.com/
2. **Switch to Test Mode** (toggle in top-left corner)
3. **Go to Settings** → **API Keys**
4. **Generate Test Keys** (if not already generated)
5. **Copy** both Key ID and Key Secret
6. **Add** them to your `.env` files

### 4. **Double Conversion Issue (Fixed)**

The backend controller was updated to handle the amount conversion correctly:

**How it works:**
- Frontend sends: `amount * 100` (rupees → paise)
- Backend receives: amount in paise
- Backend divides by 100: `amount / 100` (paise → rupees)
- Backend's `createOrder` multiplies by 100 again: `amount * 100` (rupees → paise)
- Razorpay receives: correct amount in paise

**Example:**
- User pays: ₹100
- Frontend sends: 10,000 paise
- Backend converts: 10,000 / 100 = ₹100
- createOrder converts: 100 * 100 = 10,000 paise ✅
- Razorpay receives: 10,000 paise (₹100) ✅

### 5. **Improved Error Logging**

The backend now logs detailed error information:
- Error message
- Error description
- Error code
- Status code
- Stack trace

This helps identify the exact issue when orders fail.

## Files Modified

### 1. **razorpay.controller.js**
- Added amount conversion logic (line 20)
- Added detailed logging (line 22)
- Improved error response (lines 36-50)

### 2. **.env.sample files**
- Added Razorpay credentials to backend .env.sample
- Created frontend .env.sample with all required variables

### 3. **test-razorpay-credentials.js** (New)
- Test script to verify Razorpay credentials
- Creates a test order to confirm API access

## Testing Steps

### Step 1: Verify Credentials
```bash
cd FarmerAI-backend
node test-razorpay-credentials.js
```

### Step 2: Restart Backend
```bash
# Stop the current server (Ctrl+C)
node server.js
```

### Step 3: Restart Frontend
```bash
cd farmerai-frontend
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test Payment Flow
1. Go to My Bookings page
2. Click "Pay Now" on an approved booking
3. Payment page should load
4. Click "Pay ₹X" button
5. Razorpay checkout should open (not 500 error)

## Common Errors & Solutions

### Error: "key_id or oauthToken is mandatory"
**Cause**: Razorpay credentials not set or not loaded
**Solution**: 
- Check `.env` file has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Restart backend server
- Verify with test script

### Error: "The api key provided is invalid"
**Cause**: Wrong or expired credentials
**Solution**:
- Get new credentials from Razorpay dashboard
- Make sure you're using TEST mode keys (start with `rzp_test_`)
- Update `.env` files and restart servers

### Error: "amount must be at least INR 1.00"
**Cause**: Amount is 0 or negative
**Solution**:
- Check booking has valid pricing (not ₹0.00)
- Run the pricing fix script if needed
- Use the "Fix Pricing" button on bookings

### Error: "Failed to create Razorpay order: Network Error"
**Cause**: No internet connection or Razorpay API is down
**Solution**:
- Check internet connection
- Check Razorpay status: https://status.razorpay.com/
- Try again after a few minutes

## Environment Variables Reference

### Backend (.env)
```env
# Required for payment features
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret (optional)

# Other required variables
MONGODB_URI=mongodb://localhost:27017/farmerai
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Frontend (.env)
```env
# Required for payment features
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id

# Other required variables
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_key
# ... other Firebase config
```

## Security Best Practices

✅ **DO:**
- Keep `RAZORPAY_KEY_SECRET` only in backend
- Use environment variables, never hardcode
- Use test keys for development
- Add `.env` to `.gitignore`

❌ **DON'T:**
- Share your secret key publicly
- Commit `.env` files to git
- Use production keys in development
- Add secret key to frontend

## Production Deployment

When deploying to production:

1. **Get Production Keys** from Razorpay dashboard
2. **Switch to Live Mode** in Razorpay
3. **Update environment variables** on your hosting platform
4. **Test thoroughly** with small amounts first
5. **Enable webhooks** for payment notifications

## Additional Resources

- **Razorpay Dashboard**: https://dashboard.razorpay.com/
- **Razorpay API Docs**: https://razorpay.com/docs/api/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/
- **Razorpay Status**: https://status.razorpay.com/

## Summary

✅ **Fixed**: Double conversion issue in backend
✅ **Added**: Detailed error logging
✅ **Created**: Credential test script
✅ **Updated**: .env.sample files
✅ **Documented**: Complete setup and troubleshooting guide

The Razorpay integration should now work correctly once you:
1. Add valid credentials to `.env` files
2. Restart both servers
3. Test with the provided script
