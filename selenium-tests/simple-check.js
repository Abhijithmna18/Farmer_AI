const TestHelpers = require('./utils/test-helpers');

async function simpleCheck() {
    let testHelpers = null;
    
    try {
        console.log('🔍 Initializing TestHelpers...');
        testHelpers = new TestHelpers();
        const driver = await testHelpers.initialize();
        console.log('✅ TestHelpers initialized');
        
        // Just check if we can get a page title
        console.log('🌐 Loading example.com...');
        await driver.get('https://example.com');
        const title = await driver.getTitle();
        console.log(`✅ Title: ${title}`);
        
        console.log('🎉 Simple check passed!');
        
    } catch (error) {
        console.error('❌ Simple check failed:', error.message);
    } finally {
        if (testHelpers) {
            console.log('🧹 Cleaning up...');
            await testHelpers.cleanup();
            console.log('✅ Cleanup completed');
        }
    }
}

// Run the test
simpleCheck();