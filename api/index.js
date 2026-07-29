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

app.use('/api/v1', routes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API fonctionnelle sur Vercel' });
});

app.use(errorHandler);

export default app;