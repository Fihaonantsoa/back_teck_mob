import { Router } from 'express';
import {
  getAllEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation
} from '../controllers/evaluation.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getAllEvaluations);
router.get('/:id', authenticate, getEvaluationById);

// Seul un professeur ou admin peut créer/modifier/supprimer
router.post('/', authenticate, restrictTo('PROFESSEUR', 'ADMIN'), createEvaluation);
router.put('/:id', authenticate, restrictTo('PROFESSEUR', 'ADMIN'), updateEvaluation);
router.delete('/:id', authenticate, restrictTo('PROFESSEUR', 'ADMIN'), deleteEvaluation);

export default router;