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
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'farmer-ai-4.onrender.com'
    ],
    // Disable HMR in production
    hmr: process.env.NODE_ENV === 'production' ? false : {
      protocol: 'wss',
      host: 'farmer-ai-4.onrender.com',
      port: 443
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