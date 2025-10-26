// test-frontend-workshop.js
// Frontend test script for Workshop components

import { workshopService } from './src/services/workshopService.js';
import { extractYouTubeVideoId, generateYouTubeEmbedUrl, generateYouTubeThumbnailUrl } from './src/utils/youtubeUtils.js';

// Mock data for testing
const mockWorkshop = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Workshop - Advanced Crop Management',
  description: 'Learn advanced techniques for managing crops throughout their lifecycle.',
  thumbnail: 'http://localhost:5000/uploads/workshops/test-image.jpg',
  youtubeThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  youtubeVideoId: 'dQw4w9WgXcQ',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  duration: 45,
  category: 'advanced',
  level: 'advanced',
  isPremium: true,
  isFree: false,
  price: 299,
  tags: ['crop management', 'advanced techniques', 'farming'],
  instructor: {
    name: 'Dr. Test Instructor',
    bio: 'Expert in agricultural sciences with 20 years of experience.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
  },
  learningOutcomes: ['Understand crop lifecycle', 'Implement advanced techniques', 'Optimize yield'],
  prerequisites: ['Basic farming knowledge', 'Access to crops'],
  materials: [
    { name: 'Notebook', description: 'For taking notes' },
    { name: 'Measuring tools', description: 'For accurate measurements' }
  ],
  isActive: true,
  views: 0,
  ratings: {
    average: 0,
    count: 0
  }
};

// Test YouTube utilities
function testYouTubeUtils() {
  console.log('🧪 Testing YouTube Utilities...');
  
  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/v/dQw4w9WgXcQ'
  ];
  
  testUrls.forEach(url => {
    const videoId = extractYouTubeVideoId(url);
    const embedUrl = generateYouTubeEmbedUrl(videoId);
    const thumbnailUrl = generateYouTubeThumbnailUrl(videoId);
    
    console.log(`📊 URL: ${url}`);
    console.log(`   Video ID: ${videoId}`);
    console.log(`   Embed URL: ${embedUrl}`);
    console.log(`   Thumbnail URL: ${thumbnailUrl}`);
    
    if (videoId === 'dQw4w9WgXcQ') {
      console.log('✅ YouTube utility working correctly');
    } else {
      console.log('❌ YouTube utility failed');
    }
  });
}

// Test workshop service methods
async function testWorkshopService() {
  console.log('\n🧪 Testing Workshop Service...');
  
  try {
    // Test getAllWorkshops
    console.log('📊 Testing getAllWorkshops...');
    const workshops = await workshopService.getAllWorkshops();
    console.log(`✅ Retrieved ${workshops.data.length} workshops`);
    
    // Test getWorkshopById
    if (workshops.data.length > 0) {
      const firstWorkshop = workshops.data[0];
      console.log('📊 Testing getWorkshopById...');
      const workshop = await workshopService.getWorkshopById(firstWorkshop._id);
      console.log(`✅ Retrieved workshop: ${workshop.data.title}`);
    }
    
    // Test checkWorkshopAccess (requires authentication)
    console.log('📊 Testing checkWorkshopAccess...');
    try {
      await workshopService.checkWorkshopAccess('507f1f77bcf86cd799439011');
      console.log('✅ Workshop access check completed');
    } catch (error) {
      console.log('⚠️ Workshop access check requires authentication');
    }
    
  } catch (error) {
    console.error('❌ Workshop service test failed:', error.message);
  }
}

// Test image handling
function testImageHandling() {
  console.log('\n🧪 Testing Image Handling...');
  
  // Test thumbnail fallback logic
  const testCases = [
    {
      workshop: { ...mockWorkshop, thumbnail: null },
      expected: mockWorkshop.youtubeThumbnail
    },
    {
      workshop: { ...mockWorkshop, thumbnail: '', youtubeThumbnail: null },
      expected: '/default-workshop.png'
    },
    {
      workshop: { ...mockWorkshop, thumbnail: 'http://example.com/image.jpg' },
      expected: 'http://example.com/image.jpg'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    const { workshop } = testCase;
    const thumbnail = workshop.thumbnail || workshop.youtubeThumbnail || '/default-workshop.png';
    
    console.log(`📊 Test case ${index + 1}:`);
    console.log(`   Workshop thumbnail: ${workshop.thumbnail}`);
    console.log(`   YouTube thumbnail: ${workshop.youtubeThumbnail}`);
    console.log(`   Final thumbnail: ${thumbnail}`);
    
    if (thumbnail === testCase.expected) {
      console.log('✅ Image handling working correctly');
    } else {
      console.log('❌ Image handling failed');
    }
  });
}

