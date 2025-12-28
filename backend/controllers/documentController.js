import MedicalDocument from "../models/MedicalDocument.js";
import Prescription from "../models/Prescription.js";
import PatientRecord from "../models/PatientRecord.js";
import Tesseract from "tesseract.js";
import Groq from "groq-sdk";
import path from "path";
import fs from "fs";

// Initialize Groq client (lazy initialization to handle missing API key)
let groq = null;
const getGroqClient = () => {
  if (!groq && process.env.GROQ_API_KEY) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
};

// @desc    Upload and process medical document
// @route   POST /api/documents/upload
// @access  Private (Student)
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { file } = req;

    // Create document record
    const document = await MedicalDocument.create({
      student: req.user._id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      processingStatus: "processing",
    });

    // Start OCR processing in background
    processDocument(document._id, file.path);

    res.status(201).json({
      message: "Document uploaded successfully. Processing started.",
      document: {
        _id: document._id,
        filename: document.originalName,
        status: document.processingStatus,
        uploadDate: document.uploadDate,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Error uploading document" });
  }
};

// Process document with OCR and LLM analysis
async function processDocument(documentId, filePath) {
  try {
    const document = await MedicalDocument.findById(documentId);
    if (!document) return;

    // Perform OCR
    console.log("Starting OCR for document:", documentId);
    const {
      data: { text },
    } = await Tesseract.recognize(filePath, "eng", {
      logger: (m) => console.log(m.status, m.progress),
    });

    document.extractedText = text;

    // Analyze with Groq LLM
    if (text && text.trim().length > 0) {
      console.log("Analyzing with Groq LLM...");
      const analysis = await analyzeWithGroq(text);
      document.analyzedData = analysis;
    }

    document.processingStatus = "completed";
    await document.save();
    console.log("Document processing completed:", documentId);
  } catch (error) {
    console.error("Document processing error:", error);
    await MedicalDocument.findByIdAndUpdate(documentId, {
      processingStatus: "failed",
      processingError: error.message,
    });
  }
}

// Analyze extracted text with Groq
async function analyzeWithGroq(text) {
  try {
    const client = getGroqClient();
    if (!client) {
      console.log("Groq API key not configured, skipping analysis");
      return { rawAnalysis: "Analysis skipped: GROQ_API_KEY not configured" };
    }

    const prompt = `Analyze this medical document text and extract the following information in JSON format:
{
  "bloodGroup": "blood group if found (e.g., O+, A-, B+, AB-) or null",
  "allergies": ["list of allergies mentioned"],
  "conditions": ["list of medical conditions/diagnoses"],
  "medications": ["list of medications mentioned"],
  "testResults": [{"testName": "name", "value": "value", "unit": "unit", "date": "date if found"}],
  "vaccinations": ["list of vaccinations"],
  "hospitalName": "hospital/clinic name if found or null",
  "doctorName": "doctor name if found or null",
  "documentDate": "date of document if found or null",
  "documentType": "type of document (e.g., Lab Report, Prescription, Discharge Summary, Vaccination Record, etc.)",
  "summary": "brief 2-3 sentence summary of the document"
}

Medical Document Text:
${text}

Return ONLY valid JSON, no other text.`;

    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    // Try to parse JSON from response
    let analysis = {};
    try {
      // Find JSON in response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      analysis = { rawAnalysis: responseText };
    }

    analysis.rawAnalysis = responseText;
    return analysis;
  } catch (error) {
    console.error("Groq analysis error:", error);
    return { rawAnalysis: "Analysis failed: " + error.message };
  }
}

// @desc    Get all documents for a student
// @route   GET /api/documents
// @access  Private (Student)
export const getDocuments = async (req, res) => {
  try {
    const documents = await MedicalDocument.find({ student: req.user._id })
      .select("-extractedText -filePath")
      .sort({ uploadDate: -1 });

    res.json(documents);
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ message: "Error fetching documents" });
  }
};

// @desc    Get single document details
// @route   GET /api/documents/:id
// @access  Private (Student)
export const getDocument = async (req, res) => {
  try {
    const document = await MedicalDocument.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ message: "Error fetching document" });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private (Student)
export const deleteDocument = async (req, res) => {
  try {
    const document = await MedicalDocument.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete file from storage
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await document.deleteOne();

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Error deleting document" });
  }
};

