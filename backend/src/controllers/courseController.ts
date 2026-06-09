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
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Błąd podczas pobierania kursów',
      });
    }
  }

  public async getMy(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.query.userId);
      if (!userId) {
        res.status(400).json({ success: false, error: 'Brak ID użytkownika' });
        return;
      }

      const courses = await courseService.getUserCourses(userId);
      res.status(200).json({
        success: true,
        data: courses,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Błąd podczas pobierania Twoich kursów',
      });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const userId = req.query.userId ? Number(req.query.userId) : undefined;

      if (!id) {
        res
          .status(400)
          .json({ success: false, error: 'Nieprawidłowe ID kursu' });
        return;
      }

      const course = await courseService.getCourseById(id, userId);
      if (!course) {
        res
          .status(404)
          .json({ success: false, error: 'Kurs nie został znaleziony' });
        return;
      }

      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Błąd podczas pobierania szczegółów kursu',
      });
    }
  }

  public async join(req: Request, res: Response): Promise<void> {
    try {
      const courseId = Number(req.params.id);
      const userId = Number(req.body.userId);

      if (!courseId || !userId) {
        res
          .status(400)
          .json({ success: false, error: 'Brakujące dane zapisu' });
        return;
      }

      await courseService.joinCourse(courseId, userId);
      res.status(200).json({
        success: true,
        message: 'Zostałeś zapisany na kurs',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Błąd podczas zapisywania na kurs',
      });
    }
  }

  public async leave(req: Request, res: Response): Promise<void> {
    try {
      const courseId = Number(req.params.id);
      const userId = Number(req.body.userId);

      if (!courseId || !userId) {
        res
          .status(400)
          .json({ success: false, error: 'Brakujące dane wypisu' });
        return;
      }

      await courseService.leaveCourse(courseId, userId);
      res.status(200).json({
        success: true,
        message: 'Zostałeś wypisany z kursu',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Błąd podczas wypisywania z kursu',
      });
    }
  }
}
