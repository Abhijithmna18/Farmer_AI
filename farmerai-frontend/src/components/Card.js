import React from "react";
import { glass } from "../styles/globalStyles";

export default function Card({ children, className = "", as: Tag = "div", ...props }) {
  return (
    <Tag
      className={`${glass.card} p-4 sm:p-6 ${
        // ensure adequate contrast and interaction
        "text-gray-900 dark:text-gray-100"
      } ${className} transition-colors duration-200`}
      {...props}
    >
      {children}
    </Tag>
  );
}