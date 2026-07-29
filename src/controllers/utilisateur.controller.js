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
        eleve: { select: { id: true, matricule: true, classeId: true } }
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

// Créer un utilisateur (admin) – peut aussi créer un élève en même temps
export const createUtilisateur = async (req, res, next) => {
  try {
    const { email, password, nom, prenom, role, eleveData } = req.body;

    if (!email || !password || !nom || !prenom || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const existing = await prisma.utilisateur.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Cet email est déjà utilisé.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Construction de l'objet création
    const data = {
      email,
      motDePasseHash: hashedPassword,
      nom,
      prenom,
      role,
    };

    // Si c'est un élève, on peut aussi créer l'entrée Eleve
    if (role === 'ELEVE' && eleveData) {
      // On crée l'utilisateur puis l'élève dans une transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.utilisateur.create({ data });
        const eleve = await tx.eleve.create({
          data: {
            matricule: eleveData.matricule,
            dateNaissance: eleveData.dateNaissance ? new Date(eleveData.dateNaissance) : null,
            adresseParent: eleveData.adresseParent,
            telephoneParent: eleveData.telephoneParent,
            utilisateurId: user.id,
            classeId: eleveData.classeId,
          }
        });
        return { user, eleve };
      });
      return res.status(201).json({ message: 'Élève créé avec succès.', data: result });
    }

    // Sinon, création simple
    const newUser = await prisma.utilisateur.create({ data });
    res.status(201).json({ message: 'Utilisateur créé avec succès.', data: newUser });
  } catch (error) {
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