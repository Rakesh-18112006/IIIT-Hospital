import mongoose from 'mongoose';

const medicalLeaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientRecord'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
medicalLeaveSchema.index({ student: 1, status: 1 });
medicalLeaveSchema.index({ startDate: 1, endDate: 1 });

const MedicalLeave = mongoose.model('MedicalLeave', medicalLeaveSchema);

export default MedicalLeave;