// @desc    Query medical analyzer bot
// @route   POST /api/documents/analyze
// @access  Private (Student)
export const queryMedicalBot = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const client = getGroqClient();
    if (!client) {
      return res
        .status(500)
        .json({
          message:
            "Medical analyzer is not configured. Please add GROQ_API_KEY.",
        });
    }

    const studentId = req.user._id;

    // Get all medical data sources for this student
    // 1. Medical Documents (uploaded by student)
    const documents = await MedicalDocument.find({
      student: studentId,
      processingStatus: "completed",
    }).sort({ uploadDate: -1 }); // Most recent first

    // 2. Prescriptions (from doctor-uploaded medical receipts/emails)
    const prescriptions = await Prescription.find({
      patientId: studentId,
      status: { $in: ["active", "completed"] },
    })
      .populate("doctorId", "name department")
      .populate("appointmentId")
      .sort({ createdAt: -1 }); // Most recent first

    // 3. Patient Records (from doctor consultations)
    const patientRecords = await PatientRecord.find({
      student: studentId,
      status: "completed",
    })
      .populate("assignedDoctor", "name department")
      .sort({ completedAt: -1, visitDate: -1 }); // Most recent first

    // Check if we have any medical data
    const hasData = documents.length > 0 || prescriptions.length > 0 || patientRecords.length > 0;

    if (!hasData) {
      return res.json({
        answer:
          "You don't have any medical records yet. Once your doctor adds prescriptions or medical reports, I'll be able to answer your questions about your medications and health records.",
        source: null,
      });
    }

    // Build comprehensive context from all sources
    let contextParts = [];

    // 1. Prescriptions (prioritize - most recent first)
    if (prescriptions.length > 0) {
      contextParts.push("=== PRESCRIPTIONS (Most Recent First) ===");
      prescriptions.forEach((prescription, index) => {
        const medList = prescription.medicines.map(med => {
          const timingStr = med.timings && med.timings.length > 0 
            ? ` (Take: ${med.timings.join(', ')})` 
            : '';
          return `- ${med.name}${timingStr}`;
        }).join('\n');

        contextParts.push(`
Prescription #${index + 1} (Date: ${new Date(prescription.createdAt).toLocaleDateString()})
Doctor: Dr. ${prescription.doctor?.name || prescription.doctorId?.name || "Unknown"}
Diagnosis: ${prescription.diagnosis || "N/A"}
Medications:
${medList || "None"}
Advice: ${prescription.advice || "None"}
Notes: ${prescription.notes || "None"}
---`);
      });
    }

    // 2. Patient Records (recent consultations)
    if (patientRecords.length > 0) {
      contextParts.push("\n=== MEDICAL CONSULTATIONS (Most Recent First) ===");
      patientRecords.slice(0, 10).forEach((record, index) => {
        contextParts.push(`
Consultation #${index + 1} (Date: ${new Date(record.completedAt || record.visitDate).toLocaleDateString()})
Doctor: ${record.assignedDoctor?.name || "Unknown"}
Symptoms: ${record.symptoms?.join(", ") || "N/A"}
Description: ${record.symptomDescription || "N/A"}
Prescription: ${record.prescription || "None"}
Advice: ${record.advice || "None"}
Doctor Notes: ${record.doctorNotes || "None"}
Severity: ${record.severity || "N/A"}
---`);
      });
    }

    // 3. Medical Documents (uploaded documents)
    if (documents.length > 0) {
      contextParts.push("\n=== UPLOADED MEDICAL DOCUMENTS ===");
      documents.forEach((doc, index) => {
        contextParts.push(`
Document ${index + 1}: ${doc.originalName || "Medical Document"} (Uploaded: ${new Date(
          doc.uploadDate
        ).toLocaleDateString()})
Type: ${doc.analyzedData?.documentType || "Unknown"}
Blood Group: ${doc.analyzedData?.bloodGroup || "Not found"}
Conditions: ${doc.analyzedData?.conditions?.join(", ") || "None"}
Medications: ${doc.analyzedData?.medications?.join(", ") || "None"}
Allergies: ${doc.analyzedData?.allergies?.join(", ") || "None"}
Test Results: ${
          doc.analyzedData?.testResults
            ?.map((t) => `${t.testName}: ${t.value} ${t.unit || ""}`)
            .join(", ") || "None"
        }
Summary: ${doc.analyzedData?.summary || "No summary"}
---`);
      });
    }

    const fullContext = contextParts.join("\n");

    // Enhanced prompt with medication-specific instructions
    const prompt = `You are a helpful medical records assistant. Answer the user's question based on their complete medical history including prescriptions, consultations, and uploaded documents.

PATIENT'S COMPLETE MEDICAL RECORDS:
${fullContext}

USER'S QUESTION: ${question}

IMPORTANT INSTRUCTIONS:
1. PRIORITIZE RECENT INFORMATION: When answering about medications, always mention the most recent prescription first
2. For "latest medication" or "current medication" questions, list medications from the most recent prescription (Prescription #1)
3. Include timing information (morning, evening, night) when available
4. If multiple prescriptions exist, mention which is the most recent
5. For medication questions, format as: Medicine Name (Timing: morning/evening/night)
6. Always mention the source (Prescription date, Consultation date, or Document name)
7. If information is not found, say "This information was not found in your medical records"
8. Be concise but comprehensive
9. For medication-related questions, prioritize prescription data over uploaded documents

RESPONSE FORMAT:
Answer: [your detailed answer]
Source: [Prescription date, Consultation date, or Document name]`;

    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 800, // Increased for more detailed responses
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Parse answer and source from response
    let answer = responseText;
    let source = null;

    const answerMatch = responseText.match(/Answer:\s*(.+?)(?=Source:|$)/s);
    const sourceMatch = responseText.match(/Source:\s*(.+?)$/s);

    if (answerMatch) {
      answer = answerMatch[1].trim();
    } else {
      // If no format match, use the whole response as answer
      answer = responseText.trim();
    }
    
    if (sourceMatch) {
      source = sourceMatch[1].trim();
    } else {
      // Try to infer source from answer
      if (prescriptions.length > 0 && (answer.toLowerCase().includes("prescription") || answer.toLowerCase().includes("medication"))) {
        source = `Prescription from ${new Date(prescriptions[0].createdAt).toLocaleDateString()}`;
      } else if (patientRecords.length > 0) {
        source = `Consultation from ${new Date(patientRecords[0].completedAt || patientRecords[0].visitDate).toLocaleDateString()}`;
      } else if (documents.length > 0) {
        source = documents[0].originalName || "Medical Document";
      }
    }

    res.json({ answer, source });
  } catch (error) {
    console.error("Medical bot query error:", error);
    res.status(500).json({ message: "Error processing your question", error: error.message });
  }
};

