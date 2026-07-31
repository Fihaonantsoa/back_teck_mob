import { Router } from 'express';
import {
  getAllEleves,
  getEleveById,
  updateEleve,
  deleteEleve,
  getNotesEleve,
  getMesEleves
} from '../controllers/eleve.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';
import { canAccessEleve } from '../middlewares/eleveAccess.middleware.js';

const router = Router();

// Liste complète : réservée à l'admin et au professeur (pour peupler une
// grille de saisie de notes par classe, par ex.). Un élève/parent n'a pas
// besoin de lister TOUS les élèves du lycée.
router.get('/', authenticate, restrictTo('ADMIN', 'PROFESSEUR'), getAllEleves);

// Libre-service élève/parent : renvoie uniquement SES propres élèves
// rattachés (soi-même si ELEVE, ses enfants si PARENT). Doit être déclarée
// AVANT '/:id' pour qu'Express ne tente pas de parser "mes-eleves" comme id.
router.get('/mes-eleves', authenticate, restrictTo('ELEVE', 'PARENT'), getMesEleves);

// Accès à UN élève précis : protégé par canAccessEleve (admin/prof toujours
// autorisés ; élève uniquement pour lui-même ; parent uniquement pour ses
// enfants rattachés).
router.get('/:id', authenticate, canAccessEleve, getEleveById);
router.get('/:id/notes', authenticate, canAccessEleve, getNotesEleve);

// Modification/suppression : réservées à l'admin, inchangé
router.put('/:id', authenticate, restrictTo('ADMIN'), updateEleve);
router.delete('/:id', authenticate, restrictTo('ADMIN'), deleteEleve);

export default router;