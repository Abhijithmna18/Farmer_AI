const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
require('dotenv').config();

class WebDriverManager {
    constructor() {
        this.driver = null;
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        this.browser = process.env.BROWSER || 'chrome';
        this.headless = process.env.HEADLESS === 'true';
        this.windowWidth = parseInt(process.env.WINDOW_WIDTH) || 1920;
        this.windowHeight = parseInt(process.env.WINDOW_HEIGHT) || 1080;
    }

    async initializeDriver() {
        console.log('🔧 WebDriverManager.initializeDriver() called');
        try {
            let options;
            
            if (this.browser === 'chrome') {
                options = new chrome.Options();
                if (this.headless) {
                    options.addArguments('--headless');
                }
                options.addArguments('--no-sandbox');
                options.addArguments('--disable-dev-shm-usage');
                options.addArguments('--disable-gpu');
                options.addArguments('--window-size=' + this.windowWidth + ',' + this.windowHeight);
                options.addArguments('--disable-web-security');
                options.addArguments('--allow-running-insecure-content');
                options.addArguments('--disable-extensions');
                
                console.log('🔧 Building Chrome WebDriver...');
                this.driver = await new Builder()
                    .forBrowser('chrome')
                    .setChromeOptions(options)
                    .build();
                console.log('✅ Chrome WebDriver built successfully');
            } else if (this.browser === 'firefox') {
                options = new firefox.Options();
                if (this.headless) {
                    options.addArguments('--headless');
                }
                options.addArguments('--width=' + this.windowWidth);
                options.addArguments('--height=' + this.windowHeight);
                
                this.driver = await new Builder()
                    .forBrowser('firefox')
                    .setFirefoxOptions(options)
                    .build();
            }

            await this.driver.manage().window().setRect({
                width: this.windowWidth,
                height: this.windowHeight
            });

            await this.driver.manage().setTimeouts({
                implicit: 10000,
                pageLoad: 30000,
                script: 30000
            });

            console.log(`WebDriver initialized with ${this.browser} browser`);
            console.log('✅ WebDriverManager.initializeDriver() completed');
            return this.driver;
        } catch (error) {
            console.error('Failed to initialize WebDriver:', error);
            throw error;
        }
    }

    async navigateTo(path = '') {
        const url = this.baseUrl + path;
        await this.driver.get(url);
        try {
            await this.driver.wait(until.titleContains('Farmer AI'), 5000);
        } catch (error) {
            await this.driver.wait(until.titleContains('FarmerAI'), 5000);
        }
    }

    async waitForElement(selector, timeout = 10000) {
        return await this.driver.wait(until.elementLocated(By.css(selector)), timeout);
    }

    async waitForElementVisible(selector, timeout = 10000) {
        const element = await this.waitForElement(selector, timeout);
        return await this.driver.wait(until.elementIsVisible(element), timeout);
    }

    async waitForElementClickable(selector, timeout = 10000) {
        const element = await this.waitForElement(selector, timeout);
        return await this.driver.wait(until.elementIsEnabled(element), timeout);
    }

    async clickElement(selector, timeout = 10000) {
        const element = await this.waitForElementClickable(selector, timeout);
        await element.click();
    }

    async typeText(selector, text, timeout = 10000) {
        const element = await this.waitForElement(selector, timeout);
        await element.clear();
        await element.sendKeys(text);
    }

    async getText(selector, timeout = 10000) {
        const element = await this.waitForElement(selector, timeout);
        return await element.getText();
    }

    async isElementPresent(selector, timeout = 5000) {
        try {
            await this.waitForElement(selector, timeout);
            return true;
        } catch (error) {
            return false;
        }
    }

    async isElementVisible(selector, timeout = 5000) {
        try {
            await this.waitForElementVisible(selector, timeout);
            return true;
        } catch (error) {
            return false;
        }
    }

    async scrollToElement(selector) {
        const element = await this.waitForElement(selector);
        await this.driver.executeScript("arguments[0].scrollIntoView(true);", element);
    }

    async takeScreenshot(filename) {
        const screenshot = await this.driver.takeScreenshot();
        const fs = require('fs');
        const path = require('path');
        const screenshotPath = path.join(__dirname, '../screenshots', filename);
        fs.writeFileSync(screenshotPath, screenshot, 'base64');
        console.log(`Screenshot saved: ${screenshotPath}`);
    }

    async waitForPageLoad() {
        try {
            await this.driver.wait(until.titleContains('Farmer AI'), 5000);
        } catch (error) {
            await this.driver.wait(until.titleContains('FarmerAI'), 5000);
        }
    }

    async close() {
        if (this.driver) {
            await this.driver.quit();
            this.driver = null;
        }
    }

    async refresh() {
        await this.driver.navigate().refresh();
        await this.waitForPageLoad();
    }

    async goBack() {
        await this.driver.navigate().back();
        await this.waitForPageLoad();
    }

    async goForward() {
        await this.driver.navigate().forward();
        await this.waitForPageLoad();
    }

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }

    async getPageTitle() {
        return await this.driver.getTitle();
    }

    async executeScript(script, ...args) {
        return await this.driver.executeScript(script, ...args);
    }

    async switchToNewWindow() {
        const handles = await this.driver.getAllWindowHandles();
        await this.driver.switchTo().window(handles[handles.length - 1]);
    }

    async switchToOriginalWindow() {
        const handles = await this.driver.getAllWindowHandles();
        await this.driver.switchTo().window(handles[0]);
    }
}

module.exports = WebDriverManager;

