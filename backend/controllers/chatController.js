import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import MedicalAccessRequest from '../models/MedicalAccessRequest.js';
import Announcement from '../models/Announcement.js';
import { getIO } from '../socketServer.js';
import MedicalDocument from '../models/MedicalDocument.js';
import Prescription from '../models/Prescription.js';
import PatientRecord from '../models/PatientRecord.js';
import Groq from 'groq-sdk';

// Initialize Groq client for MediAnalyzer
let groq = null;
const getGroqClient = () => {
  if (!groq && process.env.GROQ_API_KEY) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
};

// @desc    Get chat rooms for user
// @route   GET /api/chat/rooms
// @access  Private
export const getChatRooms = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === 'doctor') {
      query.doctor = userId;
    } else if (userRole === 'student') {
      query.student = userId;
    }

    const chatRooms = await ChatRoom.find(query)
      .populate('announcement', 'title message status priority')
      .populate(userRole === 'doctor' ? 'student' : 'doctor', 'name studentId department')
      .sort({ updatedAt: -1 });

    // Get unread counts for each room
    const roomsWithUnread = await Promise.all(
      chatRooms.map(async (room) => {
        const unreadCount = await ChatMessage.countDocuments({
          chatRoom: room._id,
          sender: { $ne: userId },
          read: false
        });

        // Get last message
        const lastMessage = await ChatMessage.findOne({
          chatRoom: room._id
        }).sort({ createdAt: -1 });

        return {
          ...room.toObject(),
          unreadCount,
          lastMessage
        };
      })
    );

    res.json(roomsWithUnread);
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ message: 'Error fetching chat rooms' });
  }
};

