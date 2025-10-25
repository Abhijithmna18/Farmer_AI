# Selenium Testing Usage Guide - Farmer AI

## Overview

This guide explains how to use the Selenium testing framework for the Farmer AI application. The testing environment is fully functional but has a known compatibility issue with the Mocha test runner.

## Prerequisites

1. **Node.js** (v16 or higher) - Currently using v22.14.0
2. **Google Chrome Browser** - Installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`
3. **ChromeDriver** - Automatically managed through npm dependencies
4. **Farmer AI Application** - Both frontend and backend servers running

## Setup Instructions

### 1. Install Dependencies

```bash
cd selenium-tests
npm install
```

### 2. Configure Environment

The `.env` file should already be configured with:

```env
# Test Configuration
BASE_URL=http://localhost:5174
BACKEND_URL=http://localhost:5002

# Test User Credentials
TEST_USER_EMAIL=test@farmerai.com
TEST_USER_PASSWORD=TestPassword123!
TEST_ADMIN_EMAIL=admin@farmerai.com
TEST_ADMIN_PASSWORD=AdminPassword123!

# Browser Configuration
BROWSER=chrome
HEADLESS=false
WINDOW_WIDTH=1920
WINDOW_HEIGHT=1080

# Test Data
TEST_WAREHOUSE_NAME=Test Warehouse
TEST_WAREHOUSE_LOCATION=Test Location
TEST_BOOKING_DURATION=7

# Payment Test Configuration
RAZORPAY_TEST_KEY=rzp_test_RP6aD2gNdAuoRE
RAZORPAY_TEST_SECRET=RyTIKYQ5yobfYgNaDrvErQKN
```

### 3. Start Application Servers

Before running tests, ensure both Farmer AI servers are running:

**Terminal 1 - Backend:**
```bash
cd FarmerAI-backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd farmerai-frontend
npm run dev
```

## Running Tests

### Direct Node.js Execution (RECOMMENDED)

Due to compatibility issues with Mocha, run tests directly with Node.js:

```bash
# Run simple verification test
cd selenium-tests
node simple-check.js

# Run full workflow test
node full-workflow-test.js

# Run specific functionality test
node debug-farmerai.js
```

### Mocha Test Runner (CURRENTLY NOT WORKING)

These commands currently experience timeout issues:

```bash
# These will currently fail due to Mocha compatibility issues
npm test
npm run test:auth
npm run test:dashboard
npm run test:warehouse
npm run test:payment
npm run test:admin
npm run test:all
```

## Test Structure

### Configuration Files

- `config/webdriver.js` - WebDriver configuration and helper methods
- `config/test-data.js` - Test data, selectors, and user credentials
- `config/test-config.json` - Test configuration settings

### Utility Files

- `utils/test-helpers.js` - High-level test helper methods

### Test Suites

- `tests/auth/` - Authentication tests (login, registration)
- `tests/dashboard/` - Dashboard functionality tests
- `tests/warehouse/` - Warehouse booking tests
- `tests/payment/` - Payment flow tests
- `tests/farm-monitoring/` - Farm monitoring tests
- `tests/admin/` - Admin dashboard tests

## Creating New Tests

### Example Test Structure

```javascript
const { expect } = require('chai');
const TestHelpers = require('../utils/test-helpers');
const testData = require('../config/test-data');

describe('Your Test Suite', function() {
    let testHelpers;
    let driver;

    before(async function() {
        testHelpers = new TestHelpers();
        driver = await testHelpers.initialize();
    });

    after(async function() {
        await testHelpers.cleanup();
    });

    it('should perform some action', async function() {
        // Your test code here
        await testHelpers.webDriverManager.navigateTo('/some-page');
        await testHelpers.assertElementPresent('.some-selector');
    });
});
```

### Using Test Helpers

The TestHelpers class provides common functionality:

```javascript
// Authentication
await testHelpers.loginAsFarmer();
await testHelpers.loginAsAdmin();

// Navigation
await testHelpers.navigateToDashboard();
await testHelpers.navigateToWarehouse();

// Form filling
await testHelpers.fillForm({ name: 'Test', email: 'test@example.com' });
await testHelpers.submitForm();

// Assertions
await testHelpers.assertElementPresent('.selector');
await testHelpers.assertElementVisible('.selector');
await testHelpers.assertUrlContains('/expected-path');
```

## Test Data

Test data is centralized in `config/test-data.js`:

- User credentials for different roles
- Warehouse information
- Booking data
- Payment information
- Selectors for common elements
- URLs for different pages

## Troubleshooting

### Common Issues

1. **WebDriver Timeout**: Ensure Chrome browser and ChromeDriver versions are compatible
2. **Application Not Accessible**: Verify both frontend (port 5174) and backend (port 5002) servers are running
3. **Element Not Found**: Check if selectors in `test-data.js` match current application markup
4. **Mocha Compatibility**: Use direct Node.js execution instead of Mocha runner

### Debugging Tips

1. Add console.log statements to track test execution
2. Use `testHelpers.takeScreenshot('test-name')` to capture screenshots on failure
3. Check browser console for JavaScript errors
4. Verify network requests in browser developer tools

## Reporting

### Test Execution Report

Run the report generation script:

```bash
node generate-report.js
```

This creates:
- `EXECUTION_REPORT.json` - Detailed JSON report
- `SELENIUM_TEST_REPORT.html` - Visual HTML report

### Manual Test Verification

Check the status of key components:
1. WebDriver initialization
2. Application page loading
3. Element interaction
4. Form submission
5. Navigation between pages

## Best Practices

1. **Use Direct Execution**: Run tests with `node test-file.js` instead of Mocha
2. **Clean Up Resources**: Always call `testHelpers.cleanup()` in after hooks
3. **Handle Timeouts**: Use appropriate wait methods for dynamic content
4. **Take Screenshots**: Capture screenshots for failed tests to aid debugging
5. **Update Selectors**: Keep selectors in `test-data.js` synchronized with application changes
6. **Test Isolation**: Ensure tests can run independently without shared state

## Future Improvements

1. Resolve Mocha compatibility issues
2. Implement parallel test execution
3. Add cross-browser testing (Firefox, Edge)
4. Integrate with CI/CD pipeline
5. Add performance testing capabilities
6. Implement mobile testing scenarios

## Contact

For issues with the Selenium testing framework, contact the development team or refer to the main README.md file in the selenium-tests directory.