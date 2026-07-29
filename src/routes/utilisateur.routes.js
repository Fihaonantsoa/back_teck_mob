import { Router } from 'express';
import {
  getAllUtilisateurs,
  getUtilisateurById,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur
} from '../controllers/utilisateur.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate); // Toutes les routes nécessitent une auth
router.use(restrictTo('ADMIN')); // Seul l'admin peut gérer les utilisateurs

router.get('/', getAllUtilisateurs);
router.get('/:id', getUtilisateurById);
router.post('/', createUtilisateur);
router.put('/:id', updateUtilisateur);
router.delete('/:id', deleteUtilisateur);

export default router;