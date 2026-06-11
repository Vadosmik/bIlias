import pool from '../db/index.js';
import type { Material, Zadanie, TypPliku, Folder } from '../model/materialModel.js';

export const folderRepository = {
  async findByKursId(kursId: number): Promise<Folder[]> {
    const result = await pool.query(
      'SELECT * FROM public.foldery WHERE kurs_id = $1 ORDER BY nazwa',
      [kursId]
    );
    return result.rows;
  },

  async create(data: { kurs_id: number; nazwa: string; parent_id?: number | null }): Promise<Folder> {
    const result = await pool.query(
      'INSERT INTO public.foldery (kurs_id, nazwa, parent_id) VALUES ($1, $2, $3) RETURNING *',
      [data.kurs_id, data.nazwa, data.parent_id || null]
    );
    return result.rows[0];
  },

  async update(id: number, data: { nazwa?: string; parent_id?: number | null }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nazwa !== undefined) {
      fields.push(`nazwa = $${idx++}`);
      values.push(data.nazwa);
    }
    if (data.parent_id !== undefined) {
      fields.push(`parent_id = $${idx++}`);
      values.push(data.parent_id);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.query(
      `UPDATE public.foldery SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
  },

  async delete(id: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete tasks in this folder
      await client.query('DELETE FROM public.zadania WHERE folder_id = $1', [id]);
      
      // Soft delete materials in this folder
      await client.query('UPDATE public.materialy SET deleted_at = NOW() WHERE folder_id = $1', [id]);
      
      // Delete the folder itself
      await client.query('DELETE FROM public.foldery WHERE id = $1', [id]);
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};

export const materialRepository = {
  async findByKursId(kursId: number): Promise<Material[]> {
    const result = await pool.query(
      `SELECT m.*, tp.nazwa as typ_nazwa
       FROM public.materialy m
       LEFT JOIN public.typ_pliku_slownik tp ON m.typ_pliku_id = tp.id
       WHERE m.kurs_id = $1 AND m.deleted_at IS NULL
       ORDER BY m.utworzono`,
      [kursId]
    );
    return result.rows;
  },

  async findByMaterialId(id: number): Promise<Material | null> {
    const result = await pool.query(
      'SELECT * FROM public.materialy WHERE id = $1 AND deleted_at IS NULL',
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
    folderId?: number | null;
  }): Promise<Material> {
    const result = await pool.query(
      `INSERT INTO public.materialy (kurs_id, tytul, sciezka_pliku, typ_pliku_id, rozmiar, mime_type, folder_id, utworzono, wersja)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 1)
       RETURNING *`,
      [data.kursId, data.tytul, data.sciezkaPliku, data.typPlikuId, data.rozmiar, data.mimeType, data.folderId || null]
    );
    return result.rows[0];
  },

  async updateMaterial(id: number, data: { tytul?: string, folder_id?: number | null }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.tytul !== undefined) {
      fields.push(`tytul = $${idx++}`);
      values.push(data.tytul);
    }
    if (data.folder_id !== undefined) {
      fields.push(`folder_id = $${idx++}`);
      values.push(data.folder_id);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.query(
      `UPDATE public.materialy SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
  },

  async deleteMaterial(id: number): Promise<void> {
    await pool.query('UPDATE public.materialy SET deleted_at = NOW() WHERE id = $1', [id]);
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
      'SELECT * FROM public.typ_pliku_slownik WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async getAllTypPliku(): Promise<TypPliku[]> {
    const result = await pool.query('SELECT * FROM public.typ_pliku_slownik ORDER BY nazwa');
    return result.rows;
  },
};

export const zadanieRepository = {
  async findByKursId(kursId: number): Promise<Zadanie[]> {
    const result = await pool.query(
      `SELECT * FROM public.zadania
       WHERE kurs_id = $1
       ORDER BY termin_oddania`,
      [kursId]
    );
    return result.rows;
  },

  async findById(id: number): Promise<Zadanie | null> {
    const result = await pool.query(
      'SELECT * FROM public.zadania WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async updateTask(id: number, data: { tytul?: string, opis?: string, terminOddania?: string, folder_id?: number | null }): Promise<void> {
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
    if (data.folder_id !== undefined) {
      fields.push(`folder_id = $${idx++}`);
      values.push(data.folder_id);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.query(
      `UPDATE public.zadania SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
  },

  async deleteTask(id: number): Promise<void> {
    await pool.query('DELETE FROM public.zadania WHERE id = $1', [id]);
  },

  async createTask(data: {
    kursId: number;
    tytul: string;
    opis: string;
    terminOddania: string;
    folderId?: number | null;
  }): Promise<Zadanie> {
    const result = await pool.query(
      `INSERT INTO public.zadania (kurs_id, tytul, opis, termin_oddania, max_punkty, status_id, folder_id, utworzono)
       VALUES ($1, $2, $3, $4, 0, 1, $5, NOW())
       RETURNING *`,
      [data.kursId, data.tytul, data.opis, data.terminOddania, data.folderId || null]
    );
    return result.rows[0];
  },

  async findStatusZadaniaById(id: number): Promise<{ id: number; nazwa: string } | null> {
    const result = await pool.query(
      'SELECT * FROM public.status_zadania_slownik WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async getAllStatusZadania(): Promise<{ id: number; nazwa: string }[]> {
    const result = await pool.query('SELECT * FROM public.status_zadania_slownik ORDER BY nazwa');
    return result.rows;
  },
};
