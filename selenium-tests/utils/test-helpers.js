const WebDriverManager = require('../config/webdriver');
const testData = require('../config/test-data');

class TestHelpers {
    constructor() {
        this.driver = null;
        this.webDriverManager = new WebDriverManager();
    }

    async initialize() {
        console.log('🔧 TestHelpers.initialize() called');
        this.driver = await this.webDriverManager.initializeDriver();
        console.log('✅ TestHelpers.initialize() completed');
        return this.driver;
    }

    async cleanup() {
        if (this.driver) {
            await this.webDriverManager.close();
        }
    }

    // Authentication helpers
    async loginAsFarmer() {
        await this.webDriverManager.navigateTo('/login');
        await this.webDriverManager.typeText(testData.selectors.emailInput, testData.users.farmer.email);
        await this.webDriverManager.typeText(testData.selectors.passwordInput, testData.users.farmer.password);
        await this.webDriverManager.clickElement(testData.selectors.loginButton);
        await this.webDriverManager.waitForPageLoad();
    }

    async loginAsAdmin() {
        await this.webDriverManager.navigateTo('/login');
        await this.webDriverManager.typeText(testData.selectors.emailInput, testData.users.admin.email);
        await this.webDriverManager.typeText(testData.selectors.passwordInput, testData.users.admin.password);
        await this.webDriverManager.clickElement(testData.selectors.loginButton);
        await this.webDriverManager.waitForPageLoad();
    }

    async registerUser(userData = testData.users.farmer) {
        await this.webDriverManager.navigateTo('/register');
        await this.webDriverManager.typeText('input[name="name"]', userData.name);
        await this.webDriverManager.typeText('input[name="email"]', userData.email);
        await this.webDriverManager.typeText('input[name="password"]', userData.password);
        await this.webDriverManager.typeText('input[name="confirmPassword"]', userData.password);
        await this.webDriverManager.typeText('input[name="phone"]', userData.phone);
        await this.webDriverManager.clickElement(testData.selectors.registerButton);
        await this.webDriverManager.waitForPageLoad();
    }

    async logout() {
        try {
            await this.webDriverManager.clickElement('.logout-btn, [data-testid="logout-button"]');
            await this.webDriverManager.waitForPageLoad();
        } catch (error) {
            console.log('Logout button not found or already logged out');
        }
    }

    // Navigation helpers
    async navigateToDashboard() {
        await this.webDriverManager.navigateTo('/dashboard');
        await this.webDriverManager.waitForElement(testData.selectors.dashboard);
    }

    async navigateToWarehouse() {
        await this.webDriverManager.navigateTo('/warehouses');
        await this.webDriverManager.waitForElement(testData.selectors.warehouseCard);
    }

    async navigateToFarmMonitoring() {
        await this.webDriverManager.navigateTo('/farm-monitoring');
        await this.webDriverManager.waitForElement(testData.selectors.sensorCard);
    }

    async navigateToAdmin() {
        await this.webDriverManager.navigateTo('/admin');
        await this.webDriverManager.waitForElement(testData.selectors.adminPanel);
    }

    // Form helpers
    async fillForm(formData) {
        for (const [field, value] of Object.entries(formData)) {
            const selector = `input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`;
            try {
                await this.webDriverManager.typeText(selector, value);
            } catch (error) {
                console.log(`Field ${field} not found or not fillable`);
            }
        }
    }

    async submitForm() {
        await this.webDriverManager.clickElement(testData.selectors.submitButton);
        await this.webDriverManager.waitForPageLoad();
    }

    // Wait helpers
    async waitForSuccessMessage() {
        return await this.webDriverManager.waitForElement(testData.selectors.successMessage);
    }

    async waitForErrorMessage() {
        return await this.webDriverManager.waitForElement(testData.selectors.errorMessage);
    }

    async waitForLoadingToComplete() {
        try {
            await this.webDriverManager.waitForElement(testData.selectors.loadingSpinner, 2000);
            await this.webDriverManager.driver.wait(async () => {
                const loading = await this.webDriverManager.isElementVisible(testData.selectors.loadingSpinner);
                return !loading;
            }, testData.timeouts.long);
        } catch (error) {
            // Loading spinner not found, assuming loading is complete
        }
    }

    // Assertion helpers
    async assertElementPresent(selector, timeout = testData.timeouts.medium) {
        const isPresent = await this.webDriverManager.isElementPresent(selector, timeout);
        if (!isPresent) {
            throw new Error(`Element ${selector} not found`);
        }
        return true;
    }

