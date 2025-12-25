import mongoose from 'mongoose';

const dietRecommendationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientRecord'
  },
  recommendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dietType: {
    type: String,
    enum: ['normal', 'light', 'special'],
    required: true
  },
  specialInstructions: {
    type: String
  },
  restrictions: [{
    type: String
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  messNotes: {
    type: String
  },
  updatedByMess: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient querying
dietRecommendationSchema.index({ student: 1, status: 1 });
dietRecommendationSchema.index({ dietType: 1, status: 1 });
dietRecommendationSchema.index({ startDate: 1, endDate: 1 });

const DietRecommendation = mongoose.model('DietRecommendation', dietRecommendationSchema);

export default DietRecommendation;
