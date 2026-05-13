import express, { type Request, type Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { courseRoutes } from './routes/courseRoutes.js';
import { materialRoutes } from './routes/materialRoutes.js';

const app = express();
const PORT = Number(process.env.PORT || 8080);

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Aplikacja dziala!' });
});

app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/courses', materialRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});

export { app };
