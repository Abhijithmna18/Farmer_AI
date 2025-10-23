import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { BookingCartProvider } from "./context/BookingCartContext";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SidebarLayout from "./components/SidebarLayout";
import Recommendations from "./pages/Recommendations";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import ProfileDashboard from "./components/ProfileDashboard";
import AdvancedSettings from "./components/AdvancedSettings";
import Settings from "./pages/Settings";
import Assistant from "./pages/Assistant";
import Chatbot from "./components/Chatbot";
import Blog from "./pages/Blog";
import Events from "./pages/Events";
import Help from "./pages/Help";
import Community from "./pages/Community";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Gallery from "./pages/Gallery";
import GrowthCalendar from "./pages/GrowthCalendar";
import GrowthCalendarDetail from "./pages/GrowthCalendarDetail";
import CreateGrowthCalendar from "./pages/CreateGrowthCalendar";
import ProtectedRoute from "./components/ProtectedRoute";
import SearchResults from "./pages/SearchResults";
import AdminRouter from "./pages/AdminRouter";
import OwnerRouter from "./pages/OwnerDashboard/OwnerRouter";
import PlantExplorer from "./pages/PlantExplorer";
import Feedback from "./pages/Feedback";
import WarehouseModule from "./pages/WarehouseModule";
import FarmMonitoring from "./pages/FarmMonitoring";
import WarehouseOwnerDashboard from "./pages/WarehouseOwnerDashboard";
import WarehouseDetails from "./pages/WarehouseDetails";
import WarehouseMarketplace from "./pages/WarehouseMarketplace";
import WarehouseBooking from "./pages/WarehouseBooking";
import MyBookings from "./pages/MyBookings";
import Payment from "./pages/Payment";
import WorkshopTutorials from "./pages/WorkshopTutorials";
import WorkshopDetail from "./pages/WorkshopDetail";
import WorkshopVideo from "./pages/WorkshopVideo";
import Subscription from "./pages/Subscription";
import { Toaster } from 'react-hot-toast';

function App() {
  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BookingCartProvider>
          {/* Floating Chatbot visible on all pages */}
          <Chatbot />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/events" element={<Events />} />
          <Route path="/help" element={<Help />} />
          <Route path="/community" element={<Community />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/search" element={<SearchResults />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<SidebarLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="reports" element={<Reports />} />
              <Route path="growth-calendar" element={<GrowthCalendar />} />
              <Route path="growth-calendar/new" element={<CreateGrowthCalendar />} />
              <Route path="growth-calendar/:id" element={<GrowthCalendarDetail />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile-dashboard" element={<ProfileDashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route path="advanced-settings" element={<AdvancedSettings />} />
              <Route path="plants" element={<PlantExplorer />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="warehouse" element={<WarehouseModule />} />
              <Route path="farm-monitoring" element={<FarmMonitoring />} />
              <Route path="warehouses" element={<WarehouseMarketplace />} />
              <Route path="warehouses/:id" element={<WarehouseDetails />} />
              <Route path="warehouses/:id/book" element={<WarehouseBooking />} />
              <Route path="my-bookings" element={<MyBookings />} />
              <Route path="payment/:bookingId" element={<Payment />} />
              <Route path="workshops" element={<WorkshopTutorials />} />
              <Route path="workshops/:id" element={<WorkshopDetail />} />
              <Route path="workshops/:id/watch" element={<WorkshopVideo />} />
              <Route path="subscription/:plan" element={<Subscription />} />
              {/* Removed owner dashboard from user layout */}
            </Route>
          </Route>
          {/* Owner Protected Route (top-level, own panel) */}
          <Route path="/owner/*" element={<OwnerRouter />} />

          {/* Admin Protected Route */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/*" element={<AdminRouter />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </BookingCartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


export default App;
