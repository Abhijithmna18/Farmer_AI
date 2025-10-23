// src/components/BookingCartModal.jsx
import React, { useState } from 'react';
import { XMarkIcon, TrashIcon, CalendarIcon, CurrencyRupeeIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useBookingCart } from '../context/BookingCartContext';
import { useNavigate } from 'react-router-dom';

const BookingCartModal = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateCartItem,
    clearCart, 
    getCartTotal 
  } = useBookingCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Redirect to booking form for the first item
      // Future: implement multi-warehouse checkout
      const firstItem = cartItems[0];
      setIsCartOpen(false);
      navigate(`/warehouses/${firstItem.warehouse._id}/book`, {
        state: {
          bookingData: firstItem.bookingData,
          fromCart: true
        }
      });
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Booking Cart</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-4">
                Add warehouses to your cart to get started
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.warehouse.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.warehouse.location?.city}, {item.warehouse.location?.state}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.warehouse.storageTypes?.slice(0, 2).map((type, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Booking Details */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Produce:</span>
                        <span className="ml-1 font-medium">{item.bookingData.produce?.type || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <span className="ml-1 font-medium">{item.bookingData.produce?.quantity || 1} {item.bookingData.produce?.unit || 'tons'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-1 font-medium">{item.bookingData.bookingDates?.duration || 7} days</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Price:</span>
                        <span className="ml-1 font-medium">
                          ₹{item.warehouse.pricing?.basePrice || 0}/day
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Duration Controls */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Duration:</span>
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => {
                            const currentDuration = item.bookingData.bookingDates?.duration || 7;
                            if (currentDuration > 1) {
                              updateCartItem(item.id, {
                                bookingDates: {
                                  ...item.bookingData.bookingDates,
                                  duration: currentDuration - 1
                                }
                              });
                            }
                          }}
                          className="p-1 hover:bg-gray-100"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">
                          {item.bookingData.bookingDates?.duration || 7}
                        </span>
                        <button
                          onClick={() => {
                            const currentDuration = item.bookingData.bookingDates?.duration || 7;
                            updateCartItem(item.id, {
                              bookingDates: {
                                ...item.bookingData.bookingDates,
                                duration: currentDuration + 1
                              }
                            });
                          }}
                          className="p-1 hover:bg-gray-100"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        ₹{((item.warehouse.pricing?.basePrice || 0) * (item.bookingData.bookingDates?.duration || 7) * (item.bookingData.produce?.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">Total ({cartItems.length} items):</span>
              <span className="text-xl font-bold text-green-600">₹{getCartTotal().toFixed(2)}</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear Cart
              </button>
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCartModal;








