// Quick test to verify the pricing utilities work
import { handleZeroPricing } from './src/utils/pricingUtils.js';

console.log('🧪 Testing pricing utilities...');

// Test cases
const testCases = [
  { pricing: null, expected: true, description: 'Null pricing' },
  { pricing: {}, expected: true, description: 'Empty pricing object' },
  { pricing: { totalAmount: 0 }, expected: true, description: 'Zero total amount' },
  { pricing: { totalAmount: 100 }, expected: false, description: 'Valid total amount' }
];

testCases.forEach((testCase, index) => {
  const result = handleZeroPricing.isZeroPricing(testCase.pricing);
  const passed = result === testCase.expected;
  console.log(`Test ${index + 1}: ${testCase.description} - ${passed ? '✅ PASSED' : '❌ FAILED'}`);
});

console.log('✅ Pricing utilities test complete!');
