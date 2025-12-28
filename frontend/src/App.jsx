import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import {
  ProtectedRoute,
  PublicRoute,
  ProfileCompletionRoute,
} from "./components/ProtectedRoute";
import Login from "./pages/Login";
import CompleteProfile from "./pages/CompleteProfile";
import StudentDashboard from "./pages/StudentDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MessDashboard from "./pages/MessDashboard";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Complete Profile Route - for students who need to complete profile */}
          <Route
            path="/complete-profile"
            element={
              <ProfileCompletionRoute>
                <CompleteProfile />
              </ProfileCompletionRoute>
            }
          />

          {/* Student Dashboard */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Doctor Dashboard */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Hospital Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["hospital_admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Mess Admin Dashboard */}
          <Route
            path="/mess"
            element={
              <ProtectedRoute allowedRoles={["mess_admin"]}>
                <MessDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
