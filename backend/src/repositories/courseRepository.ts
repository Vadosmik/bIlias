import pool from '../db/index.js';
import type { Course, CourseEnrollment } from '../model/courseModel.js';

export const courseRepository = {
  async findAll(organizacjaId?: number): Promise<Course[]> {
    let query = 'SELECT * FROM kursy';
    const params: (number | string)[] = [];

    if (organizacjaId) {
      query += ' WHERE organizacja_id = $1';
      params.push(organizacjaId);
    }

    query += ' ORDER BY semestr, nazwa';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id: number): Promise<Course | null> {
    const result = await pool.query(
      'SELECT * FROM kursy WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findUserCourses(userId: number, organizacjaId?: number): Promise<Course[]> {
    let query = `
      SELECT k.* FROM kursy k
      JOIN zapisy z ON k.id = z.kurs_id
      WHERE z.student_id = $1
    `;
    const params: (number | string)[] = [userId];

    if (organizacjaId) {
      query += ' AND k.organizacja_id = $2';
      params.push(organizacjaId);
    }

    query += ' ORDER BY k.semestr, k.nazwa';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async isUserEnrolled(kursId: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM zapisy WHERE kurs_id = $1 AND student_id = $2',
      [kursId, userId]
    );
    return result.rows.length > 0;
  },

  async enrollStudent(kursId: number, studentId: number, statusId: number = 1): Promise<CourseEnrollment> {
    const result = await pool.query(
      `INSERT INTO zapisy (kurs_id, student_id, status_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [kursId, studentId, statusId]
    );
    return result.rows[0];
  },

  async getCourseLecturers(kursId: number): Promise<string[]> {
    const result = await pool.query(
      `SELECT u.imie, u.nazwisko
       FROM kurs_role kr
       JOIN uzytkownicy u ON kr.user_id = u.id
       WHERE kr.kurs_id = $1 AND u.deleted_at IS NULL`,
      [kursId]
    );
    return result.rows.map(r => `${r.imie} ${r.nazwisko}`);
  },
};