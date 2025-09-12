import React, { useState, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import InputField from "../components/InputField";
import PasswordField from "../components/PasswordField";
import Button from "../components/Button";
import { firebasePasswordReset } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import Loader from "../components/Loader";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = request, 2 = reset, 3 = success
  const [form, setForm] = useState({ 
    email: "", 
    code: ["", "", "", "", "", ""],
    newPassword: "",
    confirmPassword: ""
  });
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const nav = useNavigate();
  
  const containerRef = useRef();
  const headlineRef = useRef();
  const textRef = useRef();
  const fieldsRef = useRef([]);
  const buttonRef = useRef();
  const codeRefs = useRef([]);
  const leafRefs = useRef([]);

  useLayoutEffect(() => {
    const checkElementsReady = () => {
      const elementsToCheck = [
        containerRef.current,
        headlineRef.current,
        textRef.current,
        buttonRef.current
      ];

      return elementsToCheck.every(element => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
    };

    const startAnimations = () => {
      if (!checkElementsReady()) {
        setTimeout(startAnimations, 16);
        return;
      }

      // Set initial states
      gsap.set([containerRef.current, headlineRef.current, textRef.current, buttonRef.current], {
        opacity: 0
      });
      
      gsap.set(leafRefs.current, {
        opacity: 0,
        scale: 0.8
      });

      // Main animation timeline
      const tl = gsap.timeline({ delay: 0.1 });

      tl.to(containerRef.current, {
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
        .to(textRef.current, {
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
        .to(buttonRef.current, {
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
  }, [step]);

  const handleCodeChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newCode = [...form.code];
    newCode[index] = value;
    setForm({ ...form, code: newCode });
    
    // Auto-focus next input
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !form.code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const onSendReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!form.email) {
      setToast({ message: "Please enter your email", type: "error" });
      setIsLoading(false);
      return;
    }
    
    try {
      await firebasePasswordReset(form.email);
      setToast({ 
        message: "Reset code sent! Check your email.", 
        type: "success" 
      });
      setStep(2);
    } catch (err) {
      setToast({ 
        message: err.message || "Error sending reset email", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate reset process
    setTimeout(() => {
      setIsLoading(false);
      setToast({ 
        message: "✅ Password updated! Redirecting you to your dashboard...", 
        type: "success" 
      });
      setStep(3);
      
      // Redirect to login after delay
      setTimeout(() => nav("/login"), 300);
    }, 150);
  };

  const renderStep1 = () => (
    <>
      <h1 
        ref={headlineRef}
        className="text-3xl font-bold mb-4 text-gray-800 text-center relative z-10"
        style={{ opacity: 0 }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
          Reset Password
        </span> Quickly
      </h1>
      
      <p 
        ref={textRef}
        className="text-lg mb-8 text-gray-700 text-center relative z-10"
        style={{ opacity: 0 }}
      >
        Enter your email and we'll send a verification code to reset your password.
      </p>
      
      <div ref={el => fieldsRef.current[0] = el} style={{ opacity: 0 }}>
        <InputField 
          label="Email Address" 
          type="email"
          placeholder="you@yourfarm.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      
      <div ref={buttonRef} className="mt-4" style={{ opacity: 0 }}>
        <Button 
          type="submit" 
          variant="primary"
          className="w-full group relative overflow-hidden"
          disabled={isLoading}
        >
          <div className="font-bold">
            {isLoading ? "Sending Reset Code..." : "Send Reset Code"}
          </div>
          {!isLoading && (
            <div className="text-xs font-normal mt-1 opacity-90 group-hover:opacity-100 transition-opacity">
              Check your email inbox
            </div>
          )}
        </Button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <h1 
        ref={headlineRef}
        className="text-3xl font-bold mb-4 text-gray-800 text-center relative z-10"
        style={{ opacity: 0 }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
          Create New
        </span> Password
      </h1>
      
      <p 
        ref={textRef}
        className="text-lg mb-8 text-gray-700 text-center relative z-10"
        style={{ opacity: 0 }}
      >
        Enter the 6-digit code we sent to <span className="font-semibold text-green-600">{form.email}</span> and create a new password.
      </p>
      
      <div className="mb-6 flex justify-center gap-2">
        {form.code.map((digit, index) => (
          <input
            key={index}
            ref={el => codeRefs.current[index] = el}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-12 text-center text-lg bg-white bg-opacity-90 backdrop-blur-sm
                      border-2 border-green-100 rounded-xl
                      shadow-[0_4px_12px_rgba(76,175,80,0.15)]
                      focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/30
                      transition-all duration-200 hover:border-green-200"
          />
        ))}
      </div>
      
      <div ref={el => fieldsRef.current[0] = el} style={{ opacity: 0 }}>
        <PasswordField 
          label="New Password" 
          placeholder="••••••••"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        />
      </div>
      
      <div ref={el => fieldsRef.current[1] = el} style={{ opacity: 0 }}>
        <PasswordField 
          label="Confirm New Password" 
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        />
      </div>
      
      <div ref={buttonRef} className="mt-4" style={{ opacity: 0 }}>
        <Button 
          type="submit" 
          variant="primary"
          className="w-full group relative overflow-hidden"
          disabled={isLoading || form.code.some(d => d === "")}
        >
          <div className="font-bold">
            {isLoading ? "Resetting Password..." : "Update Password"}
          </div>
          {!isLoading && (
            <div className="text-xs font-normal mt-1 opacity-90 group-hover:opacity-100 transition-opacity">
              Secure your account
            </div>
          )}
        </Button>
      </div>
    </>
  );

  const renderStep3 = () => (
    <div className="text-center relative z-10">
      <div className="text-6xl mb-6">✅</div>
      <h1 
        ref={headlineRef}
        className="text-3xl font-bold mb-4 text-gray-800"
        style={{ opacity: 0 }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
          Password Updated
        </span> Successfully!
      </h1>
      
      <p 
        ref={textRef}
        className="text-lg mb-8 text-gray-700"
        style={{ opacity: 0 }}
      >
        Your password has been updated successfully. Redirecting you to login...
      </p>
      
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-green-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-gray-600">
              Taking you back to sign in
            </span>
          </div>
        </div>
      </div>
      
      <Loader size="sm" text="Redirecting to login" />
    </div>
  );

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
            fontSize: "4rem",
            top: `${20 + i * 25}%`,
            left: i % 2 === 0 ? "10%" : "85%",
            transform: `rotate(${i % 2 === 0 ? -15 : 15}deg) scale(0.8)`,
            zIndex: 0,
            opacity: 0
          }}
        >
          🍃
        </div>
      ))}

      <div 
        ref={containerRef}
        className="w-full max-w-md bg-white bg-opacity-90 backdrop-blur-xl rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)] p-8 relative overflow-hidden z-10"
        style={{ opacity: 0 }}
      >
        {/* Decorative accents */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full z-0"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-50 rounded-tr-full z-0"></div>

        <form onSubmit={step === 1 ? onSendReset : onResetPassword} className="relative z-10">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </form>
        
        {step !== 3 && (
          <div className="text-center mt-6 relative z-10">
            <button 
              type="button"
              onClick={() => nav("/login")}
              className="text-green-600 font-medium hover:text-green-700 hover:underline text-sm transition-colors duration-200"
            >
              {step === 1 ? "Remembered your password? Sign in" : "Back to login"}
            </button>
          </div>
        )}
      </div>
      
      <Toast 
        message={toast?.message} 
        type={toast?.type} 
        onDismiss={() => setToast(null)} 
      />
      
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