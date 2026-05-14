import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import pool from '../db/index.js';
import { submissionRepository } from '../repositories/submissionRepository.js';

export class SubmissionService {
  public async submitTask(params: {
    studentId: number;
    zadanieId: number;
    files: Express.Multer.File[];
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Use the transaction client to check for existing submission
      const subRes = await client.query(
        'SELECT * FROM przeslania WHERE student_id = $1 AND zadanie_id = $2 FOR UPDATE',
        [params.studentId, params.zadanieId]
      );
      let submission = subRes.rows[0];
      let version = 1;

      if (!submission) {
        const newSubRes = await client.query(
          `INSERT INTO przeslania (student_id, zadanie_id, current_version, status_id, przeslano)
           VALUES ($1, $2, 1, 1, NOW())
           RETURNING *`,
          [params.studentId, params.zadanieId]
        );
        submission = newSubRes.rows[0];
      } else {
        const oldVersion = submission.current_version;
        const versionRes = await client.query(
          `UPDATE przeslania 
           SET current_version = current_version + 1, przeslano = NOW()
           WHERE id = $1
           RETURNING current_version`,
          [submission.id]
        );
        version = versionRes.rows[0].current_version;

        // Copy files from previous version to the new one
        await client.query(
          `INSERT INTO przeslanie_wersje (przeslanie_id, sciezka_pliku, oryginalna_nazwa, wersja, utworzono)
           SELECT przeslanie_id, sciezka_pliku, oryginalna_nazwa, $3, NOW()
           FROM przeslanie_wersje
           WHERE przeslanie_id = $1 AND wersja = $2`,
          [submission.id, oldVersion, version]
        );
      }

      // Add all new files to the NEW version
      for (const file of params.files) {
        await client.query(
          `INSERT INTO przeslanie_wersje (przeslanie_id, sciezka_pliku, oryginalna_nazwa, wersja, utworzono)
           VALUES ($1, $2, $3, $4, NOW())`,
          [submission.id, file.path, file.originalname, version]
        );
      }

      await client.query('COMMIT');
      return {
        submissionId: submission.id,
        version
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Submission transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async deleteFile(fileId: number) {
    const file = await submissionRepository.findFileVersionById(fileId);
    if (!file) throw new Error('Plik nie istnieje');

    // Delete record
    await submissionRepository.deleteFileVersion(fileId);

    // Optional: Delete physical file if no other record uses it
    // For now we keep it to be safe (could be used in older versions)
    
    return true;
  }

  public async generateSubmissionZip(submissionId: number): Promise<Buffer> {
    const zip = new AdmZip();

    // Try to find real files in DB
    const files = await submissionRepository.findFilesBySubmissionId(submissionId);

    if (files.length > 0) {
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          zip.addLocalFile(file.path, undefined, file.name);
        }
      }
    } else {
      // Mock fallback for demonstration (since we use mock IDs 1, 2, 3 in frontend for now)
      // This allows the teacher to see that the ZIP download works
      zip.addFile("readme.txt", Buffer.from("To jest przykładowy plik z nadesłanego zadania (Mock).", "utf8"));
      zip.addFile("rozwiazanie.txt", Buffer.from("Treść rozwiązania studenta...", "utf8"));
    }

    return zip.toBuffer();
  }
}
