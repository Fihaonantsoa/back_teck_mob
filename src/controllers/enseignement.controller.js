import prisma from '../utils/prisma.js';

// Récupérer tous les enseignements
export const getAllEnseignements = async (req, res, next) => {
  try {
    const data = await prisma.enseignement.findMany({
      include: {
        professeur: { select: { nom: true, prenom: true, email: true } },
        classe: true,
        matiere: true,
        _count: { select: { evaluations: true } }
      }
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Récupérer un enseignement par ID
export const getEnseignementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.enseignement.findUnique({
      where: { id: parseInt(id) },
      include: {
        professeur: true,
        classe: true,
        matiere: true,
        evaluations: { include: { notes: true } }
      }
    });
    if (!data) return res.status(404).json({ message: 'Enseignement non trouvé.' });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Créer un enseignement (admin ou direction)
export const createEnseignement = async (req, res, next) => {
  try {
    const { professeurId, classeId, matiereId } = req.body;

    if (!professeurId || !classeId || !matiereId) {
      return res.status(400).json({ message: 'professeurId, classeId, matiereId requis.' });
    }

    // Vérifier que le professeur existe et a le bon rôle
    const prof = await prisma.utilisateur.findFirst({
      where: { id: parseInt(professeurId), role: 'PROFESSEUR' }
    });
    if (!prof) return res.status(400).json({ message: 'Professeur invalide.' });

    const newEnseignement = await prisma.enseignement.create({
      data: {
        professeurId: parseInt(professeurId),
        classeId: parseInt(classeId),
        matiereId: parseInt(matiereId)
      },
      include: { professeur: true, classe: true, matiere: true }
    });
    res.status(201).json({ message: 'Enseignement créé.', data: newEnseignement });
  } catch (error) {
    next(error);
  }
};

// Supprimer un enseignement (admin)
export const deleteEnseignement = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.enseignement.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Enseignement supprimé.' });
  } catch (error) {
    next(error);
  }
};

// Récupérer les enseignements d'un professeur (utile pour le prof)
export const getEnseignementsByProf = async (req, res, next) => {
  try {
    const { profId } = req.params;
    const data = await prisma.enseignement.findMany({
      where: { professeurId: parseInt(profId) },
      include: { classe: true, matiere: true }
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};