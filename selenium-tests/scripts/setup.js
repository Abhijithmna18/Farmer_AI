#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestSetup {
    constructor() {
        this.rootDir = path.join(__dirname, '..');
        this.config = this.loadConfig();
    }

    loadConfig() {
        const configPath = path.join(this.rootDir, 'config/test-config.json');
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return {};
    }

    async setup() {
        console.log('🔧 Setting up Farmer AI Selenium Test Suite');
        console.log('==========================================');
        
        try {
            await this.checkPrerequisites();
            await this.installDependencies();
            await this.setupDirectories();
            await this.setupEnvironment();
            await this.validateConfiguration();
            await this.runHealthChecks();
            
            console.log('\n✅ Test setup completed successfully!');
            console.log('\n🚀 You can now run tests with:');
            console.log('   npm test                    # Run all tests');
            console.log('   npm run test:auth          # Run authentication tests');
            console.log('   npm run test:dashboard     # Run dashboard tests');
            console.log('   npm run test:warehouse     # Run warehouse tests');
            console.log('   npm run test:payment      # Run payment tests');
            console.log('   npm run test:admin        # Run admin tests');
            console.log('   npm run test:headless     # Run in headless mode');
            
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 16) {
            throw new Error(`Node.js version 16 or higher is required. Current version: ${nodeVersion}`);
        }
        
        console.log(`✅ Node.js version: ${nodeVersion}`);
        
        // Check if npm is available
        try {
            execSync('npm --version', { stdio: 'pipe' });
            console.log('✅ npm is available');
        } catch (error) {
            throw new Error('npm is not available');
        }
        
        // Check if application is running
        await this.checkApplicationHealth();
    }

    async checkApplicationHealth() {
        console.log('🔍 Checking application health...');
        
        const axios = require('axios');
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        
        try {
            const response = await axios.get(baseUrl, { timeout: 5000 });
            if (response.status === 200) {
                console.log('✅ Farmer AI application is running');
            }
        } catch (error) {
            console.warn('⚠️  Farmer AI application is not running');
            console.warn('   Please start the application before running tests:');
            console.warn('   Frontend: cd farmerai-frontend && npm run dev');
            console.warn('   Backend: cd FarmerAI-backend && npm start');
        }
    }

    async installDependencies() {
        console.log('📦 Installing dependencies...');
        
        try {
            execSync('npm install', { 
                cwd: this.rootDir, 
                stdio: 'inherit' 
            });
            console.log('✅ Dependencies installed successfully');
        } catch (error) {
            throw new Error('Failed to install dependencies');
        }
    }

    async setupDirectories() {
        console.log('📁 Setting up directories...');
        
        const directories = [
            'screenshots',
            'test-results',
            'logs'
        ];
        
        for (const dir of directories) {
            const dirPath = path.join(this.rootDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`✅ Created directory: ${dir}`);
            }
        }
    }

    async setupEnvironment() {
        console.log('⚙️  Setting up environment...');
        
        const envPath = path.join(this.rootDir, '.env');
        const envExamplePath = path.join(this.rootDir, '.env.example');
        
        if (!fs.existsSync(envPath)) {
            if (fs.existsSync(envExamplePath)) {
                fs.copyFileSync(envExamplePath, envPath);
                console.log('✅ Created .env file from .env.example');
                console.log('⚠️  Please update .env with your configuration');
            } else {
                // Create basic .env file
                const envContent = `# Test Configuration
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
`;
                fs.writeFileSync(envPath, envContent);
                console.log('✅ Created basic .env file');
                console.log('⚠️  Please update .env with your configuration');
            }
        } else {
            console.log('✅ .env file already exists');
        }
    }

    async validateConfiguration() {
        console.log('🔍 Validating configuration...');
        
        // Check if required environment variables are set
        const requiredVars = ['BASE_URL', 'TEST_USER_EMAIL', 'TEST_USER_PASSWORD'];
        const missingVars = [];
        
        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                missingVars.push(varName);
            }
        }
        
        if (missingVars.length > 0) {
            console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
            console.warn('   Please update your .env file');
        } else {
            console.log('✅ Configuration validation passed');
        }
    }

    async runHealthChecks() {
        console.log('🏥 Running health checks...');
        
        // Check if WebDriver can be initialized
        try {
            const WebDriverManager = require('../config/webdriver');
            const webDriverManager = new WebDriverManager();
            
            // Test WebDriver initialization
            await webDriverManager.initializeDriver();
            await webDriverManager.close();
            
            console.log('✅ WebDriver health check passed');
        } catch (error) {
            console.warn('⚠️  WebDriver health check failed:', error.message);
            console.warn('   This might be due to missing browser drivers');
        }
        
        // Check if test files exist
        const testFiles = [
            'tests/auth/login.test.js',
            'tests/auth/register.test.js',
            'tests/dashboard/dashboard.test.js',
            'tests/warehouse/warehouse-booking.test.js',
            'tests/payment/payment-flow.test.js',
            'tests/farm-monitoring/farm-monitoring.test.js',
            'tests/admin/admin-dashboard.test.js'
        ];
        
        const missingFiles = [];
        for (const file of testFiles) {
            const filePath = path.join(this.rootDir, file);
            if (!fs.existsSync(filePath)) {
                missingFiles.push(file);
            }
        }
        
        if (missingFiles.length > 0) {
            console.warn(`⚠️  Missing test files: ${missingFiles.join(', ')}`);
        } else {
            console.log('✅ All test files found');
        }
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    const setup = new TestSetup();
    setup.setup().catch(console.error);
}

module.exports = TestSetup;

