import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PrivacyPage from "./pages/legal/PrivacyPage.jsx";
import TermsPage from "./pages/legal/TermsPage.jsx";
import DataDeletionPage from "./pages/legal/DataDeletionPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/app" element={<Dashboard />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/data-deletion" element={<DataDeletionPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

