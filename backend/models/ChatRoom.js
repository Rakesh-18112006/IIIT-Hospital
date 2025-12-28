import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  announcement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement',
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
    enum: ['waiting', 'active', 'closed'],
    default: 'waiting'
  },
  medicalAccessGranted: {
    type: Boolean,
    default: false
  },
  medicalAccessGrantedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  activatedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatRoomSchema.index({ announcement: 1, status: 1 });
chatRoomSchema.index({ doctor: 1, student: 1 });
chatRoomSchema.index({ student: 1, status: 1 });
chatRoomSchema.index({ announcement: 1, doctor: 1, student: 1 }, { unique: true });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export default ChatRoom;
