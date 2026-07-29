# API de Gestion des Notes de Lycée (Backend)

Ce projet est l'API RESTful pour la gestion des notes, des bulletins, des classes et des utilisateurs d'un lycée. Elle est construite avec **Node.js**, **Express**, **Prisma** et **PostgreSQL**.

## Installation et Lancement

### Prérequis
- **Node.js** (v18 ou supérieur)
- **npm** ou **yarn**
- **PostgreSQL** (v14 ou supérieur) installé et en cours d'exécution

### 1. Cloner et installer les dépendances
```bash
git clone https://github.com/Fihaonantsoa/back_teck_mob
cd back_teck_mob
npm install


backend-gestion-notes/
├── .env
├── .gitignore
├── package.json
├── prisma/
│   └── schema.prisma          # (Le schéma complet de notre précédente conception)
├── src/
|    │   index.js
|    │
|    ├───controllers
|    │       auth.controller.js
|    │       classe.controller.js
|    │       eleve.controller.js
|    │       enseignement.controller.js
|    │       evaluation.controller.js
|    │       matiere.controller.js
|    │       note.controller.js
|    │       utilisateur.controller.js
|    │
|    ├───middlewares
|    │       auth.middleware.js
|    │       error.middleware.js
|    │
|    ├───routes
|    │       auth.routes.js
|    │       classe.routes.js
|    │       eleve.routes.js
|    │       enseignement.routes.js
|    │       evaluation.routes.js
|    │       index.js
|    │       matiere.routes.js
|    │       note.routes.js
|    │       utilisateur.routes.js
|    │
|    └───utils
|        prisma.js
└── README.md                  # Guide complet
```

# initialisation de la base de données
npx prisma migrate dev --name init
npx prisma generate
npm run seed