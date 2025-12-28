import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    // Appointment reference
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

    // Patient reference
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Doctor reference
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Clinical information
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },

    symptoms: [String],

    // Medicines with detailed information including timings
    medicines: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        dosage: {
          type: String,
          required: false,
          trim: true,
        },
        frequency: {
          type: String,
          trim: true,
        },
        duration: {
          type: String,
          trim: true,
        },
        instructions: {
          type: String,
          trim: true,
        },
        // Specific timings for the medicine (array of strings)
        timings: [{
          type: String,
          enum: ["morning", "noon", "evening", "night"],
        }],
        // Actual times in 24-hour format (e.g., "07:00", "13:00")
        specificTimes: [String],
        // Track if patient is taking this medicine
        medicineSchedule: [
          {
            date: {
              type: Date,
              default: Date.now,
            },
            time: String, // e.g., "07:00 AM"
            taken: {
              type: Boolean,
              default: false,
            },
            notes: String,
          },
        ],
      },
    ],

    // Doctor's additional notes
    notes: {
      type: String,
      trim: true,
    },

    // Health advice for patient
    advice: {
      type: String,
      trim: true,
    },

    // Hospital information
    hospital: {
      name: {
        type: String,
        default: "IIIT Hospital",
      },
      address: {
        type: String,
        default: "RGUKT Campus, Telangana",
      },
      phone: String,
    },

    // Doctor information
    doctor: {
      name: {
        type: String,
        required: true,
      },
      department: String,
      specialization: String,
    },

    // Status tracking
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "revised"],
      default: "active",
    },

    // Medicine interaction warnings
    interactions: [
      {
        description: String,
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
      },
    ],

    // PDF receipt generation
    receiptGenerated: {
      type: Boolean,
      default: false,
    },

    receiptUrl: String,

    // Email notification
    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: Date,

    // Revision history
    revisions: [
      {
        revisedBy: mongoose.Schema.Types.ObjectId,
        reason: String,
        previousMedicines: mongoose.Schema.Types.Mixed,
        revisedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Compliance tracking
    compliance: {
      medicinesTaken: {
        type: Number,
        default: 0,
      },
      medicinesSkipped: {
        type: Number,
        default: 0,
      },
      lastUpdated: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ status: 1 });

// Virtual to get all medicine timings as JSON
prescriptionSchema.virtual("medicineTimingsJSON").get(function () {
  return this.medicines.map((med) => ({
    medicineName: med.name,
    dosage: med.dosage,
    timings: med.timings,
    specificTimes: med.specificTimes,
    duration: med.duration,
    instructions: med.instructions,
  }));
});

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
