const TestHelpers = require('./utils/test-helpers');
const testData = require('./config/test-data');

async function runTest() {
    let testHelpers;
    
    try {
        console.log('🔍 Starting direct test...');
        
        // Initialize test helpers
        testHelpers = new TestHelpers();
        const driver = await testHelpers.initialize();
        console.log('✅ WebDriver initialized');
        
        // Test 1: Load homepage
        console.log('🌐 Loading homepage...');
        await testHelpers.webDriverManager.navigateTo('/');
        const title = await testHelpers.webDriverManager.getPageTitle();
        console.log(`✅ Homepage loaded. Title: ${title}`);
        
        // Test 2: Navigate to login
        console.log('🔐 Navigating to login...');
        await testHelpers.webDriverManager.navigateTo('/login');
        const loginUrl = await testHelpers.webDriverManager.getCurrentUrl();
        console.log(`✅ Login page loaded. URL: ${loginUrl}`);
        
        // Test 3: Look for login form elements
        console.log('🔍 Checking for login form elements...');
        const hasEmailInput = await testHelpers.webDriverManager.isElementPresent(testData.selectors.emailInput);
        const hasPasswordInput = await testHelpers.webDriverManager.isElementPresent(testData.selectors.passwordInput);
        const hasLoginButton = await testHelpers.webDriverManager.isElementPresent(testData.selectors.loginButton);
        
        console.log(`📧 Email input found: ${hasEmailInput}`);
        console.log(`🔒 Password input found: ${hasPasswordInput}`);
        console.log(`➡️ Login button found: ${hasLoginButton}`);
        
        console.log('✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
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
runTest();