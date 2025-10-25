const { expect } = require('chai');
const TestHelpers = require('./utils/test-helpers');
const testData = require('./config/test-data');

describe('Structured Test', function() {
    let testHelpers;
    let driver;

    before(async function() {
        console.log('🔍 Initializing TestHelpers...');
        testHelpers = new TestHelpers();
        driver = await testHelpers.initialize();
        console.log('✅ TestHelpers initialized');
    });

    after(async function() {
        console.log('🧹 Cleaning up...');
        await testHelpers.cleanup();
        console.log('✅ Cleanup completed');
    });

    it('should load the homepage', async function() {
        console.log('🌐 Loading homepage...');
        await testHelpers.webDriverManager.navigateTo('/');
        const title = await testHelpers.webDriverManager.getPageTitle();
        console.log(`✅ Title: ${title}`);
        expect(title).to.include('FarmerAI');
    });
});