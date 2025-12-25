import express from 'express';
import { getDashboardStats, getDoctors, getWeeklyReport } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require hospital_admin role
router.use(protect, authorize('hospital_admin'));

router.get('/stats', getDashboardStats);
router.get('/doctors', getDoctors);
router.get('/weekly-report', getWeeklyReport);

export default router;
