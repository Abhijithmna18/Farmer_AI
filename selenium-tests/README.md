# Farmer AI - Selenium Test Suite

This comprehensive Selenium test suite covers all major functionality of the Farmer AI application, including authentication, dashboard, warehouse booking, farm monitoring, payment processing, and admin management.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Chrome or Firefox browser
- ChromeDriver or GeckoDriver (automatically installed with npm)
- Farmer AI application running locally

### Installation

1. **Install dependencies:**
   ```bash
   cd selenium-tests
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the Farmer AI application:**
   ```bash
   # Terminal 1: Start backend
   cd FarmerAI-backend
   npm start

   # Terminal 2: Start frontend
   cd farmerai-frontend
   npm run dev
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:auth          # Authentication tests
npm run test:dashboard     # Dashboard tests
npm run test:warehouse     # Warehouse booking tests
npm run test:payment       # Payment flow tests
npm run test:admin         # Admin dashboard tests

# Run with different browsers
npm run test:chrome        # Chrome browser
npm run test:firefox       # Firefox browser
npm run test:headless      # Headless mode
```

## 📁 Test Structure

```
selenium-tests/
├── config/
│   ├── webdriver.js       # WebDriver configuration
│   └── test-data.js       # Test data and selectors
├── utils/
│   └── test-helpers.js    # Helper functions and utilities
├── tests/
│   ├── auth/              # Authentication tests
│   │   ├── login.test.js
│   │   └── register.test.js
│   ├── dashboard/         # Dashboard tests
│   │   └── dashboard.test.js
│   ├── warehouse/         # Warehouse booking tests
│   │   └── warehouse-booking.test.js
│   ├── payment/           # Payment flow tests
│   │   └── payment-flow.test.js
│   ├── farm-monitoring/   # Farm monitoring tests
│   │   └── farm-monitoring.test.js
│   └── admin/             # Admin dashboard tests
│       └── admin-dashboard.test.js
├── screenshots/           # Test screenshots (auto-generated)
├── package.json
└── README.md
```

## 🧪 Test Coverage

### Authentication Tests
- ✅ User login with valid/invalid credentials
- ✅ User registration with validation
- ✅ Password reset functionality
- ✅ Session management
- ✅ Security and accessibility

### Dashboard Tests
- ✅ Dashboard navigation and content
- ✅ Responsive design (mobile/desktop)
- ✅ Data loading and performance
- ✅ User interactions
- ✅ Error handling

### Warehouse Booking Tests
- ✅ Warehouse search and discovery
- ✅ Warehouse details and information
- ✅ Booking process and validation
- ✅ Booking confirmation and management
- ✅ Error handling and edge cases

### Payment Flow Tests
- ✅ Payment initiation and form display
- ✅ Razorpay integration
- ✅ Payment validation and security
- ✅ Payment confirmation and receipts
- ✅ Error handling and timeouts

### Farm Monitoring Tests
- ✅ Sensor data display and visualization
- ✅ Real-time updates and charts
- ✅ Sensor data management
- ✅ Alerts and notifications
- ✅ Reports and analytics

### Admin Dashboard Tests
- ✅ Admin authentication and access control
- ✅ User management (CRUD operations)
- ✅ Warehouse management and approval
- ✅ Booking management
- ✅ Analytics and reports
- ✅ System settings

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# Test Configuration
BASE_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

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
RAZORPAY_TEST_KEY=rzp_test_xxxxxxxxxxxxx
RAZORPAY_TEST_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### Browser Configuration

The test suite supports multiple browsers:

- **Chrome** (default): `npm run test:chrome`
- **Firefox**: `npm run test:firefox`
- **Headless**: `npm run test:headless`

### Test Data

Test data is centralized in `config/test-data.js` and includes:
- User credentials and profiles
- Warehouse information
- Booking data
- Payment information
- Farm monitoring data
- Community and calendar data

## 🔧 Customization

### Adding New Tests

1. Create a new test file in the appropriate directory
2. Import required dependencies:
   ```javascript
   const { expect } = require('chai');
   const TestHelpers = require('../utils/test-helpers');
   const testData = require('../config/test-data');
   ```
3. Use the TestHelpers class for common operations
4. Follow the existing test structure and naming conventions

### Custom Selectors

Add new selectors to `config/test-data.js`:

```javascript
selectors: {
    newElement: '.new-element, [data-testid="new-element"]',
    // ... other selectors
}
```

### Helper Functions

Add new helper functions to `utils/test-helpers.js`:

```javascript
async newHelperFunction() {
    // Implementation
}
```

## 📊 Test Reports

### Screenshots

Test screenshots are automatically captured on failures and saved to the `screenshots/` directory with timestamps.

### Console Output

Tests provide detailed console output including:
- Test execution progress
- Performance metrics
- Error details
- Debug information

### Test Results

The test suite provides comprehensive reporting:
- Pass/fail status for each test
- Execution time for performance analysis
- Error messages and stack traces
- Screenshots for failed tests

## 🐛 Troubleshooting

### Common Issues

1. **WebDriver not found:**
   ```bash
   npm install chromedriver geckodriver
   ```

2. **Application not running:**
   - Ensure both frontend and backend are running
   - Check URLs in `.env` file
   - Verify ports are not in use

3. **Test timeouts:**
   - Increase timeout values in test files
   - Check application performance
   - Verify network connectivity

4. **Element not found:**
   - Check if selectors are correct
   - Verify application is fully loaded
   - Add wait conditions for dynamic content

### Debug Mode

Run tests with debug information:

```bash
DEBUG=selenium-webdriver npm test
```

### Verbose Output

Enable verbose test output:

```bash
npm test -- --reporter spec
```

## 🚀 CI/CD Integration

### GitHub Actions

Create `.github/workflows/selenium-tests.yml`:

```yaml
name: Selenium Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: cd selenium-tests && npm install
      - run: cd selenium-tests && npm run test:headless
```

### Docker

Create `Dockerfile` for containerized testing:

```dockerfile
FROM node:16
WORKDIR /app
COPY selenium-tests/ .
RUN npm install
CMD ["npm", "test"]
```

## 📈 Performance Testing

The test suite includes performance tests for:
- Page load times
- API response times
- Database query performance
- Memory usage
- Browser performance

## 🔒 Security Testing

Security tests cover:
- Authentication bypass attempts
- SQL injection prevention
- XSS protection
- CSRF token validation
- Session management
- Data encryption

## 📱 Mobile Testing

Mobile-specific tests include:
- Responsive design validation
- Touch interactions
- Mobile navigation
- Performance on mobile devices
- Cross-browser compatibility

## 🤝 Contributing

1. Follow the existing test structure
2. Add comprehensive test coverage
3. Include performance and security tests
4. Update documentation
5. Test on multiple browsers
6. Follow naming conventions

## 📝 License

This test suite is part of the Farmer AI project and follows the same license terms.

