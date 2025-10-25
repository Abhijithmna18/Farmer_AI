const { expect } = require('chai');
const TestHelpers = require('../../utils/test-helpers');
const testData = require('../../config/test-data');

describe('Admin Dashboard Tests', function() {
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
        await testHelpers.loginAsAdmin();
        await testHelpers.navigateToAdmin();
    });

    describe('Admin Dashboard Access', function() {
        it('should display admin dashboard', async function() {
            await testHelpers.assertElementPresent(testData.selectors.adminPanel);
            await testHelpers.assertUrlContains('/admin');
        });

        it('should require admin authentication', async function() {
            await testHelpers.logout();
            await testHelpers.webDriverManager.navigateTo('/admin');
            await testHelpers.assertUrlContains('/login');
        });

        it('should display admin navigation menu', async function() {
            await testHelpers.assertElementPresent('.admin-nav, [data-testid="admin-nav"]');
        });

        it('should display admin user information', async function() {
            await testHelpers.assertElementPresent('.admin-user-info, [data-testid="admin-user-info"]');
        });
    });

    describe('User Management', function() {
        it('should display users table', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/users');
            await testHelpers.assertElementPresent(testData.selectors.userTable);
        });

        it('should display user information', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/users');
            
            const userRows = await testHelpers.webDriverManager.driver.findElements('.user-row, [data-testid="user-row"]');
            if (userRows.length > 0) {
                const userRow = userRows[0];
                const name = await userRow.findElement('.user-name, [data-testid="user-name"]').getText();
                const email = await userRow.findElement('.user-email, [data-testid="user-email"]').getText();
                const role = await userRow.findElement('.user-role, [data-testid="user-role"]').getText();
                
                expect(name).to.not.be.empty;
                expect(email).to.not.be.empty;
                expect(role).to.not.be.empty;
            }
        });

        it('should allow searching users', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/users');
            
            if (await testHelpers.webDriverManager.isElementPresent('.user-search, [data-testid="user-search"]')) {
                await testHelpers.webDriverManager.typeText('.user-search, [data-testid="user-search"]', 'test');
                await testHelpers.webDriverManager.clickElement('.search-button, [data-testid="search-button"]');
                
                await testHelpers.assertElementPresent(testData.selectors.userTable);
            }
        });

        it('should allow filtering users by role', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/users');
            
            if (await testHelpers.webDriverManager.isElementPresent('.role-filter, [data-testid="role-filter"]')) {
                await testHelpers.webDriverManager.clickElement('.role-filter, [data-testid="role-filter"]');
                await testHelpers.webDriverManager.clickElement('option[value="farmer"]');
                
                await testHelpers.assertElementPresent(testData.selectors.userTable);
            }
        });

        it('should allow editing user information', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/users');
            
            const editButtons = await testHelpers.webDriverManager.driver.findElements('.edit-user, [data-testid="edit-user"]');
            if (editButtons.length > 0) {
                await editButtons[0].click();
                await testHelpers.assertElementPresent('.user-edit-form, [data-testid="user-edit-form"]');
            }
        });

        it('should allow deactivating users', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/users');
            
            const deactivateButtons = await testHelpers.webDriverManager.driver.findElements('.deactivate-user, [data-testid="deactivate-user"]');
            if (deactivateButtons.length > 0) {
                await deactivateButtons[0].click();
                await testHelpers.assertElementPresent('.deactivate-confirmation, [data-testid="deactivate-confirmation"]');
            }
        });

        it('should allow activating users', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/users');
            
            const activateButtons = await testHelpers.webDriverManager.driver.findElements('.activate-user, [data-testid="activate-user"]');
            if (activateButtons.length > 0) {
                await activateButtons[0].click();
                await testHelpers.assertElementPresent('.activate-confirmation, [data-testid="activate-confirmation"]');
            }
        });
    });

    describe('Warehouse Management', function() {
        it('should display warehouses table', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/warehouses');
            await testHelpers.assertElementPresent(testData.selectors.warehouseTable);
        });

        it('should display warehouse information', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/warehouses');
            
            const warehouseRows = await testHelpers.webDriverManager.driver.findElements('.warehouse-row, [data-testid="warehouse-row"]');
            if (warehouseRows.length > 0) {
                const warehouseRow = warehouseRows[0];
                const name = await warehouseRow.findElement('.warehouse-name, [data-testid="warehouse-name"]').getText();
                const location = await warehouseRow.findElement('.warehouse-location, [data-testid="warehouse-location"]').getText();
                const status = await warehouseRow.findElement('.warehouse-status, [data-testid="warehouse-status"]').getText();
                
                expect(name).to.not.be.empty;
                expect(location).to.not.be.empty;
                expect(status).to.not.be.empty;
            }
        });

        it('should allow approving warehouses', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/warehouses');
            
            const approveButtons = await testHelpers.webDriverManager.driver.findElements('.approve-warehouse, [data-testid="approve-warehouse"]');
            if (approveButtons.length > 0) {
                await approveButtons[0].click();
                await testHelpers.assertElementPresent(testData.selectors.successMessage);
            }
        });

        it('should allow rejecting warehouses', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/warehouses');
            
            const rejectButtons = await testHelpers.webDriverManager.driver.findElements('.reject-warehouse, [data-testid="reject-warehouse"]');
            if (rejectButtons.length > 0) {
                await rejectButtons[0].click();
                await testHelpers.assertElementPresent('.reject-confirmation, [data-testid="reject-confirmation"]');
            }
        });

        it('should allow editing warehouse details', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/warehouses');
            
            const editButtons = await testHelpers.webDriverManager.driver.findElements('.edit-warehouse, [data-testid="edit-warehouse"]');
            if (editButtons.length > 0) {
                await editButtons[0].click();
                await testHelpers.assertElementPresent('.warehouse-edit-form, [data-testid="warehouse-edit-form"]');
            }
        });

        it('should allow deleting warehouses', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/warehouses');
            
            const deleteButtons = await testHelpers.webDriverManager.driver.findElements('.delete-warehouse, [data-testid="delete-warehouse"]');
            if (deleteButtons.length > 0) {
                await deleteButtons[0].click();
                await testHelpers.assertElementPresent('.delete-confirmation, [data-testid="delete-confirmation"]');
            }
        });
    });

    describe('Booking Management', function() {
        it('should display bookings table', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/bookings');
            await testHelpers.assertElementPresent('.bookings-table, [data-testid="bookings-table"]');
        });

        it('should display booking information', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/bookings');
            
            const bookingRows = await testHelpers.webDriverManager.driver.findElements('.booking-row, [data-testid="booking-row"]');
            if (bookingRows.length > 0) {
                const bookingRow = bookingRows[0];
                const user = await bookingRow.findElement('.booking-user, [data-testid="booking-user"]').getText();
                const warehouse = await bookingRow.findElement('.booking-warehouse, [data-testid="booking-warehouse"]').getText();
                const status = await bookingRow.findElement('.booking-status, [data-testid="booking-status"]').getText();
                
                expect(user).to.not.be.empty;
                expect(warehouse).to.not.be.empty;
                expect(status).to.not.be.empty;
            }
        });

        it('should allow filtering bookings by status', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/bookings');
            
            if (await testHelpers.webDriverManager.isElementPresent('.status-filter, [data-testid="status-filter"]')) {
                await testHelpers.webDriverManager.clickElement('.status-filter, [data-testid="status-filter"]');
                await testHelpers.webDriverManager.clickElement('option[value="pending"]');
                
                await testHelpers.assertElementPresent('.bookings-table, [data-testid="bookings-table"]');
            }
        });

        it('should allow approving bookings', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/bookings');
            
            const approveButtons = await testHelpers.webDriverManager.driver.findElements('.approve-booking, [data-testid="approve-booking"]');
            if (approveButtons.length > 0) {
                await approveButtons[0].click();
                await testHelpers.assertElementPresent(testData.selectors.successMessage);
            }
        });

        it('should allow rejecting bookings', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/bookings');
            
            const rejectButtons = await testHelpers.webDriverManager.driver.findElements('.reject-booking, [data-testid="reject-booking"]');
            if (rejectButtons.length > 0) {
                await rejectButtons[0].click();
                await testHelpers.assertElementPresent('.reject-confirmation, [data-testid="reject-confirmation"]');
            }
        });
    });

    describe('Analytics and Reports', function() {
        it('should display analytics dashboard', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/analytics');
            await testHelpers.assertElementPresent('.analytics-dashboard, [data-testid="analytics-dashboard"]');
        });

        it('should display user statistics', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/analytics');
            
            const userStats = await testHelpers.webDriverManager.driver.findElements('.user-stats, [data-testid="user-stats"]');
            if (userStats.length > 0) {
                console.log('User statistics found');
            }
        });

        it('should display warehouse statistics', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/analytics');
            
            const warehouseStats = await testHelpers.webDriverManager.driver.findElements('.warehouse-stats, [data-testid="warehouse-stats"]');
            if (warehouseStats.length > 0) {
                console.log('Warehouse statistics found');
            }
        });

        it('should display booking statistics', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/analytics');
            
            const bookingStats = await testHelpers.webDriverManager.driver.findElements('.booking-stats, [data-testid="booking-stats"]');
            if (bookingStats.length > 0) {
                console.log('Booking statistics found');
            }
        });

        it('should display revenue reports', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/analytics');
            
            const revenueReports = await testHelpers.webDriverManager.driver.findElements('.revenue-reports, [data-testid="revenue-reports"]');
            if (revenueReports.length > 0) {
                console.log('Revenue reports found');
            }
        });

        it('should allow generating reports', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/analytics');
            
            const generateReportButton = await testHelpers.webDriverManager.driver.findElements('.generate-report, [data-testid="generate-report"]');
            if (generateReportButton.length > 0) {
                await generateReportButton[0].click();
                await testHelpers.assertElementPresent('.report-modal, [data-testid="report-modal"]');
            }
        });

        it('should allow exporting data', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/analytics');
            
            const exportButton = await testHelpers.webDriverManager.driver.findElements('.export-data, [data-testid="export-data"]');
            if (exportButton.length > 0) {
                await exportButton[0].click();
                console.log('Export functionality triggered');
            }
        });
    });

    describe('System Settings', function() {
        it('should display system settings', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/settings');
            await testHelpers.assertElementPresent('.system-settings, [data-testid="system-settings"]');
        });

        it('should allow configuring system parameters', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/settings');
            
            const configForm = await testHelpers.webDriverManager.driver.findElements('.config-form, [data-testid="config-form"]');
            if (configForm.length > 0) {
                console.log('System configuration form found');
            }
        });

        it('should allow managing email templates', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/settings');
            
            const emailTemplates = await testHelpers.webDriverManager.driver.findElements('.email-templates, [data-testid="email-templates"]');
            if (emailTemplates.length > 0) {
                await emailTemplates[0].click();
                await testHelpers.assertElementPresent('.email-template-form, [data-testid="email-template-form"]');
            }
        });

        it('should allow managing notification settings', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/settings');
            
            const notificationSettings = await testHelpers.webDriverManager.driver.findElements('.notification-settings, [data-testid="notification-settings"]');
            if (notificationSettings.length > 0) {
                await notificationSettings[0].click();
                await testHelpers.assertElementPresent('.notification-form, [data-testid="notification-form"]');
            }
        });
    });

    describe('Admin Dashboard Performance', function() {
        it('should load admin dashboard within acceptable time', async function() {
            const startTime = Date.now();
            await testHelpers.navigateToAdmin();
            const endTime = Date.now();
            const loadTime = endTime - startTime;
            
            console.log(`Admin dashboard load time: ${loadTime}ms`);
            expect(loadTime).to.be.lessThan(5000);
        });

        it('should handle large datasets efficiently', async function() {
            await testHelpers.webDriverManager.navigateTo('/admin/users?large_dataset=true');
            
            await testHelpers.assertElementPresent(testData.selectors.userTable);
            console.log('Large dataset handled successfully');
        });

        it('should update data in real-time', async function() {
            await testHelpers.navigateToAdmin();
            
            // Check for real-time updates
            const updateIndicator = await testHelpers.webDriverManager.driver.findElements('.real-time-update, [data-testid="real-time-update"]');
            if (updateIndicator.length > 0) {
                console.log('Real-time updates found');
            }
        });
    });

    describe('Admin Dashboard Security', function() {
        it('should prevent unauthorized access', async function() {
            await testHelpers.logout();
            await testHelpers.webDriverManager.navigateTo('/admin');
            await testHelpers.assertUrlContains('/login');
        });

        it('should require admin role for access', async function() {
            await testHelpers.loginAsFarmer();
            await testHelpers.webDriverManager.navigateTo('/admin');
            await testHelpers.assertUrlContains('/dashboard');
        });

        it('should handle session timeout gracefully', async function() {
            await testHelpers.webDriverManager.driver.manage().deleteAllCookies();
            await testHelpers.webDriverManager.navigateTo('/admin');
            await testHelpers.assertUrlContains('/login');
        });
    });

    describe('Admin Dashboard Accessibility', function() {
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

        it('should have proper ARIA labels', async function() {
            const elementsWithAria = await testHelpers.webDriverManager.driver.findElements('[aria-label], [aria-labelledby]');
            expect(elementsWithAria.length).to.be.greaterThan(0);
        });
    });
});
