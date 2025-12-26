import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protected Route Component
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if student needs to complete profile
  if (user.role === "student" && !user.profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardRoutes = {
      student: "/student",
      doctor: "/doctor",
      hospital_admin: "/admin",
      mess_admin: "/mess",
    };
    const targetRoute = dashboardRoutes[user.role];

    // Prevent redirect loop by checking if we're not already going there
    if (targetRoute && location.pathname !== targetRoute) {
      return <Navigate to={targetRoute} replace />;
    }
    // If no valid route or already there, show login
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Redirect if already authenticated
export const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (isAuthenticated && user && user.role) {
    // If student profile is not complete, redirect to complete-profile
    if (user.role === "student" && !user.profileCompleted) {
      return <Navigate to="/complete-profile" replace />;
    }

    const dashboardRoutes = {
      student: "/student",
      doctor: "/doctor",
      hospital_admin: "/admin",
      mess_admin: "/mess",
    };
    const targetRoute = dashboardRoutes[user.role];

    if (targetRoute) {
      return <Navigate to={targetRoute} replace />;
    }
  }

  return children;
};

// Route for profile completion - only for authenticated students with incomplete profiles
export const ProfileCompletionRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Not a student - redirect to appropriate dashboard
  if (user.role !== "student") {
    const dashboardRoutes = {
      doctor: "/doctor",
      hospital_admin: "/admin",
      mess_admin: "/mess",
    };
    return <Navigate to={dashboardRoutes[user.role] || "/login"} replace />;
  }

  // Profile already completed - redirect to student dashboard
  if (user.profileCompleted) {
    return <Navigate to="/student" replace />;
  }

  return children;
};
