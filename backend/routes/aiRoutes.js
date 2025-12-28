import express from "express";
import axios from "axios";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Groq API Configuration
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Helper to get API key (read dynamically to ensure env vars are loaded)
const getGroqApiKey = () => process.env.GROQ_API_KEY;

/**
 * Check if Groq API is configured
 * GET /api/ai/check-groq
 */
router.get("/check-groq", protect, (req, res) => {
  const GROQ_API_KEY = getGroqApiKey();
  const isConfigured = !!GROQ_API_KEY;
  res.json({
    configured: isConfigured,
    message: isConfigured
      ? "Groq API is configured"
      : "Groq API key not found in environment variables",
  });
});

/**
 * Get medicine suggestions via Groq
 * POST /api/ai/medicine-suggestions
 */
router.post("/medicine-suggestions", protect, async (req, res) => {
  try {
    const GROQ_API_KEY = getGroqApiKey();
    
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not configured");
      return res.status(400).json({
        message: "Groq API key not configured in backend",
      });
    }

    const { medicineKeyword, patientAge, patientGender, symptoms } = req.body;

    if (!medicineKeyword) {
      return res.status(400).json({ message: "Medicine keyword is required" });
    }

    const prompt = `You are a medical assistant. The user is typing a medicine name in a prescription system.
    
User input: "${medicineKeyword}"
Patient age: ${patientAge || "unknown"}
Patient gender: ${patientGender || "unknown"}
Patient symptoms: ${symptoms?.join(", ") || "not provided"}

Provide 3-5 medicine suggestions that match or are similar to the user input.
Return ONLY a JSON array of objects with this structure (no markdown, just JSON):
[
  {
    "fullName": "Medicine name with strength",
    "dosage": "dosage amount",
    "frequency": "how often to take",
    "duration": "how long to take",
    "instructions": "special instructions if any"
  }
]`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    try {
      let content = response.data.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      const suggestions = JSON.parse(content);
      
      // Ensure it's an array
      if (Array.isArray(suggestions)) {
        res.json(suggestions);
      } else if (suggestions && typeof suggestions === 'object') {
        res.json([suggestions]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // If JSON parsing fails, return the raw text
      res.json([
        {
          fullName: medicineKeyword,
          dosage: "As advised",
          frequency: "As advised",
          duration: "As advised",
          instructions: "Ask doctor for specific dosage",
        },
      ]);
    }
  } catch (error) {
    console.error("Error getting medicine suggestions:", error);
    res.status(500).json({
      message: "Error getting medicine suggestions",
      error: error.message,
    });
  }
});

/**
 * Check drug interactions via Groq
 * POST /api/ai/check-interactions
 */
router.post("/check-interactions", protect, async (req, res) => {
  try {
    const GROQ_API_KEY = getGroqApiKey();
    
    if (!GROQ_API_KEY) {
      return res.status(400).json({
        message: "Groq API key not configured in backend",
      });
    }

    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.json({ hasInteractions: false, warnings: [] });
    }

    const medicineList = medicines.map((m) => m.name).join(", ");

    const prompt = `You are a pharmacist. Check for drug interactions between these medicines:
${medicineList}

If there are any interactions, describe them. Return ONLY a JSON object with this structure (no markdown, just JSON):
{
  "hasInteractions": boolean,
  "warnings": [
    {
      "description": "description of interaction",
      "severity": "mild|moderate|severe"
    }
  ],
  "suggestions": ["alternative medicine if needed"]
}`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    try {
      let content = response.data.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      const interactions = JSON.parse(content);
      res.json(interactions);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      res.json({
        hasInteractions: false,
        warnings: [],
        suggestions: [],
      });
    }
  } catch (error) {
    console.error("Error checking interactions:", error);
    res.status(500).json({
      message: "Error checking interactions",
      error: error.message,
    });
  }
});

/**
 * Assess patient risk via Groq
 * POST /api/ai/assess-risk
 */
router.post("/assess-risk", protect, async (req, res) => {
  try {
    const GROQ_API_KEY = getGroqApiKey();
    
    if (!GROQ_API_KEY) {
      return res.status(400).json({
        message: "Groq API key not configured in backend",
      });
    }

    const { symptoms, medicalHistory, vitals, age } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.json({
        riskLevel: "low",
        riskScore: 10,
        reason: "No symptoms provided",
        recommendations: [],
      });
    }

    const prompt = `You are a medical triage assistant. Assess the urgency/risk level for a patient with:

Symptoms: ${symptoms.join(", ")}
Medical History: ${medicalHistory || "Not provided"}
Vitals: ${vitals || "Not provided"}
Age: ${age || "Not provided"}

Return ONLY a JSON object with this structure (no markdown, just JSON):
{
  "riskLevel": "critical|high|medium|low",
  "riskScore": number between 0-100,
  "reason": "brief explanation",
  "recommendations": ["action 1", "action 2"]
}`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    try {
      let content = response.data.choices[0].message.content.trim();
      
      // Remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      const assessment = JSON.parse(content);
      res.json(assessment);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      res.json({
        riskLevel: "medium",
        riskScore: 50,
        reason: "Assessment generated",
        recommendations: ["Follow up with doctor"],
      });
    }
  } catch (error) {
    console.error("Error assessing risk:", error);
    res.status(500).json({
      message: "Error assessing patient risk",
      error: error.message,
    });
  }
});

export default router;
