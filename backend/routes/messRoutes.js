import express from 'express';
import { 
  getActiveDiets, 
  getDietStats, 
  updateDietStatus, 
  getStudentsByDietType 
} from '../controllers/messController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require mess_admin role
router.use(protect, authorize('mess_admin'));

router.get('/diets', getActiveDiets);
router.get('/stats', getDietStats);
router.put('/diets/:id', updateDietStatus);
router.get('/diets/type/:type', getStudentsByDietType);

export default router;
