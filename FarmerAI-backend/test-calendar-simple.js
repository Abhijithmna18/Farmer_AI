const axios = require('axios');

async function testCalendarAPI() {
  try {
    console.log('Testing calendar API...');
    
    const testData = {
      cropName: "Test Crop",
      variety: "Test Variety",
      plantingDate: "2024-01-15",
      estimatedHarvestDate: "2024-04-15",
      regionalClimate: "Temperate",
      stages: [
        {
          stageName: "Seed",
          startDate: "2024-01-15",
          endDate: "2024-01-25",
          description: "Seed germination",
          careNeeds: "Keep moist",
          nutrientRequirements: "Light nitrogen"
        }
      ]
    };

    console.log('Sending data:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:5000/api/calendar', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('✅ Success! Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testCalendarAPI();
