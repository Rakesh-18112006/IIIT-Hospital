import mongoose from "mongoose";

const doctorQueueSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // Current status of the doctor
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    // Working hours configuration
    workingHours: {
      start: {
        type: String,
        default: "09:00",
      },
      end: {
        type: String,
        default: "21:00",
      },
    },
    // Slot duration in minutes
    slotDuration: {
      type: Number,
      default: 15,
    },
    // Break times
    breaks: [
      {
        start: String,
        end: String,
        reason: String,
      },
    ],
    // Queue statistics for the day
    stats: {
      totalAppointments: {
        type: Number,
        default: 0,
      },
      completedAppointments: {
        type: Number,
        default: 0,
      },
      cancelledAppointments: {
        type: Number,
        default: 0,
      },
      averageWaitTime: {
        type: Number, // in minutes
        default: 0,
      },
      criticalCases: {
        type: Number,
        default: 0,
      },
      highPriorityCases: {
        type: Number,
        default: 0,
      },
      mediumPriorityCases: {
        type: Number,
        default: 0,
      },
      lowPriorityCases: {
        type: Number,
        default: 0,
      },
    },
    // AI prioritization tracking
    prioritizationLog: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        action: {
          type: String,
          enum: ["reorder", "escalate", "downgrade"],
        },
        appointmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
        previousPosition: Number,
        newPosition: Number,
        reason: String,
      },
    ],
    // Last updated timestamp for real-time sync
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique doctor-date combination
doctorQueueSchema.index({ doctor: 1, date: 1 }, { unique: true });

// Static method to get or create queue for a doctor on a specific date
doctorQueueSchema.statics.getOrCreateQueue = async function (doctorId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  let queue = await this.findOne({
    doctor: doctorId,
    date: startOfDay,
  }).populate("doctor", "name email department");

  if (!queue) {
    queue = await this.create({
      doctor: doctorId,
      date: startOfDay,
    });
    queue = await this.findById(queue._id).populate(
      "doctor",
      "name email department"
    );
  }

  return queue;
};

// Method to update queue statistics
doctorQueueSchema.methods.updateStats = async function (Appointment) {
  const startOfDay = new Date(this.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const appointments = await Appointment.find({
    doctor: this.doctor,
    slotDate: { $gte: startOfDay, $lt: endOfDay },
  });

  this.stats = {
    totalAppointments: appointments.length,
    completedAppointments: appointments.filter((a) => a.status === "completed")
      .length,
    cancelledAppointments: appointments.filter((a) => a.status === "cancelled")
      .length,
    criticalCases: appointments.filter((a) => a.severity === "critical").length,
    highPriorityCases: appointments.filter((a) => a.severity === "high").length,
    mediumPriorityCases: appointments.filter((a) => a.severity === "medium")
      .length,
    lowPriorityCases: appointments.filter((a) => a.severity === "low").length,
    averageWaitTime: this.stats.averageWaitTime, // Keep existing or calculate
  };

  this.lastUpdated = new Date();
  await this.save();
};

// Method to log prioritization changes
doctorQueueSchema.methods.logPrioritizationChange = async function (
  appointmentId,
  action,
  previousPosition,
  newPosition,
  reason
) {
  this.prioritizationLog.push({
    timestamp: new Date(),
    action,
    appointmentId,
    previousPosition,
    newPosition,
    reason,
  });
  this.lastUpdated = new Date();
  await this.save();
};

const DoctorQueue = mongoose.model("DoctorQueue", doctorQueueSchema);

export default DoctorQueue;
