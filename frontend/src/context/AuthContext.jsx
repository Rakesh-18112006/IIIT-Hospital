import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import api from "../config/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize from localStorage synchronously
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  // Google Sign In for Students
  const googleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      // Send to backend
      const response = await api.post("/auth/google", {
        email: googleUser.email,
        name: googleUser.displayName,
        googleId: googleUser.uid,
        studentId: `STU${Date.now()}`,
      });

      const userData = response.data;
      localStorage.setItem("token", userData.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  // Email/Password Login for Staff
  const staffLogin = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const userData = response.data;

      localStorage.setItem("token", userData.token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Staff login error:", error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Firebase sign out error:", error);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const isAuthenticated = user !== null;

  const value = useMemo(
    () => ({
      user,
      loading,
      googleSignIn,
      staffLogin,
      logout,
      isAuthenticated,
    }),
    [user, loading, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
