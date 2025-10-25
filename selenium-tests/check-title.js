const TestHelpers = require('./utils/test-helpers');

async function checkTitle() {
    let testHelpers;
    
    try {
        console.log('🔍 Checking page title...');
        
        // Initialize test helpers
        testHelpers = new TestHelpers();
        const driver = await testHelpers.initialize();
        console.log('✅ WebDriver initialized');
        
        // Load homepage
        console.log('🌐 Loading homepage...');
        await testHelpers.webDriverManager.driver.get('http://localhost:5174/');
        
        // Get the actual title
        const title = await testHelpers.webDriverManager.getPageTitle();
        console.log(`📋 Actual page title: "${title}"`);
        
        // Get current URL
        const url = await testHelpers.webDriverManager.getCurrentUrl();
        console.log(`📍 Current URL: ${url}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (testHelpers) {
            console.log('🧹 Cleaning up...');
            await testHelpers.cleanup();
            console.log('✅ Cleanup completed');
        }
    }
}

// Run the test
checkTitle();