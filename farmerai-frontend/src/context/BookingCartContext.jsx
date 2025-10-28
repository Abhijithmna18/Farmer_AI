// src/context/BookingCartContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

const BookingCartContext = createContext();

export const useBookingCart = () => {
  const context = useContext(BookingCartContext);
  if (!context) {
    throw new Error('useBookingCart must be used within a BookingCartProvider');
  }
  return context;
};

export const BookingCartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartHistory, setCartHistory] = useState([]);
  const [cartPreferences, setCartPreferences] = useState({
    autoSave: true,
    notifications: true,
    compareMode: false
  });
  const { user } = useAuth(); // Get current user

  // Load cart and saved items from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('bookingCart');
    const savedItemsData = localStorage.getItem('savedWarehouses');
    const savedPreferences = localStorage.getItem('cartPreferences');
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
    
    if (savedItemsData) {
      try {
        setSavedItems(JSON.parse(savedItemsData));
      } catch (error) {
        console.error('Error loading saved items from localStorage:', error);
      }
    }
    
    if (savedPreferences) {
      try {
        setCartPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading cart preferences from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bookingCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save saved items to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('savedWarehouses', JSON.stringify(savedItems));
  }, [savedItems]);

  // Save preferences to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartPreferences', JSON.stringify(cartPreferences));
  }, [cartPreferences]);

  // Clear cart when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      // Clear cart when no user is logged in
      setCartItems([]);
    }
  }, [user]);

  const addToCart = (warehouse, bookingData) => {
    const cartItem = {
      id: `${warehouse._id}-${Date.now()}`,
      warehouse,
      bookingData,
      addedAt: new Date().toISOString()
    };

    setCartItems(prev => [...prev, cartItem]);
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateCartItem = (itemId, updatedData) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, bookingData: { ...item.bookingData, ...updatedData } }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.warehouse.pricePerDay || item.warehouse.pricePerTon || 0;
      const duration = item.bookingData.bookingDates?.duration || 1;
      return total + (basePrice * duration);
    }, 0);
  };

  const getCartItemCount = () => {
    return cartItems.length;
  };

  // Save for later functionality
  const saveForLater = (item) => {
    const savedItem = {
      ...item,
      savedAt: new Date().toISOString(),
      id: `saved-${item.id}`
    };
    setSavedItems(prev => [...prev, savedItem]);
    addToHistory('saved', item);
  };

  const moveToCart = (savedItem) => {
    const cartItem = {
      ...savedItem,
      id: savedItem.id.replace('saved-', ''),
      addedAt: new Date().toISOString()
    };
    setCartItems(prev => [...prev, cartItem]);
    setSavedItems(prev => prev.filter(item => item.id !== savedItem.id));
    addToHistory('moved_to_cart', savedItem);
  };

  const removeFromSaved = (itemId) => {
    setSavedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Cart history and analytics
  const addToHistory = (action, item) => {
    const historyEntry = {
      id: Date.now(),
      action,
      item: {
        warehouseId: item.warehouse._id,
        warehouseName: item.warehouse.name,
        price: item.warehouse.pricing?.basePrice || 0
      },
      timestamp: new Date().toISOString()
    };
    setCartHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  // Bulk operations
  const bulkRemove = (itemIds) => {
    setCartItems(prev => prev.filter(item => !itemIds.includes(item.id)));
    addToHistory('bulk_remove', { count: itemIds.length });
  };

  const bulkSaveForLater = (itemIds) => {
    const itemsToSave = cartItems.filter(item => itemIds.includes(item.id));
    itemsToSave.forEach(item => saveForLater(item));
    setCartItems(prev => prev.filter(item => !itemIds.includes(item.id)));
  };

  // Cart validation
  const validateCart = () => {
    const errors = [];
    const warnings = [];

    cartItems.forEach((item, index) => {
      // Check if warehouse still exists and is available
      if (!item.warehouse || !item.warehouse.name) {
        errors.push(`Item ${index + 1}: Warehouse information is missing`);
      }

      // Check pricing
      if (!item.warehouse.pricing?.basePrice || item.warehouse.pricing.basePrice <= 0) {
        warnings.push(`Item ${index + 1}: Pricing information may be outdated`);
      }

      // Check booking dates
      if (!item.bookingData.bookingDates?.duration || item.bookingData.bookingDates.duration < 1) {
        errors.push(`Item ${index + 1}: Invalid booking duration`);
      }
    });

    return { errors, warnings, isValid: errors.length === 0 };
  };

  // Cart analytics
  const getCartAnalytics = () => {
    const totalValue = getCartTotal();
    const avgItemValue = cartItems.length > 0 ? totalValue / cartItems.length : 0;
    const mostExpensiveItem = cartItems.reduce((max, item) => {
      const itemValue = (item.warehouse.pricing?.basePrice || 0) * (item.bookingData.bookingDates?.duration || 1);
      return itemValue > max.value ? { item, value: itemValue } : max;
    }, { item: null, value: 0 });

    return {
      totalValue,
      avgItemValue,
      mostExpensiveItem,
      itemCount: cartItems.length,
      savedCount: savedItems.length,
      totalHistory: cartHistory.length
    };
  };

  // Update preferences
  const updatePreferences = (newPreferences) => {
    setCartPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  const value = {
    // State
    cartItems,
    savedItems,
    isCartOpen,
    cartHistory,
    cartPreferences,
    
    // Actions
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    saveForLater,
    moveToCart,
    removeFromSaved,
    bulkRemove,
    bulkSaveForLater,
    updatePreferences,
    
    // Getters
    getCartTotal,
    getCartItemCount,
    getSavedItems: () => savedItems,
    validateCart,
    getCartAnalytics
  };

  return (
    <BookingCartContext.Provider value={value}>
      {children}
    </BookingCartContext.Provider>
  );
};