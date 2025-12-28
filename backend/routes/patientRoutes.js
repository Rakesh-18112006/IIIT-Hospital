import express from 'express';
import {
  submitSymptoms,
  analyzeSymptoms,
  getMyRecords,
  getMyLeaves,
  getMyDiet,
  getPatientQueue,
  getPatientDetails,
  updatePatientRecord,
  createMedicalLeave,
  createDietRecommendation,
  getSuggestedTests,
  generateStudentQRCode,
  getStudentQRCode,
  deleteStudentQRCode,
  scanQRCode,
  getNotifications,
  markNotificationAsRead,
  clearAllNotifications
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student routes
router.post('/analyze-symptoms', protect, authorize('student'), analyzeSymptoms);
router.post('/symptoms', protect, authorize('student'), submitSymptoms);
router.get('/my-records', protect, authorize('student'), getMyRecords);
router.get('/my-leaves', protect, authorize('student'), getMyLeaves);
router.get('/my-diet', protect, authorize('student'), getMyDiet);
router.post('/generate-qr', protect, authorize('student'), generateStudentQRCode);
router.get('/my-qr', protect, authorize('student'), getStudentQRCode);
router.delete('/delete-qr', protect, authorize('student'), deleteStudentQRCode);
router.get('/notifications', protect, authorize('student'), getNotifications);
router.put('/notifications/:id/read', protect, authorize('student'), markNotificationAsRead);
router.delete('/notifications/clear', protect, authorize('student'), clearAllNotifications);

// Doctor routes
router.get('/queue', protect, authorize('doctor'), getPatientQueue);
router.post('/suggest-tests', protect, authorize('doctor'), getSuggestedTests);
router.post('/scan-qr', protect, authorize('doctor'), scanQRCode);
router.get('/:id', protect, authorize('doctor'), getPatientDetails);
router.put('/:id', protect, authorize('doctor'), updatePatientRecord);
router.post('/:id/leave', protect, authorize('doctor'), createMedicalLeave);
router.post('/:id/diet', protect, authorize('doctor'), createDietRecommendation);

export default router;
