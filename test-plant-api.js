// Test script for Plant Identification API
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Set environment variable for testing
process.env.GEMINI_API_KEY = 'AIzaSyD79APiY2vm_MKwuScXLbv2lopLpPLuyiE';

const API_BASE_URL = 'http://localhost:5000/api';

async function testPlantIdentification() {
  console.log('🧪 Testing Plant Identification API...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running. Please start the server first.');
      console.log('Run: cd FarmerAI-backend && npm start');
      return;
    }

    // Test 2: Test Gemini API directly
    console.log('\n2. Testing Gemini API directly...');
    try {
      const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      const params = { key: process.env.GEMINI_API_KEY };
      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello, can you identify plants? Respond with just "Yes" or "No".' }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10
        }
      };

      const response = await axios.post(geminiUrl, body, { params, timeout: 30000 });
      console.log('✅ Gemini API is accessible');
      console.log('Response:', response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response');
    } catch (error) {
      console.log('❌ Gemini API test failed:', error.response?.status, error.message);
      if (error.response?.status === 403) {
        console.log('   This might be an API key issue or billing problem.');
      } else if (error.response?.status === 429) {
        console.log('   Rate limit exceeded. Please try again later.');
      }
    }

    // Test 3: Test plant details by name endpoint
    console.log('\n3. Testing plant details by name...');
    try {
      const detailsResponse = await axios.get(`${API_BASE_URL}/plants/details`, {
        params: { name: 'Rose' }
      });
      console.log('✅ Plant details endpoint working');
      console.log('Rose details:', JSON.stringify(detailsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Plant details test failed:', error.response?.status, error.message);
    }

    // Test 4: Test fetch plants endpoint
    console.log('\n4. Testing fetch plants endpoint...');
    try {
      const plantsResponse = await axios.get(`${API_BASE_URL}/plants`);
      console.log('✅ Fetch plants endpoint working');
      console.log(`Found ${plantsResponse.data.plants?.length || 0} saved plants`);
    } catch (error) {
      console.log('❌ Fetch plants test failed:', error.response?.status, error.message);
    }

    // Test 5: Test with a sample image (if available)
    console.log('\n5. Testing with sample image...');
    const sampleImagePath = path.join(__dirname, 'FarmerAI-backend', 'uploads');
    
    // Look for any image file in uploads
    let testImagePath = null;
    try {
      const files = fs.readdirSync(sampleImagePath);
      const imageFile = files.find(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
      if (imageFile) {
        testImagePath = path.join(sampleImagePath, imageFile);
        console.log(`Found test image: ${imageFile}`);
      }
    } catch (error) {
      console.log('No sample images found in uploads folder');
    }

    if (testImagePath) {
      try {
        const form = new FormData();
        form.append('plantImage', fs.createReadStream(testImagePath));

        const uploadResponse = await axios.post(`${API_BASE_URL}/plants/upload`, form, {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 120000 // 2 minutes for image processing
        });

        console.log('✅ Plant identification with image successful!');
        console.log('Identified plant:', uploadResponse.data.plant?.name);
        console.log('Method:', uploadResponse.data.identificationMethod);
        console.log('Message:', uploadResponse.data.message);
      } catch (error) {
        console.log('❌ Plant identification with image failed:', error.response?.status, error.message);
        if (error.response?.data) {
          console.log('Error details:', error.response.data);
        }
      }
    } else {
      console.log('⚠️  No test image available. To test image upload:');
      console.log('   1. Add an image file to FarmerAI-backend/uploads/');
      console.log('   2. Run this test again');
    }

  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

// Run the test
testPlantIdentification();

