const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testWebDriver() {
    console.log('🔍 Testing WebDriver initialization...');
    
    try {
        console.log('1. Creating WebDriver instance...');
        const driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new chrome.Options().addArguments('--headless'))
            .build();
        
        console.log('✅ WebDriver created successfully');
        
        console.log('2. Navigating to Google...');
        await driver.get('https://www.google.com');
        
        console.log('3. Getting page title...');
        const title = await driver.getTitle();
        console.log(`✅ Page title: ${title}`);
        
        console.log('4. Closing WebDriver...');
        await driver.quit();
        
        console.log('✅ WebDriver test completed successfully!');
        
    } catch (error) {
        console.error('❌ WebDriver test failed:');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        if (error.message.includes('chromedriver')) {
            console.log('\n💡 Solution: Install ChromeDriver');
            console.log('Run: npm install chromedriver');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Solution: Chrome browser not found');
            console.log('Make sure Google Chrome is installed');
        } else {
            console.log('\n💡 Check the error message above for specific issues');
        }
    }
}

testWebDriver();

