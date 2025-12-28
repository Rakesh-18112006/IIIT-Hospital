import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import PatientRecord from "./models/PatientRecord.js";
import MedicalLeave from "./models/MedicalLeave.js";
import DietRecommendation from "./models/DietRecommendation.js";

dotenv.config();

const seedData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
    });
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await PatientRecord.deleteMany({});
    await MedicalLeave.deleteMany({});
    await DietRecommendation.deleteMany({});
    console.log("Cleared existing data");

    // Create staff users
    const doctor1 = await User.create({
      name: "Dr. Rakesh",
      email: "doctor@iiit.ac.in",
      password: "password123",
      role: "doctor",
      department: "General Medicine",
      phone: "9876543210",
    });

    const doctor2 = await User.create({
      name: "Dr. Patel",
      email: "doctor2@iiit.ac.in",
      password: "password123",
      role: "doctor",
      department: "General Medicine",
      phone: "9876543211",
    });

    const hospitalAdmin = await User.create({
      name: "Admin User",
      email: "admin@iiit.ac.in",
      password: "password123",
      role: "hospital_admin",
      phone: "9876543212",
    });

    const messAdmin = await User.create({
      name: "Mess Manager",
      email: "mess@iiit.ac.in",
      password: "password123",
      role: "mess_admin",
      phone: "9876543213",
    });

    console.log("Created staff users");

    console.log("\n========================================");
    console.log("Seed data created successfully!");
    console.log("========================================\n");
    console.log("Staff Login Credentials:");
    console.log("------------------------");
    console.log("Doctor: doctor@iiit.ac.in / password123");
    console.log("Doctor 2: doctor2@iiit.ac.in / password123");
    console.log("Hospital Admin: admin@iiit.ac.in / password123");
    console.log("Mess Admin: mess@iiit.ac.in / password123");
    console.log("\nStudents can login with Google OAuth");
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
