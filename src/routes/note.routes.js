import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  upsertNote,
  deleteNote,
  getMoyenneEleve
} from '../controllers/note.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Consultation des notes accessible à tous (avec filtres)
router.get('/', authenticate, getAllNotes);
router.get('/:id', authenticate, getNoteById);
router.get('/moyenne/:eleveId/:matiereId', authenticate, getMoyenneEleve);

// Saisie des notes par professeur ou admin
router.post('/', authenticate, restrictTo('PROFESSEUR', 'ADMIN'), upsertNote);
router.put('/:id', authenticate, restrictTo('PROFESSEUR', 'ADMIN'), upsertNote); // on peut réutiliser upsert
router.delete('/:id', authenticate, restrictTo('PROFESSEUR', 'ADMIN'), deleteNote);

export default router;