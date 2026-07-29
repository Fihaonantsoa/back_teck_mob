import { Router } from 'express';
import authRoutes from './auth.routes.js';
import classeRoutes from './classe.routes.js';
import matiereRoutes from './matiere.routes.js';
import utilisateurRoutes from './utilisateur.routes.js';
import eleveRoutes from './eleve.routes.js';
import enseignementRoutes from './enseignement.routes.js';
import evaluationRoutes from './evaluation.routes.js';
import noteRoutes from './note.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/classes', classeRoutes);
router.use('/matieres', matiereRoutes);
router.use('/utilisateurs', utilisateurRoutes);
router.use('/eleves', eleveRoutes);
router.use('/enseignements', enseignementRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/notes', noteRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API Gestion de Notes opérationnelle' });
});

export default router;