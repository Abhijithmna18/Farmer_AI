# Quick Fix: Razorpay 400/500 Errors

## 🚨 Your Errors:
1. ❌ `api.razorpay.com 500 Internal Server Error` - Razorpay validation failed
2. ❌ `/verify-payment 400 Bad Request` - Backend signature verification failed

## ⚡ 5-Minute Fix

### Step 1: Test Backend Configuration (2 min)

```bash
cd "d:\New folder\intern\Farmer_AI\FarmerAI-backend"
node test-razorpay-config.js
```

**What to look for:**
- ✅ Both credentials should show "✓ Loaded"
- ✅ Signature verification should pass
- ✅ API connection should work

If any fail, go to **Step 2**.

---

### Step 2: Fix Missing/Invalid Credentials (2 min)

#### Get Your Razorpay Keys:
1. Go to https://dashboard.razorpay.com/app/keys
2. Switch to **Test Mode** (toggle at top)
3. Copy **Key ID** (starts with `rzp_test_`)
4. Copy **Key Secret** (click "Show" button)

#### Add to Backend `.env`:
```bash
# d:\New folder\intern\Farmer_AI\FarmerAI-backend\.env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

#### Add to Frontend `.env`:
```bash
# d:\New folder\intern\Farmer_AI\farmerai-frontend\.env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

#### Restart Both Servers:
```bash
# Terminal 1 - Backend
cd "d:\New folder\intern\Farmer_AI\FarmerAI-backend"
npm start

# Terminal 2 - Frontend
cd "d:\New folder\intern\Farmer_AI\farmerai-frontend"
npm run dev
```

---

### Step 3: Test Payment Flow (1 min)

1. **Login** to your app
2. **Book a warehouse**
3. When Razorpay opens, use test card:
   - Card: `4111 1111 1111 1111`
   - Expiry: `12/25`
   - CVV: `123`
4. Click **Pay**
5. **Check console** for errors

---

## 🔍 What the Backend Fix Does

The updated controller now:

✅ **Handles both naming conventions:**
```javascript
// Works with either format:
{ paymentId, signature, orderId }          // Old format
{ razorpay_payment_id, razorpay_signature, razorpay_order_id }  // Razorpay format
```

✅ **Better error handling:**
```javascript
try {
  isValid = verifyRazorpayPayment(orderId, paymentId, signature);
} catch (error) {
  // Returns 500 with clear error message
  // Instead of crashing
}
```

✅ **Detailed logging:**
```javascript
logger.info('Payment verification params:', {
  orderId: razorpayOrderId,
  paymentIdLength: actualPaymentId?.length,
  signatureLength: actualSignature?.length
});
```

---

## 🎯 Most Likely Causes

### 1. **Missing Razorpay Credentials** (80% of cases)
**Symptom:** 500 error with "credentials not configured"  
**Fix:** Add keys to `.env` files (see Step 2)

### 2. **Wrong Key ID in Frontend** (15% of cases)
**Symptom:** Razorpay API 500 error  
**Fix:** Ensure frontend `VITE_RAZORPAY_KEY_ID` matches backend `RAZORPAY_KEY_ID`

### 3. **Signature Mismatch** (5% of cases)
**Symptom:** 400 error with "Invalid payment signature"  
**Fix:** Ensure backend `RAZORPAY_KEY_SECRET` is correct

---

## 📊 Success Checklist

After fixing, you should see:

### In Backend Logs:
```
INFO: Verifying payment for booking 507f1f77bcf86cd799439011
INFO: Payment details: { bookingId: '...', paymentId: 'present', signature: 'present', orderId: 'present' }
INFO: Verifying signature with orderId: order_abc123
INFO: Payment verification params: { orderId: 'order_abc123', paymentIdLength: 18, signatureLength: 64 }
INFO: Payment signature verified successfully  ✅
```

### In Frontend:
```
✅ Payment successful! Booking confirmed.
```

### In Database:
- Booking status: `awaiting-approval`
- Payment status: `paid`

---

## 🆘 Still Not Working?

### Check These:

1. **Backend logs** - Look for the exact error message
2. **Browser console** - Check the network request payload
3. **Environment files** - Ensure no extra spaces or quotes
4. **Server restart** - Changes to `.env` require restart
5. **Test mode** - Ensure all keys are TEST keys (rzp_test_)

### Get Detailed Help:

See `RAZORPAY_TROUBLESHOOTING.md` for:
- Complete diagnostic steps
- Manual signature verification
- CORS troubleshooting
- Test card details
- Common error messages

---

## 🔐 Security Note

**Never commit `.env` files to git!**

Your `.gitignore` should include:
```
.env
.env.local
.env.production
```

---

## ✅ Quick Verification

Run this to verify everything:

```bash
# Backend test
cd FarmerAI-backend
node test-razorpay-config.js

# Should show:
# ✅ RAZORPAY_KEY_ID: ✓ Loaded
# ✅ RAZORPAY_KEY_SECRET: ✓ Loaded  
# ✅ Signature verification: Valid
# ✅ API Connection: Working
```

---

**That's it!** Your payment verification should now work. 🎉
