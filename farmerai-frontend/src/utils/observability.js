// src/utils/observability.js
// Minimal wrapper to log inconsistencies to Sentry if available, else console.

export function logInconsistency(event) {
  try {
    const payload = {
      type: 'booking_inconsistency',
      ...event,
      ts: Date.now(),
    };
    const sentry = (typeof window !== 'undefined' && window.Sentry) ? window.Sentry : null;
    if (sentry && typeof sentry.captureMessage === 'function') {
      sentry.captureMessage('Booking data inconsistency', {
        level: 'warning',
        extra: payload,
      });
    } else {
      console.warn('[OBSERVE] Booking inconsistency', payload);
    }
  } catch (e) {
    // never throw
    console.warn('[OBSERVE] failed to log inconsistency', e);
  }
}

export function logRateAlert(event) {
  try {
    const payload = { type: 'booking_inconsistency_rate', ...event, ts: Date.now() };
    const sentry = (typeof window !== 'undefined' && window.Sentry) ? window.Sentry : null;
    if (sentry && typeof sentry.captureMessage === 'function') {
      sentry.captureMessage('High inconsistency rate', { level: 'warning', extra: payload });
    } else {
      console.warn('[OBSERVE] High inconsistency rate', payload);
    }
  } catch (e) {}
}
