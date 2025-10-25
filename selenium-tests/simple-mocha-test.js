const { expect } = require('chai');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Simple Mocha Test', function() {
    let driver;

    before(async function() {
        console.log('🔍 Initializing WebDriver...');
        this.timeout(30000);
        
        try {
            driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(new chrome.Options().addArguments('--headless'))
                .build();
            console.log('✅ WebDriver initialized');
        } catch (error) {
            console.error('❌ WebDriver initialization failed:', error.message);
            throw error;
        }
    });

    after(async function() {
        if (driver) {
            await driver.quit();
            console.log('✅ WebDriver closed');
        }
    });

    it('should navigate to Google', async function() {
        console.log('🌐 Navigating to Google...');
        await driver.get('https://www.google.com');
        
        const title = await driver.getTitle();
        expect(title).to.include('Google');
        console.log('✅ Successfully navigated to Google');
    });
});

