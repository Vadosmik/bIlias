import { type Request, type Response } from 'express';
import { MaterialService } from '../services/materialService.js';

const materialService = new MaterialService();

export class MaterialController {
  public async getByKursId(req: Request, res: Response): Promise<void> {
    try {
      const kursId = Number(req.params.kursId);

      if (!kursId) {
        res.status(400).json({ success: false, error: 'Nieprawidlowe ID kursu' });
        return;
      }

      const materials = await materialService.getMaterialsForCourse(kursId);

      res.status(200).json({
        success: true,
        data: materials,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blad pobierania materialow';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
}