import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

// Inscription (accessible à tous pour le test, mais en production réservée à l'admin)
export const register = async (req, res, next) => {
  try {
    const { email, password, nom, prenom, role } = req.body;

    // Validation simple
    if (!email || !password || !nom || !prenom) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    // Vérifier si l'email existe déjà
    const existing = await prisma.utilisateur.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.utilisateur.create({
      data: {
        email,
        motDePasseHash: hashedPassword,
        nom,
        prenom,
        role: role || 'ELEVE', // Par défaut, élève
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
      }
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Connexion
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.motDePasseHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retourner les infos sans le mot de passe
    const { motDePasseHash, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Connexion réussie.',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

// Profil de l'utilisateur connecté (protégé)
export const getProfile = async (req, res) => {
  res.status(200).json({ user: req.user });
};