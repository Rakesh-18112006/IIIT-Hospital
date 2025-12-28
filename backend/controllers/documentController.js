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

    // Build comprehensive context from all sources with source tracking
    let contextParts = [];
    const sourceMap = new Map(); // Track sources for proper referencing

    // 1. Prescriptions (prioritize - most recent first)
    if (prescriptions.length > 0) {
      contextParts.push("=== PRESCRIPTIONS (Most Recent First) ===");
      prescriptions.forEach((prescription, index) => {
        const medList = prescription.medicines.map(med => {
          const timingStr = med.timings && med.timings.length > 0 
            ? ` (Take: ${med.timings.join(', ')})` 
            : '';
          const dosageStr = med.dosage ? ` - Dosage: ${med.dosage}` : '';
          const frequencyStr = med.frequency ? ` - Frequency: ${med.frequency}` : '';
          const durationStr = med.duration ? ` - Duration: ${med.duration}` : '';
          return `- ${med.name}${timingStr}${dosageStr}${frequencyStr}${durationStr}`;
        }).join('\n');

        const prescriptionDate = new Date(prescription.createdAt).toLocaleDateString();
        const sourceLabel = `Prescription #${index + 1} (Date: ${prescriptionDate})`;
        
        contextParts.push(`
${sourceLabel}
Doctor: Dr. ${prescription.doctor?.name || prescription.doctorId?.name || "Unknown"}
Diagnosis: ${prescription.diagnosis || "N/A"}
Symptoms: ${prescription.symptoms?.join(", ") || "N/A"}
Medications:
${medList || "None"}
Advice: ${prescription.advice || "None"}
Notes: ${prescription.notes || "None"}
---`);
        
        // Store source mapping
        sourceMap.set(sourceLabel.toLowerCase(), {
          type: 'prescription',
          id: prescription._id.toString(),
          name: `Prescription from ${prescriptionDate}`,
          date: prescriptionDate
        });
      });
    }

    // 2. Patient Records (recent consultations/medical reports)
    if (patientRecords.length > 0) {
      contextParts.push("\n=== MEDICAL CONSULTATIONS & REPORTS (Most Recent First) ===");
      patientRecords.slice(0, 10).forEach((record, index) => {
        const recordDate = new Date(record.completedAt || record.visitDate).toLocaleDateString();
        const sourceLabel = `Consultation #${index + 1} (Date: ${recordDate})`;
        
        contextParts.push(`
${sourceLabel}
Doctor: ${record.assignedDoctor?.name || "Unknown"}
Department: ${record.assignedDoctor?.department || "N/A"}
Symptoms: ${record.symptoms?.join(", ") || "N/A"}
Description: ${record.symptomDescription || "N/A"}
Prescription: ${record.prescription || "None"}
Advice: ${record.advice || "None"}
Doctor Notes: ${record.doctorNotes || "None"}
Suggested Tests: ${record.suggestedTests?.join(", ") || "None"}
Vitals: ${record.vitals ? `Temp: ${record.vitals.temperature || 'N/A'}°C, BP: ${record.vitals.bloodPressure || 'N/A'}, HR: ${record.vitals.heartRate || 'N/A'}, SpO2: ${record.vitals.oxygenLevel || 'N/A'}%` : "Not recorded"}
Severity: ${record.severity || "N/A"}
Referral: ${record.referral ? `${record.referral.hospital} - ${record.referral.reason}` : "None"}
---`);
        
        // Store source mapping
        sourceMap.set(sourceLabel.toLowerCase(), {
          type: 'patient_record',
          id: record._id.toString(),
          name: `Consultation from ${recordDate}`,
          date: recordDate
        });
      });
    }

    // 3. Medical Documents (uploaded documents - include full extracted text)
    if (documents.length > 0) {
      contextParts.push("\n=== UPLOADED MEDICAL DOCUMENTS ===");
      documents.forEach((doc, index) => {
        const docName = doc.originalName || "Medical Document";
        const uploadDate = new Date(doc.uploadDate).toLocaleDateString();
        const sourceLabel = `Document ${index + 1}: ${docName}`;
        
        // Build document context - include both analyzed data and extracted text
        let docContext = `
${sourceLabel} (Uploaded: ${uploadDate})
Document Type: ${doc.analyzedData?.documentType || "Unknown"}
`;
        
        // Include structured analyzed data
        if (doc.analyzedData) {
          if (doc.analyzedData.bloodGroup) docContext += `Blood Group: ${doc.analyzedData.bloodGroup}\n`;
          if (doc.analyzedData.conditions?.length > 0) docContext += `Medical Conditions: ${doc.analyzedData.conditions.join(", ")}\n`;
          if (doc.analyzedData.medications?.length > 0) docContext += `Medications: ${doc.analyzedData.medications.join(", ")}\n`;
          if (doc.analyzedData.allergies?.length > 0) docContext += `Allergies: ${doc.analyzedData.allergies.join(", ")}\n`;
          if (doc.analyzedData.vaccinations?.length > 0) docContext += `Vaccinations: ${doc.analyzedData.vaccinations.join(", ")}\n`;
          if (doc.analyzedData.testResults?.length > 0) {
            docContext += `Test Results:\n${doc.analyzedData.testResults.map(t => `  - ${t.testName}: ${t.value} ${t.unit || ""}${t.date ? ` (Date: ${t.date})` : ""}`).join('\n')}\n`;
          }
          if (doc.analyzedData.doctorName) docContext += `Doctor: ${doc.analyzedData.doctorName}\n`;
          if (doc.analyzedData.hospitalName) docContext += `Hospital: ${doc.analyzedData.hospitalName}\n`;
          if (doc.analyzedData.documentDate) docContext += `Document Date: ${doc.analyzedData.documentDate}\n`;
          if (doc.analyzedData.summary) docContext += `Summary: ${doc.analyzedData.summary}\n`;
        }
        
        // Include full extracted text for comprehensive querying (limit to 2000 chars to avoid token limits)
        if (doc.extractedText && doc.extractedText.trim().length > 0) {
          const extractedText = doc.extractedText.trim();
          const truncatedText = extractedText.length > 2000 
            ? extractedText.substring(0, 2000) + "... (truncated)"
            : extractedText;
          docContext += `\nFull Document Content:\n${truncatedText}\n`;
        }
        
        docContext += '---';
        contextParts.push(docContext);
        
        // Store source mapping
        sourceMap.set(docName.toLowerCase(), {
          type: 'document',
          id: doc._id.toString(),
          name: docName,
          date: uploadDate
        });
      });
    }

    const fullContext = contextParts.join("\n");

    // Enhanced, comprehensive prompt with better instructions
    const prompt = `You are an expert medical records assistant AI. Your role is to help users understand their medical history by answering questions based on their complete medical records including prescriptions from doctors, medical consultations/reports, and uploaded medical documents.

PATIENT'S COMPLETE MEDICAL RECORDS:
${fullContext}

USER'S QUESTION: ${question}

CRITICAL INSTRUCTIONS FOR ANSWERING:

1. COMPREHENSIVE SEARCH: Search through ALL available sources (prescriptions, consultations, uploaded documents) to find the answer. Do not limit yourself to just one section.

2. PRIORITIZE RECENCY: When multiple sources contain similar information, prioritize the most recent data:
   - For medications: Use the most recent prescription first
   - For test results: Mention the most recent test values
   - For conditions: Consider the latest diagnosis/consultation

3. MEDICATION INFORMATION: 
   - Always include timing information (morning, noon, evening, night) when available
   - Include dosage, frequency, and duration if present
   - Format medications clearly: "Medicine Name (Take: morning, evening) - Dosage: X - Frequency: Y"
   - When asked about "current" or "latest" medications, refer to Prescription #1 (most recent)

4. TEST RESULTS & VITALS:
   - Provide specific values with units when available
   - Include dates for test results if mentioned
   - Compare results across different dates when relevant

5. COMPREHENSIVE ANSWERS:
   - Answer questions about blood group, allergies, conditions, medications, test results, vaccinations
   - Pull information from document content (extracted text) when structured data is incomplete
   - Combine information from multiple sources when needed (e.g., allergies from document + recent prescription notes)

6. SOURCE ATTRIBUTION:
   - Always identify which source(s) your answer comes from
   - Use the exact source label format (e.g., "Prescription #1", "Consultation #2", "Document 1: filename")
   - If information comes from multiple sources, mention all relevant ones

7. ACCURACY & CLARITY:
   - Be specific and precise with medical information
   - If information is not found, clearly state "This information was not found in your medical records"
   - Do not make assumptions beyond what is in the records
   - Use medical terminology appropriately but explain when needed

8. DOCUMENT CONTENT UTILIZATION:
   - When structured data (analyzedData) is incomplete, use the full extracted text from documents
   - Look for information in the "Full Document Content" section
   - Extract relevant details that may not be in the structured fields

9. FORMATTING:
   - Use clear, organized responses
   - Use bullet points for lists (medications, symptoms, test results)
   - Include dates when relevant
   - Be concise but thorough

10. RESPONSE STRUCTURE:
    - Start with a direct answer to the question
    - Provide relevant details and context
    - Always end with source attribution

RESPONSE FORMAT (strictly follow this format):
Answer: [your comprehensive and detailed answer based on all available medical records]

Source: [Exact source label from the records above, e.g., "Prescription #1 (Date: MM/DD/YYYY)" or "Document 1: filename" or "Consultation #2 (Date: MM/DD/YYYY)"]`;

    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1500, // Increased for more detailed responses
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Parse answer and source from response
    let answer = responseText;
    let source = null;
    let sourceType = null;
    let sourceId = null;

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
      
      // Try to find the source in our map
      const sourceKey = source.toLowerCase();
      for (const [key, value] of sourceMap.entries()) {
        if (sourceKey.includes(key) || key.includes(sourceKey.split('(')[0].trim())) {
          sourceType = value.type;
          sourceId = value.id;
          source = value.name; // Use standardized source name
          break;
        }
      }
      
      // If not found in map, try to infer from source text
      if (!sourceType) {
        const sourceLower = source.toLowerCase();
        if (sourceLower.includes('prescription')) {
          if (prescriptions.length > 0) {
            sourceType = 'prescription';
            sourceId = prescriptions[0]._id.toString();
            source = `Prescription from ${new Date(prescriptions[0].createdAt).toLocaleDateString()}`;
          }
        } else if (sourceLower.includes('consultation')) {
          if (patientRecords.length > 0) {
            sourceType = 'patient_record';
            sourceId = patientRecords[0]._id.toString();
            source = `Consultation from ${new Date(patientRecords[0].completedAt || patientRecords[0].visitDate).toLocaleDateString()}`;
          }
        } else {
          // Try to match document name
          const matchedDoc = documents.find(doc => 
            sourceLower.includes(doc.originalName?.toLowerCase() || '') ||
            (doc.originalName?.toLowerCase() || '').includes(sourceLower.split(':')[0].trim())
          );
          if (matchedDoc) {
            sourceType = 'document';
            sourceId = matchedDoc._id.toString();
            source = matchedDoc.originalName || "Medical Document";
          } else if (documents.length > 0) {
            sourceType = 'document';
            sourceId = documents[0]._id.toString();
            source = documents[0].originalName || "Medical Document";
          }
        }
      }
    } else {
      // Try to infer source from answer content if no explicit source
      const answerLower = answer.toLowerCase();
      if (prescriptions.length > 0 && (answerLower.includes("prescription") || answerLower.includes("medication") || answerLower.includes("medicine"))) {
        sourceType = 'prescription';
        sourceId = prescriptions[0]._id.toString();
        source = `Prescription from ${new Date(prescriptions[0].createdAt).toLocaleDateString()}`;
      } else if (patientRecords.length > 0 && (answerLower.includes("consultation") || answerLower.includes("doctor") || answerLower.includes("visit"))) {
        sourceType = 'patient_record';
        sourceId = patientRecords[0]._id.toString();
        source = `Consultation from ${new Date(patientRecords[0].completedAt || patientRecords[0].visitDate).toLocaleDateString()}`;
      } else if (documents.length > 0) {
        sourceType = 'document';
        sourceId = documents[0]._id.toString();
        source = documents[0].originalName || "Medical Document";
      }
    }

    res.json({ 
      answer, 
      source,
      sourceType, // 'document', 'prescription', or 'patient_record'
      sourceId    // ID for viewing the source
    });
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
