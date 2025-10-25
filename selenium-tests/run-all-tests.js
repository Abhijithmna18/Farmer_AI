const fs = require('fs');
const path = require('path');

async function runAllTestSuites() {
    console.log('🚀 Starting Complete Test Suite Execution...');
    console.log('==========================================\n');

    const testSuites = [
        { name: 'Authentication Tests', file: 'complete-auth-test.js' },
        { name: 'Dashboard Tests', file: 'dashboard-test.js' },
        { name: 'Warehouse Tests', file: 'warehouse-test.js' }
    ];

    const results = {
        overall: {
            totalSuites: testSuites.length,
            passedSuites: 0,
            failedSuites: 0
        },
        suites: []
    };

    for (const [index, suite] of testSuites.entries()) {
        console.log(`📋 Running Test Suite ${index + 1}/${testSuites.length}: ${suite.name}`);
        console.log('--------------------------------------------------');
        
        try {
            // Execute the test suite
            const { execSync } = require('child_process');
            const output = execSync(`node ${suite.file}`, { 
                timeout: 60000, // 60 second timeout
                stdio: 'pipe',
                cwd: __dirname
            });
            
            // Parse the results from the test suite
            const resultsFile = path.join(__dirname, `${suite.file.split('.')[0].toUpperCase()}_RESULTS.json`);
            if (fs.existsSync(resultsFile)) {
                const suiteResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
                results.suites.push({
                    name: suite.name,
                    status: 'PASSED',
                    details: suiteResults
                });
                results.overall.passedSuites++;
                console.log(`✅ ${suite.name} completed successfully\n`);
            } else {
                results.suites.push({
                    name: suite.name,
                    status: 'PASSED',
                    details: { message: 'Test suite completed without detailed results' }
                });
                results.overall.passedSuites++;
                console.log(`✅ ${suite.name} completed successfully\n`);
            }
        } catch (error) {
            console.log(`❌ ${suite.name} failed:`, error.message);
            
            results.suites.push({
                name: suite.name,
                status: 'FAILED',
                error: error.message
            });
            results.overall.failedSuites++;
            
            // Try to read any partial results
            const resultsFile = path.join(__dirname, `${suite.file.split('.')[0].toUpperCase()}_RESULTS.json`);
            if (fs.existsSync(resultsFile)) {
                try {
                    const partialResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
                    results.suites[results.suites.length - 1].details = partialResults;
                } catch (parseError) {
                    console.log('Could not parse partial results:', parseError.message);
                }
            }
            
            console.log('');
        }
    }

    // Generate comprehensive report
    generateFinalReport(results);
    
    return results;
}

function generateFinalReport(results) {
    console.log('📊 Final Test Execution Report');
    console.log('==============================');
    console.log(`Total Test Suites: ${results.overall.totalSuites}`);
    console.log(`Passed Suites: ${results.overall.passedSuites}`);
    console.log(`Failed Suites: ${results.overall.failedSuites}`);
    console.log(`Success Rate: ${((results.overall.passedSuites / results.overall.totalSuites) * 100).toFixed(1)}%\n`);

    console.log('📋 Detailed Suite Results:');
    console.log('--------------------------');
    results.suites.forEach((suite, index) => {
        console.log(`${index + 1}. ${suite.name}: ${suite.status}`);
        if (suite.details) {
            if (suite.details.tests) {
                const passed = suite.details.passed || 0;
                const total = suite.details.total || 0;
                console.log(`   Tests: ${passed}/${total} passed (${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%)`);
            }
        }
        if (suite.error) {
            console.log(`   Error: ${suite.error}`);
        }
        console.log('');
    });

    // Save final report
    const reportPath = path.join(__dirname, 'COMPLETE_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`💾 Complete test report saved to: ${reportPath}`);

    // Generate HTML report
    generateHTMLReport(results);

    if (results.overall.failedSuites === 0) {
        console.log('\n🎉 All test suites completed successfully!');
    } else {
        console.log(`\n⚠️  ${results.overall.failedSuites} test suite(s) failed. Please review the results.`);
    }
}

function generateHTMLReport(results) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Farmer AI - Complete Test Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f7fa;
        }
        header {
            background: linear-gradient(135deg, #2c3e50, #3498db);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin-top: 10px;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            text-align: center;
            transition: transform 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
        }
        .card h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        .success-rate {
            font-size: 3em;
            font-weight: bold;
            color: #27ae60;
            margin: 10px 0;
        }
        .passed {
            color: #27ae60;
        }
        .failed {
            color: #e74c3c;
        }
        .total {
            color: #3498db;
        }
        .suite-results {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            margin-bottom: 30px;
        }
        .suite-results h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #e3f2fd;
        }
        .status {
            padding: 5px 10px;
            border-radius: 20px;
            font-weight: bold;
            text-align: center;
        }
        .status.PASSED {
            background-color: #d4edda;
            color: #155724;
        }
        .status.FAILED {
            background-color: #f8d7da;
            color: #721c24;
        }
        .status.SKIPPED {
            background-color: #fff3cd;
            color: #856404;
        }
        footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <header>
        <h1>Farmer AI Test Report</h1>
        <div class="subtitle">Complete Selenium Test Execution Results</div>
    </header>

    <div class="summary-cards">
        <div class="card">
            <h3>Total Suites</h3>
            <div class="total">${results.overall.totalSuites}</div>
        </div>
        <div class="card">
            <h3>Passed</h3>
            <div class="passed">${results.overall.passedSuites}</div>
        </div>
        <div class="card">
            <h3>Failed</h3>
            <div class="failed">${results.overall.failedSuites}</div>
        </div>
        <div class="card">
            <h3>Success Rate</h3>
            <div class="success-rate">${((results.overall.passedSuites / results.overall.totalSuites) * 100).toFixed(1)}%</div>
        </div>
    </div>

    <div class="suite-results">
        <h2>Test Suite Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Suite Name</th>
                    <th>Status</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${results.suites.map(suite => `
                <tr>
                    <td>${suite.name}</td>
                    <td><span class="status ${suite.status}">${suite.status}</span></td>
                    <td>${suite.details ? 
                        (suite.details.tests ? 
                            `${suite.details.passed || 0}/${suite.details.total || 0} tests passed` : 
                            'Completed') : 
                        (suite.error || 'No details available')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <footer>
        <p>Generated by Farmer AI Selenium Test Automation Framework</p>
        <p>Report generated at ${new Date().toISOString()}</p>
    </footer>
</body>
</html>`;

    const htmlReportPath = path.join(__dirname, 'COMPLETE_TEST_REPORT.html');
    fs.writeFileSync(htmlReportPath, htmlContent);
    console.log(`💾 HTML report saved to: ${htmlReportPath}`);
}

// Run all test suites
runAllTestSuites().catch(error => {
    console.error('💥 Error running test suites:', error);
    process.exit(1);
});