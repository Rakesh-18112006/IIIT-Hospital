import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import nodemailer from "nodemailer";
import { generatePrescriptionReceiptEmail } from "../utils/emailTemplates.js";

/**
 * Save prescription with medicines and timings
 * POST /api/prescriptions/save
 */
export const savePrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, symptoms, medicines, notes, advice, interactions } = req.body;
    const doctorId = req.user._id;

    // Validate required fields
    if (!appointmentId || !diagnosis || !medicines || medicines.length === 0) {
      return res.status(400).json({
        message: "Missing required fields: appointmentId, diagnosis, medicines",
      });
    }

    // Get appointment to find patient
    const appointment = await Appointment.findById(appointmentId).populate("patientId");
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const patientId = appointment.patientId._id;
    const patient = appointment.patientId;

    // Get doctor info
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Create prescription with medicine timings
    const prescription = new Prescription({
      appointmentId,
      patientId,
      doctorId,
      diagnosis,
      symptoms: symptoms || [],
      medicines: medicines.map((med) => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
        timings: med.timings || [], // e.g., ["morning", "evening"]
        specificTimes: convertTimingsToTimes(med.timings),
        medicineSchedule: initializeMedicineSchedule(med.timings),
      })),
      notes,
      advice,
      interactions: interactions || [],
      doctor: {
        name: doctor.name,
        department: doctor.department,
      },
      hospital: {
        name: "IIIT Hospital",
        address: "RGUKT Campus, Telangana",
      },
    });

    await prescription.save();

    // Update appointment status
    appointment.status = "completed";
    appointment.prescription = prescription._id;
    await appointment.save();

    // Send email notification with prescription details
    const emailSent = await sendPrescriptionEmail(patient, doctor, prescription, appointment);

    // Mark as emailed
    prescription.emailSent = emailSent;
    prescription.emailSentAt = new Date();
    await prescription.save();

    // Add notification to patient
    patient.notifications.push({
      type: "prescription",
      title: "New Prescription Available",
      message: `Dr. ${doctor.name} has issued a new prescription for you.`,
      data: {
        prescriptionId: prescription._id,
        doctorName: doctor.name,
        diagnosis: diagnosis,
      },
      read: false,
    });
    await patient.save();

    res.status(201).json({
      message: "Prescription saved successfully and email sent to patient",
      prescription,
      emailSent,
    });
  } catch (error) {
    console.error("Error saving prescription:", error);
    res.status(500).json({
      message: "Error saving prescription",
      error: error.message,
    });
  }
};

/**
 * Get prescription by ID
 * GET /api/prescriptions/:id
 */
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "name studentId email")
      .populate("doctorId", "name department")
      .populate("appointmentId");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Check authorization
    if (prescription.patientId._id.toString() !== req.user._id.toString() &&
        prescription.doctorId._id.toString() !== req.user._id.toString() &&
        req.user.role !== "hospital_admin") {
      return res.status(403).json({ message: "Not authorized to view this prescription" });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: "Error fetching prescription", error: error.message });
  }
};

/**
 * Get patient's prescriptions
 * GET /api/prescriptions/patient/:patientId
 */
export const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Authorization check
    if (req.user._id.toString() !== patientId && req.user.role !== "hospital_admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const prescriptions = await Prescription.find({ patientId })
      .populate("doctorId", "name department")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
  }
};

/**
 * Get medicine timings for a patient (for medicine reminder system)
 * GET /api/prescriptions/patient/:patientId/medicine-timings
 */
