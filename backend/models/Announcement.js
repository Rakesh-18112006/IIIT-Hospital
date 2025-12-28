import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'responded', 'closed'],
    default: 'active'
  },
  selectedStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
announcementSchema.index({ status: 1, createdAt: -1 });
announcementSchema.index({ doctor: 1, status: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
