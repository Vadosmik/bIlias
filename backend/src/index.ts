import express, { type Request, type Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { courseRoutes } from './routes/courseRoutes.js';
import { materialRoutes } from './routes/materialRoutes.js';
import { submissionRoutes } from './routes/submissionRoutes.js';
import { profileRoutes } from './routes/profileRoutes.js';
import { timetableRoutes } from './routes/timetableRoutes.js';
import { dictionaryRoutes } from './routes/dictionaryRoutes.js';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT || 8080);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Aplikacja dziala!' });
});

// Endpointy
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/submissions', submissionRoutes);
app.use('/', materialRoutes);
app.use('/', profileRoutes);
app.use('/timetable', timetableRoutes);
app.use('/dictionaries', dictionaryRoutes);
app.use('/uploads', express.static('uploads'));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});

export { app };
