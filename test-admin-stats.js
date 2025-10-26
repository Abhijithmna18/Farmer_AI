const axios = require('axios');

// Test the admin stats endpoint
async function testAdminStats() {
  try {
    console.log('Testing admin stats endpoint...');
    
    // You'll need to replace this with a valid admin token
    const adminToken = 'YOUR_ADMIN_TOKEN_HERE';
    
    const response = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin stats response:', JSON.stringify(response.data, null, 2));
    
    // Check if the required fields are present
    const data = response.data.data;
    console.log('\n📊 Metrics Check:');
    console.log('Total Revenue:', data.totalRevenue);
    console.log('Pending Approvals:', data.pendingApprovals);
    console.log('Completed Bookings:', data.completedBookings);
    console.log('Total Bookings:', data.totalBookings);
    console.log('Total Users:', data.totalUsers);
    console.log('Total Warehouses:', data.totalWarehouses);
    
  } catch (error) {
    console.error('❌ Error testing admin stats:', error.response?.data || error.message);
  }
}

// Test individual analytics endpoints
async function testAnalyticsEndpoints() {
  try {
    console.log('\nTesting individual analytics endpoints...');
    
    const adminToken = 'YOUR_ADMIN_TOKEN_HERE';
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    // Test booking analytics
    console.log('\n📦 Testing booking analytics...');
    const bookingResponse = await axios.get('http://localhost:5000/api/admin/analytics/bookings', { headers });
    console.log('Booking analytics:', JSON.stringify(bookingResponse.data, null, 2));
    
    // Test payment analytics
    console.log('\n💰 Testing payment analytics...');
    const paymentResponse = await axios.get('http://localhost:5000/api/admin/analytics/payments', { headers });
    console.log('Payment analytics:', JSON.stringify(paymentResponse.data, null, 2));
    
    // Test warehouse analytics
    console.log('\n🏪 Testing warehouse analytics...');
    const warehouseResponse = await axios.get('http://localhost:5000/api/admin/analytics/warehouses', { headers });
    console.log('Warehouse analytics:', JSON.stringify(warehouseResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing analytics endpoints:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting admin dashboard metrics tests...\n');
  
  await testAdminStats();
  await testAnalyticsEndpoints();
  
  console.log('\n✅ Tests completed!');
}

runTests();
