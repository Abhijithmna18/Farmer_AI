# Fix for "Payment Due" Field Showing "₹0.00" in My Bookings Page

## Problem
The "Payment Due" field on booking cards was incorrectly displaying "₹0.00" instead of the actual price or amount due for bookings. This was happening because:

1. The frontend was not properly accessing the payment amount due from the booking data
2. The backend was not consistently calculating and sending the correct payment amount due
3. The view model was not properly normalizing the payment data

## Solution Implemented

### 1. Frontend Fix (MyBookings.jsx)
- **Improved payment amount calculation**: Now properly uses `booking.payment.amountDue` if available, otherwise falls back to `booking.pricing.totalAmount`
- **Better display logic**: Shows the correct amount based on payment status:
  - For paid bookings: Shows the total amount
  - For unpaid bookings with amount due: Shows the amount due
  - For bookings with pricing issues: Shows "₹0.00" with error indicator
- **Enhanced conditional rendering**: Payment due badge only shows when there's actually an amount due

### 2. Backend Fix (warehouse-booking.controller.js)
- **Consistent amount due calculation**: Ensures `payment.amountDue` is always calculated and set correctly
- **Proper logic for paid bookings**: Sets amount due to 0 for paid bookings, otherwise uses total amount
- **Fallback handling**: Provides default values when pricing data is missing

### 3. View Model Fix (bookingViewModel.js)
- **Proper data normalization**: Correctly extracts and calculates payment amount due from raw booking data
- **Improved fallback logic**: Uses payment status to determine amount due when not explicitly provided
- **Better error handling**: Maintains inconsistency flags for debugging

## Key Changes

### Frontend (MyBookings.jsx)
```javascript
// Before:
const hasPricingIssue = !booking.pricing?.totalAmount || booking.pricing.totalAmount === 0;
const isPaidBooking = booking.payment?.status === 'paid';
const priceDisplay = (hasPricingIssue && !isPaidBooking) ? '₹0.00' : formatCurrency(booking.pricing.totalAmount);

// After:
const amountDue = booking.payment?.amountDue ?? booking.pricing?.totalAmount ?? 0;
const showPaymentDue = typeof amountDue === 'number' && amountDue > 0 && booking.payment?.status !== 'paid';
const priceDisplay = isPaidBooking ? formatCurrency(booking.pricing?.totalAmount ?? 0) : 
                     showPaymentDue ? formatCurrency(amountDue) : 
                     hasPricingIssue ? '₹0.00' : formatCurrency(booking.pricing?.totalAmount ?? 0);
```

### Backend (warehouse-booking.controller.js)
```javascript
// Added proper amountDue calculation:
if (typeof booking.payment.amountDue !== 'number') {
  const total = booking.pricing?.totalAmount;
  if (typeof total === 'number') {
    // If booking is paid, amount due is 0, otherwise it's the total amount
    booking.payment.amountDue = (booking.payment.status === 'paid') ? 0 : total;
  } else {
    // Fallback to 0 if no total amount
    booking.payment.amountDue = 0;
  }
}
```

### View Model (bookingViewModel.js)
```javascript
// Improved amountDue calculation:
let amountDue = null;
if (raw?.payment && typeof raw.payment.amountDue === 'number') {
  // Use the amountDue from the API if available
  amountDue = raw.payment.amountDue;
} else if (typeof totalAmount === 'number') {
  // Calculate amountDue based on payment status
  amountDue = (raw?.payment?.status === 'paid') ? 0 : totalAmount;
}
```

## Testing
To verify the fix:
1. Check bookings with different payment statuses (paid, pending, etc.)
2. Verify that paid bookings show the correct total amount
3. Confirm that unpaid bookings show the correct amount due
4. Ensure bookings with pricing errors still show "₹0.00" with error indicators
5. Test that the "Payment Due" badge only appears when there's actually an amount due

## Result
The "Payment Due" field now correctly displays:
- The actual amount due for unpaid bookings
- The total booking amount for paid bookings
- "₹0.00" with error indicators only for bookings with genuine pricing issues
- Proper badges indicating payment status (Paid, Payment Due, etc.)