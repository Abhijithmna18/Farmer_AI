import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Import path module

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['styled-jsx/babel'],
      },
    }),
  ],
  server: {
    port: 5173
  },
  resolve: { // Add this resolve block
    alias: {
      "@": path.resolve(__dirname, "./src"), // Alias @ to ./src
    },
  },
});
