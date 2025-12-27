import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.role !== "student";
      },
    },
    role: {
      type: String,
      enum: ["student", "doctor", "hospital_admin", "mess_admin"],
      required: true,
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
    },
    department: {
      type: String,
    },
    // New student-specific fields
    branch: {
      type: String,
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
    },
    hostelBlock: {
      type: String,
      enum: ["I1", "I2", "I3", "K1", "K2", "K3", ""],
    },
    address: {
      type: String,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    qrCodeGenerated: {
      type: Boolean,
      default: false,
    },
    notifications: [
      {
        type: {
          type: String,
          enum: ["appointment", "medical_report", "new_medical_report", "prescription", "leave", "diet"],
        },
        title: String,
        message: String,
        data: mongoose.Schema.Types.Mixed,
        read: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
