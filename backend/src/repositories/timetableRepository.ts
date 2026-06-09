import pool from '../db/index.js';
import type {
  TimetableEntry,
  TimetableEntryWithDetails,
  TimetableGrid,
  TimetableSearchParams,
  CreateTimetableInput,
  UpdateTimetableInput,
} from '../model/timetableModel.js';

export const timetableRepository = {
  async findAll(params: TimetableSearchParams): Promise<TimetableEntryWithDetails[]> {
    let query = `
      SELECT
        pz.id,
        pz.kurs_id as "kursId",
        pz.dzien_id as "dzienId",
        pz.godzina_od as "godzinaOd",
        pz.godzina_do as "godzinaDo",
        pz.sala_id as "salaId",
        pz.prowadzacy_id as "prowadzacyId",
        pz.wydzial_id as "wydzialId",
        pz.kierunek_id as "kierunekId",
        pz.specjalizacja_id as "specjalizacjaId",
        pz.grupa_oznaczenie as "grupaOznaczenie",
        pz.typ_zajec as "typZajec",
        pz.aktywny,
        pz.utworzono,
        k.id as k_id, k.nazwa as k_nazwa,
        d.id as d_id, d.nazwa as d_nazwa, 
        s.id as s_id, s.budynek as s_budynek, s.numer as s_numer,
        pr.prowadzacy_id as pr_id, pr.wydzial_id as pr_wydzial_id,
        u.imie as pr_imie, u.nazwisko as pr_nazwisko,
        w.id as w_id, w.nazwa as w_nazwa,
        ki.id as ki_id, ki.nazwa as ki_nazwa,
        sp.id as sp_id, sp.nazwa as sp_nazwa
      FROM public.plany_zajec pz
      LEFT JOIN public.kursy k ON pz.kurs_id = k.id
      LEFT JOIN public.dzien_tygodnia_slownik d ON pz.dzien_id = d.id
      LEFT JOIN public.sale s ON pz.sala_id = s.id
      LEFT JOIN public.prowadzacy pr ON pz.prowadzacy_id = pr.prowadzacy_id
      LEFT JOIN public.uzytkownicy u ON pr.prowadzacy_id = u.id
      LEFT JOIN public.wydzialy w ON pz.wydzial_id = w.id
      LEFT JOIN public.kierunki ki ON pz.kierunek_id = ki.id
      LEFT JOIN public.specjalizacje sp ON pz.specjalizacja_id = sp.id
      WHERE pz.aktywny = true
    `;
    const values: (number | string)[] = [];
    let paramCount = 0;

    if (params.wydzialId) {
      paramCount++;
      query += ` AND pz.wydzial_id = $${paramCount}`;
      values.push(params.wydzialId);
    }
    if (params.kierunekId) {
      paramCount++;
      query += ` AND pz.kierunek_id = $${paramCount}`;
      values.push(params.kierunekId);
    }
    if (params.specjalizacjaId) {
      paramCount++;
      query += ` AND pz.specjalizacja_id = $${paramCount}`;
      values.push(params.specjalizacjaId);
    }
    if (params.prowadzacyId) {
      paramCount++;
      query += ` AND pz.prowadzacy_id = $${paramCount}`;
      values.push(params.prowadzacyId);
    }
    if (params.salaId) {
      paramCount++;
      query += ` AND pz.sala_id = $${paramCount}`;
      values.push(params.salaId);
    }

    query += ' ORDER BY d.id, pz.godzina_od';

    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      id: row.id,
      kursId: row.kursId,
      dzienId: row.dzienId,
      godzinaOd: row.godzinaOd,
      godzinaDo: row.godzinaDo,
      salaId: row.salaId,
      prowadzacyId: row.prowadzacyId,
      wydzialId: row.wydzialId,
      kierunekId: row.kierunekId,
      specjalizacjaId: row.specjalizacjaId,
      grupaOznaczenie: row.grupaOznaczenie,
      typZajec: row.typZajec,
      aktywny: row.aktywny,
      utworzono: row.utworzono,
      kurs: row.k_id ? { id: row.k_id, nazwa: row.k_nazwa } : null,
      dzien: row.d_id ? { id: row.d_id, nazwa: row.d_nazwa } : null,
      sala: row.s_id ? { id: row.s_id, budynek: row.s_budynek, numer: row.s_numer } : null,
      prowadzacy: row.pr_id ? { id: row.pr_id, imie: row.pr_imie, nazwisko: row.pr_nazwisko } : null,
      wydzial: row.w_id ? { id: row.w_id, nazwa: row.w_nazwa } : null,
      kierunek: row.ki_id ? { id: row.ki_id, nazwa: row.ki_nazwa } : null,
      specjalizacja: row.sp_id ? { id: row.sp_id, nazwa: row.sp_nazwa } : null,
    }));
  },

  async findById(id: number): Promise<TimetableEntryWithDetails | null> {
    const query = `
      SELECT
        pz.id,
        pz.kurs_id as "kursId",
        pz.dzien_id as "dzienId",
        pz.godzina_od as "godzinaOd",
        pz.godzina_do as "godzinaDo",
        pz.sala_id as "salaId",
        pz.prowadzacy_id as "prowadzacyId",
        pz.wydzial_id as "wydzialId",
        pz.kierunek_id as "kierunekId",
        pz.specjalizacja_id as "specjalizacjaId",
        pz.grupa_oznaczenie as "grupaOznaczenie",
        pz.typ_zajec as "typZajec",
        pz.aktywny,
        pz.utworzono,
        k.id as k_id, k.nazwa as k_nazwa,
        d.id as d_id, d.nazwa as d_nazwa, 
        s.id as s_id, s.budynek as s_budynek, s.numer as s_numer,
        pr.prowadzacy_id as pr_id, pr.wydzial_id as pr_wydzial_id,
        u.imie as pr_imie, u.nazwisko as pr_nazwisko,
        w.id as w_id, w.nazwa as w_nazwa,
        ki.id as ki_id, ki.nazwa as ki_nazwa,
        sp.id as sp_id, sp.nazwa as sp_nazwa
      FROM public.plany_zajec pz
      LEFT JOIN public.kursy k ON pz.kurs_id = k.id
      LEFT JOIN public.dzien_tygodnia_slownik d ON pz.dzien_id = d.id
      LEFT JOIN public.sale s ON pz.sala_id = s.id
      LEFT JOIN public.prowadzacy pr ON pz.prowadzacy_id = pr.prowadzacy_id
      LEFT JOIN public.uzytkownicy u ON pr.prowadzacy_id = u.id
      LEFT JOIN public.wydzialy w ON pz.wydzial_id = w.id
      LEFT JOIN public.kierunki ki ON pz.kierunek_id = ki.id
      LEFT JOIN public.specjalizacje sp ON pz.specjalizacja_id = sp.id
      WHERE pz.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      kursId: row.kursId,
      dzienId: row.dzienId,
      godzinaOd: row.godzinaOd,
      godzinaDo: row.godzinaDo,
      salaId: row.salaId,
      prowadzacyId: row.prowadzacyId,
      wydzialId: row.wydzialId,
      kierunekId: row.kierunekId,
      specjalizacjaId: row.specjalizacjaId,
      grupaOznaczenie: row.grupaOznaczenie,
      typZajec: row.typZajec,
      aktywny: row.aktywny,
      utworzono: row.utworzono,
      kurs: row.k_id ? { id: row.k_id, nazwa: row.k_nazwa } : null,
      dzien: row.d_id ? { id: row.d_id, nazwa: row.d_nazwa } : null,
      sala: row.s_id ? { id: row.s_id, budynek: row.s_budynek, numer: row.s_numer } : null,
      prowadzacy: row.pr_id ? { id: row.pr_id, imie: row.pr_imie, nazwisko: row.pr_nazwisko } : null,
      wydzial: row.w_id ? { id: row.w_id, nazwa: row.w_nazwa } : null,
      kierunek: row.ki_id ? { id: row.ki_id, nazwa: row.ki_nazwa } : null,
      specjalizacja: row.sp_id ? { id: row.sp_id, nazwa: row.sp_nazwa } : null,
    };
  },

  async create(data: CreateTimetableInput): Promise<TimetableEntry> {
    const query = `
      INSERT INTO public.plany_zajec (
        kurs_id, dzien_id, godzina_od, godzina_do, sala_id, prowadzacy_id,
        wydzial_id, kierunek_id, specjalizacja_id, grupa_oznaczenie, typ_zajec
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        id,
        kurs_id as "kursId",
        dzien_id as "dzienId",
        godzina_od as "godzinaOd",
        godzina_do as "godzinaDo",
        sala_id as "salaId",
        prowadzacy_id as "prowadzacyId",
        wydzial_id as "wydzialId",
        kierunek_id as "kierunekId",
        specjalizacja_id as "specjalizacjaId",
        grupa_oznaczenie as "grupaOznaczenie",
        typ_zajec as "typZajec",
        aktywny,
        utworzono
    `;
    const values = [
      data.kursId,
      data.dzienId,
      data.godzinaOd,
      data.godzinaDo,
      data.salaId ?? null,
      data.prowadzacyId ?? null,
      data.wydzialId,
      data.kierunekId,
      data.specjalizacjaId ?? null,
      data.grupaOznaczenie ?? null,
      data.typZajec,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async update(id: number, data: UpdateTimetableInput): Promise<TimetableEntry | null> {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    let paramCount = 0;

    if (data.kursId !== undefined) {
      paramCount++;
      fields.push(`kurs_id = $${paramCount}`);
      values.push(data.kursId);
    }
    if (data.dzienId !== undefined) {
      paramCount++;
      fields.push(`dzien_id = $${paramCount}`);
      values.push(data.dzienId);
    }
    if (data.godzinaOd !== undefined) {
      paramCount++;
      fields.push(`godzina_od = $${paramCount}`);
      values.push(data.godzinaOd);
    }
    if (data.godzinaDo !== undefined) {
      paramCount++;
      fields.push(`godzina_do = $${paramCount}`);
      values.push(data.godzinaDo);
    }
    if (data.salaId !== undefined) {
      paramCount++;
      fields.push(`sala_id = $${paramCount}`);
      values.push(data.salaId);
    }
    if (data.prowadzacyId !== undefined) {
      paramCount++;
      fields.push(`prowadzacy_id = $${paramCount}`);
      values.push(data.prowadzacyId);
    }
    if (data.grupaOznaczenie !== undefined) {
      paramCount++;
      fields.push(`grupa_oznaczenie = $${paramCount}`);
      values.push(data.grupaOznaczenie);
    }
    if (data.typZajec !== undefined) {
      paramCount++;
      fields.push(`typ_zajec = $${paramCount}`);
      values.push(data.typZajec);
    }

    if (fields.length === 0) return this.findById(id);

    paramCount++;
    values.push(id);
    const query = `
      UPDATE public.plany_zajec
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING
        id,
        kurs_id as "kursId",
        dzien_id as "dzienId",
        godzina_od as "godzinaOd",
        godzina_do as "godzinaDo",
        sala_id as "salaId",
        prowadzacy_id as "prowadzacyId",
        wydzial_id as "wydzialId",
        kierunek_id as "kierunekId",
        specjalizacja_id as "specjalizacjaId",
        grupa_oznaczenie as "grupaOznaczenie",
        typ_zajec as "typZajec",
        aktywny,
        utworzono
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM public.plany_zajec WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getGridData(): Promise<TimetableGrid> {
    const dniQuery = `SELECT id, nazwa FROM public.dzien_tygodnia_slownik ORDER BY id`;
    const dniResult = await pool.query(dniQuery);

    const godziny: string[] = [];
    for (let h = 7; h <= 20; h++) {
      godziny.push(`${h.toString().padStart(2, '0')}:00`);
    }

    return {
      dni: dniResult.rows,
      godziny,
      typyZajec: ['wyklad', 'cwiczenia', 'laboratorium', 'projekt', 'seminarium'],
    };
  },

  async search(q: string, typ: 'student' | 'prowadzacy' | 'sala'): Promise<TimetableEntryWithDetails[]> {
    const searchPattern = `%${q}%`;
    let query: string;

    if (typ === 'prowadzacy') {
      query = `
        SELECT DISTINCT
          pz.id,
          pz.kurs_id as "kursId",
          pz.dzien_id as "dzienId",
          pz.godzina_od as "godzinaOd",
          pz.godzina_do as "godzinaDo",
          pz.sala_id as "salaId",
          pz.prowadzacy_id as "prowadzacyId",
          pz.wydzial_id as "wydzialId",
          pz.kierunek_id as "kierunekId",
          pz.specjalizacja_id as "specjalizacjaId",
          pz.grupa_oznaczenie as "grupaOznaczenie",
          pz.typ_zajec as "typZajec",
          pz.aktywny,
          pz.utworzono,
          k.id as k_id, k.nazwa as k_nazwa,
          d.id as d_id, d.nazwa as d_nazwa, 
          s.id as s_id, s.budynek as s_budynek, s.numer as s_numer,
          pr.prowadzacy_id as pr_id, u.imie as pr_imie, u.nazwisko as pr_nazwisko,
          w.id as w_id, w.nazwa as w_nazwa,
          ki.id as ki_id, ki.nazwa as ki_nazwa,
          sp.id as sp_id, sp.nazwa as sp_nazwa
        FROM public.plany_zajec pz
        LEFT JOIN public.kursy k ON pz.kurs_id = k.id
        LEFT JOIN public.dzien_tygodnia_slownik d ON pz.dzien_id = d.id
        LEFT JOIN public.sale s ON pz.sala_id = s.id
        LEFT JOIN public.prowadzacy pr ON pz.prowadzacy_id = pr.prowadzacy_id
        LEFT JOIN public.uzytkownicy u ON pr.prowadzacy_id = u.id
        LEFT JOIN public.wydzialy w ON pz.wydzial_id = w.id
        LEFT JOIN public.kierunki ki ON pz.kierunek_id = ki.id
        LEFT JOIN public.specjalizacje sp ON pz.specjalizacja_id = sp.id
        WHERE pz.aktywny = true AND (u.imie ILIKE $1 OR u.nazwisko ILIKE $1)
        ORDER BY d.id, pz.godzina_od
      `;
    } else if (typ === 'sala') {
      query = `
        SELECT DISTINCT
          pz.id,
          pz.kurs_id as "kursId",
          pz.dzien_id as "dzienId",
          pz.godzina_od as "godzinaOd",
          pz.godzina_do as "godzinaDo",
          pz.sala_id as "salaId",
          pz.prowadzacy_id as "prowadzacyId",
          pz.wydzial_id as "wydzialId",
          pz.kierunek_id as "kierunekId",
          pz.specjalizacja_id as "specjalizacjaId",
          pz.grupa_oznaczenie as "grupaOznaczenie",
          pz.typ_zajec as "typZajec",
          pz.aktywny,
          pz.utworzono,
          k.id as k_id, k.nazwa as k_nazwa,
          d.id as d_id, d.nazwa as d_nazwa, 
          s.id as s_id, s.budynek as s_budynek, s.numer as s_numer,
          pr.prowadzacy_id as pr_id, u.imie as pr_imie, u.nazwisko as pr_nazwisko,
          w.id as w_id, w.nazwa as w_nazwa,
          ki.id as ki_id, ki.nazwa as ki_nazwa,
          sp.id as sp_id, sp.nazwa as sp_nazwa
        FROM public.plany_zajec pz
        LEFT JOIN public.kursy k ON pz.kurs_id = k.id
        LEFT JOIN public.dzien_tygodnia_slownik d ON pz.dzien_id = d.id
        LEFT JOIN public.sale s ON pz.sala_id = s.id
        LEFT JOIN public.prowadzacy pr ON pz.prowadzacy_id = pr.prowadzacy_id
        LEFT JOIN public.uzytkownicy u ON pr.prowadzacy_id = u.id
        LEFT JOIN public.wydzialy w ON pz.wydzial_id = w.id
        LEFT JOIN public.kierunki ki ON pz.kierunek_id = ki.id
        LEFT JOIN public.specjalizacje sp ON pz.specjalizacja_id = sp.id
        WHERE pz.aktywny = true AND (s.budynek ILIKE $1 OR s.numer ILIKE $1)
        ORDER BY d.id, pz.godzina_od
      `;
    } else {
      query = `
        SELECT DISTINCT
          pz.id,
          pz.kurs_id as "kursId",
          pz.dzien_id as "dzienId",
          pz.godzina_od as "godzinaOd",
          pz.godzina_do as "godzinaDo",
          pz.sala_id as "salaId",
          pz.prowadzacy_id as "prowadzacyId",
          pz.wydzial_id as "wydzialId",
          pz.kierunek_id as "kierunekId",
          pz.specjalizacja_id as "specjalizacjaId",
          pz.grupa_oznaczenie as "grupaOznaczenie",
          pz.typ_zajec as "typZajec",
          pz.aktywny,
          pz.utworzono,
          k.id as k_id, k.nazwa as k_nazwa,
          d.id as d_id, d.nazwa as d_nazwa, 
          s.id as s_id, s.budynek as s_budynek, s.numer as s_numer,
          pr.prowadzacy_id as pr_id, u.imie as pr_imie, u.nazwisko as pr_nazwisko,
          w.id as w_id, w.nazwa as w_nazwa,
          ki.id as ki_id, ki.nazwa as ki_nazwa,
          sp.id as sp_id, sp.nazwa as sp_nazwa
        FROM public.plany_zajec pz
        LEFT JOIN public.kursy k ON pz.kurs_id = k.id
        LEFT JOIN public.dzien_tygodnia_slownik d ON pz.dzien_id = d.id
        LEFT JOIN public.sale s ON pz.sala_id = s.id
        LEFT JOIN public.prowadzacy pr ON pz.prowadzacy_id = pr.prowadzacy_id
        LEFT JOIN public.uzytkownicy u ON pr.prowadzacy_id = u.id
        LEFT JOIN public.wydzialy w ON pz.wydzial_id = w.id
        LEFT JOIN public.kierunki ki ON pz.kierunek_id = ki.id
        LEFT JOIN public.specjalizacje sp ON pz.specjalizacja_id = sp.id
        WHERE pz.aktywny = true AND k.nazwa ILIKE $1
        ORDER BY d.id, pz.godzina_od
      `;
    }

    const result = await pool.query(query, [searchPattern]);
    return result.rows.map(row => ({
      id: row.id,
      kursId: row.kursId,
      dzienId: row.dzienId,
      godzinaOd: row.godzinaOd,
      godzinaDo: row.godzinaDo,
      salaId: row.salaId,
      prowadzacyId: row.prowadzacyId,
      wydzialId: row.wydzialId,
      kierunekId: row.kierunekId,
      specjalizacjaId: row.specjalizacjaId,
      grupaOznaczenie: row.grupaOznaczenie,
      typZajec: row.typZajec,
      aktywny: row.aktywny,
      utworzono: row.utworzono,
      kurs: row.k_id ? { id: row.k_id, nazwa: row.k_nazwa } : null,
      dzien: row.d_id ? { id: row.d_id, nazwa: row.d_nazwa } : null,
      sala: row.s_id ? { id: row.s_id, budynek: row.s_budynek, numer: row.s_numer } : null,
      prowadzacy: row.pr_id ? { id: row.pr_id, imie: row.pr_imie, nazwisko: row.pr_nazwisko } : null,
      wydzial: row.w_id ? { id: row.w_id, nazwa: row.w_nazwa } : null,
      kierunek: row.ki_id ? { id: row.ki_id, nazwa: row.ki_nazwa } : null,
      specjalizacja: row.sp_id ? { id: row.sp_id, nazwa: row.sp_nazwa } : null,
    }));
  },
};