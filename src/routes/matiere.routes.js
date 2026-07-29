import { Router } from 'express';
import {
  getAllMatieres,
  getMatiereById,
  createMatiere,
  updateMatiere,
  deleteMatiere
} from '../controllers/matiere.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes publiques (lecture)
router.get('/', authenticate, getAllMatieres);
router.get('/:id', authenticate, getMatiereById);

// Routes d'administration
router.post('/', authenticate, restrictTo('ADMIN'), createMatiere);
router.put('/:id', authenticate, restrictTo('ADMIN'), updateMatiere);
router.delete('/:id', authenticate, restrictTo('ADMIN'), deleteMatiere);

export default router;