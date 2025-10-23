// Test script for warehouses API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testWarehousesAPI() {
  console.log('🧪 Testing Warehouses API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/warehouses/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);
    console.log(`   Total warehouses: ${healthResponse.data.data.totalWarehouses}\n`);

    // Test 2: Basic warehouses fetch (no location)
    console.log('2. Testing basic warehouses fetch (no location)...');
    const basicResponse = await axios.get(`${BASE_URL}/warehouses?page=1&limit=5`);
    console.log('✅ Basic fetch passed');
    console.log(`   Found ${basicResponse.data.data.length} warehouses`);
    console.log(`   Pagination: page ${basicResponse.data.pagination.current} of ${basicResponse.data.pagination.pages}\n`);

    // Test 3: Warehouses fetch with invalid location
    console.log('3. Testing warehouses fetch with invalid location...');
    const invalidLocationResponse = await axios.get(`${BASE_URL}/warehouses?page=1&limit=5&latitude=invalid&longitude=invalid`);
    console.log('✅ Invalid location handled gracefully');
    console.log(`   Found ${invalidLocationResponse.data.data.length} warehouses\n`);

    // Test 4: Warehouses fetch with valid location
    console.log('4. Testing warehouses fetch with valid location...');
    const validLocationResponse = await axios.get(`${BASE_URL}/warehouses?page=1&limit=5&latitude=28.6139&longitude=77.2090&maxDistance=50`);
    console.log('✅ Valid location search passed');
    console.log(`   Found ${validLocationResponse.data.data.length} warehouses\n`);

    // Test 5: Search with filters
    console.log('5. Testing search with filters...');
    const searchResponse = await axios.get(`${BASE_URL}/warehouses?page=1&limit=5&search=warehouse&sortBy=name&sortOrder=asc`);
    console.log('✅ Search with filters passed');
    console.log(`   Found ${searchResponse.data.data.length} warehouses\n`);

    console.log('🎉 All tests passed! The warehouses API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testWarehousesAPI();
























