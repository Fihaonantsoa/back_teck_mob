import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';

// Récupérer tous les utilisateurs (admin)
export const getAllUtilisateurs = async (req, res, next) => {
  try {
    const users = await prisma.utilisateur.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        eleve: { select: { id: true, matricule: true, classeId: true } },
        enseignements: { select: { id: true, classeId: true, matiereId: true } },
        parents: { select: { eleveId: true } }
      },
      orderBy: { nom: 'asc' }
    });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// Récupérer un utilisateur par son ID
export const getUtilisateurById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.utilisateur.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        eleve: true,
        enseignements: { include: { classe: true, matiere: true } },
        parents: { include: { eleve: { include: { utilisateur: true } } } }
      }
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Créer un utilisateur (admin) – peut aussi créer les données liées au rôle
// (élève, affectations professeur, liaisons parent) en même temps.
export const createUtilisateur = async (req, res, next) => {
  try {
    const {
      email,
      password,
      nom,
      prenom,
      role,
      eleveData,          // { matricule, dateNaissance?, adresseParent?, telephoneParent?, classeId }
      enseignementsData,  // [{ classeId, matiereId }]
      parentEleveIds,     // [eleveId, ...]
    } = req.body;

    if (!email || !password || !nom || !prenom || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const existing = await prisma.utilisateur.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Cet email est déjà utilisé.' });

    // Validation spécifique au rôle
    if (role === 'ELEVE' && (!eleveData || !eleveData.matricule || !eleveData.classeId)) {
      return res.status(400).json({ message: 'Matricule et classe sont requis pour un élève.' });
    }
    if (role === 'PROFESSEUR' && enseignementsData && !Array.isArray(enseignementsData)) {
      return res.status(400).json({ message: 'Format invalide pour les affectations du professeur.' });
    }
    if (role === 'PARENT' && parentEleveIds && !Array.isArray(parentEleveIds)) {
      return res.status(400).json({ message: 'Format invalide pour les élèves rattachés.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = {
      email,
      motDePasseHash: hashedPassword,
      nom,
      prenom,
      role,
    };

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.utilisateur.create({ data });

      if (role === 'ELEVE' && eleveData) {
        const eleve = await tx.eleve.create({
          data: {
            matricule: eleveData.matricule,
            dateNaissance: eleveData.dateNaissance ? new Date(eleveData.dateNaissance) : null,
            adresseParent: eleveData.adresseParent || null,
            telephoneParent: eleveData.telephoneParent || null,
            utilisateurId: user.id,
            classeId: eleveData.classeId,
          }
        });
        return { user, eleve };
      }

      if (role === 'PROFESSEUR' && enseignementsData?.length) {
        const enseignements = [];
        for (const item of enseignementsData) {
          if (!item.classeId || !item.matiereId) continue;
          const ens = await tx.enseignement.create({
            data: {
              professeurId: user.id,
              classeId: item.classeId,
              matiereId: item.matiereId,
            }
          });
          enseignements.push(ens);
        }
        return { user, enseignements };
      }

      if (role === 'PARENT' && parentEleveIds?.length) {
        const liaisons = [];
        for (const eleveId of parentEleveIds) {
          const liaison = await tx.parentEleve.create({
            data: { parentId: user.id, eleveId }
          });
          liaisons.push(liaison);
        }
        return { user, liaisons };
      }

      return { user };
    });

    return res.status(201).json({ message: 'Utilisateur créé avec succès.', data: result });
  } catch (error) {
    // Contrainte unique violée (ex: matricule déjà utilisé, affectation en double)
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Une donnée liée existe déjà (matricule ou affectation en double).' });
    }
    next(error);
  }
};

// Mettre à jour un utilisateur (admin)
export const updateUtilisateur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, nom, prenom, role, password } = req.body;

    const existing = await prisma.utilisateur.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const data = { email, nom, prenom, role };
    if (password) {
      data.motDePasseHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.utilisateur.update({
      where: { id: parseInt(id) },
      data,
      select: { id: true, email: true, nom: true, prenom: true, role: true }
    });
    res.status(200).json({ message: 'Utilisateur mis à jour.', data: updated });
  } catch (error) {
    next(error);
  }
};

// Supprimer un utilisateur (admin)
export const deleteUtilisateur = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.utilisateur.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    await prisma.utilisateur.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    next(error);
  }
};