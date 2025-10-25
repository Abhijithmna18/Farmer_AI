const axios = require('axios');

async function testApplication() {
    console.log('🔍 Testing Farmer AI application...');
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    try {
        console.log(`1. Testing frontend at ${baseUrl}...`);
        const frontendResponse = await axios.get(baseUrl, { timeout: 5000 });
        console.log(`✅ Frontend is running (Status: ${frontendResponse.status})`);
        
    } catch (error) {
        console.error(`❌ Frontend not accessible at ${baseUrl}`);
        console.error('Error:', error.message);
        console.log('\n💡 Solution: Start the Farmer AI frontend');
        console.log('Run: cd farmerai-frontend && npm run dev');
        return;
    }
    
    try {
        console.log(`2. Testing backend at ${backendUrl}...`);
        const backendResponse = await axios.get(`${backendUrl}/api/health`, { timeout: 5000 });
        console.log(`✅ Backend is running (Status: ${backendResponse.status})`);
        
    } catch (error) {
        console.warn(`⚠️  Backend not accessible at ${backendUrl}`);
        console.warn('This might be normal if the backend doesn\'t have a health endpoint');
    }
    
    console.log('\n✅ Application test completed!');
    console.log('You can now run the Selenium tests.');
}

testApplication();

