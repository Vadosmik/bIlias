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
    const user = result.rows[0];
    
    // Assign role if provided, default to 'student'
    const roleName = input.role || 'student';
    await pool.query(
      `INSERT INTO uzytkownik_role (user_id, role_id)
       SELECT $1, id FROM role WHERE nazwa = $2`,
      [user.id, roleName]
    );
    
    return user;
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.hash_hasla);
  },
};