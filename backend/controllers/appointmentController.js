import Appointment from "../models/Appointment.js";
import DoctorQueue from "../models/DoctorQueue.js";
import User from "../models/User.js";
import {
  analyzeHealthProblem,
  reorderQueueByPriority,
  assignOptimalSlot,
} from "../utils/appointmentPriority.js";

/**
 * Get all doctors
 * @route GET /api/appointments/doctors
 * @access Private (Student)
 */
export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor", isActive: true })
      .select("name email department phone")
      .lean();

    // Get today's queue info for each doctor
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doctorsWithQueue = await Promise.all(
      doctors.map(async (doctor) => {
        const queue = await DoctorQueue.findOne({
          doctor: doctor._id,
          date: today,
        });

        const todayAppointments = await Appointment.countDocuments({
          doctor: doctor._id,
          slotDate: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
          status: { $nin: ["cancelled", "completed"] },
        });

        return {
          ...doctor,
          hasQueue: todayAppointments > 0,
          queueLength: todayAppointments,
          isAvailable: queue?.isAvailable ?? true,
        };
      })
    );

    res.json(doctorsWithQueue);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Error fetching doctors" });
  }
};

/**
 * Get available slots for a doctor on a specific date
 * @route GET /api/appointments/slots/:doctorId
 * @access Private (Student)
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get or create queue for the day
    const queue = await DoctorQueue.getOrCreateQueue(doctorId, targetDate);

    // Get available slots
    const availableSlots = await Appointment.getAvailableSlots(
      doctorId,
      targetDate
    );

    // Filter out past slots if date is today
    const now = new Date();
    const isToday = targetDate.toDateString() === now.toDateString();

    const filteredSlots = isToday
      ? availableSlots.filter((slot) => {
          const [hours, minutes] = slot.slotTime.split(":");
          const slotDateTime = new Date(targetDate);
          slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return slotDateTime > now;
        })
      : availableSlots;

    res.json({
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        department: doctor.department,
      },
      date: targetDate.toISOString().split("T")[0],
      isAvailable: queue.isAvailable,
      workingHours: queue.workingHours,
      slots: filteredSlots,
      totalSlots: filteredSlots.length,
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ message: "Error fetching available slots" });
  }
};

/**
 * Book an appointment
 * @route POST /api/appointments/book
 * @access Private (Student)
 */
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, slotDate, slotTime, healthProblem, symptoms } = req.body;
    const studentId = req.user._id;

    // Validate required fields
    if (!doctorId || !slotDate || !slotTime || !healthProblem) {
      return res.status(400).json({
        message:
          "Doctor, date, time, and health problem description are required",
      });
    }

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get student details
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Parse slot date
    const appointmentDate = new Date(slotDate);
    appointmentDate.setHours(0, 0, 0, 0);

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      slotDate: appointmentDate,
      slotTime,
      status: { $nin: ["cancelled", "no-show"] },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "This slot is already booked" });
    }

    // Check if student already has an appointment with this doctor today
    const studentExistingAppointment = await Appointment.findOne({
      student: studentId,
      doctor: doctorId,
      slotDate: appointmentDate,
      status: { $nin: ["cancelled", "completed", "no-show"] },
    });

    if (studentExistingAppointment) {
      return res.status(400).json({
        message: "You already have an appointment with this doctor today",
      });
    }

    // Analyze health problem using AI
    const analysis = analyzeHealthProblem(healthProblem, symptoms || []);

    // Calculate end time (15 minutes after start)
    const [hours, minutes] = slotTime.split(":").map(Number);
    const endHour = minutes === 45 ? hours + 1 : hours;
    const endMinute = (minutes + 15) % 60;
    const slotEndTime = `${endHour.toString().padStart(2, "0")}:${endMinute
      .toString()
      .padStart(2, "0")}`;

    // Create appointment
    const appointment = new Appointment({
      student: studentId,
      doctor: doctorId,
      slotDate: appointmentDate,
      slotTime,
      slotEndTime,
      healthProblem,
      symptoms: symptoms || [],
      severity: analysis.severity,
      riskScore: analysis.riskScore,
      aiAnalysis: analysis.aiAnalysis,
      status: "pending",
      studentDetails: {
        name: student.name,
        studentId: student.studentId,
        branch: student.branch,
        year: student.year,
        hostelBlock: student.hostelBlock,
        phone: student.phone,
        email: student.email,
      },
    });

    await appointment.save();

    // Update queue statistics
    const queue = await DoctorQueue.getOrCreateQueue(doctorId, appointmentDate);
    await queue.updateStats(Appointment);

    // Reorder queue based on priority
    await reorderDoctorQueue(doctorId, appointmentDate);

    // Return the created appointment with populated fields
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("doctor", "name department")
      .populate("student", "name email studentId");

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: populatedAppointment,
      priorityInfo: {
        severity: analysis.severity,
        riskScore: analysis.riskScore,
        analysis: analysis.aiAnalysis,
      },
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Error booking appointment" });
  }
};

