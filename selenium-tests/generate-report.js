const fs = require('fs');
const path = require('path');

async function runTestSuite() {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            executionTime: 0
        },
        testResults: [],
        environment: {
            os: process.platform,
            nodeVersion: process.version,
            workingDirectory: process.cwd()
        }
    };

    const startTime = Date.now();

    console.log('🧪 Starting Selenium Test Report Generation...');
    console.log('==============================================\n');

    // Test 1: Simple WebDriver Check
    console.log('🔍 Test 1: Simple WebDriver Check');
    try {
        const { execSync } = require('child_process');
        const output = execSync('node simple-check.js', { timeout: 30000, stdio: 'pipe' });
        const result = {
            testName: 'Simple WebDriver Check',
            status: 'PASSED',
            details: 'WebDriver initialized and page loaded successfully',
            executionTime: 'N/A'
        };
        report.testResults.push(result);
        report.summary.passedTests++;
        console.log('✅ PASSED: WebDriver functionality verified\n');
    } catch (error) {
        const result = {
            testName: 'Simple WebDriver Check',
            status: 'FAILED',
            details: error.message,
            executionTime: 'N/A'
        };
        report.testResults.push(result);
        report.summary.failedTests++;
        console.log('❌ FAILED:', error.message, '\n');
    }
    report.summary.totalTests++;

    // Test 2: Farmer AI Application Access
    console.log('🔍 Test 2: Farmer AI Application Access');
    try {
        const { execSync } = require('child_process');
        const output = execSync('node debug-farmerai.js', { timeout: 30000, stdio: 'pipe' });
        const outputStr = output.toString();
        
        const result = {
            testName: 'Farmer AI Application Access',
            status: 'PASSED',
            details: 'Successfully accessed Farmer AI application',
            executionTime: 'N/A'
        };
        
        // Extract additional details from output
        if (outputStr.includes('Page loaded successfully')) {
            const titleMatch = outputStr.match(/Title: (.*)/);
            if (titleMatch) result.details += ` - Title: ${titleMatch[1]}`;
        }
        
        report.testResults.push(result);
        report.summary.passedTests++;
        console.log('✅ PASSED: Application access verified\n');
    } catch (error) {
        const result = {
            testName: 'Farmer AI Application Access',
            status: 'FAILED',
            details: error.message,
            executionTime: 'N/A'
        };
        report.testResults.push(result);
        report.summary.failedTests++;
        console.log('❌ FAILED:', error.message, '\n');
    }
    report.summary.totalTests++;

    // Test 3: Test Data Configuration
    console.log('🔍 Test 3: Test Data Configuration');
    try {
        if (fs.existsSync('.env')) {
            const envContent = fs.readFileSync('.env', 'utf8');
            const hasBaseUrl = envContent.includes('BASE_URL=');
            const hasBackendUrl = envContent.includes('BACKEND_URL=');
            
            if (hasBaseUrl && hasBackendUrl) {
                const result = {
                    testName: 'Test Data Configuration',
                    status: 'PASSED',
                    details: '.env file configured correctly',
                    executionTime: 'N/A'
                };
                report.testResults.push(result);
                report.summary.passedTests++;
                console.log('✅ PASSED: Test configuration verified\n');
            } else {
                throw new Error('Missing required configuration in .env file');
            }
        } else {
            throw new Error('.env file not found');
        }
    } catch (error) {
        const result = {
            testName: 'Test Data Configuration',
            status: 'FAILED',
            details: error.message,
            executionTime: 'N/A'
        };
        report.testResults.push(result);
        report.summary.failedTests++;
        console.log('❌ FAILED:', error.message, '\n');
    }
    report.summary.totalTests++;

    // Test 4: Test Helpers Functionality
    console.log('🔍 Test 4: Test Helpers Functionality');
    try {
        // Check if required files exist
        const requiredFiles = [
            'utils/test-helpers.js',
            'config/webdriver.js',
            'config/test-data.js'
        ];
        
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
        
        if (missingFiles.length === 0) {
            const result = {
                testName: 'Test Helpers Functionality',
                status: 'PASSED',
                details: 'All required helper files present',
                executionTime: 'N/A'
            };
            report.testResults.push(result);
            report.summary.passedTests++;
            console.log('✅ PASSED: Test helpers verified\n');
        } else {
            throw new Error(`Missing files: ${missingFiles.join(', ')}`);
        }
    } catch (error) {
        const result = {
            testName: 'Test Helpers Functionality',
            status: 'FAILED',
            details: error.message,
            executionTime: 'N/A'
        };
        report.testResults.push(result);
        report.summary.failedTests++;
        console.log('❌ FAILED:', error.message, '\n');
    }
    report.summary.totalTests++;

    const endTime = Date.now();
    report.summary.executionTime = `${(endTime - startTime) / 1000}s`;

    // Generate detailed report
    generateDetailedReport(report);
    
    return report;
}

function generateDetailedReport(report) {
    console.log('📊 Test Report Generation Complete');
    console.log('==================================');
    console.log(`🕒 Timestamp: ${report.timestamp}`);
    console.log(`📈 Summary: ${report.summary.passedTests}/${report.summary.totalTests} tests passed`);
    console.log(`⚡ Execution Time: ${report.summary.executionTime}`);
    console.log('');

    console.log('📋 Detailed Results:');
    console.log('--------------------');
    report.testResults.forEach((test, index) => {
        console.log(`${index + 1}. ${test.testName}: ${test.status}`);
        console.log(`   ${test.details}`);
        console.log('');
    });

    // Save report to file
    const reportPath = path.join(__dirname, 'EXECUTION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 Detailed report saved to: ${reportPath}`);

    // Display final summary
    console.log('\n📋 Final Summary:');
    console.log('==================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Success Rate: ${((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1)}%`);
    console.log(`Execution Time: ${report.summary.executionTime}`);

    if (report.summary.failedTests > 0) {
        console.log('\n⚠️  Some tests failed. Please review the detailed report.');
    } else {
        console.log('\n🎉 All tests passed! The Selenium testing environment is working correctly.');
    }
}

// Run the test suite
runTestSuite().catch(error => {
    console.error('💥 Error running test suite:', error);
    process.exit(1);
});