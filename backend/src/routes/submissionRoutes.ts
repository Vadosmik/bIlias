import { Router, type Request, type Response } from 'express';
import { SubmissionController } from '../controllers/submissionController.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
const submissionRoutes = Router();
const submissionController = new SubmissionController();

submissionRoutes.get('/:id/download-zip', (req: Request, res: Response) => {
  submissionController.downloadZip(req, res);
});

submissionRoutes.get('/:taskId/my-files', (req: Request, res: Response) => {
  submissionController.getMyFiles(req, res);
});

submissionRoutes.get('/task/:taskId', (req: Request, res: Response) => {
  submissionController.getTaskSubmissions(req, res);
});

submissionRoutes.delete('/files/:fileId', (req: Request, res: Response) => {
  submissionController.deleteFile(req, res);
});

submissionRoutes.post('/:taskId/submit', upload.array('files'), (req: Request, res: Response) => {
  submissionController.submit(req, res);
});

export { submissionRoutes };
