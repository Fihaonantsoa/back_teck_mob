import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, nom: true, prenom: true, role: true }
    });

    if (!utilisateur) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    req.user = utilisateur;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token invalide ou expiré.' });
    }
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Vous n\'avez pas les droits nécessaires.' });
    }
    next();
  };
};