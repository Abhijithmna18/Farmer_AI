import React, { useState, useRef, useLayoutEffect, useEffect, useContext } from "react";
import { gsap } from "gsap";
import InputField from "../components/InputField";
import PasswordField from "../components/PasswordField";
import RememberMeCheckbox from "../components/RememberMeCheckbox";
import Button from "../components/Button";
import { firebaseGoogleSignIn } from "../services/authService";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { AuthContext } from "../context/AuthContext";
import Toast from "../components/Toast";
import { rememberMeStorage } from "../utils/inputValidation";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  // Removed admin mode - only user login
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const nav = useNavigate();
  const { setUser } = useContext(AuthContext);
  // Parse optional redirect target
  const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
  
  const formRef = useRef();
  const headlineRef = useRef();
  const subheadRef = useRef();
  const fieldsRef = useRef([]);
  const buttonsRef = useRef();
  const leafRefs = useRef([]);

  // Load saved login data on component mount
  useEffect(() => {
    const savedData = rememberMeStorage.get();
    if (savedData) {
      setForm({
        email: savedData.email || "",
        password: savedData.password || ""
      });
      setRememberMe(savedData.remember || false);
      
      // Show a toast that data was loaded
      if (savedData.email) {
        setToast({
          message: "Welcome back! Your login details have been restored.",
          type: "info"
        });
      }
    }
  }, []);

  // Auto-redirect if already authenticated (valid token)
  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        if (!cancelled && res?.data?.user) {
          setUser && setUser(res.data.user);
          nav(redirectTo, { replace: true });
        }
      } catch (_) {
        // stay on login
      }
    };
    checkAuth();
    return () => { cancelled = true; };
  }, [nav, redirectTo, setUser]);

  useLayoutEffect(() => {
    const checkElementsReady = () => {
      const elementsToCheck = [
        formRef.current,
        headlineRef.current,
        subheadRef.current,
        buttonsRef.current
      ];

      const allElementsReady = elementsToCheck.every(element => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      const fieldsReady = fieldsRef.current.length > 0 && 
        fieldsRef.current.every(field => {
          if (!field) return false;
          const rect = field.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

      return allElementsReady && fieldsReady;
    };

    const startAnimations = () => {
      if (!checkElementsReady()) {
        setTimeout(startAnimations, 16);
        return;
      }

      // Set initial states
      gsap.set([formRef.current, headlineRef.current, subheadRef.current, fieldsRef.current, buttonsRef.current], {
        opacity: 0
      });
      
      gsap.set(leafRefs.current, {
        opacity: 0,
        scale: 0.8
      });

      // Main animation timeline
      const tl = gsap.timeline({ delay: 0.1 });

      tl.to(formRef.current, {
        duration: 0.8,
        opacity: 1,
        y: 0,
        ease: "power3.out"
      })
        .to(headlineRef.current, {
          duration: 0.8,
          opacity: 1,
          y: 0,
          ease: "back.out(1.5)"
        }, "-=0.6")
        .to(subheadRef.current, {
          duration: 0.7,
          opacity: 1,
          y: 0,
          ease: "power2.out"
        }, "-=0.5")
        .to(fieldsRef.current, {
          duration: 0.6,
          opacity: 1,
          y: 0,
          stagger: 0.15,
          ease: "power2.out"
        }, "-=0.4")
        .to(buttonsRef.current, {
          duration: 0.6,
          opacity: 1,
          y: 0,
          ease: "power2.out"
        }, "-=0.3");

      // Decorative leaf entrance
      leafRefs.current.forEach((leaf, i) => {
        if (leaf) {
          gsap.to(leaf, {
            duration: 1,
            opacity: 0.15,
            scale: 1,
            rotation: i % 2 === 0 ? -15 : 15,
            ease: "elastic.out(1, 0.7)",
            delay: 0.4 + i * 0.15
          });
        }
      });

      // Subtle float effect for headline
      gsap.to(headlineRef.current, {
        duration: 3,
        y: "+=3",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1
      });

      setIsReady(true);
    };

    // Add "ready" class immediately
    document.body.classList.add("ready");

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(startAnimations);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const isLocalStorageAvailable = () => {
      try {
        const testKey = "__farmerai_ls_test__";
        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);
        return true;
      } catch (_) {
        return false;
      }
    };
    
    if (!form.email || !form.password) {
      setToast({ message: "Please fill in all fields", type: "error" });
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.post('/auth/login', {
        email: form.email,
        password: form.password
      });
      
      const { token } = response.data;
      const role = response?.data?.user?.role || response?.data?.role;
      const email = response?.data?.user?.email || form.email;
      if (isLocalStorageAvailable()) {
        localStorage.setItem('token', token);
        if (role) localStorage.setItem('role', role);
        if (email) localStorage.setItem('email', email);
        
        // Store user ID for proper data filtering
        const userId = response?.data?.user?.id || response?.data?.user?._id;
        if (userId) {
          localStorage.setItem('userId', userId);
        }
        
        setUser && setUser(response?.data?.user || { email, role, id: userId });
        
        setToast({ 
          message: "Login successful! Redirecting...", 
          type: "success" 
        });
        
        setTimeout(() => {
          if (role === 'admin') {
            nav('/admin/dashboard');
          } else {
            nav(redirectTo);
          }
        }, 800);
      } else {
        setToast({
          message: "Local storage is not available in your browser. Please enable it to continue.",
          type: "error"
        });
        return;
      }
      
      // Save login data if remember me is checked
      if (rememberMe) {
        rememberMeStorage.save({
          email: form.email,
          password: form.password // In production, save token instead
        }, true);
      } else {
        // Clear any existing saved data if remember me is unchecked
        rememberMeStorage.clear();
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Handle unverified user
      if (err?.response?.data?.requiresVerification) {
        const email = err.response.data.email || form.email;
        setToast({ 
          message: "Please verify your email before logging in. Check your email for verification code.", 
          type: "error" 
        });
        // Store email and redirect to verification page
        localStorage.setItem('pendingVerificationEmail', email);
        setTimeout(() => nav("/verify-email", { state: { email } }), 2000);
      } else {
        setToast({ 
          message: err?.response?.data?.message || "Invalid email or password", 
          type: "error" 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Admin registration moved to Register page

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await firebaseGoogleSignIn();
      nav(redirectTo);
    } catch (err) {
      setToast({ 
        message: err.message || "Google sign-in failed. Please try again.", 
        type: "error" 
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 hidden-until-ready"
      style={{
        background: "linear-gradient(135deg, #e8f5e8 0%, #f0f9eb 25%, #e6f4ea 50%, #d4ede1 75%, #c8e6c8 100%)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 15s ease infinite"
      }}
    >
      {/* Decorative leaves */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          ref={(el) => (leafRefs.current[i] = el)}
          className="absolute text-green-600"
          style={{
            fontSize: "6rem",
            top: `${15 + i * 20}%`,
            left: i % 2 === 0 ? "8%" : "85%",
            transform: `rotate(${i % 2 === 0 ? -15 : 15}deg) scale(0.8)`,
            zIndex: 0,
            opacity: 0
          }}
        >
          🍃
        </div>
      ))}

      <div 
        ref={formRef}
        className={`w-full max-w-md bg-white bg-opacity-90 backdrop-blur-xl
                  rounded-3xl border-2 border-green-100 border-opacity-60
                  shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)] 
                  p-8 relative overflow-hidden z-10`}
        style={{ opacity: 0 }}
      >
        {/* Decorative accents */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full z-0"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-50 rounded-tr-full z-0"></div>
        {/* Headline */}
        <h1 
          ref={headlineRef}
          className="text-3xl font-bold text-center mb-3 text-gray-800 relative z-10"
          style={{ opacity: 0 }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
            Welcome Back
          </span>, Farmer!
        </h1>
        
        {/* Supporting text */}
        <p 
          ref={subheadRef}
          className="text-center mb-8 text-gray-700 relative z-10"
          style={{ opacity: 0 }}
        >
          Sign in to access your real-time field insights and crop recommendations.
        </p>
        
        {/* Removed admin/user mode selector - only user login */}

        <form onSubmit={handleEmailLogin} className="relative z-10">
          <div ref={el => fieldsRef.current[0] = el} style={{ opacity: 0 }}>
            <InputField 
              label="Email Address" 
              type="email"
              placeholder="you@yourfarm.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          
          <div ref={el => fieldsRef.current[1] = el} style={{ opacity: 0 }}>
            <PasswordField 
              label="Password" 
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <RememberMeCheckbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              label="Remember Me"
            />
            <button 
              type="button"
              onClick={() => nav("/forgot-password")}
              className="text-sm text-green-600 font-medium hover:text-green-700 hover:underline transition-colors duration-200"
            >
              Forgot password?
            </button>
          </div>
          
          <div ref={buttonsRef} className="mt-2 flex flex-col gap-4" style={{ opacity: 0 }}>
            <Button 
              type="submit" 
              variant="primary"
              disabled={isLoading}
              className="group relative overflow-hidden"
            >
              <div className="font-bold">
                {isLoading ? "Signing In..." : 'Sign In to Your Farm'}
              </div>
              {!isLoading && (
                <div className="text-xs font-normal mt-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  Access your dashboard
                </div>
              )}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-green-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-600">
                  Or sign in with
                </span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="secondary"
              className="flex items-center justify-center gap-2 group relative overflow-hidden"
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
              </svg>
              <div className="flex flex-col items-center">
                <span className="font-bold">Continue with Google</span>
                <span className="text-xs font-normal opacity-90 group-hover:opacity-100 transition-opacity">
                  {googleLoading ? "Connecting..." : "Quick & secure"}
                </span>
              </div>
            </Button>
          </div>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-600 relative z-10">
          New to FarmerAI?{' '}
          <button 
            type="button"
            onClick={() => nav("/register")}
            className="text-green-600 font-medium hover:text-green-700 hover:underline transition-colors duration-200"
          >
            Create account
          </button>
        </p>

        
      </div>
      
      <Toast 
        message={toast?.message} 
        type={toast?.type} 
        onDismiss={() => setToast(null)} 
      />
      
      {/* Global styles for animation */}
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* preload helper */
        .hidden-until-ready {
          opacity: 0;
        }
        body.ready .hidden-until-ready {
          opacity: 1;
          transition: opacity 0.4s ease;
        }
      `}</style>
    </div>
  );
}