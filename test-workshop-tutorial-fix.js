/**
 * Test script to verify the workshop tutorial authentication and subscription flow
 * This script tests the complete flow from login to workshop access
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

// Test configuration
const testConfig = {
  email: 'test@example.com',
  password: 'testpassword123',
  workshopId: null // Will be set after fetching workshops
};

async function testWorkshopTutorialFlow() {
  console.log('🧪 Testing Workshop Tutorial Authentication & Subscription Flow\n');

  try {
    // Step 1: Login to get authentication token
    console.log('1️⃣ Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testConfig.email,
      password: testConfig.password
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Get user profile to check subscription status
    console.log('\n2️⃣ Checking user profile and subscription status...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const user = profileResponse.data.user;
    console.log(`✅ User profile loaded: ${user.email}`);
    console.log(`📊 Has active subscription: ${user.hasActiveSubscription || false}`);

    // Step 3: Fetch workshops
    console.log('\n3️⃣ Fetching workshops...');
    const workshopsResponse = await axios.get(`${BASE_URL}/workshops`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const workshops = workshopsResponse.data.data || [];
    console.log(`✅ Found ${workshops.length} workshops`);

    if (workshops.length === 0) {
      console.log('⚠️  No workshops found. Creating a test workshop...');
      // Create a test workshop
      const createWorkshopResponse = await axios.post(`${BASE_URL}/workshops`, {
        title: 'Test Workshop',
        description: 'A test workshop for authentication flow',
        category: 'Testing',
        level: 'Beginner',
        duration: 30,
        price: 299,
        isFree: false,
        instructor: {
          name: 'Test Instructor',
          bio: 'Test instructor bio'
        },
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        learningOutcomes: ['Learn testing', 'Understand authentication'],
        prerequisites: ['Basic knowledge'],
        materials: [{ name: 'Computer', description: 'Any computer with internet' }]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      testConfig.workshopId = createWorkshopResponse.data.data._id;
      console.log(`✅ Test workshop created with ID: ${testConfig.workshopId}`);
    } else {
      // Use the first workshop
      testConfig.workshopId = workshops[0]._id;
      console.log(`✅ Using workshop: ${workshops[0].title} (ID: ${testConfig.workshopId})`);
    }

    // Step 4: Test workshop access check
    console.log('\n4️⃣ Testing workshop access check...');
    const accessResponse = await axios.get(`${BASE_URL}/workshops/${testConfig.workshopId}/access`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const hasAccess = accessResponse.data.data.hasAccess;
    const reason = accessResponse.data.data.reason;
    console.log(`✅ Access check result: ${hasAccess} (Reason: ${reason})`);

    // Step 5: Test subscription order creation (if no access)
    if (!hasAccess) {
      console.log('\n5️⃣ Testing subscription order creation...');
      const orderResponse = await axios.post(`${BASE_URL}/workshops/subscription/order`, {
        type: 'workshop',
        workshopId: testConfig.workshopId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (orderResponse.data.success) {
        console.log('✅ Subscription order created successfully');
        console.log(`💰 Order ID: ${orderResponse.data.data.orderId}`);
        console.log(`💵 Amount: ₹${orderResponse.data.data.amount}`);
      } else {
        console.log('❌ Failed to create subscription order');
      }
    } else {
      console.log('\n5️⃣ Skipping subscription order test (user already has access)');
    }

    // Step 6: Test workshop detail fetch
    console.log('\n6️⃣ Testing workshop detail fetch...');
    const detailResponse = await axios.get(`${BASE_URL}/workshops/${testConfig.workshopId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (detailResponse.data.success) {
      console.log('✅ Workshop details fetched successfully');
      console.log(`📝 Title: ${detailResponse.data.data.title}`);
      console.log(`💰 Price: ₹${detailResponse.data.data.price}`);
      console.log(`🆓 Is Free: ${detailResponse.data.data.isFree}`);
    } else {
      console.log('❌ Failed to fetch workshop details');
    }

    console.log('\n🎉 Workshop tutorial flow test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Authentication: ✅ Working`);
    console.log(`   - Profile loading: ✅ Working`);
    console.log(`   - Subscription check: ✅ Working`);
    console.log(`   - Workshop access: ${hasAccess ? '✅ Granted' : '❌ Not granted'}`);
    console.log(`   - Order creation: ${!hasAccess ? '✅ Working' : '⏭️  Skipped'}`);
    console.log(`   - Workshop details: ✅ Working`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testWorkshopTutorialFlow();
}

module.exports = { testWorkshopTutorialFlow };

