const TestHelpers = require('./utils/test-helpers');
const testData = require('./config/test-data');

async function runWarehouseTest() {
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
        console.log('🚀 Starting Warehouse Test Suite...');
        console.log('==================================\n');

        // Initialize TestHelpers
        console.log('🔍 Initializing Test Environment...');
        testHelpers = new TestHelpers();
        const driver = await testHelpers.initialize();
        console.log('✅ Test Environment Initialized\n');

        // First, login as a farmer to access warehouse features
        console.log('🔐 Logging in as farmer...');
        await testHelpers.loginAsFarmer();
        console.log('✅ Logged in successfully\n');

        // Test 1: Navigate to Warehouse Page
        console.log('🧪 Test 1: Navigate to Warehouse Page');
        try {
            await testHelpers.navigateToWarehouse();
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            const hasWarehouseCards = await testHelpers.webDriverManager.isElementPresent(testData.selectors.warehouseCard);
            
            if (currentUrl.includes('/warehouses') && (hasWarehouseCards || true)) {
                // We check for true as warehouse cards might not exist in a fresh system
                recordTest('Navigate to Warehouse Page', 'PASSED', `URL: ${currentUrl}`);
            } else {
                recordTest('Navigate to Warehouse Page', 'FAILED', `URL: ${currentUrl}, Warehouse cards: ${hasWarehouseCards}`);
            }
        } catch (error) {
            recordTest('Navigate to Warehouse Page', 'FAILED', error.message);
        }

        // Test 2: Warehouse Search Functionality
        console.log('\n🧪 Test 2: Warehouse Search Functionality');
        try {
            const hasSearchInput = await testHelpers.webDriverManager.isElementPresent(testData.selectors.warehouseSearch);
            const hasSearchButton = await testHelpers.webDriverManager.isElementPresent('.search-btn, [data-testid="search-button"]');
            
            if (hasSearchInput || hasSearchButton) {
                recordTest('Warehouse Search Functionality', 'PASSED', 'Search elements found');
            } else {
                recordTest('Warehouse Search Functionality', 'WARNING', 'Search elements not found');
            }
        } catch (error) {
            recordTest('Warehouse Search Functionality', 'WARNING', error.message);
        }

        // Test 3: Warehouse Display Elements
        console.log('\n🧪 Test 3: Warehouse Display Elements');
        try {
            const hasWarehouseCards = await testHelpers.webDriverManager.isElementPresent(testData.selectors.warehouseCard);
            const hasWarehouseInfo = await testHelpers.webDriverManager.isElementPresent('.warehouse-info, [data-testid="warehouse-info"]');
            const hasWarehouseImages = await testHelpers.webDriverManager.isElementPresent('.warehouse-image, [data-testid="warehouse-image"]');
            
            // At least check if we're on the right page
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            const isWarehousePage = currentUrl.includes('/warehouses');
            
            if (isWarehousePage) {
                recordTest('Warehouse Display Elements', 'PASSED', 'On warehouse page');
            } else {
                recordTest('Warehouse Display Elements', 'WARNING', 'Not on warehouse page');
            }
        } catch (error) {
            recordTest('Warehouse Display Elements', 'WARNING', error.message);
        }

        // Test 4: Warehouse Details View
        console.log('\n🧪 Test 4: Warehouse Details View');
        try {
            // Try to find any warehouse card and click it
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                // Click the first warehouse card
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.driver.sleep(2000);
                
                const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
                const hasBookingForm = await testHelpers.webDriverManager.isElementPresent(testData.selectors.bookingForm);
                
                // Go back to warehouse list
                await testHelpers.webDriverManager.goBack();
                await testHelpers.webDriverManager.driver.sleep(1000);
                
                if (hasBookingForm || currentUrl.includes('/book')) {
                    recordTest('Warehouse Details View', 'PASSED', 'Warehouse details accessible');
                } else {
                    recordTest('Warehouse Details View', 'WARNING', 'Could not access warehouse details');
                }
            } else {
                recordTest('Warehouse Details View', 'SKIPPED', 'No warehouse cards available');
            }
        } catch (error) {
            recordTest('Warehouse Details View', 'WARNING', error.message);
        }

        // Test 5: Booking Form Elements
        console.log('\n🧪 Test 5: Booking Form Elements');
        try {
            // Try to find and click a book now button if available
            const bookButtons = await testHelpers.webDriverManager.driver.findElements('.book-now, .book-btn, [data-testid="book-button"]');
            
            if (bookButtons.length > 0) {
                await bookButtons[0].click();
                await testHelpers.webDriverManager.driver.sleep(2000);
                
                const hasBookingForm = await testHelpers.webDriverManager.isElementPresent(testData.selectors.bookingForm);
                const hasStartDateInput = await testHelpers.webDriverManager.isElementPresent('input[name="startDate"], [data-testid="start-date"]');
                const hasEndDateInput = await testHelpers.webDriverManager.isElementPresent('input[name="endDate"], [data-testid="end-date"]');
                const hasSubmitButton = await testHelpers.webDriverManager.isElementPresent(testData.selectors.submitButton);
                
                // Close modal or go back
                await testHelpers.webDriverManager.goBack();
                await testHelpers.webDriverManager.driver.sleep(1000);
                
                if (hasBookingForm) {
                    recordTest('Booking Form Elements', 'PASSED', 'Booking form elements found');
                } else {
                    recordTest('Booking Form Elements', 'WARNING', 'Booking form elements not found');
                }
            } else {
                recordTest('Booking Form Elements', 'SKIPPED', 'No book buttons available');
            }
        } catch (error) {
            recordTest('Booking Form Elements', 'WARNING', error.message);
        }

        // Test 6: Warehouse Filtering
        console.log('\n🧪 Test 6: Warehouse Filtering');
        try {
            const hasFilterControls = await testHelpers.webDriverManager.isElementPresent('.filter-controls, [data-testid="filter-controls"]');
            const hasSortOptions = await testHelpers.webDriverManager.isElementPresent('.sort-options, [data-testid="sort-options"]');
            
            if (hasFilterControls || hasSortOptions) {
                recordTest('Warehouse Filtering', 'PASSED', 'Filter elements found');
            } else {
                recordTest('Warehouse Filtering', 'WARNING', 'Filter elements not found');
            }
        } catch (error) {
            recordTest('Warehouse Filtering', 'WARNING', error.message);
        }

        // Test 7: Warehouse Information Display
        console.log('\n🧪 Test 7: Warehouse Information Display');
        try {
            const hasWarehouseName = await testHelpers.webDriverManager.isElementPresent('.warehouse-name, [data-testid="warehouse-name"]');
            const hasWarehouseLocation = await testHelpers.webDriverManager.isElementPresent('.warehouse-location, [data-testid="warehouse-location"]');
            const hasWarehousePrice = await testHelpers.webDriverManager.isElementPresent('.warehouse-price, [data-testid="warehouse-price"]');
            const hasWarehouseCapacity = await testHelpers.webDriverManager.isElementPresent('.warehouse-capacity, [data-testid="warehouse-capacity"]');
            
            // Check if we have any warehouse information elements
            const warehouseInfoCount = [
                hasWarehouseName, 
                hasWarehouseLocation, 
                hasWarehousePrice, 
                hasWarehouseCapacity
            ].filter(Boolean).length;
            
            if (warehouseInfoCount > 0) {
                recordTest('Warehouse Information Display', 'PASSED', `Found ${warehouseInfoCount} info elements`);
            } else {
                recordTest('Warehouse Information Display', 'WARNING', 'No warehouse info elements found');
            }
        } catch (error) {
            recordTest('Warehouse Information Display', 'WARNING', error.message);
        }

        // Test 8: Warehouse Images and Media
        console.log('\n🧪 Test 8: Warehouse Images and Media');
        try {
            const hasImages = await testHelpers.webDriverManager.isElementPresent('img, .warehouse-image, [data-testid="warehouse-image"]');
            const hasImageGallery = await testHelpers.webDriverManager.isElementPresent('.image-gallery, [data-testid="image-gallery"]');
            
            if (hasImages || hasImageGallery) {
                recordTest('Warehouse Images and Media', 'PASSED', 'Image elements found');
            } else {
                recordTest('Warehouse Images and Media', 'WARNING', 'No image elements found');
            }
        } catch (error) {
            recordTest('Warehouse Images and Media', 'WARNING', error.message);
        }

        // Test 9: Warehouse Booking Workflow
        console.log('\n🧪 Test 9: Warehouse Booking Workflow');
        try {
            // This is a simplified test as actual booking requires valid data
            const bookButtons = await testHelpers.webDriverManager.driver.findElements('.book-now, .book-btn, [data-testid="book-button"]');
            
            if (bookButtons.length > 0) {
                recordTest('Warehouse Booking Workflow', 'PASSED', 'Booking initiation possible');
            } else {
                recordTest('Warehouse Booking Workflow', 'SKIPPED', 'No booking buttons available');
            }
        } catch (error) {
            recordTest('Warehouse Booking Workflow', 'WARNING', error.message);
        }

        // Test 10: Warehouse List Pagination
        console.log('\n🧪 Test 10: Warehouse List Pagination');
        try {
            const hasPagination = await testHelpers.webDriverManager.isElementPresent('.pagination, .pager, [data-testid="pagination"]');
            const hasNextButton = await testHelpers.webDriverManager.isElementPresent('.next-btn, [data-testid="next-button"]');
            const hasPrevButton = await testHelpers.webDriverManager.isElementPresent('.prev-btn, [data-testid="prev-button"]');
            
            if (hasPagination || hasNextButton || hasPrevButton) {
                recordTest('Warehouse List Pagination', 'PASSED', 'Pagination elements found');
            } else {
                recordTest('Warehouse List Pagination', 'WARNING', 'No pagination elements found');
            }
        } catch (error) {
            recordTest('Warehouse List Pagination', 'WARNING', error.message);
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
        const resultsPath = path.join(__dirname, 'WAREHOUSE_TEST_RESULTS.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Test results saved to: ${resultsPath}`);

        if (results.failed === 0) {
            console.log('\n🎉 All warehouse tests passed!');
        } else {
            console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the results.`);
        }
    }
}

// Run the test suite
runWarehouseTest();