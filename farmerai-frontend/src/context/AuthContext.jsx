import React, { createContext, useState, useEffect } from "react";
import { onIdTokenChanged, getIdToken } from "firebase/auth"; // no getAuth here
import { auth } from "../firebase"; // use exported auth instance
import apiClient from "../services/apiClient"; // unified axios instance with baseURL + credentials
import Toast from "../components/Toast";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = async () => {
    try {
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cached data in apiClient (if using cache)
      // This ensures that when a new user logs in, they don't see cached data
      if (apiClient.defaults.headers) {
        delete apiClient.defaults.headers['Authorization'];
      }
      
      // Force clear any potential cache in the browser
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      // Sign out from Firebase
      await auth.signOut();
      
      // Clear user state
      setUser(null);
      setError(null);
      setLoading(false);
      
      // Show success message
      return { success: true, message: "You have been logged out successfully" };
    } catch (err) {
      console.error("Logout error:", err);
      return { success: false, message: "Logout failed. Please try again." };
    }
  };

  // Function to refresh token
  const refreshToken = async () => {
    if (auth.currentUser) {
      try {
        const token = await getIdToken(auth.currentUser, true); // Force refresh
        localStorage.setItem("token", token);
        console.log('✅ Firebase ID token refreshed');
        return token;
      } catch (error) {
        console.error('❌ Failed to refresh Firebase ID token:', error);
        // Clear token on refresh failure
        localStorage.removeItem('token');
        throw error;
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (u) => {
      console.log('Firebase auth state changed:', u ? 'User logged in' : 'User logged out');
      setLoading(true);
      setError(null);

      if (u) {
        try {
          const token = await u.getIdToken();
          localStorage.setItem("token", token);

          // Fetch profile from backend
          const res = await apiClient.get("/auth/me");
          const backendUser = res.data.user || { email: u.email };
          setUser(backendUser);
          console.log('User profile loaded:', backendUser);
          
          // Persist lightweight identity for refreshes and role-gated routes
          if (backendUser?.email) localStorage.setItem('email', backendUser.email);
          if (backendUser?.role) localStorage.setItem('role', backendUser.role);
          if (backendUser?.id || backendUser?._id) localStorage.setItem('userId', backendUser.id || backendUser._id);
          
          // Theme preference will be handled by ThemeProvider
          // No need to set theme here to avoid circular dependency
        } catch (err) {
          console.error("Failed to fetch backend profile:", {
            message: err?.message,
            code: err?.code,
            status: err?.response?.status,
            data: err?.response?.data,
          });
          
          // If it's a 401 error, the token is invalid, so clear it
          if (err?.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("email");
            setUser(null);
          } else {
            // For other errors, still set the user with basic info from Firebase
            const cachedRole = localStorage.getItem('role');
            const userData = { 
              email: u.email, 
              role: cachedRole || undefined,
              displayName: u.displayName,
              photoURL: u.photoURL,
              firstName: u.displayName?.split(' ')[0],
              lastName: u.displayName?.split(' ').slice(1).join(' ')
            };
            setUser(userData);
            console.log('Using Firebase user data due to backend error:', userData);
            
            // Only show error for non-network issues
            if (err?.code !== 'NETWORK_ERROR' && err?.message !== 'Network Error') {
              setError("Could not load full profile from server.");
            }
          }
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No Firebase user, clearing auth data');
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Bootstrap session from backend JWT (admin login) when no Firebase user
  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;
    
    const initFromJwt = async () => {
      // Prevent multiple initializations
      if (hasInitialized) return;
      hasInitialized = true;
      
      // Check if Firebase user exists first
      if (auth.currentUser) {
        console.log('Firebase user exists, skipping JWT initialization');
        if (isMounted) setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        if (isMounted) setLoading(true);
        const res = await apiClient.get('/auth/me');
        if (res?.data?.user && isMounted) {
          const backendUser = res.data.user;
          setUser(backendUser);
          if (backendUser?.email) localStorage.setItem('email', backendUser.email);
          if (backendUser?.role) localStorage.setItem('role', backendUser.role);
          if (backendUser?.id || backendUser?._id) localStorage.setItem('userId', backendUser.id || backendUser._id);
          
          // Set theme preference if available (moved to Firebase auth flow)
          // Theme will be set when Firebase auth completes
        } else if (isMounted) {
          // If backend returns no user but token exists, something is wrong, clear token
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (e) {
        console.error('Failed to initialize from JWT:', e);
        
        // Only clear token and logout if it's a 401 (unauthorized) error
        if (e?.response?.status === 401) {
          if (isMounted) {
            localStorage.removeItem('token');
            setUser(null);
          }
        } else {
          // For other errors, keep the user data from localStorage if available
          const email = localStorage.getItem('email');
          const role = localStorage.getItem('role');
          if (email && isMounted) {
            setUser({ email, role: role || undefined });
            console.log('Using cached user data due to network error');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    // Add a small delay to let Firebase auth initialize first
    const timeoutId = setTimeout(() => {
      initFromJwt();
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array to run only once

  // Refresh user subscription status
  const refreshSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      // Refresh the user profile which should include subscription info
      const res = await apiClient.get("/auth/me");
      const backendUser = res.data.user || user;
      setUser(backendUser);
      return backendUser;
    } catch (err) {
      console.error("Failed to refresh subscription status:", err);
      throw err;
    }
  };

  // Expose refreshToken function
  const authContextValue = {
    user, 
    setUser, 
    loading, 
    error, 
    setError, 
    logout,
    refreshToken,
    refreshSubscriptionStatus
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-white/80 backdrop-blur border border-green-100 text-sm text-gray-700 shadow-sm"
        >
          Loading profile...
        </div>
      )}
      {children}
      <Toast message={error} type="error" onDismiss={() => setError(null)} />
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}