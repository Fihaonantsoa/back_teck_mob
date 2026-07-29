import prisma from '../utils/prisma.js';

// Récupérer toutes les notes (avec filtres)
export const getAllNotes = async (req, res, next) => {
  try {
    const { evaluationId, eleveId } = req.query;
    const where = {};
    if (evaluationId) where.evaluationId = parseInt(evaluationId);
    if (eleveId) where.eleveId = parseInt(eleveId);

    const notes = await prisma.note.findMany({
      where,
      include: {
        evaluation: { include: { enseignement: { include: { matiere: true, classe: true } } } },
        eleve: { include: { utilisateur: true } }
      }
    });
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

// Récupérer une note par ID
export const getNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await prisma.note.findUnique({
      where: { id: parseInt(id) },
      include: { evaluation: true, eleve: { include: { utilisateur: true } } }
    });
    if (!note) return res.status(404).json({ message: 'Note non trouvée.' });
    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

// Créer ou mettre à jour une note (professeur ou admin)
// Si la note existe déjà pour (évaluation, élève), on la met à jour (upsert)
export const upsertNote = async (req, res, next) => {
  try {
    const { valeur, evaluationId, eleveId } = req.body;

    if (valeur === undefined || !evaluationId || !eleveId) {
      return res.status(400).json({ message: 'valeur, evaluationId, eleveId requis.' });
    }

    // Vérifier que l'évaluation existe et que le prof a le droit
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: parseInt(evaluationId) },
      include: { enseignement: { include: { professeur: true } } }
    });
    if (!evaluation) return res.status(404).json({ message: 'Évaluation non trouvée.' });

    if (req.user.role === 'PROFESSEUR' && evaluation.enseignement.professeurId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez pas noter pour cette évaluation.' });
    }

    // Vérifier que l'élève existe
    const eleve = await prisma.eleve.findUnique({ where: { id: parseInt(eleveId) } });
    if (!eleve) return res.status(404).json({ message: 'Élève non trouvé.' });

    // Upsert
    const note = await prisma.note.upsert({
      where: {
        evaluationId_eleveId: {
          evaluationId: parseInt(evaluationId),
          eleveId: parseInt(eleveId)
        }
      },
      update: {
        valeur: parseFloat(valeur)
      },
      create: {
        valeur: parseFloat(valeur),
        evaluationId: parseInt(evaluationId),
        eleveId: parseInt(eleveId)
      },
      include: { evaluation: true, eleve: { include: { utilisateur: true } } }
    });

    res.status(200).json({ message: 'Note enregistrée.', data: note });
  } catch (error) {
    next(error);
  }
};

// Supprimer une note (professeur ou admin)
export const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.note.findUnique({
      where: { id: parseInt(id) },
      include: { evaluation: { include: { enseignement: { include: { professeur: true } } } } }
    });
    if (!existing) return res.status(404).json({ message: 'Note non trouvée.' });

    if (req.user.role === 'PROFESSEUR' && existing.evaluation.enseignement.professeurId !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez pas supprimer cette note.' });
    }

    await prisma.note.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Note supprimée.' });
  } catch (error) {
    next(error);
  }
};

// Calculer la moyenne d'un élève dans une matière (ou toutes) – exemple de fonction utile
export const getMoyenneEleve = async (req, res, next) => {
  try {
    const { eleveId, matiereId } = req.params;
    // On récupère toutes les notes de l'élève pour la matière donnée
    const notes = await prisma.note.findMany({
      where: {
        eleveId: parseInt(eleveId),
        evaluation: {
          enseignement: {
            matiereId: parseInt(matiereId)
          }
        }
      },
      include: {
        evaluation: true
      }
    });

    if (notes.length === 0) {
      return res.status(200).json({ moyenne: null, message: 'Aucune note pour cette matière.' });
    }

    // Calcul de la moyenne pondérée par les coefficients des évaluations
    let totalPoints = 0;
    let totalCoeffs = 0;
    for (const note of notes) {
      const coeff = note.evaluation.coefficient || 1;
      totalPoints += note.valeur * coeff;
      totalCoeffs += coeff;
    }
    const moyenne = totalCoeffs > 0 ? totalPoints / totalCoeffs : null;
    res.status(200).json({ moyenne, nbNotes: notes.length });
  } catch (error) {
    next(error);
  }
};