import { type Request, type Response } from 'express';
import { AuthService } from '../services/authService.js';

const authService = new AuthService();

export class AuthController {
  public login(req: Request, res: Response): void {
    try {
      const result = authService.login({
        email: String(req.body?.email ?? ''),
        password: String(req.body?.password ?? ''),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad logowania';

      res.status(401).json({
        success: false,
        error: message,
      });
    }
  }
}
