const testData = {
    users: {
        farmer: {
            email: process.env.TEST_USER_EMAIL || 'farmer@test.com',
            password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
            name: 'Test Farmer',
            phone: '+1234567890',
            location: 'Test Farm Location'
        },
        admin: {
            email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
            password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!',
            name: 'Test Admin',
            phone: '+1234567891'
        },
        warehouseOwner: {
            email: 'owner@test.com',
            password: 'OwnerPassword123!',
            name: 'Test Warehouse Owner',
            phone: '+1234567892'
        }
    },
    
    warehouse: {
        name: process.env.TEST_WAREHOUSE_NAME || 'Test Warehouse',
        location: process.env.TEST_WAREHOUSE_LOCATION || 'Test Location',
        capacity: '1000',
        price: '500',
        description: 'A test warehouse for automated testing',
        features: ['Climate Control', 'Security', 'Loading Dock'],
        images: []
    },
    
    booking: {
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        duration: process.env.TEST_BOOKING_DURATION || '7',
        quantity: '100',
        notes: 'Test booking for automated testing'
    },
    
    payment: {
        razorpayKey: process.env.RAZORPAY_TEST_KEY || 'rzp_test_xxxxxxxxxxxxx',
        amount: '500',
        currency: 'INR',
        description: 'Test payment for warehouse booking'
    },
    
    farmData: {
        sensorData: {
            temperature: '25',
            humidity: '60',
            soilMoisture: '45',
            ph: '6.5',
            light: '800'
        },
        cropData: {
            name: 'Test Crop',
            variety: 'Test Variety',
            plantingDate: new Date().toISOString().split('T')[0],
            expectedHarvest: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
    },
    
    community: {
        post: {
            title: 'Test Community Post',
            content: 'This is a test post for automated testing of the community features.',
            tags: ['farming', 'test', 'automation']
        },
        event: {
            title: 'Test Farming Event',
            description: 'A test event for automated testing',
            date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            location: 'Test Event Location'
        }
    },
    
    growthCalendar: {
        title: 'Test Growth Calendar',
        description: 'A test growth calendar for automated testing',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tasks: [
            {
                title: 'Planting',
                date: new Date().toISOString().split('T')[0],
                description: 'Plant the seeds'
            },
            {
                title: 'Watering',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: 'Water the plants'
            }
        ]
    },
    
    selectors: {
        // Common selectors
        loadingSpinner: '.loading-spinner, .spinner, [data-testid="loading"]',
        toastMessage: '.toast, .notification, [data-testid="toast"]',
        modal: '.modal, .dialog, [role="dialog"]',
        button: 'button, .btn, [role="button"]',
        input: 'input, textarea, select',
        
        // Navigation
        sidebar: '.sidebar, .nav-sidebar, [data-testid="sidebar"]',
        navbar: '.navbar, .nav, [data-testid="navbar"]',
        menuToggle: '.menu-toggle, .hamburger, [data-testid="menu-toggle"]',
        
        // Authentication
        loginForm: '.login-form, [data-testid="login-form"]',
        registerForm: '.register-form, [data-testid="register-form"]',
        emailInput: 'input[type="email"], input[name="email"]',
        passwordInput: 'input[type="password"], input[name="password"]',
        loginButton: 'button[type="submit"], .login-btn, [data-testid="login-button"]',
        registerButton: 'button[type="submit"], .register-btn, [data-testid="register-button"]',
        
        // Dashboard
        dashboard: '.dashboard, [data-testid="dashboard"]',
        dashboardCards: '.dashboard-card, .card, [data-testid="dashboard-card"]',
        statsCards: '.stats-card, .stat-card, [data-testid="stats-card"]',
        
        // Warehouse
        warehouseCard: '.warehouse-card, [data-testid="warehouse-card"]',
        warehouseSearch: '.warehouse-search, [data-testid="warehouse-search"]',
        bookingForm: '.booking-form, [data-testid="booking-form"]',
        bookingModal: '.booking-modal, [data-testid="booking-modal"]',
        
        // Farm Monitoring
        sensorCard: '.sensor-card, [data-testid="sensor-card"]',
        chartContainer: '.chart-container, [data-testid="chart"]',
        sensorData: '.sensor-data, [data-testid="sensor-data"]',
        
        // Payment
        paymentForm: '.payment-form, [data-testid="payment-form"]',
        razorpayButton: '.razorpay-button, [data-testid="razorpay-button"]',
        paymentModal: '.payment-modal, [data-testid="payment-modal"]',
        
        // Admin
        adminPanel: '.admin-panel, [data-testid="admin-panel"]',
        userTable: '.user-table, [data-testid="user-table"]',
        warehouseTable: '.warehouse-table, [data-testid="warehouse-table"]',
        
        // Forms
        form: 'form, [data-testid="form"]',
        submitButton: 'button[type="submit"], .submit-btn, [data-testid="submit-button"]',
        cancelButton: 'button[type="button"], .cancel-btn, [data-testid="cancel-button"]',
        
        // Alerts and Messages
        successMessage: '.success, .alert-success, [data-testid="success-message"]',
        errorMessage: '.error, .alert-error, [data-testid="error-message"]',
        warningMessage: '.warning, .alert-warning, [data-testid="warning-message"]'
    },
    
    urls: {
        base: process.env.BASE_URL || 'http://localhost:3000',
        backend: process.env.BACKEND_URL || 'http://localhost:5000',
        login: '/login',
        register: '/register',
        dashboard: '/dashboard',
        warehouse: '/warehouses',
        farmMonitoring: '/farm-monitoring',
        admin: '/admin',
        profile: '/profile',
        settings: '/settings'
    },
    
    timeouts: {
        short: 5000,
        medium: 10000,
        long: 30000,
        veryLong: 60000
    }
};

module.exports = testData;

