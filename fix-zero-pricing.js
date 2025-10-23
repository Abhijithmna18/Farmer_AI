// fix-zero-pricing.js
// Run this script to fix bookings with zero pricing
const axios = require('axios');

async function fixZeroPricing() {
  try {
    // Get your admin token from localStorage or login first
    const token = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual admin JWT token
    
    console.log('Calling bulk reconcile endpoint...');
    
    const response = await axios.post(
      'http://localhost:5000/api/admin/bookings/bulk-reconcile',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Reconciliation completed!');
    console.log('Summary:', response.data.summary);
    console.log('Results:', response.data.results);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixZeroPricing();
