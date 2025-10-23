# Payment Flow Fix - Warehouse Details to Razorpay

## Problem
When users clicked "Proceed to Payment" from the warehouse details page after booking, they were redirected to the home page instead of opening the Razorpay payment gateway.

## Root Cause
1. **Incorrect API endpoint**: The code was calling `/api/v2/warehouses/${id}/bookings` which doesn't exist
2. **Wrong response structure**: Expected `{ booking, payment }` but actual response is `{ booking, razorpayOrder }`
3. **Missing error handling**: Errors caused silent failures and unexpected redirects
4. **Incorrect payment verification endpoint**: Used `/api/v2/bookings/${id}/verify-payment` instead of `/api/warehouse-bookings/verify-payment`

## Solution Applied

### File: `farmerai-frontend/src/pages/warehouses/WarehouseDetail.jsx`

#### Changes Made:

1. **Fixed API Endpoint** (Line 206)
   - Changed from: `/api/v2/warehouses/${id}/bookings`
   - Changed to: `/api/warehouse-bookings/book`
   - This matches the actual backend route

2. **Corrected Request Payload** (Lines 187-204)
   ```javascript
   const bookingPayload = {
     warehouseId: id,
     produce: {
       type: 'general',
       quantity: quantity,
       unit: 'sqft'
     },
     storageRequirements: {
       storageType: 'general',
       temperature: {},
       humidity: {}
     },
     bookingDates: {
       startDate: selectedStartDate.toISOString(),
       endDate: selectedEndDate.toISOString()
     },
     notes: ''
   };
   ```

3. **Fixed Response Destructuring** (Line 212)
   - Changed from: `const { booking, payment } = response.data.data;`
   - Changed to: `const { booking, razorpayOrder } = response.data.data;`

4. **Corrected Razorpay Configuration** (Lines 221-227)
   - Use `import.meta.env.VITE_RAZORPAY_KEY_ID` directly
   - Use `razorpayOrder.id` for order_id
   - Convert amount to paise: `booking.pricing.totalAmount * 100`

5. **Fixed Payment Verification Endpoint** (Line 231)
   - Changed from: `/api/v2/bookings/${booking._id}/verify-payment`
   - Changed to: `/api/warehouse-bookings/verify-payment`
   - Correct payload: `{ bookingId, paymentId, signature }`

6. **Enhanced Error Handling** (Lines 285-292)
   - Proper error messages displayed via toast
   - Prevents unexpected redirects
   - Closes dialog on error

7. **Added Payment Event Handlers** (Lines 261-282)
   - `modal.ondismiss`: Handles user cancellation
   - `payment.failed`: Handles payment failures
   - All cases redirect to My Bookings with appropriate messages

8. **Added Missing Import** (Line 44)
   - Added `ToastContainer` to imports from 'react-toastify'

## Complete Payment Flow (Fixed)

### 1. User Journey
```
Warehouse Details Page
  ↓ (Click "Book Now")
Booking Dialog Opens
  ↓ (Click "Proceed to Payment")
API Call: POST /api/warehouse-bookings/book
  ↓ (Success)
Razorpay Modal Opens
  ↓ (User Completes Payment)
API Call: POST /api/warehouse-bookings/verify-payment
  ↓ (Success)
Redirect to My Bookings (with success message)
```

### 2. Error Handling
```
If booking creation fails:
  → Show error toast
  → Close dialog
  → Stay on warehouse details page

If Razorpay script fails to load:
  → Show error toast
  → Close dialog

If user cancels payment:
  → Show info toast
  → Redirect to My Bookings (booking saved as pending)

If payment fails:
  → Show error toast with reason
  → Redirect to My Bookings

If payment verification fails:
  → Show error toast
  → Redirect to My Bookings (booking exists, can retry payment)
```

## Backend Endpoints Used

### 1. Create Booking
- **Endpoint**: `POST /api/warehouse-bookings/book`
- **Auth**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "warehouseId": "string",
    "produce": {
      "type": "string",
      "quantity": number,
      "unit": "string"
    },
    "storageRequirements": {
      "storageType": "string",
      "temperature": {},
      "humidity": {}
    },
    "bookingDates": {
      "startDate": "ISO date string",
      "endDate": "ISO date string"
    },
    "notes": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "booking": { /* booking object */ },
      "razorpayOrder": {
        "id": "order_xxx",
        "amount": 100000,
        "currency": "INR"
      }
    }
  }
  ```

### 2. Verify Payment
- **Endpoint**: `POST /api/warehouse-bookings/verify-payment`
- **Auth**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "bookingId": "string",
    "paymentId": "string",
    "signature": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment verified successfully",
    "data": { /* updated booking */ }
  }
  ```

## Environment Variables Required

Ensure these are set in `farmerai-frontend/.env`:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
VITE_API_URL=http://localhost:5000/api
```

## Testing Checklist

- [ ] User can click "Book Now" on warehouse details page
- [ ] Booking dialog opens with correct summary
- [ ] "Proceed to Payment" button works
- [ ] Razorpay modal opens successfully
- [ ] Payment can be completed (test mode)
- [ ] Success: Redirects to My Bookings with success message
- [ ] Cancel: Shows info message and redirects to My Bookings
- [ ] Failure: Shows error message and redirects to My Bookings
- [ ] Booking appears in My Bookings with correct status
- [ ] "Pay Now" button appears for pending payments
- [ ] No unexpected redirects to home page

## Notes

1. **No .env changes**: All existing Razorpay keys and backend URLs remain unchanged
2. **No auth changes**: Login/registration logic untouched
3. **Backward compatible**: Existing payment flows (from My Bookings page) continue to work
4. **User-friendly**: Clear error messages and proper navigation in all scenarios
5. **Booking preservation**: Even if payment fails, booking is saved and user can retry later

## Related Files

- `farmerai-frontend/src/pages/warehouses/WarehouseDetail.jsx` (modified)
- `farmerai-frontend/src/config/razorpay.js` (unchanged, used for reference)
- `farmerai-frontend/src/pages/Payment.jsx` (unchanged, alternative payment flow)
- `FarmerAI-backend/src/routes/warehouse-booking.routes.js` (backend routes)
- `FarmerAI-backend/src/controllers/warehouse-booking.controller.js` (backend logic)
