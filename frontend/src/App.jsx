import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AnalysisProvider } from "./context/AnalysisContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import ReportInsightsPage from "./pages/ReportInsightsPage";
import AIChatPage from "./pages/AIChatPage";
import SpecialistDirectoryPage from "./pages/SpecialistDirectoryPage";
import HealthPredictPage from "./pages/HealthPredictPage";
import SettingsPage from "./pages/SettingsPage";
import DietPlanPage from "./pages/DietPlanPage";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RootRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function FloatingAIButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || location.pathname === '/ai-chat') return null;

  return (
    <button
      onClick={() => navigate("/ai-chat")}
      className="fixed bottom-24 md:bottom-8 right-6 md:right-8 z-[100] p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
      style={{ background: "linear-gradient(to bottom right, #1e667f, #075a72)", color: "#f0f9ff", width: "64px", height: "64px" }}
      title="AI Health Assistant"
    >
      <span className="material-symbols-outlined filled text-[32px] group-hover:rotate-12 transition-transform">smart_toy</span>
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AnalysisProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportInsightsPage /></ProtectedRoute>} />
          <Route path="/ai-chat" element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} />
          <Route path="/specialists" element={<ProtectedRoute><SpecialistDirectoryPage /></ProtectedRoute>} />
          <Route path="/predict" element={<ProtectedRoute><HealthPredictPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/diet-plan" element={<ProtectedRoute><DietPlanPage /></ProtectedRoute>} />
        </Routes>
        <FloatingAIButton />
      </AnalysisProvider>
    </AuthProvider>
  );
}

