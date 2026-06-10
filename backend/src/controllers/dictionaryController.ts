import { type Request, type Response } from 'express';
import { dictionaryService } from '../services/dictionaryService.js';

export class DictionaryController {
  async getDepartments(req: Request, res: Response) {
    try {
      const data = await dictionaryService.getDepartments();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd pobierania wydziałów' });
    }
  }

  async getCourses(req: Request, res: Response) {
    try {
      const departmentId = Number(req.params.departmentId);
      const data = await dictionaryService.getCourses(departmentId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd pobierania kierunków' });
    }
  }

  async getSpecializations(req: Request, res: Response) {
    try {
      const courseId = Number(req.params.courseId);
      const data = await dictionaryService.getSpecializations(courseId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd pobierania specjalizacji' });
    }
  }

  async getRooms(req: Request, res: Response) {
    try {
      const data = await dictionaryService.getRooms();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd pobierania sal' });
    }
  }

  async getInstructors(req: Request, res: Response) {
    try {
      const data = await dictionaryService.getInstructors();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd pobierania prowadzących' });
    }
  }
}

export const dictionaryController = new DictionaryController();
