import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getDoctorQueue,
  updateAppointmentStatus,
  updateAppointmentPriority,
  rescheduleAppointment,
  getNotifications,
  markNotificationRead,
  clearNotification,
  getAllAppointments,
  getAllQueues,
  getAIAnalytics,
} from "../controllers/appointmentController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// ===== Student Routes =====
// Get all available doctors
router.get("/doctors", authorize("student"), getDoctors);

// Get available slots for a doctor
router.get("/slots/:doctorId", authorize("student"), getAvailableSlots);

// Book an appointment
router.post("/book", authorize("student"), bookAppointment);

// Get student's own appointments
router.get("/my-appointments", authorize("student"), getMyAppointments);

// Cancel an appointment
router.put("/:id/cancel", authorize("student"), cancelAppointment);

// Get notifications for student
router.get("/notifications", authorize("student"), getNotifications);

// Mark notification as read
router.put(
  "/notifications/:id/read",
  authorize("student"),
  markNotificationRead
);

// Clear/dismiss notification
router.delete("/notifications/:id", authorize("student"), clearNotification);

// ===== Doctor Routes =====
// Get doctor's queue for today
router.get("/doctor/queue", authorize("doctor"), getDoctorQueue);

// Update appointment status
router.put("/doctor/:id/status", authorize("doctor"), updateAppointmentStatus);

// Reschedule appointment to next available slot
router.put(
  "/doctor/:id/reschedule",
  authorize("doctor"),
  rescheduleAppointment
);

// Update appointment priority (doctor can escalate/downgrade)
router.put(
  "/doctor/:id/priority",
  authorize("doctor"),
  updateAppointmentPriority
);

// ===== Admin Routes =====
// Get all appointments
router.get("/admin/all", authorize("hospital_admin"), getAllAppointments);

// Get all doctor queues
router.get("/admin/queues", authorize("hospital_admin"), getAllQueues);

// Get AI prioritization analytics
router.get("/admin/analytics", authorize("hospital_admin"), getAIAnalytics);

// Admin can also update priority
router.put(
  "/admin/:id/priority",
  authorize("hospital_admin"),
  updateAppointmentPriority
);

export default router;
