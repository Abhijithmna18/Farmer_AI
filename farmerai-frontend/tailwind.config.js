/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32',
        secondary: '#6D4C41',
        accent: '#FFC107',
        'neutral-light': '#F5F5F5',
        'neutral-dark': '#212121',
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".hidden-until-ready": {
          opacity: "0",
        },
        "body.ready .hidden-until-ready": {
          opacity: "1",
          transition: "opacity 0.4s ease",
        },
        ".backdrop-blur": {
          "-webkit-backdrop-filter": "var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)",
          "backdrop-filter": "var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)",
        }
      });
    }
  ],
}
