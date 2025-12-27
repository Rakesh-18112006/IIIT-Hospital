import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import messRoutes from "./routes/messRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/mess", messRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/appointments", appointmentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "IIIT Hospital API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
