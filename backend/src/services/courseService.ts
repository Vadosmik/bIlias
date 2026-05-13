import { z } from 'zod';
import { courseRepository } from '../repositories/courseRepository.js';
import { materialRepository } from '../repositories/materialRepository.js';

const joinCourseSchema = z.object({
  userId: z.number().int().positive(),
});

function generateCode(id: number, nazwa: string): string {
  const prefix = nazwa.replace(/\s+/g, '').substring(0, 2).toUpperCase();
  return `${id}${prefix}`;
}

export interface MaterialDTO {
  id: number;
  type: 'folder' | 'file' | 'task';
  name: string;
  format?: string;
  size?: string;
  deadline?: string;
  description?: string;
  children?: MaterialDTO[];
}

export interface CourseDTO {
  id: number;
  name: string;
  code: string;
  department: string;
  semester: number;
  lecturers: string[];
  joined: boolean;
  backgroundImage?: string;
  description?: string;
  materials?: MaterialDTO[];
}

export interface CourseDetailDTO extends CourseDTO {
  ects: number;
  yearStart: number;
  yearEnd: number;
}

export class CourseService {
  public async getAllCourses(userId?: number): Promise<CourseDTO[]> {
    const courses = await courseRepository.findAll();

    const coursesWithLecturers = await Promise.all(
      courses.map(async (course) => {
        const lecturers = await courseRepository.getCourseLecturers(course.id);
        const joined = userId
          ? await courseRepository.isUserEnrolled(course.id, userId)
          : false;

        return {
          id: course.id,
          name: course.nazwa,
          code: generateCode(course.id, course.nazwa),
          department: 'Wydział Elektryczny',
          semester: course.semestr,
          lecturers,
          joined,
        };
      })
    );

    return coursesWithLecturers;
  }

  public async getUserCourses(userId: number): Promise<CourseDTO[]> {
    const courses = await courseRepository.findUserCourses(userId);

    return Promise.all(
      courses.map(async (course) => {
        const lecturers = await courseRepository.getCourseLecturers(course.id);
        return {
          id: course.id,
          name: course.nazwa,
          code: generateCode(course.id, course.nazwa),
          department: 'Wydział Elektryczny',
          semester: course.semestr,
          lecturers,
          joined: true,
        };
      })
    );
  }

  public async getCourseById(id: number, userId?: number): Promise<CourseDetailDTO | null> {
    const course = await courseRepository.findById(id);
    if (!course) return null;

    const lecturers = await courseRepository.getCourseLecturers(id);
    const joined = userId ? await courseRepository.isUserEnrolled(id, userId) : false;
    const materials = await materialRepository.getByCourseId(id);

    return {
      id: course.id,
      name: course.nazwa,
      code: generateCode(course.id, course.nazwa),
      department: 'Wydział Elektryczny',
      semester: course.semestr,
      lecturers,
      joined,
      backgroundImage: course.zdjecie_w_tle || undefined,
      description: course.opis || undefined,
      ects: course.ects,
      yearStart: course.rok_start,
      yearEnd: course.rok_koniec,
      materials,
    };
  }

  public async joinCourse(kursId: number, userId: number): Promise<{ success: boolean; message: string }> {
    const parsed = joinCourseSchema.safeParse({ userId });
    if (!parsed.success) {
      throw new Error('Niepoprawne dane');
    }

    const existing = await courseRepository.isUserEnrolled(kursId, userId);
    if (existing) {
      return { success: false, message: 'Jestes juz zapisany na ten kurs' };
    }

    const course = await courseRepository.findById(kursId);
    if (!course) {
      return { success: false, message: 'Kurs nie istnieje' };
    }

    await courseRepository.enrollStudent(kursId, userId, 1);
    return { success: true, message: 'Pomyslnie zapisano na kurs' };
  }
}