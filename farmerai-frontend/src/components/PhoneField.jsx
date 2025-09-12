import React, { useState, useEffect } from "react";
import { validatePhoneNumber, formatPhoneNumber } from "../utils/inputValidation";

export default function PhoneField({ 
  label, 
  value, 
  onChange, 
  placeholder = "+91 XXXXX XXXXX",
  showFormatted = false,
  className = "",
  ...props 
}) {
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Add focus animation effect
  useEffect(() => {
    const inputs = document.querySelectorAll(".farmerai-phone-input");
    inputs.forEach(input => {
      input.addEventListener("focus", () => {
        input.parentElement.classList.add("input-focused");
      });
      input.addEventListener("blur", () => {
        input.parentElement.classList.remove("input-focused");
        setShowError(false); // Hide error on blur
      });
    });
  }, []);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const validation = validatePhoneNumber(inputValue);
    
    if (validation.hasError) {
      setError(validation.error);
      setShowError(true);
      // Hide error after 2 seconds
      setTimeout(() => setShowError(false), 2000);
    } else {
      setError('');
      setShowError(false);
    }
    
    // Call onChange with the cleaned value
    onChange({
      ...e,
      target: {
        ...e.target,
        value: validation.value
      }
    });
  };

  const handleKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
      setError('Only numbers are allowed');
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const handlePaste = (e) => {
    // Handle paste events
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const validation = validatePhoneNumber(paste);
    
    if (validation.hasError || paste !== validation.value) {
      e.preventDefault();
      setError('Only numbers are allowed');
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const displayValue = showFormatted && value ? formatPhoneNumber(value) : value;
  const validation = validatePhoneNumber(value || '');

  return (
    <div className="mb-5 relative group">
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-700 group-focus-within:text-green-600 transition-colors duration-200">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          maxLength={showFormatted ? 12 : 10} // Account for formatting dashes
          className={`farmerai-phone-input w-full px-4 py-3 rounded-xl 
            bg-white bg-opacity-90 backdrop-blur-md
            border-2 ${error && showError ? 'border-red-300' : validation.isComplete ? 'border-green-300' : 'border-green-100'}
            shadow-[0_4px_12px_rgba(76,175,80,0.1)]
            placeholder:text-gray-500 placeholder:opacity-70
            focus:outline-none ${error && showError ? 'focus:border-red-400 focus:ring-2 focus:ring-red-400/30' : 'focus:border-green-400 focus:ring-2 focus:ring-green-400/30'}
            transition-all duration-300
            ${error && showError ? 'hover:border-red-200' : 'hover:border-green-200'} hover:shadow-[0_6px_16px_rgba(76,175,80,0.15)]
            hover:translate-y-[-1px]
            text-gray-800 ${className}`}
        />
        
        {/* Validation indicator */}
        {value && value.length > 0 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validation.isComplete ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="text-xs text-gray-400 font-medium">
                {value.length}/10
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && showError && (
        <div className="mt-1 flex items-center animate-fade-in">
          <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
      
      {/* Helper text */}
      {!error && value && value.length > 0 && !validation.isComplete && (
        <p className="mt-1 text-xs text-gray-500">
          Enter {10 - value.length} more digit{10 - value.length !== 1 ? 's' : ''}
        </p>
      )}
      
      {validation.isComplete && !error && (
        <p className="mt-1 text-xs text-green-600 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Valid phone number
        </p>
      )}
    </div>
  );
}