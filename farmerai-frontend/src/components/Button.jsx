import React, { useEffect } from "react";
export default function Button({ 
  children, 
  onClick, 
  className = "", 
  type = "button",
  variant = "primary",
  disabled = false
}) {
  // Add hover animation effect
  useEffect(() => {
    const buttons = document.querySelectorAll(".farmerai-button");
    buttons.forEach(button => {
      button.addEventListener("mouseenter", () => {
        if (!button.disabled) {
          button.classList.add("hover-animate");
          setTimeout(() => {
            button.classList.remove("hover-animate");
          }, 300);
        }
      });
    });
  }, []);

  // Determine button colors based on variant
  const variantStyles = {
    primary: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500/50 text-white",
    secondary: "bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 focus:ring-blue-400/50 text-white",
    accent: "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-800 focus:ring-yellow-400/50"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`farmerai-button px-6 py-3 rounded-2xl font-medium
        transition-all duration-300 transform
        ${variantStyles[variant]}
        shadow-[0_8px_20px_-8px_rgba(76,175,80,0.3)]
        hover:shadow-[0_12px_30px_-10px_rgba(76,175,80,0.4)]
        hover:translate-y-[-3px] hover:scale-[1.02]
        active:translate-y-[-1px] active:scale-[0.98]
        focus:outline-none focus:ring-4 focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100
        ${className}`}
    >
      {children}
    </button>
  );
}