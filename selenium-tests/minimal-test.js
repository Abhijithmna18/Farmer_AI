const { expect } = require('chai');
const { Builder } = require('selenium-webdriver');

describe('Minimal Test', function() {
    let driver;

    before(async function() {
        console.log('🔍 Initializing WebDriver...');
        this.timeout(60000);
        
        try {
            console.log('Creating builder...');
            const builder = new Builder();
            console.log('Setting browser...');
            builder.forBrowser('chrome');
            console.log('Building driver...');
            driver = await builder.build();
            console.log('✅ WebDriver initialized');
        } catch (error) {
            console.error('❌ WebDriver initialization failed:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    });

    after(async function() {
        if (driver) {
            console.log('Closing driver...');
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

