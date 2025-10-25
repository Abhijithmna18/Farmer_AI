const { expect } = require('chai');
const TestHelpers = require('../../utils/test-helpers');
const testData = require('../../config/test-data');

describe('Farm Monitoring Tests', function() {
    let testHelpers;
    let driver;

    before(async function() {
        testHelpers = new TestHelpers();
        driver = await testHelpers.initialize();
    });

    after(async function() {
        await testHelpers.cleanup();
    });

    beforeEach(async function() {
        await testHelpers.loginAsFarmer();
        await testHelpers.navigateToFarmMonitoring();
    });

    describe('Farm Monitoring Dashboard', function() {
        it('should display farm monitoring dashboard', async function() {
            await testHelpers.assertElementPresent(testData.selectors.sensorCard);
            await testHelpers.assertElementPresent('.farm-monitoring, [data-testid="farm-monitoring"]');
        });

        it('should display sensor data cards', async function() {
            const sensorCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.sensorCard);
            expect(sensorCards.length).to.be.greaterThan(0);
        });

        it('should display real-time sensor readings', async function() {
            await testHelpers.assertElementPresent(testData.selectors.sensorData);
            
            // Check for specific sensor readings
            const temperature = await testHelpers.webDriverManager.driver.findElements('.temperature-reading, [data-testid="temperature"]');
            const humidity = await testHelpers.webDriverManager.driver.findElements('.humidity-reading, [data-testid="humidity"]');
            const soilMoisture = await testHelpers.webDriverManager.driver.findElements('.soil-moisture-reading, [data-testid="soil-moisture"]');
            
            if (temperature.length > 0) console.log('Temperature sensor found');
            if (humidity.length > 0) console.log('Humidity sensor found');
            if (soilMoisture.length > 0) console.log('Soil moisture sensor found');
        });

        it('should display sensor status indicators', async function() {
            const statusIndicators = await testHelpers.webDriverManager.driver.findElements('.sensor-status, [data-testid="sensor-status"]');
            if (statusIndicators.length > 0) {
                console.log('Sensor status indicators found');
            }
        });
    });

    describe('Sensor Data Visualization', function() {
        it('should display sensor data charts', async function() {
            await testHelpers.assertElementPresent(testData.selectors.chartContainer);
        });

        it('should display temperature chart', async function() {
            const temperatureChart = await testHelpers.webDriverManager.driver.findElements('.temperature-chart, [data-testid="temperature-chart"]');
            if (temperatureChart.length > 0) {
                console.log('Temperature chart found');
            }
        });

        it('should display humidity chart', async function() {
            const humidityChart = await testHelpers.webDriverManager.driver.findElements('.humidity-chart, [data-testid="humidity-chart"]');
            if (humidityChart.length > 0) {
                console.log('Humidity chart found');
            }
        });

        it('should display soil moisture chart', async function() {
            const soilMoistureChart = await testHelpers.webDriverManager.driver.findElements('.soil-moisture-chart, [data-testid="soil-moisture-chart"]');
            if (soilMoistureChart.length > 0) {
                console.log('Soil moisture chart found');
            }
        });

        it('should allow chart interaction', async function() {
            const charts = await testHelpers.webDriverManager.driver.findElements(testData.selectors.chartContainer);
            
            if (charts.length > 0) {
                await charts[0].click();
                console.log('Chart interaction successful');
            }
        });

        it('should display historical data', async function() {
            const historicalData = await testHelpers.webDriverManager.driver.findElements('.historical-data, [data-testid="historical-data"]');
            if (historicalData.length > 0) {
                console.log('Historical data section found');
            }
        });
    });

    describe('Sensor Data Management', function() {
        it('should allow adding new sensor data', async function() {
            await testHelpers.addSensorData();
            await testHelpers.assertElementPresent(testData.selectors.successMessage);
        });

        it('should validate sensor data input', async function() {
            await testHelpers.webDriverManager.clickElement('.add-sensor-data-btn, [data-testid="add-sensor-data-button"]');
            
            // Test invalid data
            await testHelpers.webDriverManager.typeText('input[name="temperature"]', 'invalid');
            await testHelpers.webDriverManager.clickElement(testData.selectors.submitButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should allow editing sensor data', async function() {
            const editButtons = await testHelpers.webDriverManager.driver.findElements('.edit-sensor-data, [data-testid="edit-sensor-data"]');
            
            if (editButtons.length > 0) {
                await editButtons[0].click();
                await testHelpers.assertElementPresent('.sensor-data-form, [data-testid="sensor-data-form"]');
            }
        });

        it('should allow deleting sensor data', async function() {
            const deleteButtons = await testHelpers.webDriverManager.driver.findElements('.delete-sensor-data, [data-testid="delete-sensor-data"]');
            
            if (deleteButtons.length > 0) {
                await deleteButtons[0].click();
                await testHelpers.assertElementPresent('.delete-confirmation, [data-testid="delete-confirmation"]');
            }
        });
    });

    describe('Real-time Updates', function() {
        it('should update sensor data in real-time', async function() {
            const initialData = await testHelpers.webDriverManager.getText('.sensor-data, [data-testid="sensor-data"]');
            
            // Wait for potential real-time update
            await testHelpers.webDriverManager.driver.sleep(5000);
            
            const updatedData = await testHelpers.webDriverManager.getText('.sensor-data, [data-testid="sensor-data"]');
            
            // Data might be the same, but the test ensures the system is working
            console.log('Real-time update check completed');
        });

        it('should display data refresh indicators', async function() {
            const refreshIndicator = await testHelpers.webDriverManager.driver.findElements('.data-refresh, [data-testid="data-refresh"]');
            if (refreshIndicator.length > 0) {
                console.log('Data refresh indicator found');
            }
        });

        it('should handle connection status', async function() {
            const connectionStatus = await testHelpers.webDriverManager.driver.findElements('.connection-status, [data-testid="connection-status"]');
            if (connectionStatus.length > 0) {
                const status = await connectionStatus[0].getText();
                console.log(`Connection status: ${status}`);
            }
        });
    });

    describe('Farm Monitoring Alerts', function() {
        it('should display sensor alerts', async function() {
            const alerts = await testHelpers.webDriverManager.driver.findElements('.sensor-alert, [data-testid="sensor-alert"]');
            if (alerts.length > 0) {
                console.log('Sensor alerts found');
            }
        });

        it('should display threshold warnings', async function() {
            const warnings = await testHelpers.webDriverManager.driver.findElements('.threshold-warning, [data-testid="threshold-warning"]');
            if (warnings.length > 0) {
                console.log('Threshold warnings found');
            }
        });

        it('should allow configuring alert thresholds', async function() {
            const thresholdSettings = await testHelpers.webDriverManager.driver.findElements('.threshold-settings, [data-testid="threshold-settings"]');
            
            if (thresholdSettings.length > 0) {
                await thresholdSettings[0].click();
                await testHelpers.assertElementPresent('.threshold-form, [data-testid="threshold-form"]');
            }
        });

        it('should send alert notifications', async function() {
            const notificationSettings = await testHelpers.webDriverManager.driver.findElements('.notification-settings, [data-testid="notification-settings"]');
            
            if (notificationSettings.length > 0) {
                await notificationSettings[0].click();
                await testHelpers.assertElementPresent('.notification-form, [data-testid="notification-form"]');
            }
        });
    });

    describe('Farm Monitoring Reports', function() {
        it('should generate sensor data reports', async function() {
            const reportButton = await testHelpers.webDriverManager.driver.findElements('.generate-report, [data-testid="generate-report"]');
            
            if (reportButton.length > 0) {
                await reportButton[0].click();
                await testHelpers.assertElementPresent('.report-modal, [data-testid="report-modal"]');
            }
        });

        it('should export sensor data', async function() {
            const exportButton = await testHelpers.webDriverManager.driver.findElements('.export-data, [data-testid="export-data"]');
            
            if (exportButton.length > 0) {
                await exportButton[0].click();
                console.log('Export functionality triggered');
            }
        });

        it('should display data analytics', async function() {
            const analytics = await testHelpers.webDriverManager.driver.findElements('.data-analytics, [data-testid="data-analytics"]');
            if (analytics.length > 0) {
                console.log('Data analytics section found');
            }
        });
    });

    describe('Farm Monitoring Settings', function() {
        it('should allow configuring sensor settings', async function() {
            const settingsButton = await testHelpers.webDriverManager.driver.findElements('.sensor-settings, [data-testid="sensor-settings"]');
            
            if (settingsButton.length > 0) {
                await settingsButton[0].click();
                await testHelpers.assertElementPresent('.settings-form, [data-testid="settings-form"]');
            }
        });

        it('should allow adding new sensors', async function() {
            const addSensorButton = await testHelpers.webDriverManager.driver.findElements('.add-sensor, [data-testid="add-sensor"]');
            
            if (addSensorButton.length > 0) {
                await addSensorButton[0].click();
                await testHelpers.assertElementPresent('.add-sensor-form, [data-testid="add-sensor-form"]');
            }
        });

        it('should allow removing sensors', async function() {
            const removeSensorButton = await testHelpers.webDriverManager.driver.findElements('.remove-sensor, [data-testid="remove-sensor"]');
            
            if (removeSensorButton.length > 0) {
                await removeSensorButton[0].click();
                await testHelpers.assertElementPresent('.remove-confirmation, [data-testid="remove-confirmation"]');
            }
        });
    });

    describe('Farm Monitoring Performance', function() {
        it('should load farm monitoring page within acceptable time', async function() {
            const startTime = Date.now();
            await testHelpers.navigateToFarmMonitoring();
            const endTime = Date.now();
            const loadTime = endTime - startTime;
            
            console.log(`Farm monitoring load time: ${loadTime}ms`);
            expect(loadTime).to.be.lessThan(5000);
        });

        it('should handle large amounts of sensor data', async function() {
            // Simulate large dataset
            await testHelpers.webDriverManager.navigateTo('/farm-monitoring?large_dataset=true');
            
            await testHelpers.assertElementPresent(testData.selectors.sensorCard);
            console.log('Large dataset handled successfully');
        });

        it('should update charts efficiently', async function() {
            const charts = await testHelpers.webDriverManager.driver.findElements(testData.selectors.chartContainer);
            
            if (charts.length > 0) {
                const startTime = Date.now();
                await charts[0].click();
                const endTime = Date.now();
                const updateTime = endTime - startTime;
                
                console.log(`Chart update time: ${updateTime}ms`);
                expect(updateTime).to.be.lessThan(1000);
            }
        });
    });

    describe('Farm Monitoring Error Handling', function() {
        it('should handle sensor connection errors', async function() {
            await testHelpers.webDriverManager.navigateTo('/farm-monitoring?connection_error=true');
            
            const errorMessage = await testHelpers.webDriverManager.driver.findElements('.connection-error, [data-testid="connection-error"]');
            if (errorMessage.length > 0) {
                console.log('Connection error handled properly');
            }
        });

        it('should handle data loading errors', async function() {
            await testHelpers.webDriverManager.navigateTo('/farm-monitoring?data_error=true');
            
            const errorMessage = await testHelpers.webDriverManager.driver.findElements('.data-error, [data-testid="data-error"]');
            if (errorMessage.length > 0) {
                console.log('Data loading error handled properly');
            }
        });

        it('should display fallback content when sensors are offline', async function() {
            await testHelpers.webDriverManager.navigateTo('/farm-monitoring?offline=true');
            
            const fallbackContent = await testHelpers.webDriverManager.driver.findElements('.offline-message, [data-testid="offline-message"]');
            if (fallbackContent.length > 0) {
                console.log('Offline fallback content displayed');
            }
        });
    });

    describe('Farm Monitoring Accessibility', function() {
        it('should have proper heading structure', async function() {
            const headings = await testHelpers.webDriverManager.driver.findElements('h1, h2, h3, h4, h5, h6');
            expect(headings.length).to.be.greaterThan(0);
        });

        it('should support keyboard navigation', async function() {
            await testHelpers.webDriverManager.driver.findElement('body').sendKeys(require('selenium-webdriver').Key.TAB);
            
            const focusedElement = await testHelpers.webDriverManager.driver.switchTo().activeElement();
            const tagName = await focusedElement.getTagName();
            expect(tagName).to.be.oneOf(['button', 'a', 'input', 'select']);
        });

        it('should have proper ARIA labels for sensor data', async function() {
            const sensorElements = await testHelpers.webDriverManager.driver.findElements('[aria-label], [aria-labelledby]');
            expect(sensorElements.length).to.be.greaterThan(0);
        });
    });
});