// @desc    Get messages for a chat room
// @route   GET /api/chat/rooms/:roomId/messages
// @access  Private
export const getChatMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Verify user has access to this room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.doctor.toString() !== userId.toString() && 
        chatRoom.student.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this chat room' });
    }

    const messages = await ChatMessage.find({ chatRoom: roomId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await ChatMessage.updateMany(
      {
        chatRoom: roomId,
        sender: { $ne: userId },
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// @desc    Send message
// @route   POST /api/chat/rooms/:roomId/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Verify user has access to this room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.doctor.toString() !== userId.toString() && 
        chatRoom.student.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to send messages in this room' });
    }

    // If doctor sends first message, activate the room if it's waiting
    if (chatRoom.status === 'waiting' && userRole === 'doctor') {
      chatRoom.status = 'active';
      chatRoom.activatedAt = new Date();
      await chatRoom.save();

      // Check if there are other waiting rooms and update their status
      const announcement = await Announcement.findById(chatRoom.announcement);
      const otherRooms = await ChatRoom.find({
        announcement: chatRoom.announcement,
        _id: { $ne: roomId },
        status: 'waiting'
      });

      // Deactivate other active rooms for this announcement (only one active at a time)
      await ChatRoom.updateMany(
        {
          announcement: chatRoom.announcement,
          _id: { $ne: roomId },
          status: 'active'
        },
        {
          $set: {
            status: 'waiting'
          }
        }
      );
    }

    // Handle Allow/Deny text messages as fallback for medical access requests
    if (userRole === 'student' && chatRoom.student.toString() === userId.toString()) {
      const trimmedMessage = message.trim().toLowerCase();
      if (trimmedMessage === 'allow' || trimmedMessage === 'deny') {
        const accessRequest = await MedicalAccessRequest.findOne({
          chatRoom: roomId,
          status: 'pending'
        });

        if (accessRequest) {
          // Redirect to respond-medical-access endpoint logic
          const approved = trimmedMessage === 'allow';
          
          accessRequest.status = approved ? 'approved' : 'denied';
          chatRoom.medicalAccessGranted = approved;
          if (approved) {
            chatRoom.medicalAccessGrantedAt = new Date();
          }

          accessRequest.auditLog.push({
            action: approved ? 'approved' : 'denied',
            details: `Student ${approved ? 'granted' : 'denied'} medical data access via text message`
          });

          const systemMessage = new ChatMessage({
            chatRoom: roomId,
            sender: userId,
            senderRole: 'student',
            message: approved 
              ? 'Medical data access granted. Doctor can now query your medical records.'
              : 'Medical data access denied.',
            messageType: approved ? 'medical_access_granted' : 'medical_access_denied'
          });
          await systemMessage.save();

          accessRequest.respondedAt = new Date();
          await accessRequest.save();
          await chatRoom.save();

          const populatedSystemMessage = await ChatMessage.findById(systemMessage._id)
            .populate('sender', 'name');

          // Emit socket event
          const io = getIO();
          if (io) {
            io.to(`room:${roomId}`).emit('new-message', populatedSystemMessage);
            io.to(`user:${chatRoom.doctor}`).emit('medical-access-response', {
              roomId,
              approved,
              accessRequest
            });
          }

          return res.status(201).json(populatedSystemMessage);
        }
      }
    }

    const chatMessage = new ChatMessage({
      chatRoom: roomId,
      sender: userId,
      senderRole: userRole,
      message: message.trim(),
      messageType: 'text'
    });

    await chatMessage.save();

    const populatedMessage = await ChatMessage.findById(chatMessage._id)
      .populate('sender', 'name');

    // Emit socket event for new message
    const io = getIO();
    if (io) {
      io.to(`room:${roomId}`).emit('new-message', populatedMessage);
      
      // Notify other user in their personal room
      const otherUserId = chatRoom.doctor.toString() === userId 
        ? chatRoom.student.toString()
        : chatRoom.doctor.toString();
      
      io.to(`user:${otherUserId}`).emit('message-received', {
        roomId,
        message: populatedMessage
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

// @desc    Query MediAnalyzer bot (doctor only, requires medical access)
// @route   POST /api/chat/rooms/:roomId/query-medical-bot
// @access  Private (Doctor)
export const queryMedicalBotInChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { question } = req.body;
    const doctorId = req.user._id;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can query the medical bot' });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.doctor.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!chatRoom.medicalAccessGranted) {
      return res.status(403).json({ message: 'Medical access not granted. Please request access first.' });
    }

    const studentId = chatRoom.student;
    const client = getGroqClient();
    if (!client) {
      return res.status(500).json({ message: 'Medical analyzer is not configured' });
    }

    // Get all medical data sources for this student (same logic as in documentController)
    const documents = await MedicalDocument.find({
      student: studentId,
      processingStatus: "completed",
    }).sort({ uploadDate: -1 });

    const prescriptions = await Prescription.find({
      patientId: studentId,
      status: { $in: ["active", "completed"] },
    })
      .populate("doctorId", "name department")
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    const patientRecords = await PatientRecord.find({
      student: studentId,
      status: "completed",
    })
      .populate("assignedDoctor", "name department")
      .sort({ completedAt: -1, visitDate: -1 });

    const hasData = documents.length > 0 || prescriptions.length > 0 || patientRecords.length > 0;

    if (!hasData) {
      return res.json({
        answer: "The student doesn't have any medical records yet.",
        source: null,
        sourceType: null,
        sourceId: null
      });
    }

    // Build context (reuse logic from documentController - simplified version)
    let contextParts = [];

    if (prescriptions.length > 0) {
      contextParts.push("=== PRESCRIPTIONS ===");
      prescriptions.forEach((prescription, index) => {
        const medList = prescription.medicines.map(med => {
          const timingStr = med.timings && med.timings.length > 0 
            ? ` (Take: ${med.timings.join(', ')})` 
            : '';
          return `- ${med.name}${timingStr}`;
        }).join('\n');

        contextParts.push(`
Prescription #${index + 1} (Date: ${new Date(prescription.createdAt).toLocaleDateString()})
Doctor: Dr. ${prescription.doctorId?.name || "Unknown"}
Diagnosis: ${prescription.diagnosis || "N/A"}
Medications:
${medList || "None"}
Advice: ${prescription.advice || "None"}
---`);
      });
    }

    if (patientRecords.length > 0) {
      contextParts.push("\n=== MEDICAL CONSULTATIONS ===");
      patientRecords.slice(0, 10).forEach((record, index) => {
        contextParts.push(`
Consultation #${index + 1} (Date: ${new Date(record.completedAt || record.visitDate).toLocaleDateString()})
Doctor: ${record.assignedDoctor?.name || "Unknown"}
Symptoms: ${record.symptoms?.join(", ") || "N/A"}
Description: ${record.symptomDescription || "N/A"}
Prescription: ${record.prescription || "None"}
Doctor Notes: ${record.doctorNotes || "None"}
---`);
      });
    }

    if (documents.length > 0) {
      contextParts.push("\n=== UPLOADED MEDICAL DOCUMENTS ===");
      documents.forEach((doc, index) => {
        contextParts.push(`
Document ${index + 1}: ${doc.originalName || "Medical Document"}
Type: ${doc.analyzedData?.documentType || "Unknown"}
Blood Group: ${doc.analyzedData?.bloodGroup || "Not found"}
Conditions: ${doc.analyzedData?.conditions?.join(", ") || "None"}
Medications: ${doc.analyzedData?.medications?.join(", ") || "None"}
Allergies: ${doc.analyzedData?.allergies?.join(", ") || "None"}
Summary: ${doc.analyzedData?.summary || "No summary"}
${doc.extractedText ? `\nFull Content:\n${doc.extractedText.substring(0, 2000)}\n` : ''}
---`);
      });
    }

    const fullContext = contextParts.join("\n");

    const prompt = `You are a medical records assistant helping a doctor understand a patient's medical history. Answer the doctor's question based on the patient's medical records.

PATIENT'S MEDICAL RECORDS:
${fullContext}

DOCTOR'S QUESTION: ${question}

Provide a clear, concise answer with source attribution. Format your response as:
Answer: [your answer]
Source: [source reference]`;

    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    let answer = responseText;
    let source = null;
    let sourceType = null;
    let sourceId = null;

    const answerMatch = responseText.match(/Answer:\s*(.+?)(?=Source:|$)/s);
    const sourceMatch = responseText.match(/Source:\s*(.+?)$/s);

    if (answerMatch) {
      answer = answerMatch[1].trim();
    } else {
      answer = responseText.trim();
    }
    
    if (sourceMatch) {
      source = sourceMatch[1].trim();
      
      // Try to match source to documents
      const sourceLower = source.toLowerCase();
      if (sourceLower.includes('prescription') && prescriptions.length > 0) {
        sourceType = 'prescription';
        sourceId = prescriptions[0]._id.toString();
        source = `Prescription from ${new Date(prescriptions[0].createdAt).toLocaleDateString()}`;
      } else if (sourceLower.includes('consultation') && patientRecords.length > 0) {
        sourceType = 'patient_record';
        sourceId = patientRecords[0]._id.toString();
        source = `Consultation from ${new Date(patientRecords[0].completedAt || patientRecords[0].visitDate).toLocaleDateString()}`;
      } else if (documents.length > 0) {
        const matchedDoc = documents.find(doc => 
          sourceLower.includes(doc.originalName?.toLowerCase() || '')
        );
        if (matchedDoc) {
          sourceType = 'document';
          sourceId = matchedDoc._id.toString();
          source = matchedDoc.originalName || "Medical Document";
        }
      }
    }

    // Create bot message in chat
    const botMessage = new ChatMessage({
      chatRoom: roomId,
      sender: doctorId,
      senderRole: 'doctor',
      message: `🤖 MediAnalyzer Bot:\n\n${answer}${source ? `\n\nSource: ${source}` : ''}`,
      messageType: 'text'
    });

    await botMessage.save();

    const populatedBotMessage = await ChatMessage.findById(botMessage._id)
      .populate('sender', 'name');

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`room:${roomId}`).emit('new-message', populatedBotMessage);
    }

    res.json({
      answer,
      source,
      sourceType,
      sourceId,
      message: populatedBotMessage
    });
  } catch (error) {
    console.error('Query medical bot in chat error:', error);
    res.status(500).json({ message: 'Error querying medical bot', error: error.message });
  }
};

// @desc    Request medical data access
// @route   POST /api/chat/rooms/:roomId/request-medical-access
// @access  Private (Doctor)
export const requestMedicalAccess = async (req, res) => {
  try {
    const { roomId } = req.params;
    const doctorId = req.user._id;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can request medical access' });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.doctor.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if access already granted
    if (chatRoom.medicalAccessGranted) {
      return res.status(400).json({ message: 'Medical access already granted' });
    }

    // Check if request already pending
    let accessRequest = await MedicalAccessRequest.findOne({
      chatRoom: roomId,
      status: 'pending'
    });

    if (!accessRequest) {
      accessRequest = new MedicalAccessRequest({
        chatRoom: roomId,
        doctor: doctorId,
        student: chatRoom.student,
        status: 'pending'
      });
      await accessRequest.save();

      accessRequest.auditLog.push({
        action: 'requested',
        details: 'Doctor requested medical data access'
      });
      await accessRequest.save();
    }

    // Create system message
    const systemMessage = new ChatMessage({
      chatRoom: roomId,
      sender: doctorId,
      senderRole: 'doctor',
      message: 'Doctor is requesting access to your medical documents. Please use the buttons below to respond.',
      messageType: 'medical_access_request'
    });
    await systemMessage.save();

    const populatedSystemMessage = await ChatMessage.findById(systemMessage._id)
      .populate('sender', 'name');

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`room:${roomId}`).emit('new-message', populatedSystemMessage);
      io.to(`user:${chatRoom.student}`).emit('medical-access-requested', {
        roomId,
        request: accessRequest
      });
    }

    res.status(201).json({
      message: 'Medical access request sent',
      accessRequest,
      systemMessage: populatedSystemMessage
    });
  } catch (error) {
    console.error('Request medical access error:', error);
    res.status(500).json({ message: 'Error requesting medical access' });
  }
};

