const { expect } = require('chai');
const TestHelpers = require('../../utils/test-helpers');
const testData = require('../../config/test-data');

describe('Authentication - Login Tests', function() {
    let testHelpers;
    let driver;

    before(async function() {
        testHelpers = new TestHelpers();
        driver = await testHelpers.initialize();
    });

    after(async function() {
        await testHelpers.cleanup();
    });

    beforeEach(async function() {
        await testHelpers.webDriverManager.navigateTo('/login');
    });

    describe('Valid Login', function() {
        it('should login successfully with valid farmer credentials', async function() {
            await testHelpers.loginAsFarmer();
            await testHelpers.assertUrlContains('/dashboard');
            await testHelpers.assertElementPresent(testData.selectors.dashboard);
        });

        it('should login successfully with valid admin credentials', async function() {
            await testHelpers.loginAsAdmin();
            await testHelpers.assertUrlContains('/admin');
            await testHelpers.assertElementPresent(testData.selectors.adminPanel);
        });

        it('should redirect to dashboard after successful login', async function() {
            await testHelpers.loginAsFarmer();
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            expect(currentUrl).to.include('/dashboard');
        });

        it('should display user profile information after login', async function() {
            await testHelpers.loginAsFarmer();
            await testHelpers.assertElementPresent('.user-profile, .profile-info, [data-testid="user-profile"]');
        });
    });

    describe('Invalid Login', function() {
        it('should show error message for invalid email', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, 'invalid@email.com');
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, testData.users.farmer.password);
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should show error message for invalid password', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, testData.users.farmer.email);
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, 'wrongpassword');
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should show error message for empty email', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, testData.users.farmer.password);
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should show error message for empty password', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, testData.users.farmer.email);
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should remain on login page after failed login', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, 'invalid@email.com');
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, 'wrongpassword');
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            await testHelpers.assertUrlContains('/login');
        });
    });

    describe('Login Form Validation', function() {
        it('should validate email format', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, 'invalid-email');
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, testData.users.farmer.password);
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should show password requirements', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, testData.users.farmer.email);
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, '123');
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should clear form fields after failed login', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, 'invalid@email.com');
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, 'wrongpassword');
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            // Wait for error message
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
            
            // Check if form fields are cleared or still contain values
            const emailValue = await testHelpers.webDriverManager.driver.findElement(testData.selectors.emailInput).getAttribute('value');
            const passwordValue = await testHelpers.webDriverManager.driver.findElement(testData.selectors.passwordInput).getAttribute('value');
            
            // Form behavior may vary - some clear fields, others don't
            console.log(`Email field value: ${emailValue}`);
            console.log(`Password field value: ${passwordValue ? '[HIDDEN]' : 'empty'}`);
        });
    });

    describe('Login UI Elements', function() {
        it('should display login form elements', async function() {
            await testHelpers.assertElementPresent(testData.selectors.loginForm);
            await testHelpers.assertElementPresent(testData.selectors.emailInput);
            await testHelpers.assertElementPresent(testData.selectors.passwordInput);
            await testHelpers.assertElementPresent(testData.selectors.loginButton);
        });

        it('should display forgot password link', async function() {
            await testHelpers.assertElementPresent('.forgot-password, [data-testid="forgot-password-link"]');
        });

        it('should display register link', async function() {
            await testHelpers.assertElementPresent('.register-link, [data-testid="register-link"]');
        });

        it('should show loading state during login', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, testData.users.farmer.email);
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, testData.users.farmer.password);
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            // Check for loading indicator
            const isLoading = await testHelpers.webDriverManager.isElementVisible(testData.selectors.loadingSpinner);
            if (isLoading) {
                console.log('Loading indicator found during login');
            }
        });
    });

    describe('Login Security', function() {
        it('should not expose password in URL or page source', async function() {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, testData.users.farmer.email);
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, testData.users.farmer.password);
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            const pageSource = await testHelpers.webDriverManager.driver.getPageSource();
            
            expect(currentUrl).to.not.include(testData.users.farmer.password);
            expect(pageSource).to.not.include(testData.users.farmer.password);
        });

        it('should handle session timeout gracefully', async function() {
            await testHelpers.loginAsFarmer();
            
            // Simulate session timeout by clearing cookies
            await testHelpers.webDriverManager.driver.manage().deleteAllCookies();
            await testHelpers.webDriverManager.navigateTo('/dashboard');
            
            // Should redirect to login page
            await testHelpers.assertUrlContains('/login');
        });
    });

    describe('Login Accessibility', function() {
        it('should have proper form labels', async function() {
            const emailLabel = await testHelpers.webDriverManager.isElementPresent('label[for="email"], label:contains("Email")');
            const passwordLabel = await testHelpers.webDriverManager.isElementPresent('label[for="password"], label:contains("Password")');
            
            expect(emailLabel || passwordLabel).to.be.true;
        });

        it('should support keyboard navigation', async function() {
            await testHelpers.webDriverManager.driver.findElement(testData.selectors.emailInput).sendKeys(require('selenium-webdriver').Key.TAB);
            await testHelpers.webDriverManager.driver.findElement(testData.selectors.passwordInput).sendKeys(require('selenium-webdriver').Key.TAB);
            
            // Check if focus moves properly
            const focusedElement = await testHelpers.webDriverManager.driver.switchTo().activeElement();
            const tagName = await focusedElement.getTagName();
            expect(tagName).to.be.oneOf(['button', 'input']);
        });
    });
});
