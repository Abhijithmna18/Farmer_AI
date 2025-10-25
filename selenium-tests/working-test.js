const { expect } = require('chai');
const WebDriverManager = require('./config/webdriver');

describe('Working Test', function() {
    let webDriverManager;

    before(async function() {
        console.log('🔍 Initializing WebDriver...');
        this.timeout(30000);
        
        webDriverManager = new WebDriverManager();
        await webDriverManager.initializeDriver();
        console.log('✅ WebDriver initialized');
    });

    after(async function() {
        if (webDriverManager) {
            await webDriverManager.close();
            console.log('✅ WebDriver closed');
        }
    });

    it('should navigate to Google', async function() {
        console.log('🌐 Navigating to Google...');
        await webDriverManager.driver.get('https://www.google.com');
        
        const title = await webDriverManager.getPageTitle();
        expect(title).to.include('Google');
        console.log('✅ Successfully navigated to Google');
    });

    it('should navigate to GitHub', async function() {
        console.log('🌐 Navigating to GitHub...');
        await webDriverManager.driver.get('https://www.github.com');
        
        const title = await webDriverManager.getPageTitle();
        expect(title).to.include('GitHub');
        console.log('✅ Successfully navigated to GitHub');
    });
});

