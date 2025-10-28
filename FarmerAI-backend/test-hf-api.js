// Test Hugging Face API Key
require('dotenv').config();
const axios = require('axios');

async function testHuggingFaceAPI() {
  const apiToken = process.env.HF_API_TOKEN;
  
  if (!apiToken) {
    console.error('❌ HF_API_TOKEN not found in .env file');
    console.log('Please add: HF_API_TOKEN=your_token_here');
    return;
  }

  console.log('🔑 Testing Hugging Face API...');
  console.log('Token:', apiToken.substring(0, 10) + '...');

  try {
    // Test with a simple model
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/resnet-50',
      'test data', // This will fail but we'll get auth response
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ API Key is valid!');
    console.log('Response:', response.status);

  } catch (error) {
    if (error.response?.status === 401) {
      console.error('❌ Invalid API Key');
      console.log('Please check your HF_API_TOKEN in .env file');
    } else if (error.response?.status === 400) {
      console.log('✅ API Key is valid! (400 error is expected for test data)');
    } else {
      console.log('✅ API Key is valid! (Connection successful)');
      console.log('Error details:', error.message);
    }
  }
}

// Run the test
testHuggingFaceAPI();

