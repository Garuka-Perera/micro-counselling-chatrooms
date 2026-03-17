import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import BecomeListenerPage from "./pages/BecomeListenerPage";
import ChatPage from "./pages/ChatPage";
import EmergencyHelpPage from "./pages/EmergencyHelpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import ListenerLoginPage from "./pages/ListenerLoginPage";
import ListenerSignupPage from "./pages/ListenerSignupPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UserLoginPage from "./pages/UserLoginPage";
import UserSignupPage from "./pages/UserSignupPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/become-a-listener" element={<BecomeListenerPage />} />
        <Route path="/become-listener" element={<Navigate to="/become-a-listener" replace />} />
        <Route path="/emergency-help" element={<EmergencyHelpPage />} />

        <Route path="/chat" element={<ChatPage />} />

        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboardPage />} />

        <Route path="/listener-signup" element={<ListenerSignupPage />} />
        <Route path="/listener-login" element={<ListenerLoginPage />} />

        <Route path="/user-signup" element={<UserSignupPage />} />
        <Route path="/user-login" element={<UserLoginPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/login/admin" element={<Navigate to="/admin-login" replace />} />
        <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
        <Route path="/signup/listener" element={<Navigate to="/listener-signup" replace />} />
        <Route path="/login/listener" element={<Navigate to="/listener-login" replace />} />
        <Route path="/signup/user" element={<Navigate to="/user-signup" replace />} />
        <Route path="/login/user" element={<Navigate to="/user-login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}