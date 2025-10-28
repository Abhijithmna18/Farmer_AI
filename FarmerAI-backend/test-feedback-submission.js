const axios = require('axios');

async function testFeedbackSubmission() {
  try {
    console.log('🔐 Getting authentication token...');
    
    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'test@example.com',
      password: 'TestPass123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Test feedback submission
    console.log('\n📝 Testing feedback submission...');
    
    const feedbackData = {
      type: 'Bug Report',
      subject: 'Test Feedback Submission',
      description: 'This is a test feedback submission to verify the system is working correctly. The form should accept this feedback and store it in the database.',
      priority: 'Medium',
      category: 'Technical Issue',
      urgency: 'normal',
      contactPreference: 'email',
      allowFollowUp: true,
      tags: ['test', 'bug-report']
    };
    
    const feedbackResponse = await axios.post('http://localhost:5002/api/feedback', feedbackData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Feedback submission successful!');
    console.log('Response:', JSON.stringify(feedbackResponse.data, null, 2));
    
    // Test analytics endpoint
    console.log('\n📊 Testing analytics endpoint...');
    
    const analyticsResponse = await axios.get('http://localhost:5002/api/feedback/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Analytics endpoint successful!');
    console.log('Analytics:', JSON.stringify(analyticsResponse.data, null, 2));
    
    // Test notifications endpoint
    console.log('\n🔔 Testing notifications endpoint...');
    
    const notificationsResponse = await axios.get('http://localhost:5002/api/feedback/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Notifications endpoint successful!');
    console.log('Notifications:', JSON.stringify(notificationsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error:', error.message);
  }
}

testFeedbackSubmission();
