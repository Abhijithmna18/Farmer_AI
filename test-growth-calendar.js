const axios = require('axios');

// Test the growth calendar endpoints
async function testGrowthCalendarAPI() {
  const baseURL = 'http://localhost:5002/api';
  const adminToken = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with actual admin token
  
  try {
    console.log('Testing Growth Calendar API endpoints...\n');
    
    // Test 1: Get all growth calendars (admin)
    console.log('1. Testing GET /admin/growth-calendar');
    const getResponse = await axios.get(`${baseURL}/admin/growth-calendar`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('   Status:', getResponse.status);
    console.log('   Data:', getResponse.data);
    console.log('   Success:', getResponse.data.success);
    console.log('');
    
    // Test 2: Create a new growth calendar (admin)
    console.log('2. Testing POST /admin/growth-calendar');
    const createData = {
      cropName: 'Test Crop',
      variety: 'Test Variety',
      plantingDate: '2025-10-20',
      estimatedHarvestDate: '2026-01-20',
      season: '2025-winter',
      year: 2025,
      isActive: true,
      notes: 'Test growth calendar entry'
    };
    
    const createResponse = await axios.post(`${baseURL}/admin/growth-calendar`, createData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log('   Status:', createResponse.status);
    console.log('   Data:', createResponse.data);
    console.log('   Success:', createResponse.data.success);
    console.log('');
    
    // Test 3: Get the created calendar by ID (admin)
    if (createResponse.data.data && createResponse.data.data._id) {
      const calendarId = createResponse.data.data._id;
      console.log('3. Testing GET /admin/growth-calendar/:id');
      const getByIdResponse = await axios.get(`${baseURL}/admin/growth-calendar/${calendarId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      console.log('   Status:', getByIdResponse.status);
      console.log('   Data:', getByIdResponse.data);
      console.log('   Success:', getByIdResponse.data.success);
      console.log('');
      
      // Test 4: Update the calendar (admin)
      console.log('4. Testing PUT /admin/growth-calendar/:id');
      const updateData = {
        notes: 'Updated test growth calendar entry',
        isActive: false
      };
      
      const updateResponse = await axios.put(`${baseURL}/admin/growth-calendar/${calendarId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      console.log('   Status:', updateResponse.status);
      console.log('   Data:', updateResponse.data);
      console.log('   Success:', updateResponse.data.success);
      console.log('');
      
      // Test 5: Delete the calendar (admin)
      console.log('5. Testing DELETE /admin/growth-calendar/:id');
      const deleteResponse = await axios.delete(`${baseURL}/admin/growth-calendar/${calendarId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      console.log('   Status:', deleteResponse.status);
      console.log('   Data:', deleteResponse.data);
      console.log('   Success:', deleteResponse.data.success);
      console.log('');
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error.response ? error.response.data : error.message);
  }
}

// Run the test
testGrowthCalendarAPI();