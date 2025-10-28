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
    port: process.env.PORT || 5173,
    host: 'localhost',
    // Disable HMR in production and ensure proper configuration for development
    hmr: process.env.NODE_ENV === 'production' ? false : {
      host: 'localhost',
      port: process.env.PORT || 5173,
      protocol: 'ws'
    }
  },
  resolve: { // Add this resolve block
    alias: {
      "@": path.resolve(__dirname, "./src"), // Alias @ to ./src
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          charts: ['recharts'],
        }
      }
    }
  }
});