// api/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from '../src/routes/index.js';
import { errorHandler } from '../src/middlewares/error.middleware.js';
import prisma from '../src/utils/prisma.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1', routes);
app.use(errorHandler);

// Vercel nécessite que l'export soit une fonction qui reçoit (req, res)
export default app;