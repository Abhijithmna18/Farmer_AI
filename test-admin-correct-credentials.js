const axios = require('axios');

// Test admin login and stats with correct credentials
async function testAdminLoginAndStats() {
  try {
    console.log('🚀 Testing admin login and stats with correct credentials...\n');
    
    // Step 1: Login as admin with correct credentials
    console.log('1. Attempting admin login with correct credentials...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'abhijithmnair2002@gmail.com',
      password: 'Admin@123'
    });
    
    console.log('✅ Admin login successful!');
    console.log('Token present:', !!loginResponse.data.token);
    console.log('User role:', loginResponse.data.user?.role);
    
    const token = loginResponse.data.token;
    
    // Step 2: Test admin stats with valid token
    console.log('\n2. Testing admin stats with valid token...');
    const statsResponse = await axios.get('http://localhost:5002/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin stats response received!');
    console.log('Response structure:', {
      success: statsResponse.data.success,
      hasData: !!statsResponse.data.data,
      dataKeys: statsResponse.data.data ? Object.keys(statsResponse.data.data) : []
    });
    
    // Check the specific metrics
    const data = statsResponse.data.data;
    console.log('\n📊 Admin Dashboard Metrics:');
    console.log('Total Revenue:', data.totalRevenue);
    console.log('Pending Approvals:', data.pendingApprovals);
    console.log('Completed Bookings:', data.completedBookings);
    console.log('Total Bookings:', data.totalBookings);
    console.log('Total Users:', data.totalUsers);
    console.log('Total Warehouses:', data.totalWarehouses);
    console.log('Active Bookings:', data.activeBookings);
    
    // Test individual analytics endpoints
    console.log('\n3. Testing individual analytics endpoints...');
    
    // Test booking analytics
    const bookingResponse = await axios.get('http://localhost:5002/api/admin/analytics/bookings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('📦 Booking Analytics:', bookingResponse.data.data);
    
    // Test payment analytics
    const paymentResponse = await axios.get('http://localhost:5002/api/admin/analytics/payments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('💰 Payment Analytics:', paymentResponse.data.data);
    
    // Test warehouse analytics
    const warehouseResponse = await axios.get('http://localhost:5002/api/admin/analytics/warehouses', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('🏪 Warehouse Analytics:', warehouseResponse.data.data);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in test:', error.response?.data || error.message);
  }
}

// Run the test
testAdminLoginAndStats();
