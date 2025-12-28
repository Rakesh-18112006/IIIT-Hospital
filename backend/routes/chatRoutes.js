import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getChatRooms,
  getChatMessages,
  sendMessage,
  requestMedicalAccess,
  respondMedicalAccess,
  checkMedicalAccess,
  getAnnouncementQueue,
  queryMedicalBotInChat
} from '../controllers/chatController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get chat rooms
router.get('/rooms', getChatRooms);

// Chat messages
router.get('/rooms/:roomId/messages', getChatMessages);
router.post('/rooms/:roomId/messages', sendMessage);

// Medical access
router.post('/rooms/:roomId/request-medical-access', authorize('doctor'), requestMedicalAccess);
router.post('/rooms/:roomId/respond-medical-access', authorize('student'), respondMedicalAccess);
router.get('/rooms/:roomId/medical-access', checkMedicalAccess);

// MediAnalyzer bot (doctor only, requires medical access)
router.post('/rooms/:roomId/query-medical-bot', authorize('doctor'), queryMedicalBotInChat);

// Queue management (doctor only)
router.get('/announcements/:announcementId/queue', authorize('doctor'), getAnnouncementQueue);

export default router;
