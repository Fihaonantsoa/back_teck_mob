# API de Gestion des Notes de Lycée (Backend)

Ce projet est l'API RESTful pour la gestion des notes, des bulletins, des classes et des utilisateurs d'un lycée. Elle est construite avec **Node.js**, **Express**, **Prisma** et **PostgreSQL**.

## Installation et Lancement

### Prérequis
- **Node.js** (v18 ou supérieur)
- **npm** ou **yarn**
- **PostgreSQL** (v14 ou supérieur) installé et en cours d'exécution

### 1. Cloner et installer les dépendances
```bash
git clone <votre-repo>
cd backend-gestion-notes
npm install


backend-gestion-notes/
├── .env
├── .gitignore
├── package.json
├── prisma/
│   └── schema.prisma          # (Le schéma complet de notre précédente conception)
├── src/
│   ├── index.js               # Point d'entrée du serveur
│   ├── utils/
│   │   └── prisma.js          # Instance unique de PrismaClient
│   ├── middlewares/
│   │   ├── auth.middleware.js # Vérification JWT
│   │   └── error.middleware.js # Gestion centralisée des erreurs
│   ├── routes/
│   │   ├── index.js           # Regroupement des routes (v1)
│   │   ├── auth.routes.js
│   │   └── notes.routes.js
│   └── controllers/
│       ├── auth.controller.js
│       └── notes.controller.js
├── seed.js                    # Script de peuplement initial
└── README.md                  # Guide complet
```

# initialisation de la base de données
npx prisma migrate dev --name init
npx prisma generate
npm run seed