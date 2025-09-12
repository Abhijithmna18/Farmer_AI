import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import PhoneField from "./PhoneField";
import RememberMeCheckbox from "./RememberMeCheckbox";
import Button from "./Button";
import Toast from "./Toast";
import { rememberMeStorage } from "../utils/inputValidation";

export default function LoginFormDemo() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: ""
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const savedData = rememberMeStorage.get();
    if (savedData) {
      setForm({
        email: savedData.email || "",
        password: savedData.password || "",
        phone: savedData.phone || ""
      });
      setRememberMe(savedData.remember || false);
      
      if (savedData.email) {
        setToast({
          message: "Welcome back! Your login details have been restored.",
          type: "info"
        });
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!form.email || !form.password) {
      setToast({ message: "Please fill in all required fields", type: "error" });
      setIsLoading(false);
      return;
    }

    // Simulate login process
    setTimeout(() => {
      // Save data if remember me is checked
      if (rememberMe) {
        rememberMeStorage.save({
          email: form.email,
          password: form.password,
          phone: form.phone
        }, true);
      } else {
        rememberMeStorage.clear();
      }

      setToast({ 
        message: "Login successful! All validations passed.", 
        type: "success" 
      });
      setIsLoading(false);
    }, 1500);
  };

  const clearForm = () => {
    setForm({ email: "", password: "", phone: "" });
    setRememberMe(false);
    rememberMeStorage.clear();
    setToast({ message: "Form cleared and storage cleaned", type: "info" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: "linear-gradient(135deg, #e8f5e8 0%, #f0f9eb 25%, #e6f4ea 50%, #d4ede1 75%, #c8e6c8 100%)",
      backgroundSize: "400% 400%",
      animation: "gradientShift 15s ease infinite"
    }}>
      <div className="w-full max-w-md bg-white bg-opacity-90 backdrop-blur-xl rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.25)] p-8 relative overflow-hidden">
        {/* Decorative accents */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full z-0"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-50 rounded-tr-full z-0"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-center mb-3 text-gray-800">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
              Enhanced Form
            </span> Demo
          </h1>
          
          <p className="text-center mb-6 text-gray-700">
            Test all validation features and remember me functionality
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <InputField 
              label="Email Address" 
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            {/* Password Field with Space Validation */}
            <PasswordField 
              label="Password (No Spaces Allowed)" 
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {/* Phone Field with Digit-Only Validation */}
            <PhoneField 
              label="Phone Number (10 Digits Only)" 
              placeholder="1234567890"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              showFormatted={true}
            />

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between mb-6">
              <RememberMeCheckbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                label="Remember Me"
              />
              <button 
                type="button"
                onClick={clearForm}
                className="text-sm text-red-600 font-medium hover:text-red-700 hover:underline transition-colors duration-200"
              >
                Clear Form
              </button>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="primary"
              disabled={isLoading}
              className="w-full group relative overflow-hidden"
            >
              <div className="font-bold">
                {isLoading ? "Processing..." : "Test Login"}
              </div>
              {!isLoading && (
                <div className="text-xs font-normal mt-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  Try all validation features
                </div>
              )}
            </Button>
          </form>

          {/* Feature List */}
          <div className="mt-8 p-4 bg-green-50 rounded-2xl">
            <h3 className="font-bold text-green-800 mb-3">✨ Features to Test:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Password: Try typing spaces (blocked)</li>
              <li>• Phone: Try letters/symbols (blocked)</li>
              <li>• Phone: Limited to 10 digits max</li>
              <li>• Remember Me: Saves to localStorage</li>
              <li>• Form validation with error messages</li>
              <li>• Auto-restore on page refresh</li>
            </ul>
          </div>

          {/* Storage Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {rememberMe ? "Data will be saved in localStorage" : "Data will be cleared on browser close"}
            </p>
          </div>
        </div>
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
      `}</style>
    </div>
  );
}