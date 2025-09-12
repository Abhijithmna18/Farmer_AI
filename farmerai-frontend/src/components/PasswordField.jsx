import React, { useState, useEffect } from "react";
import { validatePassword } from "../utils/inputValidation";

export default function PasswordField({ 
  label, 
  value, 
  onChange, 
  placeholder = "••••••••",
  className = "",
  ...props 
}) {
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  // Add focus animation effect
  useEffect(() => {
    const inputs = document.querySelectorAll(".farmerai-password-input");
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
    const validation = validatePassword(inputValue, value);
    
    if (validation.hasError) {
      setError(validation.error);
      setShowError(true);
      // Hide error after 3 seconds
      setTimeout(() => setShowError(false), 3000);
    } else {
      setError('');
      setShowError(false);
    }
    
    // Always call onChange with the cleaned value
    onChange({
      ...e,
      target: {
        ...e.target,
        value: validation.value
      }
    });
  };

  const handleKeyDown = (e) => {
    // Prevent spacebar from being entered
    if (e.key === ' ' || e.keyCode === 32) {
      e.preventDefault();
      setError('Spaces are not allowed in password');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

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
          type="password"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`farmerai-password-input w-full px-4 py-3 rounded-xl 
            bg-white bg-opacity-90 backdrop-blur-md
            border-2 ${error && showError ? 'border-red-300' : 'border-green-100'}
            shadow-[0_4px_12px_rgba(76,175,80,0.1)]
            placeholder:text-gray-500 placeholder:opacity-70
            focus:outline-none ${error && showError ? 'focus:border-red-400 focus:ring-2 focus:ring-red-400/30' : 'focus:border-green-400 focus:ring-2 focus:ring-green-400/30'}
            transition-all duration-300
            ${error && showError ? 'hover:border-red-200' : 'hover:border-green-200'} hover:shadow-[0_6px_16px_rgba(76,175,80,0.15)]
            hover:translate-y-[-1px]
            text-gray-800 ${className}`}
        />
        
        {/* Password strength indicator (optional) */}
        {value && value.length > 0 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className={`w-2 h-2 rounded-full ${
              value.length >= 8 ? 'bg-green-500' : 
              value.length >= 6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
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
      {!error && value && value.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          Password strength: {
            value.length >= 8 ? 'Strong' : 
            value.length >= 6 ? 'Medium' : 'Weak'
          }
        </p>
      )}
    </div>
  );
}