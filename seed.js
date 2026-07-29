import bcrypt from 'bcryptjs';
import prisma from './src/utils/prisma.js';

// ------------------------------------------------------------
// 1. NETTOYAGE COMPLET (clearDb)
// ------------------------------------------------------------
async function clearDb() {
  console.log('🧹 Nettoyage de la base de données...');

  // Ordre de suppression inverse des dépendances (respect des clés étrangères)
  // On utilise deleteMany pour éviter les erreurs de contrainte (pas de CASCADE direct sur toutes)
  // On les exécute dans l'ordre : d'abord les enfants, puis les parents.
  
  await prisma.$transaction([
    // Supprimer les notes
    prisma.note.deleteMany(),
    // Supprimer les évaluations
    prisma.evaluation.deleteMany(),
    // Supprimer les enseignements
    prisma.enseignement.deleteMany(),
    // Supprimer les parent_eleve
    prisma.parentEleve.deleteMany(),
    // Supprimer les élèves
    prisma.eleve.deleteMany(),
    // Supprimer les utilisateurs
    prisma.utilisateur.deleteMany(),
    // Supprimer les matières
    prisma.matiere.deleteMany(),
    // Supprimer les classes
    prisma.classe.deleteMany(),
  ]);

  console.log('✅ Base de données nettoyée.');

  // ------------------------------------------------------------
  // 2. RÉINITIALISATION DES SÉQUENCES AUTO-INCREMENT
  // ------------------------------------------------------------
  // On réinitialise toutes les séquences des tables avec des `id` auto-incrémentés
  // Pour PostgreSQL, on utilise `TRUNCATE ... RESTART IDENTITY CASCADE` si les tables sont vides
  // Mais on peut aussi utiliser `ALTER SEQUENCE ... RESTART`
  // Avec Prisma, on peut exécuter du SQL brut
  const sequences = [
    'UTILISATEUR_id_seq',
    'ELEVE_id_seq',
    'CLASSE_id_seq',
    'MATIERE_id_seq',
    'ENSEIGNEMENT_id_seq',
    'EVALUATION_id_seq',
    'NOTE_id_seq',
    'PARENT_ELEVE_parentId_eleveId_seq' // Si auto-incrément sur la table de liaison (pas recommandé, mais on gère)
  ];

  // Utiliser la connexion directe pour exécuter du SQL
  for (const seq of sequences) {
    try {
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${seq}" RESTART WITH 1;`);
      console.log(`✅ Séquence ${seq} réinitialisée.`);
    } catch (error) {
      // Certaines séquences peuvent ne pas exister (ex: si on n'a pas de séquence sur la liaison)
      // Ignorer silencieusement
    }
  }

  console.log('🔄 Auto-incréments réinitialisés.');
}

