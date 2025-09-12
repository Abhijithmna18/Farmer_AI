// Input validation utilities for forms

export const validatePassword = (value, currentValue) => {
  // Check if the new character is a space
  if (value.includes(' ')) {
    // Return the current value without spaces and an error message
    return {
      value: value.replace(/\s/g, ''),
      error: 'Spaces are not allowed in password',
      hasError: true
    };
  }
  
  return {
    value: value,
    error: '',
    hasError: false
  };
};

export const validatePhoneNumber = (value) => {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limitedDigits = digitsOnly.slice(0, 10);
  
  // Check if input contained invalid characters
  const hasInvalidChars = value !== digitsOnly;
  
  return {
    value: limitedDigits,
    error: hasInvalidChars ? 'Only numbers are allowed' : '',
    hasError: hasInvalidChars,
    isComplete: limitedDigits.length === 10,
    isValid: limitedDigits.length >= 10
  };
};

export const formatPhoneNumber = (value) => {
  // Format as XXX-XXX-XXXX for better readability (optional)
  if (value.length >= 6) {
    return `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`;
  } else if (value.length >= 3) {
    return `${value.slice(0, 3)}-${value.slice(3)}`;
  }
  return value;
};

// Remember Me functionality
export const rememberMeStorage = {
  // Save login data
  save: (data, remember = false) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('farmerAI_loginData', JSON.stringify({
      ...data,
      timestamp: Date.now(),
      remember
    }));
  },
  
  // Get saved login data
  get: () => {
    // Check localStorage first (persistent)
    let data = localStorage.getItem('farmerAI_loginData');
    let isPersistent = true;
    
    // If not in localStorage, check sessionStorage
    if (!data) {
      data = sessionStorage.getItem('farmerAI_loginData');
      isPersistent = false;
    }
    
    if (!data) return null;
    
    try {
      const parsed = JSON.parse(data);
      
      // Check if data is expired (optional: 30 days for localStorage, session for sessionStorage)
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const isExpired = isPersistent && (Date.now() - parsed.timestamp > thirtyDays);
      
      if (isExpired) {
        localStorage.removeItem('farmerAI_loginData');
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error parsing saved login data:', error);
      return null;
    }
  },
  
  // Clear saved login data
  clear: () => {
    localStorage.removeItem('farmerAI_loginData');
    sessionStorage.removeItem('farmerAI_loginData');
  }
};