// @desc    Get medical summary for student
// @route   GET /api/documents/summary
// @access  Private (Student)
export const getMedicalSummary = async (req, res) => {
  try {
    const documents = await MedicalDocument.find({
      student: req.user._id,
      processingStatus: "completed",
    });

    // Aggregate medical info from all documents
    const summary = {
      totalDocuments: documents.length,
      bloodGroup: null,
      allergies: new Set(),
      conditions: new Set(),
      medications: new Set(),
      vaccinations: new Set(),
      recentTests: [],
    };

    for (const doc of documents) {
      if (doc.analyzedData) {
        if (doc.analyzedData.bloodGroup && !summary.bloodGroup) {
          summary.bloodGroup = doc.analyzedData.bloodGroup;
        }
        doc.analyzedData.allergies?.forEach((a) => summary.allergies.add(a));
        doc.analyzedData.conditions?.forEach((c) => summary.conditions.add(c));
        doc.analyzedData.medications?.forEach((m) =>
          summary.medications.add(m)
        );
        doc.analyzedData.vaccinations?.forEach((v) =>
          summary.vaccinations.add(v)
        );
        if (doc.analyzedData.testResults) {
          summary.recentTests.push(
            ...doc.analyzedData.testResults.map((t) => ({
              ...t,
              documentName: doc.originalName,
            }))
          );
        }
      }
    }

    // Convert Sets to arrays
    summary.allergies = Array.from(summary.allergies);
    summary.conditions = Array.from(summary.conditions);
    summary.medications = Array.from(summary.medications);
    summary.vaccinations = Array.from(summary.vaccinations);
    summary.recentTests = summary.recentTests.slice(0, 10); // Last 10 tests

    res.json(summary);
  } catch (error) {
    console.error("Get summary error:", error);
    res.status(500).json({ message: "Error fetching medical summary" });
  }
};
