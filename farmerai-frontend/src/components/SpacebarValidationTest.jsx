// Test component to verify spacebar validation
import React, { useState } from 'react';

const SpacebarValidationTest = () => {
  const [testValue, setTestValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      console.log('Spacebar blocked!');
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const cleanValue = value.replace(/\s/g, '');
    setTestValue(cleanValue);
    console.log('Original:', value, 'Cleaned:', cleanValue);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Spacebar Validation Test</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Input (Spaces will be blocked)
          </label>
          <input
            type="text"
            value={testValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Try typing with spaces..."
          />
          <p className="text-xs text-gray-500 mt-1">⚠️ Spaces are not allowed in this field</p>
        </div>
        <div className="p-3 bg-gray-100 rounded">
          <p className="text-sm">
            <strong>Current Value:</strong> "{testValue}"
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Try typing "Hello World" - it should become "HelloWorld"
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpacebarValidationTest;

