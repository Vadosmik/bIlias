import pool from '../db/index.js';

export const submissionRepository = {
  async findFilesBySubmissionId(submissionId: number): Promise<{id: number, path: string, name: string}[]> {
    const result = await pool.query(
      `SELECT id, sciezka_pliku, oryginalna_nazwa 
       FROM przeslanie_wersje 
       WHERE przeslanie_id = $1 
       AND wersja = (SELECT current_version FROM przeslania WHERE id = $1)`,
      [submissionId]
    );
    return result.rows.map(row => ({
      id: row.id,
      path: row.sciezka_pliku,
      name: row.oryginalna_nazwa
    }));
  },

  async findByStudentAndTask(studentId: number, zadanieId: number) {
    const result = await pool.query(
      'SELECT * FROM przeslania WHERE student_id = $1 AND zadanie_id = $2',
      [studentId, zadanieId]
    );
    return result.rows[0] || null;
  },

  async findAllByTaskId(taskId: number) {
    const result = await pool.query(
      `SELECT p.id, p.przeslano as date, u.imie || ' ' || u.nazwisko as student, p.student_id
       FROM przeslania p
       JOIN uzytkownicy u ON p.student_id = u.id
       WHERE p.zadanie_id = $1
       ORDER BY p.przeslano DESC`,
      [taskId]
    );
    return result.rows;
  },

  async createSubmission(studentId: number, zadanieId: number) {
    const result = await pool.query(
      `INSERT INTO przeslania (student_id, zadanie_id, current_version, status_id, przeslano)
       VALUES ($1, $2, 1, 1, NOW())
       RETURNING *`,
      [studentId, zadanieId]
    );
    return result.rows[0];
  },

  async incrementVersion(submissionId: number) {
    const result = await pool.query(
      `UPDATE przeslania 
       SET current_version = current_version + 1, przeslano = NOW()
       WHERE id = $1
       RETURNING current_version`,
      [submissionId]
    );
    return result.rows[0].current_version;
  },

  async addFileToVersion(submissionId: number, filePath: string, originalName: string, version: number) {
    await pool.query(
      `INSERT INTO przeslanie_wersje (przeslanie_id, sciezka_pliku, oryginalna_nazwa, wersja, utworzono)
       VALUES ($1, $2, $3, $4, NOW())`,
      [submissionId, filePath, originalName, version]
    );
  },

  async copyFilesToNewVersion(submissionId: number, oldVersion: number, newVersion: number) {
    await pool.query(
      `INSERT INTO przeslanie_wersje (przeslanie_id, sciezka_pliku, oryginalna_nazwa, wersja, utworzono)
       SELECT przeslanie_id, sciezka_pliku, oryginalna_nazwa, $3, NOW()
       FROM przeslanie_wersje
       WHERE przeslanie_id = $1 AND wersja = $2`,
      [submissionId, oldVersion, newVersion]
    );
  },

  async findFileVersionById(fileId: number) {
    const result = await pool.query(
      'SELECT * FROM przeslanie_wersje WHERE id = $1',
      [fileId]
    );
    return result.rows[0] || null;
  },

  async deleteFileVersion(fileId: number) {
    await pool.query('DELETE FROM przeslanie_wersje WHERE id = $1', [fileId]);
  }
};
