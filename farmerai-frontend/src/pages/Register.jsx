import React, { useState, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { Leaf, Home } from "lucide-react";
import InputField from "../components/InputField";
import PasswordField from "../components/PasswordField";
import PhoneField from "../components/PhoneField";
import Button from "../components/Button";
import { firebaseGoogleSignIn } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { emailValid } from "../utils/validators";
import Toast from "../components/Toast";
import apiClient from "../services/apiClient";

export default function Register() {
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    password: "", 
    confirmPassword: ""
  });
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const nav = useNavigate();
  
  const formRef = useRef();
  const headlineRef = useRef();
  const subheadRef = useRef();
  const fieldsRef = useRef([]);
  const buttonsRef = useRef();
  const leafRefs = useRef([]);

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
          stagger: 0.1,
          ease: "power2.out"
        }, "-=0.4")
        .to(buttonsRef.current, {
          duration: 0.6,
          opacity: 1,
          y: 0,
          ease: "power2.out"
        }, "-=0.2");

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

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Normalize and validate names
    const first = (form.firstName || '').trim();
    const last = (form.lastName || '').trim();
    // Allow letters, spaces, hyphens, apostrophes, and dots. Must start with a letter and be at least 2 chars.
    const nameRegex = /^[A-Za-z][A-Za-z .'-]{1,}$/;
    const firstLettersCount = (first.match(/[A-Za-z]/g) || []).length;
    if (!first || firstLettersCount < 2 || !nameRegex.test(first)) {
      setToast({ message: "Enter a valid first name (min 2 letters)", type: "error" });
      setIsLoading(false);
      return;
    }
    const lastLettersCount = (last.match(/[A-Za-z]/g) || []).length;
    if (!last || lastLettersCount < 2 || !nameRegex.test(last)) {
      setToast({ message: "Enter a valid last name (min 2 letters)", type: "error" });
      setIsLoading(false);
      return;
    }
    if (!emailValid(form.email)) {
      setToast({ message: "Please enter a valid email", type: "error" });
      setIsLoading(false);
      return;
    }
    const passOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password);
    if (form.password && !passOk) {
      setToast({ message: "Password must be 8+ chars with upper, lower, number", type: "error" });
      setIsLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.post('/auth/register', {
        firstName: first,
        lastName: last,
        email: form.email,
        password: form.password || undefined,
        confirmPassword: form.password ? form.confirmPassword : undefined
      });
      if (res?.data?.success) {
        if (res?.data?.requiresVerification) {
          setToast({ message: "Registration successful! Please check your email for verification code.", type: "success" });
          // Store email for verification page
          localStorage.setItem('pendingVerificationEmail', form.email);
          setTimeout(() => nav("/verify-email", { state: { email: form.email } }), 1200);
        } else {
          setToast({ message: "Registration successful! Please log in.", type: "success" });
          setTimeout(() => nav("/login"), 1200);
        }
      } else {
        setToast({ message: res?.data?.message || "Registration failed.", type: "error" });
      }
    } catch (err) {
      console.error("Registration error:", err);
      const message = err?.response?.data?.message || err?.message || "Registration failed. Please try again.";
      setToast({ message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const u = await firebaseGoogleSignIn();
      // Auto-register on backend if needed
      try {
        // Normalize names to meet validation requirements
        let firstName = (u?.user?.displayName || '').split(' ')[0] || 'Farmer';
        let lastName = (u?.user?.displayName || '').split(' ').slice(1).join(' ') || 'User';
        
        // Ensure names meet the validation requirements (only letters, min 2 chars)
        firstName = firstName.replace(/[^A-Za-z]/g, '') || 'Farmer';
        lastName = lastName.replace(/[^A-Za-z]/g, '') || 'User';
        
        // Ensure minimum length
        if (firstName.length < 2) firstName = 'Farmer';
        if (lastName.length < 2) lastName = 'User';
        
        await apiClient.post('/auth/register', {
          firstName,
          lastName,
          email: u?.user?.email,
        });
      } catch (_) {
        // ignore if already exists
      }
      nav("/login");
    } catch (err) {
      setToast({ 
        message: err.message || "Google sign-up failed. Please try again.", 
        type: "error" 
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 hidden-until-ready relative"
      style={{
        background: "linear-gradient(135deg, #e8f5e8 0%, #f0f9eb 25%, #e6f4ea 50%, #d4ede1 75%, #c8e6c8 100%)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 15s ease infinite"
      }}
    >
      {/* Decorative plant background image */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/New Crop Variety.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(1px)"
        }}
      ></div>
      
      {/* Fixed Home Button */}
      <button
        onClick={() => nav("/")}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 rounded-full px-4 py-2 shadow-lg hover:shadow-xl border border-green-200 group"
        aria-label="Go to Home"
      >
        <Home className="w-4 h-4 text-green-600 group-hover:text-green-700 transition-colors" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          Home
        </span>
      </button>
      {/* Decorative leaves */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          ref={(el) => (leafRefs.current[i] = el)}
          className="absolute text-green-600"
          style={{
            fontSize: "5rem",
            top: `${10 + i * 18}%`,
            left: i % 2 === 0 ? "5%" : "88%",
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
                  p-8 relative overflow-hidden z-20`}
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
            Join the Farming
          </span> Revolution
        </h1>
        
        {/* Supporting text */}
        <p 
          ref={subheadRef}
          className="text-center mb-6 text-gray-700 relative z-10"
          style={{ opacity: 0 }}
        >
          Create your account to unlock personalized crop guidance, weather alerts, and soil health analytics.
        </p>
        
        <form onSubmit={onSubmit} className="relative z-10">
          <div ref={el => fieldsRef.current[0] = el} style={{ opacity: 0 }}>
            <InputField 
              label="First Name" 
              type="text"
              placeholder="Your first name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          
          <div ref={el => fieldsRef.current[1] = el} style={{ opacity: 0 }}>
            <InputField 
              label="Last Name" 
              type="text"
              placeholder="Your last name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          
          <div ref={el => fieldsRef.current[2] = el} style={{ opacity: 0 }}>
            <InputField 
              label="Email Address" 
              type="email"
              placeholder="you@yourfarm.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          
          <div ref={el => fieldsRef.current[3] = el} style={{ opacity: 0 }}>
            <PasswordField 
              label="Create Password" 
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          
          <div ref={el => fieldsRef.current[4] = el} style={{ opacity: 0 }}>
            <PasswordField 
              label="Confirm Password" 
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>
          
          <div ref={buttonsRef} className="mt-6 flex flex-col gap-4" style={{ opacity: 0 }}>
            <Button 
              type="submit" 
              variant="primary"
              disabled={isLoading}
              className="group relative overflow-hidden"
            >
              <div className="font-bold">
                {isLoading ? "Creating Account..." : "Start Your Journey"}
              </div>
              {!isLoading && (
                <div className="text-xs font-normal mt-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  Join 25,000+ farmers
                </div>
              )}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-green-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-600">
                  Or continue with
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
                <span className="font-bold">
                  {googleLoading ? "Signing up..." : "Sign up with Google"}
                </span>
                <span className="text-xs font-normal opacity-90 group-hover:opacity-100 transition-opacity">
                  {googleLoading ? "Please wait..." : "Quick & secure"}
                </span>
              </div>
            </Button>
          </div>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-600 relative z-10">
          Already have an account?{' '}
          <button 
            type="button"
            onClick={() => nav("/login")}
            className="text-green-600 font-medium hover:text-green-700 hover:underline transition-colors duration-200"
          >
            Login instead
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