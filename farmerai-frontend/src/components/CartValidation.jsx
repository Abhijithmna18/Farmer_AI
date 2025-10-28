// src/components/CartValidation.jsx
import React from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const CartValidation = ({ validation, onFix, onDismiss }) => {
  if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Errors */}
      {validation.errors.length > 0 && (
        <div className={`rounded-lg border p-4 ${getBgColor('error')}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon('error')}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Cart Issues ({validation.errors.length})
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => onFix && onFix('errors')}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Fix Issues →
                </button>
              </div>
            </div>
            <div className="ml-3 flex-shrink-0">
              <button
                onClick={() => onDismiss && onDismiss('errors')}
                className="text-red-400 hover:text-red-600"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className={`rounded-lg border p-4 ${getBgColor('warning')}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon('warning')}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Recommendations ({validation.warnings.length})
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => onFix && onFix('warnings')}
                  className="text-sm font-medium text-yellow-600 hover:text-yellow-500"
                >
                  Review Items →
                </button>
              </div>
            </div>
            <div className="ml-3 flex-shrink-0">
              <button
                onClick={() => onDismiss && onDismiss('warnings')}
                className="text-yellow-400 hover:text-yellow-600"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {validation.isValid && validation.warnings.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Cart is ready for checkout!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                All items are valid and ready to proceed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartValidation;
