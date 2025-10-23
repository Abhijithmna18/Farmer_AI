// src/utils/bookingViewModel.js
// Deterministic normalization of booking records from API to UI view model

export function computeDurationDays(startISO, endISO) {
  if (!startISO || !endISO) return null;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start) || isNaN(end)) return null;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

export function normalizeBooking(raw, userFallbackName) {
  const inconsistencies = [];
  const w = raw?.warehouse || {};
  const location = w.location || {};
  const address = location.address
    || [location.addressLine1, location.addressLine2].filter(Boolean).join(', ')
    || [location.city, location.state].filter(Boolean).join(', ');

  const startISO = raw?.bookingDates?.startDate || raw?.startDate || null;
  const endISO = raw?.bookingDates?.endDate || raw?.endDate || null;
  const backendDuration = raw?.bookingDates?.duration != null ? Number(raw.bookingDates.duration) : null;
  const computed = computeDurationDays(startISO, endISO);
  if (backendDuration != null && computed != null && backendDuration !== computed) {
    inconsistencies.push('durationMismatch');
  }

  // Preserve existing totalAmount even if it's 0, but flag it as an inconsistency
  const totalAmount = typeof raw?.pricing?.totalAmount === 'number' ? raw.pricing.totalAmount : null;
  const currency = raw?.pricing?.currency || 'INR';
  
  // Fix: Properly calculate amountDue from the booking data
  let amountDue = null;
  if (raw?.payment && raw.payment.amountDue != null) {
    // Use the amountDue from the API if available
    amountDue = raw.payment.amountDue;
  } else if (typeof totalAmount === 'number') {
    // Calculate amountDue based on payment status
    amountDue = (raw?.payment?.status === 'paid') ? 0 : totalAmount;
  } else {
    // Fallback to 0 if no valid data
    amountDue = 0;
  }
  
  if (raw?.payment?.status === 'paid' && typeof amountDue === 'number' && amountDue > 0) {
    inconsistencies.push('paymentContradiction');
  }

  // Add inconsistency flag for zero pricing
  if (totalAmount === 0) {
    inconsistencies.push('zeroPricing');
  }

  return {
    _id: raw?._id,
    bookingId: raw?.bookingId || String(raw?._id || ''),
    customerName: [raw?.farmer?.firstName, raw?.farmer?.lastName].filter(Boolean).join(' ') || userFallbackName,
    warehouse: { _id: w?._id, name: w?.name || 'Warehouse', location: { ...location, address } },
    startDate: startISO,
    endDate: endISO,
    duration: backendDuration ?? computed ?? null,
    pricing: { totalAmount, currency },
    payment: { status: raw?.payment?.status || 'pending', amountDue },
    status: raw?.status || 'pending',
    notes: raw?.notes,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    produce: raw?.produce,
    inconsistencies,
  };
}