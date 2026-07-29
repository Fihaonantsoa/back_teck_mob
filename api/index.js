// api/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '../src/middlewares/error.middleware.js';
import routes from '../src/routes/index.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/v1', routes);

// Route racine : page de description
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Gestion des Notes de Lycée</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: #f9f9f9;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
          }
          .endpoint {
            background: #ecf0f1;
            padding: 8px 15px;
            border-radius: 5px;
            font-family: monospace;
            display: inline-block;
            margin: 5px 0;
          }
          a {
            color: #3498db;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .footer {
            margin-top: 40px;
            font-size: 0.9em;
            color: #7f8c8d;
          }
        </style>
      </head>
      <body>
        <h1>📚 API Gestion des Notes de Lycée</h1>
        <p>Bienvenue sur l'API de gestion des notes, des élèves, des professeurs et des classes.</p>
        <p>Cette API est utilisée par l'application mobile et le tableau de bord administrateur.</p>

        <h2>🔗 Liens utiles</h2>
        <ul>
          <li><span class="endpoint">GET /api/health</span> — <a href="/api/health">Vérifier l'état du service</a></li>
          <li><span class="endpoint">POST /api/v1/auth/login</span> — Se connecter et obtenir un token JWT</li>
          <li><span class="endpoint">GET /api/v1/classes</span> — Liste des classes (authentification requise)</li>
          <li><span class="endpoint">GET /api/v1/eleves</span> — Liste des élèves (authentification requise)</li>
          <li><span class="endpoint">POST /api/v1/notes</span> — Saisir une note (professeur / admin)</li>
        </ul>

        <h2>📖 Documentation complète</h2>
        <p>Consultez le dépôt GitHub pour la documentation détaillée des endpoints et des modèles de données.</p>

        <div class="footer">
          <p>API développée dans le cadre du projet de Gestion des Notes de Lycée — © 2025</p>
        </div>
      </body>
    </html>
  `);
});

// Health check (pour les tests)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API fonctionnelle sur Vercel' });
});

// Gestion des erreurs (toujours en dernier)
app.use(errorHandler);

export default app;