    async assertElementVisible(selector, timeout = testData.timeouts.medium) {
        const isVisible = await this.webDriverManager.isElementVisible(selector, timeout);
        if (!isVisible) {
            throw new Error(`Element ${selector} not visible`);
        }
        return true;
    }

    async assertTextContains(selector, expectedText, timeout = testData.timeouts.medium) {
        const actualText = await this.webDriverManager.getText(selector, timeout);
        if (!actualText.includes(expectedText)) {
            throw new Error(`Expected text "${expectedText}" not found in "${actualText}"`);
        }
        return true;
    }

    async assertUrlContains(expectedPath) {
        const currentUrl = await this.webDriverManager.getCurrentUrl();
        if (!currentUrl.includes(expectedPath)) {
            throw new Error(`Expected URL to contain "${expectedPath}", but got "${currentUrl}"`);
        }
        return true;
    }

    // Screenshot helpers
    async takeScreenshot(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${name}-${timestamp}.png`;
        await this.webDriverManager.takeScreenshot(filename);
        return filename;
    }

    // Data helpers
    async generateTestEmail() {
        const timestamp = Date.now();
        return `test-${timestamp}@farmerai.com`;
    }

    async generateTestPhone() {
        const timestamp = Date.now().toString().slice(-10);
        return `+1${timestamp}`;
    }

    // API helpers (for setup/teardown)
    async createTestUser(userData) {
        const axios = require('axios');
        try {
            const response = await axios.post(`${testData.urls.backend}/api/auth/register`, userData);
            return response.data;
        } catch (error) {
            console.log('User might already exist or API not available');
            return null;
        }
    }

    async deleteTestUser(email) {
        const axios = require('axios');
        try {
            await axios.delete(`${testData.urls.backend}/api/auth/users/${email}`);
        } catch (error) {
            console.log('User deletion failed or API not available');
        }
    }

    // Warehouse helpers
    async createTestWarehouse(warehouseData = testData.warehouse) {
        await this.webDriverManager.navigateTo('/warehouses');
        await this.webDriverManager.clickElement('.add-warehouse-btn, [data-testid="add-warehouse-button"]');
        await this.fillForm(warehouseData);
        await this.submitForm();
        await this.waitForSuccessMessage();
    }

    async searchWarehouse(searchTerm) {
        await this.webDriverManager.navigateTo('/warehouses');
        await this.webDriverManager.typeText(testData.selectors.warehouseSearch, searchTerm);
        await this.webDriverManager.clickElement('.search-btn, [data-testid="search-button"]');
        await this.webDriverManager.waitForElement(testData.selectors.warehouseCard);
    }

    // Booking helpers
    async bookWarehouse(warehouseId, bookingData = testData.booking) {
        await this.webDriverManager.navigateTo(`/warehouses/${warehouseId}/book`);
        await this.fillForm(bookingData);
        await this.submitForm();
        await this.waitForSuccessMessage();
    }

    // Payment helpers
    async processPayment(amount = testData.payment.amount) {
        await this.webDriverManager.clickElement(testData.selectors.razorpayButton);
        await this.webDriverManager.switchToNewWindow();
        // Simulate payment completion (in real tests, you'd use test payment credentials)
        await this.webDriverManager.switchToOriginalWindow();
        await this.waitForSuccessMessage();
    }

    // Farm monitoring helpers
    async addSensorData(sensorData = testData.farmData.sensorData) {
        await this.webDriverManager.navigateTo('/farm-monitoring');
        await this.webDriverManager.clickElement('.add-sensor-data-btn, [data-testid="add-sensor-data-button"]');
        await this.fillForm(sensorData);
        await this.submitForm();
        await this.waitForSuccessMessage();
    }

    // Community helpers
    async createCommunityPost(postData = testData.community.post) {
        await this.webDriverManager.navigateTo('/community');
        await this.webDriverManager.clickElement('.create-post-btn, [data-testid="create-post-button"]');
        await this.fillForm(postData);
        await this.submitForm();
        await this.waitForSuccessMessage();
    }

    // Admin helpers
    async approveWarehouse(warehouseId) {
        await this.webDriverManager.navigateTo('/admin/warehouses');
        await this.webDriverManager.clickElement(`[data-warehouse-id="${warehouseId}"] .approve-btn`);
        await this.waitForSuccessMessage();
    }

    async manageUser(userEmail, action) {
        await this.webDriverManager.navigateTo('/admin/users');
        await this.webDriverManager.clickElement(`[data-user-email="${userEmail}"] .${action}-btn`);
        await this.waitForSuccessMessage();
    }
}

module.exports = TestHelpers;