/**
 * Get student's appointments
 * @route GET /api/appointments/my-appointments
 * @access Private (Student)
 */
export const getMyAppointments = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { status, date } = req.query;

    const query = { student: studentId };

    if (status) {
      query.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.slotDate = { $gte: targetDate, $lt: nextDay };
    }

    const appointments = await Appointment.find(query)
      .populate("doctor", "name department email")
      .sort({ slotDate: -1, slotTime: -1 })
      .lean();

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

/**
 * Cancel an appointment
 * @route PUT /api/appointments/:id/cancel
 * @access Private (Student)
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const appointment = await Appointment.findOne({
      _id: id,
      student: studentId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        message: "Cannot cancel a completed appointment",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        message: "Appointment is already cancelled",
      });
    }

    appointment.status = "cancelled";
    appointment.cancelledAt = new Date();
    await appointment.save();

    // Update queue
    const queue = await DoctorQueue.getOrCreateQueue(
      appointment.doctor,
      appointment.slotDate
    );
    await queue.updateStats(Appointment);
    await reorderDoctorQueue(appointment.doctor, appointment.slotDate);

    res.json({ message: "Appointment cancelled successfully", appointment });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Error cancelling appointment" });
  }
};

/**
 * Get doctor's queue for today
 * @route GET /api/appointments/doctor/queue
 * @access Private (Doctor)
 */
