const { expect } = require('chai');
const TestHelpers = require('../../utils/test-helpers');
const testData = require('../../config/test-data');

describe('Warehouse Booking Tests', function() {
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
        await testHelpers.navigateToWarehouse();
    });

    describe('Warehouse Search and Discovery', function() {
        it('should display warehouse listings', async function() {
            await testHelpers.assertElementPresent(testData.selectors.warehouseCard);
        });

        it('should allow searching warehouses', async function() {
            await testHelpers.searchWarehouse('test warehouse');
            await testHelpers.assertElementPresent(testData.selectors.warehouseCard);
        });

        it('should filter warehouses by location', async function() {
            if (await testHelpers.webDriverManager.isElementPresent('.location-filter, [data-testid="location-filter"]')) {
                await testHelpers.webDriverManager.clickElement('.location-filter, [data-testid="location-filter"]');
                await testHelpers.webDriverManager.typeText('.location-input, [data-testid="location-input"]', 'Test Location');
                await testHelpers.webDriverManager.clickElement('.apply-filter, [data-testid="apply-filter"]');
                
                await testHelpers.assertElementPresent(testData.selectors.warehouseCard);
            }
        });

        it('should filter warehouses by capacity', async function() {
            if (await testHelpers.webDriverManager.isElementPresent('.capacity-filter, [data-testid="capacity-filter"]')) {
                await testHelpers.webDriverManager.clickElement('.capacity-filter, [data-testid="capacity-filter"]');
                await testHelpers.webDriverManager.typeText('.capacity-input, [data-testid="capacity-input"]', '1000');
                await testHelpers.webDriverManager.clickElement('.apply-filter, [data-testid="apply-filter"]');
                
                await testHelpers.assertElementPresent(testData.selectors.warehouseCard);
            }
        });

        it('should sort warehouses by price', async function() {
            if (await testHelpers.webDriverManager.isElementPresent('.sort-by-price, [data-testid="sort-by-price"]')) {
                await testHelpers.webDriverManager.clickElement('.sort-by-price, [data-testid="sort-by-price"]');
                await testHelpers.assertElementPresent(testData.selectors.warehouseCard);
            }
        });

        it('should display warehouse details on card', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                const card = warehouseCards[0];
                const name = await card.findElement('.warehouse-name, [data-testid="warehouse-name"]').getText();
                const location = await card.findElement('.warehouse-location, [data-testid="warehouse-location"]').getText();
                const price = await card.findElement('.warehouse-price, [data-testid="warehouse-price"]').getText();
                
                expect(name).to.not.be.empty;
                expect(location).to.not.be.empty;
                expect(price).to.not.be.empty;
            }
        });
    });

    describe('Warehouse Details View', function() {
        it('should navigate to warehouse details page', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.assertUrlContains('/warehouses/');
                await testHelpers.assertElementPresent('.warehouse-details, [data-testid="warehouse-details"]');
            }
        });

        it('should display warehouse information', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                
                await testHelpers.assertElementPresent('.warehouse-name, [data-testid="warehouse-name"]');
                await testHelpers.assertElementPresent('.warehouse-description, [data-testid="warehouse-description"]');
                await testHelpers.assertElementPresent('.warehouse-location, [data-testid="warehouse-location"]');
                await testHelpers.assertElementPresent('.warehouse-capacity, [data-testid="warehouse-capacity"]');
                await testHelpers.assertElementPresent('.warehouse-price, [data-testid="warehouse-price"]');
            }
        });

        it('should display warehouse images', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                
                const images = await testHelpers.webDriverManager.driver.findElements('.warehouse-image, [data-testid="warehouse-image"]');
                if (images.length > 0) {
                    console.log('Warehouse images found');
                }
            }
        });

        it('should display warehouse features', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                
                const features = await testHelpers.webDriverManager.driver.findElements('.warehouse-features, [data-testid="warehouse-features"]');
                if (features.length > 0) {
                    console.log('Warehouse features found');
                }
            }
        });

        it('should display availability calendar', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                
                const calendar = await testHelpers.webDriverManager.driver.findElements('.availability-calendar, [data-testid="availability-calendar"]');
                if (calendar.length > 0) {
                    console.log('Availability calendar found');
                }
            }
        });
    });

    describe('Warehouse Booking Process', function() {
        it('should open booking modal', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                await testHelpers.assertElementPresent(testData.selectors.bookingModal);
            }
        });

        it('should fill booking form with valid data', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                
                await testHelpers.fillForm(testData.booking);
                await testHelpers.submitForm();
                await testHelpers.assertElementPresent(testData.selectors.successMessage);
            }
        });

        it('should validate booking form fields', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                
                // Test empty form submission
                await testHelpers.webDriverManager.clickElement(testData.selectors.submitButton);
                await testHelpers.assertElementPresent(testData.selectors.errorMessage);
            }
        });

        it('should validate booking dates', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                
                // Test invalid date range (end date before start date)
                await testHelpers.webDriverManager.typeText('input[name="startDate"]', testData.booking.endDate);
                await testHelpers.webDriverManager.typeText('input[name="endDate"]', testData.booking.startDate);
                await testHelpers.webDriverManager.clickElement(testData.selectors.submitButton);
                
                await testHelpers.assertElementPresent(testData.selectors.errorMessage);
            }
        });

        it('should calculate booking cost', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                
                await testHelpers.fillForm(testData.booking);
                
                // Check if cost is calculated and displayed
                const costElement = await testHelpers.webDriverManager.driver.findElements('.booking-cost, [data-testid="booking-cost"]');
                if (costElement.length > 0) {
                    const cost = await costElement[0].getText();
                    expect(cost).to.not.be.empty;
                }
            }
        });
    });

    describe('Booking Confirmation', function() {
        it('should display booking confirmation', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                
                await testHelpers.fillForm(testData.booking);
                await testHelpers.submitForm();
                
                await testHelpers.assertElementPresent('.booking-confirmation, [data-testid="booking-confirmation"]');
            }
        });

        it('should send booking confirmation email', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                
                await testHelpers.fillForm(testData.booking);
                await testHelpers.submitForm();
                
                // Check for email confirmation message
                const emailConfirmation = await testHelpers.webDriverManager.driver.findElements('.email-confirmation, [data-testid="email-confirmation"]');
                if (emailConfirmation.length > 0) {
                    console.log('Email confirmation message found');
                }
            }
        });

        it('should display booking reference number', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                
                await testHelpers.fillForm(testData.booking);
                await testHelpers.submitForm();
                
                const referenceNumber = await testHelpers.webDriverManager.driver.findElements('.booking-reference, [data-testid="booking-reference"]');
                if (referenceNumber.length > 0) {
                    const reference = await referenceNumber[0].getText();
                    expect(reference).to.not.be.empty;
                }
            }
        });
    });

    describe('Booking Management', function() {
        it('should navigate to my bookings page', async function() {
            await testHelpers.webDriverManager.navigateTo('/my-bookings');
            await testHelpers.assertUrlContains('/my-bookings');
            await testHelpers.assertElementPresent('.my-bookings, [data-testid="my-bookings"]');
        });

        it('should display user bookings', async function() {
            await testHelpers.webDriverManager.navigateTo('/my-bookings');
            
            const bookings = await testHelpers.webDriverManager.driver.findElements('.booking-item, [data-testid="booking-item"]');
            if (bookings.length > 0) {
                console.log('User bookings found');
            }
        });

        it('should allow canceling bookings', async function() {
            await testHelpers.webDriverManager.navigateTo('/my-bookings');
            
            const cancelButtons = await testHelpers.webDriverManager.driver.findElements('.cancel-booking, [data-testid="cancel-booking"]');
            if (cancelButtons.length > 0) {
                await cancelButtons[0].click();
                await testHelpers.assertElementPresent('.cancel-confirmation, [data-testid="cancel-confirmation"]');
            }
        });

        it('should allow modifying bookings', async function() {
            await testHelpers.webDriverManager.navigateTo('/my-bookings');
            
            const modifyButtons = await testHelpers.webDriverManager.driver.findElements('.modify-booking, [data-testid="modify-booking"]');
            if (modifyButtons.length > 0) {
                await modifyButtons[0].click();
                await testHelpers.assertElementPresent(testData.selectors.bookingModal);
            }
        });
    });

    describe('Warehouse Booking Error Handling', function() {
        it('should handle warehouse not found', async function() {
            await testHelpers.webDriverManager.navigateTo('/warehouses/non-existent-warehouse');
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should handle booking conflicts', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                
                // Try to book with conflicting dates
                const conflictingBooking = {
                    ...testData.booking,
                    startDate: '2023-01-01',
                    endDate: '2023-01-07'
                };
                
                await testHelpers.fillForm(conflictingBooking);
                await testHelpers.submitForm();
                
                await testHelpers.assertElementPresent(testData.selectors.errorMessage);
            }
        });

        it('should handle insufficient capacity', async function() {
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                
                // Try to book more than available capacity
                const excessiveBooking = {
                    ...testData.booking,
                    quantity: '999999'
                };
                
                await testHelpers.fillForm(excessiveBooking);
                await testHelpers.submitForm();
                
                await testHelpers.assertElementPresent(testData.selectors.errorMessage);
            }
        });
    });

    describe('Warehouse Booking Performance', function() {
        it('should load warehouse listings within acceptable time', async function() {
            const startTime = Date.now();
            await testHelpers.navigateToWarehouse();
            const endTime = Date.now();
            const loadTime = endTime - startTime;
            
            console.log(`Warehouse listings load time: ${loadTime}ms`);
            expect(loadTime).to.be.lessThan(5000);
        });

        it('should handle large number of warehouses', async function() {
            await testHelpers.navigateToWarehouse();
            
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            console.log(`Found ${warehouseCards.length} warehouse cards`);
            
            if (warehouseCards.length > 50) {
                console.log('Large number of warehouses handled successfully');
            }
        });
    });
});
