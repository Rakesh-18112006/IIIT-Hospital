import express from "express";
import {
  googleAuth,
  login,
  registerStaff,
  getMe,
  completeProfile,
  updateProfile,
  getProfile,
  deleteProfile,
} from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/google", googleAuth);
router.post("/login", login);
router.post("/register", registerStaff);

// Protected routes
router.get("/me", protect, getMe);

// Student profile routes
router.put("/complete-profile", protect, authorize("student"), completeProfile);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, authorize("student"), updateProfile);
router.delete("/profile", protect, authorize("student"), deleteProfile);

export default router;
