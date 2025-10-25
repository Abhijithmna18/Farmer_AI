const { expect } = require('chai');

describe('Basic Mocha Test', function() {
    it('should pass a simple test', function() {
        expect(1 + 1).to.equal(2);
        console.log('✅ Basic test passed');
    });
    
    it('should handle async operations', async function() {
        const result = await Promise.resolve('test');
        expect(result).to.equal('test');
        console.log('✅ Async test passed');
    });
});