export const getDoctorQueue = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: doctorId,
      slotDate: { $gte: targetDate, $lt: nextDay },
      status: { $in: ["pending", "confirmed", "in-progress"] },
    })
      .populate("student", "name email studentId branch year hostelBlock phone")
      .sort({ riskScore: -1, slotTime: 1 })
      .lean();

    // Get queue metadata
    const queue = await DoctorQueue.getOrCreateQueue(doctorId, targetDate);

    res.json({
      queue: appointments,
      metadata: {
        date: targetDate.toISOString().split("T")[0],
        totalPatients: appointments.length,
        isAvailable: queue.isAvailable,
        stats: queue.stats,
        lastUpdated: queue.lastUpdated,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor queue:", error);
    res.status(500).json({ message: "Error fetching queue" });
  }
};

/**
 * Update appointment status (Doctor)
 * @route PUT /api/appointments/doctor/:id/status
 * @access Private (Doctor)
 */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctorNotes, prescription } = req.body;
    const doctorId = req.user._id;

    const appointment = await Appointment.findOne({
      _id: id,
      doctor: doctorId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const validStatuses = ["confirmed", "in-progress", "completed", "no-show"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    appointment.status = status;

    if (status === "confirmed") {
      appointment.confirmedAt = new Date();
    } else if (status === "in-progress") {
      appointment.startedAt = new Date();
      // Update queue to show current patient
      const queue = await DoctorQueue.getOrCreateQueue(
        doctorId,
        appointment.slotDate
      );
      queue.currentPatient = appointment._id;
      await queue.save();
    } else if (status === "completed") {
      appointment.completedAt = new Date();
      appointment.doctorNotes = doctorNotes || appointment.doctorNotes;
      appointment.prescription = prescription || appointment.prescription;
      // Clear current patient
      const queue = await DoctorQueue.getOrCreateQueue(
        doctorId,
        appointment.slotDate
      );
      queue.currentPatient = null;
      await queue.updateStats(Appointment);
    }

    await appointment.save();

    const populatedAppointment = await Appointment.findById(id)
      .populate("student", "name email studentId branch year")
      .lean();

    res.json({
      message: "Appointment status updated",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ message: "Error updating appointment" });
  }
};

/**
 * Reschedule appointment to a specific time slot (Doctor)
 * All subsequent appointments from current time shift forward by 15 min
 * @route PUT /api/appointments/doctor/:id/reschedule
 * @access Private (Doctor)
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, newSlotTime } = req.body;
    const doctorId = req.user._id;

    if (!newSlotTime) {
      return res.status(400).json({ message: "New slot time is required" });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(newSlotTime)) {
      return res
        .status(400)
        .json({ message: "Invalid time format. Use HH:MM" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      doctor: doctorId,
      status: { $in: ["pending", "confirmed"] },
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Appointment not found or cannot be rescheduled" });
    }

    const oldSlotTime = appointment.slotTime;
    const oldSlotEndTime = appointment.slotEndTime;
    const today = appointment.slotDate;

    // Calculate new end time (15 minutes after start)
    const [newHour, newMinute] = newSlotTime.split(":").map(Number);
    const newEndHour = newMinute === 45 ? newHour + 1 : newHour;
    const newEndMinute = (newMinute + 15) % 60;
    const newSlotEndTime = `${newEndHour
      .toString()
      .padStart(2, "0")}:${newEndMinute.toString().padStart(2, "0")}`;

    // Store old slot info for the rescheduled appointment
    appointment.rescheduledFrom = {
      slotTime: oldSlotTime,
      slotEndTime: oldSlotEndTime,
      rescheduledAt: new Date(),
      reason: reason || "Rescheduled by doctor",
    };

    // Update to new slot
    appointment.slotTime = newSlotTime;
    appointment.slotEndTime = newSlotEndTime;

    // Add notification for the student
    appointment.notification = {
      hasNotification: true,
      message: `Your appointment has been rescheduled from ${oldSlotTime} to ${newSlotTime}. Reason: ${
        reason || "Doctor's request"
      }`,
      type: "reschedule",
      createdAt: new Date(),
      read: false,
    };

    await appointment.save();

    // Find all appointments that need to shift forward
    // These are all appointments from the ORIGINAL slot time onwards (excluding completed/cancelled)
    const appointmentsToShift = await Appointment.find({
      doctor: doctorId,
      slotDate: today,
      status: { $nin: ["cancelled", "no-show", "completed"] },
      _id: { $ne: id }, // Exclude the rescheduled appointment
      slotTime: { $gte: oldSlotTime }, // All appointments from original time onwards
    }).sort({ slotTime: 1 });

    let shiftedCount = 0;

    // Shift each appointment forward by 15 minutes
    for (const apt of appointmentsToShift) {
      const aptOldTime = apt.slotTime;
      const aptOldEndTime = apt.slotEndTime;

      // Calculate new time (shift forward by 15 minutes)
      const [h, m] = aptOldTime.split(":").map(Number);
      let nextMinute = m + 15;
      let nextHour = h;
      if (nextMinute >= 60) {
        nextMinute = nextMinute - 60;
        nextHour = h + 1;
      }

      // Check if new time exceeds working hours (9 PM = 21:00)
      if (nextHour >= 21) {
        // Cannot shift beyond working hours
        continue;
      }

      const shiftedSlotTime = `${nextHour
        .toString()
        .padStart(2, "0")}:${nextMinute.toString().padStart(2, "0")}`;
      const shiftedEndHour = nextMinute === 45 ? nextHour + 1 : nextHour;
      const shiftedEndMinute = (nextMinute + 15) % 60;
      const shiftedSlotEndTime = `${shiftedEndHour
        .toString()
        .padStart(2, "0")}:${shiftedEndMinute.toString().padStart(2, "0")}`;

      apt.rescheduledFrom = {
        slotTime: aptOldTime,
        slotEndTime: aptOldEndTime,
        rescheduledAt: new Date(),
        reason: "Automatically shifted forward due to schedule adjustment",
      };
      apt.slotTime = shiftedSlotTime;
      apt.slotEndTime = shiftedSlotEndTime;
      apt.notification = {
        hasNotification: true,
        message: `Your appointment has been shifted from ${aptOldTime} to ${shiftedSlotTime} due to schedule adjustment.`,
        type: "reschedule",
        createdAt: new Date(),
        read: false,
      };
      await apt.save();
      shiftedCount++;
    }

    // Reorder queue
    await reorderDoctorQueue(doctorId, today);

    const populatedAppointment = await Appointment.findById(id)
      .populate("student", "name email studentId")
      .lean();

    res.json({
      message: "Appointment rescheduled successfully",
      appointment: populatedAppointment,
      affectedCount: shiftedCount,
      newSlot: { slotTime: newSlotTime, slotEndTime: newSlotEndTime },
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({ message: "Error rescheduling appointment" });
  }
};

/**
 * Get student notifications
 * @route GET /api/appointments/notifications
 * @access Private (Student)
 */
export const getNotifications = async (req, res) => {
  try {
    const studentId = req.user._id;

    const notifications = await Appointment.find({
      student: studentId,
      "notification.hasNotification": true,
    })
      .select("notification slotTime slotDate doctor rescheduledFrom")
      .populate("doctor", "name")
      .sort({ "notification.createdAt": -1 })
      .lean();

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

/**
 * Mark notification as read
 * @route PUT /api/appointments/notifications/:id/read
 * @access Private (Student)
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, student: studentId },
      { "notification.read": true },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification:", error);
    res.status(500).json({ message: "Error marking notification" });
  }
};

/**
 * Clear notification
 * @route DELETE /api/appointments/notifications/:id
 * @access Private (Student)
 */
export const clearNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, student: studentId },
      {
        "notification.hasNotification": false,
        "notification.read": true,
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification cleared" });
  } catch (error) {
    console.error("Error clearing notification:", error);
    res.status(500).json({ message: "Error clearing notification" });
  }
};

/**
 * Manually update appointment priority (Doctor/Admin)
 * @route PUT /api/appointments/:id/priority
 * @access Private (Doctor/Admin)
 */
export const updateAppointmentPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { severity, riskScore, reason } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const previousRiskScore = appointment.riskScore;

    if (severity) {
      appointment.severity = severity;
    }
    if (riskScore !== undefined) {
      appointment.riskScore = riskScore;
    }
    appointment.priorityChangeReason = reason;
    appointment.priorityChangedBy = userId;

    await appointment.save();

    // Log the change
    const queue = await DoctorQueue.getOrCreateQueue(
      appointment.doctor,
      appointment.slotDate
    );
    await queue.logPrioritizationChange(
      appointment._id,
      riskScore > previousRiskScore ? "escalate" : "downgrade",
      appointment.queuePosition,
      0, // Will be updated by reorder
      reason || "Manual priority adjustment"
    );

    // Reorder queue
    await reorderDoctorQueue(appointment.doctor, appointment.slotDate);

    res.json({ message: "Priority updated", appointment });
  } catch (error) {
    console.error("Error updating priority:", error);
    res.status(500).json({ message: "Error updating priority" });
  }
};

