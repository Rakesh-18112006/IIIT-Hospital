import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  savePrescription,
  getPrescriptionById,
  getPatientPrescriptions,
  getMedicineTimings,
  updateMedicineCompliance,
  getMedicineSchedule,
  downloadPrescriptionPDF,
} from "../controllers/prescriptionController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// ===== Doctor Routes =====
// Save prescription (called when doctor completes consultation)
router.post("/save", authorize("doctor"), savePrescription);

// ===== Patient Routes =====
// Get all prescriptions for logged-in patient
router.get("/my-prescriptions", authorize("student"), async (req, res) => {
  try {
    // Pass the current user's ID as patientId
    req.params.patientId = req.user._id;
    await getPatientPrescriptions(req, res);
  } catch (error) {
    res.status(500).json({ message: "Error fetching prescriptions" });
  }
});

// Get specific prescription
router.get("/:id", getPrescriptionById);

// Get medicine timings for patient (for reminders)
router.get("/patient/:patientId/medicine-timings", getMedicineTimings);

// Get medicine schedule
router.get("/:id/medicine-schedule", getMedicineSchedule);

// Update medicine compliance (mark as taken/skipped)
router.post("/:id/update-compliance", authorize("student"), updateMedicineCompliance);

// Download prescription as PDF
router.get("/:id/download-pdf", downloadPrescriptionPDF);

// ===== Admin Routes =====
// Admin can view all prescriptions (can be added later)

export default router;
