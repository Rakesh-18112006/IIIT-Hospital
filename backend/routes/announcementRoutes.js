import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createAnnouncement,
  getAnnouncements,
  getActiveAnnouncements,
  reactToAnnouncement,
  closeAnnouncement
} from '../controllers/announcementController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Doctor routes
router.post('/', authorize('doctor'), createAnnouncement);
router.put('/:id/close', authorize('doctor'), closeAnnouncement);

// Student routes
router.post('/:id/react', authorize('student'), reactToAnnouncement);

// Public routes (authenticated users)
router.get('/active', getActiveAnnouncements);
router.get('/', getAnnouncements);

export default router;
