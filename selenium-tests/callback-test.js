const { expect } = require('chai');
const TestHelpers = require('./utils/test-helpers');

describe('Callback Test', function() {
    let testHelpers;
    let driver;

    before(function(done) {
        console.log('🔍 Initializing TestHelpers...');
        testHelpers = new TestHelpers();
        testHelpers.initialize()
            .then(d => {
                driver = d;
                console.log('✅ TestHelpers initialized');
                done();
            })
            .catch(err => {
                console.error('❌ Initialization failed:', err);
                done(err);
            });
    });

    after(function(done) {
        console.log('🧹 Cleaning up...');
        if (testHelpers) {
            testHelpers.cleanup()
                .then(() => {
                    console.log('✅ Cleanup completed');
                    done();
                })
                .catch(err => {
                    console.error('❌ Cleanup failed:', err);
                    done(err);
                });
        } else {
            done();
        }
    });

    it('should load the homepage', async function() {
        console.log('🌐 Loading homepage...');
        await testHelpers.webDriverManager.navigateTo('/');
        const title = await testHelpers.webDriverManager.getPageTitle();
        console.log(`✅ Title: ${title}`);
        expect(title).to.include('FarmerAI');
    });
});