const { expect } = require('chai');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Promise Test', function() {
    let driver;

    before(function(done) {
        console.log('🔍 Initializing WebDriver with promises...');
        
        let options = new chrome.Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        
        console.log('🔧 Building WebDriver...');
        new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build()
            .then(d => {
                driver = d;
                console.log('✅ WebDriver initialized');
                done();
            })
            .catch(err => {
                console.error('❌ WebDriver initialization failed:', err);
                done(err);
            });
    });

    after(function(done) {
        console.log('🧹 Closing WebDriver...');
        if (driver) {
            driver.quit()
                .then(() => {
                    console.log('✅ WebDriver closed');
                    done();
                })
                .catch(err => {
                    console.error('❌ Error closing WebDriver:', err);
                    done();
                });
        } else {
            done();
        }
    });

    it('should load a page', function(done) {
        console.log('🌐 Loading example.com...');
        driver.get('https://example.com')
            .then(() => driver.getTitle())
            .then(title => {
                console.log(`✅ Title: ${title}`);
                expect(title).to.include('Example');
                done();
            })
            .catch(err => {
                console.error('❌ Error loading page:', err);
                done(err);
            });
    });
});