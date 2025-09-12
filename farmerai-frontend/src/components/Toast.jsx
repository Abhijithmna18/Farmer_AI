import React, { useEffect } from "react";
export default function Toast({ message, type = "info", onDismiss }) {
  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  // Define type-based styling
  const typeStyles = {
    success: {
      bg: "bg-[#4CAF50]/80",
      icon: "✅",
      border: "border-[#4CAF50]/30"
    },
    error: {
      bg: "bg-[#EF5350]/80",
      icon: "⚠️",
      border: "border-[#EF5350]/30"
    },
    info: {
      bg: "bg-[#4FC3F7]/80",
      icon: "ℹ️",
      border: "border-[#4FC3F7]/30"
    },
    warning: {
      bg: "bg-[#FFEB3B]/80",
      icon: "⚠️",
      border: "border-[#FFEB3B]/30",
      text: "text-[#37474F]" // Dark text for yellow background
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div 
      className={`farmerai-toast fixed right-4 top-4 z-50 py-3 px-4 pr-10 rounded-xl 
        backdrop-blur-lg ${style.bg} ${style.border} border
        shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_-2px_10px_rgba(0,0,0,0.1)]
        text-white text-sm font-medium
        transition-all duration-300 transform
        ${style.text || "text-white"}
        animate-toast-enter`}
    >
      <div className="flex items-center">
        <span className="mr-2 text-lg">{style.icon}</span>
        {message}
      </div>
      
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2
                  w-6 h-6 rounded-full bg-white/20
                  flex items-center justify-center
                  hover:bg-white/30 transition-colors"
        aria-label="Dismiss message"
      >
        ×
      </button>
    </div>
  );
}