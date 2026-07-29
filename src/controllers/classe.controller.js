import prisma from '../utils/prisma.js';

// Récupérer toutes les classes
export const getAllClasses = async (req, res, next) => {
  try {
    const classes = await prisma.classe.findMany({
      orderBy: { libelle: 'asc' },
      include: {
        _count: {
          select: { eleves: true } // Compte le nombre d'élèves par classe
        }
      }
    });
    res.status(200).json(classes);
  } catch (error) {
    next(error);
  }
};

// Récupérer une classe par son ID
export const getClasseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classe = await prisma.classe.findUnique({
      where: { id: parseInt(id) },
      include: {
        eleves: {
          include: { utilisateur: true } // Inclut les infos des élèves
        },
        enseignements: {
          include: { matiere: true, professeur: true }
        }
      }
    });

    if (!classe) {
      return res.status(404).json({ message: 'Classe non trouvée.' });
    }

    res.status(200).json(classe);
  } catch (error) {
    next(error);
  }
};

// Créer une nouvelle classe
export const createClasse = async (req, res, next) => {
  try {
    const { libelle, niveau, anneeScolaire } = req.body;

    if (!libelle || !niveau || !anneeScolaire) {
      return res.status(400).json({ message: 'Tous les champs (libelle, niveau, anneeScolaire) sont requis.' });
    }

    const newClasse = await prisma.classe.create({
      data: { libelle, niveau, anneeScolaire }
    });

    res.status(201).json({
      message: 'Classe créée avec succès.',
      data: newClasse
    });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour une classe
export const updateClasse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { libelle, niveau, anneeScolaire } = req.body;

    // Vérifier si la classe existe
    const existing = await prisma.classe.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ message: 'Classe non trouvée.' });
    }

    const updated = await prisma.classe.update({
      where: { id: parseInt(id) },
      data: { libelle, niveau, anneeScolaire }
    });

    res.status(200).json({
      message: 'Classe mise à jour avec succès.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une classe
export const deleteClasse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.classe.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ message: 'Classe non trouvée.' });
    }

    await prisma.classe.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ message: 'Classe supprimée avec succès.' });
  } catch (error) {
    next(error); // Si des élèves sont encore dans la classe, Prisma renverra P2003
  }
};