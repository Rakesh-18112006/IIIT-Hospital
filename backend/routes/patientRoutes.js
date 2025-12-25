import express from 'express';
import {
  submitSymptoms,
  getMyRecords,
  getMyLeaves,
  getMyDiet,
  getPatientQueue,
  getPatientDetails,
  updatePatientRecord,
  createMedicalLeave,
  createDietRecommendation,
  getSuggestedTests
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student routes
router.post('/symptoms', protect, authorize('student'), submitSymptoms);
router.get('/my-records', protect, authorize('student'), getMyRecords);
router.get('/my-leaves', protect, authorize('student'), getMyLeaves);
router.get('/my-diet', protect, authorize('student'), getMyDiet);

// Doctor routes
router.get('/queue', protect, authorize('doctor'), getPatientQueue);
router.post('/suggest-tests', protect, authorize('doctor'), getSuggestedTests);
router.get('/:id', protect, authorize('doctor'), getPatientDetails);
router.put('/:id', protect, authorize('doctor'), updatePatientRecord);
router.post('/:id/leave', protect, authorize('doctor'), createMedicalLeave);
router.post('/:id/diet', protect, authorize('doctor'), createDietRecommendation);

export default router;
