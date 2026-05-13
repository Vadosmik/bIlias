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

materialRoutes.post('/courses/:kursId/materials', upload.single('file'), (req: Request, res: Response) => {
  materialController.upload(req, res);
});

materialRoutes.get('/materials/:id/download', (req: Request, res: Response) => {
  materialController.download(req, res);
});

export { materialRoutes };