import { Router, type Request, type Response } from 'express';
import { MaterialController } from '../controllers/materialController.js';

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
const materialRoutes = Router();
const materialController = new MaterialController();

materialRoutes.get('/courses/:kursId/materials', (req: Request, res: Response) => {
  materialController.getByKursId(req, res);
});

materialRoutes.post('/courses/:kursId/materials', upload.array('files'), (req: Request, res: Response) => {
  materialController.upload(req, res);
});

materialRoutes.post('/courses/:kursId/tasks', (req: Request, res: Response) => {
  materialController.createTask(req, res);
});

materialRoutes.get('/materials/:id/download', (req: Request, res: Response) => {
  materialController.download(req, res);
});

// New routes for material/task management
materialRoutes.patch('/materials/:id', (req: Request, res: Response) => {
  materialController.updateMaterial(req, res);
});

materialRoutes.delete('/materials/:id', (req: Request, res: Response) => {
  materialController.deleteMaterial(req, res);
});

materialRoutes.patch('/tasks/:id', (req: Request, res: Response) => {
  materialController.updateTask(req, res);
});

materialRoutes.delete('/tasks/:id', (req: Request, res: Response) => {
  materialController.deleteTask(req, res);
});

materialRoutes.patch('/courses/:kursId/folders', (req: Request, res: Response) => {
  materialController.renameFolder(req, res);
});

materialRoutes.delete('/courses/:kursId/folders', (req: Request, res: Response) => {
  materialController.deleteFolder(req, res);
});

export { materialRoutes };