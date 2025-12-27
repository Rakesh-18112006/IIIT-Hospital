import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect, authorize } from "../middleware/auth.js";
import {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  queryMedicalBot,
  getMedicalSummary,
} from "../controllers/documentController.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "uploads/medical-documents";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images and PDFs
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Apply authentication to all routes
router.use(protect);
router.use(authorize("student"));

// Routes
router.post("/upload", upload.single("document"), uploadDocument);
router.get("/", getDocuments);
router.get("/summary", getMedicalSummary);
router.post("/analyze", queryMedicalBot);
router.get("/:id", getDocument);
router.delete("/:id", deleteDocument);

export default router;
