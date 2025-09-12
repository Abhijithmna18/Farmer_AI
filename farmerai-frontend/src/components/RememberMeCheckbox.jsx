import React from "react";

export default function RememberMeCheckbox({ 
  checked, 
  onChange, 
  label = "Remember Me",
  className = "" 
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          id="remember-me"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <label
          htmlFor="remember-me"
          className="flex items-center cursor-pointer select-none"
        >
          <div className={`
            w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-all duration-200
            ${checked 
              ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 shadow-[0_4px_12px_rgba(76,175,80,0.3)]' 
              : 'bg-white border-green-200 hover:border-green-300 shadow-[0_2px_8px_rgba(76,175,80,0.1)]'
            }
            hover:scale-105 active:scale-95
          `}>
            {checked && (
              <svg 
                className="w-3 h-3 text-white animate-fade-in" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
          </div>
          <span className="text-sm text-gray-700 font-medium hover:text-green-600 transition-colors duration-200">
            {label}
          </span>
        </label>
      </div>
      
      {/* Tooltip for additional info */}
      <div className="relative group ml-2">
        <svg 
          className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" 
            clipRule="evenodd" 
          />
        </svg>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {checked 
            ? "Your login will be saved until you log out" 
            : "Your login will be cleared when you close the browser"
          }
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    </div>
  );
}