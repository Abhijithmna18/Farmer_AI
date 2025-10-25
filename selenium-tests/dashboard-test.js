const TestHelpers = require('./utils/test-helpers');
const testData = require('./config/test-data');

async function runDashboardTest() {
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
        console.log('🚀 Starting Dashboard Test Suite...');
        console.log('=================================\n');

        // Initialize TestHelpers
        console.log('🔍 Initializing Test Environment...');
        testHelpers = new TestHelpers();
        const driver = await testHelpers.initialize();
        console.log('✅ Test Environment Initialized\n');

        // First, login as a farmer to access dashboard
        console.log('🔐 Logging in as farmer...');
        await testHelpers.loginAsFarmer();
        console.log('✅ Logged in successfully\n');

        // Test 1: Dashboard Loading
        console.log('🧪 Test 1: Dashboard Loading');
        try {
            await testHelpers.navigateToDashboard();
            const hasDashboard = await testHelpers.webDriverManager.isElementPresent(testData.selectors.dashboard);
            const pageTitle = await testHelpers.webDriverManager.getPageTitle();
            
            if (hasDashboard && pageTitle.includes('Dashboard')) {
                recordTest('Dashboard Loading', 'PASSED', `Title: ${pageTitle}`);
            } else {
                recordTest('Dashboard Loading', 'FAILED', `Dashboard found: ${hasDashboard}, Title: ${pageTitle}`);
            }
        } catch (error) {
            recordTest('Dashboard Loading', 'FAILED', error.message);
        }

        // Test 2: Dashboard Elements
        console.log('\n🧪 Test 2: Dashboard Elements');
        try {
            const hasSidebar = await testHelpers.webDriverManager.isElementPresent(testData.selectors.sidebar);
            const hasDashboardCards = await testHelpers.webDriverManager.isElementPresent(testData.selectors.dashboardCards);
            const hasStatsCards = await testHelpers.webDriverManager.isElementPresent(testData.selectors.statsCards);
            const hasUserProfile = await testHelpers.webDriverManager.isElementPresent('.user-profile, .profile-info, [data-testid="user-profile"]');
            
            if (hasSidebar && hasDashboardCards && hasStatsCards && hasUserProfile) {
                recordTest('Dashboard Elements', 'PASSED');
            } else {
                recordTest('Dashboard Elements', 'FAILED', 
                    `Sidebar: ${hasSidebar}, Cards: ${hasDashboardCards}, Stats: ${hasStatsCards}, Profile: ${hasUserProfile}`);
            }
        } catch (error) {
            recordTest('Dashboard Elements', 'FAILED', error.message);
        }

        // Test 3: Navigation Menu
        console.log('\n🧪 Test 3: Navigation Menu');
        try {
            const navItems = [
                { selector: 'a[href="/dashboard"]', expectedUrl: '/dashboard' },
                { selector: 'a[href="/warehouses"]', expectedUrl: '/warehouses' },
                { selector: 'a[href="/farm-monitoring"]', expectedUrl: '/farm-monitoring' },
                { selector: 'a[href="/profile"]', expectedUrl: '/profile' }
            ];
            
            let allNavItemsFound = true;
            for (const item of navItems) {
                const isPresent = await testHelpers.webDriverManager.isElementPresent(item.selector);
                if (!isPresent) {
                    allNavItemsFound = false;
                    break;
                }
            }
            
            if (allNavItemsFound) {
                recordTest('Navigation Menu', 'PASSED', 'All navigation items found');
            } else {
                recordTest('Navigation Menu', 'WARNING', 'Some navigation items missing');
            }
        } catch (error) {
            recordTest('Navigation Menu', 'WARNING', error.message);
        }

        // Test 4: Dashboard Statistics
        console.log('\n🧪 Test 4: Dashboard Statistics');
        try {
            const hasFarmStats = await testHelpers.webDriverManager.isElementPresent('.farm-stats, .statistics, [data-testid="farm-stats"]');
            const hasRecentActivities = await testHelpers.webDriverManager.isElementPresent('.recent-activities, .activity-feed, [data-testid="recent-activities"]');
            const hasWeatherInfo = await testHelpers.webDriverManager.isElementPresent('.weather-info, .weather-widget, [data-testid="weather-info"]');
            
            // At least one of these should be present
            if (hasFarmStats || hasRecentActivities || hasWeatherInfo) {
                recordTest('Dashboard Statistics', 'PASSED', 'Some statistics elements found');
            } else {
                recordTest('Dashboard Statistics', 'WARNING', 'No statistics elements found');
            }
        } catch (error) {
            recordTest('Dashboard Statistics', 'WARNING', error.message);
        }

        // Test 5: Quick Actions
        console.log('\n🧪 Test 5: Quick Actions');
        try {
            const hasQuickActions = await testHelpers.webDriverManager.isElementPresent('.quick-actions, .action-buttons, [data-testid="quick-actions"]');
            const hasActionButtons = await testHelpers.webDriverManager.isElementPresent('button, .btn, [role="button"]');
            
            if (hasQuickActions || hasActionButtons) {
                recordTest('Quick Actions', 'PASSED', 'Action elements found');
            } else {
                recordTest('Quick Actions', 'WARNING', 'No action elements found');
            }
        } catch (error) {
            recordTest('Quick Actions', 'WARNING', error.message);
        }

        // Test 6: Charts and Graphs
        console.log('\n🧪 Test 6: Charts and Graphs');
        try {
            const hasCharts = await testHelpers.webDriverManager.isElementPresent(testData.selectors.chartContainer);
            
            if (hasCharts) {
                recordTest('Charts and Graphs', 'PASSED', 'Chart containers found');
            } else {
                recordTest('Charts and Graphs', 'WARNING', 'No chart containers found');
            }
        } catch (error) {
            recordTest('Charts and Graphs', 'WARNING', error.message);
        }

        // Test 7: Responsive Design
        console.log('\n🧪 Test 7: Responsive Design');
        try {
            // Test mobile viewport
            await testHelpers.webDriverManager.driver.manage().window().setRect({ width: 375, height: 667 });
            await testHelpers.webDriverManager.refresh();
            await testHelpers.webDriverManager.driver.sleep(2000);
            
            const hasMenuToggle = await testHelpers.webDriverManager.isElementPresent(testData.selectors.menuToggle);
            
            // Reset to normal viewport
            await testHelpers.webDriverManager.driver.manage().window().setRect({ 
                width: testData.windowWidth || 1920, 
                height: testData.windowHeight || 1080 
            });
            await testHelpers.webDriverManager.refresh();
            await testHelpers.webDriverManager.driver.sleep(2000);
            
            if (hasMenuToggle) {
                recordTest('Responsive Design', 'PASSED', 'Mobile menu toggle found');
            } else {
                recordTest('Responsive Design', 'WARNING', 'Mobile menu toggle not found');
            }
        } catch (error) {
            recordTest('Responsive Design', 'WARNING', error.message);
        }

        // Test 8: User Profile Information
        console.log('\n🧪 Test 8: User Profile Information');
        try {
            const hasUserProfile = await testHelpers.webDriverManager.isElementPresent('.user-profile, .profile-info, [data-testid="user-profile"]');
            const hasLogoutButton = await testHelpers.webDriverManager.isElementPresent('.logout-btn, [data-testid="logout-button"]');
            
            if (hasUserProfile || hasLogoutButton) {
                recordTest('User Profile Information', 'PASSED', 'Profile elements found');
            } else {
                recordTest('User Profile Information', 'WARNING', 'No profile elements found');
            }
        } catch (error) {
            recordTest('User Profile Information', 'WARNING', error.message);
        }

        // Test 9: Data Loading States
        console.log('\n🧪 Test 9: Data Loading States');
        try {
            // Refresh to trigger loading states
            await testHelpers.webDriverManager.refresh();
            await testHelpers.webDriverManager.driver.sleep(1000);
            
            // Check for loading indicators
            const hasLoadingSpinner = await testHelpers.webDriverManager.isElementPresent(testData.selectors.loadingSpinner);
            
            // Wait for loading to complete
            await testHelpers.webDriverManager.driver.sleep(3000);
            const hasDashboardContent = await testHelpers.webDriverManager.isElementPresent(testData.selectors.dashboardCards);
            
            if (hasDashboardContent) {
                recordTest('Data Loading States', 'PASSED', 'Dashboard content loaded');
            } else {
                recordTest('Data Loading States', 'WARNING', 'Dashboard content not loaded');
            }
        } catch (error) {
            recordTest('Data Loading States', 'WARNING', error.message);
        }

        // Test 10: Accessibility Features
        console.log('\n🧪 Test 10: Accessibility Features');
        try {
            const headings = await testHelpers.webDriverManager.driver.findElements('h1, h2, h3, h4, h5, h6');
            const hasHeadings = headings.length > 0;
            
            if (hasHeadings) {
                recordTest('Accessibility Features', 'PASSED', `${headings.length} heading elements found`);
            } else {
                recordTest('Accessibility Features', 'WARNING', 'No heading elements found');
            }
        } catch (error) {
            recordTest('Accessibility Features', 'WARNING', error.message);
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
        const resultsPath = path.join(__dirname, 'DASHBOARD_TEST_RESULTS.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Test results saved to: ${resultsPath}`);

        if (results.failed === 0) {
            console.log('\n🎉 All dashboard tests passed!');
        } else {
            console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the results.`);
        }
    }
}

// Run the test suite
runDashboardTest();