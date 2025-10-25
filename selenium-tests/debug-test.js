const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function debugWebDriver() {
    console.log('🔍 Debugging WebDriver...');
    console.log('Node version:', process.version);
    console.log('Platform:', process.platform);
    
    try {
        console.log('1. Creating WebDriver builder...');
        const builder = new Builder();
        console.log('✅ Builder created');
        
        console.log('2. Setting browser to chrome...');
        builder.forBrowser('chrome');
        console.log('✅ Browser set to chrome');
        
        console.log('3. Setting Chrome options...');
        const options = new chrome.Options();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        console.log('✅ Chrome options set');
        
        console.log('4. Building WebDriver...');
        const driver = await builder.setChromeOptions(options).build();
        console.log('✅ WebDriver built successfully');
        
        console.log('5. Testing navigation...');
        await driver.get('https://www.google.com');
        console.log('✅ Navigation successful');
        
        console.log('6. Getting title...');
        const title = await driver.getTitle();
        console.log('✅ Title retrieved:', title);
        
        console.log('7. Closing driver...');
        await driver.quit();
        console.log('✅ Driver closed successfully');
        
        console.log('🎉 All tests passed!');
        
    } catch (error) {
        console.error('❌ Error occurred:');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        
        if (error.message.includes('chromedriver')) {
            console.log('\n💡 ChromeDriver issue detected');
            console.log('Try: npm install chromedriver');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Connection issue detected');
            console.log('Check if Chrome is installed');
        } else {
            console.log('\n💡 Unknown error - check the stack trace above');
        }
    }
}

debugWebDriver();

