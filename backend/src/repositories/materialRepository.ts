import pool from '../db/index.js';
import type { Material, Zadanie, TypPliku } from '../model/materialModel.js';
import type { MaterialDTO } from '../services/courseService.js';

export const materialRepository = {
  async findByKursId(kursId: number): Promise<Material[]> {
    const result = await pool.query(
      `SELECT m.*, tp.nazwa as typ_nazwa
       FROM materialy m
       LEFT JOIN typ_pliku_slownik tp ON m.typ_pliku_id = tp.id
       WHERE m.kurs_id = $1
       ORDER BY m.utworzono`,
      [kursId]
    );
    return result.rows;
  },

  async findByMaterialId(id: number): Promise<Material | null> {
    const result = await pool.query(
      'SELECT * FROM materialy WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  },

  async createMaterial(data: {
    kursId: number;
    tytul: string;
    sciezkaPliku: string;
    typPlikuId: number;
    rozmiar: number;
    mimeType: string;
  }): Promise<Material> {
    const result = await pool.query(
      `INSERT INTO materialy (kurs_id, tytul, sciezka_pliku, typ_pliku_id, rozmiar, mime_type, utworzono, wersja)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), 1)
       RETURNING *`,
      [data.kursId, data.tytul, data.sciezkaPliku, data.typPlikuId, data.rozmiar, data.mimeType]
    );
    return result.rows[0];
  },

  async getByCourseId(kursId: number): Promise<MaterialDTO[]> {
    const materials = await this.findByKursId(kursId);
    const zadania = await zadanieRepository.findByKursId(kursId);

    const folders: Map<string, MaterialDTO> = new Map();
    const rootItems: MaterialDTO[] = [];
    const fileTypeMap: Record<string, string> = {
      'pdf': 'pdf', 'doc': 'doc', 'docx': 'doc', 'xls': 'xls', 'xlsx': 'xlsx',
      'zip': 'zip', 'rar': 'rar', 'txt': 'txt', 'sql': 'sql', 'sh': 'sh',
    };

    for (const mat of materials) {
      const format = mat.typ_nazwa?.toLowerCase() || 'file';
      const parts = mat.tytul.split(' - ');
      const isFolder = parts.length > 1;

      if (isFolder) {
        const folderName = parts[0];
        const fileName = parts.slice(1).join(' - ');
        const ext = fileName.split('.').pop()?.toLowerCase() || '';

        let folder = folders.get(folderName);
        if (!folder) {
          folder = {
            id: Date.now() + Math.random(),
            type: 'folder',
            name: folderName,
            children: [],
          };
          folders.set(folderName, folder);
          rootItems.push(folder);
        }

        folder.children!.push({
          id: mat.id,
          type: 'file',
          name: fileName,
          format: fileTypeMap[ext] || ext,
          size: mat.rozmiar ? `${(mat.rozmiar / 1024).toFixed(1)} KB` : undefined,
        });
      } else {
        const ext = mat.tytul.split('.').pop()?.toLowerCase() || '';
        rootItems.push({
          id: mat.id,
          type: 'file',
          name: mat.tytul,
          format: fileTypeMap[ext] || ext,
          size: mat.rozmiar ? `${(mat.rozmiar / 1024).toFixed(1)} KB` : undefined,
        });
      }
    }

    for (const zad of zadania) {
      rootItems.push({
        id: zad.id,
        type: 'task',
        name: zad.tytul,
        deadline: zad.termin_oddania,
        description: zad.opis,
      });
    }

    return rootItems;
  },

  async updateMaterial(id: number, data: { tytul?: string }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.tytul !== undefined) {
      fields.push(`tytul = $${idx++}`);
      values.push(data.tytul);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.query(
      `UPDATE materialy SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
  },

  async deleteMaterial(id: number): Promise<void> {
    await pool.query('UPDATE materialy SET deleted_at = NOW() WHERE id = $1', [id]);
  },

  async deleteByFolderPrefix(kursId: number, folderPrefix: string): Promise<void> {
    await pool.query(
      `UPDATE materialy SET deleted_at = NOW() 
       WHERE kurs_id = $1 AND (tytul = $2 OR tytul LIKE $3) AND deleted_at IS NULL`,
      [kursId, folderPrefix, `${folderPrefix} - %`]
    );
  },

  async findByKursIdAndFolderPrefix(kursId: number, folderPrefix: string): Promise<Material[]> {
    const result = await pool.query(
      `SELECT * FROM materialy 
       WHERE kurs_id = $1 AND (tytul = $2 OR tytul LIKE $3) AND deleted_at IS NULL`,
      [kursId, folderPrefix, `${folderPrefix} - %`]
    );
    return result.rows;
  },

  async findTypPlikuById(id: number): Promise<TypPliku | null> {
    const result = await pool.query(
      'SELECT * FROM typ_pliku_slownik WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async getAllTypPliku(): Promise<TypPliku[]> {
    const result = await pool.query('SELECT * FROM typ_pliku_slownik ORDER BY nazwa');
    return result.rows;
  },
};

export const zadanieRepository = {
  async findByKursId(kursId: number): Promise<Zadanie[]> {
    const result = await pool.query(
      `SELECT * FROM zadania
       WHERE kurs_id = $1
       ORDER BY termin_oddania`,
      [kursId]
    );
    return result.rows;
  },

  async findById(id: number): Promise<Zadanie | null> {
    const result = await pool.query(
      'SELECT * FROM zadania WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async updateTask(id: number, data: { tytul?: string, opis?: string, terminOddania?: string }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.tytul !== undefined) {
      fields.push(`tytul = $${idx++}`);
      values.push(data.tytul);
    }
    if (data.opis !== undefined) {
      fields.push(`opis = $${idx++}`);
      values.push(data.opis);
    }
    if (data.terminOddania !== undefined) {
      fields.push(`termin_oddania = $${idx++}`);
      values.push(data.terminOddania);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.query(
      `UPDATE zadania SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
  },

  async deleteTask(id: number): Promise<void> {
    await pool.query('DELETE FROM zadania WHERE id = $1', [id]);
  },

  async deleteByFolderPrefix(kursId: number, folderPrefix: string): Promise<void> {
    await pool.query(
      `DELETE FROM zadania 
       WHERE kurs_id = $1 AND (tytul = $2 OR tytul LIKE $3)`,
      [kursId, folderPrefix, `${folderPrefix} - %`]
    );
  },

  async createTask(data: {
    kursId: number;
    tytul: string;
    opis: string;
    terminOddania: string;
  }): Promise<Zadanie> {
    const result = await pool.query(
      `INSERT INTO zadania (kurs_id, tytul, opis, termin_oddania, max_punkty, status_id, utworzono)
       VALUES ($1, $2, $3, $4, 0, 1, NOW())
       RETURNING *`,
      [data.kursId, data.tytul, data.opis, data.terminOddania]
    );
    return result.rows[0];
  },

  async findStatusZadaniaById(id: number): Promise<{ id: number; nazwa: string } | null> {
    const result = await pool.query(
      'SELECT * FROM status_zadania_slownik WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async getAllStatusZadania(): Promise<{ id: number; nazwa: string }[]> {
    const result = await pool.query('SELECT * FROM status_zadania_slownik ORDER BY nazwa');
    return result.rows;
  },
};