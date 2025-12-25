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