/**
 * Get all appointments (Admin)
 * @route GET /api/appointments/admin/all
 * @access Private (Admin)
 */
export const getAllAppointments = async (req, res) => {
  try {
    const { date, doctorId, status, severity } = req.query;

    const query = {};

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.slotDate = { $gte: targetDate, $lt: nextDay };
    }

    if (doctorId) {
      query.doctor = doctorId;
    }

    if (status) {
      query.status = status;
    }

    if (severity) {
      query.severity = severity;
    }

    const appointments = await Appointment.find(query)
      .populate("doctor", "name department")
      .populate("student", "name email studentId branch year")
      .sort({ slotDate: -1, riskScore: -1 })
      .lean();

    // Get statistics
    const stats = {
      total: appointments.length,
      byStatus: {
        pending: appointments.filter((a) => a.status === "pending").length,
        confirmed: appointments.filter((a) => a.status === "confirmed").length,
        inProgress: appointments.filter((a) => a.status === "in-progress")
          .length,
        completed: appointments.filter((a) => a.status === "completed").length,
        cancelled: appointments.filter((a) => a.status === "cancelled").length,
      },
      bySeverity: {
        critical: appointments.filter((a) => a.severity === "critical").length,
        high: appointments.filter((a) => a.severity === "high").length,
        medium: appointments.filter((a) => a.severity === "medium").length,
        low: appointments.filter((a) => a.severity === "low").length,
      },
    };

    res.json({ appointments, stats });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

/**
 * Get all queues (Admin)
 * @route GET /api/appointments/admin/queues
 * @access Private (Admin)
 */
export const getAllQueues = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const doctors = await User.find({ role: "doctor", isActive: true })
      .select("name department")
      .lean();

    const queuesData = await Promise.all(
      doctors.map(async (doctor) => {
        const queue = await DoctorQueue.getOrCreateQueue(
          doctor._id,
          targetDate
        );
        const appointments = await Appointment.find({
          doctor: doctor._id,
          slotDate: targetDate,
          status: { $in: ["pending", "confirmed", "in-progress"] },
        })
          .populate("student", "name studentId")
          .sort({ riskScore: -1 })
          .lean();

        return {
          doctor,
          queue: {
            isAvailable: queue.isAvailable,
            stats: queue.stats,
            prioritizationLog: queue.prioritizationLog.slice(-10), // Last 10 logs
          },
          appointments,
          currentPatient: queue.currentPatient,
        };
      })
    );

    res.json(queuesData);
  } catch (error) {
    console.error("Error fetching queues:", error);
    res.status(500).json({ message: "Error fetching queues" });
  }
};

