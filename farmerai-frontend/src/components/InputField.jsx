import React, { useEffect } from "react";
import { glass } from "../styles/globalStyles";

export default function InputField({ label, className = "", ...props }) {
  // Add focus animation effect
  useEffect(() => {
    const inputs = document.querySelectorAll(".farmerai-input");
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.parentElement.classList.add("input-focused");
      });
      input.addEventListener("blur", () => {
        input.parentElement.classList.remove("input-focused");
      });
    });
  }, []);

  return (
    <div className="mb-5 relative group">
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200 group-focus-within:text-green-600 transition-colors duration-200">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`farmerai-input w-full px-4 py-3 
          ${glass.input} 
          placeholder:text-gray-600 dark:placeholder:text-gray-400
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-0
          transition-all duration-300 ${className}`}
        aria-invalid={props["aria-invalid"]}
      />
    </div>
  );
}