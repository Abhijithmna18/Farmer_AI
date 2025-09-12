import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import Button from "../components/Button";
import Toast from "../components/Toast";
import apiClient from "../services/apiClient";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const containerRef = useRef();
  const titleRef = useRef();
  const subtitleRef = useRef();
  const otpRefs = useRef([]);
  const buttonRef = useRef();
  const timerRef = useRef();

  useEffect(() => {
    // Get email from location state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem('pendingVerificationEmail');
    const userEmail = emailFromState || emailFromStorage;
    
    if (userEmail) {
      setEmail(userEmail);
      localStorage.setItem('pendingVerificationEmail', userEmail);
    } else {
      // If no email, redirect to register
      navigate('/register');
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = timer;

    // GSAP animations
    const tl = gsap.timeline({ delay: 0.2 });
    
    tl.fromTo(containerRef.current, 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    )
    .fromTo(titleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.2)" },
      "-=0.4"
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      "-=0.3"
    )
    .fromTo(otpRefs.current,
      { opacity: 0, y: 20, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.2)" },
      "-=0.2"
    )
    .fromTo(buttonRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
      "-=0.1"
    );

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [location.state, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((digit, idx) => !digit && idx >= pastedData.length);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setToast({ message: "Please enter all 6 digits", type: "error" });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiClient.post('/auth/verify-email', {
        email,
        code: otpCode
      });

      if (response.data.success) {
        setToast({ message: "Email verified successfully! You can now log in.", type: "success" });
        localStorage.removeItem('pendingVerificationEmail');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setToast({ message: response.data.message || "Verification failed", type: "error" });
      }
    } catch (error) {
      console.error('Verification error:', error);
      const message = error?.response?.data?.message || "Verification failed. Please try again.";
      setToast({ message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    
    try {
      const response = await apiClient.post('/auth/resend-otp', { email });
      
      if (response.data.success) {
        setToast({ message: "New verification code sent!", type: "success" });
        setTimeLeft(600); // Reset timer
        setIsExpired(false);
        setOtp(['', '', '', '', '', '']); // Clear OTP inputs
        otpRefs.current[0]?.focus(); // Focus first input
      } else {
        setToast({ message: response.data.message || "Failed to resend code", type: "error" });
      }
    } catch (error) {
      console.error('Resend error:', error);
      const message = error?.response?.data?.message || "Failed to resend code. Please try again.";
      setToast({ message, type: "error" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #e8f5e8 0%, #f0f9eb 25%, #e6f4ea 50%, #d4ede1 75%, #c8e6c8 100%)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 15s ease infinite"
      }}
    >
      <div 
        ref={containerRef}
        className="w-full max-w-md bg-white bg-opacity-90 backdrop-blur-xl rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)] p-8 relative overflow-hidden"
        style={{ opacity: 0 }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-50 rounded-tr-full"></div>

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📧</span>
          </div>
          
          <h1 
            ref={titleRef}
            className="text-2xl font-bold text-gray-800 mb-2"
            style={{ opacity: 0 }}
          >
            Verify Your Email
          </h1>
          
          <p 
            ref={subtitleRef}
            className="text-gray-600"
            style={{ opacity: 0 }}
          >
            We've sent a 6-digit code to<br />
            <span className="font-semibold text-green-600">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-green-200 
                         rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 
                         transition-colors bg-white/90"
                style={{ opacity: 0 }}
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center">
            {!isExpired ? (
              <p className="text-sm text-gray-600">
                Code expires in{' '}
                <span className={`font-mono font-bold ${timeLeft <= 60 ? 'text-red-500' : 'text-green-600'}`}>
                  {formatTime(timeLeft)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium">
                Code expired. Please request a new one.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div ref={buttonRef} className="space-y-3" style={{ opacity: 0 }}>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || isExpired || otp.join('').length !== 6}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleResend}
                disabled={isResending || isLoading}
                className="flex-1"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/register')}
                className="flex-1"
              >
                Back to Register
              </Button>
            </div>
          </div>
        </form>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-green-600 hover:text-green-700 underline disabled:opacity-50"
            >
              resend code
            </button>
          </p>
        </div>
      </div>

      <Toast 
        message={toast?.message} 
        type={toast?.type} 
        onDismiss={() => setToast(null)} 
      />

      {/* Global styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `
      }} />
    </div>
  );
}