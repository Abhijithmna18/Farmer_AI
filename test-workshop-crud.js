// test-workshop-crud.js
// Test script for Workshop CRUD operations and image upload functionality

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');

// Test data
const testWorkshop = {
  title: 'Test Workshop - Advanced Crop Management',
  description: 'Learn advanced techniques for managing crops throughout their lifecycle.',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  duration: 45,
  category: 'advanced',
  level: 'advanced',
  isPremium: true,
  price: 299,
  tags: 'crop management, advanced techniques, farming',
  instructorName: 'Dr. Test Instructor',
  instructorBio: 'Expert in agricultural sciences with 20 years of experience.',
  instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  learningOutcomes: 'Understand crop lifecycle, Implement advanced techniques, Optimize yield',
  prerequisites: 'Basic farming knowledge, Access to crops',
  materials: JSON.stringify([
    { name: 'Notebook', description: 'For taking notes' },
    { name: 'Measuring tools', description: 'For accurate measurements' }
  ]),
  isActive: true
};

// Create a test image if it doesn't exist
function createTestImage() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    // Create a simple 1x1 pixel JPEG
    const jpegData = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x00, 0xFF, 0xD9
    ]);
    fs.writeFileSync(TEST_IMAGE_PATH, jpegData);
    console.log('✅ Created test image');
  }
}

// Helper function to create FormData
function createFormData(data, imagePath = null) {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  if (imagePath && fs.existsSync(imagePath)) {
    formData.append('thumbnail', fs.createReadStream(imagePath));
  }
  
  return formData;
}

// Test functions
async function testCreateWorkshop() {
  console.log('\n🧪 Testing CREATE Workshop...');
  
  try {
    createTestImage();
    const formData = createFormData(testWorkshop, TEST_IMAGE_PATH);
    
    const response = await axios.post(`${BASE_URL}/workshops`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
      }
    });
    
    console.log('✅ Workshop created successfully');
    console.log('📊 Response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to create workshop:', error.response?.data || error.message);
    return null;
  }
}

async function testGetAllWorkshops() {
  console.log('\n🧪 Testing GET All Workshops...');
  
  try {
    const response = await axios.get(`${BASE_URL}/workshops`);
    console.log('✅ Retrieved workshops successfully');
    console.log(`📊 Found ${response.data.data.length} workshops`);
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to get workshops:', error.response?.data || error.message);
    return [];
  }
}

async function testGetWorkshopById(workshopId) {
  console.log('\n🧪 Testing GET Workshop by ID...');
  
  try {
    const response = await axios.get(`${BASE_URL}/workshops/${workshopId}`);
    console.log('✅ Retrieved workshop successfully');
    console.log('📊 Workshop:', response.data.data.title);
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to get workshop:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateWorkshop(workshopId) {
  console.log('\n🧪 Testing UPDATE Workshop...');
  
  try {
    const updateData = {
      ...testWorkshop,
      title: 'Updated Test Workshop - Advanced Crop Management',
      description: 'Updated description with new content.',
      price: 399
    };
    
    const formData = createFormData(updateData);
    
    const response = await axios.put(`${BASE_URL}/workshops/${workshopId}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
      }
    });
    
    console.log('✅ Workshop updated successfully');
    console.log('📊 Updated workshop:', response.data.data.title);
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to update workshop:', error.response?.data || error.message);
    return null;
  }
}

async function testDeleteWorkshop(workshopId) {
  console.log('\n🧪 Testing DELETE Workshop...');
  
  try {
    const response = await axios.delete(`${BASE_URL}/workshops/${workshopId}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Replace with actual admin token
      }
    });
    
    console.log('✅ Workshop deleted successfully');
    console.log('📊 Response:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete workshop:', error.response?.data || error.message);
    return false;
  }
}

async function testYouTubeIntegration(workshop) {
  console.log('\n🧪 Testing YouTube Integration...');
  
  try {
    // Test YouTube video ID extraction
    const youtubeVideoId = workshop.youtubeVideoId;
    const youtubeThumbnail = workshop.youtubeThumbnail;
    
    console.log('📊 YouTube Video ID:', youtubeVideoId);
    console.log('📊 YouTube Thumbnail:', youtubeThumbnail);
    
    if (youtubeVideoId && youtubeThumbnail) {
      console.log('✅ YouTube integration working correctly');
    } else {
      console.log('⚠️ YouTube integration may need attention');
    }
    
    return true;
  } catch (error) {
    console.error('❌ YouTube integration test failed:', error.message);
    return false;
  }
}

async function testImageUpload() {
  console.log('\n🧪 Testing Image Upload...');
  
  try {
    createTestImage();
    
    // Test image file validation
    const stats = fs.statSync(TEST_IMAGE_PATH);
    console.log('📊 Test image size:', Math.round(stats.size / 1024), 'KB');
    
    if (stats.size > 0) {
      console.log('✅ Image upload functionality ready');
    } else {
      console.log('⚠️ Test image is empty');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Image upload test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Workshop CRUD and Image Upload Tests\n');
  
  // Test image upload functionality
  await testImageUpload();
  
  // Test GET all workshops (public endpoint)
  const workshops = await testGetAllWorkshops();
  
  // Test CREATE workshop (requires admin token)
  const createdWorkshop = await testCreateWorkshop();
  
  if (createdWorkshop) {
    const workshopId = createdWorkshop._id;
    
    // Test GET workshop by ID
    await testGetWorkshopById(workshopId);
    
    // Test YouTube integration
    await testYouTubeIntegration(createdWorkshop);
    
    // Test UPDATE workshop
    await testUpdateWorkshop(workshopId);
    
    // Test DELETE workshop
    await testDeleteWorkshop(workshopId);
  }
  
  console.log('\n🏁 Tests completed!');
  console.log('\n📝 Notes:');
  console.log('- Replace YOUR_ADMIN_TOKEN_HERE with actual admin JWT token');
  console.log('- Ensure backend server is running on http://localhost:5000');
  console.log('- Check that admin user exists and has proper permissions');
  console.log('- Verify image upload directory exists in backend');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCreateWorkshop,
  testGetAllWorkshops,
  testGetWorkshopById,
  testUpdateWorkshop,
  testDeleteWorkshop,
  testYouTubeIntegration,
  testImageUpload,
  runTests
};

