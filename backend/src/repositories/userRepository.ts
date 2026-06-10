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

  async updatePassword(userId: number, newPasswordHash: string): Promise<void> {
    await pool.query(
      `UPDATE uzytkownicy SET hash_hasla = $1, zaktualizowano = NOW()
       WHERE id = $2`,
      [newPasswordHash, userId]
    );
  },

  async getStudentData(userId: number): Promise<{
    wydzial_id: number;
    kierunek_id: number;
    specjalizacja_id: number | null;
  } | null> {
    const result = await pool.query(
      `SELECT wydzial_id, kierunek_id, specjalizacja_id
       FROM studenci WHERE student_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  async getLecturerData(userId: number): Promise<{
    wydzial_id: number;
  } | null> {
    const result = await pool.query(
      `SELECT wydzial_id FROM prowadzacy WHERE prowadzacy_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  async updateStudentProfile(
    userId: number,
    data: { wydzial_id?: number; kierunek_id?: number; specjalizacja_id?: number | null }
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.wydzial_id !== undefined) {
      fields.push(`wydzial_id = $${paramIndex++}`);
      values.push(data.wydzial_id);
    }
    if (data.kierunek_id !== undefined) {
      fields.push(`kierunek_id = $${paramIndex++}`);
      values.push(data.kierunek_id);
    }
    if (data.specjalizacja_id !== undefined) {
      fields.push(`specjalizacja_id = $${paramIndex++}`);
      values.push(data.specjalizacja_id);
    }

    if (fields.length === 0) return;

    values.push(userId);
    await pool.query(
      `UPDATE studenci SET ${fields.join(', ')} WHERE student_id = $${paramIndex}`,
      values
    );
  },

  async updateLecturerProfile(
    userId: number,
    data: { wydzial_id: number }
  ): Promise<void> {
    await pool.query(
      `UPDATE prowadzacy SET wydzial_id = $1 WHERE prowadzacy_id = $2`,
      [data.wydzial_id, userId]
    );
  },

  async updateDashboardSettings(userId: number, settings: string): Promise<void> {
    await pool.query(
      `UPDATE uzytkownicy SET ustawienia_dashboard = $1::bit varying, zaktualizowano = NOW()
       WHERE id = $2`,
      [settings, userId]
    );
  },

  async getProfileCompleteness(userId: number): Promise<{ complete: boolean; missing: string[] }> {
    const roles = await this.getUserRoles(userId);
    const roleName = roles[0]?.role || 'student';

    const missing: string[] = [];

    if (roleName === 'student') {
      const student = await this.getStudentData(userId);
      if (!student) {
        missing.push('dane studenta');
      } else {
        if (!student.wydzial_id) missing.push('wydział');
        if (!student.kierunek_id) missing.push('kierunek');
      }
    } else if (roleName === 'prowadzacy' || roleName === 'teacher') {
      const lecturer = await this.getLecturerData(userId);
      if (!lecturer) {
        missing.push('dane prowadzącego');
      } else if (!lecturer.wydzial_id) {
        missing.push('wydział');
      }
    }

    return { complete: missing.length === 0, missing };
  },

  async getFullProfile(userId: number) {
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.imie, u.nazwisko, r.nazwa as role, u.ustawienia_dashboard::text
       FROM uzytkownicy u
       LEFT JOIN uzytkownik_role ur ON u.id = ur.user_id
       LEFT JOIN role r ON ur.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return null;
    const user = userResult.rows[0];

    let academicData = null;
    if (user.role === 'student') {
      const studentResult = await pool.query(
        `SELECT s.wydzial_id, s.kierunek_id, s.specjalizacja_id, s.numer_albumu,
                w.nazwa as wydzial_nazwa, k.nazwa as kierunek_nazwa, sp.nazwa as specjalizacja_nazwa
         FROM studenci s
         LEFT JOIN wydzialy w ON s.wydzial_id = w.id
         LEFT JOIN kierunki k ON s.kierunek_id = k.id
         LEFT JOIN specjalizacje sp ON s.specjalizacja_id = sp.id
         WHERE s.student_id = $1`,
        [userId]
      );
      academicData = studentResult.rows[0] || null;
    } else if (user.role === 'prowadzacy') {
      const lecturerResult = await pool.query(
        `SELECT p.wydzial_id, w.nazwa as wydzial_nazwa
         FROM prowadzacy p
         LEFT JOIN wydzialy w ON p.wydzial_id = w.id
         WHERE p.prowadzacy_id = $1`,
        [userId]
      );
      academicData = lecturerResult.rows[0] || null;
    }

    return {
      ...user,
      academic: academicData
    };
  },
};