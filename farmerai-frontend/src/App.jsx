import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
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
import Settings from "./pages/Settings";
import Assistant from "./pages/Assistant";
import Chatbot from "./components/Chatbot";
import Blog from "./pages/Blog";
import Events from "./pages/Events";
import Help from "./pages/Help";
import Community from "./pages/Community";
import AboutUs from "./pages/AboutUs";
import Gallery from "./pages/Gallery";
import GrowthCalendar from "./pages/GrowthCalendar";
import GrowthCalendarDetail from "./pages/GrowthCalendarDetail";
import CreateGrowthCalendar from "./pages/CreateGrowthCalendar";
import ProtectedRoute from "./components/ProtectedRoute";
import SearchResults from "./pages/SearchResults";
import AdminRouter from "./pages/AdminRouter";
import PlantExplorer from "./pages/PlantExplorer";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Floating Chatbot visible on all pages */}
        <Chatbot />
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
              <Route path="settings" element={<Settings />} />
              <Route path="plants" element={<PlantExplorer />} />
            </Route>
          </Route>
          {/* Admin Protected Route */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/*" element={<AdminRouter />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}


export default App;
