import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";

// Authentication Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Application Layout
import MainLayout from "./components/layout/MainLayout";

// Application Pages
import Dashboard from "./pages/dashboard/Dashboard";
import Subjects from "./pages/subjects/Subjects";
import Timetable from "./pages/timetable/Timetable";
import Attendance from "./pages/attendance/Attendance";
import Reports from "./pages/reports/Reports";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";

// Authentication Loading Screen
const AuthLoading = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

      <p className="mt-4 text-sm font-medium text-slate-600">
        Checking your session...
      </p>
    </div>
  );
};

// Public Route
const PublicRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Academic setup is NOT mandatory.
  // Every authenticated user can access all application pages.
  return children;
};

// Application Routes
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Default Route */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />

      {/* Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Old Setup URL */}
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

      {/* Protected Application Layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/subjects" element={<Subjects />} />

        <Route path="/timetable" element={<Timetable />} />

        <Route path="/attendance" element={<Attendance />} />

        <Route path="/reports" element={<Reports />} />

        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Unknown Routes */}
      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
};

// Main App
function App() {
  return (
    <AuthProvider>
      <AppRoutes />

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: "#ffffff",
            color: "#1e293b",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "14px 16px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#16a34a",
              secondary: "#ffffff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#dc2626",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
