import bcrypt from 'bcrypt';
import pool from '../db/index.js';

export interface User {
  id: number;
  email: string;
  hash_hasla: string;
  imie: string;
  nazwisko: string;
  organizacja_id: number | null;
  aktywny: boolean;
  utworzono: Date;
}

export interface UserRole {
  role: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  imie: string;
  nazwisko: string;
  organizacja_id?: number;
  role?: string;
}

export const userRepository = {
  async findByEmail(email: string): Promise<(User & { role: string }) | null> {
    const result = await pool.query(
      `SELECT u.*, r.nazwa as role 
       FROM uzytkownicy u 
       LEFT JOIN uzytkownik_role ur ON u.id = ur.user_id 
       LEFT JOIN public.role r ON ur.role_id = r.id
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] || null;
  },

  async findById(id: number): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM uzytkownicy WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  },

  async create(input: CreateUserInput): Promise<User> {
    const hash = await bcrypt.hash(input.password, 10);
    const result = await pool.query(
      `INSERT INTO uzytkownicy (email, hash_hasla, imie, nazwisko, organizacja_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.email, hash, input.imie, input.nazwisko, input.organizacja_id || null]
    );
    return result.rows[0];
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.hash_hasla);
  },

  async getUserRoles(userId: number): Promise<{ role: string }[]> {
    const result = await pool.query(
      `SELECT r.nazwa as role
       FROM uzytkownik_role ur
       JOIN role r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return result.rows;
  },
};