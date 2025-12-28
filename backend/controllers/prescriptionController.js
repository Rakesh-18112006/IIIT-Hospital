import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import PatientRecord from "../models/PatientRecord.js";
import MedicalDocument from "../models/MedicalDocument.js";
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

    // Get appointment to find patient - Note: Appointment uses 'student' not 'patientId'
    const appointment = await Appointment.findById(appointmentId).populate("student");
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!appointment.student) {
      return res.status(404).json({ message: "Student not found in appointment" });
    }

    const patientId = appointment.student._id || appointment.student;
    const patient = appointment.student;

    // Get doctor info
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Format prescription text for medical records
    const prescriptionText = medicines.map(med => {
      const timingStr = med.timings && med.timings.length > 0 
        ? ` (${med.timings.join(', ')})` 
        : '';
      return `${med.name}${timingStr}`;
    }).join('\n');

    // Create prescription with medicine timings
    const prescription = new Prescription({
      appointmentId,
      patientId,
      doctorId,
      diagnosis,
      symptoms: symptoms || [],
      medicines: medicines.map((med) => {
        // Ensure timings is an array of valid strings
        const timingsArray = Array.isArray(med.timings) 
          ? med.timings.filter(t => t && typeof t === 'string' && ['morning', 'noon', 'evening', 'night'].includes(t))
          : [];
        
        return {
          name: med.name,
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          duration: med.duration || '',
          instructions: med.instructions || '',
          timings: timingsArray, // e.g., ["morning", "evening", "night"] - will be stored as array of strings
          specificTimes: convertTimingsToTimes(timingsArray),
          medicineSchedule: initializeMedicineSchedule(timingsArray),
        };
      }),
      notes: notes || '',
      advice: advice || '',
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
    appointment.prescription = prescriptionText; // Store prescription text
    appointment.doctorNotes = notes || '';
    appointment.completedAt = new Date();
    await appointment.save();

    // Create PatientRecord entry
    try {
      const patientRecord = new PatientRecord({
        student: patientId,
        symptoms: symptoms || [],
        symptomDescription: diagnosis,
        severity: appointment.severity || 'green',
        status: 'completed',
        assignedDoctor: doctorId,
        doctorNotes: notes || '',
        prescription: prescriptionText,
        advice: advice || '',
        visitDate: new Date(),
        completedAt: new Date(),
      });
      await patientRecord.save();
    } catch (recordError) {
      console.error("Error creating patient record:", recordError);
      // Don't fail the whole operation if record creation fails
    }

    // Create MedicalDocument entry
    try {
      const medicalDocument = new MedicalDocument({
        student: patientId,
        documentType: "prescription",
        extractedText: prescriptionText,
        analyzedData: {
          doctorName: doctor.name,
          diagnosis: diagnosis,
          summary: advice || "No additional advice provided",
          documentType: "prescription",
          medicines: medicines.map(med => ({
            name: med.name,
            timings: med.timings || []
          })),
        },
        processingStatus: "completed",
        uploadDate: new Date(),
      });
      await medicalDocument.save();
    } catch (docError) {
      console.error("Error creating medical document:", docError);
      // Don't fail the whole operation if document creation fails
    }

    // Send email notification with prescription details
    let emailSent = false;
    try {
      emailSent = await sendPrescriptionEmail(patient, doctor, prescription, appointment);
    } catch (emailError) {
      console.error("Error sending prescription email:", emailError);
      // Don't fail the whole operation if email fails
    }

    // Mark as emailed
    prescription.emailSent = emailSent;
    prescription.emailSentAt = new Date();
    await prescription.save();

    // Add notification to patient
    try {
      const notificationDate = new Date();
      if (!patient.notifications) {
        patient.notifications = [];
      }
      patient.notifications.push({
        type: "prescription",
        title: "Appointment Success",
        message: "Your appointment success",
        data: {
          prescriptionId: prescription._id,
          doctorName: doctor.name,
          diagnosis: diagnosis,
        },
        read: false,
        createdAt: notificationDate,
      });
      await patient.save();
    } catch (notifError) {
      console.error("Error adding notification:", notifError);
      // Don't fail the whole operation if notification fails
    }

    res.status(201).json({
      message: "Prescription saved successfully and email sent to patient",
      prescription,
      emailSent,
    });
  } catch (error) {
    console.error("Error saving prescription:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error saving prescription",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
      patientName: patient.name || "Patient",
      patientId: patient.studentId || patient._id?.toString() || "N/A",
      doctorName: doctor.name || "Doctor",
      doctorDepartment: doctor.department || "General",
      diagnosis: prescription.diagnosis || "N/A",
      medicines: prescription.medicines.map(med => ({
        name: med.name,
        dosage: med.dosage || "As directed",
        frequency: med.frequency || "As directed",
        duration: med.duration || "As directed",
        instructions: med.instructions || "As directed",
        timings: Array.isArray(med.timings) ? med.timings : [],
      })),
      notes: prescription.notes || "",
      advice: prescription.advice || "Follow doctor's instructions",
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
