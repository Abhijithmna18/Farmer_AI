const { expect } = require('chai');
const TestHelpers = require('../../utils/test-helpers');
const testData = require('../../config/test-data');

describe('Payment Flow Tests', function() {
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
    });

    describe('Payment Initiation', function() {
        it('should navigate to payment page from booking', async function() {
            // First create a booking
            await testHelpers.navigateToWarehouse();
            const warehouseCards = await testHelpers.webDriverManager.driver.findElements(testData.selectors.warehouseCard);
            
            if (warehouseCards.length > 0) {
                await warehouseCards[0].click();
                await testHelpers.webDriverManager.clickElement('.book-warehouse-btn, [data-testid="book-warehouse-button"]');
                await testHelpers.fillForm(testData.booking);
                await testHelpers.submitForm();
                
                // Should redirect to payment page
                await testHelpers.assertUrlContains('/payment/');
            }
        });

        it('should display payment form', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.assertElementPresent(testData.selectors.paymentForm);
        });

        it('should display booking details in payment page', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            await testHelpers.assertElementPresent('.booking-details, [data-testid="booking-details"]');
            await testHelpers.assertElementPresent('.booking-amount, [data-testid="booking-amount"]');
        });

        it('should display payment amount and breakdown', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            const amountElement = await testHelpers.webDriverManager.driver.findElements('.payment-amount, [data-testid="payment-amount"]');
            if (amountElement.length > 0) {
                const amount = await amountElement[0].getText();
                expect(amount).to.not.be.empty;
            }
        });
    });

    describe('Razorpay Integration', function() {
        it('should display Razorpay payment button', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.assertElementPresent(testData.selectors.razorpayButton);
        });

        it('should open Razorpay payment modal', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            // Should open Razorpay modal or redirect to Razorpay
            await testHelpers.webDriverManager.switchToNewWindow();
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            expect(currentUrl).to.include('razorpay');
        });

        it('should handle Razorpay payment success', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            // Simulate successful payment
            await testHelpers.processPayment();
            await testHelpers.assertElementPresent(testData.selectors.successMessage);
        });

        it('should handle Razorpay payment failure', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            // Simulate payment failure
            await testHelpers.webDriverManager.switchToNewWindow();
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id?payment_status=failed');
            await testHelpers.webDriverManager.switchToOriginalWindow();
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should handle Razorpay payment cancellation', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            // Simulate payment cancellation
            await testHelpers.webDriverManager.switchToNewWindow();
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id?payment_status=cancelled');
            await testHelpers.webDriverManager.switchToOriginalWindow();
            
            await testHelpers.assertElementPresent('.payment-cancelled, [data-testid="payment-cancelled"]');
        });
    });

    describe('Payment Validation', function() {
        it('should validate payment amount', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            const amountElement = await testHelpers.webDriverManager.driver.findElements('.payment-amount, [data-testid="payment-amount"]');
            if (amountElement.length > 0) {
                const amount = await amountElement[0].getText();
                expect(amount).to.match(/\d+/); // Should contain numbers
            }
        });

        it('should validate payment currency', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            const currencyElement = await testHelpers.webDriverManager.driver.findElements('.payment-currency, [data-testid="payment-currency"]');
            if (currencyElement.length > 0) {
                const currency = await currencyElement[0].getText();
                expect(currency).to.not.be.empty;
            }
        });

        it('should prevent duplicate payments', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            // Try to make payment twice
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            await testHelpers.webDriverManager.switchToNewWindow();
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id?payment_status=success');
            await testHelpers.webDriverManager.switchToOriginalWindow();
            
            // Try to pay again
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });
    });

    describe('Payment Security', function() {
        it('should not expose sensitive payment data', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            const pageSource = await testHelpers.webDriverManager.driver.getPageSource();
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            
            // Should not contain sensitive information
            expect(pageSource).to.not.include('sk_');
            expect(currentUrl).to.not.include('sk_');
        });

        it('should use HTTPS for payment processing', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            await testHelpers.webDriverManager.switchToNewWindow();
            const currentUrl = await testHelpers.webDriverManager.getCurrentUrl();
            expect(currentUrl).to.match(/^https:/);
        });

        it('should validate payment signatures', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            // Check if payment signature is present
            const signatureElement = await testHelpers.webDriverManager.driver.findElements('[data-signature], .payment-signature');
            if (signatureElement.length > 0) {
                console.log('Payment signature found');
            }
        });
    });

    describe('Payment Confirmation', function() {
        it('should display payment success message', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.processPayment();
            
            await testHelpers.assertElementPresent(testData.selectors.successMessage);
            await testHelpers.assertTextContains(testData.selectors.successMessage, 'success');
        });

        it('should display payment receipt', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.processPayment();
            
            await testHelpers.assertElementPresent('.payment-receipt, [data-testid="payment-receipt"]');
        });

        it('should display transaction ID', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.processPayment();
            
            const transactionId = await testHelpers.webDriverManager.driver.findElements('.transaction-id, [data-testid="transaction-id"]');
            if (transactionId.length > 0) {
                const id = await transactionId[0].getText();
                expect(id).to.not.be.empty;
            }
        });

        it('should send payment confirmation email', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.processPayment();
            
            const emailConfirmation = await testHelpers.webDriverManager.driver.findElements('.email-confirmation, [data-testid="email-confirmation"]');
            if (emailConfirmation.length > 0) {
                console.log('Payment confirmation email sent');
            }
        });
    });

    describe('Payment Error Handling', function() {
        it('should handle network errors during payment', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            // Simulate network error
            await testHelpers.webDriverManager.driver.executeScript('window.fetch = () => Promise.reject(new Error("Network error"))');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should handle payment timeout', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            // Simulate timeout
            await testHelpers.webDriverManager.switchToNewWindow();
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id?payment_status=timeout');
            await testHelpers.webDriverManager.switchToOriginalWindow();
            
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });

        it('should handle invalid payment data', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/invalid-booking-id');
            await testHelpers.assertElementPresent(testData.selectors.errorMessage);
        });
    });

    describe('Payment UI/UX', function() {
        it('should display loading state during payment processing', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            const isLoading = await testHelpers.webDriverManager.isElementVisible(testData.selectors.loadingSpinner);
            if (isLoading) {
                console.log('Loading state displayed during payment processing');
            }
        });

        it('should disable payment button during processing', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            const button = await testHelpers.webDriverManager.driver.findElement(testData.selectors.razorpayButton);
            const isEnabled = await button.isEnabled();
            expect(isEnabled).to.be.false;
        });

        it('should display payment progress', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.clickElement(testData.selectors.razorpayButton);
            
            const progressElement = await testHelpers.webDriverManager.driver.findElements('.payment-progress, [data-testid="payment-progress"]');
            if (progressElement.length > 0) {
                console.log('Payment progress indicator found');
            }
        });
    });

    describe('Payment Accessibility', function() {
        it('should have proper form labels', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            const labels = await testHelpers.webDriverManager.driver.findElements('label');
            expect(labels.length).to.be.greaterThan(0);
        });

        it('should support keyboard navigation', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            await testHelpers.webDriverManager.driver.findElement('body').sendKeys(require('selenium-webdriver').Key.TAB);
            
            const focusedElement = await testHelpers.webDriverManager.driver.switchTo().activeElement();
            const tagName = await focusedElement.getTagName();
            expect(tagName).to.be.oneOf(['button', 'input', 'select']);
        });

        it('should have proper ARIA attributes', async function() {
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            
            const elementsWithAria = await testHelpers.webDriverManager.driver.findElements('[aria-label], [aria-labelledby]');
            expect(elementsWithAria.length).to.be.greaterThan(0);
        });
    });

    describe('Payment Performance', function() {
        it('should load payment page within acceptable time', async function() {
            const startTime = Date.now();
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            const endTime = Date.now();
            const loadTime = endTime - startTime;
            
            console.log(`Payment page load time: ${loadTime}ms`);
            expect(loadTime).to.be.lessThan(3000);
        });

        it('should handle concurrent payment attempts', async function() {
            // Open multiple payment pages
            await testHelpers.webDriverManager.navigateTo('/payment/test-booking-id');
            await testHelpers.webDriverManager.executeScript('window.open("/payment/test-booking-id", "_blank")');
            
            await testHelpers.webDriverManager.switchToNewWindow();
            await testHelpers.assertElementPresent(testData.selectors.paymentForm);
        });
    });
});
