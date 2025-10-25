#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
    constructor() {
        this.config = this.loadConfig();
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            duration: 0
        };
    }

    loadConfig() {
        const configPath = path.join(__dirname, '../config/test-config.json');
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return {
            browsers: ['chrome'],
            headless: false,
            parallel: false,
            timeout: 30000,
            retries: 2
        };
    }

    async runTests() {
        console.log('🚀 Starting Farmer AI Selenium Test Suite');
        console.log('==========================================');
        
        const startTime = Date.now();
        
        try {
            await this.setupEnvironment();
            await this.runTestSuites();
            await this.generateReport();
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            process.exit(1);
        } finally {
            this.results.duration = Date.now() - startTime;
            this.printSummary();
        }
    }

    async setupEnvironment() {
        console.log('🔧 Setting up test environment...');
        
        // Check if application is running
        await this.checkApplicationHealth();
        
        // Create screenshots directory
        const screenshotsDir = path.join(__dirname, '../screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        
        console.log('✅ Environment setup complete');
    }

    async checkApplicationHealth() {
        const axios = require('axios');
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        
        try {
            const response = await axios.get(baseUrl, { timeout: 5000 });
            if (response.status === 200) {
                console.log('✅ Application is running');
            }
        } catch (error) {
            console.error('❌ Application is not running. Please start the Farmer AI application first.');
            console.error('   Frontend: npm run dev (in farmerai-frontend directory)');
            console.error('   Backend: npm start (in FarmerAI-backend directory)');
            process.exit(1);
        }
    }

    async runTestSuites() {
        const testSuites = [
            { name: 'Authentication', path: 'tests/auth/*.js' },
            { name: 'Dashboard', path: 'tests/dashboard/*.js' },
            { name: 'Warehouse Booking', path: 'tests/warehouse/*.js' },
            { name: 'Payment Flow', path: 'tests/payment/*.js' },
            { name: 'Farm Monitoring', path: 'tests/farm-monitoring/*.js' },
            { name: 'Admin Dashboard', path: 'tests/admin/*.js' }
        ];

        for (const suite of testSuites) {
            console.log(`\n🧪 Running ${suite.name} tests...`);
            await this.runTestSuite(suite);
        }
    }

    async runTestSuite(suite) {
        return new Promise((resolve, reject) => {
            const mochaPath = path.join(__dirname, '../node_modules/.bin/mocha');
            const args = [
                suite.path,
                '--timeout', this.config.timeout.toString(),
                '--reporter', 'spec',
                '--bail'
            ];

            if (this.config.headless) {
                args.push('--env', 'headless');
            }

            const child = spawn(mochaPath, args, {
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit',
                env: { ...process.env, ...this.config }
            });

            child.on('close', (code) => {
                if (code === 0) {
                    this.results.passed++;
                    console.log(`✅ ${suite.name} tests passed`);
                } else {
                    this.results.failed++;
                    console.log(`❌ ${suite.name} tests failed`);
                }
                this.results.total++;
                resolve();
            });

            child.on('error', (error) => {
                console.error(`❌ Error running ${suite.name} tests:`, error);
                this.results.failed++;
                this.results.total++;
                resolve();
            });
        });
    }

    async generateReport() {
        console.log('\n📊 Generating test report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.results,
            environment: {
                node: process.version,
                platform: process.platform,
                browser: this.config.browsers.join(', ')
            },
            config: this.config
        };

        const reportPath = path.join(__dirname, '../test-results');
        if (!fs.existsSync(reportPath)) {
            fs.mkdirSync(reportPath, { recursive: true });
        }

        fs.writeFileSync(
            path.join(reportPath, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('📄 Test report saved to test-results/test-report.json');
    }

    printSummary() {
        console.log('\n📈 Test Execution Summary');
        console.log('========================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        console.log(`Duration: ${(this.results.duration / 1000).toFixed(2)}s`);
        
        if (this.results.failed > 0) {
            console.log('\n⚠️  Some tests failed. Check the output above for details.');
            process.exit(1);
        } else {
            console.log('\n🎉 All tests passed successfully!');
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runTests().catch(console.error);
}

module.exports = TestRunner;

