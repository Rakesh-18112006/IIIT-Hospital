import mongoose from 'mongoose';

const medicalAccessRequestSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'expired'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    // Access expires after 24 hours
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  auditLog: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
medicalAccessRequestSchema.index({ chatRoom: 1, status: 1 });
medicalAccessRequestSchema.index({ doctor: 1, student: 1 });
medicalAccessRequestSchema.index({ expiresAt: 1 });

const MedicalAccessRequest = mongoose.model('MedicalAccessRequest', medicalAccessRequestSchema);

export default MedicalAccessRequest;
