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

  public async upload(req: Request, res: Response): Promise<void> {
    try {
      const kursId = Number(req.params.kursId);
      const { title, folderName } = req.body;
      const file = req.file; // Plik dostarczony przez multer

      if (!file || !kursId || !title) {
        res.status(400).json({ success: false, error: 'Brakujacy plik lub dane' });
        return;
      }

      const newMaterial = await materialService.uploadMaterial({
        kursId,
        title,
        folderName,
        file
      });

      res.status(201).json({
        success: true,
        message: 'Material zostal dodany',
        data: newMaterial
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Blad podczas wysylania pliku' });
    }
  }

  public async download(req: Request, res: Response): Promise<void> {
    try {
      const materialId = Number(req.params.id);
      
      const fileInfo = await materialService.getMaterialForDownload(materialId);

      res.download(fileInfo.path, fileInfo.originalName);
    } catch (error) {
      res.status(404).json({ success: false, error: 'Nie udalo sie pobrac pliku' });
    }
  }
}