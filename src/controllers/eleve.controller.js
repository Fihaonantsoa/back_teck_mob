import prisma from '../utils/prisma.js';

// Récupérer tous les élèves (avec leurs infos utilisateur et classe)
export const getAllEleves = async (req, res, next) => {
  try {
    const eleves = await prisma.eleve.findMany({
      include: {
        utilisateur: true,
        classe: true,
        _count: { select: { notes: true } }
      },
      orderBy: { utilisateur: { nom: 'asc' } }
    });
    res.status(200).json(eleves);
  } catch (error) {
    next(error);
  }
};

// Récupérer un élève par son ID
export const getEleveById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eleve = await prisma.eleve.findUnique({
      where: { id: parseInt(id) },
      include: {
        utilisateur: true,
        classe: true,
        notes: {
          include: { evaluation: { include: { enseignement: { include: { matiere: true } } } } }
        },
        parents: { include: { parent: true } }
      }
    });
    if (!eleve) return res.status(404).json({ message: 'Élève non trouvé.' });
    res.status(200).json(eleve);
  } catch (error) {
    next(error);
  }
};

// Mettre à jour un élève (admin ou prof ? on autorise admin + parent ? mais pour l'instant admin)
export const updateEleve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { matricule, dateNaissance, adresseParent, telephoneParent, classeId } = req.body;

    const existing = await prisma.eleve.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ message: 'Élève non trouvé.' });

    const updated = await prisma.eleve.update({
      where: { id: parseInt(id) },
      data: {
        matricule,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        adresseParent,
        telephoneParent,
        classeId: classeId ? parseInt(classeId) : undefined
      },
      include: { utilisateur: true, classe: true }
    });
    res.status(200).json({ message: 'Élève mis à jour.', data: updated });
  } catch (error) {
    next(error);
  }
};

// Supprimer un élève (admin)
export const deleteEleve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.eleve.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ message: 'Élève non trouvé.' });

    await prisma.eleve.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Élève supprimé.' });
  } catch (error) {
    next(error);
  }
};

// Récupérer les notes d'un élève (accessible par l'élève, ses parents, ses profs)
export const getNotesEleve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const eleve = await prisma.eleve.findUnique({
      where: { id: parseInt(id) },
      select: { notes: { include: { evaluation: { include: { enseignement: { include: { matiere: true } } } } } } }
    });
    if (!eleve) return res.status(404).json({ message: 'Élève non trouvé.' });
    res.status(200).json(eleve.notes);
  } catch (error) {
    next(error);
  }
};