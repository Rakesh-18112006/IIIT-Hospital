import express from 'express';
import { googleAuth, login, registerStaff, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/google', googleAuth);
router.post('/login', login);
router.post('/register', registerStaff);

// Protected routes
router.get('/me', protect, getMe);

export default router;
