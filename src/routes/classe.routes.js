import { Router } from 'express';
import {
  getAllClasses,
  getClasseById,
  createClasse,
  updateClasse,
  deleteClasse
} from '../controllers/classe.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes publiques (lecture) accessibles à tous les utilisateurs connectés
router.get('/', authenticate, getAllClasses);
router.get('/:id', authenticate, getClasseById);

// Routes d'administration (écriture) réservées à l'ADMIN
router.post('/', authenticate, restrictTo('ADMIN'), createClasse);
router.put('/:id', authenticate, restrictTo('ADMIN'), updateClasse);
router.delete('/:id', authenticate, restrictTo('ADMIN'), deleteClasse);

export default router;