import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../db/index.js';
import { userRepository, type CreateUserInput } from '../repositories/userRepository.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  imie: z.string().min(1),
  nazwisko: z.string().min(1),
  role: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface RegisterInput {
  email: string;
  password: string;
  imie: string;
  nazwisko: string;
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: number;
    email: string;
    imie: string;
    nazwisko: string;
    role: string;
    organizacja_id: number | null;
  };
}

export class AuthService {
  public async register(input: RegisterInput): Promise<AuthResult> {
    const parsed = registerSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error('Niepoprawne dane rejestracji: ' + parsed.error.errors.map(e => e.message).join(', '));
    }

    const existingUser = await userRepository.findByEmail(parsed.data.email);
    if (existingUser) {
      throw new Error('Uzytkownik o tym adresie email juz istnieje');
    }

    const createInput: CreateUserInput = {
      email: parsed.data.email,
      password: parsed.data.password,
      imie: parsed.data.imie,
      nazwisko: parsed.data.nazwisko,
      role: parsed.data.role,
    };

    const user = await userRepository.create(createInput);

    console.log('Register - created user:', user.id, 'role input:', parsed.data.role);

    if (parsed.data.role) {
      const roleQuery = await pool.query('SELECT id FROM role WHERE nazwa = $1', [parsed.data.role]);
      console.log('Role query result:', roleQuery.rows);
      if (roleQuery.rows.length > 0) {
        const insertResult = await pool.query(
          'INSERT INTO uzytkownik_role (user_id, role_id) VALUES ($1, $2)',
          [user.id, roleQuery.rows[0].id]
        );
        console.log('Insert result:', insertResult.rows);
      }
    }

    const userRoles = await userRepository.getUserRoles(user.id);
    console.log('User roles:', userRoles);
    const userRole = userRoles[0]?.role || parsed.data.role || 'student';

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
        imie: user.imie,
        nazwisko: user.nazwisko,
        role: userRole,
        organizacja_id: user.organizacja_id,
      },
    };
  }

  public async login(input: LoginInput): Promise<AuthResult> {
    const parsed = loginSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error('Niepoprawne dane logowania');
    }

    const user = await userRepository.findByEmail(parsed.data.email);

    if (!user) {
      throw new Error('Nieprawidlowy email lub haslo');
    }

    const isValid = await userRepository.verifyPassword(user, parsed.data.password);

    if (!isValid) {
      throw new Error('Nieprawidlowy email lub haslo');
    }

    if (!user.aktywny) {
      throw new Error('Konto jest nieaktywne');
    }

    const userRoles = await userRepository.getUserRoles(user.id);
    const userRole = userRoles[0]?.role || 'student';

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
        imie: user.imie,
        nazwisko: user.nazwisko,
        role: userRole,
        organizacja_id: user.organizacja_id,
      },
    };
  }
}