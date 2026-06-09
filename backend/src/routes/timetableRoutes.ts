import { Router } from 'express';
import { timetableController } from '../controllers/timetableController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const timetableRoutes = Router();

timetableRoutes.get('/', (req, res) => {
  timetableController.getAll(req, res);
});

timetableRoutes.get('/grid', (req, res) => {
  timetableController.getGridData(req, res);
});

timetableRoutes.get('/search', (req, res) => {
  timetableController.search(req, res);
});

timetableRoutes.get('/:id', (req, res) => {
  timetableController.getById(req, res);
});

timetableRoutes.post('/', authenticate, requireRoles('planista'), (req, res) => {
  timetableController.create(req, res);
});

timetableRoutes.put('/:id', authenticate, requireRoles('planista'), (req, res) => {
  timetableController.update(req, res);
});

timetableRoutes.delete('/:id', authenticate, requireRoles('planista'), (req, res) => {
  timetableController.delete(req, res);
});

export { timetableRoutes };