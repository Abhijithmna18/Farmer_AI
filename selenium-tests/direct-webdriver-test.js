const { Builder, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Direct WebDriver Test', function() {
    let driver;

    before(async function() {
        console.log('🔍 Initializing WebDriver directly...');
        this.timeout(30000);
        
        let options = new chrome.Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        
        console.log('🔧 Building WebDriver...');
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
            
        console.log('✅ WebDriver initialized');
    });

    after(async function() {
        console.log('🧹 Closing WebDriver...');
        if (driver) {
            await driver.quit();
        }
        console.log('✅ WebDriver closed');
    });

    it('should load a page', async function() {
        console.log('🌐 Loading example.com...');
        await driver.get('https://example.com');
        const title = await driver.getTitle();
        console.log(`✅ Title: ${title}`);
    });
});