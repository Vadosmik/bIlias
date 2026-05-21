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
  };
}

export class AuthService {
  public async register(input: RegisterInput): Promise<AuthResult> {
    const parsed = registerSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error('Niepoprawne dane rejestracji: ' + parsed.error.issues.map((e: any) => e.message).join(', '));
    }

    const { email, role } = parsed.data;

    if ((role === 'wykladowca' || role === 'teacher') && !email.endsWith('@umg.edu.pl')) {
      throw new Error('Wykładowca musi posiadać adres w domenie @umg.edu.pl');
    }

    if ((role === 'student') && !email.endsWith('@student.umg.edu.pl')) {
      throw new Error('Student musi posiadać adres w domenie @student.umg.edu.pl');
    }

    const existingUser = await userRepository.findByEmail(parsed.data.email);
    if (existingUser) {
      throw new Error('Uzytkownik o tym adresie email juz istnieje');
    }

    const normalizedRole = (role === 'wykladowca') ? 'teacher' : (role || 'student');

    const createInput: CreateUserInput = {
      email: parsed.data.email,
      password: parsed.data.password,
      imie: parsed.data.imie,
      nazwisko: parsed.data.nazwisko,
      role: parsed.data.role,
    };

    const user = await userRepository.create(createInput);

    console.log('Register - created user:', user.id, 'role input:', parsed.data.role);

    const userRoles = await userRepository.getUserRoles(user.id);
    console.log('User roles:', userRoles);
    const userRole = userRoles[0]?.role || normalizedRole || 'student';

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
        role: parsed.data.role || 'student',
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
        role: user.role,
      },
    };
    }
    }