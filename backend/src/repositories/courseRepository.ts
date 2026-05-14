import pool from '../db/index.js';
import type { Course } from '../model/courseModel.js';

export const courseRepository = {
  async findAll(userId?: number): Promise<any[]> {
    const query = `
      SELECT k.*, 
             u.imie as p_imie, u.nazwisko as p_nazwisko,
             w.nazwa as department,
             (SELECT EXISTS (SELECT 1 FROM public.zapisy z WHERE z.kurs_id = k.id AND z.student_id = $1)) as joined,
             (SELECT COUNT(*) FROM public.materialy m WHERE m.kurs_id = k.id AND m.deleted_at IS NULL) as materials_count,
             (SELECT json_agg(json_build_object(
                'id', z.id,
                'name', z.tytul,
                'deadline', z.termin_oddania,
                'description', z.opis,
                'type', 'task'
             )) FROM public.zadania z WHERE z.kurs_id = k.id AND z.termin_oddania > NOW()) as pending_tasks
      FROM public.kursy k
      LEFT JOIN public.kurs_role kr ON k.id = kr.kurs_id AND kr.role_id = 4
      LEFT JOIN public.uzytkownicy u ON kr.user_id = u.id
      LEFT JOIN public.prowadzacy p ON u.id = p.prowadzacy_id
      LEFT JOIN public.wydzialy w ON p.wydzial_id = w.id
      ORDER BY k.nazwa
    `;
    const result = await pool.query(query, [userId || null]);
    
    return result.rows.map(row => {
      const initials = row.nazwa
        .split(' ')
        .filter((word: string) => word.length > 0)
        .map((word: string) => word[0].toUpperCase())
        .join('');
      
      return {
        id: row.id,
        name: row.nazwa,
        code: `${initials}${row.id}`,
        department: row.department || 'Brak wydziału',
        semester: row.semestr,
        ects: row.ects,
        description: row.opis,
        lecturers: row.p_imie ? [`${row.p_imie} ${row.p_nazwisko}`] : ['Prowadzący nieprzypisany'],
        joined: row.joined || false,
        materialsCount: parseInt(row.materials_count) || 0,
        pendingTasks: row.pending_tasks || []
      };
    });
  },

  async findById(id: number, userId?: number): Promise<any | null> {
    const query = `
      SELECT k.*, 
             u.imie as p_imie, u.nazwisko as p_nazwisko,
             w.nazwa as department,
             (SELECT EXISTS (SELECT 1 FROM public.zapisy z WHERE z.kurs_id = k.id AND z.student_id = $1)) as joined,
             (SELECT COUNT(*) FROM public.materialy m WHERE m.kurs_id = k.id AND m.deleted_at IS NULL) as materials_count
      FROM public.kursy k
      LEFT JOIN public.kurs_role kr ON k.id = kr.kurs_id AND kr.role_id = 4
      LEFT JOIN public.uzytkownicy u ON kr.user_id = u.id
      LEFT JOIN public.prowadzacy p ON u.id = p.prowadzacy_id
      LEFT JOIN public.wydzialy w ON p.wydzial_id = w.id
      WHERE k.id = $2
    `;
    const result = await pool.query(query, [userId || null, id]);
    const row = result.rows[0];
    if (!row) return null;

    const initials = row.nazwa
      .split(' ')
      .filter((word: string) => word.length > 0)
      .map((word: string) => word[0].toUpperCase())
      .join('');

    return {
      id: row.id,
      name: row.nazwa,
      code: `${initials}${row.id}`,
      department: row.department || 'Brak wydziału',
      semester: row.semestr,
      ects: row.ects,
      description: row.opis,
      lecturers: row.p_imie ? [`${row.p_imie} ${row.p_nazwisko}`] : ['Prowadzący nieprzypisany'],
      joined: row.joined || false,
      materialsCount: parseInt(row.materials_count) || 0
    };
  },

  async findByUserId(userId: number): Promise<any[]> {
    const query = `
      SELECT k.*, 
             u.imie as p_imie, u.nazwisko as p_nazwisko,
             w.nazwa as department,
             (SELECT COUNT(*) FROM public.materialy m WHERE m.kurs_id = k.id AND m.deleted_at IS NULL) as materials_count,
             (SELECT json_agg(json_build_object(
                'id', z.id,
                'name', z.tytul,
                'deadline', z.termin_oddania,
                'description', z.opis,
                'type', 'task'
             )) FROM public.zadania z WHERE z.kurs_id = k.id AND z.termin_oddania > NOW()) as pending_tasks
      FROM public.kursy k
      JOIN public.zapisy z ON k.id = z.kurs_id
      LEFT JOIN public.kurs_role kr ON k.id = kr.kurs_id AND kr.role_id = 4
      LEFT JOIN public.uzytkownicy u ON kr.user_id = u.id
      LEFT JOIN public.prowadzacy p ON u.id = p.prowadzacy_id
      LEFT JOIN public.wydzialy w ON p.wydzial_id = w.id
      WHERE z.student_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => {
      const initials = row.nazwa
        .split(' ')
        .filter((word: string) => word.length > 0)
        .map((word: string) => word[0].toUpperCase())
        .join('');

      return {
        id: row.id,
        name: row.nazwa,
        code: `${initials}${row.id}`,
        department: row.department || 'Brak wydziału',
        semester: row.semestr,
        ects: row.ects,
        description: row.opis,
        lecturers: row.p_imie ? [`${row.p_imie} ${row.p_nazwisko}`] : ['Prowadzący nieprzypisany'],
        joined: true,
        materialsCount: parseInt(row.materials_count) || 0,
        pendingTasks: row.pending_tasks || []
      };
    });
  },

  async isEnrolled(courseId: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM public.zapisy WHERE kurs_id = $1 AND student_id = $2',
      [courseId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async enroll(courseId: number, userId: number): Promise<void> {
    // Check for default status for enrollment (id 1 usually 'aktywny' based on init_db.sql)
    await pool.query(
      'INSERT INTO public.zapisy (kurs_id, student_id, status_id) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING',
      [courseId, userId]
    );
  }
};
