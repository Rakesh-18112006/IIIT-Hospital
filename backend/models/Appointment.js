import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Appointment slot details
    slotDate: {
      type: Date,
      required: true,
    },
    slotTime: {
      type: String, // Format: "HH:MM" (e.g., "09:00", "09:15")
      required: true,
    },
    slotEndTime: {
      type: String, // Format: "HH:MM" (e.g., "09:15", "09:30")
      required: true,
    },
    // Health problem description
    healthProblem: {
      type: String,
      required: true,
    },
    symptoms: [
      {
        type: String,
      },
    ],
    // AI-determined severity and priority
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    riskScore: {
      type: Number, // 0-100, higher = more urgent
      default: 0,
    },
    aiAnalysis: {
      detectedConditions: [String],
      urgencyIndicators: [String],
      recommendedAction: String,
      confidence: Number,
    },
    // Queue position (dynamically updated)
    queuePosition: {
      type: Number,
      default: 0,
    },
    // Appointment status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
        "no-show",
      ],
      default: "pending",
    },
    // Student profile snapshot (auto-filled)
    studentDetails: {
      name: String,
      studentId: String,
      branch: String,
      year: Number,
      hostelBlock: String,
      phone: String,
      email: String,
    },
    // Doctor's notes after consultation
    doctorNotes: {
      type: String,
    },
    prescription: {
      type: String,
    },
    // Timestamps for tracking
    bookedAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    // Reason for priority change (if manually adjusted)
    priorityChangeReason: String,
    priorityChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Rescheduling tracking
    rescheduledFrom: {
      slotTime: String,
      slotEndTime: String,
      rescheduledAt: Date,
      reason: String,
    },
    // Notification for student
    notification: {
      hasNotification: {
        type: Boolean,
        default: false,
      },
      message: String,
      type: {
        type: String,
        enum: ["reschedule", "cancelled", "confirmed", "info"],
      },
      createdAt: Date,
      read: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queue queries
appointmentSchema.index({ doctor: 1, slotDate: 1, status: 1 });
appointmentSchema.index({ student: 1, status: 1 });
appointmentSchema.index({ riskScore: -1, bookedAt: 1 });

// Virtual for formatted slot time
appointmentSchema.virtual("formattedSlot").get(function () {
  return `${this.slotTime} - ${this.slotEndTime}`;
});

// Method to check if slot is in the past
appointmentSchema.methods.isPast = function () {
  const now = new Date();
  const slotDateTime = new Date(this.slotDate);
  const [hours, minutes] = this.slotTime.split(":");
  slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return slotDateTime < now;
};

// Static method to get available slots for a doctor on a date
appointmentSchema.statics.getAvailableSlots = async function (doctorId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await this.find({
    doctor: doctorId,
    slotDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ["cancelled", "no-show"] },
  }).select("slotTime");

  const bookedSlots = bookedAppointments.map((apt) => apt.slotTime);

  // Generate all 15-minute slots for working hours (9 AM - 9 PM)
  const allSlots = [];
  for (let hour = 9; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const slotTime = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      if (!bookedSlots.includes(slotTime)) {
        const endHour = minute === 45 ? hour + 1 : hour;
        const endMinute = (minute + 15) % 60;
        const slotEndTime = `${endHour.toString().padStart(2, "0")}:${endMinute
          .toString()
          .padStart(2, "0")}`;
        allSlots.push({ slotTime, slotEndTime });
      }
    }
  }

  return allSlots;
};

// Static method to get doctor's queue for today
appointmentSchema.statics.getDoctorQueue = async function (doctorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    doctor: doctorId,
    slotDate: { $gte: today, $lt: tomorrow },
    status: { $in: ["pending", "confirmed", "in-progress"] },
  })
    .populate("student", "name email studentId branch year hostelBlock phone")
    .sort({ riskScore: -1, slotTime: 1 })
    .exec();
};

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
