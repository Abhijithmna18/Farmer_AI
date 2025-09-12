// Redux store configuration with optimized middleware
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import your reducers here
// import authReducer from './slices/authSlice';
// import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    // Add your reducers here
    // auth: authReducer,
    // settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable these checks in development to improve performance
      immutableCheck: {
        // Disable immutable check in development
        ignoredPaths: ['ignored', 'paths'],
      },
      serializableCheck: {
        // Disable serializable check in development
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['_persist'],
      },
      // Only enable these checks in production
      ...(process.env.NODE_ENV === 'production' && {
        immutableCheck: true,
        serializableCheck: true,
      }),
    }),
  // Enable Redux DevTools only in development
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup RTK Query listeners (if using RTK Query)
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


