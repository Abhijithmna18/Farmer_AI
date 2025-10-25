const TestHelpers = require('./utils/test-helpers');
const testData = require('./config/test-data');

async function testFarmerAI() {
    let testHelpers;
    let driver;
    
    try {
        console.log('🔍 Initializing TestHelpers...');
        testHelpers = new TestHelpers();
        
        console.log('🔧 Initializing WebDriver through TestHelpers...');
        driver = await testHelpers.initialize();
        console.log('✅ WebDriver initialized through TestHelpers');
        
        console.log(`🌐 Navigating to Farmer AI app at ${testData.urls.base}...`);
        await testHelpers.webDriverManager.driver.get(testData.urls.base);
        
        const title = await testHelpers.webDriverManager.getPageTitle();
        console.log(`✅ Page loaded successfully. Title: ${title}`);
        
        // Check if we're on the login page
        const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        // Try to find login elements
        const hasLoginForm = await testHelpers.webDriverManager.isElementPresent(testData.selectors.loginForm);
        console.log(`🔐 Login form found: ${hasLoginForm}`);
        
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (testHelpers) {
            console.log('🧹 Cleaning up...');
            await testHelpers.cleanup();
            console.log('✅ Cleanup completed');
        }
    }
}

// Run the test
testFarmerAI();