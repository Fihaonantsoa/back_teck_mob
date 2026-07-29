// api/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from '../src/routes/index.js';
import { errorHandler } from '../src/middlewares/error.middleware.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes (préfixées par /api/v1)
app.use('/api/v1', routes);

// Health check simple (pour tester)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API fonctionnelle sur Vercel' });
});

// Gestion d'erreurs
app.use(errorHandler);

// Export pour Vercel (ne pas appeler listen)
export default app;