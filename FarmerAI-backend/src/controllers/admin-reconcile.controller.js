// src/controllers/admin-reconcile.controller.js
const Booking = require('../models/Booking');
const logger = require('../utils/logger');

// Bulk reconcile all bookings with missing or zero pricing
exports.bulkReconcileBookings = async (req, res) => {
  try {
    // Find all bookings with zero or missing totalAmount
    const bookings = await Booking.find({
      $or: [
        { 'pricing.totalAmount': { $exists: false } },
        { 'pricing.totalAmount': 0 },
        { 'pricing.totalAmount': null }
      ]
    }).populate('warehouse', 'pricing');

    logger.info(`Found ${bookings.length} bookings with missing or zero pricing`);

    let fixed = 0;
    let skipped = 0;
    const results = [];

    for (const booking of bookings) {
      try {
        const basePrice = booking.warehouse?.pricing?.basePrice || booking.pricing?.basePrice || 0;
        const start = new Date(booking.bookingDates.startDate);
        const end = new Date(booking.bookingDates.endDate);
        const computedDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const duration = booking.bookingDates?.duration || computedDuration || 0;
        const quantity = booking.produce?.quantity || 0;

        if (basePrice > 0 && duration > 0 && quantity > 0) {
          const totalAmount = basePrice * duration * quantity;
          const platformFee = Math.round(totalAmount * 0.05);
          const ownerAmount = totalAmount - platformFee;

          booking.pricing = booking.pricing || {};
          booking.pricing.basePrice = basePrice;
          booking.pricing.totalAmount = totalAmount;
          booking.pricing.platformFee = platformFee;
          booking.pricing.ownerAmount = ownerAmount;
          booking.pricing.currency = booking.pricing.currency || 'INR';

          // Also set payment.amountDue
          booking.payment = booking.payment || {};
          booking.payment.amountDue = (booking.payment.status === 'paid') ? 0 : totalAmount;

          await booking.save();
          results.push({
            bookingId: booking.bookingId,
            status: 'fixed',
            totalAmount
          });
          fixed++;
        } else {
          results.push({
            bookingId: booking.bookingId,
            status: 'skipped',
            reason: `Missing data: basePrice=${basePrice}, duration=${duration}, quantity=${quantity}`
          });
          skipped++;
        }
      } catch (err) {
        logger.error(`Error fixing booking ${booking.bookingId}:`, err);
        results.push({
          bookingId: booking.bookingId,
          status: 'error',
          error: err.message
        });
        skipped++;
      }
    }

    return res.json({
      success: true,
      message: 'Bulk reconciliation completed',
      summary: {
        total: bookings.length,
        fixed,
        skipped
      },
      results
    });
  } catch (error) {
    logger.error('Bulk reconcile failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Bulk reconciliation failed',
      error: error.message
    });
  }
};