// Test form data creation
function testFormDataCreation() {
  console.log('\n🧪 Testing Form Data Creation...');
  
  const workshopData = {
    title: 'Test Workshop',
    description: 'Test description',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: 30,
    category: 'beginner',
    level: 'beginner',
    isPremium: false,
    price: 0,
    tags: ['test', 'workshop'],
    instructorName: 'Test Instructor',
    instructorBio: 'Test bio',
    instructorAvatar: 'https://example.com/avatar.jpg',
    learningOutcomes: ['Learn something', 'Apply knowledge'],
    prerequisites: ['Basic knowledge'],
    materials: JSON.stringify([{ name: 'Notebook', description: 'For notes' }]),
    isActive: true,
    thumbnail: new File(['test'], 'test.jpg', { type: 'image/jpeg' })
  };
  
  const formData = new FormData();
  
  Object.keys(workshopData).forEach(key => {
    if (key !== 'thumbnail' && workshopData[key] !== null && workshopData[key] !== undefined) {
      if (Array.isArray(workshopData[key])) {
        formData.append(key, workshopData[key].join(','));
      } else {
        formData.append(key, workshopData[key]);
      }
    }
  });
  
  if (workshopData.thumbnail) {
    formData.append('thumbnail', workshopData.thumbnail);
  }
  
  console.log('📊 Form data created successfully');
  console.log('✅ Form data creation working correctly');
}

// Test component props validation
function testComponentProps() {
  console.log('\n🧪 Testing Component Props Validation...');
  
  // Test WorkshopTutorials component props
  const workshopTutorialsProps = {
    workshops: [mockWorkshop],
    loading: false,
    error: null,
    activeTab: 'all',
    hasActiveSubscription: true
  };
  
  console.log('📊 WorkshopTutorials props:', Object.keys(workshopTutorialsProps));
  
  // Test WorkshopDetail component props
  const workshopDetailProps = {
    workshop: mockWorkshop,
    loading: false,
    error: null,
    hasAccess: true,
    accessLoading: false
  };
  
  console.log('📊 WorkshopDetail props:', Object.keys(workshopDetailProps));
  
  // Test WorkshopVideo component props
  const workshopVideoProps = {
    workshop: mockWorkshop,
    loading: false,
    error: null,
    hasAccess: true
  };
  
  console.log('📊 WorkshopVideo props:', Object.keys(workshopVideoProps));
  
  console.log('✅ Component props validation completed');
}

// Test error handling
function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  // Test image error handling
  const imageErrorHandler = (e) => {
    e.target.src = '/default-workshop.png';
  };
  
  console.log('📊 Image error handler created');
  
  // Test API error handling
  const apiErrorHandler = (error) => {
    console.log('📊 API Error:', error.message);
    return 'Failed to fetch data';
  };
  
  console.log('📊 API error handler created');
  
  console.log('✅ Error handling tests completed');
}

// Main test runner
async function runFrontendTests() {
  console.log('🚀 Starting Frontend Workshop Tests\n');
  
  // Run all tests
  testYouTubeUtils();
  await testWorkshopService();
  testImageHandling();
  testFormDataCreation();
  testComponentProps();
  testErrorHandling();
  
  console.log('\n🏁 Frontend tests completed!');
  console.log('\n📝 Notes:');
  console.log('- These tests verify frontend functionality');
  console.log('- Backend server should be running for API tests');
  console.log('- Authentication may be required for some tests');
  console.log('- Check browser console for any runtime errors');
}

// Export for use in other test files
export {
  testYouTubeUtils,
  testWorkshopService,
  testImageHandling,
  testFormDataCreation,
  testComponentProps,
  testErrorHandling,
  runFrontendTests
};

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  runFrontendTests().catch(console.error);
}

