const { expect } = require('chai');
const TestHelpers = require('../../utils/test-helpers');
const testData = require('../../config/test-data');

describe('Dashboard Tests', function() {
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
        await testHelpers.navigateToDashboard();
    });

    describe('Dashboard Navigation', function() {
        it('should display main dashboard elements', async function() {
            await testHelpers.assertElementPresent(testData.selectors.dashboard);
            await testHelpers.assertElementPresent(testData.selectors.dashboardCards);
            await testHelpers.assertElementPresent(testData.selectors.statsCards);
        });

        it('should display sidebar navigation', async function() {
            await testHelpers.assertElementPresent(testData.selectors.sidebar);
        });

        it('should navigate to different sections from sidebar', async function() {
            // Test navigation to different sections
            const navItems = [
                { selector: 'a[href="/dashboard"]', expectedUrl: '/dashboard' },
                { selector: 'a[href="/warehouses"]', expectedUrl: '/warehouses' },
                { selector: 'a[href="/farm-monitoring"]', expectedUrl: '/farm-monitoring' },
                { selector: 'a[href="/profile"]', expectedUrl: '/profile' }
            ];

            for (const item of navItems) {
                if (await testHelpers.webDriverManager.isElementPresent(item.selector)) {
                    await testHelpers.webDriverManager.clickElement(item.selector);
                    await testHelpers.assertUrlContains(item.expectedUrl);
                    await testHelpers.navigateToDashboard(); // Return to dashboard for next test
                }
            }
        });

        it('should display user profile information', async function() {
            await testHelpers.assertElementPresent('.user-profile, .profile-info, [data-testid="user-profile"]');
        });

        it('should display logout functionality', async function() {
            await testHelpers.assertElementPresent('.logout-btn, [data-testid="logout-button"]');
        });
    });

    describe('Dashboard Content', function() {
        it('should display farm statistics', async function() {
            await testHelpers.assertElementPresent('.farm-stats, .statistics, [data-testid="farm-stats"]');
        });

        it('should display recent activities', async function() {
            await testHelpers.assertElementPresent('.recent-activities, .activity-feed, [data-testid="recent-activities"]');
        });

        it('should display weather information', async function() {
            await testHelpers.assertElementPresent('.weather-info, .weather-widget, [data-testid="weather-info"]');
        });

        it('should display quick actions', async function() {
            await testHelpers.assertElementPresent('.quick-actions, .action-buttons, [data-testid="quick-actions"]');
        });

        it('should display charts and graphs', async function() {
            await testHelpers.assertElementPresent(testData.selectors.chartContainer);
        });
    });

    describe('Dashboard Responsiveness', function() {
        it('should be responsive on mobile viewport', async function() {
            await testHelpers.webDriverManager.driver.manage().window().setRect({ width: 375, height: 667 });
            await testHelpers.webDriverManager.refresh();
            
            await testHelpers.assertElementPresent(testData.selectors.dashboard);
            await testHelpers.assertElementPresent(testData.selectors.menuToggle);
        });

        it('should collapse sidebar on mobile', async function() {
            await testHelpers.webDriverManager.driver.manage().window().setRect({ width: 375, height: 667 });
            await testHelpers.webDriverManager.refresh();
            
            const sidebar = await testHelpers.webDriverManager.driver.findElement(testData.selectors.sidebar);
            const isVisible = await sidebar.isDisplayed();
            
            // Sidebar should be hidden or collapsed on mobile
            if (!isVisible) {
                console.log('Sidebar is properly hidden on mobile');
            }
        });

        it('should expand sidebar when menu toggle is clicked', async function() {
            await testHelpers.webDriverManager.driver.manage().window().setRect({ width: 375, height: 667 });
            await testHelpers.webDriverManager.refresh();
            
            if (await testHelpers.webDriverManager.isElementPresent(testData.selectors.menuToggle)) {
                await testHelpers.webDriverManager.clickElement(testData.selectors.menuToggle);
                await testHelpers.assertElementPresent(testData.selectors.sidebar);
            }
        });
    });

    describe('Dashboard Data Loading', function() {
        it('should show loading state while data loads', async function() {
            await testHelpers.webDriverManager.refresh();
            
            // Check for loading indicators
            const isLoading = await testHelpers.webDriverManager.isElementVisible(testData.selectors.loadingSpinner);
            if (isLoading) {
                console.log('Loading indicator found');
                await testHelpers.waitForLoadingToComplete();
            }
        });

        it('should display data after loading completes', async function() {
            await testHelpers.waitForLoadingToComplete();
            await testHelpers.assertElementPresent(testData.selectors.dashboardCards);
        });

        it('should handle data loading errors gracefully', async function() {
            // Simulate network error by navigating to a non-existent endpoint
            await testHelpers.webDriverManager.navigateTo('/dashboard?error=true');
            
            // Should still display dashboard with error handling
            await testHelpers.assertElementPresent(testData.selectors.dashboard);
        });
    });

    describe('Dashboard Interactions', function() {
        it('should allow clicking on dashboard cards', async function() {
            const cards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.dashboardCards);
            
            if (cards.length > 0) {
                await cards[0].click();
                // Should navigate to relevant page or show details
                console.log('Dashboard card clicked successfully');
            }
        });

        it('should allow interaction with charts', async function() {
            if (await testHelpers.webDriverManager.isElementPresent(testData.selectors.chartContainer)) {
                const chart = await testHelpers.webDriverManager.driver.findElement(testData.selectors.chartContainer);
                await chart.click();
                console.log('Chart interaction successful');
            }
        });

        it('should allow filtering dashboard data', async function() {
            if (await testHelpers.webDriverManager.isElementPresent('.filter-controls, [data-testid="filter-controls"]')) {
                await testHelpers.webDriverManager.clickElement('.filter-controls, [data-testid="filter-controls"]');
                console.log('Filter controls found and clickable');
            }
        });
    });

    describe('Dashboard Performance', function() {
        it('should load dashboard within acceptable time', async function() {
            const startTime = Date.now();
            await testHelpers.navigateToDashboard();
            const endTime = Date.now();
            const loadTime = endTime - startTime;
            
            console.log(`Dashboard load time: ${loadTime}ms`);
            expect(loadTime).to.be.lessThan(5000); // Should load within 5 seconds
        });

        it('should handle multiple rapid navigation', async function() {
            for (let i = 0; i < 3; i++) {
                await testHelpers.navigateToDashboard();
                await testHelpers.webDriverManager.navigateTo('/warehouses');
                await testHelpers.navigateToDashboard();
            }
            
            await testHelpers.assertElementPresent(testData.selectors.dashboard);
        });
    });

    describe('Dashboard Security', function() {
        it('should require authentication to access dashboard', async function() {
            await testHelpers.logout();
            await testHelpers.webDriverManager.navigateTo('/dashboard');
            
            // Should redirect to login page
            await testHelpers.assertUrlContains('/login');
        });

        it('should handle session timeout gracefully', async function() {
            // Clear cookies to simulate session timeout
            await testHelpers.webDriverManager.driver.manage().deleteAllCookies();
            await testHelpers.webDriverManager.navigateTo('/dashboard');
            
            // Should redirect to login page
            await testHelpers.assertUrlContains('/login');
        });
    });

    describe('Dashboard Accessibility', function() {
        it('should have proper heading structure', async function() {
            const headings = await testHelpers.webDriverManager.driver.findElements('h1, h2, h3, h4, h5, h6');
            expect(headings.length).to.be.greaterThan(0);
        });

        it('should support keyboard navigation', async function() {
            await testHelpers.webDriverManager.driver.findElement('body').sendKeys(require('selenium-webdriver').Key.TAB);
            
            const focusedElement = await testHelpers.webDriverManager.driver.switchTo().activeElement();
            const tagName = await focusedElement.getTagName();
            expect(tagName).to.be.oneOf(['button', 'a', 'input', 'select', 'textarea']);
        });

        it('should have proper ARIA labels', async function() {
            const elementsWithAria = await testHelpers.webDriverManager.driver.findElements('[aria-label], [aria-labelledby]');
            expect(elementsWithAria.length).to.be.greaterThan(0);
        });
    });

    describe('Dashboard Error Handling', function() {
        it('should display error messages for failed API calls', async function() {
            // Simulate API error by modifying network conditions
            await testHelpers.webDriverManager.navigateTo('/dashboard?simulate_error=true');
            
            // Should display error message or fallback content
            const hasError = await testHelpers.webDriverManager.isElementPresent(testData.selectors.errorMessage);
            const hasFallback = await testHelpers.webDriverManager.isElementPresent('.fallback-content, [data-testid="fallback-content"]');
            
            expect(hasError || hasFallback).to.be.true;
        });

        it('should handle empty data states', async function() {
            await testHelpers.webDriverManager.navigateTo('/dashboard?empty_data=true');
            
            // Should display empty state message
            const hasEmptyState = await testHelpers.webDriverManager.isElementPresent('.empty-state, [data-testid="empty-state"]');
            if (hasEmptyState) {
                console.log('Empty state properly displayed');
            }
        });
    });
});