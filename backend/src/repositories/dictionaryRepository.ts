import pool from '../db/index.js';

export const dictionaryRepository = {
  async getDepartments() {
    const result = await pool.query('SELECT id, nazwa, skrot FROM wydzialy ORDER BY nazwa');
    return result.rows;
  },

  async getCoursesByDepartment(departmentId: number) {
    const result = await pool.query(
      'SELECT id, nazwa, stopien_studiow, tryb FROM kierunki WHERE wydzial_id = $1 ORDER BY nazwa',
      [departmentId]
    );
    return result.rows;
  },

  async getSpecializationsByCourse(courseId: number) {
    const result = await pool.query(
      'SELECT id, nazwa FROM specjalizacje WHERE kierunek_id = $1 ORDER BY nazwa',
      [courseId]
    );
    return result.rows;
  },

  async getRooms() {
    const result = await pool.query('SELECT id, budynek, numer, pojemnosc FROM sale ORDER BY budynek, numer');
    return result.rows;
  },

  async getInstructors() {
    const result = await pool.query(
      `SELECT p.prowadzacy_id as id, u.imie, u.nazwisko, u.email 
       FROM prowadzacy p
       JOIN uzytkownicy u ON p.prowadzacy_id = u.id
       ORDER BY u.nazwisko, u.imie`
    );
    return result.rows;
  }
};
