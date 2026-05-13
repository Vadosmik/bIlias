import { Router, type Request, type Response } from 'express';
import { MaterialController } from '../controllers/materialController.js';

const materialRoutes = Router();
const materialController = new MaterialController();

materialRoutes.get('/courses/:kursId/materials', (req: Request, res: Response) => {
  materialController.getByKursId(req, res);
});

export { materialRoutes };