import { Router, type Request, type Response } from 'express';
import { AuthController } from '../controllers/authController.js';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/login', (req: Request, res: Response) => {
  authController.login(req, res);
});

export { authRoutes };
