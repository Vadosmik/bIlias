import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { findUserByEmail } from '../model/userModel.js';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthService {
  public login(input: LoginInput): LoginResult {
    const parsed = loginSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error('Niepoprawne dane logowania');
    }

    const user = findUserByEmail(parsed.data.email);

    if (!user || user.password !== parsed.data.password) {
      throw new Error('Nieprawidlowy email lub haslo');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('Brak JWT_SECRET w zmiennych srodowiskowych');
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '1h' },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}