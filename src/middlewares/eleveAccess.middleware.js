import prisma from '../utils/prisma.js';

// ==========================================
// Middleware : restreint l'accès aux données d'un ÉLÈVE précis
// (route du type /eleves/:id ou /eleves/:id/notes) à :
//   - ADMIN            → toujours autorisé
//   - PROFESSEUR       → toujours autorisé (lecture, pour la saisie de notes)
//   - ELEVE            → uniquement si :id correspond à SON propre profil élève
//   - PARENT           → uniquement si :id correspond à un enfant qui lui
//                         est rattaché via ParentEleve
//
// Utilisation dans les routes (voir eleve.routes.js ci-dessous) :
//   router.get('/:id', authenticate, canAccessEleve, getEleveById);
//   router.get('/:id/notes', authenticate, canAccessEleve, getNotesEleve);
// ==========================================

export const canAccessEleve = async (req, res, next) => {
  try {
    const eleveId = parseInt(req.params.id);
    if (Number.isNaN(eleveId)) {
      return res.status(400).json({ message: 'Identifiant élève invalide.' });
    }

    const { role, id: userId } = req.user;

    // Admin et professeur : accès en lecture à tous les élèves
    if (role === 'ADMIN' || role === 'PROFESSEUR') {
      return next();
    }

    if (role === 'ELEVE') {
      const eleve = await prisma.eleve.findUnique({
        where: { id: eleveId },
        select: { utilisateurId: true }
      });
      if (eleve && eleve.utilisateurId === userId) {
        return next();
      }
      return res.status(403).json({ message: "Vous ne pouvez consulter que votre propre bulletin." });
    }

    if (role === 'PARENT') {
      const lien = await prisma.parentEleve.findUnique({
        where: {
          parentId_eleveId: {
            parentId: userId,
            eleveId: eleveId
          }
        }
      });
      if (lien) {
        return next();
      }
      return res.status(403).json({ message: "Vous ne pouvez consulter que le bulletin de vos enfants." });
    }

    return res.status(403).json({ message: 'Accès refusé.' });
  } catch (error) {
    next(error);
  }
};