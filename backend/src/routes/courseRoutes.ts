import { Router, type Request, type Response } from 'express';
import { CourseController } from '../controllers/courseController.js';

const courseRoutes = Router();
const courseController = new CourseController();

courseRoutes.get('/', (req: Request, res: Response) => {
  courseController.getAll(req, res);
});

courseRoutes.get('/my', (req: Request, res: Response) => {
  courseController.getMy(req, res);
});

courseRoutes.get('/:id', (req: Request, res: Response) => {
  courseController.getById(req, res);
});

courseRoutes.post('/:id/join', (req: Request, res: Response) => {
  courseController.join(req, res);
});

courseRoutes.post('/:id/leave', (req: Request, res: Response) => {
  courseController.leave(req, res);
});

export { courseRoutes };
