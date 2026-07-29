import prisma from '../utils/prisma.js';

// Récupérer toutes les évaluations (avec filtres possibles : classe, matière, etc.)
export const getAllEvaluations = async (req, res, next) => {
  try {
    const { enseignementId, dateDebut, dateFin } = req.query;
    const where = {};
    if (enseignementId) where.enseignementId = parseInt(enseignementId);
    if (dateDebut) where.date = { gte: new Date(dateDebut) };
    if (dateFin) where.date = { ...where.date, lte: new Date(dateFin) };

    const data = await prisma.evaluation.findMany({
      where,
      include: {
        enseignement: {
          include: { matiere: true, classe: true, professeur: { select: { nom: true, prenom: true } } }
        },
        _count: { select: { notes: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Récupérer une évaluation par ID
export const getEvaluationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.evaluation.findUnique({
      where: { id: parseInt(id) },
      include: {
        enseignement: { include: { matiere: true, classe: true, professeur: true } },
        notes: { include: { eleve: { include: { utilisateur: true } } } }
      }
    });
    if (!data) return res.status(404).json({ message: 'Évaluation non trouvée.' });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Créer une évaluation (professeur ou admin)
export const createEvaluation = async (req, res, next) => {
  try {
    const { titre, date, coefficient, baremeMax, enseignementId } = req.body;

    if (!titre || !date || !enseignementId) {
      return res.status(400).json({ message: 'titre, date, enseignementId requis.' });
    }

    // Vérifier que le professeur est bien celui de l'enseignement (sécurité)
    const enseignement = await prisma.enseignement.findUnique({
      where: { id: parseInt(enseignementId) },
      include: { professeur: true }
    });
    if (!enseignement) return res.status(404).json({ message: 'Enseignement non trouvé.' });

    // Si l'utilisateur est un professeur, il ne peut créer que pour ses enseignements
    if (req.user.role === 'PROFESSEUR' && enseignement.professeurId !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas le professeur de cette classe/matière.' });
    }

    const newEval = await prisma.evaluation.create({
      data: {
        titre,
        date: new Date(date),
        coefficient: coefficient || 1.0,
        baremeMax: baremeMax || 20.0,
        enseignementId: parseInt(enseignementId)
      },
      include: { enseignement: true }
    });
    res.status(201).json({ message: 'Évaluation créée.', data: newEval });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour une évaluation (professeur ou admin)
export const updateEvaluation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titre, date, coefficient, baremeMax } = req.body;

    const existing = await prisma.evaluation.findUnique({
      where: { id: parseInt(id) },
      include: { enseignement: { include: { professeur: true } } }
    });
    if (!existing) return res.status(404).json({ message: 'Évaluation non trouvée.' });

    // Vérification droits
    if (req.user.role === 'PROFESSEUR' && existing.enseignement.professeurId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez pas modifier cette évaluation.' });
    }

    const updated = await prisma.evaluation.update({
      where: { id: parseInt(id) },
      data: {
        titre,
        date: date ? new Date(date) : undefined,
        coefficient: coefficient ? parseFloat(coefficient) : undefined,
        baremeMax: baremeMax ? parseFloat(baremeMax) : undefined
      }
    });
    res.status(200).json({ message: 'Évaluation mise à jour.', data: updated });
  } catch (error) {
    next(error);
  }
};

// Supprimer une évaluation (professeur ou admin)
export const deleteEvaluation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.evaluation.findUnique({
      where: { id: parseInt(id) },
      include: { enseignement: { include: { professeur: true } } }
    });
    if (!existing) return res.status(404).json({ message: 'Évaluation non trouvée.' });

    if (req.user.role === 'PROFESSEUR' && existing.enseignement.professeurId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez pas supprimer cette évaluation.' });
    }

    await prisma.evaluation.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Évaluation supprimée.' });
  } catch (error) {
    next(error);
  }
};