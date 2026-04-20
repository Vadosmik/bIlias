import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import 'dotenv/config';

const app = express();
const port = Number(process.env.PORT);

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Aplikacja dziala' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Błąd serwera',
  });
});

app.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});

export { app };
