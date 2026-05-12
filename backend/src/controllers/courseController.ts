import { type Request, type Response } from 'express';
import { CourseService } from '../services/courseService.js';

const courseService = new CourseService();

export class CourseController {
  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const courses = await courseService.getAllCourses(userId);

      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad pobierania kursow';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  public async getMyCourses(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.query.userId);
      if (!userId) {
        res.status(400).json({ success: false, error: 'Brak userId' });
        return;
      }

      const courses = await courseService.getUserCourses(userId);

      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad pobierania kursow';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const courseId = Number(req.params.id);
      const userId = req.query.userId ? Number(req.query.userId) : undefined;

      if (!courseId) {
        res.status(400).json({ success: false, error: 'Nieprawidlowe ID kursu' });
        return;
      }

      const course = await courseService.getCourseById(courseId, userId);

      if (!course) {
        res.status(404).json({ success: false, error: 'Kurs nie znaleziony' });
        return;
      }

      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad pobierania kursu';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  public async join(req: Request, res: Response): Promise<void> {
    try {
      const courseId = Number(req.params.id);
      const userId = Number(req.body.userId);

      if (!courseId || !userId) {
        res.status(400).json({ success: false, error: 'Brak wymaganych danych' });
        return;
      }

      const result = await courseService.joinCourse(courseId, userId);

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad zapisu na kurs';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
}