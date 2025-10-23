// src/services/razorpay.service.js
// Frontend Razorpay integration service

class RazorpayService {
  constructor() {
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1234567890';
    this.loadRazorpayScript();
  }

  // Load Razorpay script dynamically
  loadRazorpayScript() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  // Create Razorpay order
  async createOrder(bookingId, amount, currency = 'INR') {
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId,
          amount,
          currency
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Open Razorpay checkout
  async openCheckout(orderData, onSuccess, onError) {
    try {
      const options = {
        key: this.razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'FarmerAI',
        description: 'Warehouse Booking Payment',
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verificationResult = await this.verifyPayment({
              bookingId: orderData.bookingId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpay_order_id: response.razorpay_order_id
            });

            if (verificationResult.success) {
              onSuccess(response);
            } else {
              onError(new Error('Payment verification failed'));
            }
          } catch (error) {
            onError(error);
          }
        },
        prefill: {
          name: 'Farmer Name',
          email: 'farmer@example.com',
          contact: '9999999999'
        },
        notes: {
          booking_id: orderData.bookingId
        },
        theme: {
          color: '#10B981' // Green color matching your theme
        },
        modal: {
          ondismiss: () => {
            onError(new Error('Payment cancelled by user'));
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error opening Razorpay checkout:', error);
      onError(error);
    }
  }

  // Verify payment
  async verifyPayment(paymentData) {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Process refund
  async processRefund(paymentId, amount, reason) {
    try {
      const response = await fetch('/api/razorpay/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentId,
          amount,
          reason
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`/api/razorpay/payment-status/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw error;
    }
  }

  // Complete payment flow
  async processPayment(bookingId, amount, onSuccess, onError) {
    try {
      // Step 1: Create order
      const orderResult = await this.createOrder(bookingId, amount);
      
      if (!orderResult.success) {
        throw new Error(orderResult.message);
      }

      // Step 2: Open checkout
      await this.openCheckout(orderResult.data, onSuccess, onError);
    } catch (error) {
      onError(error);
    }
  }
}

// Export singleton instance
export default new RazorpayService();