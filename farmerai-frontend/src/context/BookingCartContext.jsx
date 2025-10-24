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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth(); // Get current user

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('bookingCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bookingCart', JSON.stringify(cartItems));
  }, [cartItems]);

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

  const value = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    getCartTotal,
    getCartItemCount
  };

  return (
    <BookingCartContext.Provider value={value}>
      {children}
    </BookingCartContext.Provider>
  );
};