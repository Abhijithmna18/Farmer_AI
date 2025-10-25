const TestHelpers = require('./utils/test-helpers');

async function testHelpers() {
    let testHelpers;
    let driver;
    
    try {
        console.log('🔍 Initializing TestHelpers...');
        testHelpers = new TestHelpers();
        
        console.log('🔧 Initializing WebDriver through TestHelpers...');
        driver = await testHelpers.initialize();
        console.log('✅ WebDriver initialized through TestHelpers');
        
        console.log('🌐 Navigating to example.com...');
        await testHelpers.webDriverManager.driver.get('https://example.com');
        
        const title = await testHelpers.webDriverManager.getPageTitle();
        console.log(`✅ Page loaded successfully. Title: ${title}`);
        
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
testHelpers();