import prisma from '../utils/prisma.js';

// Récupérer toutes les matières
export const getAllMatieres = async (req, res, next) => {
  try {
    const matieres = await prisma.matiere.findMany({
      orderBy: { nom: 'asc' },
      include: {
        _count: {
          select: { enseignements: true } // Nombre de classes où elle est enseignée
        }
      }
    });
    res.status(200).json(matieres);
  } catch (error) {
    next(error);
  }
};

// Récupérer une matière par son ID
export const getMatiereById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const matiere = await prisma.matiere.findUnique({
      where: { id: parseInt(id) },
      include: {
        enseignements: {
          include: {
            classe: true,
            professeur: {
              select: { nom: true, prenom: true, email: true }
            }
          }
        }
      }
    });

    if (!matiere) {
      return res.status(404).json({ message: 'Matière non trouvée.' });
    }

    res.status(200).json(matiere);
  } catch (error) {
    next(error);
  }
};

// Créer une nouvelle matière
export const createMatiere = async (req, res, next) => {
  try {
    const { nom, coefficientGeneral } = req.body;

    if (!nom || coefficientGeneral === undefined) {
      return res.status(400).json({ message: 'Le nom et le coefficient général sont requis.' });
    }

    const newMatiere = await prisma.matiere.create({
      data: {
        nom,
        coefficientGeneral: parseFloat(coefficientGeneral)
      }
    });

    res.status(201).json({
      message: 'Matière créée avec succès.',
      data: newMatiere
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour une matière
export const updateMatiere = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom, coefficientGeneral } = req.body;

    const existing = await prisma.matiere.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ message: 'Matière non trouvée.' });
    }

    const updated = await prisma.matiere.update({
      where: { id: parseInt(id) },
      data: {
        nom,
        coefficientGeneral: coefficientGeneral ? parseFloat(coefficientGeneral) : undefined
      }
    });

    res.status(200).json({
      message: 'Matière mise à jour avec succès.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une matière
export const deleteMatiere = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.matiere.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ message: 'Matière non trouvée.' });
    }

    await prisma.matiere.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: 'Matière supprimée avec succès.' });
  } catch (error) {
    next(error); // Gère P2003 si la matière est liée à un enseignement
  }
};