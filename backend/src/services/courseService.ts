import { courseRepository } from '../repositories/courseRepository.js';
import type { Course } from '../model/courseModel.js';

export class CourseService {
  public async getAllCourses(userId?: number): Promise<any[]> {
    return await courseRepository.findAll(userId);
  }

  public async getUserCourses(userId: number): Promise<any[]> {
    return await courseRepository.findByUserId(userId);
  }

  public async getCourseById(id: number, userId?: number): Promise<any | null> {
    return await courseRepository.findById(id, userId);
  }

  public async joinCourse(courseId: number, userId: number): Promise<void> {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Kurs nie istnieje');
    }
    
    const alreadyJoined = await courseRepository.isEnrolled(courseId, userId);
    if (alreadyJoined) {
      throw new Error('Już jesteś zapisany na ten kurs');
    }

    await courseRepository.enroll(courseId, userId);
  }

  public async leaveCourse(courseId: number, userId: number): Promise<void> {
    const isEnrolled = await courseRepository.isEnrolled(courseId, userId);
    if (!isEnrolled) {
      throw new Error('Nie jesteś zapisany na ten kurs');
    }

    await courseRepository.unenroll(courseId, userId);
  }
}
