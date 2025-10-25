const { expect } = require('chai');
const TestHelpers = require('./utils/test-helpers');
const testData = require('./config/test-data');

describe('Simple Farmer AI Test', function() {
    let testHelpers;
    let driver;

    before(async function() {
        testHelpers = new TestHelpers();
        driver = await testHelpers.initialize();
    });

    after(async function() {
        console.log('🧹 Cleaning up...');
        await testHelpers.cleanup();
        console.log('✅ Cleanup completed');
    });

    it('should load the Farmer AI homepage', async function() {
        console.log('🌐 Navigating to Farmer AI homepage...');
        await testHelpers.webDriverManager.navigateTo('/');
        
        const title = await testHelpers.webDriverManager.getPageTitle();
        console.log(`✅ Page loaded. Title: ${title}`);
        
        expect(title).to.include('FarmerAI');
    });

    it('should navigate to the login page', async function() {
        console.log('🔐 Navigating to login page...');
        await testHelpers.webDriverManager.navigateTo('/login');
        
        const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        expect(currentUrl).to.include('/login');
    });
});