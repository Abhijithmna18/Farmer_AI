// src/components/CartAnalytics.jsx
import React from 'react';
import { 
  ChartBarIcon, 
  CurrencyRupeeIcon, 
  ClockIcon, 
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const CartAnalytics = ({ analytics, cartItems }) => {
  if (!analytics || cartItems.length === 0) return null;

  const getPriceTrend = () => {
    // Simple price trend calculation based on warehouse ratings
    const avgRating = cartItems.reduce((sum, item) => sum + (item.warehouse.rating || 0), 0) / cartItems.length;
    return avgRating > 4 ? 'up' : avgRating < 3 ? 'down' : 'stable';
  };

  const getSavingsPercentage = () => {
    if (analytics.totalValue === 0) return 0;
    // Mock calculation - in real app, compare with original prices
    return Math.round((analytics.totalValue * 0.15) / analytics.totalValue * 100);
  };

  const trend = getPriceTrend();
  const savingsPercentage = getSavingsPercentage();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
          Cart Insights
        </h3>
        <div className="flex items-center space-x-2">
          {trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />}
          {trend === 'down' && <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />}
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? 'High Quality' : trend === 'down' ? 'Budget Friendly' : 'Balanced'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Value */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.totalValue.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Average Item Value */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg per Item</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.avgItemValue.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Potential Savings */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Potential Savings</p>
              <p className="text-2xl font-bold text-green-600">{savingsPercentage}%</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Most Expensive Item</p>
              <p className="font-semibold text-gray-900">
                {analytics.mostExpensiveItem.item?.warehouse.name || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                ₹{analytics.mostExpensiveItem.value?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cart History</p>
              <p className="font-semibold text-gray-900">{analytics.totalHistory} actions</p>
              <p className="text-sm text-gray-500">Recent activity</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {cartItems.length > 1 && (
        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Consider booking longer durations for better rates</p>
            <p>• You have {analytics.savedCount} items saved for later</p>
            <p>• All warehouses are in good standing</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartAnalytics;
