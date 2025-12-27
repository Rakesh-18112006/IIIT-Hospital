import mongoose from "mongoose";

const medicalDocumentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filename: {
      type: String,
      required: false,
    },
    originalName: {
      type: String,
      required: false,
    },
    mimeType: {
      type: String,
      required: false,
    },
    fileSize: {
      type: Number,
      required: false,
    },
    filePath: {
      type: String,
      required: false,
    },
    extractedText: {
      type: String,
      default: "",
    },
    analyzedData: {
      bloodGroup: String,
      allergies: [String],
      conditions: [String],
      medications: [String],
      testResults: [
        {
          testName: String,
          value: String,
          unit: String,
          date: String,
        },
      ],
      vaccinations: [String],
      hospitalName: String,
      doctorName: String,
      documentDate: String,
      documentType: String,
      summary: String,
      rawAnalysis: String,
    },
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    processingError: String,
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
medicalDocumentSchema.index({ student: 1, uploadDate: -1 });
medicalDocumentSchema.index({ "analyzedData.bloodGroup": 1 });

const MedicalDocument = mongoose.model(
  "MedicalDocument",
  medicalDocumentSchema
);

export default MedicalDocument;
