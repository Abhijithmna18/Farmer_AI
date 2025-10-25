const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testWebDriver() {
    let driver;
    try {
        console.log('🔍 Initializing Chrome WebDriver...');
        
        // Set up Chrome options
        let options = new chrome.Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        
        // Try to build the driver
        console.log('🔧 Building WebDriver...');
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
            
        console.log('✅ WebDriver initialized successfully');
        
        // Try to navigate to a simple page
        console.log('🌐 Navigating to example.com...');
        await driver.get('https://example.com');
        
        // Wait for the page to load
        await driver.wait(until.titleContains('Example'), 10000);
        
        const title = await driver.getTitle();
        console.log(`✅ Page loaded successfully. Title: ${title}`);
        
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (driver) {
            console.log('🧹 Closing WebDriver...');
            await driver.quit();
            console.log('✅ WebDriver closed');
        }
    }
}

// Run the test
testWebDriver();