import { type Request, type Response } from 'express';
import { SubmissionService } from '../services/submissionService.js';
import { submissionRepository } from '../repositories/submissionRepository.js';

const submissionService = new SubmissionService();

export class SubmissionController {
  public async submit(req: Request, res: Response): Promise<void> {
    try {
      const zadanieId = Number(req.params.taskId);
      const studentId = Number(req.body.studentId); // In real app, get from JWT
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0 || !zadanieId || !studentId) {
        res.status(400).json({ success: false, error: 'Brakujące pliki lub dane studenta' });
        return;
      }

      const result = await submissionService.submitTask({
        studentId,
        zadanieId,
        files
      });

      res.status(201).json({
        success: true,
        message: 'Zadanie zostało przesłane pomyślnie',
        data: result
      });
    } catch (error) {
      console.error('Submit task error:', error);
      res.status(500).json({ success: false, error: 'Błąd podczas przesyłania zadania' });
    }
  }

  public async getMyFiles(req: Request, res: Response): Promise<void> {
    try {
      const zadanieId = Number(req.params.taskId);
      const studentId = Number(req.query.studentId);

      if (!zadanieId || !studentId) {
        res.status(400).json({ success: false, error: 'Brakujące parametry' });
        return;
      }

      const submission = await submissionRepository.findByStudentAndTask(studentId, zadanieId);

      if (!submission) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const files = await submissionRepository.findFilesBySubmissionId(submission.id);

      res.status(200).json({ success: true, data: files });
    } catch (error) {
      console.error('Get my files error:', error);
      res.status(500).json({ success: false, error: 'Błąd podczas pobierania plików' });
    }
  }

  public async getTaskSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const taskId = Number(req.params.taskId);
      if (!taskId) {
        res.status(400).json({ success: false, error: 'Brakujące ID zadania' });
        return;
      }

      const submissions = await submissionRepository.findAllByTaskId(taskId);

      // For each submission, we need to attach its files
      const result = await Promise.all(submissions.map(async (sub) => {
        const files = await submissionRepository.findFilesBySubmissionId(sub.id);
        return {
          ...sub,
          files: files.map(f => f.name)
        };
      }));

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Get task submissions error:', error);
      res.status(500).json({ success: false, error: 'Błąd podczas pobierania przesłań' });
    }
  }

  public async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const fileId = Number(req.params.fileId);
      await submissionService.deleteFile(fileId);
      res.status(200).json({ success: true, message: 'Plik został usunięty' });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ success: false, error: 'Błąd podczas usuwania pliku' });
    }
  }

  public async downloadZip(req: Request, res: Response): Promise<void> {
    try {
      const submissionId = Number(req.params.id);
      
      const zipBuffer = await submissionService.generateSubmissionZip(submissionId);

      res.setHeader('Content-Type', 'application/zip');
      // Filename will be set by the frontend based on student name, 
      // but we can also set it here if we had the name.
      res.setHeader('Content-Disposition', 'attachment; filename=submission.zip');
      res.send(zipBuffer);
    } catch (error) {
      console.error('Download ZIP error:', error);
      res.status(404).json({ success: false, error: 'Nie udało się wygenerować archiwum ZIP' });
    }
  }
}