export const getMedicineTimings = async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Authorization check
    if (req.user._id.toString() !== patientId && req.user.role !== "hospital_admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get active prescriptions
    const prescriptions = await Prescription.find({
      patientId,
      status: "active",
    }).select("medicines");

    // Combine all medicines with their timings
    const allMedicineTimings = [];

    prescriptions.forEach((prescription) => {
      prescription.medicines.forEach((medicine) => {
        allMedicineTimings.push({
          medicineName: medicine.name,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          duration: medicine.duration,
          timings: medicine.timings,
          specificTimes: medicine.specificTimes,
          instructions: medicine.instructions,
          prescriptionId: prescription._id,
        });
      });
    });

    // Group by timing for easier display
    const medicinesByTiming = {
      morning: [],
      noon: [],
      evening: [],
      night: [],
    };

    allMedicineTimings.forEach((med) => {
      med.timings.forEach((timing) => {
        medicinesByTiming[timing].push(med);
      });
    });

    res.json({
      allMedicines: allMedicineTimings,
      medicinesByTiming,
      totalActive: prescriptions.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching medicine timings", error: error.message });
  }
};

/**
 * Update medicine compliance (mark as taken/skipped)
 * POST /api/prescriptions/:id/update-medicine-compliance
 */
export const updateMedicineCompliance = async (req, res) => {
  try {
    const { medicineIndex, taken, notes } = req.body;
    const prescriptionId = req.params.id;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Authorization check
    if (prescription.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (medicineIndex < 0 || medicineIndex >= prescription.medicines.length) {
      return res.status(400).json({ message: "Invalid medicine index" });
    }

    const medicine = prescription.medicines[medicineIndex];

    // Add to medicine schedule
    medicine.medicineSchedule.push({
      date: new Date(),
      time: new Date().toLocaleTimeString("en-IN"),
      taken: taken,
      notes: notes || "",
    });

    // Update compliance stats
    if (taken) {
      prescription.compliance.medicinesTaken += 1;
    } else {
      prescription.compliance.medicinesSkipped += 1;
    }
    prescription.compliance.lastUpdated = new Date();

    await prescription.save();

    res.json({
      message: "Medicine compliance updated",
      compliance: prescription.compliance,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating compliance", error: error.message });
  }
};

/**
 * Get medicine schedule as JSON (for reminders/notifications)
 * GET /api/prescriptions/:id/medicine-schedule
 */
export const getMedicineSchedule = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Authorization check
    if (prescription.patientId.toString() !== req.user._id.toString() &&
        req.user.role !== "hospital_admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const schedule = prescription.medicines.map((med) => ({
      medicineName: med.name,
      dosage: med.dosage,
      timings: med.timings,
      specificTimes: med.specificTimes,
      duration: med.duration,
      nextDueTime: getNextDueTime(med.specificTimes),
      compliance: {
        taken: med.medicineSchedule.filter((s) => s.taken).length,
        skipped: med.medicineSchedule.filter((s) => !s.taken).length,
      },
    }));

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedule", error: error.message });
  }
};

/**
 * Download prescription as PDF
 * GET /api/prescriptions/:id/download-pdf
 */
export const downloadPrescriptionPDF = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "name studentId")
      .populate("doctorId", "name department");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Authorization check
    if (prescription.patientId._id.toString() !== req.user._id.toString() &&
        prescription.doctorId._id.toString() !== req.user._id.toString() &&
        req.user.role !== "hospital_admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // For now, return the prescription data as JSON
    // In production, you would use a PDF library like pdfkit or html2pdf
    res.json({
      message: "Prescription PDF generation",
      prescriptionData: prescription,
      format: "This would be converted to PDF in production using pdfkit or html2pdf",
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
};

/**
 * Helper function to convert timing names to actual times
 */
function convertTimingsToTimes(timings) {
  const timeMap = {
    morning: "07:00",
    noon: "13:00",
    evening: "18:00",
    night: "22:00",
  };

  return timings.map((timing) => timeMap[timing] || "");
}

/**
 * Helper function to initialize medicine schedule
 */
function initializeMedicineSchedule(timings) {
  const today = new Date();
  const schedule = [];

  // Create 30-day schedule
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    timings.forEach((timing) => {
      const timeMap = {
        morning: "07:00 AM",
        noon: "1:00 PM",
        evening: "6:00 PM",
        night: "10:00 PM",
      };

      schedule.push({
        date: date,
        time: timeMap[timing] || timing,
        taken: false,
      });
    });
  }

  return schedule;
}

/**
 * Helper function to get next due time
 */
function getNextDueTime(specificTimes) {
  if (!specificTimes || specificTimes.length === 0) return null;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const timeInMinutes = specificTimes.map((time) => {
    const [hours, mins] = time.split(":").map(Number);
    return hours * 60 + mins;
  });

  const nextTime = timeInMinutes.find((time) => time > currentTime);
  return nextTime ? specificTimes[timeInMinutes.indexOf(nextTime)] : specificTimes[0];
}

/**
 * Helper function to send prescription email
 */
async function sendPrescriptionEmail(patient, doctor, prescription, appointment) {
  try {
    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER || "iiithospital@gmail.com",
        pass: process.env.GMAIL_PASS || "oyog nlxd uguh qjyw",
      },
    });

    // Generate prescription receipt HTML
    const prescriptionHTML = generatePrescriptionReceiptEmail({
      patientName: patient.name,
      patientId: patient.studentId,
      doctorName: doctor.name,
      doctorDepartment: doctor.department,
      diagnosis: prescription.diagnosis,
      medicines: prescription.medicines,
      notes: prescription.notes,
      advice: prescription.advice,
      prescriptionDate: new Date().toLocaleDateString(),
      hospitalName: "IIIT Hospital",
      hospitalAddress: "RGUKT Campus, Telangana",
    });

    const mailOptions = {
      from: "iiithospital@gmail.com",
      to: patient.email,
      subject: `Medical Prescription from Dr. ${doctor.name} - IIIT Hospital`,
      html: prescriptionHTML,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending prescription email:", error);
    return false;
  }
}

export default {
  savePrescription,
  getPrescriptionById,
  getPatientPrescriptions,
  getMedicineTimings,
  updateMedicineCompliance,
  getMedicineSchedule,
  downloadPrescriptionPDF,
};
