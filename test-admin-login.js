const axios = require('axios');

// Test admin login and stats
async function testAdminLoginAndStats() {
  try {
    console.log('🚀 Testing admin login and stats...\n');
    
    // Step 1: Try to login as admin
    console.log('1. Attempting admin login...');
    try {
      const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
        email: 'admin@farmerai.com', // Common admin email
        password: 'admin123' // Common admin password
      });
      
      console.log('✅ Admin login successful:', loginResponse.data);
      const token = loginResponse.data.token;
      
      // Step 2: Test admin stats with valid token
      console.log('\n2. Testing admin stats with valid token...');
      const statsResponse = await axios.get('http://localhost:5002/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin stats response:', JSON.stringify(statsResponse.data, null, 2));
      
      // Check the specific metrics
      const data = statsResponse.data.data;
      console.log('\n📊 Metrics Check:');
      console.log('Total Revenue:', data.totalRevenue);
      console.log('Pending Approvals:', data.pendingApprovals);
      console.log('Completed Bookings:', data.completedBookings);
      console.log('Total Bookings:', data.totalBookings);
      console.log('Total Users:', data.totalUsers);
      console.log('Total Warehouses:', data.totalWarehouses);
      
    } catch (loginError) {
      console.log('❌ Admin login failed:', loginError.response?.status, loginError.response?.data?.message);
      
      // Try with different admin credentials
      console.log('\nTrying alternative admin credentials...');
      try {
        const altLoginResponse = await axios.post('http://localhost:5002/api/auth/login', {
          email: 'admin@example.com',
          password: 'password'
        });
        
        console.log('✅ Alternative admin login successful:', altLoginResponse.data);
        const token = altLoginResponse.data.token;
        
        // Test admin stats with alternative token
        const statsResponse = await axios.get('http://localhost:5002/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Admin stats with alternative token:', JSON.stringify(statsResponse.data, null, 2));
        
      } catch (altError) {
        console.log('❌ Alternative admin login also failed:', altError.response?.status, altError.response?.data?.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

// Run the test
testAdminLoginAndStats();
