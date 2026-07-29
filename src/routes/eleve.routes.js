import { Router } from 'express';
import {
  getAllEleves,
  getEleveById,
  updateEleve,
  deleteEleve,
  getNotesEleve
} from '../controllers/eleve.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes accessibles à tous les utilisateurs connectés (pour consulter)
router.get('/', authenticate, getAllEleves);
router.get('/:id', authenticate, getEleveById);
router.get('/:id/notes', authenticate, getNotesEleve); // accessible par le parent/élève/prof

// Routes réservées à l'admin pour modification/suppression
router.put('/:id', authenticate, restrictTo('ADMIN'), updateEleve);
router.delete('/:id', authenticate, restrictTo('ADMIN'), deleteEleve);

export default router;