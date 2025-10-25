const WebDriverManager = require('./config/webdriver');

async function testWebDriverManager() {
    console.log('🔍 Testing WebDriverManager...');
    
    let webDriverManager = null;
    
    try {
        console.log('1. Creating WebDriverManager...');
        webDriverManager = new WebDriverManager();
        console.log('✅ WebDriverManager created');
        
        console.log('2. Initializing driver...');
        const driver = await webDriverManager.initializeDriver();
        console.log('✅ Driver initialized');
        
        console.log('3. Navigating to Google...');
        await webDriverManager.driver.get('https://www.google.com');
        console.log('✅ Navigation successful');
        
        console.log('4. Getting page title...');
        const title = await webDriverManager.getPageTitle();
        console.log('✅ Title retrieved:', title);
        
        console.log('5. Closing driver...');
        await webDriverManager.close();
        console.log('✅ Driver closed');
        
        console.log('🎉 WebDriverManager test passed!');
        
    } catch (error) {
        console.error('❌ WebDriverManager test failed:');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        if (webDriverManager) {
            try {
                await webDriverManager.close();
            } catch (closeError) {
                console.error('Error closing driver:', closeError.message);
            }
        }
    }
}

testWebDriverManager();
