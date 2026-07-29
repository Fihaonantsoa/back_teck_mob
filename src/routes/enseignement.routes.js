import { Router } from 'express';
import {
  getAllEnseignements,
  getEnseignementById,
  createEnseignement,
  deleteEnseignement,
  getEnseignementsByProf
} from '../controllers/enseignement.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getAllEnseignements);
router.get('/:id', authenticate, getEnseignementById);
router.get('/prof/:profId', authenticate, getEnseignementsByProf);

router.post('/', authenticate, restrictTo('ADMIN'), createEnseignement);
router.delete('/:id', authenticate, restrictTo('ADMIN'), deleteEnseignement);

export default router;