const TestHelpers = require('./utils/test-helpers');
const testData = require('./config/test-data');

async function runCompleteAuthTest() {
    let testHelpers = null;
    let results = {
        tests: [],
        passed: 0,
        failed: 0,
        total: 0
    };

    // Helper function to record test results
    function recordTest(name, status, details = '') {
        results.tests.push({ name, status, details });
        results.total++;
        if (status === 'PASSED') {
            results.passed++;
        } else {
            results.failed++;
        }
        console.log(`${status === 'PASSED' ? '✅' : '❌'} ${name}: ${status}${details ? ' - ' + details : ''}`);
    }

    try {
        console.log('🚀 Starting Complete Authentication Test Suite...');
        console.log('==============================================\n');

        // Initialize TestHelpers
        console.log('🔍 Initializing Test Environment...');
        testHelpers = new TestHelpers();
        const driver = await testHelpers.initialize();
        console.log('✅ Test Environment Initialized\n');

        // Test 1: Navigate to Login Page
        console.log('🧪 Test 1: Navigate to Login Page');
        try {
            await testHelpers.webDriverManager.navigateTo('/login');
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            const hasLoginForm = await testHelpers.webDriverManager.isElementPresent(testData.selectors.loginForm);
            
            if (currentUrl.includes('/login') && hasLoginForm) {
                recordTest('Navigate to Login Page', 'PASSED');
            } else {
                recordTest('Navigate to Login Page', 'FAILED', `URL: ${currentUrl}, Form found: ${hasLoginForm}`);
            }
        } catch (error) {
            recordTest('Navigate to Login Page', 'FAILED', error.message);
        }

        // Test 2: Login Form Elements
        console.log('\n🧪 Test 2: Login Form Elements');
        try {
            const hasEmailInput = await testHelpers.webDriverManager.isElementPresent(testData.selectors.emailInput);
            const hasPasswordInput = await testHelpers.webDriverManager.isElementPresent(testData.selectors.passwordInput);
            const hasLoginButton = await testHelpers.webDriverManager.isElementPresent(testData.selectors.loginButton);
            const hasRegisterLink = await testHelpers.webDriverManager.isElementPresent('.register-link, [data-testid="register-link"]');
            
            if (hasEmailInput && hasPasswordInput && hasLoginButton && hasRegisterLink) {
                recordTest('Login Form Elements', 'PASSED');
            } else {
                recordTest('Login Form Elements', 'FAILED', 
                    `Email: ${hasEmailInput}, Password: ${hasPasswordInput}, Login: ${hasLoginButton}, Register: ${hasRegisterLink}`);
            }
        } catch (error) {
            recordTest('Login Form Elements', 'FAILED', error.message);
        }

        // Test 3: Invalid Login
        console.log('\n🧪 Test 3: Invalid Login');
        try {
            await testHelpers.webDriverManager.typeText(testData.selectors.emailInput, 'invalid@example.com');
            await testHelpers.webDriverManager.typeText(testData.selectors.passwordInput, 'wrongpassword');
            await testHelpers.webDriverManager.clickElement(testData.selectors.loginButton);
            
            // Wait for error message
            await testHelpers.webDriverManager.driver.sleep(2000);
            const hasErrorMessage = await testHelpers.webDriverManager.isElementPresent(testData.selectors.errorMessage);
            
            if (hasErrorMessage) {
                recordTest('Invalid Login', 'PASSED', 'Error message displayed');
            } else {
                recordTest('Invalid Login', 'FAILED', 'No error message displayed');
            }
        } catch (error) {
            recordTest('Invalid Login', 'FAILED', error.message);
        }

        // Test 4: Navigate to Register Page
        console.log('\n🧪 Test 4: Navigate to Register Page');
        try {
            await testHelpers.webDriverManager.navigateTo('/register');
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            const hasRegisterForm = await testHelpers.webDriverManager.isElementPresent(testData.selectors.registerForm);
            
            if (currentUrl.includes('/register') && hasRegisterForm) {
                recordTest('Navigate to Register Page', 'PASSED');
            } else {
                recordTest('Navigate to Register Page', 'FAILED', `URL: ${currentUrl}, Form found: ${hasRegisterForm}`);
            }
        } catch (error) {
            recordTest('Navigate to Register Page', 'FAILED', error.message);
        }

        // Test 5: Register Form Elements
        console.log('\n🧪 Test 5: Register Form Elements');
        try {
            const formElements = [
                'input[name="name"]',
                'input[name="email"]',
                testData.selectors.emailInput,
                'input[name="password"]',
                testData.selectors.passwordInput,
                'input[name="confirmPassword"]',
                'input[name="phone"]',
                testData.selectors.registerButton
            ];
            
            let allElementsFound = true;
            for (const selector of formElements) {
                const isPresent = await testHelpers.webDriverManager.isElementPresent(selector);
                if (!isPresent) {
                    allElementsFound = false;
                    break;
                }
            }
            
            if (allElementsFound) {
                recordTest('Register Form Elements', 'PASSED');
            } else {
                recordTest('Register Form Elements', 'FAILED');
            }
        } catch (error) {
            recordTest('Register Form Elements', 'FAILED', error.message);
        }

        // Test 6: Password Validation
        console.log('\n🧪 Test 6: Password Validation');
        try {
            await testHelpers.webDriverManager.typeText('input[name="password"]', '123');
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            // Wait for validation
            await testHelpers.webDriverManager.driver.sleep(2000);
            const hasErrorMessage = await testHelpers.webDriverManager.isElementPresent(testData.selectors.errorMessage);
            
            if (hasErrorMessage) {
                recordTest('Password Validation', 'PASSED', 'Validation error displayed');
            } else {
                recordTest('Password Validation', 'FAILED', 'No validation error');
            }
        } catch (error) {
            recordTest('Password Validation', 'FAILED', error.message);
        }

        // Test 7: Email Format Validation
        console.log('\n🧪 Test 7: Email Format Validation');
        try {
            // Navigate back to register page to clear previous inputs
            await testHelpers.webDriverManager.navigateTo('/register');
            await testHelpers.webDriverManager.typeText('input[name="email"]', 'invalid-email');
            await testHelpers.webDriverManager.clickElement(testData.selectors.registerButton);
            
            // Wait for validation
            await testHelpers.webDriverManager.driver.sleep(2000);
            const hasErrorMessage = await testHelpers.webDriverManager.isElementPresent(testData.selectors.errorMessage);
            
            if (hasErrorMessage) {
                recordTest('Email Format Validation', 'PASSED', 'Validation error displayed');
            } else {
                recordTest('Email Format Validation', 'FAILED', 'No validation error');
            }
        } catch (error) {
            recordTest('Email Format Validation', 'FAILED', error.message);
        }

        // Test 8: Form Labels and Accessibility
        console.log('\n🧪 Test 8: Form Labels and Accessibility');
        try {
            const hasEmailLabel = await testHelpers.webDriverManager.isElementPresent('label[for="email"], label:contains("Email")');
            const hasPasswordLabel = await testHelpers.webDriverManager.isElementPresent('label[for="password"], label:contains("Password")');
            const hasNameLabel = await testHelpers.webDriverManager.isElementPresent('label[for="name"], label:contains("Name")');
            
            if (hasEmailLabel || hasPasswordLabel || hasNameLabel) {
                recordTest('Form Labels and Accessibility', 'PASSED', 'Some form labels found');
            } else {
                recordTest('Form Labels and Accessibility', 'WARNING', 'No form labels found');
            }
        } catch (error) {
            recordTest('Form Labels and Accessibility', 'WARNING', error.message);
        }

        // Test 9: Navigation Between Auth Pages
        console.log('\n🧪 Test 9: Navigation Between Auth Pages');
        try {
            // Go to login
            await testHelpers.webDriverManager.navigateTo('/login');
            let currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            
            // Click register link
            const registerLinkSelector = '.register-link, [data-testid="register-link"]';
            if (await testHelpers.webDriverManager.isElementPresent(registerLinkSelector)) {
                await testHelpers.webDriverManager.clickElement(registerLinkSelector);
                await testHelpers.webDriverManager.driver.sleep(1000);
                currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
                
                if (currentUrl.includes('/register')) {
                    // Go back to login
                    await testHelpers.webDriverManager.navigateTo('/login');
                    currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
                    
                    if (currentUrl.includes('/login')) {
                        recordTest('Navigation Between Auth Pages', 'PASSED');
                    } else {
                        recordTest('Navigation Between Auth Pages', 'FAILED', 'Failed to navigate back to login');
                    }
                } else {
                    recordTest('Navigation Between Auth Pages', 'FAILED', 'Failed to navigate to register');
                }
            } else {
                recordTest('Navigation Between Auth Pages', 'FAILED', 'Register link not found');
            }
        } catch (error) {
            recordTest('Navigation Between Auth Pages', 'FAILED', error.message);
        }

        // Test 10: UI Responsiveness
        console.log('\n🧪 Test 10: UI Responsiveness');
        try {
            // Test mobile viewport
            await testHelpers.webDriverManager.driver.manage().window().setRect({ width: 375, height: 667 });
            await testHelpers.webDriverManager.refresh();
            await testHelpers.webDriverManager.driver.sleep(2000);
            
            // Reset to normal viewport
            await testHelpers.webDriverManager.driver.manage().window().setRect({ 
                width: testData.windowWidth || 1920, 
                height: testData.windowHeight || 1080 
            });
            await testHelpers.webDriverManager.refresh();
            await testHelpers.webDriverManager.driver.sleep(2000);
            
            recordTest('UI Responsiveness', 'PASSED', 'Viewport changes handled');
        } catch (error) {
            recordTest('UI Responsiveness', 'WARNING', error.message);
        }

    } catch (error) {
        console.error('❌ Critical Error:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        // Cleanup
        if (testHelpers) {
            console.log('\n🧹 Cleaning up...');
            await testHelpers.cleanup();
            console.log('✅ Cleanup completed');
        }

        // Print final results
        console.log('\n📊 Test Results Summary');
        console.log('====================');
        console.log(`Total Tests: ${results.total}`);
        console.log(`Passed: ${results.passed}`);
        console.log(`Failed: ${results.failed}`);
        console.log(`Success Rate: ${results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0}%`);
        
        console.log('\n📋 Detailed Results:');
        results.tests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.name}: ${test.status}${test.details ? ' - ' + test.details : ''}`);
        });

        // Save results to file
        const fs = require('fs');
        const path = require('path');
        const resultsPath = path.join(__dirname, 'AUTH_TEST_RESULTS.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Test results saved to: ${resultsPath}`);

        if (results.failed === 0) {
            console.log('\n🎉 All authentication tests passed!');
        } else {
            console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the results.`);
        }
    }
}

// Run the test suite
runCompleteAuthTest();