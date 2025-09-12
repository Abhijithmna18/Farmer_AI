import React, { useEffect } from "react";
export default function Loader({ size = "md", text = "Loading insights..." }) {
  // Define size variants
  const sizeVariants = {
    sm: { width: 40, border: 3 },
    md: { width: 60, border: 4 },
    lg: { width: 80, border: 5 },
    xl: { width: 100, border: 6 }
  };

  const { width, border } = sizeVariants[size];
  
  // GSAP animation hook
  useEffect(() => {
    // This would be replaced with actual GSAP animation
    // For now, we'll just simulate the effect with CSS
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* Animated spinner with glassmorphism effect */}
      <div 
        className="relative animate-spin rounded-full"
        style={{
          width: `${width}px`,
          height: `${width}px`,
          background: `linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3))`,
          backdropFilter: "blur(8px)",
          border: `1px solid rgba(255, 255, 255, 0.5)`,
          boxShadow: `
            inset 0 0 20px rgba(255, 255, 255, 0.2),
            0 0 20px rgba(0, 0, 0, 0.1)
          `,
        }}
      >
        {/* Animated progress track */}
        <div
          className="absolute top-0 left-0 w-full h-full rounded-full"
          style={{
            background: `conic-gradient(
              transparent 0% 30%, 
              #4CAF50 30% 70%, 
              #FFEB3B 70% 100%
            )`,
            mask: `radial-gradient(
              farthest-side, 
              transparent calc(100% - ${border}px), 
              #000 calc(100% - ${border}px)
            )`,
            WebkitMask: `radial-gradient(
              farthest-side, 
              transparent calc(100% - ${border}px), 
              #000 calc(100% - ${border}px)
            )`,
          }}
        ></div>
        
        {/* Center dot */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: `${border * 1.5}px`,
            height: `${border * 1.5}px`,
            backgroundColor: '#4CAF50',
            boxShadow: '0 0 8px rgba(76, 175, 80, 0.7)'
          }}
        ></div>
      </div>
      
      {/* Loading text with animated dots */}
      <div className="mt-4 text-center">
        <p className="text-[#37474F] font-medium">
          {text}
          <span className="loading-dots">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse delay-100">.</span>
            <span className="animate-pulse delay-200">.</span>
          </span>
        </p>
      </div>
    </div>
  );
}