/**
 * Get AI prioritization analytics (Admin)
 * @route GET /api/appointments/admin/analytics
 * @access Private (Admin)
 */
export const getAIAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const appointments = await Appointment.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();

    // Analyze AI performance
    const analytics = {
      totalAnalyzed: appointments.length,
      severityDistribution: {
        critical: appointments.filter((a) => a.severity === "critical").length,
        high: appointments.filter((a) => a.severity === "high").length,
        medium: appointments.filter((a) => a.severity === "medium").length,
        low: appointments.filter((a) => a.severity === "low").length,
      },
      averageRiskScore:
        appointments.length > 0
          ? Math.round(
              appointments.reduce((sum, a) => sum + a.riskScore, 0) /
                appointments.length
            )
          : 0,
      priorityChanges: appointments.filter((a) => a.priorityChangedBy).length,
      commonConditions: getCommonConditions(appointments),
      dailyBreakdown: getDailyBreakdown(appointments, start, end),
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
};

// Helper function to reorder doctor's queue
async function reorderDoctorQueue(doctorId, date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const appointments = await Appointment.find({
    doctor: doctorId,
    slotDate: { $gte: targetDate, $lt: nextDay },
    status: { $in: ["pending", "confirmed", "in-progress"] },
  }).lean();

  const reordered = reorderQueueByPriority(appointments);

  // Update queue positions in database
  await Promise.all(
    reordered.map((apt) =>
      Appointment.updateOne(
        { _id: apt._id },
        { queuePosition: apt.queuePosition }
      )
    )
  );

  // Update queue metadata
  const queue = await DoctorQueue.getOrCreateQueue(doctorId, targetDate);
  queue.lastUpdated = new Date();
  await queue.save();
}

// Helper function to get common conditions
function getCommonConditions(appointments) {
  const conditions = {};
  appointments.forEach((apt) => {
    if (apt.aiAnalysis?.detectedConditions) {
      apt.aiAnalysis.detectedConditions.forEach((condition) => {
        conditions[condition] = (conditions[condition] || 0) + 1;
      });
    }
  });

  return Object.entries(conditions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([condition, count]) => ({ condition, count }));
}

// Helper function to get daily breakdown
function getDailyBreakdown(appointments, start, end) {
  const breakdown = [];
  const current = new Date(start);

  while (current <= end) {
    const dayStart = new Date(current);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.createdAt);
      return aptDate >= dayStart && aptDate <= dayEnd;
    });

    breakdown.push({
      date: current.toISOString().split("T")[0],
      total: dayAppointments.length,
      critical: dayAppointments.filter((a) => a.severity === "critical").length,
      high: dayAppointments.filter((a) => a.severity === "high").length,
      medium: dayAppointments.filter((a) => a.severity === "medium").length,
      low: dayAppointments.filter((a) => a.severity === "low").length,
    });

    current.setDate(current.getDate() + 1);
  }

  return breakdown;
}

export default {
  getDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getDoctorQueue,
  updateAppointmentStatus,
  updateAppointmentPriority,
  rescheduleAppointment,
  getNotifications,
  markNotificationRead,
  clearNotification,
  getAllAppointments,
  getAllQueues,
  getAIAnalytics,
};
