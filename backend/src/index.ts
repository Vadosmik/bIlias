import express, { type Request, type Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { courseRoutes } from './routes/courseRoutes.js';
import { materialRoutes } from './routes/materialRoutes.js';
import { submissionRoutes } from './routes/submissionRoutes.js';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT || 8080);

app.use(cors());
app.use(cors()); 
app.use(express.json());

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Aplikacja dziala!' });
});

// Endpoint do testowania logowania
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/submissions', submissionRoutes);
app.use('/', materialRoutes);
app.use('/uploads', express.static('uploads'));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});

export { app };