// @desc    Grant or deny medical data access
// @route   POST /api/chat/rooms/:roomId/respond-medical-access
// @access  Private (Student)
export const respondMedicalAccess = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { approved } = req.body;
    const studentId = req.user._id;

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can respond to medical access requests' });
    }

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.student.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const accessRequest = await MedicalAccessRequest.findOne({
      chatRoom: roomId,
      status: 'pending'
    });

    if (!accessRequest) {
      return res.status(404).json({ message: 'No pending medical access request found' });
    }

    if (approved) {
      accessRequest.status = 'approved';
      chatRoom.medicalAccessGranted = true;
      chatRoom.medicalAccessGrantedAt = new Date();

      accessRequest.auditLog.push({
        action: 'approved',
        details: 'Student granted medical data access'
      });

      const systemMessage = new ChatMessage({
        chatRoom: roomId,
        sender: studentId,
        senderRole: 'student',
        message: 'Medical data access granted. Doctor can now query your medical records.',
        messageType: 'medical_access_granted'
      });
      await systemMessage.save();
      var populatedSystemMessage = await ChatMessage.findById(systemMessage._id)
        .populate('sender', 'name');
    } else {
      accessRequest.status = 'denied';
      accessRequest.auditLog.push({
        action: 'denied',
        details: 'Student denied medical data access'
      });

      const systemMessage = new ChatMessage({
        chatRoom: roomId,
        sender: studentId,
        senderRole: 'student',
        message: 'Medical data access denied.',
        messageType: 'medical_access_denied'
      });
      await systemMessage.save();
      var populatedSystemMessage = await ChatMessage.findById(systemMessage._id)
        .populate('sender', 'name');
    }

    accessRequest.respondedAt = new Date();
    await accessRequest.save();
    await chatRoom.save();

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`room:${roomId}`).emit('new-message', populatedSystemMessage);
      io.to(`user:${chatRoom.doctor}`).emit('medical-access-response', {
        roomId,
        approved,
        accessRequest
      });
    }

    res.json({
      message: approved ? 'Medical access granted' : 'Medical access denied',
      accessRequest,
      chatRoom,
      systemMessage: populatedSystemMessage
    });
  } catch (error) {
    console.error('Respond medical access error:', error);
    res.status(500).json({ message: 'Error responding to medical access request' });
  }
};

// @desc    Check medical access status
// @route   GET /api/chat/rooms/:roomId/medical-access
// @access  Private
export const checkMedicalAccess = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.doctor.toString() !== userId.toString() && 
        chatRoom.student.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const accessRequest = await MedicalAccessRequest.findOne({
      chatRoom: roomId
    }).sort({ createdAt: -1 });

    res.json({
      medicalAccessGranted: chatRoom.medicalAccessGranted,
      accessRequest
    });
  } catch (error) {
    console.error('Check medical access error:', error);
    res.status(500).json({ message: 'Error checking medical access' });
  }
};

// @desc    Get waiting queue for announcement
// @route   GET /api/chat/announcements/:announcementId/queue
// @access  Private (Doctor)
export const getAnnouncementQueue = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const doctorId = req.user._id;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can view queue' });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcement.doctor.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const chatRooms = await ChatRoom.find({
      announcement: announcementId,
      status: { $in: ['waiting', 'active'] }
    })
      .populate('student', 'name studentId email')
      .sort({ createdAt: 1 });

    res.json(chatRooms);
  } catch (error) {
    console.error('Get announcement queue error:', error);
    res.status(500).json({ message: 'Error fetching queue' });
  }
};