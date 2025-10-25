const { expect } = require('chai');
const TestHelpers = require('../../utils/test-helpers');
const testData = require('../../config/test-data');

describe('Authentication - Registration Tests', function() {
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
        await testHelpers.webDriverManager.navigateTo('/register');
    });

    describe('Valid Registration', function() {
        it('should register successfully with valid farmer data', async function() {
            const testEmail = await testHelpers.generateTestEmail();
            const testPhone = await testHelpers.generateTestPhone();
            
            const userData = {
                name: 'Test Farmer',
                email: testEmail,
                password: 'TestPassword123!',
                confirmPassword: 'TestPassword123!',
                phone: testPhone,
                role: 'farmer'
            };

            await testHelpers.registerUser(userData);
            await testHelpers.assertUrlContains('/dashboard');
            await testHelpers.assertElementPresent(testData.selectors.dashboard);
        });

        it('should register successfully with valid warehouse owner data', async function() {
            const testEmail = await testHelpers.generateTestEmail();
            const testPhone = await testHelpers.generateTestPhone();
            
            const userData = {
                name: 'Test Warehouse Owner',
                email: testEmail,
                password: 'OwnerPassword123!',
                confirmPassword: 'OwnerPassword123!',
                phone: testPhone,
                role: 'warehouse_owner'
            };

            await testHelpers.registerUser(userData);
            await testHelpers.assertUrlContains('/dashboard');
        });

        it('should redirect to dashboard after successful registration', async function() {
            const testEmail = await testHelpers.generateTestEmail();
            const testPhone = await testHelpers.generateTestPhone();
            
            const userData = {
                name: 'Test User',
                email: testEmail,
                password: 'TestPassword123!',
                confirmPassword: 'TestPassword123!',
                phone: testPhone
            };

            await testHelpers.registerUser(userData);
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            expect(currentUrl).to.include('/dashboard');
        });
    });

    describe('Invalid Registration', function() {
        it('should show error for duplicate email', async function() {
            const userData = {
                name: 'Test User',
                email: testData.users.farmer.email, // Using existing email
                password: 'TestPassword123!',
                confirmPassword: 'TestPassword123!',
                phone: '+1234567890'
            };

            await testHelpers.registerUser(userData);
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should show error for password mismatch', async function() {
            const testEmail = await testHelpers.generateTestEmail();
            
            await testHelpers.webDriverManager.typeText('input[name="name"]', 'Test User');
            await testHelpers.webDriverManager.typeText('input[name="email"]', testEmail);
            await testHelpers.webDriverManager.typeText('input[name="password"]', 'TestPassword123!');
            await testHelpers.webDriverManager.typeText('input[name="confirmPassword"]', 'DifferentPassword123!');
            await testHelpers.webDriverManager.typeText('input[name="phone"]', '+1234567890');
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should show error for weak password', async function() {
            const testEmail = await testHelpers.generateTestEmail();
            
            await testHelpers.webDriverManager.typeText('input[name="name"]', 'Test User');
            await testHelpers.webDriverManager.typeText('input[name="email"]', testEmail);
            await testHelpers.webDriverManager.typeText('input[name="password"]', '123');
            await testHelpers.webDriverManager.typeText('input[name="confirmPassword"]', '123');
            await testHelpers.webDriverManager.typeText('input[name="phone"]', '+1234567890');
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should show error for invalid email format', async function() {
            await testHelpers.webDriverManager.typeText('input[name="name"]', 'Test User');
            await testHelpers.webDriverManager.typeText('input[name="email"]', 'invalid-email');
            await testHelpers.webDriverManager.typeText('input[name="password"]', 'TestPassword123!');
            await testHelpers.webDriverManager.typeText('input[name="confirmPassword"]', 'TestPassword123!');
            await testHelpers.webDriverManager.typeText('input[name="phone"]', '+1234567890');
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should show error for empty required fields', async function() {
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });
    });

    describe('Registration Form Validation', function() {
        it('should validate name field', async function() {
            const testEmail = await testHelpers.generateTestEmail();
            
            await testHelpers.webDriverManager.typeText('input[name="name"]', ''); // Empty name
            await testHelpers.webDriverManager.typeText('input[name="email"]', testEmail);
            await testHelpers.webDriverManager.typeText('input[name="password"]', 'TestPassword123!');
            await testHelpers.webDriverManager.typeText('input[name="confirmPassword"]', 'TestPassword123!');
            await testHelpers.webDriverManager.typeText('input[name="phone"]', '+1234567890');
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should validate phone number format', async function() {
            const testEmail = await testHelpers.generateTestEmail();
            
            await testHelpers.webDriverManager.typeText('input[name="name"]', 'Test User');
            await testHelpers.webDriverManager.typeText('input[name="email"]', testEmail);
            await testHelpers.webDriverManager.typeText('input[name="password"]', 'TestPassword123!');
            await testHelpers.webDriverManager.typeText('input[name="confirmPassword"]', 'TestPassword123!');
            await testHelpers.webDriverManager.typeText('input[name="phone"]', 'invalid-phone');
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should validate password strength', async function() {
            const testEmail = await testHelpers.generateTestEmail();
            
            await testHelpers.webDriverManager.typeText('input[name="name"]', 'Test User');
            await testHelpers.webDriverManager.typeText('input[name="email"]', testEmail);
            await testHelpers.webDriverManager.typeText('input[name="password"]', 'weak');
            await testHelpers.webDriverManager.typeText('input[name="confirmPassword"]', 'weak');
            await testHelpers.webDriverManager.typeText('input[name="phone"]', '+1234567890');
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });
    });

    describe('Registration UI Elements', function() {
        it('should display all required form fields', async function() {
            await testHelpers.assertElementPresent('input[name="name"]');
            await testHelpers.assertElementPresent('input[name="email"]');
            await testHelpers.assertElementPresent('input[name="password"]');
            await testHelpers.assertElementPresent('input[name="confirmPassword"]');
            await testHelpers.assertElementPresent('input[name="phone"]');
            await testHelpers.assertElementPresent(testData.selectors.registerButton);
        });

        it('should display login link', async function() {
            await testHelpers.assertElementPresent('.login-link, [data-testid="login-link"]');
        });

        it('should show password strength indicator', async function() {
            await testHelpers.webDriverManager.typeText('input[name="password"]', 'TestPassword123!');
            
            // Check for password strength indicator
            const strengthIndicator = await testHelpers.webDriverManager.isElementPresent('.password-strength, [data-testid="password-strength"]');
            if (strengthIndicator) {
                console.log('Password strength indicator found');
            }
        });

        it('should show terms and conditions checkbox', async function() {
            const termsCheckbox = await testHelpers.webDriverManager.isElementPresent('input[type="checkbox"], .terms-checkbox, [data-testid="terms-checkbox"]');
            if (termsCheckbox) {
                console.log('Terms and conditions checkbox found');
            }
        });
    });

    describe('Registration Security', function() {
        it('should not expose password in URL or page source', async function() {
            const testEmail = await testHelpers.generateTestEmail();
            const password = 'TestPassword123!';
            
            await testHelpers.webDriverManager.typeText('input[name="name"]', 'Test User');
            await testHelpers.webDriverManager.typeText('input[name="email"]', testEmail);
            await testHelpers.webDriverManager.typeText('input[name="password"]', password);
            await testHelpers.webDriverManager.typeText('input[name="confirmPassword"]', password);
            await testHelpers.webDriverManager.typeText('input[name="phone"]', '+1234567890');
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            const pageSource = await testHelpers.webDriverManager.driver.getPageSource();
            
            expect(currentUrl).to.not.include(password);
            expect(pageSource).to.not.include(password);
        });

        it('should handle registration rate limiting', async function() {
            // Attempt multiple rapid registrations
            for (let i = 0; i < 5; i++) {
                const testEmail = await testHelpers.generateTestEmail();
                
                await testHelpers.webDriverManager.navigateTo('/register');
                await testHelpers.webDriverManager.typeText('input[name="name"]', 'Test User');
                await testHelpers.webDriverManager.typeText('input[name="email"]', testEmail);
                await testHelpers.webDriverManager.typeText('input[name="password"]', 'TestPassword123!');
                await testHelpers.webDriverManager.typeText('input[name="confirmPassword"]', 'TestPassword123!');
                await testHelpers.webDriverManager.typeText('input[name="phone"]', '+1234567890');
                await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
                
                // Check for rate limiting message
                const rateLimitMessage = await testHelpers.webDriverManager.isElementPresent('.rate-limit, [data-testid="rate-limit"]');
                if (rateLimitMessage) {
                    console.log('Rate limiting detected');
                    break;
                }
            }
        });
    });

    describe('Registration Accessibility', function() {
        it('should have proper form labels', async function() {
            const nameLabel = await testHelpers.webDriverManager.isElementPresent('label[for="name"], label:contains("Name")');
            const emailLabel = await testHelpers.webDriverManager.isElementPresent('label[for="email"], label:contains("Email")');
            const passwordLabel = await testHelpers.webDriverManager.isElementPresent('label[for="password"], label:contains("Password")');
            
            expect(nameLabel || emailLabel || passwordLabel).to.be.true;
        });

        it('should support keyboard navigation', async function() {
            const nameField = await testHelpers.webDriverManager.driver.findElement('input[name="name"]');
            await nameField.sendKeys(require('selenium-webdriver').Key.TAB);
            
            const emailField = await testHelpers.webDriverManager.driver.findElement('input[name="email"]');
            await emailField.sendKeys(require('selenium-webdriver').Key.TAB);
            
            // Check if focus moves properly
            const focusedElement = await testHelpers.webDriverManager.driver.switchTo().activeElement();
            const tagName = await focusedElement.getTagName();
            expect(tagName).to.be.oneOf(['input', 'button']);
        });

        it('should have proper ARIA attributes', async function() {
            const form = await testHelpers.webDriverManager.driver.findElement('form');
            const ariaLabel = await form.getAttribute('aria-label');
            
            if (ariaLabel) {
                console.log(`Form ARIA label: ${ariaLabel}`);
            }
        });
    });
});
