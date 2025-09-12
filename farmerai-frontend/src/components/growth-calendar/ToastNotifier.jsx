import React, { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { gsap } from 'gsap';

const ToastNotifier = ({ toast, onClose }) => {
  const toastRef = useRef(null);

  useEffect(() => {
    if (toast && toastRef.current) {
      // Animate in
      gsap.fromTo(toastRef.current, 
        { opacity: 0, y: -50, scale: 0.9 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.3, 
          ease: "back.out(1.7)"
        }
      );

      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleClose = () => {
    if (toastRef.current) {
      gsap.to(toastRef.current, {
        opacity: 0,
        y: -50,
        scale: 0.9,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  if (!toast) return null;

  const getToastConfig = (type) => {
    const configs = {
      success: {
        icon: CheckCircle,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400',
        textColor: 'text-green-800 dark:text-green-200'
      },
      error: {
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
        textColor: 'text-red-800 dark:text-red-200'
      },
      warning: {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        textColor: 'text-yellow-800 dark:text-yellow-200'
      },
      info: {
        icon: Info,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        textColor: 'text-blue-800 dark:text-blue-200'
      }
    };
    return configs[type] || configs.info;
  };

  const config = getToastConfig(toast.type);
  const IconComponent = config.icon;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        ref={toastRef}
        className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 shadow-lg max-w-sm w-full`}
      >
        <div className="flex items-start">
          <div className={`p-2 ${config.iconColor} rounded-lg mr-3`}>
            <IconComponent className="h-5 w-5" />
          </div>
          
          <div className="flex-1">
            <h4 className={`font-semibold ${config.textColor} mb-1`}>
              {toast.title || (toast.type === 'success' ? 'Success!' : 
                              toast.type === 'error' ? 'Error!' : 
                              toast.type === 'warning' ? 'Warning!' : 'Info')}
            </h4>
            <p className={`text-sm ${config.textColor}`}>
              {toast.message}
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className={`ml-3 ${config.textColor} hover:opacity-70 transition-opacity`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastNotifier;


