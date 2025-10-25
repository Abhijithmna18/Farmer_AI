const TestHelpers = require('./utils/test-helpers');
const testData = require('./config/test-data');

async function runFullTest() {
    let testHelpers = null;
    let success = false;
    
    try {
        console.log('🚀 Starting full workflow test...');
        
        // Initialize
        console.log('🔍 Initializing TestHelpers...');
        testHelpers = new TestHelpers();
        const driver = await testHelpers.initialize();
        console.log('✅ TestHelpers initialized');
        
        // Test 1: Load homepage
        console.log('🌐 Loading homepage...');
        await testHelpers.webDriverManager.navigateTo('/');
        const title = await testHelpers.webDriverManager.getPageTitle();
        console.log(`✅ Homepage loaded. Title: "${title}"`);
        
        // Test 2: Navigate to login
        console.log('🔐 Navigating to login page...');
        await testHelpers.webDriverManager.navigateTo('/login');
        const loginUrl = await testHelpers.webDriverManager.getCurrentUrl();
        console.log(`✅ Login page loaded. URL: ${loginUrl}`);
        
        // Test 3: Check for login form elements
        console.log('🔍 Checking for login form elements...');
        const hasEmailInput = await testHelpers.webDriverManager.isElementPresent(testData.selectors.emailInput);
        const hasPasswordInput = await testHelpers.webDriverManager.isElementPresent(testData.selectors.passwordInput);
        const hasLoginButton = await testHelpers.webDriverManager.isElementPresent(testData.selectors.loginButton);
        
        console.log(`📧 Email input found: ${hasEmailInput}`);
        console.log(`🔒 Password input found: ${hasPasswordInput}`);
        console.log(`➡️ Login button found: ${hasLoginButton}`);
        
        if (hasEmailInput && hasPasswordInput && hasLoginButton) {
            console.log('✅ All login form elements found!');
            success = true;
        } else {
            console.log('❌ Some login form elements are missing');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        // Cleanup
        if (testHelpers) {
            console.log('🧹 Cleaning up...');
            await testHelpers.cleanup();
            console.log('✅ Cleanup completed');
        }
        
        // Exit with appropriate code
        if (success) {
            console.log('🎉 All tests passed!');
            process.exit(0);
        } else {
            console.log('💥 Some tests failed!');
            process.exit(1);
        }
    }
}

// Run the test
runFullTest();