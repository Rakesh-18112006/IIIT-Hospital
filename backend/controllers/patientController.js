import PatientRecord from '../models/PatientRecord.js';
import MedicalLeave from '../models/MedicalLeave.js';
import DietRecommendation from '../models/DietRecommendation.js';
import MedicalDocument from '../models/MedicalDocument.js';
import User from '../models/User.js';
import { classifySeverity, suggestDiet, suggestTests } from '../utils/severityLogic.js';
import { generateQRCode, parseQRCode } from '../utils/qrCodeGenerator.js';

// @desc    Submit symptoms (Student)
// @route   POST /api/patient/symptoms
// @access  Private (Student)
export const submitSymptoms = async (req, res) => {
  try {
    const { symptoms, symptomDescription, vitals } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ message: 'Please provide symptoms' });
    }

    // Auto-classify severity
    const severity = classifySeverity(symptoms);

    const patientRecord = await PatientRecord.create({
      student: req.user._id,
      symptoms,
      symptomDescription,
      severity,
      vitals,
      status: 'waiting'
    });

    res.status(201).json({
      message: 'Symptoms submitted successfully',
      record: patientRecord,
      severity
    });
  } catch (error) {
    console.error('Submit symptoms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get student's own records
// @route   GET /api/patient/my-records
// @access  Private (Student)
export const getMyRecords = async (req, res) => {
  try {
    const records = await PatientRecord.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedDoctor', 'name');

    res.json(records);
  } catch (error) {
    console.error('Get my records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get student's medical leaves
// @route   GET /api/patient/my-leaves
// @access  Private (Student)
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await MedicalLeave.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'name');

    res.json(leaves);
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get student's diet recommendations
// @route   GET /api/patient/my-diet
// @access  Private (Student)
export const getMyDiet = async (req, res) => {
  try {
    const diet = await DietRecommendation.find({ 
      student: req.user._id,
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .populate('recommendedBy', 'name');

    res.json(diet);
  } catch (error) {
    console.error('Get my diet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient queue (Doctor)
// @route   GET /api/patient/queue
// @access  Private (Doctor)
export const getPatientQueue = async (req, res) => {
  try {
    const queue = await PatientRecord.find({
      status: { $in: ['waiting', 'in_consultation'] }
    })
      .sort({ severity: -1, createdAt: 1 }) // Red first, then by time
      .populate('student', 'name studentId email')
      .populate('assignedDoctor', 'name');

    // Custom sort to ensure red > orange > green
    const sortedQueue = queue.sort((a, b) => {
      const severityOrder = { red: 0, orange: 1, green: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    res.json(sortedQueue);
  } catch (error) {
    console.error('Get patient queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient details with history (Doctor)
// @route   GET /api/patient/:id
// @access  Private (Doctor)
export const getPatientDetails = async (req, res) => {
  try {
    const record = await PatientRecord.findById(req.params.id)
      .populate('student', 'name studentId email phone');

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Get patient history
    const history = await PatientRecord.find({
      student: record.student._id,
      _id: { $ne: record._id }
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      currentRecord: record,
      history
    });
  } catch (error) {
    console.error('Get patient details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update patient record (Doctor)
// @route   PUT /api/patient/:id
// @access  Private (Doctor)
export const updatePatientRecord = async (req, res) => {
  try {
    const { 
      status, 
      doctorNotes, 
      suggestedTests: tests, 
      prescription, 
      advice, 
      referral,
      severity 
    } = req.body;

    const record = await PatientRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Update fields
    if (status) record.status = status;
    if (doctorNotes) record.doctorNotes = doctorNotes;
    if (tests) record.suggestedTests = tests;
    if (prescription) record.prescription = prescription;
    if (advice) record.advice = advice;
    if (referral) record.referral = referral;
    if (severity) record.severity = severity;
    
    record.assignedDoctor = req.user._id;
    
    if (status === 'completed') {
      record.completedAt = new Date();
    }

    await record.save();

    res.json(record);
  } catch (error) {
    console.error('Update patient record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create medical leave (Doctor)
// @route   POST /api/patient/:id/leave
// @access  Private (Doctor)
export const createMedicalLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, notes } = req.body;

    const record = await PatientRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const leave = await MedicalLeave.create({
      student: record.student,
      patientRecord: record._id,
      approvedBy: req.user._id,
      startDate,
      endDate,
      reason,
      notes
    });

    res.status(201).json(leave);
  } catch (error) {
    console.error('Create medical leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create diet recommendation (Doctor)
// @route   POST /api/patient/:id/diet
// @access  Private (Doctor)
export const createDietRecommendation = async (req, res) => {
  try {
    const { dietType, specialInstructions, restrictions, endDate } = req.body;

    const record = await PatientRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Auto-suggest if not provided
    let dietData = { dietType, specialInstructions, restrictions };
    if (!dietType) {
      dietData = suggestDiet(record.symptoms, record.severity);
    }

    const diet = await DietRecommendation.create({
      student: record.student,
      patientRecord: record._id,
      recommendedBy: req.user._id,
      dietType: dietData.dietType,
      specialInstructions: dietData.specialInstructions || specialInstructions,
      restrictions: dietData.restrictions || restrictions,
      startDate: new Date(),
      endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
    });

    res.status(201).json(diet);
  } catch (error) {
    console.error('Create diet recommendation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get suggested tests for symptoms
// @route   POST /api/patient/suggest-tests
// @access  Private (Doctor)
export const getSuggestedTests = async (req, res) => {
  try {
    const { symptoms } = req.body;
    const tests = suggestTests(symptoms);
    res.json({ suggestedTests: tests });
  } catch (error) {
    console.error('Suggest tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate QR code for student
// @route   POST /api/patient/generate-qr
// @access  Private (Student)
export const generateStudentQRCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can generate QR codes' });
    }

    // Generate new QR code
    const { qrData, qrCodeImage } = await generateQRCode(user._id, user.studentId);

    // Save QR code data to user
    user.qrCode = qrData;
    user.qrCodeGenerated = true;
    await user.save();

    res.json({
      message: 'QR code generated successfully',
      qrCodeImage,
      qrData
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
};

// @desc    Get student's QR code
// @route   GET /api/patient/my-qr
// @access  Private (Student)
export const getStudentQRCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access their QR code' });
    }

    if (!user.qrCodeGenerated || !user.qrCode) {
      return res.status(404).json({ message: 'QR code not generated. Please generate one first.' });
    }

    // Regenerate image from stored QR data
    const { generateQRCode: genQR } = await import('../utils/qrCodeGenerator.js');
    const { qrCodeImage } = await generateQRCode(user._id, user.studentId);

    res.json({
      qrCodeImage,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      qrCodeGenerated: user.qrCodeGenerated
    });
  } catch (error) {
    console.error('Get student QR code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete student's QR code
// @route   DELETE /api/patient/delete-qr
// @access  Private (Student)
export const deleteStudentQRCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can delete their QR code' });
    }

    if (!user.qrCodeGenerated || !user.qrCode) {
      return res.status(404).json({ message: 'No QR code to delete' });
    }

    // Delete QR code from user
    user.qrCode = null;
    user.qrCodeGenerated = false;
    await user.save();

    res.json({
      message: 'QR code deleted successfully. You can generate a new one anytime.'
    });
  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({ message: 'Failed to delete QR code' });
  }
};

// @desc    Scan QR code and get patient data (Doctor)
// @route   POST /api/patient/scan-qr
// @access  Private (Doctor)
export const scanQRCode = async (req, res) => {
  try {
    let { qrData } = req.body;

    // Log incoming data for debugging
    console.log('📱 [QR Scan] Incoming request');
    console.log('📱 [QR Scan] Data Type:', typeof qrData);
    console.log('📱 [QR Scan] Data Length:', qrData?.length || 0);

    if (!qrData) {
      console.log('❌ [QR Scan] No QR data provided');
      return res.status(400).json({ message: 'QR data is required' });
    }

    // Trim whitespace from qrData
    if (typeof qrData === 'string') {
      qrData = qrData.trim();
      console.log('📱 [QR Scan] Trimmed QR data length:', qrData.length);
    }

    // Verify doctor role
    if (req.user.role !== 'doctor') {
      console.log('❌ [QR Scan] User is not a doctor, role:', req.user.role);
      return res.status(403).json({ message: 'Only doctors can scan QR codes' });
    }

    console.log('✅ [QR Scan] Doctor role verified:', req.user._id);

    // Parse QR data
    let decodedData;
    try {
      console.log('📱 [QR Scan] Attempting to parse QR data...');
      console.log('📱 [QR Scan] QR Data Sample:', qrData.substring(0, 150));
      
      decodedData = parseQRCode(qrData);
      console.log('✅ [QR Scan] QR data parsed successfully');
      console.log('📱 [QR Scan] Decoded data:', {
        userId: decodedData.userId,
        studentId: decodedData.studentId,
        hasToken: !!decodedData.token
      });
    } catch (parseError) {
      console.error('❌ [QR Scan] QR Parse Error:', parseError.message);
      console.error('❌ [QR Scan] QR Data that failed:', qrData.substring(0, 200));
      return res.status(400).json({ 
        message: `Invalid QR code format: ${parseError.message}` 
      });
    }

    const userId = decodedData.userId;

    // Validate userId
    if (!userId) {
      console.log('❌ [QR Scan] Missing userId in QR data');
      return res.status(400).json({ message: 'Invalid QR code: missing user ID' });
    }

    console.log('📱 [QR Scan] Looking up student:', userId);

    // Get student details
    const student = await User.findById(userId);

    if (!student) {
      console.log('❌ [QR Scan] Student not found:', userId);
      return res.status(404).json({ message: 'Student not found. Please ensure the QR code is valid.' });
    }

    if (student.role !== 'student') {
      console.log('❌ [QR Scan] User is not a student, role:', student.role);
      return res.status(404).json({ message: 'Invalid QR code: user is not a student' });
    }

    console.log('✅ [QR Scan] Student found:', student.studentId);

    // Get all medical records of this student
    const medicalRecords = await PatientRecord.find({ student: userId })
      .sort({ createdAt: -1 })
      .populate('assignedDoctor', 'name email')
      .limit(20); // Last 20 records

    console.log('📱 [QR Scan] Medical records found:', medicalRecords.length);

    // Get medical leaves
    const medicalLeaves = await MedicalLeave.find({ student: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('📱 [QR Scan] Medical leaves found:', medicalLeaves.length);

    // Get diet recommendations
    const dietRecommendations = await DietRecommendation.find({ student: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('📱 [QR Scan] Diet recommendations found:', dietRecommendations.length);

    // Get medical documents
    const medicalDocuments = await MedicalDocument.find({ student: userId })
      .sort({ createdAt: -1 })
      .limit(50); // All uploaded documents with limit

    console.log('📱 [QR Scan] Medical documents found:', medicalDocuments.length);

    console.log('✅ [QR Scan] Sending response with all data');
    res.json({
      message: 'QR code scanned successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        studentId: student.studentId,
        branch: student.branch,
        year: student.year,
        hostelBlock: student.hostelBlock,
        address: student.address
      },
      medicalRecords,
      medicalLeaves,
      dietRecommendations,
      medicalDocuments
    });
  } catch (error) {
    console.error('❌ [QR Scan] Unexpected error:', error.message);
    console.error('❌ [QR Scan] Stack:', error.stack);
    res.status(500).json({ message: error.message || 'Failed to scan QR code' });
  }
};
