import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";
import "./i18n";

// Minimal theme initializer: apply saved preference or default to light
(function initTheme() {
  try {
    const key = "theme";
    const stored = localStorage.getItem(key);
    // Default to light mode, only use system preference if no stored preference
    const theme = stored || "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (_) {}
})();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
