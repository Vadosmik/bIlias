import { type Request, type Response } from 'express';
import { AuthService } from '../services/authService.js';

const authService = new AuthService();

export class AuthController {
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login({
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

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register({
        email: String(req.body?.email ?? ''),
        password: String(req.body?.password ?? ''),
        imie: String(req.body?.imie ?? ''),
        nazwisko: String(req.body?.nazwisko ?? ''),
        role: req.body?.role ? String(req.body.role) : undefined,
        wydzialId: req.body?.wydzialId ? Number(req.body.wydzialId) : undefined,
        kierunekId: req.body?.kierunekId ? Number(req.body.kierunekId) : undefined,
        specjalizacjaId: req.body?.specjalizacjaId ? Number(req.body.specjalizacjaId) : undefined,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad rejestracji';

      res.status(400).json({
        success: false,
        error: message,
      });
    }
  }
}