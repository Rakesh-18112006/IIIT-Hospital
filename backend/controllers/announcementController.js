import Announcement from '../models/Announcement.js';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import MedicalAccessRequest from '../models/MedicalAccessRequest.js';
import { getIO } from '../socketServer.js';

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Doctor)
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, priority } = req.body;
    const doctorId = req.user._id;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const announcement = new Announcement({
      doctor: doctorId,
      title,
      message,
      priority: priority || 'medium',
      status: 'active'
    });

    await announcement.save();

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('doctor', 'name department');

    // Emit socket event for new announcement
    const io = getIO();
    if (io) {
      io.to('announcements').emit('new-announcement', populatedAnnouncement);
    }

    res.status(201).json(populatedAnnouncement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Error creating announcement' });
  }
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('doctor', 'name department')
      .populate('selectedStudent', 'name studentId')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Error fetching announcements' });
  }
};

// @desc    Get active announcements
// @route   GET /api/announcements/active
// @access  Private
export const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ status: 'active' })
      .populate('doctor', 'name department')
      .sort({ priority: -1, createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Get active announcements error:', error);
    res.status(500).json({ message: 'Error fetching active announcements' });
  }
};

// @desc    Student reacts to announcement (creates chat room)
// @route   POST /api/announcements/:id/react
// @access  Private (Student)
export const reactToAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcement.status !== 'active') {
      return res.status(400).json({ message: 'Announcement is no longer active' });
    }

    // Check if chat room already exists
    let chatRoom = await ChatRoom.findOne({
      announcement: id,
      doctor: announcement.doctor,
      student: studentId
    });

    if (!chatRoom) {
      // Create new chat room
      chatRoom = new ChatRoom({
        announcement: id,
        doctor: announcement.doctor,
        student: studentId,
        status: 'waiting'
      });
      await chatRoom.save();
    }

    // Get all chat rooms for this announcement to determine queue position
    const allChatRooms = await ChatRoom.find({
      announcement: id,
      status: { $in: ['waiting', 'active'] }
    }).sort({ createdAt: 1 }).populate('student', 'name studentId');

    // If no active chat room, make this one active
    const activeRoom = allChatRooms.find(room => room.status === 'active');
    if (!activeRoom && allChatRooms.length > 0 && allChatRooms[0]._id.toString() === chatRoom._id.toString()) {
      chatRoom.status = 'active';
      chatRoom.activatedAt = new Date();
      await chatRoom.save();

      // Create system message
      const systemMessage = new ChatMessage({
        chatRoom: chatRoom._id,
        sender: announcement.doctor,
        senderRole: 'doctor',
        message: 'You are now connected with the doctor.',
        messageType: 'system'
      });
      await systemMessage.save();
    }

    const queuePosition = allChatRooms.findIndex(room => room._id.toString() === chatRoom._id.toString()) + 1;

    res.json({
      chatRoom,
      queuePosition,
      status: chatRoom.status,
      message: chatRoom.status === 'active' 
        ? 'You are now connected with the doctor.' 
        : `You are in queue. Position: ${queuePosition}`
    });
  } catch (error) {
    console.error('React to announcement error:', error);
    res.status(500).json({ message: 'Error reacting to announcement' });
  }
};

// @desc    Close announcement and all related chat rooms
// @route   PUT /api/announcements/:id/close
// @access  Private (Doctor)
export const closeAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedStudentId } = req.body;
    const doctorId = req.user._id;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcement.doctor.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: 'Not authorized to close this announcement' });
    }

    // Update announcement
    announcement.status = 'responded';
    announcement.respondedAt = new Date();
    if (selectedStudentId) {
      announcement.selectedStudent = selectedStudentId;
    }

    await announcement.save();

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('doctor', 'name department')
      .populate('selectedStudent', 'name studentId');

    // Close all chat rooms for this announcement
    await ChatRoom.updateMany(
      { announcement: id, status: { $in: ['waiting', 'active'] } },
      {
        $set: {
          status: 'closed',
          closedAt: new Date()
        }
      }
    );

    // Create system messages in all closed rooms
    const closedRooms = await ChatRoom.find({ announcement: id });
    for (const room of closedRooms) {
      const systemMessage = new ChatMessage({
        chatRoom: room._id,
        sender: doctorId,
        senderRole: 'doctor',
        message: selectedStudentId && room.student.toString() === selectedStudentId.toString()
          ? 'Thank you for your response. This announcement has been closed.'
          : 'This announcement has been closed.',
        messageType: 'system'
      });
      await systemMessage.save();
    }

    // Emit socket event for announcement status change
    const io = getIO();
    if (io) {
      io.to('announcements').emit('announcement-status-changed', populatedAnnouncement);
      // Notify all rooms for this announcement
      for (const room of closedRooms) {
        io.to(`room:${room._id}`).emit('announcement-closed', populatedAnnouncement);
      }
    }

    res.json({
      message: 'Announcement closed successfully',
      announcement: populatedAnnouncement
    });
  } catch (error) {
    console.error('Close announcement error:', error);
    res.status(500).json({ message: 'Error closing announcement' });
  }
};