// ------------------------------------------------------------
// 3. SEEDING
// ------------------------------------------------------------
async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyer avant de remplir
  await clearDb();

  // ------------------------------------------------------------
  // 3.1 CRÉER UN ADMIN
  // ------------------------------------------------------------
  const adminEmail = 'admin@lycee.fr';
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.utilisateur.create({
    data: {
      email: adminEmail,
      motDePasseHash: adminPassword,
      nom: 'Admin',
      prenom: 'System',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin créé : ${adminEmail} / admin123`);

  // ------------------------------------------------------------
  // 3.2 CRÉER DES CLASSES
  // ------------------------------------------------------------
  const classesData = [
    { libelle: 'Terminale A', niveau: 'Terminale', anneeScolaire: '2025-2026' },
    { libelle: 'Terminale B', niveau: 'Terminale', anneeScolaire: '2025-2026' },
    { libelle: 'Première A', niveau: 'Première', anneeScolaire: '2025-2026' },
    { libelle: 'Première B', niveau: 'Première', anneeScolaire: '2025-2026' },
  ];
  const classes = [];
  for (const cls of classesData) {
    const c = await prisma.classe.create({ data: cls });
    classes.push(c);
    console.log(`✅ Classe créée : ${c.libelle} (ID ${c.id})`);
  }

  // ------------------------------------------------------------
  // 3.3 CRÉER DES MATIÈRES
  // ------------------------------------------------------------
  const matieresData = [
    { nom: 'Mathématiques', coefficientGeneral: 2.5 },
    { nom: 'Physique-Chimie', coefficientGeneral: 2.0 },
    { nom: 'Français', coefficientGeneral: 2.0 },
    { nom: 'Anglais', coefficientGeneral: 1.5 },
    { nom: 'Histoire-Géographie', coefficientGeneral: 1.5 },
    { nom: 'SVT', coefficientGeneral: 1.5 },
    { nom: 'Philosophie', coefficientGeneral: 2.0 },
  ];
  const matieres = [];
  for (const mat of matieresData) {
    const m = await prisma.matiere.create({ data: mat });
    matieres.push(m);
    console.log(`✅ Matière créée : ${m.nom} (coeff ${m.coefficientGeneral})`);
  }

  // ------------------------------------------------------------
  // 3.4 CRÉER DES PROFESSEURS
  // ------------------------------------------------------------
  const profsData = [
    { email: 'prof.maths@lycee.fr', password: '123456', nom: 'Martin', prenom: 'Jean', role: 'PROFESSEUR' },
    { email: 'prof.physique@lycee.fr', password: '123456', nom: 'Durand', prenom: 'Marie', role: 'PROFESSEUR' },
    { email: 'prof.francais@lycee.fr', password: '123456', nom: 'Lefebvre', prenom: 'Pierre', role: 'PROFESSEUR' },
    { email: 'prof.anglais@lycee.fr', password: '123456', nom: 'Dubois', prenom: 'Sophie', role: 'PROFESSEUR' },
    { email: 'prof.histoire@lycee.fr', password: '123456', nom: 'Moreau', prenom: 'Luc', role: 'PROFESSEUR' },
  ];
  const professeurs = [];
  for (const p of profsData) {
    const hashed = await bcrypt.hash(p.password, 10);
    const prof = await prisma.utilisateur.create({
      data: {
        email: p.email,
        motDePasseHash: hashed,
        nom: p.nom,
        prenom: p.prenom,
        role: p.role,
      },
    });
    professeurs.push(prof);
    console.log(`✅ Professeur créé : ${p.prenom} ${p.nom} (${p.email})`);
  }

  // ------------------------------------------------------------
  // 3.5 CRÉER DES ÉLÈVES (avec leurs comptes utilisateur)
  // ------------------------------------------------------------
  const elevesData = [
    {
      email: 'eleve.dupont@lycee.fr',
      password: '123456',
      nom: 'Dupont',
      prenom: 'Jean',
      matricule: 'M2025-001',
      dateNaissance: '2006-02-14',
      adresseParent: '5 Rue de la Paix, 75001 Paris',
      telephoneParent: '0612345601',
    },
    {
      email: 'eleve.martin@lycee.fr',
      password: '123456',
      nom: 'Martin',
      prenom: 'Sophie',
      matricule: 'M2025-002',
      dateNaissance: '2006-08-22',
      adresseParent: '15 Avenue des Champs, 75008 Paris',
      telephoneParent: '0612345602',
    },
    {
      email: 'eleve.bernard@lycee.fr',
      password: '123456',
      nom: 'Bernard',
      prenom: 'Marie',
      matricule: 'M2025-003',
      dateNaissance: '2007-04-15',
      adresseParent: '12 Rue des Écoles, 75001 Paris',
      telephoneParent: '0612345603',
    },
    {
      email: 'eleve.dubois@lycee.fr',
      password: '123456',
      nom: 'Dubois',
      prenom: 'Thomas',
      matricule: 'M2025-004',
      dateNaissance: '2006-12-01',
      adresseParent: '8 Boulevard Voltaire, 75011 Paris',
      telephoneParent: '0612345604',
    },
    {
      email: 'eleve.petit@lycee.fr',
      password: '123456',
      nom: 'Petit',
      prenom: 'Emma',
      matricule: 'M2025-005',
      dateNaissance: '2007-06-18',
      adresseParent: '3 Rue des Lilas, 75016 Paris',
      telephoneParent: '0612345605',
    },
  ];

  const eleves = [];
  // On répartit les élèves dans les classes : Terminale A (id 1), Terminale B (id 2), Première A (id 3)
  const classeIds = [1, 1, 2, 2, 3]; // 5 élèves répartis
  for (let i = 0; i < elevesData.length; i++) {
    const e = elevesData[i];
    const hashed = await bcrypt.hash(e.password, 10);
    // Créer l'utilisateur
    const user = await prisma.utilisateur.create({
      data: {
        email: e.email,
        motDePasseHash: hashed,
        nom: e.nom,
        prenom: e.prenom,
        role: 'ELEVE',
      },
    });
    // Créer l'élève
    const eleve = await prisma.eleve.create({
      data: {
        matricule: e.matricule,
        dateNaissance: new Date(e.dateNaissance),
        adresseParent: e.adresseParent,
        telephoneParent: e.telephoneParent,
        utilisateurId: user.id,
        classeId: classeIds[i],
      },
    });
    eleves.push(eleve);
    console.log(`✅ Élève créé : ${e.prenom} ${e.nom} (${e.email}) dans classe ID ${classeIds[i]}`);
  }

  // ------------------------------------------------------------
  // 3.6 CRÉER DES ENSEIGNEMENTS (professeur → matière → classe)
  // ------------------------------------------------------------
  // On associe chaque professeur à des classes pour certaines matières
  // On suppose : profs IDs 2 à 6 (admin est 1)
  // Classes IDs 1,2,3,4
  // Matières IDs 1 à 7
  // On va créer quelques enseignements réalistes
  const enseignementsToCreate = [
    { prof: 'prof.maths@lycee.fr', matiere: 'Mathématiques', classeId: 1 },
    { prof: 'prof.maths@lycee.fr', matiere: 'Mathématiques', classeId: 2 },
    { prof: 'prof.maths@lycee.fr', matiere: 'Mathématiques', classeId: 3 },
    { prof: 'prof.physique@lycee.fr', matiere: 'Physique-Chimie', classeId: 1 },
    { prof: 'prof.physique@lycee.fr', matiere: 'Physique-Chimie', classeId: 2 },
    { prof: 'prof.francais@lycee.fr', matiere: 'Français', classeId: 1 },
    { prof: 'prof.francais@lycee.fr', matiere: 'Français', classeId: 2 },
    { prof: 'prof.anglais@lycee.fr', matiere: 'Anglais', classeId: 1 },
    { prof: 'prof.anglais@lycee.fr', matiere: 'Anglais', classeId: 2 },
    { prof: 'prof.histoire@lycee.fr', matiere: 'Histoire-Géographie', classeId: 1 },
  ];

  const enseignements = [];
  for (const item of enseignementsToCreate) {
    const profUser = await prisma.utilisateur.findUnique({
      where: { email: item.prof },
    });
    const matiere = await prisma.matiere.findFirst({
      where: { nom: item.matiere },
    });
    if (profUser && matiere) {
      const enseignement = await prisma.enseignement.create({
        data: {
          professeurId: profUser.id,
          classeId: item.classeId,
          matiereId: matiere.id,
        },
      });
      enseignements.push(enseignement);
      console.log(`✅ Enseignement : ${item.matiere} en classe ${item.classeId} par ${item.prof}`);
    } else {
      console.warn(`⚠️ Enseignement ignoré: professeur ${item.prof} ou matière ${item.matiere} introuvable.`);
    }
  }

  // ------------------------------------------------------------
  // 3.7 CRÉER DES ÉVALUATIONS
  // ------------------------------------------------------------
  // Pour chaque enseignement, on crée 2-3 évaluations (DS, Interro, Projet)
  const now = new Date();
  const evaluationsToCreate = [];

  for (const ens of enseignements) {
    // Récupérer la matière
    const matiere = await prisma.matiere.findFirst({
      where: { id: ens.matiereId },
    });
    const baseDate = new Date(now);
    baseDate.setDate(baseDate.getDate() - 30); // on commence il y a 30 jours

    // DS1
    evaluationsToCreate.push({
      titre: `DS1 ${matiere.nom}`,
      date: new Date(baseDate),
      coefficient: 2,
      baremeMax: 20,
      enseignementId: ens.id,
    });
    baseDate.setDate(baseDate.getDate() + 7);
    // Interro 1
    evaluationsToCreate.push({
      titre: `Interro 1 ${matiere.nom}`,
      date: new Date(baseDate),
      coefficient: 1,
      baremeMax: 10,
      enseignementId: ens.id,
    });
    baseDate.setDate(baseDate.getDate() + 7);
    // DS2
    evaluationsToCreate.push({
      titre: `DS2 ${matiere.nom}`,
      date: new Date(baseDate),
      coefficient: 2,
      baremeMax: 20,
      enseignementId: ens.id,
    });
  }

  const evaluations = [];
  for (const ev of evaluationsToCreate) {
    const evalCreated = await prisma.evaluation.create({
      data: {
        titre: ev.titre,
        date: ev.date,
        coefficient: ev.coefficient,
        baremeMax: ev.baremeMax,
        enseignementId: ev.enseignementId,
      },
    });
    evaluations.push(evalCreated);
    console.log(`✅ Évaluation créée : ${ev.titre}`);
  }

  // ------------------------------------------------------------
  // 3.8 CRÉER DES NOTES
  // ------------------------------------------------------------
  // Pour chaque évaluation, on attribue une note à chaque élève de la classe correspondante
  // On génère des notes aléatoires entre 5 et 19 (sur le baremeMax)
  console.log('📝 Génération des notes...');
  let noteCount = 0;
  for (const evalItem of evaluations) {
    // Récupérer l'enseignement pour connaître la classe
    const enseignement = await prisma.enseignement.findUnique({
      where: { id: evalItem.enseignementId },
      include: { classe: true },
    });
    if (!enseignement) continue;

    // Récupérer tous les élèves de cette classe
    const elevesInClass = await prisma.eleve.findMany({
      where: { classeId: enseignement.classeId },
    });

    for (const eleve of elevesInClass) {
      // Note aléatoire entre 5 et 19 (sur baremeMax), arrondie à 0.5 près
      const maxNote = evalItem.baremeMax;
      const min = 5;
      const max = maxNote - 1; // on évite le 20 parfait systématique
      const valeur = Math.round((Math.random() * (max - min) + min) * 2) / 2;
      // Assurer que la valeur ne dépasse pas baremeMax
      const finalValeur = Math.min(valeur, maxNote);

      await prisma.note.create({
        data: {
          valeur: finalValeur,
          evaluationId: evalItem.id,
          eleveId: eleve.id,
        },
      });
      noteCount++;
    }
  }
  console.log(`✅ ${noteCount} notes créées.`);

  // ------------------------------------------------------------
  // 3.9 CRÉER DES PARENTS (facultatif)
  // ------------------------------------------------------------
  // On peut créer un parent et le lier à un élève
  const parentEmail = 'parent.dupont@lycee.fr';
  const parentPassword = await bcrypt.hash('123456', 10);
  const parent = await prisma.utilisateur.create({
    data: {
      email: parentEmail,
      motDePasseHash: parentPassword,
      nom: 'Dupont',
      prenom: 'Jean-Pierre',
      role: 'PARENT',
    },
  });
  // Lier le parent à l'élève Dupont (Jean)
  const eleveDupont = await prisma.eleve.findFirst({
    where: { utilisateur: { email: 'eleve.dupont@lycee.fr' } },
  });
  if (eleveDupont) {
    await prisma.parentEleve.create({
      data: {
        parentId: parent.id,
        eleveId: eleveDupont.id,
      },
    });
    console.log(`✅ Parent ${parentEmail} lié à l'élève ${eleveDupont.utilisateurId}`);
  }

  console.log('🎉 Seeding terminé avec succès !');
}

// ------------------------------------------------------------
// 4. EXÉCUTION
// ------------------------------------------------------------
main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });