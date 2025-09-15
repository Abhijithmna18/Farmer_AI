// src/components/BookingCartModal.jsx
import React from 'react';
import { XMarkIcon, TrashIcon, CalendarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { useBookingCart } from '../context/BookingCartContext';

const BookingCartModal = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    clearCart, 
    getCartTotal 
  } = useBookingCart();

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
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{item.warehouse.name}</h3>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <p>{item.warehouse.address?.city}, {item.warehouse.address?.state}</p>
                    <p>Capacity: {item.warehouse.capacity?.total} {item.warehouse.capacity?.unit}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span>{item.bookingData.bookingDates?.duration || 7} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CurrencyRupeeIcon className="h-4 w-4 text-gray-400" />
                        <span>
                          ₹{item.warehouse.pricePerDay || item.warehouse.pricePerTon || 0}
                          {item.warehouse.pricePerDay ? '/day' : '/ton'}
                        </span>
                      </div>
                    </div>
                    <div className="font-semibold text-green-600">
                      ₹{((item.warehouse.pricePerDay || item.warehouse.pricePerTon || 0) * (item.bookingData.bookingDates?.duration || 7)).toFixed(2)}
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
              <span className="text-lg font-semibold text-gray-900">Total:</span>
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
                onClick={() => {
                  // TODO: Implement checkout flow
                  console.log('Proceed to checkout');
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCartModal;





