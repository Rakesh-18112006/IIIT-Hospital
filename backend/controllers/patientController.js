import PatientRecord from '../models/PatientRecord.js';
import MedicalLeave from '../models/MedicalLeave.js';
import DietRecommendation from '../models/DietRecommendation.js';
import { classifySeverity, suggestDiet, suggestTests } from '../utils/severityLogic.js';

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
