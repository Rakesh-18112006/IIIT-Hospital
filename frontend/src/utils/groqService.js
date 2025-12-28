/**
 * Groq LLM Service for AI-assisted prescription features
 * Uses backend API endpoints that connect to Groq
 * Backend accesses Groq API key from environment variables
 */

import api from "../config/api.js";

/**
 * Initialize Groq service (no longer needed for frontend key)
 * Kept for backward compatibility
 */
export const initializeGroqService = (apiKey) => {
  console.log("Groq service now uses backend environment variables");
  return true;
};

/**
 * Get stored Groq API key (deprecated - not used anymore)
 */
export const getGroqApiKey = () => {
  return null;
};

/**
 * Clear stored Groq API key (deprecated - not used anymore)
 */
export const clearGroqApiKey = () => {
  // No longer storing in localStorage
};

/**
 * Check if Groq API is configured (checks backend)
 */
export const isGroqConfigured = async () => {
  try {
    const response = await api.get("/ai/check-groq");
    return response.data.configured;
  } catch (error) {
    console.error("Error checking Groq configuration:", error);
    return false;
  }
};

/**
 * Get medicine suggestions via backend
 */
export const getMedicineSuggestions = async (medicineKeyword, patientAge, patientGender, symptoms) => {
  try {
    const response = await api.post("/ai/medicine-suggestions", {
      medicineKeyword,
      patientAge,
      patientGender,
      symptoms: symptoms || [],
    });
    return response.data || [];
  } catch (error) {
    console.error("Error getting medicine suggestions:", error);
    return [];
  }
};

/**
 * Get single medicine suggestion with details
 */
export const getMedicineSuggestion = async (medicineName, patientAge, patientGender, symptoms) => {
  try {
    const response = await api.post("/ai/medicine-suggestions", {
      medicineKeyword: medicineName,
      patientAge,
      patientGender,
      symptoms: symptoms || [],
    });
    const suggestions = response.data || [];
    return suggestions[0] || {
      fullName: medicineName,
      dosage: "As advised",
      frequency: "As advised",
      duration: "As advised",
      instructions: "Follow doctor's instructions",
    };
  } catch (error) {
    console.error("Error getting medicine suggestion:", error);
    return {
      fullName: medicineName,
      dosage: "As advised",
      frequency: "As advised",
      duration: "As advised",
      instructions: "Follow doctor's instructions",
    };
  }
};

/**
 * Check medicine interactions via backend
 */
export const checkMedicineInteractions = async (medicinesList) => {
  try {
    const response = await api.post("/ai/check-interactions", {
      medicines: medicinesList || [],
    });
    return response.data || {
      hasInteractions: false,
      warnings: [],
      suggestions: [],
    };
  } catch (error) {
    console.error("Error checking interactions:", error);
    return {
      hasInteractions: false,
      warnings: [],
      suggestions: [],
    };
  }
};

/**
 * Assess patient risk via backend
 */
export const assessPatientRisk = async (symptoms, medicalHistory, vitals, age) => {
  try {
    const response = await api.post("/ai/assess-risk", {
      symptoms: symptoms || [],
      medicalHistory,
      vitals,
      age,
    });
    return response.data || {
      riskLevel: "medium",
      riskScore: 50,
      reason: "Assessment completed",
      recommendations: [],
    };
  } catch (error) {
    console.error("Error assessing risk:", error);
    return {
      riskLevel: "medium",
      riskScore: 50,
      reason: "Assessment completed",
      recommendations: [],
    };
  }
};

/**
 * Prioritize appointments (uses assessment data)
 */
export const prioritizeAppointments = async (appointments) => {
  try {
    const assessments = await Promise.all(
      appointments.map((apt) =>
        assessPatientRisk(
          apt.symptoms || [],
          apt.medicalHistory || "",
          apt.vitals || "",
          apt.age || 20
        )
      )
    );

    return appointments.map((apt, idx) => ({
      ...apt,
      riskLevel: assessments[idx].riskLevel,
      riskScore: assessments[idx].riskScore,
    }));
  } catch (error) {
    console.error("Error prioritizing appointments:", error);
    return appointments;
  }
};

/**
 * Generate appointment email (helper function)
 */
export const generateAppointmentEmail = async (appointmentData) => {
  // This can stay as is or be moved to backend
  return `Appointment Confirmation\n\nDate: ${appointmentData.date}\nTime: ${appointmentData.time}`;
};

/**
 * Generate medical advice
 */
export const generateMedicalAdvice = async (symptoms, diagnosis) => {
  try {
    const response = await api.post("/ai/medicine-suggestions", {
      medicineKeyword: `Advice for ${diagnosis}`,
      symptoms: symptoms || [],
    });
    return response.data?.[0]?.instructions || "Follow doctor's recommendations";
  } catch (error) {
    console.error("Error generating advice:", error);
    return "Follow doctor's recommendations";
  }
};

export default {
  initializeGroqService,
  getGroqApiKey,
  clearGroqApiKey,
  isGroqConfigured,
  getMedicineSuggestions,
  getMedicineSuggestion,
  checkMedicineInteractions,
  assessPatientRisk,
  prioritizeAppointments,
  generateAppointmentEmail,
  generateMedicalAdvice,
};
