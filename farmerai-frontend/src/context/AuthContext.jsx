import React, { createContext, useState, useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth"; // no getAuth here
import { auth } from "../firebase"; // use exported auth instance
import apiClient from "../services/apiClient"; // unified axios instance with baseURL + credentials
import Toast from "../components/Toast";
import { useTheme } from "./ThemeContext";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const themeCtx = (() => {
    try {
      return useTheme();
    } catch (_) {
      return null;
    }
  })();

  const logout = async () => {
    try {
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
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

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (u) => {
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
          // Persist lightweight identity for refreshes and role-gated routes
          if (backendUser?.email) localStorage.setItem('email', backendUser.email);
          if (backendUser?.role) localStorage.setItem('role', backendUser.role);
          if (backendUser?.id || backendUser?._id) localStorage.setItem('userId', backendUser.id || backendUser._id);
          // Sync theme preference on login if available
          const preferredTheme = backendUser?.preferences?.theme;
          if (preferredTheme && themeCtx?.setThemeMode) {
            themeCtx.setThemeMode(preferredTheme, false);
          }
        } catch (err) {
          console.error("Failed to fetch backend profile:", {
            message: err?.message,
            code: err?.code,
            status: err?.response?.status,
            data: err?.response?.data,
          });
          setUser({ email: u.email, role: localStorage.getItem('role') || undefined });
          setError("Could not load full profile from server.");
        } finally {
          setLoading(false);
        }
      } else {
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
    const initFromJwt = async () => {
      // If already have a user from Firebase flow, skip
      if (user) return;
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await apiClient.get('/auth/me');
        if (res?.data?.user) {
          const backendUser = res.data.user;
          setUser(backendUser);
          if (backendUser?.email) localStorage.setItem('email', backendUser.email);
          if (backendUser?.role) localStorage.setItem('role', backendUser.role);
          if (backendUser?.id || backendUser?._id) localStorage.setItem('userId', backendUser.id || backendUser._id);
          const preferredTheme = backendUser?.preferences?.theme;
          if (preferredTheme && themeCtx?.setThemeMode) {
            themeCtx.setThemeMode(preferredTheme, false);
          }
        } else {
          // If backend returns no user but token exists, something is wrong, clear token
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (e) {
        // If token invalid, clear it
        localStorage.removeItem('token');
        // Removed localStorage.removeItem('role'); as role is part of user object
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initFromJwt();
  }, [user, themeCtx?.setThemeMode, setUser]); // Add user and themeCtx.setThemeMode to dependencies

  return (
    <AuthContext.Provider value={{ user, setUser, loading, error, setError, logout }}>
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