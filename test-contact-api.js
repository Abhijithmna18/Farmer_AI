// Test script for Contact Us API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testContactAPI() {
  console.log('🧪 Testing Contact Us API...\n');

  try {
    // Test 1: Valid contact submission
    console.log('Test 1: Valid contact submission');
    const validContact = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      subject: 'Test Inquiry',
      message: 'This is a test message to verify the contact form functionality.'
    };

    const response1 = await axios.post(`${BASE_URL}/api/contact`, validContact);
    console.log('✅ Success:', response1.data);
    console.log('Status:', response1.status);
    console.log('');

    // Test 2: Invalid email
    console.log('Test 2: Invalid email validation');
    try {
      const invalidContact = {
        name: 'Jane Doe',
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'This should fail validation.'
      };
      await axios.post(`${BASE_URL}/api/contact`, invalidContact);
    } catch (error) {
      console.log('✅ Expected validation error:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 3: Missing required fields
    console.log('Test 3: Missing required fields');
    try {
      const incompleteContact = {
        name: 'Bob Smith',
        // Missing email, subject, message
      };
      await axios.post(`${BASE_URL}/api/contact`, incompleteContact);
    } catch (error) {
      console.log('✅ Expected validation error:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 4: Rate limiting (if implemented)
    console.log('Test 4: Rate limiting test (sending multiple requests)');
    for (let i = 0; i < 6; i++) {
      try {
        const rateLimitContact = {
          name: `Test User ${i}`,
          email: `test${i}@example.com`,
          subject: `Rate Limit Test ${i}`,
          message: `This is test message ${i} to check rate limiting.`
        };
        const response = await axios.post(`${BASE_URL}/api/contact`, rateLimitContact);
        console.log(`Request ${i + 1}: Success`);
      } catch (error) {
        console.log(`Request ${i + 1}: ${error.response?.data?.message || error.message}`);
        break;
      }
    }
    console.log('');

    console.log('🎉 Contact API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

// Run the test
testContactAPI();
