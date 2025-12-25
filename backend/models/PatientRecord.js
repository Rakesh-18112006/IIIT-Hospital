import mongoose from 'mongoose';

const patientRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: [{
    type: String,
    required: true
  }],
  symptomDescription: {
    type: String
  },
  severity: {
    type: String,
    enum: ['green', 'orange', 'red'],
    default: 'green'
  },
  status: {
    type: String,
    enum: ['waiting', 'in_consultation', 'completed', 'referred'],
    default: 'waiting'
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorNotes: {
    type: String
  },
  suggestedTests: [{
    type: String
  }],
  prescription: {
    type: String
  },
  advice: {
    type: String
  },
  referral: {
    hospital: String,
    reason: String,
    urgency: String
  },
  vitals: {
    temperature: Number,
    bloodPressure: String,
    heartRate: Number,
    oxygenLevel: Number
  },
  visitDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
patientRecordSchema.index({ student: 1, visitDate: -1 });
patientRecordSchema.index({ status: 1, severity: 1 });
patientRecordSchema.index({ assignedDoctor: 1, status: 1 });

const PatientRecord = mongoose.model('PatientRecord', patientRecordSchema);

export default PatientRecord;
