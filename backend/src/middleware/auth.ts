import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Brak tokenu autoryzacyjnego' });
    return;
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ success: false, error: 'Brak konfiguracji JWT' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & {
      sub?: number;
      email?: string;
      role?: string;
    };

    req.user = {
      id: decoded.sub ?? 0,
      email: decoded.email ?? '',
      role: decoded.role ?? '',
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Nieprawidłowy lub wygasły token' });
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Brak autoryzacji' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Brak uprawnień do wykonania tej operacji',
      });
      return;
    }
    next();
  };
}