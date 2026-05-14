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
      const { folderId } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0 || !kursId) {
        res.status(400).json({ success: false, error: 'Brakujace pliki lub dane' });
        return;
      }

      const results = await Promise.all(
        files.map(file => 
          materialService.uploadMaterial({
            kursId,
            title: file.originalname,
            folderId: folderId ? Number(folderId) : undefined,
            file
          })
        )
      );

      res.status(201).json({
        success: true,
        message: `${files.length} material(ow) zostalo dodanych`,
        data: results
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ success: false, error: 'Blad podczas wysylania plikow' });
    }
  }

  public async createTask(req: Request, res: Response): Promise<void> {
    try {
      const kursId = Number(req.params.kursId);
      const { title, description, deadline, folderId } = req.body;

      if (!kursId || !title || !deadline) {
        res.status(400).json({ success: false, error: 'Brakujące dane zadania' });
        return;
      }

      const newTask = await materialService.createTask({
        kursId,
        title,
        description,
        deadline,
        folderId: folderId ? Number(folderId) : undefined
      });

      res.status(201).json({
        success: true,
        message: 'Zadanie zostało utworzone',
        data: newTask
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ success: false, error: 'Błąd podczas tworzenia zadania' });
    }
  }

  public async createFolder(req: Request, res: Response): Promise<void> {
    try {
      const kursId = Number(req.params.kursId);
      const { nazwa, parentId } = req.body;

      if (!kursId || !nazwa) {
        res.status(400).json({ success: false, error: 'Brakujące dane folderu' });
        return;
      }

      const newFolder = await materialService.createFolder({
        kursId,
        nazwa,
        parentId: parentId ? Number(parentId) : undefined
      });

      res.status(201).json({
        success: true,
        message: 'Folder został utworzony',
        data: newFolder
      });
    } catch (error) {
      console.error('Create folder error:', error);
      res.status(500).json({ success: false, error: 'Błąd podczas tworzenia folderu' });
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

  public async updateMaterial(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { name, folderId } = req.body;

      await materialService.updateMaterial(id, { 
        name, 
        folderId: folderId !== undefined ? (folderId ? Number(folderId) : null) : undefined 
      });

      res.status(200).json({ success: true, message: 'Materiał został zaktualizowany' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd podczas aktualizacji materiału' });
    }
  }

  public async deleteMaterial(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await materialService.deleteMaterial(id);
      res.status(200).json({ success: true, message: 'Materiał został usunięty' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd podczas usuwania materiału' });
    }
  }

  public async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { title, description, deadline, folderId } = req.body;

      await materialService.updateTask(id, { 
        title, 
        description, 
        deadline, 
        folderId: folderId !== undefined ? (folderId ? Number(folderId) : null) : undefined 
      });

      res.status(200).json({ success: true, message: 'Zadanie zostało zaktualizowane' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd podczas aktualizacji zadania' });
    }
  }

  public async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await materialService.deleteTask(id);
      res.status(200).json({ success: true, message: 'Zadanie zostało usunięte' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd podczas usuwania zadania' });
    }
  }

  public async updateFolder(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { nazwa } = req.body;

      if (!id || !nazwa) {
        res.status(400).json({ success: false, error: 'Brakujące dane folderu' });
        return;
      }

      await materialService.renameFolder(id, nazwa);

      res.status(200).json({ success: true, message: 'Folder został przemianowany' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Błąd podczas zmiany nazwy folderu' });
    }
  }

  public async deleteFolder(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      
      if (!id) {
        res.status(400).json({ success: false, error: 'Brakujące ID folderu' });
        return;
      }

      await materialService.deleteFolder(id);

      res.status(200).json({ success: true, message: 'Folder został usunięty' });
    } catch (error) {
      console.error('Detailed delete folder error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Błąd podczas usuwania folderu' 
      });
    }
  }
}
